import 'package:flutter/material.dart';
import '../main.dart';
import 'appointment_detail_screen.dart';

class AppointmentReminderScreen extends StatefulWidget {
  const AppointmentReminderScreen({super.key});

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
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
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
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Spacer(),

              // Animated icon
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

              // Time badge
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                decoration: BoxDecoration(
                  color: AppTheme.secondaryLight,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  '📅  Ngày mai — 09:00 SA',
                  style: TextStyle(
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
                  color:
                      _acknowledged ? AppTheme.secondary : AppTheme.textPrimary,
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

              // Appointment details
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
                        icon: Icons.local_hospital_rounded,
                        label: 'Bệnh viện',
                        value: 'BV Chợ Rẫy'),
                    const Divider(height: 24, color: AppTheme.divider),
                    _ApptRow(
                        icon: Icons.person_rounded,
                        label: 'Bác sĩ',
                        value: 'BS. Nguyễn Văn An'),
                    const Divider(height: 24, color: AppTheme.divider),
                    _ApptRow(
                        icon: Icons.medical_services_rounded,
                        label: 'Khoa',
                        value: 'Tim mạch'),
                    const Divider(height: 24, color: AppTheme.divider),
                    _ApptRow(
                        icon: Icons.access_time_rounded,
                        label: 'Giờ khám',
                        value: '09:00 SA'),
                  ],
                ),
              ),

              const Spacer(),

              if (!_acknowledged) ...[
                ElevatedButton.icon(
                  onPressed: () => setState(() => _acknowledged = true),
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
                ),
                const SizedBox(height: 14),
                OutlinedButton.icon(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) => const AppointmentDetailScreen()),
                  ),
                  icon: const Icon(Icons.info_outline_rounded, size: 22),
                  label: const Text('Xem chi tiết lịch khám'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.primary,
                    side: const BorderSide(color: AppTheme.primary),
                    minimumSize: const Size(double.infinity, 64),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18)),
                    textStyle: const TextStyle(
                        fontSize: 18, fontWeight: FontWeight.w700),
                  ),
                ),
              ] else
                ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Quay lại trang chủ'),
                ),

              const SizedBox(height: 8),
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
