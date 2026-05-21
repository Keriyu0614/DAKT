import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../main.dart';
//import '../widgets/reminder_card.dart';
import 'appointment_detail_screen.dart';
import 'health_detail_screen.dart';
import 'notification_history_screen.dart';
import 'medication_reminder_screen.dart';
import 'appointment_reminder_screen.dart';
import 'profile_screen.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../services/reminder_service.dart';
import '../services/health_service.dart';
import '../services/appointment_service.dart';
import '../services/medication_service.dart';
import '../models/reminder_model.dart';
import '../models/health_log_model.dart';
import '../models/appointment_model.dart';
import '../models/medication_model.dart';
import '../services/notification_service.dart';
import '../models/notification_model.dart';
import '../services/socket_service.dart';
import '../services/local_notification_service.dart';
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
  bool _medicationTaken = false;
  List<ReminderModel> _reminders = [];
  List<MedicationModel> _medications = [];
  List<AppointmentModel> _appointments = [];
  HealthLogModel? _latestHealthLog;
  bool _isLoading = true;
  bool _isError = false;
  bool _hasUnreadNotifications = false;
  Timer? _foregroundTimer;
  final Set<String> _shownDialogReminderIds = {};

  @override
  void initState() {
    super.initState();
    _loadData();
    _startForegroundTimer();
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
    super.dispose();
  }

  @override
  void didPopNext() {
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _isError = false;
    });
    try {
      final results = await Future.wait<dynamic>([
        ReminderService.getMyReminders(),
        HealthService.getMyHealthLogs(),
        NotificationService.getMyNotifications(),
        MedicationService.getMyMedications(),
        AppointmentService.getMyAppointments(),
      ]);

      setState(() {
        _reminders = results[0] as List<ReminderModel>;
        final logs = results[1] as List<HealthLogModel>;
        if (logs.isNotEmpty) {
          _latestHealthLog = logs.first;
        }
        
        final List<NotificationModel> notifications = List<NotificationModel>.from(results[2]);
        _hasUnreadNotifications = notifications.any((n) => n.status != 'Read' && n.status != 'Acknowledged');
        
        _medications = results[3] as List<MedicationModel>;
        _appointments = results[4] as List<AppointmentModel>;
        
        _isLoading = false;
      });

      // Pre-schedule local notifications for today's medication reminders
      _scheduleNotifications();
    } catch (e) {
      print('Error loading data: $e');
      setState(() {
        _isLoading = false;
        _isError = true;
      });
    }
  }

  void _scheduleNotifications() {
    try {
      final reminderJsonList = _reminders.map((r) => r.toJson()).toList();
      final medJsonList = _medications.map((m) => m.toJson()).toList();
      // Adapt medication JSON keys for the notification service
      final adaptedMedJsonList = medJsonList.map((m) => {
        'id': m['id'],
        'name': m['medicationName'],
        'dosage': {'amount': m['dosage'], 'unit': ''},
      }).toList();
      LocalNotificationService.scheduleDailyReminders(reminderJsonList, adaptedMedJsonList);
    } catch (e) {
      print('Error scheduling notifications: $e');
    }
  }

  void _startForegroundTimer() {
    _foregroundTimer = Timer.periodic(const Duration(minutes: 1), (_) {
      _checkForDueMedication();
    });
    // Also check immediately
    Future.delayed(const Duration(seconds: 3), () {
      _checkForDueMedication();
    });
  }

  void _checkForDueMedication() {
    if (!mounted) return;
    final now = DateTime.now();

    for (final reminder in _reminders) {
      if (reminder.type != ReminderType.medication) continue;
      if (reminder.status != ReminderStatus.pending) continue;
      if (_shownDialogReminderIds.contains(reminder.id)) continue;

      final localTime = reminder.scheduledTime.toLocal();
      final diffMinutes = now.difference(localTime).inMinutes;

      // Show dialog if due (within -1 to +15 minutes window)
      if (diffMinutes >= -1 && diffMinutes <= 15) {
        final medication = _medications.firstWhere(
          (m) => m.id == reminder.referenceId,
          orElse: () => MedicationModel(
            id: '', userId: '',
            medicationName: 'Thuốc',
            dosage: '', frequency: '',
            scheduledTimes: '',
            startDate: DateTime.now(),
          ),
        );
        _shownDialogReminderIds.add(reminder.id);
        _showMedicationDialog(reminder, medication);
        break; // Show one at a time
      }
    }
  }

  void _showMedicationDialog(ReminderModel reminder, MedicationModel medication) {
    if (!mounted) return;
    final localTime = reminder.scheduledTime.toLocal();
    final timeStr = '${localTime.hour.toString().padLeft(2, '0')}:${localTime.minute.toString().padLeft(2, '0')}';

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.medication_rounded, color: AppTheme.primary, size: 28),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Text('Đến giờ uống thuốc!', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _dialogInfoRow('Thuốc:', medication.medicationName),
            const SizedBox(height: 8),
            _dialogInfoRow('Liều lượng:', medication.dosage),
            const SizedBox(height: 8),
            _dialogInfoRow('Thời gian:', timeStr),
            if (medication.instructions != null && medication.instructions!.isNotEmpty) ...[
              const SizedBox(height: 8),
              _dialogInfoRow('Ghi chú:', medication.instructions!),
            ],
          ],
        ),
        actionsAlignment: MainAxisAlignment.spaceEvenly,
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              // Snooze: re-trigger the dialog after 5 minutes
              _shownDialogReminderIds.remove(reminder.id);
              Timer(const Duration(minutes: 5), () {
                if (mounted) {
                  _showMedicationDialog(reminder, medication);
                }
              });
            },
            child: const Text('Nhắc lại sau', style: TextStyle(color: AppTheme.warning, fontWeight: FontWeight.w700, fontSize: 16)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              SocketService.emitMedicationTaken(reminder.id);
              setState(() {
                _reminders = _reminders.map((r) {
                  if (r.id == reminder.id) {
                    return ReminderModel(
                      id: r.id, userId: r.userId, type: r.type,
                      referenceId: r.referenceId,
                      scheduledTime: r.scheduledTime,
                      status: ReminderStatus.done,
                    );
                  }
                  return r;
                }).toList();
              });
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.secondary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Đã uống xong', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
          ),
        ],
      ),
    );
  }

  Widget _dialogInfoRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 90,
          child: Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
        ),
        Expanded(
          child: Text(value, style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: RefreshIndicator(
        onRefresh: _loadData,
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(child: _buildHeader(context)),
            SliverToBoxAdapter(child: _buildMedicationButton()),
            SliverToBoxAdapter(child: _buildSectionTitle('📅 Việc cần làm hôm nay')),
            _buildTodayTasksSection(context),
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
          // Nút gọi hỗ trợ
          GestureDetector(
            onTap: () {},
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
          // Chuông thông báo
          Stack(
            children: [
              GestureDetector(
                onTap: () async {
                  await Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) => const NotificationHistoryScreen()),
                  );
                  _loadData(); // Refresh unread status when returning
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
          // Avatar
          GestureDetector(
            onTap: () {
              // Optional: navigate to profile
            },
            child: CircleAvatar(
              radius: 20,
              backgroundColor: AppTheme.primaryLight,
              backgroundImage: AuthService.currentUser?.avatarUrl != null
                  ? NetworkImage('${ApiService.serverUrl}${AuthService.currentUser!.avatarUrl}')
                  : null,
              child: AuthService.currentUser?.avatarUrl == null
                  ? Text(
                      AuthService.currentUser?.name?.substring(0, 1).toUpperCase() ?? 'K',
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

  // ── GREETING + NÚT UỐNG THUỐC ──
  Widget _buildMedicationButton() {
    return Container(
      color: AppTheme.card,
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
      child: Column(
        children: [
          // Chào
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
          // Ngày
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
          const SizedBox(height: 20),
          // Nút uống thuốc
          GestureDetector(
            onTap: () => setState(() => _medicationTaken = !_medicationTaken),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: _medicationTaken
                      ? [const Color(0xFF10B981), const Color(0xFF059669)]
                      : [const Color(0xFF38BDF8), const Color(0xFF2563EB)],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: (_medicationTaken
                            ? AppTheme.secondary
                            : AppTheme.primary)
                        .withOpacity(0.35),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    _medicationTaken
                        ? Icons.check_circle_rounded
                        : Icons.check_circle_outline_rounded,
                    color: Colors.white,
                    size: 32,
                  ),
                  const SizedBox(width: 12),
                  Text(
                    _medicationTaken ? 'Đã uống thuốc ✓' : 'Tôi đã uống thuốc',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
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
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    final todayEnd = DateTime(now.year, now.month, now.day, 23, 59, 59);

    final todayReminders = _reminders.where((r) {
      final localTime = r.scheduledTime.toLocal();
      return localTime.isAfter(todayStart.subtract(const Duration(seconds: 1))) &&
             localTime.isBefore(todayEnd.add(const Duration(seconds: 1))) &&
             r.status != ReminderStatus.done;
    }).toList();

    // Sort ascending
    todayReminders.sort((a, b) => a.scheduledTime.compareTo(b.scheduledTime));

    if (todayReminders.isEmpty) {
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
        child: Column(
          children: todayReminders.map((reminder) {
            final localTime = reminder.scheduledTime.toLocal();
            final timeStr = '${localTime.hour.toString().padLeft(2, '0')}:${localTime.minute.toString().padLeft(2, '0')}';
            
            if (reminder.type == ReminderType.medication) {
              // Find medication details
              final medication = _medications.firstWhere(
                (m) => m.id == reminder.referenceId,
                orElse: () => MedicationModel(
                  id: '',
                  userId: '',
                  medicationName: 'Uống thuốc',
                  dosage: 'Đến giờ uống thuốc',
                  frequency: '',
                  scheduledTimes: '',
                  startDate: DateTime.now(),
                ),
              );

              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _TodayTaskItem(
                  icon: Icons.medication_rounded,
                  iconColor: AppTheme.primary,
                  title: medication.medicationName,
                  time: timeStr,
                  extraInfo: medication.dosage,
                  onTap: () async {
                    await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => MedicationReminderScreen(
                          reminder: reminder,
                          medication: medication,
                        ),
                      ),
                    );
                    _loadData();
                  },
                ),
              );
            } else {
              // Find appointment details
              final appointment = _appointments.firstWhere(
                (a) => a.id == reminder.referenceId,
                orElse: () => AppointmentModel(
                  id: '',
                  userId: '',
                  doctorName: 'Lịch khám',
                  location: 'Xem chi tiết lịch hẹn',
                  appointmentDate: DateTime.now(),
                ),
              );

              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _TodayTaskItem(
                  icon: Icons.calendar_month_rounded,
                  iconColor: const Color(0xFF8B5CF6),
                  title: appointment.doctorName.startsWith('Khám') 
                      ? appointment.doctorName 
                      : 'Khám bác sĩ ${appointment.doctorName}',
                  time: timeStr,
                  extraInfo: appointment.location,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const AppointmentReminderScreen()),
                    );
                  },
                ),
              );
            }
          }).toList(),
        ),
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
              // Ảnh máy đo huyết áp
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
                            _latestHealthLog != null && _latestHealthLog!.bloodPressure != null
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
      'thứ hai', 'thứ ba', 'thứ tư',
      'thứ năm', 'thứ sáu', 'thứ bảy', 'chủ nhật'
    ];
    final weekday = weekdays[now.weekday - 1];
    return 'Hôm nay là $weekday, ${now.day} tháng ${now.month}';
  }
}

// ─────────────────────────────────────────────
// TASK CARD
// ─────────────────────────────────────────────
class _TaskCard extends StatelessWidget {
  final String emoji;
  final String badge;
  final Color badgeColor;
  final Color? badgeTextColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _TaskCard({
    required this.emoji,
    required this.badge,
    required this.badgeColor,
    this.badgeTextColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isLight = badgeTextColor != null;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.card,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppTheme.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(emoji, style: const TextStyle(fontSize: 28)),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: badgeColor,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    badge,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: isLight ? badgeTextColor : Colors.white,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 12,
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Xem chi tiết',
              style: TextStyle(
                fontSize: 12,
                color: AppTheme.textMuted,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
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
  final VoidCallback onTap;

  const _TodayTaskItem({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.time,
    required this.extraInfo,
    required this.onTap,
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
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
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