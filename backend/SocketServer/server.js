const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const amqp = require('amqplib');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH']
  }
});

const REMINDER_SERVICE_URL = 'http://localhost:5005';
const NOTIFICATION_SERVICE_URL = 'http://localhost:5006';

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Receive medication taken event from Flutter
  socket.on('medication_taken', async (data) => {
    console.log('Received medication_taken:', data);
    try {
      const { reminderId, medicationName, userId } = data;
      if (!reminderId) {
        console.error('Invalid medication_taken data: missing reminderId');
        return;
      }

      // Update the database status to Completed (Done = 1) in ReminderService
      const response = await axios.patch(`${REMINDER_SERVICE_URL}/api/reminders/${reminderId}/status`, {
        status: 1
      });

      console.log(`Updated database status for reminder ${reminderId} to Done.`);

      // Create notification for caregiver
      if (userId) {
        try {
          const medName = medicationName || 'thuốc';
          const notificationResponse = await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/internal`, {
            userId: userId,
            title: `✅ Đã uống thuốc: ${medName}`,
            message: `Người thân của bạn đã xác nhận uống ${medName} lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
            deliveryChannel: 0, // InApp/MobilePush
            recipientType: 1, // Caregiver
            sourceReminderId: reminderId,
            sourceEventType: 0, // Medication
            sourceEventId: reminderId
          });
          console.log(`Created notification for medication taken: ${reminderId}`);
          
          // Emit notification created event to all connected clients
          io.emit('notification_created', {
            userId: userId,
            notification: notificationResponse.data
          });
        } catch (notifError) {
          console.error('Error creating notification:', notifError.message);
        }
      }

      io.emit('status_updated', {
        reminderId,
        id: reminderId,
        status: 1,
        updatedReminder: response.data
      });
    } catch (error) {
      console.error('Error handling medication_taken:', error.message);
    }
  });

  // Receive medication snoozed event from Flutter
  socket.on('medication_snoozed', async (data) => {
    console.log('Received medication_snoozed:', data);
    try {
      const { reminderId, medicationName, userId } = data;
      if (!reminderId) {
        console.error('Invalid medication_snoozed data: missing reminderId');
        return;
      }

      // Update the database scheduledTime to 5 minutes later in ReminderService
      let snoozeResponse;
      try {
        snoozeResponse = await axios.patch(`${REMINDER_SERVICE_URL}/api/reminders/${reminderId}/snooze`, {
          minutes: 5
        });
        console.log(`Updated database scheduledTime for reminder ${reminderId} via snooze endpoint by 5 minutes.`);
      } catch (dbError) {
        console.error('Error updating database for snooze:', dbError.message);
      }

      // Create notification for caregiver
      if (userId) {
        try {
          const medName = medicationName || 'thuốc';
          const notificationResponse = await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/internal`, {
            userId: userId,
            title: `⏰ Chưa uống được: ${medName}`,
            message: `Người thân của bạn chưa thể uống ${medName} và đã chọn nhắc lại sau 5 phút lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
            deliveryChannel: 0, // InApp/MobilePush
            recipientType: 1, // Caregiver
            sourceReminderId: reminderId,
            sourceEventType: 0, // Medication
            sourceEventId: reminderId
          });
          console.log(`Created notification for medication snoozed: ${reminderId}`);
          
          // Emit notification created event to all connected clients
          io.emit('notification_created', {
            userId: userId,
            notification: notificationResponse.data
          });
        } catch (notifError) {
          console.error('Error creating notification:', notifError.message);
        }
      }

      io.emit('medication_snoozed_event', {
        reminderId,
        id: reminderId,
        updatedReminder: snoozeResponse ? snoozeResponse.data : null
      });

      // Also emit status_updated to synchronize changes across UIs
      io.emit('status_updated', {
        reminderId,
        id: reminderId,
        status: 0, // Pending
        updatedReminder: snoozeResponse ? snoozeResponse.data : null
      });
    } catch (error) {
      console.error('Error handling medication_snoozed:', error.message);
    }
  });

  // Receive appointment done event from Flutter
  socket.on('appointment_done', async (data) => {
    console.log('Received appointment_done:', data);
    try {
      const { appointmentId, doctorName, userId } = data;
      if (!appointmentId) {
        console.error('Invalid appointment_done data: missing appointmentId');
        return;
      }

      const remindersResponse = await axios.get(`${REMINDER_SERVICE_URL}/api/reminders`);
      const reminders = remindersResponse.data;
      const appointmentReminder = reminders.find(r =>
        (r.type === 'Appointment' || r.type === 1) && r.referenceId === appointmentId
      );

      if (!appointmentReminder) {
        console.error(`No appointment reminder found for appointmentId ${appointmentId}`);
        return;
      }

      const patchResponse = await axios.patch(`${REMINDER_SERVICE_URL}/api/reminders/${appointmentReminder.id}/status`, {
        status: 1
      });

      console.log(`Updated appointment reminder ${appointmentReminder.id} to Done.`);
      
      // Create notification for caregiver
      if (userId) {
        try {
          const doctor = doctorName || 'bác sĩ';
          const notificationResponse = await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/internal`, {
            userId: userId,
            title: `🚗 Đang đến khám: ${doctor}`,
            message: `Người thân của bạn đang trên đường đến khám ${doctor} lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
            deliveryChannel: 0, // InApp/MobilePush
            recipientType: 1, // Caregiver
            sourceReminderId: appointmentReminder.id,
            sourceEventType: 1, // Appointment
            sourceEventId: appointmentId
          });
          console.log(`Created notification for appointment done: ${appointmentId}`);
          
          // Emit notification created event to all connected clients
          io.emit('notification_created', {
            userId: userId,
            notification: notificationResponse.data
          });
        } catch (notifError) {
          console.error('Error creating notification:', notifError.message);
        }
      }
      
      io.emit('status_updated', {
        reminderId: appointmentReminder.id,
        id: appointmentReminder.id,
        status: 1,
        updatedReminder: patchResponse.data
      });
    } catch (error) {
      console.error('Error handling appointment_done:', error.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  // Broadcast medication deleted event
  socket.on('medication_deleted', (data) => {
    console.log('Received medication_deleted:', data);
    // Broadcast to all clients
    io.emit('medication_deleted', data);
  });

  // Broadcast appointment deleted event
  socket.on('appointment_deleted', (data) => {
    console.log('Received appointment_deleted:', data);
    // Broadcast to all clients
    io.emit('appointment_deleted', data);
  });

  // Receive health log submitted event from Flutter (elderly self-recorded)
  socket.on('health_log_submitted', async (data) => {
    console.log('Received health_log_submitted:', data);
    try {
      const { userId, healthLogId, bloodPressure, heartRate, weight } = data;

      // Create notification for caregiver via NotificationService
      if (userId) {
        try {
          const notificationResponse = await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/internal`, {
            userId: userId,
            title: `📋 Người thân vừa tự ghi chỉ số sức khỏe`,
            message: `Đã ghi lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}: ${bloodPressure && bloodPressure !== '-' ? `huyết áp ${bloodPressure} mmHg` : ''}${heartRate ? `, nhịp tim ${heartRate} bpm` : ''}${weight ? `, cân nặng ${weight} kg` : ''}`.trim().replace(/^,\s*/, ''),
            deliveryChannel: 0, // InApp
            recipientType: 1,   // Caregiver
            sourceType: 2,      // Health
            sourceId: healthLogId || userId,
            sourceEventType: 2,
            sourceEventId: healthLogId || userId,
            sourceReminderId: healthLogId || '00000000-0000-0000-0000-000000000000'
          });
          console.log(`Created health notification for user ${userId}`);

          // Broadcast to all web clients so caregiver sees it in real-time
          io.emit('health_log_submitted', {
            userId,
            healthLogId,
            notification: notificationResponse.data
          });

          io.emit('notification_created', {
            userId,
            notification: notificationResponse.data
          });
        } catch (notifError) {
          console.error('Error creating health notification:', notifError.message);
          // Still broadcast the event even if notification creation fails
          io.emit('health_log_submitted', { userId, healthLogId });
        }
      }
    } catch (error) {
      console.error('Error handling health_log_submitted:', error.message);
    }
  });
});

// Periodic checker for missed medications (Runs every 30 seconds)
setInterval(async () => {
  try {
    const response = await axios.get(`${REMINDER_SERVICE_URL}/api/reminders`);
    const reminders = response.data;
    if (!Array.isArray(reminders)) return;

    const now = new Date();

    for (const reminder of reminders) {
      const isMedication = reminder.type === 'Medication' || reminder.type === 0;
      const isAppointment = reminder.type === 'Appointment' || reminder.type === 1;
      const isPending = reminder.status === 'Pending' || reminder.status === 0;

      if ((isMedication || isAppointment) && isPending) {
        const scheduledTime = new Date(reminder.scheduledTime);
        const diffMs = now.getTime() - scheduledTime.getTime();
        const diffMinutes = diffMs / (1000 * 60);

        if (diffMinutes >= 15) {
          console.log(`Reminder ${reminder.id} is overdue by ${Math.floor(diffMinutes)} minutes. Marking as missed.`);
          const patchResponse = await axios.patch(`${REMINDER_SERVICE_URL}/api/reminders/${reminder.id}/status`, {
            status: 2
          });

          if (isMedication) {
            io.emit('medication_missed', {
              reminderId: reminder.id,
              id: reminder.id,
              status: 2,
              updatedReminder: patchResponse.data
            });
          }

          io.emit('status_updated', {
            reminderId: reminder.id,
            id: reminder.id,
            status: 2,
            updatedReminder: patchResponse.data
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking missed medications:', error.message);
  }
}, 30000);

// ─── RabbitMQ Emergency Consumer ─────────────────────────────────────────────
const RABBITMQ_URL = 'amqp://guest:guest@localhost:5672';
const EXCHANGE_NAME = 'emergency.fanout';
const SOCKET_QUEUE_NAME = 'emergency.socket.queue';

async function startEmergencyConsumer() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    // Declare exchange (idempotent — safe to call even if already exists)
    await channel.assertExchange(EXCHANGE_NAME, 'fanout', { durable: true });

    // Declare queue and bind to exchange
    await channel.assertQueue(SOCKET_QUEUE_NAME, { durable: true });
    await channel.bindQueue(SOCKET_QUEUE_NAME, EXCHANGE_NAME, '');

    console.log(`[RabbitMQ] Listening on queue '${SOCKET_QUEUE_NAME}'...`);

    channel.consume(SOCKET_QUEUE_NAME, async (msg) => {
      if (!msg) return;

      try {
        const event = JSON.parse(msg.content.toString());
        console.log('[RabbitMQ] Received emergency event:', event.eventId);

        // Create in-app notification for each caregiver
        if (Array.isArray(event.caregiverIds)) {
          for (const caregiverId of event.caregiverIds) {
            try {
              await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/internal`, {
                userId: caregiverId,
                title: `🚨 KHẨN CẤP: ${event.elderlyName} cần hỗ trợ!`,
                message: `Người cao tuổi ${event.elderlyName} đã nhấn nút gọi hỗ trợ khẩn cấp lúc ${new Date(event.triggeredAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
                deliveryChannel: 0,
                recipientType: 1,
                sourceEventType: 3,
                sourceEventId: event.eventId,
                sourceReminderId: '00000000-0000-0000-0000-000000000000'
              });
            } catch (notifErr) {
              console.error('[RabbitMQ] Failed to create notification for caregiver:', caregiverId, notifErr.message);
            }
          }
        }

        // Emit emergency_alert to ALL connected web clients
        io.emit('emergency_alert', {
          eventId: event.eventId,
          elderlyName: event.elderlyName,
          elderlyUserId: event.elderlyUserId,
          caregiverIds: event.caregiverIds,
          latitude: event.latitude,
          longitude: event.longitude,
          message: event.message,
          triggeredAt: event.triggeredAt
        });

        console.log(`[RabbitMQ] Emitted emergency_alert for ${event.elderlyName} to all clients`);
        channel.ack(msg);
      } catch (err) {
        console.error('[RabbitMQ] Error processing emergency message:', err.message);
        channel.nack(msg, false, false); // discard to avoid infinite loop
      }
    });

    connection.on('error', (err) => {
      console.error('[RabbitMQ] Connection error:', err.message);
      setTimeout(startEmergencyConsumer, 5000); // retry after 5s
    });

  } catch (err) {
    console.error('[RabbitMQ] Failed to connect, retrying in 5s...', err.message);
    setTimeout(startEmergencyConsumer, 5000);
  }
}

// Start RabbitMQ consumer
startEmergencyConsumer();

const PORT = process.env.PORT || 5008;
server.listen(PORT, () => {
  console.log(`Socket.io Server is running on port ${PORT}`);
});
