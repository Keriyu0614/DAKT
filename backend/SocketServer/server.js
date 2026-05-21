const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');

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

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Receive medication taken event from Flutter
  socket.on('medication_taken', async (data) => {
    console.log('Received medication_taken:', data);
    try {
      const { reminderId } = data;
      if (!reminderId) {
        console.error('Invalid medication_taken data: missing reminderId');
        return;
      }

      // Update the database status to Completed (Done = 1) in ReminderService
      const response = await axios.patch(`${REMINDER_SERVICE_URL}/api/reminders/${reminderId}/status`, {
        status: 1
      });

      console.log(`Updated database status for reminder ${reminderId} to Done.`);

      // Broadcast status_updated event to all clients (React Dashboard)
      io.emit('status_updated', {
        reminderId,
        id: reminderId,
        status: 'Done',
        updatedReminder: response.data
      });
    } catch (error) {
      console.error('Error handling medication_taken:', error.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
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
      // Check for Pending medication reminders
      const isMedication = reminder.type === 'Medication' || reminder.type === 0;
      const isPending = reminder.status === 'Pending' || reminder.status === 0;

      if (isMedication && isPending) {
        const scheduledTime = new Date(reminder.scheduledTime);
        const diffMs = now.getTime() - scheduledTime.getTime();
        const diffMinutes = diffMs / (1000 * 60);

        // If scheduled time is past by 15 minutes or more and not completed
        if (diffMinutes >= 15) {
          console.log(`Medication reminder ${reminder.id} is overdue by ${Math.floor(diffMinutes)} minutes. Marking as missed.`);
          
          // Update database status to Missed (= 2)
          const patchResponse = await axios.patch(`${REMINDER_SERVICE_URL}/api/reminders/${reminder.id}/status`, {
            status: 2
          });

          // Broadcast medication_missed event to React
          io.emit('medication_missed', {
            reminderId: reminder.id,
            id: reminder.id,
            status: 'Missed',
            updatedReminder: patchResponse.data
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking missed medications:', error.message);
  }
}, 30000);

const PORT = process.env.PORT || 5006;
server.listen(PORT, () => {
  console.log(`Socket.io Server is running on port ${PORT}`);
});
