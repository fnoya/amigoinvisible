const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Load environment variables from .env file (for local development)
// Must be loaded before any other module that uses env vars
try {
  const path = require('path');
  require('dotenv').config({ path: path.join(__dirname, '.env') });
  console.log('📧 MailerSend API Key loaded in index.js:', process.env.MAILERSEND_API_KEY ? 'YES' : 'NO');
} catch (error) {
  console.warn('Could not load .env file in index.js:', error.message);
}

const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');

// Inicializar Firebase Admin
admin.initializeApp();

// Configurar MailerSend
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || functions.config().mailersend?.api_key || 'demo_key',
});

// Email por defecto para envíos (debe ser un dominio verificado en MailerSend)
const DEFAULT_FROM_EMAIL = 'noreply@mail.invitacion15.fnoya.net';
const DEFAULT_FROM_NAME = 'Amigo Invisible';

// Función mock para demo en emuladores
const sendEmailDemo = async (emailParams) => {
  console.log('📧 DEMO MODE: Email que se enviaría:', {
    from: emailParams._from,
    to: emailParams._to,
    subject: emailParams._subject,
    html: emailParams._html?.substring(0, 100) + '...'
  });
  
  // Simular respuesta de MailerSend
  return {
    headers: {
      'x-message-id': 'demo_message_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11)
    }
  };
};

// Importar funciones de eventos
const eventFunctions = require('./events');

