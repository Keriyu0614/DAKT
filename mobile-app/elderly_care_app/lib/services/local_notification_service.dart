import 'dart:convert';
import 'dart:developer' as dev;
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'api_service.dart';

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
    if (reminderId == null) return;

    final uri = Uri.parse(ApiService.serverUrl);
    final socketUrl = '${uri.scheme}://${uri.host}:5006';
    
    dev.log('Background task: Connecting to $socketUrl to take medication.');
    final socket = IO.io(socketUrl, IO.OptionBuilder()
      .setTransports(['websocket'])
      .disableAutoConnect()
      .build()
    );

    socket.connect();
    socket.onConnect((_) {
      socket.emit('medication_taken', {'reminderId': reminderId});
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
    final title = data['title'] ?? 'Nhắc nhở uống thuốc';
    final body = data['body'] ?? 'Đã đến giờ uống thuốc!';

    tz.initializeTimeZones();
    try {
      tz.setLocalLocation(tz.getLocation('Asia/Ho_Chi_Minh'));
    } catch (_) {}

    final localNotificationsPlugin = FlutterLocalNotificationsPlugin();
    
    const AndroidInitializationSettings initializationSettingsAndroid = AndroidInitializationSettings('@mipmap/ic_launcher');
    const InitializationSettings initializationSettings = InitializationSettings(android: initializationSettingsAndroid);
    
    localNotificationsPlugin.initialize(initializationSettings).then((_) {
      final scheduledDate = tz.TZDateTime.now(tz.local).add(const Duration(minutes: 5));
      
      const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
        'medication_channel_id',
        'Medication Reminders',
        channelDescription: 'Channel for medication reminder alerts',
        importance: Importance.max,
        priority: Priority.high,
        playSound: true,
        enableVibration: true,
        actions: <AndroidNotificationAction>[
          AndroidNotificationAction('take', 'Đã uống xong', showsUserInterface: false),
          AndroidNotificationAction('snooze', 'Chưa uống được', showsUserInterface: false),
        ],
      );
      
      const NotificationDetails platformDetails = NotificationDetails(android: androidDetails);
      
      final notifyId = reminderId.hashCode + 999;
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
      dev.log('Background task: Scheduled snooze notification for $reminderId in 5 minutes.');
    });
  } catch (e) {
    dev.log('Background snooze action error: $e');
  }
}

class LocalNotificationService {
  static final FlutterLocalNotificationsPlugin _notificationsPlugin = FlutterLocalNotificationsPlugin();

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
        }
      },
      onDidReceiveBackgroundNotificationResponse: notificationTapBackground,
    );

    // Request permissions for Android 13+
    final androidPlugin = _notificationsPlugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    if (androidPlugin != null) {
      await androidPlugin.requestNotificationsPermission();
      await androidPlugin.requestExactAlarmsPermission();
    }
  }

  // Pre-schedule local notifications for all pending medication reminders of the day
  static Future<void> scheduleDailyReminders(List<dynamic> reminders, List<dynamic> medications) async {
    final now = DateTime.now();
    
    // Clear all previously scheduled notifications to avoid duplicates
    await _notificationsPlugin.cancelAll();

    for (var r in reminders) {
      final isMedication = r['type'] == 0 || r['type'] == 'Medication';
      final isPending = r['status'] == 0 || r['status'] == 'Pending';
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
        final medName = med != null ? med['name'] : 'Thuốc';
        final medDosage = med != null ? '${med['dosage']['amount']} ${med['dosage']['unit']}' : '';
        
        final title = 'Lịch uống thuốc: $medName';
        final body = 'Đã đến giờ uống thuốc $medName ($medDosage) lúc ${scheduledTime.hour.toString().padLeft(2, '0')}:${scheduledTime.minute.toString().padLeft(2, '0')}';
        
        final payload = jsonEncode({
          'reminderId': r['id'],
          'title': title,
          'body': body,
        });

        final scheduledTZDate = tz.TZDateTime.from(scheduledTime, tz.local);

        const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
          'medication_channel_id',
          'Medication Reminders',
          channelDescription: 'Channel for medication reminder alerts',
          importance: Importance.max,
          priority: Priority.high,
          playSound: true,
          enableVibration: true,
          actions: <AndroidNotificationAction>[
            AndroidNotificationAction('take', 'Đã uống xong', showsUserInterface: false),
            AndroidNotificationAction('snooze', 'Chưa uống được', showsUserInterface: false),
          ],
        );

        const NotificationDetails platformDetails = NotificationDetails(android: androidDetails);

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
        dev.log('Pre-scheduled notification for $medName at $scheduledTime (ID: $notifyId)');
      }
    }
  }

  // Trigger foreground snooze
  static Future<void> triggerLocalSnooze(String reminderId, String title, String body) async {
    final scheduledDate = tz.TZDateTime.now(tz.local).add(const Duration(minutes: 5));
    final payload = jsonEncode({
      'reminderId': reminderId,
      'title': title,
      'body': body,
    });

    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'medication_channel_id',
      'Medication Reminders',
      channelDescription: 'Channel for medication reminder alerts',
      importance: Importance.max,
      priority: Priority.high,
      playSound: true,
      enableVibration: true,
      actions: <AndroidNotificationAction>[
        AndroidNotificationAction('take', 'Đã uống xong', showsUserInterface: false),
        AndroidNotificationAction('snooze', 'Chưa uống được', showsUserInterface: false),
      ],
    );

    const NotificationDetails platformDetails = NotificationDetails(android: androidDetails);

    final notifyId = reminderId.hashCode + 999;
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
    dev.log('Scheduled foreground-initiated snooze notification for $reminderId in 5 minutes.');
  }
}
