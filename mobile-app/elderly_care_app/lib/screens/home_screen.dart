import 'package:flutter/material.dart';
import '../main.dart';
import '../widgets/reminder_card.dart';
import '../widgets/health_summary_card.dart';
import '../widgets/upcoming_appointment_card.dart';
import 'appointment_detail_screen.dart';
import 'health_detail_screen.dart';
import 'notification_history_screen.dart';
import 'medication_reminder_screen.dart';
import 'appointment_reminder_screen.dart';

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
          const NotificationHistoryScreen(),
          const HealthDetailScreen(),
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
              _navItem(0, Icons.home_rounded, 'Trang chủ'),
              _navItem(1, Icons.notifications_rounded, 'Thông báo'),
              _navItem(2, Icons.favorite_rounded, 'Sức khoẻ'),
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
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: isActive ? AppTheme.primaryLight : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: isActive ? AppTheme.primary : AppTheme.textMuted,
              size: 26,
            ),
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
// HOME TAB CONTENT
// ─────────────────────────────────────────────
class _HomeTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: CustomScrollView(
        slivers: [
          // Header
          SliverToBoxAdapter(child: _buildHeader(context)),

          // Quick actions — demo buttons to navigate to notification screens
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
              child: Row(
                children: [
                  Expanded(
                    child: _QuickActionButton(
                      icon: Icons.medication_rounded,
                      label: 'Nhắc uống\nthuốc',
                      color: AppTheme.primary,
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const MedicationReminderScreen()),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _QuickActionButton(
                      icon: Icons.calendar_month_rounded,
                      label: 'Nhắc tái\nkhám',
                      color: AppTheme.secondary,
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const AppointmentReminderScreen()),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Today's reminders
          SliverToBoxAdapter(
            child: _SectionTitle(
              title: 'Nhắc nhở hôm nay',
              trailing: 'Xem tất cả',
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const NotificationHistoryScreen()),
              ),
            ),
          ),
          SliverList(
            delegate: SliverChildListDelegate([
              ReminderCard(
                icon: Icons.medication_rounded,
                iconColor: AppTheme.primary,
                iconBg: AppTheme.primaryLight,
                title: 'Amlodipine 5mg',
                subtitle: 'Uống sau bữa sáng',
                time: '07:30',
                status: ReminderStatus.done,
              ),
              ReminderCard(
                icon: Icons.medication_rounded,
                iconColor: AppTheme.warning,
                iconBg: AppTheme.warningLight,
                title: 'Metformin 500mg',
                subtitle: 'Uống sau bữa trưa',
                time: '12:00',
                status: ReminderStatus.pending,
              ),
              ReminderCard(
                icon: Icons.local_hospital_rounded,
                iconColor: AppTheme.secondary,
                iconBg: AppTheme.secondaryLight,
                title: 'Tái khám tim mạch',
                subtitle: 'BV Chợ Rẫy — BS. Nguyễn Văn An',
                time: 'Ngày mai 09:00',
                status: ReminderStatus.upcoming,
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AppointmentDetailScreen()),
                ),
              ),
            ]),
          ),

          // Upcoming appointment
          SliverToBoxAdapter(
            child: _SectionTitle(title: 'Lịch khám sắp tới', trailing: 'Chi tiết'),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: UpcomingAppointmentCard(
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AppointmentDetailScreen()),
                ),
              ),
            ),
          ),

          // Health summary
          SliverToBoxAdapter(
            child: _SectionTitle(
              title: 'Sức khoẻ hôm nay',
              trailing: 'Chi tiết',
              onTap: () {},
            ),
          ),
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(20, 0, 20, 24),
              child: HealthSummaryCard(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _greeting(),
                  style: const TextStyle(
                    fontSize: 15,
                    color: AppTheme.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Ông Nguyễn Văn Bình',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          Stack(
            children: [
              GestureDetector(
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => const NotificationHistoryScreen()),
                ),
                child: Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: AppTheme.card,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.06),
                        blurRadius: 12,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Icon(Icons.notifications_none_rounded,
                      color: AppTheme.textPrimary, size: 26),
                ),
              ),
              Positioned(
                top: 10,
                right: 10,
                child: Container(
                  width: 10,
                  height: 10,
                  decoration: const BoxDecoration(
                    color: AppTheme.danger,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Chào buổi sáng 🌤';
    if (hour < 18) return 'Chào buổi chiều ☀️';
    return 'Chào buổi tối 🌙';
  }
}

// ─────────────────────────────────────────────
// QUICK ACTION BUTTON
// ─────────────────────────────────────────────
class _QuickActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [color, color.withOpacity(0.8)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.3),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: Colors.white, size: 32),
            const SizedBox(height: 12),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w700,
                height: 1.3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// SECTION TITLE
// ─────────────────────────────────────────────
class _SectionTitle extends StatelessWidget {
  final String title;
  final String? trailing;
  final VoidCallback? onTap;

  const _SectionTitle({required this.title, this.trailing, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 19,
              fontWeight: FontWeight.w800,
              color: AppTheme.textPrimary,
            ),
          ),
          if (trailing != null)
            GestureDetector(
              onTap: onTap,
              child: Text(
                trailing!,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.primary,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
