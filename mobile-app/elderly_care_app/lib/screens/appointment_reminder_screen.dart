import 'package:flutter/material.dart';
import 'package:flutter_ringtone_player/flutter_ringtone_player.dart';
import 'package:vibration/vibration.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../main.dart';
import '../models/appointment_model.dart';
import '../models/reminder_model.dart';
import '../services/socket_service.dart';

class AppointmentReminderScreen extends StatefulWidget {
  final ReminderModel reminder;
  final AppointmentModel appointment;

  const AppointmentReminderScreen({
    super.key,
    required this.reminder,
    required this.appointment,
  });

  @override
  State<AppointmentReminderScreen> createState() =>
      _AppointmentReminderScreenState();
}

class _AppointmentReminderScreenState extends State<AppointmentReminderScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnim;
  bool _acknowledged = false;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 1.0, end: 1.07).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    _startAlarm();
  }

  Future<void> _startAlarm() async {
    if (widget.reminder != null) {
      final notifyId = widget.reminder.id.hashCode + 1000000;
      await FlutterLocalNotificationsPlugin().cancel(notifyId);
    }

    FlutterRingtonePlayer().playAlarm(looping: true);

    final bool? hasVibrator = await Vibration.hasVibrator();
    if (hasVibrator == true) {
      Vibration.vibrate(pattern: [1000, 1000], repeat: 0);
    }
  }

  @override
  void dispose() {
    _stopAlarm();
    _pulseController.dispose();
    super.dispose();
  }

  void _stopAlarm() {
    FlutterRingtonePlayer().stop();
    Vibration.cancel();
  }

  String _formatAppointmentDate(DateTime dateTime) {
    final local = dateTime.toLocal();
    final hour = local.hour % 12 == 0 ? 12 : local.hour % 12;
    final minute = local.minute.toString().padLeft(2, '0');
    final ampm = local.hour >= 12 ? 'CH' : 'SA';
    return '${local.day.toString().padLeft(2, '0')}/${local.month.toString().padLeft(2, '0')}/${local.year} • ${hour.toString().padLeft(2, '0')}:$minute $ampm';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surface,
      appBar: AppBar(
        title: const Text('Nhắc lịch tái khám'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 12),

              ScaleTransition(
                scale: _acknowledged
                    ? const AlwaysStoppedAnimation(1.0)
                    : _pulseAnim,
                child: Container(
                  width: 140,
                  height: 140,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: _acknowledged
                          ? [const Color(0xFF10B981), const Color(0xFF059669)]
                          : [const Color(0xFF10B981), const Color(0xFF047857)],
                    ),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.secondary.withOpacity(0.4),
                        blurRadius: 36,
                        spreadRadius: 8,
                      ),
                    ],
                  ),
                  child: Icon(
                    _acknowledged
                        ? Icons.check_rounded
                        : Icons.calendar_month_rounded,
                    color: Colors.white,
                    size: 70,
                  ),
                ),
              ),

              const SizedBox(height: 36),

              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                decoration: BoxDecoration(
                  color: AppTheme.secondaryLight,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '📅 ${_formatAppointmentDate(widget.appointment.appointmentDate)}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.secondary,
                  ),
                ),
              ),
              const SizedBox(height: 24),

              Text(
                _acknowledged ? 'Đã ghi nhận!' : 'Nhắc nhở tái khám',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: _acknowledged ? AppTheme.secondary : AppTheme.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              if (!_acknowledged)
                const Text(
                  'Bạn có lịch khám vào ngày mai.\nVui lòng chuẩn bị sớm.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    color: AppTheme.textSecondary,
                    height: 1.5,
                  ),
                ),
              const SizedBox(height: 24),

              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.card,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                      color: AppTheme.secondary.withOpacity(0.2), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    _ApptRow(
                      icon: Icons.person_rounded,
                      label: 'Bác sĩ',
                      value: widget.appointment.doctorName,
                    ),
                    const Divider(height: 24, color: AppTheme.divider),
                    _ApptRow(
                      icon: Icons.local_hospital_rounded,
                      label: 'Địa điểm',
                      value: widget.appointment.location,
                    ),
                    const Divider(height: 24, color: AppTheme.divider),
                    _ApptRow(
                      icon: Icons.access_time_rounded,
                      label: 'Giờ khám',
                      value: _formatAppointmentDate(widget.appointment.appointmentDate),
                    ),
                    const Divider(height: 24, color: AppTheme.divider),
                    _ApptRow(
                      icon: Icons.note_rounded,
                      label: 'Ghi chú',
                      value: widget.appointment.notes?.isNotEmpty == true
                          ? widget.appointment.notes!
                          : 'Không có ghi chú',
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              if (!_acknowledged)
                ElevatedButton.icon(
                  onPressed: () {
                    _stopAlarm();
                    setState(() => _acknowledged = true);
                    SocketService.emitAppointmentDone(
                      widget.appointment.id,
                      doctorName: widget.appointment.doctorName,
                      userId: widget.appointment.userId,
                    );
                  },
                  icon: const Icon(Icons.directions_walk_rounded, size: 24),
                  label: const Text('Tôi đang trên đường'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.secondary,
                    minimumSize: const Size(double.infinity, 64),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18)),
                    textStyle: const TextStyle(
                        fontSize: 19, fontWeight: FontWeight.w700),
                  ),
                )
              else
                ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Quay lại trang chủ'),
                ),

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class _ApptRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _ApptRow(
      {required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: AppTheme.secondary, size: 20),
        const SizedBox(width: 12),
        Text(
          label,
          style: const TextStyle(
            fontSize: 15,
            color: AppTheme.textSecondary,
            fontWeight: FontWeight.w500,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
          ),
        ),
      ],
    );
  }
}