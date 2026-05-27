import 'dart:async';
import 'dart:convert';
import 'dart:developer' as dev;
import 'package:flutter/material.dart';
import '../main.dart';
import 'appointment_detail_screen.dart';
import 'health_detail_screen.dart';
import 'notification_history_screen.dart';
import 'medication_reminder_screen.dart';
import 'appointment_reminder_screen.dart';
import 'profile_screen.dart';
import 'health_chat_screen.dart';
import 'emergency_call_screen.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../services/reminder_service.dart';
import '../services/health_service.dart';
import '../services/appointment_service.dart';
import '../services/medication_service.dart';
import '../services/emergency_service.dart';
import '../services/socket_service.dart';
import '../models/reminder_model.dart';
import '../models/health_log_model.dart';
import '../models/appointment_model.dart';
import '../models/medication_model.dart';
import '../services/notification_service.dart';
import '../services/local_notification_service.dart';
import '../models/notification_model.dart';
import '../services/socket_service.dart';
import 'package:flutter/material.dart';
import '../widgets/reminder_card.dart' hide ReminderStatus;

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedTab = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surface,
      body: IndexedStack(
        index: _selectedTab,
        children: [
          _HomeTab(),
          const HealthDetailScreen(),
          const ProfileScreen(),
        ],
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.card,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              Expanded(child: _navItem(0, Icons.home_rounded, 'Trang chủ')),
              Expanded(child: _navItem(1, Icons.favorite_rounded, 'Sức khoẻ')),
              Expanded(child: _navItem(2, Icons.person_rounded, 'Cá nhân')),
            ],
          ),
        ),
      ),
    );
  }

  Widget _navItem(int index, IconData icon, String label) {
    final isActive = _selectedTab == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedTab = index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 10),
        decoration: BoxDecoration(
          color: isActive ? AppTheme.primaryLight : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon,
                color: isActive ? AppTheme.primary : AppTheme.textMuted,
                size: 26),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                color: isActive ? AppTheme.primary : AppTheme.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// HOME TAB
