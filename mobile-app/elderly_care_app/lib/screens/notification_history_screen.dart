import 'package:flutter/material.dart';
import '../main.dart';
import '../widgets/reminder_card.dart';

class NotificationHistoryScreen extends StatelessWidget {
  const NotificationHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surface,
      appBar: AppBar(
        title: const Text('Lịch sử thông báo'),
        automaticallyImplyLeading: false,
        actions: [
          TextButton(
            onPressed: () {},
            child: const Text(
              'Xoá tất cả',
              style: TextStyle(
                color: AppTheme.danger,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _DaySection(
              label: 'Hôm nay — 02/05/2025',
              items: [
                ReminderCard(
                  icon: Icons.medication_rounded,
                  iconColor: AppTheme.secondary,
                  iconBg: AppTheme.secondaryLight,
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
                  iconColor: AppTheme.primary,
                  iconBg: AppTheme.primaryLight,
                  title: 'Nhắc tái khám ngày mai',
                  subtitle: 'BV Chợ Rẫy — BS. Nguyễn Văn An',
                  time: '09:00',
                  status: ReminderStatus.upcoming,
                ),
              ],
            ),
            _DaySection(
              label: 'Hôm qua — 01/05/2025',
              items: [
                ReminderCard(
                  icon: Icons.medication_rounded,
                  iconColor: AppTheme.secondary,
                  iconBg: AppTheme.secondaryLight,
                  title: 'Amlodipine 5mg',
                  subtitle: 'Uống sau bữa sáng',
                  time: '07:30',
                  status: ReminderStatus.done,
                ),
                ReminderCard(
                  icon: Icons.medication_rounded,
                  iconColor: AppTheme.danger,
                  iconBg: AppTheme.dangerLight,
                  title: 'Metformin 500mg',
                  subtitle: 'Uống sau bữa trưa',
                  time: '12:00',
                  status: ReminderStatus.missed,
                ),
                ReminderCard(
                  icon: Icons.medication_rounded,
                  iconColor: AppTheme.secondary,
                  iconBg: AppTheme.secondaryLight,
                  title: 'Amlodipine 5mg',
                  subtitle: 'Uống sau bữa tối',
                  time: '19:00',
                  status: ReminderStatus.done,
                ),
              ],
            ),
            _DaySection(
              label: '30/04/2025',
              items: [
                ReminderCard(
                  icon: Icons.medication_rounded,
                  iconColor: AppTheme.secondary,
                  iconBg: AppTheme.secondaryLight,
                  title: 'Amlodipine 5mg',
                  subtitle: 'Uống sau bữa sáng',
                  time: '07:30',
                  status: ReminderStatus.done,
                ),
                ReminderCard(
                  icon: Icons.local_hospital_rounded,
                  iconColor: AppTheme.secondary,
                  iconBg: AppTheme.secondaryLight,
                  title: 'Tái khám tiêu hoá',
                  subtitle: 'BV 115 — BS. Trần Thị Mai',
                  time: '10:00',
                  status: ReminderStatus.done,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DaySection extends StatelessWidget {
  final String label;
  final List<Widget> items;
  const _DaySection({required this.label, required this.items});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 12, top: 4),
          child: Row(
            children: [
              Container(
                width: 4,
                height: 16,
                decoration: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textSecondary,
                ),
              ),
            ],
          ),
        ),
        ...items,
        const SizedBox(height: 8),
      ],
    );
  }
}
