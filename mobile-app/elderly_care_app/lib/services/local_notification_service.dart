import 'dart:convert';
import 'dart:developer' as dev;
import 'dart:typed_data';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;
import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'api_service.dart';
import '../main.dart';
import '../screens/medication_reminder_screen.dart';
import '../screens/appointment_reminder_screen.dart';
import '../models/reminder_model.dart';
import '../models/medication_model.dart';
import '../models/appointment_model.dart';

@pragma('vm:entry-point')
void notificationTapBackground(NotificationResponse notificationResponse) {
  dev.log('Notification action tapped in background: ${notificationResponse.actionId}');
  if (notificationResponse.actionId == 'take') {
    final payload = notificationResponse.payload;
    if (payload != null) {
      _handleBackgroundTakeAction(payload);
    }
  } else if (notificationResponse.actionId == 'snooze') {
    final payload = notificationResponse.payload;
    if (payload != null) {
      _handleBackgroundSnoozeAction(payload);
    }
  }
}

void _handleBackgroundTakeAction(String payload) {
  try {
    final Map<String, dynamic> data = jsonDecode(payload);
    final reminderId = data['reminderId'];
    final medicationName = data['medName'];
    final userId = data['userId'];
    if (reminderId == null) return;

    // Immediately cancel notifications on device and unprotect snooze ID
    final localNotificationsPlugin = FlutterLocalNotificationsPlugin();
    final notifyId = reminderId.hashCode;
    final snoozeNotifyId = reminderId.hashCode + 999;
    localNotificationsPlugin.cancel(notifyId);
    localNotificationsPlugin.cancel(snoozeNotifyId);
    LocalNotificationService._protectedSnoozeIds.remove(snoozeNotifyId);

    final uri = Uri.parse(ApiService.serverUrl);
    final socketUrl = '${uri.scheme}://${uri.host}:5008';
    
    dev.log('Background task: Connecting to $socketUrl to take medication.');
    final socket = IO.io(socketUrl, IO.OptionBuilder()
      .setTransports(['websocket'])
      .disableAutoConnect()
      .build()
    );

    socket.connect();
    socket.onConnect((_) {
      socket.emit('medication_taken', {
        'reminderId': reminderId,
        'medicationName': medicationName,
        'userId': userId,
      });
      dev.log('Background task: Emitted medication_taken for $reminderId');
      Future.delayed(const Duration(seconds: 2), () {
        socket.disconnect();
      });
    });
  } catch (e) {
    dev.log('Background take action error: $e');
  }
}

void _handleBackgroundSnoozeAction(String payload) {
  try {
    final Map<String, dynamic> data = jsonDecode(payload);
    final reminderId = data['reminderId'];
    final medicationName = data['medName'];
    final userId = data['userId'];
    final title = data['title'] ?? 'Nhắc nhở uống thuốc';
    final body = data['body'] ?? 'Đã đến giờ uống thuốc!';

    // Emit snoozed event to notify caregiver
    if (reminderId != null && userId != null) {
      final uri = Uri.parse(ApiService.serverUrl);
      final socketUrl = '${uri.scheme}://${uri.host}:5008';
      final socket = IO.io(socketUrl, IO.OptionBuilder()
        .setTransports(['websocket'])
        .disableAutoConnect()
        .build()
      );

      socket.connect();
      socket.onConnect((_) {
        socket.emit('medication_snoozed', {
          'reminderId': reminderId,
          'medicationName': medicationName,
          'userId': userId,
        });
        dev.log('Background task: Emitted medication_snoozed for $reminderId');
        Future.delayed(const Duration(seconds: 2), () {
          socket.disconnect();
        });
      });
    }

    tz.initializeTimeZones();
    try {
      tz.setLocalLocation(tz.getLocation('Asia/Ho_Chi_Minh'));
    } catch (_) {}

    final localNotificationsPlugin = FlutterLocalNotificationsPlugin();
    
    const AndroidInitializationSettings initializationSettingsAndroid = AndroidInitializationSettings('@mipmap/ic_launcher');
    const InitializationSettings initializationSettings = InitializationSettings(android: initializationSettingsAndroid);
    
    localNotificationsPlugin.initialize(initializationSettings).then((_) {
      final scheduledDate = tz.TZDateTime.now(tz.local).add(const Duration(minutes: 5));
      
      final AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
        'medication_channel_v2',
        'Medication Reminders',
        channelDescription: 'Channel for medication reminder alerts',
        importance: Importance.max,
        priority: Priority.high,
        playSound: true,
        enableVibration: true,
        fullScreenIntent: true,
        category: AndroidNotificationCategory.alarm,
        audioAttributesUsage: AudioAttributesUsage.alarm,
        additionalFlags: Int32List.fromList(<int>[4]),
        actions: <AndroidNotificationAction>[
          const AndroidNotificationAction(
            'take',
            'Đã uống',
            showsUserInterface: false,
            cancelNotification: true,
          ),
          const AndroidNotificationAction(
            'snooze',
            'Chưa uống được',
            showsUserInterface: false,
            cancelNotification: true,
          ),
        ],
      );
      
      final NotificationDetails platformDetails = NotificationDetails(android: androidDetails);
      
      final notifyId = reminderId.hashCode + 999;
      try {
        localNotificationsPlugin.zonedSchedule(
          notifyId,
          title,
          body,
          scheduledDate,
          platformDetails,
          androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
          uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
          payload: payload,
        );
        dev.log('Background task: Scheduled exact snooze notification for $reminderId in 5 minutes.');
      } catch (e) {
        dev.log('Background task: Exact snooze scheduling failed, falling back to inexact: $e');
        try {
          localNotificationsPlugin.zonedSchedule(
            notifyId,
            title,
            body,
            scheduledDate,
            platformDetails,
            androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
            uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
            payload: payload,
          );
          dev.log('Background task: Scheduled inexact snooze notification for $reminderId in 5 minutes.');
        } catch (ex) {
          dev.log('Background task: Failed to schedule snooze notification: $ex');
        }
      }
    });
  } catch (e) {
    dev.log('Background snooze action error: $e');
  }
}

