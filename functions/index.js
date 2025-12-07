const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');

// Inicializar Firebase Admin
admin.initializeApp();

// Configurar MailerSend
const mailerSend = new MailerSend({
  apiKey: functions.config().mailersend?.api_key || process.env.MAILERSEND_API_KEY,
});

// Importar funciones de eventos
const eventFunctions = require('./events');

// Función para agregar participante
exports.addParticipant = functions.https.onCall(async (data, context) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario debe estar autenticado');
  }

  const { eventId, name, email } = data;

  // Validar datos
  if (!eventId || !name || !email) {
    throw new functions.https.HttpsError('invalid-argument', 'Faltan datos requeridos');
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new functions.https.HttpsError('invalid-argument', 'Formato de email inválido');
  }

  try {
    // Verificar que el usuario es el organizador del evento
    const eventDoc = await admin.firestore().collection('events').doc(eventId).get();
    
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Evento no encontrado');
    }

    if (eventDoc.data().organizerEmail !== context.auth.token.email) {
      throw new functions.https.HttpsError('permission-denied', 'No tienes permisos para este evento');
    }

    // Verificar duplicados
    const participantsQuery = await admin.firestore()
      .collection('events')
      .doc(eventId)
      .collection('participants')
      .where('email', '==', email.toLowerCase())
      .get();

    if (!participantsQuery.empty) {
      throw new functions.https.HttpsError('already-exists', 'Este email ya está registrado');
    }

    // Agregar participante
    const participantRef = await admin.firestore()
      .collection('events')
      .doc(eventId)
      .collection('participants')
      .add({
        name: name.trim(),
        email: email.toLowerCase(),
        createdAt: new Date().toISOString()
      });

    return { 
      success: true, 
      participantId: participantRef.id,
      message: 'Participante agregado exitosamente'
    };
  } catch (error) {
    console.error('Error al agregar participante:', error);
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});

// Función para obtener participantes
exports.getParticipants = functions.https.onCall(async (data, context) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario debe estar autenticado');
  }

  const { eventId } = data;

  if (!eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'ID del evento es requerido');
  }

  try {
    // Verificar permisos
    const eventDoc = await admin.firestore().collection('events').doc(eventId).get();
    
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Evento no encontrado');
    }

    if (eventDoc.data().organizerEmail !== context.auth.token.email) {
      throw new functions.https.HttpsError('permission-denied', 'No tienes permisos para este evento');
    }

    // Obtener participantes
    const participantsSnapshot = await admin.firestore()
      .collection('events')
      .doc(eventId)
      .collection('participants')
      .orderBy('createdAt')
      .get();

    const participants = [];
    participantsSnapshot.forEach(doc => {
      participants.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { 
      success: true,
      participants 
    };
  } catch (error) {
    console.error('Error al obtener participantes:', error);
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});

// Función para eliminar participante
exports.removeParticipant = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario debe estar autenticado');
  }

  const { eventId, participantId } = data;

  if (!eventId || !participantId) {
    throw new functions.https.HttpsError('invalid-argument', 'Faltan datos requeridos');
  }

  try {
    // Verificar permisos
    const eventDoc = await admin.firestore().collection('events').doc(eventId).get();
    
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Evento no encontrado');
    }

    if (eventDoc.data().organizerEmail !== context.auth.token.email) {
      throw new functions.https.HttpsError('permission-denied', 'No tienes permisos para este evento');
    }

    // Eliminar participante
    await admin.firestore()
      .collection('events')
      .doc(eventId)
      .collection('participants')
      .doc(participantId)
      .delete();

    return { success: true, message: 'Participante eliminado exitosamente' };
  } catch (error) {
    console.error('Error al eliminar participante:', error);
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});

// Función para ejecutar sorteo
exports.executeRaffle = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario debe estar autenticado');
  }

  const { eventId } = data;

  if (!eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'ID del evento es requerido');
  }

  try {
    // Verificar permisos
    const eventDoc = await admin.firestore().collection('events').doc(eventId).get();
    
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Evento no encontrado');
    }

    if (eventDoc.data().organizerEmail !== context.auth.token.email) {
      throw new functions.https.HttpsError('permission-denied', 'No tienes permisos para este evento');
    }

    // Obtener participantes
    const participantsSnapshot = await admin.firestore()
      .collection('events')
      .doc(eventId)
      .collection('participants')
      .get();

    if (participantsSnapshot.empty || participantsSnapshot.size < 2) {
      throw new functions.https.HttpsError('failed-precondition', 'Se necesitan al menos 2 participantes para el sorteo');
    }

    const participants = [];
    participantsSnapshot.forEach(doc => {
      participants.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Algoritmo de sorteo
    const shuffled = [...participants];
    
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const assignments = [];
    for (let i = 0; i < shuffled.length; i++) {
      const giver = shuffled[i];
      const receiver = shuffled[(i + 1) % shuffled.length];
      
      assignments.push({
        giverId: giver.id,
        giverName: giver.name,
        giverEmail: giver.email,
        receiverId: receiver.id,
        receiverName: receiver.name,
        createdAt: new Date().toISOString()
      });
    }

    // Guardar asignaciones en batch
    const batch = admin.firestore().batch();
    
    // Limpiar asignaciones anteriores
    const oldAssignmentsSnapshot = await admin.firestore()
      .collection('events')
      .doc(eventId)
      .collection('assignments')
      .get();
    
    oldAssignmentsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Crear nuevas asignaciones
    assignments.forEach(assignment => {
      const assignmentRef = admin.firestore()
        .collection('events')
        .doc(eventId)
        .collection('assignments')
        .doc();
      batch.set(assignmentRef, assignment);
    });

    // Actualizar estado del evento
    batch.update(admin.firestore().collection('events').doc(eventId), {
      status: 'sorted',
      lastRaffleAt: new Date().toISOString()
    });

    await batch.commit();

    return { 
      success: true, 
      message: 'Sorteo ejecutado exitosamente',
      assignmentsCount: assignments.length
    };
  } catch (error) {
    console.error('Error al ejecutar sorteo:', error);
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});

// Función para obtener asignaciones (solo para organizador)
exports.getAssignments = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario debe estar autenticado');
  }

  const { eventId } = data;

  if (!eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'ID del evento es requerido');
  }

  try {
    // Verificar permisos
    const eventDoc = await admin.firestore().collection('events').doc(eventId).get();
    
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Evento no encontrado');
    }

    if (eventDoc.data().organizerEmail !== context.auth.token.email) {
      throw new functions.https.HttpsError('permission-denied', 'No tienes permisos para este evento');
    }

    // Obtener asignaciones
    const assignmentsSnapshot = await admin.firestore()
      .collection('events')
      .doc(eventId)
      .collection('assignments')
      .get();

    const assignments = [];
    assignmentsSnapshot.forEach(doc => {
      assignments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { 
      success: true,
      assignments 
    };
  } catch (error) {
    console.error('Error al obtener asignaciones:', error);
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});

// Exportar funciones de eventos
exports.createEvent = eventFunctions.createEvent;
exports.getUserEvents = eventFunctions.getUserEvents;
exports.getEvent = eventFunctions.getEvent;
exports.updateEvent = eventFunctions.updateEvent;
exports.sendSecretSantaEmails = eventFunctions.sendSecretSantaEmails;
exports.getEmailLogs = eventFunctions.getEmailLogs;
exports.mailersendWebhook = eventFunctions.mailersendWebhook;