// ─────────────────────────────────────────────
class _HomeTab extends StatefulWidget {
  @override
  State<_HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<_HomeTab> with RouteAware {
  List<ReminderModel> _reminders = [];
  List<MedicationModel> _medications = [];
  List<AppointmentModel> _appointments = [];
  HealthLogModel? _latestHealthLog;
  bool _isLoading = true;
  bool _isError = false;
  bool _hasUnreadNotifications = false;
  Timer? _foregroundTimer;
  final Set<String> _shownDialogReminderIds = {};
  // Tracks snooze expiry per medication: medId → DateTime when snooze expires
  final Map<String, DateTime> _snoozedUntil = {};
  DateTime _selectedDate = DateTime.now();
  int _calendarMonthOffset = 0;

  @override
  void initState() {
    super.initState();
    dev.log('=== HomeScreen initState ===');
    // Ensure socket is connected before setting up listeners
    SocketService.connect();
    // Wait a bit for connection to establish
    Future.delayed(const Duration(milliseconds: 500), () {
      _setupSocketListeners();
      dev.log('Socket connected: ${SocketService.isConnected}');
    });
    _loadData();
    _startForegroundTimer();
  }

  void _setupSocketListeners() {
    dev.log('=== Setting up socket listeners in HomeScreen ===');
    // Listen for status updates
    SocketService.on('status_updated', _handleStatusUpdate);
    SocketService.on('notification_created', _handleNotificationCreated);
    SocketService.on('medication_snoozed_event', _handleMedicationSnoozed);
    SocketService.on('medication_missed', _handleMedicationMissed);
    // Listen for delete events
    SocketService.on('medication_deleted', _handleMedicationDeleted);
    SocketService.on('appointment_deleted', _handleAppointmentDeleted);
    dev.log('=== Socket listeners setup complete ===');
  }

  void _handleStatusUpdate(dynamic data) {
    dev.log('🔔 Home: Received status_updated event, reloading data...');
    dev.log('   Data: $data');
    if (mounted) {
      _loadData();
    }
  }

  void _handleNotificationCreated(dynamic data) {
    dev.log('🔔 Home: Received notification_created event, reloading data...');
    dev.log('   Data: $data');
    if (mounted) {
      _loadData();
    }
  }

  void _handleMedicationSnoozed(dynamic data) {
    dev.log('🔔 Home: Received medication_snoozed_event, reloading data...');
    dev.log('   Data: $data');
    if (mounted) {
      _loadData();
    }
  }

  void _handleMedicationMissed(dynamic data) {
    dev.log('🔔 Home: Received medication_missed event, reloading data...');
    dev.log('   Data: $data');
    if (mounted) {
      _loadData();
    }
  }

  void _handleMedicationDeleted(dynamic data) {
    dev.log('🗑️ Home: Received medication_deleted event, reloading data...');
    dev.log('   Data: $data');
    if (mounted) {
      _loadData();
    }
  }

  void _handleAppointmentDeleted(dynamic data) {
    dev.log('🗑️ Home: Received appointment_deleted event, reloading data...');
    dev.log('   Data: $data');
    if (mounted) {
      _loadData();
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final modalRoute = ModalRoute.of(context);
    if (modalRoute != null) {
      routeObserver.subscribe(this, modalRoute);
    }
  }

  @override
  void dispose() {
    routeObserver.unsubscribe(this);
    _foregroundTimer?.cancel();
    // Unregister socket listeners
    dev.log('Cleaning up socket listeners in HomeScreen');
    SocketService.off('status_updated', _handleStatusUpdate);
    SocketService.off('notification_created', _handleNotificationCreated);
    SocketService.off('medication_snoozed_event', _handleMedicationSnoozed);
    SocketService.off('medication_missed', _handleMedicationMissed);
    SocketService.off('medication_deleted', _handleMedicationDeleted);
    SocketService.off('appointment_deleted', _handleAppointmentDeleted);
    super.dispose();
  }

  @override
  void didPopNext() {
    _loadData();
  }

  Future<void> _loadData() async {
    dev.log('=== _loadData called ===');
    setState(() {
      _isLoading = true;
      _isError = false;
    });
    try {
      dev.log('Fetching data from services...');
      final results = await Future.wait<dynamic>([
        ReminderService.getMyReminders(),
        HealthService.getMyHealthLogs(),
        NotificationService.getMyNotifications(),
        MedicationService.getMyMedications(),
        AppointmentService.getMyAppointments(),
      ]);

      dev.log('✅ Data fetched successfully');
      dev.log('   Reminders: ${(results[0] as List).length}');
      dev.log('   Health logs: ${(results[1] as List).length}');
      dev.log('   Notifications: ${(results[2] as List).length}');
      dev.log('   Medications: ${(results[3] as List).length}');
      dev.log('   Appointments: ${(results[4] as List).length}');

      // Debug: Log reminder details
      final reminders = results[0] as List<ReminderModel>;
      dev.log('=== REMINDER DETAILS ===');
      for (final reminder in reminders) {
        dev.log('Reminder ${reminder.id}: type=${reminder.type}, status=${reminder.status}, scheduledTime=${reminder.scheduledTime}, referenceId=${reminder.referenceId}');
      }

      // Debug: Log medication details
      final medications = results[3] as List<MedicationModel>;
      dev.log('=== MEDICATION DETAILS ===');
      for (final medication in medications) {
        dev.log('Medication ${medication.id}: name=${medication.medicationName}');
      }

      setState(() {
        _reminders = results[0] as List<ReminderModel>;
        final logs = results[1] as List<HealthLogModel>;
        if (logs.isNotEmpty) {
          _latestHealthLog = logs.first;
        }

        final List<NotificationModel> notifications =
            List<NotificationModel>.from(results[2]);
        _hasUnreadNotifications = notifications
            .any((n) => n.status != 'Read' && n.status != 'Acknowledged');

        _medications = results[3] as List<MedicationModel>;
        _appointments = results[4] as List<AppointmentModel>;

        _isLoading = false;
      });

      dev.log('Scheduling daily reminders...');
      LocalNotificationService.scheduleDailyReminders(
        _reminders.map((r) => r.toJson()).toList(),
        _medications.map((m) => m.toJson()).toList(),
        _appointments.map((a) => a.toJson()).toList(),
      ).catchError((error) {
        dev.log('❌ Notification schedule error: $error');
      });
      dev.log('=== _loadData complete ===');
    } catch (e) {
      dev.log('❌ Error loading data: $e');
      setState(() {
        _isLoading = false;
        _isError = true;
      });
    }
  }

  void _startForegroundTimer() {
    // Check every 10 seconds for more responsive alarm triggering
    _foregroundTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      _checkForDueMedication();
    });
    // Initial check after 2 seconds
    Future.delayed(const Duration(seconds: 2), () {
      _checkForDueMedication();
    });
  }