// Función para escapar HTML y prevenir XSS
const escapeHtml = (text) => {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

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

// Función para actualizar email de participante
exports.updateParticipant = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario debe estar autenticado');
  }

  const { eventId, participantId, newEmail } = data;

  if (!eventId || !participantId || !newEmail) {
    throw new functions.https.HttpsError('invalid-argument', 'Faltan datos requeridos');
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    throw new functions.https.HttpsError('invalid-argument', 'Formato de email inválido');
  }

  try {
    // Verificar permisos
    const eventDoc = await admin.firestore().collection('events').doc(eventId).get();
    
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Evento no encontrado');
    }

    const eventData = eventDoc.data();
    if (eventData.organizerEmail !== context.auth.token.email) {
      throw new functions.https.HttpsError('permission-denied', 'No tienes permisos para este evento');
    }

    // Obtener datos actuales del participante
    const participantDoc = await admin.firestore()
      .collection('events')
      .doc(eventId)
      .collection('participants')
      .doc(participantId)
      .get();

    if (!participantDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Participante no encontrado');
    }

    const participantData = participantDoc.data();
    const oldEmail = participantData.email;

    // Verificar que el nuevo email no esté ya en uso por otro participante
    if (oldEmail.toLowerCase() !== newEmail.toLowerCase()) {
      const duplicateQuery = await admin.firestore()
        .collection('events')
        .doc(eventId)
        .collection('participants')
        .where('email', '==', newEmail.toLowerCase())
        .get();

      if (!duplicateQuery.empty) {
        throw new functions.https.HttpsError('already-exists', 'Este email ya está registrado para otro participante');
      }
    }

    // Actualizar email del participante
    await admin.firestore()
      .collection('events')
      .doc(eventId)
      .collection('participants')
      .doc(participantId)
      .update({
        email: newEmail.toLowerCase(),
        updatedAt: new Date().toISOString()
      });

    // Si hay asignaciones, actualizar las referencias de email
    const assignmentsSnapshot = await admin.firestore()
      .collection('events')
      .doc(eventId)
      .collection('assignments')
      .get();

    if (!assignmentsSnapshot.empty) {
      const batch = admin.firestore().batch();
      
      assignmentsSnapshot.forEach(doc => {
        const assignment = doc.data();
        const updates = {};
        
        // Case-insensitive comparison
        if (assignment.giverEmail.toLowerCase() === oldEmail.toLowerCase()) {
          updates.giverEmail = newEmail.toLowerCase();
        }
        
        if (Object.keys(updates).length > 0) {
          batch.update(doc.ref, updates);
        }
      });

      await batch.commit();
    }

    // Si ya se enviaron emails, reenviar al nuevo email
    let emailResent = false;
    if (eventData.status === 'emails_sent' || eventData.status === 'sorted') {
      // Buscar la asignación del participante
      const assignmentQuery = await admin.firestore()
        .collection('events')
        .doc(eventId)
        .collection('assignments')
        .where('giverEmail', '==', newEmail.toLowerCase())
        .get();

      if (!assignmentQuery.empty) {
        const assignment = assignmentQuery.docs[0].data();
        
        try {
          // Configurar sender y recipients
          const sentFrom = new Sender(DEFAULT_FROM_EMAIL, DEFAULT_FROM_NAME);
          const recipients = [new Recipient(newEmail.toLowerCase(), participantData.name)];

          // Escapar datos para prevenir XSS en emails
          const safeEventName = escapeHtml(eventData.name);
          const safeParticipantName = escapeHtml(participantData.name);
          const safeReceiverName = escapeHtml(assignment.receiverName);
          const safeDate = escapeHtml(eventData.date);
          const safeSuggestedAmount = escapeHtml(eventData.suggestedAmount);
          const safeCustomMessage = escapeHtml(eventData.customMessage);

          const emailParams = new EmailParams()
            .setFrom(sentFrom)
            .setTo(recipients)
            .setReplyTo(sentFrom)
            .setSubject(`🎁 Tu amigo invisible para ${safeEventName}`)
            .setHtml(`
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #d73527; text-align: center;">🎁 Tu amigo invisible para ${safeEventName}</h2>
                <p style="font-size: 18px;">¡Hola ${safeParticipantName}!</p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="font-size: 16px; margin: 0;">Te ha tocado regalarle a:</p>
                  <p style="font-size: 24px; font-weight: bold; color: #d73527; margin: 10px 0;">${safeReceiverName}</p>
                </div>
                ${eventData.date ? `<p><strong>📅 Fecha del intercambio:</strong> ${safeDate}</p>` : ''}
                ${eventData.suggestedAmount ? `<p><strong>💰 Monto sugerido:</strong> ${safeSuggestedAmount}</p>` : ''}
                ${eventData.customMessage ? `<div style="background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 15px 0;"><p><strong>Mensaje del organizador:</strong></p><p>${safeCustomMessage}</p></div>` : ''}
                <p style="margin-top: 30px;">¡Que disfrutes del intercambio! 🎄</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #666;">Este email fue enviado automáticamente por el sistema Amigo Invisible.</p>
              </div>
            `)
            .setText(`
              Tu amigo invisible para ${safeEventName}
              
              ¡Hola ${safeParticipantName}!
              
              Te ha tocado regalarle a: ${safeReceiverName}
              
              ${eventData.date ? `Fecha del intercambio: ${safeDate}` : ''}
              ${eventData.suggestedAmount ? `Monto sugerido: ${safeSuggestedAmount}` : ''}
              ${eventData.customMessage ? `Mensaje del organizador: ${safeCustomMessage}` : ''}
              
              ¡Que disfrutes del intercambio!
            `);

          // Verificar si estamos en modo demo
          const apiKey = process.env.MAILERSEND_API_KEY || functions.config().mailersend?.api_key || 'demo_key';
          const isDemoMode = apiKey === 'demo_key' || 
                            apiKey.startsWith('demo_') ||
                            !apiKey ||
                            apiKey.length < 10;
          
          let response;
          if (isDemoMode) {
            response = await sendEmailDemo(emailParams);
            console.log('📧 DEMO: Email simulado reenviado a', newEmail);
          } else {
            response = await mailerSend.email.send(emailParams);
            console.log('📧 PRODUCTION: Email REAL reenviado a', newEmail);
          }
          
          // Registrar el reenvío en los logs
          await admin.firestore()
            .collection('events')
            .doc(eventId)
            .collection('emailLogs')
            .add({
              participantId: participantId,
              participantName: participantData.name,
              participantEmail: newEmail.toLowerCase(),
              messageId: response.headers['x-message-id'],
              status: 'sent',
              sentAt: new Date(),
              assignmentId: assignmentQuery.docs[0].id,
              resent: true,
              reason: 'email_updated'
            });

          emailResent = true;
        } catch (emailError) {
          console.error(`Error reenviando email a ${newEmail}:`, emailError);
          
          // Registrar el error
          await admin.firestore()
            .collection('events')
            .doc(eventId)
            .collection('emailLogs')
            .add({
              participantId: participantId,
              participantName: participantData.name,
              participantEmail: newEmail.toLowerCase(),
              status: 'failed',
              error: emailError.message,
              sentAt: new Date(),
              resent: true,
              reason: 'email_updated'
            });
        }
      }
    }

    return { 
      success: true, 
      message: 'Email del participante actualizado exitosamente',
      emailResent: emailResent
    };
  } catch (error) {
    console.error('Error al actualizar participante:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
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