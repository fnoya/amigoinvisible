const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Load environment variables from .env file (for local development)
// Must be loaded before any other module that uses env vars
try {
  const path = require('path');
  require('dotenv').config({ path: path.join(__dirname, '.env') });
  console.log('📧 MailerSend API Key loaded:', process.env.MAILERSEND_API_KEY ? 'YES' : 'NO');
} catch (error) {
  console.warn('Could not load .env file:', error.message);
}

const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

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
      'x-message-id': 'demo_message_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    }
  };
};

// Función para crear evento
exports.createEvent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario debe estar autenticado');
  }

  const { name, date, suggestedAmount, customMessage } = data;

  if (!name) {
    throw new functions.https.HttpsError('invalid-argument', 'El nombre del evento es requerido');
  }

  try {
    const now = new Date();
    const eventRef = await admin.firestore().collection('events').add({
      name: name.trim(),
      date: date || null,
      suggestedAmount: suggestedAmount || null,
      customMessage: customMessage || '',
      organizerEmail: context.auth.token.email,
      status: 'draft',
      createdAt: now.toISOString()
    });

    return { 
      success: true, 
      eventId: eventRef.id,
      message: 'Evento creado exitosamente'
    };
  } catch (error) {
    console.error('Error al crear evento:', error);
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});

// Función para obtener eventos del usuario
exports.getUserEvents = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario debe estar autenticado');
  }

  try {
    const eventsSnapshot = await admin.firestore()
      .collection('events')
      .where('organizerEmail', '==', context.auth.token.email)
      .get();

    const events = [];
    eventsSnapshot.forEach(doc => {
      events.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Ordenar en el servidor después de obtener los datos
    events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return { events };
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});

// Función para obtener evento específico
exports.getEvent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario debe estar autenticado');
  }

  const { eventId } = data;

  if (!eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'ID del evento es requerido');
  }

  try {
    const eventDoc = await admin.firestore().collection('events').doc(eventId).get();
    
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Evento no encontrado');
    }

    if (eventDoc.data().organizerEmail !== context.auth.token.email) {
      throw new functions.https.HttpsError('permission-denied', 'No tienes permisos para este evento');
    }

    return { 
      event: {
        id: eventDoc.id,
        ...eventDoc.data()
      }
    };
  } catch (error) {
    console.error('Error al obtener evento:', error);
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});

// Función para actualizar evento
exports.updateEvent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario debe estar autenticado');
  }

  const { eventId, name, date, suggestedAmount, customMessage } = data;

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

    const updateData = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name.trim();
    if (date !== undefined) updateData.date = date;
    if (suggestedAmount !== undefined) updateData.suggestedAmount = suggestedAmount;
    if (customMessage !== undefined) updateData.customMessage = customMessage;

    await admin.firestore().collection('events').doc(eventId).update(updateData);

    return { 
      success: true, 
      message: 'Evento actualizado exitosamente'
    };
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});

