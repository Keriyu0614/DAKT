import 'package:flutter/material.dart';
import '../main.dart';
import '../widgets/reminder_card.dart';
import '../services/notification_service.dart';
import '../models/notification_model.dart';
import 'package:intl/intl.dart';

class NotificationHistoryScreen extends StatefulWidget {
  const NotificationHistoryScreen({super.key});

  @override
  State<NotificationHistoryScreen> createState() => _NotificationHistoryScreenState();
}

class _NotificationHistoryScreenState extends State<NotificationHistoryScreen> {
  List<NotificationModel> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() => _isLoading = true);
    final notifications = await NotificationService.getMyNotifications();
    setState(() {
      _notifications = notifications;
      _isLoading = false;
    });
  }

  Map<String, List<NotificationModel>> _groupNotificationsByDate() {
    final Map<String, List<NotificationModel>> grouped = {};
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));

    for (var notification in _notifications) {
      final date = DateTime(notification.sentAt.year, notification.sentAt.month, notification.sentAt.day);
      String label;
      if (date == today) {
        label = 'Hôm nay — ${DateFormat('dd/MM/yyyy').format(date)}';
      } else if (date == yesterday) {
        label = 'Hôm qua — ${DateFormat('dd/MM/yyyy').format(date)}';
      } else {
        label = DateFormat('dd/MM/yyyy').format(date);
      }

      if (!grouped.containsKey(label)) {
        grouped[label] = [];
      }
      grouped[label]!.add(notification);
    }
    return grouped;
  }

  @override
  Widget build(BuildContext context) {
    final groupedNotifications = _groupNotificationsByDate();

    return Scaffold(
      backgroundColor: AppTheme.surface,
      appBar: AppBar(
        title: const Text('Lịch sử thông báo'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          TextButton(
            onPressed: () async {
              final success = await NotificationService.markAllAsRead();
              if (success) {
                _loadNotifications();
              }
            },
            child: const Text(
              'Đã đọc',
              style: TextStyle(
                color: AppTheme.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadNotifications,
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _notifications.isEmpty
                  ? const Center(child: Text('Không có thông báo nào'))
                  : ListView(
                      padding: const EdgeInsets.all(20),
                      children: groupedNotifications.entries.map((entry) {
                        return _DaySection(
                          label: entry.key,
                          items: entry.value.map((notification) {
                            return ReminderCard(
                              icon: notification.title.contains('thuốc') 
                                ? Icons.medication_rounded 
                                : Icons.calendar_month_rounded,
                              iconColor: notification.priority == 'High' || notification.priority == 'Critical'
                                ? AppTheme.danger
                                : AppTheme.primary,
                              iconBg: notification.priority == 'High' || notification.priority == 'Critical'
                                ? AppTheme.dangerLight
                                : AppTheme.primaryLight,
                              title: notification.title,
                              subtitle: notification.message,
                              time: DateFormat('HH:mm').format(notification.sentAt),
                              status: notification.status == 'Read' || notification.status == 'Acknowledged'
                                ? ReminderStatus.done
                                : ReminderStatus.pending,
                              onTap: () async {
                                if (notification.status != 'Read' && notification.status != 'Acknowledged') {
                                  await NotificationService.markAsRead(notification.id);
                                  _loadNotifications();
                                }
                              },
                            );
                          }).toList(),
                        );
                      }).toList(),
                    ),
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