class LocalNotificationService {
  static final FlutterLocalNotificationsPlugin _notificationsPlugin = FlutterLocalNotificationsPlugin();

  // Track snooze notification IDs that should NOT be cancelled during rescheduling
  static final Set<int> _protectedSnoozeIds = {};
  static final AndroidNotificationChannel _medicationChannel = AndroidNotificationChannel(
    'medication_channel_v2',
    'Medication Reminders',
    description: 'Channel for medication reminder alerts',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
    vibrationPattern: Int64List.fromList(<int>[0, 1000, 500, 1000]),
  );

  static final AndroidNotificationChannel _appointmentChannel = AndroidNotificationChannel(
    'appointment_alarm_channel_v2',
    'Appointment Reminders',
    description: 'Channel for appointment reminder alerts',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
    vibrationPattern: Int64List.fromList(<int>[0, 1000, 500, 1000]),
  );

  static Future<void> init() async {
    tz.initializeTimeZones();
    try {
      tz.setLocalLocation(tz.getLocation('Asia/Ho_Chi_Minh'));
    } catch (e) {
      dev.log('Error setting timezone: $e');
    }

    const AndroidInitializationSettings initializationSettingsAndroid = AndroidInitializationSettings('@mipmap/ic_launcher');
    
    const InitializationSettings initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
    );