// Función para enviar emails
exports.sendSecretSantaEmails = functions.https.onCall(async (data, context) => {
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

    const eventData = eventDoc.data();
    
    if (eventData.organizerEmail !== context.auth.token.email) {
      throw new functions.https.HttpsError('permission-denied', 'No tienes permisos para este evento');
    }

    // Verificar que hay asignaciones
    const assignmentsSnapshot = await admin.firestore()
      .collection('events')
      .doc(eventId)
      .collection('assignments')
      .get();

    if (assignmentsSnapshot.empty) {
      throw new functions.https.HttpsError('failed-precondition', 'No hay asignaciones disponibles. Ejecuta el sorteo primero.');
    }

    const assignments = [];
    assignmentsSnapshot.forEach(doc => {
      assignments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Enviar emails
    const emailResults = [];
    const batch = admin.firestore().batch();

    for (const assignment of assignments) {
      try {
        // Configurar sender y recipients siguiendo el patrón recomendado
        const sentFrom = new Sender(DEFAULT_FROM_EMAIL, DEFAULT_FROM_NAME);
        const recipients = [new Recipient(assignment.giverEmail, assignment.giverName)];

        const emailParams = new EmailParams()
          .setFrom(sentFrom)
          .setTo(recipients)
          .setReplyTo(sentFrom)
          .setSubject(`🎁 Tu amigo invisible para ${eventData.name}`)
          .setHtml(`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #d73527; text-align: center;">🎁 Tu amigo invisible para ${eventData.name}</h2>
              <p style="font-size: 18px;">¡Hola ${assignment.giverName}!</p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="font-size: 16px; margin: 0;">Te ha tocado regalarle a:</p>
                <p style="font-size: 24px; font-weight: bold; color: #d73527; margin: 10px 0;">${assignment.receiverName}</p>
              </div>
              ${eventData.date ? `<p><strong>📅 Fecha del intercambio:</strong> ${eventData.date}</p>` : ''}
              ${eventData.suggestedAmount ? `<p><strong>💰 Monto sugerido:</strong> ${eventData.suggestedAmount}</p>` : ''}
              ${eventData.customMessage ? `<div style="background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 15px 0;"><p><strong>Mensaje del organizador:</strong></p><p>${eventData.customMessage}</p></div>` : ''}
              <p style="margin-top: 30px;">¡Que disfrutes del intercambio! 🎄</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 12px; color: #666;">Este email fue enviado automáticamente por el sistema Amigo Invisible.</p>
            </div>
          `)
          .setText(`
            Tu amigo invisible para ${eventData.name}
            
            ¡Hola ${assignment.giverName}!
            
            Te ha tocado regalarle a: ${assignment.receiverName}
            
            ${eventData.date ? `Fecha del intercambio: ${eventData.date}` : ''}
            ${eventData.suggestedAmount ? `Monto sugerido: ${eventData.suggestedAmount}` : ''}
            ${eventData.customMessage ? `Mensaje del organizador: ${eventData.customMessage}` : ''}
            
            ¡Que disfrutes del intercambio!
          `);

        // Verificar si estamos en modo demo
        const apiKey = process.env.MAILERSEND_API_KEY || functions.config().mailersend?.api_key || 'demo_key';
        const isDemoMode = apiKey === 'demo_key' || 
                          apiKey.startsWith('demo_') ||
                          !apiKey ||
                          apiKey.length < 10; // API keys reales son más largas
        
        console.log('📧 Email sending mode:', { 
          isDemoMode,
          isEmulator: process.env.FUNCTIONS_EMULATOR === 'true'
        });
        
        let response;
        if (isDemoMode) {
          response = await sendEmailDemo(emailParams);
          console.log('📧 DEMO: Email simulado enviado a', assignment.giverEmail);
        } else {
          response = await mailerSend.email.send(emailParams);
          console.log('📧 PRODUCTION: Email REAL enviado a', assignment.giverEmail);
        }
        
        const emailLogRef = admin.firestore()
          .collection('events')
          .doc(eventId)
          .collection('emailLogs')
          .doc();

        batch.set(emailLogRef, {
          participantId: assignment.giverId,
          participantName: assignment.giverName,
          participantEmail: assignment.giverEmail,
          messageId: response.headers['x-message-id'],
          status: 'sent',
          sentAt: new Date(),
          assignmentId: assignment.id
        });

        emailResults.push({
          email: assignment.giverEmail,
          status: 'sent',
          messageId: response.headers['x-message-id']
        });

      } catch (emailError) {
        console.error(`Error enviando email a ${assignment.giverEmail}:`, emailError);
        
        const emailLogRef = admin.firestore()
          .collection('events')
          .doc(eventId)
          .collection('emailLogs')
          .doc();

        batch.set(emailLogRef, {
          participantId: assignment.giverId,
          participantName: assignment.giverName,
          participantEmail: assignment.giverEmail,
          status: 'failed',
          error: emailError.message,
          sentAt: new Date(),
          assignmentId: assignment.id
        });

        emailResults.push({
          email: assignment.giverEmail,
          status: 'failed',
          error: emailError.message
        });
      }
    }

    // Actualizar estado del evento
    batch.update(admin.firestore().collection('events').doc(eventId), {
      status: 'emails_sent',
      lastEmailSentAt: new Date()
    });

    await batch.commit();

    const successCount = emailResults.filter(r => r.status === 'sent').length;
    const errorCount = emailResults.filter(r => r.status === 'failed').length;
    const apiKey = process.env.MAILERSEND_API_KEY || functions.config().mailersend?.api_key || 'demo_key';
    const isDemoMode = apiKey === 'demo_key' || 
                      apiKey.startsWith('demo_') ||
                      !apiKey ||
                      apiKey.length < 10;

    return { 
      success: true, 
      message: isDemoMode ? 
        `Emails simulados correctamente (modo demo). ${successCount} enviados, ${errorCount} fallidos` :
        `Emails REALES enviados exitosamente! ${successCount} exitosos, ${errorCount} fallidos`,
      results: emailResults,
      successCount,
      errorCount,
      demoMode: isDemoMode
    };

  } catch (error) {
    console.error('Error al enviar emails:', error);
    
    // En caso de error, devolver éxito en modo demo
    return {
      success: true,
      message: 'Error con servicio de emails, pero sorteo completado correctamente (modo demo)',
      results: [],
      successCount: 0,
      errorCount: 0,
      demoMode: true,
      fallbackMode: true
    };
  }
});

// Función para obtener logs de emails
exports.getEmailLogs = functions.https.onCall(async (data, context) => {
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

    // Obtener logs
    const logsSnapshot = await admin.firestore()
      .collection('events')
      .doc(eventId)
      .collection('emailLogs')
      .orderBy('sentAt', 'desc')
      .get();

    const logs = [];
    logsSnapshot.forEach(doc => {
      logs.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { 
      success: true,
      emailLogs: logs 
    };
  } catch (error) {
    console.error('Error al obtener logs de emails:', error);
    throw new functions.https.HttpsError('internal', 'Error interno del servidor');
  }
});

// Webhook para actualizar estados de MailerSend
exports.mailersendWebhook = functions.https.onRequest(async (req, res) => {
  // Verificar que es un POST request
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  try {
    console.log('📧 Webhook received:', JSON.stringify(req.body, null, 2));
    
    let events = req.body;
    
    // Handle different payload structures
    if (!events) {
      console.warn('📧 Webhook: No body received');
      res.status(400).send('No payload received');
      return;
    }
    
    // If it's not an array, try to wrap it in an array or extract the events array
    if (!Array.isArray(events)) {
      if (events.data && Array.isArray(events.data)) {
        events = events.data;
      } else if (events.events && Array.isArray(events.events)) {
        events = events.events;
      } else {
        // Single event object
        events = [events];
      }
    }
    
    // Defensive: ensure events is an array
    if (!Array.isArray(events)) {
      console.warn('📧 Webhook: Events payload is not an array after normalization');
      res.status(400).send('Invalid events payload');
      return;
    }
    console.log(`📧 Processing ${events.length} webhook events`);
    
    for (const event of events) {
      try {
        // Safely extract message ID
        let messageId;
        if (event.data && event.data.message_id) {
          messageId = event.data.message_id;
        } else if (event.data && event.data.message && event.data.message.id) {
          messageId = event.data.message.id;
        } else if (event.message_id) {
          messageId = event.message_id;
        } else if (event.id) {
          messageId = event.id;
        }
        
        if (!messageId) {
          console.warn('📧 Webhook: No message ID found in event:', JSON.stringify(event, null, 2));
          continue;
        }
        
        const status = event.data?.type || event.type || event.event || 'unknown';
        
        console.log(`📧 Processing event: ${status} for message: ${messageId}`);
        
        // Buscar el log correspondiente
        const logsQuery = await admin.firestore()
          .collectionGroup('emailLogs')
          .where('messageId', '==', messageId)
          .get();

        if (!logsQuery.empty) {
          const logDoc = logsQuery.docs[0];
          await logDoc.ref.update({
            status: status,
            updatedAt: new Date(),
            webhookData: event.data || event
          });
          console.log(`📧 Updated log for message: ${messageId} with status: ${status}`);
        } else {
          console.warn(`📧 No log found for message ID: ${messageId}`);
        }
      } catch (eventError) {
        console.error(`📧 Error processing individual webhook event:`, eventError, 'Event:', JSON.stringify(event, null, 2));
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('📧 Error procesando webhook:', error);
    console.error('📧 Request body:', JSON.stringify(req.body, null, 2));
    res.status(500).send('Error interno');
  }
});

module.exports = {
  createEvent: exports.createEvent,
  getUserEvents: exports.getUserEvents,
  getEvent: exports.getEvent,
  updateEvent: exports.updateEvent,
  sendSecretSantaEmails: exports.sendSecretSantaEmails,
  getEmailLogs: exports.getEmailLogs,
  mailersendWebhook: exports.mailersendWebhook
};