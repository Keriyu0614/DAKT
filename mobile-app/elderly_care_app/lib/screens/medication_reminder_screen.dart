import 'package:flutter/material.dart';
import '../main.dart';
import '../services/socket_service.dart';
import '../services/local_notification_service.dart';
import '../models/reminder_model.dart';
import '../models/medication_model.dart';

class MedicationReminderScreen extends StatefulWidget {
  final ReminderModel? reminder;
  final MedicationModel? medication;

  const MedicationReminderScreen({
    super.key,
    this.reminder,
    this.medication,
  });

  @override
  State<MedicationReminderScreen> createState() =>
      _MedicationReminderScreenState();
}

class _MedicationReminderScreenState extends State<MedicationReminderScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnim;
  bool _confirmed = false;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 1.0, end: 1.08).animate(
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
        title: const Text('Nhắc uống thuốc'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded),
          onPressed: () => Navigator.pop(context),
        ),
      ), // ← đóng AppBar đúng chỗ
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 12),

              // Animated icon
              if (!_confirmed)
                ScaleTransition(
                  scale: _pulseAnim,
                  child: Container(
                    width: 140,
                    height: 140,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primary.withOpacity(0.4),
                          blurRadius: 36,
                          spreadRadius: 8,
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.medication_rounded,
                      color: Colors.white,
                      size: 70,
                    ),
                  ),
                )
              else
                Container(
                  width: 140,
                  height: 140,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF10B981), Color(0xFF059669)],
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
                  child: const Icon(
                    Icons.check_rounded,
                    color: Colors.white,
                    size: 70,
                  ),
                ),

              const SizedBox(height: 36),

              // Time
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                decoration: BoxDecoration(
                  color: AppTheme.primaryLight,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  widget.reminder != null
                      ? '🕐  ${widget.reminder!.scheduledTime.toLocal().hour.toString().padLeft(2, '0')}:${widget.reminder!.scheduledTime.toLocal().minute.toString().padLeft(2, '0')} — Uống thuốc'
                      : '🕐  12:00 — Sau bữa trưa',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.primary,
                  ),
                ),
              ),
              const SizedBox(height: 24),

              Text(
                _confirmed ? 'Đã xác nhận!' : 'Đã đến giờ uống thuốc',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: _confirmed ? AppTheme.secondary : AppTheme.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),

              // Medication info card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppTheme.card,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    _MedRow(
                        icon: Icons.medication_rounded,
                        label: 'Thuốc',
                        value: widget.medication?.medicationName ?? 'Metformin 500mg'),
                    const Divider(height: 24, color: AppTheme.divider),
                    _MedRow(
                        icon: Icons.format_list_numbered_rounded,
                        label: 'Liều lượng',
                        value: widget.medication?.dosage ?? '1 viên'),
                    const Divider(height: 24, color: AppTheme.divider),
                    _MedRow(
                        icon: Icons.info_outline_rounded,
                        label: 'Ghi chú',
                        value: (widget.medication?.instructions != null && widget.medication!.instructions!.isNotEmpty)
                            ? widget.medication!.instructions!
                            : (widget.medication?.frequency ?? 'Uống sau bữa ăn')),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              if (!_confirmed) ...[
                ElevatedButton.icon(
                  onPressed: () {
                    setState(() => _confirmed = true);
                    if (widget.reminder != null) {
                      SocketService.emitMedicationTaken(widget.reminder!.id);
                    }
                  },
                  icon: const Icon(Icons.check_circle_outline_rounded, size: 24),
                  label: const Text('Đã uống xong'),
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
                  onPressed: () {
                    // Schedule a local snooze notification for 5 minutes from now
                    LocalNotificationService.triggerLocalSnooze(
                      widget.reminder?.id ?? 'manual_snooze_${DateTime.now().millisecondsSinceEpoch}',
                      'Nhắc nhở uống thuốc',
                      'Đã đến giờ uống thuốc ${widget.medication?.medicationName ?? ""}! Hãy uống ngay nhé.',
                    );
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Sẽ nhắc lại sau 5 phút'),
                        duration: Duration(seconds: 2),
                      ),
                    );
                    Navigator.pop(context);
                  },
                  icon: const Icon(Icons.cancel_outlined, size: 22),
                  label: const Text('Chưa uống được'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.danger,
                    side: const BorderSide(color: AppTheme.danger),
                    minimumSize: const Size(double.infinity, 64),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18)),
                    textStyle: const TextStyle(
                        fontSize: 19, fontWeight: FontWeight.w700),
                  ),
                ),
              ] else
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

class _MedRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _MedRow({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: AppTheme.primary, size: 20),
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