  void _checkForDueMedication() {
    if (!mounted) return;
    final now = DateTime.now();

    dev.log('Checking for due medications. Total medications: ${_medications.length}');

    // Check medication bằng cách duyệt trực tiếp _medications + scheduledTimes
    // Không phụ thuộc vào _reminders để tránh trường hợp reminder chưa được tạo
    for (final med in _medications) {
      // Kiểm tra thuốc có hiệu lực hôm nay không
      final today = DateTime(now.year, now.month, now.day);
      final startDay = DateTime(med.startDate.year, med.startDate.month, med.startDate.day);
      if (today.isBefore(startDay)) continue;
      if (med.endDate != null) {
        final endDay = DateTime(med.endDate!.year, med.endDate!.month, med.endDate!.day);
        if (today.isAfter(endDay)) continue;
      }

      // Kiểm tra nếu thuốc đang trong thời gian snooze
      if (_snoozedUntil.containsKey(med.id)) {
        final snoozeUntil = _snoozedUntil[med.id]!;
        if (now.isBefore(snoozeUntil)) {
          dev.log('Med ${med.medicationName} snoozed until $snoozeUntil, skipping');
          continue; // Bỏ qua thuốc này, chưa đến lúc nhắc lại
        } else {
          // Snooze đã hết hạn: xóa tracking và cho phép alarm hiện lại
          _snoozedUntil.remove(med.id);
          // Xóa các dialogKey cũ của thuốc này để alarm có thể hiện lại
          _shownDialogReminderIds.removeWhere((key) => key.startsWith('${med.id}_'));
          dev.log('Snooze expired for ${med.medicationName}, re-enabling alarm');
        }
      }

      // Parse scheduledTimes (hỗ trợ cả "HH:mm" và "12/30/1899 H:mm:ss AM/PM")
      final times = med.scheduledTimes.split(',').map((t) => t.trim()).where((t) => t.isNotEmpty);
      for (final timeStr in times) {
        int h = 0, m = 0;
        final oaMatch = RegExp(r'(\d{1,2}):(\d{2}):\d{2}\s*(AM|PM)', caseSensitive: false).firstMatch(timeStr);
        if (oaMatch != null) {
          h = int.tryParse(oaMatch.group(1)!) ?? 0;
          m = int.tryParse(oaMatch.group(2)!) ?? 0;
          final ampm = oaMatch.group(3)!.toUpperCase();
          if (ampm == 'PM' && h != 12) h += 12;
          if (ampm == 'AM' && h == 12) h = 0;
        } else {
          final parts = timeStr.split(':');
          if (parts.length < 2) continue;
          h = int.tryParse(parts[0]) ?? 0;
          m = int.tryParse(parts[1]) ?? 0;
        }

        // Tìm reminder tương ứng nếu có (cho phép lệch dưới 30 phút để hỗ trợ các lịch uống đã được hoãn)
        final ReminderModel? reminder = _reminders.cast<ReminderModel?>().firstWhere(
          (r) {
            if (r == null || r.type != ReminderType.medication) return false;
            if (r.referenceId != med.id) return false;
            final rt = r.scheduledTime.toLocal();
            if (rt.year != now.year || rt.month != now.month || rt.day != now.day) return false;
            final diff = (rt.hour * 60 + rt.minute - (h * 60 + m)).abs();
            return diff < 30;
          },
          orElse: () => null,
        );

        // Nếu tìm thấy reminder nhưng trạng thái đã là Đã uống (done) hoặc Bỏ lỡ (missed), bỏ qua không hiện chuông báo
        if (reminder != null && reminder.status != ReminderStatus.pending) {
          dev.log('Med ${med.medicationName} is not pending (status: ${reminder.status}), skipping alarm');
          continue;
        }

        final targetTime = reminder?.scheduledTime.toLocal() ?? DateTime(now.year, now.month, now.day, h, m);
        final diffSeconds = now.difference(targetTime).inSeconds;
        final diffMinutes = now.difference(targetTime).inMinutes;

        // Key duy nhất cho mỗi lần uống thuốc thực tế trong ngày
        final actualHour = targetTime.hour;
        final actualMinute = targetTime.minute;
        final dialogKey = '${med.id}_${actualHour}_${actualMinute}_${now.day}${now.month}${now.year}';

        dev.log('Med ${med.medicationName} at $actualHour:$actualMinute → diffSeconds=$diffSeconds, shown=${_shownDialogReminderIds.contains(dialogKey)}');

        if (diffSeconds >= 0 && diffMinutes <= 15 && !_shownDialogReminderIds.contains(dialogKey)) {
          dev.log('Showing medication alarm: ${med.medicationName} at $actualHour:$actualMinute');

          final actualReminder = reminder ?? ReminderModel(
            id: dialogKey,
            userId: med.userId,
            type: ReminderType.medication,
            referenceId: med.id,
            scheduledTime: targetTime,
            status: ReminderStatus.pending,
          );

          _shownDialogReminderIds.add(dialogKey);
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => MedicationReminderScreen(
                reminder: actualReminder,
                medication: med,
              ),
            ),
          ).then((result) {
            if (mounted) {
              if (result == 'snoozed') {
                // Giữ dialogKey trong _shownDialogReminderIds để tránh trigger liên tục
                // Thay vào đó track thời gian snooze hết hạn (5 phút)
                final snoozeExpiry = DateTime.now().add(const Duration(minutes: 5));
                _snoozedUntil[med.id] = snoozeExpiry;
                dev.log('Snooze: med ${med.medicationName} snoozed until $snoozeExpiry');
              }
              _loadData();
            }
          });
          return; // Chỉ show 1 alarm tại một thời điểm
        }
      }
    }

    for (final reminder in _reminders) {
      if (reminder.type != ReminderType.appointment) continue;
      if (reminder.status != ReminderStatus.pending) continue;
      if (_shownDialogReminderIds.contains(reminder.id)) continue;

      // Skip if appointment was deleted
      final appointmentExists = _appointments.any((a) => a.id == reminder.referenceId);
      if (!appointmentExists) {
        dev.log('Skipping appointment reminder ${reminder.id}: appointment not found (deleted)');
        continue;
      }

      final localTime = reminder.scheduledTime.toLocal();
      final diffMinutes = now.difference(localTime).inMinutes;
      final diffSeconds = now.difference(localTime).inSeconds;

      dev.log('Appointment reminder ${reminder.id}: diffSeconds=$diffSeconds, diffMinutes=$diffMinutes, scheduledTime=$localTime');

      // Show alarm only when time has arrived (0 seconds or after) and within 15 minutes
      if (diffSeconds >= 0 && diffMinutes <= 15) {
        dev.log('Showing appointment reminder: ${reminder.id}');
        final appointment = _appointments.firstWhere(
          (a) => a.id == reminder.referenceId,
        );
        _shownDialogReminderIds.add(reminder.id);
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => AppointmentReminderScreen(
              reminder: reminder,
              appointment: appointment,
            ),
          ),
        ).then((_) {
          if (mounted) _loadData();
        });
        break;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: RefreshIndicator(
        onRefresh: _loadData,
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(child: _buildHeader(context)),
            SliverToBoxAdapter(child: _buildGreeting()),
            SliverToBoxAdapter(
                child: _buildSectionTitle(
                  _isToday(_selectedDate)
                    ? '📅 Việc cần làm hôm nay'
                    : '📅 Việc ngày ${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                )),
            _buildTodayTasksSection(context),
            SliverToBoxAdapter(child: _buildMonthCalendar()),
            SliverToBoxAdapter(child: _buildSectionTitle('Chỉ số sức khoẻ')),
            SliverToBoxAdapter(child: _buildHealthCard(context)),
            const SliverToBoxAdapter(child: SizedBox(height: 24)),
          ],
        ),
      ),
    );
  }

  // ── HEADER ──
  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
      color: AppTheme.card,
      child: Row(
        children: [
          GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const EmergencyCallScreen(),
                ),
              );
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.dangerLight,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.danger.withOpacity(0.3)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  Icon(Icons.local_hospital_rounded,
                      color: AppTheme.danger, size: 18),
                  SizedBox(width: 6),
                  Text(
                    'GỌI HỖ TRỢ',
                    style: TextStyle(
                      color: AppTheme.danger,
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const Spacer(),
          // Logo CareLink ở giữa header
          // 
          const Spacer(),
          Stack(
            children: [
              GestureDetector(
                onTap: () async {
                  await Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) => const NotificationHistoryScreen()),
                  );
                  _loadData();
                },
                child: const Icon(Icons.notifications_none_rounded,
                    color: AppTheme.textPrimary, size: 28),
              ),
              if (_hasUnreadNotifications)
                Positioned(
                  top: 0,
                  right: 0,
                  child: Container(
                    width: 9,
                    height: 9,
                    decoration: const BoxDecoration(
                      color: AppTheme.danger,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 16),
          GestureDetector(
            onTap: () {},
            child: CircleAvatar(
              radius: 20,
              backgroundColor: AppTheme.primaryLight,
              backgroundImage: AuthService.currentUser?.avatarUrl != null
                  ? NetworkImage(
                      '${ApiService.serverUrl}${AuthService.currentUser!.avatarUrl}')
                  : null,
              child: AuthService.currentUser?.avatarUrl == null
                  ? Text(
                      AuthService.currentUser?.name
                              ?.substring(0, 1)
                              .toUpperCase() ??
                          'K',
                      style: const TextStyle(
                        color: AppTheme.primary,
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                      ),
                    )
                  : null,
            ),
          ),
        ],
      ),
    );
  }

  // ── GREETING ──
  Widget _buildGreeting() {
    return Container(
      color: AppTheme.card,
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
      child: Column(
        children: [
          Text(
            'CHÀO ${AuthService.currentUser?.name?.toUpperCase() ?? 'BẠN'}',
            style: const TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w900,
              color: AppTheme.textPrimary,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.border),
            ),
            child: Text(
              _todayLabel(),
              style: const TextStyle(
                fontSize: 14,
                color: AppTheme.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(height: 16),
          // AI Chat Button
          GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const HealthChatScreen(),
                ),
              );
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF6366F1).withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  Icon(Icons.psychology_rounded, color: Colors.white, size: 22),
                  SizedBox(width: 10),
                  Text(
                    'Tư vấn Sức khỏe AI',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      letterSpacing: 0.5,
                    ),
                  ),
                  SizedBox(width: 6),
                  Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 18),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── HELPERS ──
  bool _isToday(DateTime d) {
    final now = DateTime.now();
    return d.year == now.year && d.month == now.month && d.day == now.day;
  }

  bool _isSameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  bool _dayHasMed(DateTime day) {
    final d = DateTime(day.year, day.month, day.day);
    return _medications.any((med) {
      final start = DateTime(med.startDate.year, med.startDate.month, med.startDate.day);
      if (d.isBefore(start)) return false;
      if (med.endDate != null) {
        final end = DateTime(med.endDate!.year, med.endDate!.month, med.endDate!.day);
        if (d.isAfter(end)) return false;
      }
      return true;
    });
  }

  bool _dayHasApt(DateTime day) {
    return _appointments.any((apt) => _isSameDay(apt.appointmentDate.toLocal(), day));
  }

  // ── MONTH CALENDAR ──
  Widget _buildMonthCalendar() {
    final now = DateTime.now();
    final displayMonth = DateTime(now.year, now.month + _calendarMonthOffset, 1);
    final firstDay = DateTime(displayMonth.year, displayMonth.month, 1);
    final lastDay = DateTime(displayMonth.year, displayMonth.month + 1, 0);

    // Build grid: start from Monday
    final startWeekday = firstDay.weekday; // 1=Mon..7=Sun
    final leadingDays = startWeekday - 1;

    final List<DateTime?> cells = [];
    for (int i = 0; i < leadingDays; i++) cells.add(null);
    for (int d = 1; d <= lastDay.day; d++) {
      cells.add(DateTime(displayMonth.year, displayMonth.month, d));
    }
    // Pad to complete last row
    while (cells.length % 7 != 0) cells.add(null);

    const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Month navigation
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                GestureDetector(
                  onTap: () => setState(() => _calendarMonthOffset--),
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.chevron_left_rounded,
                        size: 20, color: AppTheme.textSecondary),
                  ),
                ),
                Text(
                  'Tháng ${displayMonth.month} / ${displayMonth.year}',
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
                GestureDetector(
                  onTap: () => setState(() => _calendarMonthOffset++),
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.chevron_right_rounded,
                        size: 20, color: AppTheme.textSecondary),
                  ),
                ),
              ],
            ),
          ),
          // Day-of-week headers
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Row(
              children: dayLabels.map((label) => Expanded(
                child: Center(
                  child: Text(
                    label,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ),
              )).toList(),
            ),
          ),
          const SizedBox(height: 4),
          // Calendar grid
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 0, 8, 12),
            child: Column(
              children: List.generate(cells.length ~/ 7, (rowIdx) {
                return Row(
                  children: List.generate(7, (colIdx) {
                    final cell = cells[rowIdx * 7 + colIdx];
                    if (cell == null) return const Expanded(child: SizedBox(height: 44));

                    final isSelected = _isSameDay(cell, _selectedDate);
                    final isToday = _isToday(cell);
                    final hasMed = _dayHasMed(cell);
                    final hasApt = _dayHasApt(cell);
                    final isCurrentMonth = cell.month == displayMonth.month;

                    return Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _selectedDate = cell),
                        child: Container(
                          height: 44,
                          margin: const EdgeInsets.all(2),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppTheme.primary
                                : isToday
                                    ? AppTheme.primaryLight
                                    : Colors.transparent,
                            borderRadius: BorderRadius.circular(10),
                            border: isToday && !isSelected
                                ? Border.all(color: AppTheme.primary, width: 1.5)
                                : null,
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                '${cell.day}',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: isSelected || isToday
                                      ? FontWeight.w700
                                      : FontWeight.w500,
                                  color: isSelected
                                      ? Colors.white
                                      : isCurrentMonth
                                          ? AppTheme.textPrimary
                                          : AppTheme.textMuted,
                                ),
                              ),
                              if ((hasMed || hasApt) && !isSelected)
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    if (hasMed)
                                      Container(
                                        width: 5,
                                        height: 5,
                                        margin: const EdgeInsets.only(top: 2, right: 1),
                                        decoration: const BoxDecoration(
                                          color: AppTheme.primary,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                    if (hasApt)
                                      Container(
                                        width: 5,
                                        height: 5,
                                        margin: const EdgeInsets.only(top: 2, left: 1),
                                        decoration: const BoxDecoration(
                                          color: Color(0xFF8B5CF6),
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                  ],
                                ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }),
                );
              }),
            ),
          ),
          // Legend
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Row(
              children: [
                Container(width: 8, height: 8,
                  decoration: const BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle)),
                const SizedBox(width: 4),
                const Text('Uống thuốc', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                const SizedBox(width: 12),
                Container(width: 8, height: 8,
                  decoration: const BoxDecoration(color: Color(0xFF8B5CF6), shape: BoxShape.circle)),
                const SizedBox(width: 4),
                const Text('Lịch khám', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── SECTION TITLE ──
  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w800,
          color: AppTheme.textPrimary,
        ),
      ),
    );
  }

  // ── VIỆC CẦN LÀM HÔM NAY ──
  Widget _buildTodayTasksSection(BuildContext context) {
    if (_isLoading) {
      return const SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(20.0),
            child: CircularProgressIndicator(),
          ),
        ),
      );
    }

    if (_isError) {
      return SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Không thể tải dữ liệu',
                  style: TextStyle(
                    fontSize: 16,
                    color: AppTheme.danger,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: _loadData,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    minimumSize: const Size(120, 44),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: const Text(
                    'Thử lại',
                    style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final now = DateTime.now();
    // Use selected date for filtering, fall back to today
    final sel = _selectedDate;
    final selStart = DateTime(sel.year, sel.month, sel.day);
    final selEnd = DateTime(sel.year, sel.month, sel.day, 23, 59, 59);

    dev.log('=== FILTERING TASKS FOR ${sel.day}/${sel.month}/${sel.year} ===');
    dev.log('Total reminders: ${_reminders.length}');
    dev.log('Total medications: ${_medications.length}');
    dev.log('Total appointments: ${_appointments.length}');

    final todayReminders = _reminders.where((r) {
      final localTime = r.scheduledTime.toLocal();
      final isOnDay = localTime.isAfter(
              selStart.subtract(const Duration(seconds: 1))) &&
          localTime.isBefore(selEnd.add(const Duration(seconds: 1))) &&
          r.status != ReminderStatus.done;

      dev.log('Checking reminder ${r.id}: type=${r.type}, isOnDay=$isOnDay, status=${r.status}, scheduledTime=${r.scheduledTime}');

      if (!isOnDay) return false;

      // Filter out reminders without corresponding medication/appointment
      if (r.type == ReminderType.medication) {
        final hasMatchingMedication = _medications.any((m) => m.id == r.referenceId);
        dev.log('Medication reminder ${r.id}: referenceId=${r.referenceId}, hasMatchingMedication=$hasMatchingMedication');
        if (!hasMatchingMedication) {
          dev.log('Available medication IDs: ${_medications.map((m) => m.id).toList()}');
        }
        return hasMatchingMedication;
      } else if (r.type == ReminderType.appointment) {
        final hasMatchingAppointment = _appointments.any((a) => a.id == r.referenceId);
        dev.log('Appointment reminder ${r.id}: referenceId=${r.referenceId}, hasMatchingAppointment=$hasMatchingAppointment');
        return hasMatchingAppointment;
      }

      return true;
    }).toList();

    // Sort by time: ascending order
    todayReminders.sort((a, b) => a.scheduledTime.compareTo(b.scheduledTime));

    dev.log('=== FILTERED RESULTS ===');
    dev.log('Today\'s reminders count: ${todayReminders.length}');
    for (final reminder in todayReminders) {
      dev.log('Today reminder: ${reminder.id} (${reminder.type}) - ${reminder.scheduledTime}');
    }

    // Medications active on selected date (by startDate/endDate) shown regardless of reminders
    final today = selStart;
    final todayMeds = _medications.where((med) {
      final startDay = DateTime(med.startDate.year, med.startDate.month, med.startDate.day);
      if (today.isBefore(startDay)) return false;
      if (med.endDate != null) {
        final endDay = DateTime(med.endDate!.year, med.endDate!.month, med.endDate!.day);
        if (today.isAfter(endDay)) return false;
      }
      return true;
    }).toList();

    // Build medication items from scheduledTimes (for meds active today)
    final List<Widget> medItems = [];
    for (final med in todayMeds) {
      final times = med.scheduledTimes
          .split(',')
          .map((t) => t.trim())
          .where((t) => t.isNotEmpty)
          .toList();
      for (final timeStr in times) {
        // Parse cả format "HH:mm" lẫn "12/30/1899 H:mm:ss AM/PM" (OADate từ Excel)
        int h = 0, m = 0;
        final oaMatch = RegExp(r'(\d{1,2}):(\d{2}):\d{2}\s*(AM|PM)', caseSensitive: false).firstMatch(timeStr);
        if (oaMatch != null) {
          h = int.tryParse(oaMatch.group(1)!) ?? 0;
          m = int.tryParse(oaMatch.group(2)!) ?? 0;
          final ampm = oaMatch.group(3)!.toUpperCase();
          if (ampm == 'PM' && h != 12) h += 12;
          if (ampm == 'AM' && h == 12) h = 0;
        } else {
          final parts = timeStr.split(':');
          if (parts.length < 2) continue;
          h = int.tryParse(parts[0]) ?? 0;
          m = int.tryParse(parts[1]) ?? 0;
        }
        // Find matching reminder for status (allow up to 30 mins difference to handle snoozed times)
        final matchingReminder = _reminders.cast<ReminderModel?>().firstWhere(
          (r) {
            if (r == null || r.type != ReminderType.medication) return false;
            if (r.referenceId != med.id) return false;
            final rt = r.scheduledTime.toLocal();
            if (rt.year != sel.year || rt.month != sel.month || rt.day != sel.day) return false;
            final diffMinutes = (rt.hour * 60 + rt.minute - (h * 60 + m)).abs();
            return diffMinutes < 30;
          },
          orElse: () => null,
        );

        // Skip if already done
        if (matchingReminder?.status == ReminderStatus.done) continue;

        // Use actual reminder time if available, otherwise use static slot time
        String displayTime;
        if (matchingReminder != null) {
          final rt = matchingReminder.scheduledTime.toLocal();
          final rHour = rt.hour;
          final rMinute = rt.minute;
          final rHour12 = rHour == 0 ? 12 : (rHour > 12 ? rHour - 12 : rHour);
          final rAmpm = rHour >= 12 ? 'CH' : 'SA';
          displayTime = '${rHour12.toString().padLeft(2, '0')}:${rMinute.toString().padLeft(2, '0')} $rAmpm';
        } else {
          final hour12 = h == 0 ? 12 : (h > 12 ? h - 12 : h);
          final ampm = h >= 12 ? 'CH' : 'SA';
          displayTime = '${hour12.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')} $ampm';
        }

        medItems.add(Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _TodayTaskItem(
            icon: Icons.medication_rounded,
            iconColor: AppTheme.primary,
            title: med.medicationName,
            time: displayTime,
            extraInfo: med.dosage,
            onTap: () {
              // Tìm reminder khớp, nếu không có thì tạo placeholder
              final ReminderModel reminder = matchingReminder ?? ReminderModel(
                id: '${med.id}_${h}_${m}',
                userId: med.userId,
                type: ReminderType.medication,
                referenceId: med.id,
                scheduledTime: DateTime(sel.year, sel.month, sel.day, h, m),
                status: ReminderStatus.pending,
              );
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => MedicationReminderScreen(
                    reminder: reminder,
                    medication: med,
                  ),
                ),
              ).then((_) => _loadData());
            },
          ),
        ));
      }
    }

    // Appointments on selected date — filter directly from _appointments by date
    final todayApts = _appointments.where((apt) {
      final aptDay = DateTime(apt.appointmentDate.toLocal().year, apt.appointmentDate.toLocal().month, apt.appointmentDate.toLocal().day);
      return aptDay == selStart;
    }).toList();

    final List<Widget> apptItems = todayApts.map((apt) {
      final local = apt.appointmentDate.toLocal();
      final h = local.hour;
      final m = local.minute;
      final hour12 = h == 0 ? 12 : (h > 12 ? h - 12 : h);
      final ampm = h >= 12 ? 'CH' : 'SA';
      final timeStr = '${hour12.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')} $ampm';

      // Find matching reminder if available
      final matchingReminder = _reminders.cast<ReminderModel?>().firstWhere(
        (r) => r != null && r.type == ReminderType.appointment && r.referenceId == apt.id,
        orElse: () => null,
      );

      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: _TodayTaskItem(
          icon: Icons.calendar_month_rounded,
          iconColor: const Color(0xFF8B5CF6),
          title: apt.doctorName.startsWith('Khám')
              ? apt.doctorName
              : 'Khám bác sĩ ${apt.doctorName}',
          time: timeStr,
          extraInfo: apt.location,
          onTap: matchingReminder != null
              ? () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => AppointmentReminderScreen(
                        reminder: matchingReminder,
                        appointment: apt,
                      ),
                    ),
                  );
                }
              : null,
        ),
      );
    }).toList();

    final allItems = [...medItems, ...apptItems];

    if (allItems.isEmpty) {
      return const SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(20.0),
            child: Text(
              'Hôm nay không có việc gì 🎉',
              style: TextStyle(
                fontSize: 16,
                color: AppTheme.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ),
      );
    }

    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(children: allItems),
      ),
    );
  }

  // ── CHỈ SỐ SỨC KHOẺ ──
  Widget _buildHealthCard(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: GestureDetector(
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const HealthDetailScreen()),
        ),
        child: Container(
          decoration: BoxDecoration(
            color: AppTheme.card,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppTheme.border),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 12,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(20),
                  bottomLeft: Radius.circular(20),
                ),
                child: Container(
                  width: 120,
                  height: 120,
                  color: AppTheme.primaryLight,
                  child: const Icon(
                    Icons.monitor_heart_rounded,
                    color: AppTheme.primary,
                    size: 56,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Chỉ số huyết áp',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _latestHealthLog != null
                            ? 'Lần đo gần nhất: ${_latestHealthLog!.date?.day}/${_latestHealthLog!.date?.month}'
                            : 'Chưa có dữ liệu đo',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.arrow_forward_rounded,
                              color: AppTheme.secondary, size: 16),
                          const SizedBox(width: 4),
                          Text(
                            _latestHealthLog != null &&
                                    _latestHealthLog!.bloodPressure != null
                                ? 'Ổn định (${_latestHealthLog!.bloodPressure})'
                                : 'Hãy cập nhật chỉ số',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.secondary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Xem chi tiết',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppTheme.textMuted,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const Padding(
                padding: EdgeInsets.only(right: 8),
                child: Icon(Icons.chevron_right_rounded,
                    color: AppTheme.textMuted),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _todayLabel() {
    final now = DateTime.now();
    const weekdays = [
      'thứ hai', 'thứ ba', 'thứ tư', 'thứ năm',
      'thứ sáu', 'thứ bảy', 'chủ nhật'
    ];
    final weekday = weekdays[now.weekday - 1];
    return 'Hôm nay là $weekday, ${now.day} tháng ${now.month}';
  }
}

// ─────────────────────────────────────────────
// TODAY TASK ITEM
// ─────────────────────────────────────────────
class _TodayTaskItem extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String time;
  final String extraInfo;
  final VoidCallback? onTap;

  const _TodayTaskItem({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.time,
    required this.extraInfo,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: AppTheme.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    extraInfo,
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppTheme.primaryLight,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                time,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}