    await _notificationsPlugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        dev.log('Notification tapped in foreground/UI thread: ${response.actionId}');
        if (response.actionId == 'take') {
          final payload = response.payload;
          if (payload != null) {
            _handleBackgroundTakeAction(payload);
          }
        } else if (response.actionId == 'snooze') {
          final payload = response.payload;
          if (payload != null) {
            _handleBackgroundSnoozeAction(payload);
          }
        } else {
          // Opened from notification tap or full-screen intent
          final payload = response.payload;
          if (payload != null) {
            final Map<String, dynamic> data = jsonDecode(payload);
            final reminderId = data['reminderId'];
            if (data['type'] == 'appointment' && reminderId != null && navigatorKey.currentState != null) {
              final appointment = AppointmentModel(
                id: data['appointmentId'] ?? '',
                userId: data['userId'] ?? '',
                doctorName: data['doctorName'] ?? 'Lịch khám',
                location: data['location'] ?? '',
                appointmentDate: DateTime.parse(data['appointmentDate']),
                notes: data['notes'],
              );
              final reminder = ReminderModel(
                id: reminderId,
                userId: data['userId'] ?? '',
                type: ReminderType.appointment,
                referenceId: data['appointmentId'] ?? '',
                scheduledTime: DateTime.parse(data['scheduledTime']),
                status: ReminderStatus.pending,
              );

              navigatorKey.currentState!.push(
                MaterialPageRoute(
                  builder: (_) => AppointmentReminderScreen(
                    reminder: reminder,
                    appointment: appointment,
                  ),
                ),
              );
            } else {
              final medReminderId = data['reminderId'];
              if (medReminderId != null && navigatorKey.currentState != null) {
                final dummyReminder = ReminderModel(
                  id: medReminderId,
                  userId: '',
                  type: ReminderType.medication,
                  referenceId: data['medId'] ?? '',
                  scheduledTime: DateTime.now(),
                  status: ReminderStatus.pending,
                );
                final dummyMedication = MedicationModel(
                  id: data['medId'] ?? '',
                  userId: '',
                  medicationName: data['medName'] ?? 'Thuốc',
                  dosage: data['medDosage'] ?? '',
                  frequency: '',
                  scheduledTimes: '',
                  startDate: DateTime.now(),
                );

                navigatorKey.currentState!.push(
                  MaterialPageRoute(
                    builder: (_) => MedicationReminderScreen(
                      reminder: dummyReminder,
                      medication: dummyMedication,
                    ),
                  ),
                );
              }
            }
          }
        }
      },
      onDidReceiveBackgroundNotificationResponse: notificationTapBackground,
    );

    // Request permissions for Android 13+
    final androidPlugin = _notificationsPlugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    if (androidPlugin != null) {
      await androidPlugin.requestNotificationsPermission();
      await androidPlugin.requestExactAlarmsPermission();
      await androidPlugin.createNotificationChannel(_medicationChannel);
      await androidPlugin.createNotificationChannel(_appointmentChannel);
    }
  }

  // Pre-schedule local notifications for all pending reminders of the day
  static Future<void> scheduleDailyReminders(List<dynamic> reminders, List<dynamic> medications, [List<dynamic> appointments = const []]) async {
    final now = DateTime.now();
    
    dev.log('=== scheduleDailyReminders called ===');
    dev.log('Total reminders: ${reminders.length}');
    dev.log('Total medications: ${medications.length}');
    dev.log('Total appointments: ${appointments.length}');
    
    // Cancel pending notifications selectively, preserving protected snooze IDs
    if (_protectedSnoozeIds.isEmpty) {
      await _notificationsPlugin.cancelAll();
    } else {
      // Get all pending notifications and cancel only those NOT in protected set
      final pending = await _notificationsPlugin.pendingNotificationRequests();
      dev.log('Pending notifications: ${pending.length}, Protected snooze IDs: $_protectedSnoozeIds');
      for (final n in pending) {
        if (!_protectedSnoozeIds.contains(n.id)) {
          await _notificationsPlugin.cancel(n.id);
        } else {
          dev.log('Preserved snooze notification ID: ${n.id}');
        }
      }
    }

    int medicationCount = 0;
    int appointmentCount = 0;

    for (var r in reminders) {
      final isMedication = r['type'] == 0 || r['type'] == 'Medication';
      final isPending = r['status'] == 0 || r['status'] == 'Pending';
      
      if (isMedication) {
        dev.log('Medication reminder: ${r['id']}, pending: $isPending');
      }
      
      // If medication is completed or missed, clean up its snooze notification if any
      if (isMedication && !isPending) {
        final snoozeNotifyId = r['id'].hashCode + 999;
        if (_protectedSnoozeIds.contains(snoozeNotifyId)) {
          _protectedSnoozeIds.remove(snoozeNotifyId);
          await _notificationsPlugin.cancel(snoozeNotifyId);
          dev.log('Cleaned up snooze notification $snoozeNotifyId for completed reminder ${r['id']}');
        }
      }

      if (!isMedication || !isPending) continue;

      final scheduledTimeStr = r['scheduledTime'];
      if (scheduledTimeStr == null) continue;

      final scheduledTime = DateTime.parse(scheduledTimeStr).toLocal();
      // Only schedule if scheduled for today and in the future
      if (scheduledTime.isAfter(now) &&
          scheduledTime.year == now.year &&
          scheduledTime.month == now.month &&
          scheduledTime.day == now.day) {

        final medId = r['referenceId'];
        final med = medications.firstWhere((m) => m['id'] == medId, orElse: () => null);
        final medName = med != null ? (med['medicationName'] ?? med['name'] ?? 'Thuốc') : 'Thuốc';
        final medDosage = med != null ? (med['dosage'] is Map ? '${med['dosage']['amount']} ${med['dosage']['unit']}' : (med['dosage'] ?? '')) : '';
        
        final title = 'Lịch uống thuốc: $medName';
        final body = 'Đã đến giờ uống thuốc $medName ($medDosage) lúc ${scheduledTime.hour.toString().padLeft(2, '0')}:${scheduledTime.minute.toString().padLeft(2, '0')}';
        
        final payload = jsonEncode({
          'reminderId': r['id'],
          'medId': medId,
          'medName': medName,
          'medDosage': medDosage,
          'userId': r['userId'],
          'title': title,
          'body': body,
        });

        final scheduledTZDate = tz.TZDateTime.from(scheduledTime, tz.local);

        final AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
          'medication_channel_v2',
          'Medication Reminders',
          channelDescription: 'Channel for medication reminder alerts',
          importance: Importance.max,
          priority: Priority.high,
          playSound: true,
          enableVibration: true,
          fullScreenIntent: true,
          category: AndroidNotificationCategory.alarm,
          audioAttributesUsage: AudioAttributesUsage.alarm,
          additionalFlags: Int32List.fromList(<int>[4]),
          actions: <AndroidNotificationAction>[
            const AndroidNotificationAction(
              'take',
              'Đã uống',
              showsUserInterface: false,
              cancelNotification: true,
            ),
            const AndroidNotificationAction(
              'snooze',
              'Chưa uống được',
              showsUserInterface: false,
              cancelNotification: true,
            ),
          ],
        );

        final NotificationDetails platformDetails = NotificationDetails(android: androidDetails);

        final notifyId = r['id'].hashCode;
        await _notificationsPlugin.zonedSchedule(
          notifyId,
          title,
          body,
          scheduledTZDate,
          platformDetails,
          androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
          uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
          payload: payload,
        );
        medicationCount++;
        dev.log('Pre-scheduled medication notification for $medName at $scheduledTime (ID: $notifyId)');
      }
    }

    for (var r in reminders) {
      final isAppointment = r['type'] == 1 || r['type'] == 'Appointment';
      final isPending = r['status'] == 0 || r['status'] == 'Pending';
      
      dev.log('Checking reminder: ${r['id']}, type: ${r['type']}, isAppointment: $isAppointment, isPending: $isPending');
      
      if (!isAppointment || !isPending) continue;

      final scheduledTimeStr = r['scheduledTime'];
      if (scheduledTimeStr == null) {
        dev.log('Appointment reminder ${r['id']} has no scheduledTime');
        continue;
      }

      final scheduledTime = DateTime.parse(scheduledTimeStr).toLocal();
      dev.log('Appointment reminder ${r['id']}: scheduledTime=$scheduledTime, now=$now');
      dev.log('  isAfter: ${scheduledTime.isAfter(now)}, sameDay: ${scheduledTime.year == now.year && scheduledTime.month == now.month && scheduledTime.day == now.day}');
      
      if (scheduledTime.isAfter(now) &&
          scheduledTime.year == now.year &&
          scheduledTime.month == now.month &&
          scheduledTime.day == now.day) {
        final appointmentId = r['referenceId'];
        final appointment = appointments.firstWhere(
          (a) => a['id'] == appointmentId,
          orElse: () => null,
        );
        final doctorName = appointment != null && appointment['doctorName'] != null
            ? appointment['doctorName']
            : 'Lịch khám';
        final location = appointment != null && appointment['location'] != null
            ? appointment['location']
            : '';
        final title = 'Nhắc lịch khám: $doctorName';
        final body = location.isNotEmpty
            ? 'Đến giờ khám $doctorName tại $location lúc ${scheduledTime.hour.toString().padLeft(2, '0')}:${scheduledTime.minute.toString().padLeft(2, '0')}'
            : 'Đến giờ khám $doctorName lúc ${scheduledTime.hour.toString().padLeft(2, '0')}:${scheduledTime.minute.toString().padLeft(2, '0')}';

        final payload = jsonEncode({
          'type': 'appointment',
          'reminderId': r['id'],
          'appointmentId': appointmentId,
          'userId': r['userId'],
          'doctorName': doctorName,
          'location': location,
          'appointmentDate': appointment != null && appointment['appointmentDate'] != null
              ? appointment['appointmentDate']
              : r['scheduledTime'],
          'notes': appointment != null ? appointment['notes'] : null,
          'scheduledTime': r['scheduledTime'],
          'title': title,
          'body': body,
        });

        final scheduledTZDate = tz.TZDateTime.from(scheduledTime, tz.local);

        final AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
          'appointment_alarm_channel_v2',
          'Appointment Reminders',
          channelDescription: 'Channel for appointment reminder alerts',
          importance: Importance.max,
          priority: Priority.high,
          playSound: true,
          enableVibration: true,
          fullScreenIntent: true,
          category: AndroidNotificationCategory.alarm,
          audioAttributesUsage: AudioAttributesUsage.alarm,
          additionalFlags: Int32List.fromList(<int>[4]),
        );

        final NotificationDetails platformDetails = NotificationDetails(android: androidDetails);

        final notifyId = r['id'].hashCode + 1000000;
        await _notificationsPlugin.zonedSchedule(
          notifyId,
          title,
          body,
          scheduledTZDate,
          platformDetails,
          androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
          uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
          payload: payload,
        );
        appointmentCount++;
        dev.log('Pre-scheduled appointment notification for $doctorName at $scheduledTime (ID: $notifyId)');
      } else {
        dev.log('Appointment reminder ${r['id']} NOT scheduled: not today or in past');
      }
    }
    
    dev.log('=== Scheduled $medicationCount medication and $appointmentCount appointment notifications ===');
  }

  static Future<void> triggerLocalSnooze(String reminderId, String title, String body, {String? userId, String? medName}) async {
    final scheduledDate = tz.TZDateTime.now(tz.local).add(const Duration(minutes: 5));
    final payload = jsonEncode({
      'reminderId': reminderId,
      'title': title,
      'body': body,
      if (userId != null) 'userId': userId,
      if (medName != null) 'medName': medName,
    });

    final AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'medication_channel_v2',
      'Medication Reminders',
      channelDescription: 'Channel for medication reminder alerts',
      importance: Importance.max,
      priority: Priority.high,
      playSound: true,
      enableVibration: true,
      fullScreenIntent: true,
      category: AndroidNotificationCategory.alarm,
      audioAttributesUsage: AudioAttributesUsage.alarm,
      additionalFlags: Int32List.fromList(<int>[4]),
      actions: <AndroidNotificationAction>[
        const AndroidNotificationAction(
          'take',
          'Đã uống',
          showsUserInterface: false,
          cancelNotification: true,
        ),
        const AndroidNotificationAction(
          'snooze',
          'Chưa uống được',
          showsUserInterface: false,
          cancelNotification: true,
        ),
      ],
    );

    final NotificationDetails platformDetails = NotificationDetails(android: androidDetails);

    final notifyId = reminderId.hashCode + 999;
    bool scheduled = false;
    try {
      await _notificationsPlugin.zonedSchedule(
        notifyId,
        title,
        body,
        scheduledDate,
        platformDetails,
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
        payload: payload,
      );
      scheduled = true;
      dev.log('Scheduled foreground-initiated exact snooze notification for $reminderId in 5 minutes.');
    } catch (e) {
      dev.log('⚠️ Foreground exact snooze scheduling failed, falling back to inexact: $e');
      try {
        await _notificationsPlugin.zonedSchedule(
          notifyId,
          title,
          body,
          scheduledDate,
          platformDetails,
          androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
          uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
          payload: payload,
        );
        scheduled = true;
        dev.log('Scheduled foreground-initiated inexact snooze notification for $reminderId in 5 minutes.');
      } catch (ex) {
        dev.log('❌ Failed to schedule foreground snooze notification: $ex');
      }
    }

    // Protect this snooze notification from being cancelled by scheduleDailyReminders
    if (scheduled) {
      _protectedSnoozeIds.add(notifyId);
      dev.log('Protected snooze notification ID: $notifyId');
      // Auto-remove protection after 6 minutes (notification will have fired by then)
      Future.delayed(const Duration(minutes: 6), () {
        _protectedSnoozeIds.remove(notifyId);
        dev.log('Removed protection for snooze notification ID: $notifyId');
      });
    }
  }
}
