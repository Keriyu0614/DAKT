import 'package:flutter/material.dart';
import '../models/appointment_model.dart';
import '../services/socket_service.dart';
import '../main.dart';

class AppointmentDetailScreen extends StatelessWidget {
  final AppointmentModel appointment;
  const AppointmentDetailScreen({super.key, required this.appointment});

  String _formatAppointmentDate(DateTime dateTime) {
    final local = dateTime.toLocal();
    final hour = local.hour % 12 == 0 ? 12 : local.hour % 12;
    final minute = local.minute.toString().padLeft(2, '0');
    final ampm = local.hour >= 12 ? 'CH' : 'SA';
    return '${local.day.toString().padLeft(2, '0')}/${local.month.toString().padLeft(2, '0')}/${local.year} ${hour.toString().padLeft(2, '0')}:$minute $ampm';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surface,
      appBar: AppBar(
        title: const Text('Chi tiết lịch khám'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primary.withOpacity(0.35),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            '📅 Sắp tới',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      appointment.doctorName.isNotEmpty
                          ? 'Lịch khám với ${appointment.doctorName}'
                          : 'Lịch khám',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.calendar_today_rounded,
                            color: Colors.white70, size: 16),
                        const SizedBox(width: 6),
                        Text(
                          _formatAppointmentDate(appointment.appointmentDate),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Details section
              _SectionCard(
                title: 'Thông tin bác sĩ',
                children: [
                  _DetailRow(
                    icon: Icons.person_rounded,
                    label: 'Bác sĩ',
                    value: appointment.doctorName,
                    highlight: true,
                  ),
                  _DetailRow(
                    icon: Icons.local_hospital_rounded,
                    label: 'Địa điểm',
                    value: appointment.location,
                  ),
                ],
              ),

              const SizedBox(height: 16),

              _SectionCard(
                title: 'Thông tin khám',
                children: [
                  _DetailRow(
                    icon: Icons.access_time_rounded,
                    label: 'Thời gian',
                    value: _formatAppointmentDate(appointment.appointmentDate),
                  ),
                  _DetailRow(
                    icon: Icons.note_rounded,
                    label: 'Ghi chú',
                    value: appointment.notes?.isNotEmpty == true
                        ? appointment.notes!
                        : 'Không có ghi chú',
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Reminder info
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.warningLight,
                  borderRadius: BorderRadius.circular(16),
                  border:
                      Border.all(color: AppTheme.warning.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.alarm_rounded,
                        color: AppTheme.warning, size: 24),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Nhắc nhở',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Hệ thống sẽ nhắc bạn 1 ngày trước và 2 giờ trước lịch khám',
                            style: TextStyle(
                              fontSize: 13,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),
              // Mark appointment as done button
              ElevatedButton.icon(
                onPressed: () {
                  SocketService.emitAppointmentDone(appointment.id);
                },
                icon: const Icon(Icons.check_circle, size: 22),
                label: const Text('Xác nhận đã đến nơi'),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 60),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  textStyle: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(height: 24),

              // Actions
              // ElevatedButton.icon(
              //   onPressed: () {},
              //   icon: const Icon(Icons.directions_rounded, size: 22),
              //   label: const Text('Chỉ đường đến bệnh viện'),
              //   style: ElevatedButton.styleFrom(
              //     minimumSize: const Size(double.infinity, 60),
              //     shape: RoundedRectangleBorder(
              //         borderRadius: BorderRadius.circular(16)),
              //     textStyle:
              //         const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
              //   ),
              // ),
              // const SizedBox(height: 12),
              // OutlinedButton.icon(
              //   onPressed: () {},
              //   icon: const Icon(Icons.phone_rounded, size: 22),
              //   label: const Text('Gọi cho bệnh viện'),
              //   style: OutlinedButton.styleFrom(
              //     foregroundColor: AppTheme.primary,
              //     side: const BorderSide(color: AppTheme.primary),
              //     minimumSize: const Size(double.infinity, 60),
              //     shape: RoundedRectangleBorder(
              //         borderRadius: BorderRadius.circular(16)),
              //     textStyle:
              //         const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
              //   ),
              // ),
              // const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const _SectionCard({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w800,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final bool highlight;
  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
    this.highlight = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppTheme.primaryLight,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppTheme.primary, size: 18),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppTheme.textMuted,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight:
                        highlight ? FontWeight.w800 : FontWeight.w600,
                    color: highlight ? AppTheme.primary : AppTheme.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
