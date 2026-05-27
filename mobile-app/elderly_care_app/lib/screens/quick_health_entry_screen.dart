import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../main.dart';
import '../services/health_service.dart';

class QuickHealthEntryScreen extends StatefulWidget {
  const QuickHealthEntryScreen({super.key});

  @override
  State<QuickHealthEntryScreen> createState() => _QuickHealthEntryScreenState();
}

class _QuickHealthEntryScreenState extends State<QuickHealthEntryScreen> {
  final _systolicController = TextEditingController();
  final _diastolicController = TextEditingController();
  final _heartRateController = TextEditingController();
  final _weightController = TextEditingController();

  final _systolicFocusNode = FocusNode();
  final _diastolicFocusNode = FocusNode();
  final _heartRateFocusNode = FocusNode();
  final _weightFocusNode = FocusNode();

  String? _systolicError;
  String? _diastolicError;
  String? _heartRateError;
  String? _weightError;

  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    // Auto-focus the first text field when screen opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _systolicFocusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _systolicController.dispose();
    _diastolicController.dispose();
    _heartRateController.dispose();
    _weightController.dispose();
    _systolicFocusNode.dispose();
    _diastolicFocusNode.dispose();
    _heartRateFocusNode.dispose();
    _weightFocusNode.dispose();
    super.dispose();
  }

  void _validateFields() {
    setState(() {
      _systolicError = null;
      _diastolicError = null;
      _heartRateError = null;
      _weightError = null;

      final sysText = _systolicController.text.trim();
      final diaText = _diastolicController.text.trim();
      final hrText = _heartRateController.text.trim();
      final wtText = _weightController.text.trim();

      if (sysText.isNotEmpty) {
        final sys = int.tryParse(sysText);
        if (sys == null || sys < 60 || sys > 250) {
          _systolicError = 'Huyết áp tâm thu phải từ 60 đến 250 mmHg';
        }
      }

      if (diaText.isNotEmpty) {
        final dia = int.tryParse(diaText);
        if (dia == null || dia < 40 || dia > 150) {
          _diastolicError = 'Huyết áp tâm trương phải từ 40 đến 150 mmHg';
        }
      }

      if (hrText.isNotEmpty) {
        final hr = int.tryParse(hrText);
        if (hr == null || hr < 30 || hr > 200) {
          _heartRateError = 'Nhịp tim phải từ 30 đến 200 bpm';
        }
      }

      if (wtText.isNotEmpty) {
        final wt = double.tryParse(wtText);
        if (wt == null || wt < 20 || wt > 300) {
          _weightError = 'Cân nặng phải từ 20 đến 300 kg';
        }
      }
    });
  }

  Future<void> _handleSave() async {
    _validateFields();

    if (_systolicError != null || _diastolicError != null || _heartRateError != null || _weightError != null) {
      return;
    }

    final sysText = _systolicController.text.trim();
    final diaText = _diastolicController.text.trim();
    final hrText = _heartRateController.text.trim();
    final wtText = _weightController.text.trim();

    if (sysText.isEmpty && diaText.isEmpty && hrText.isEmpty && wtText.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng nhập ít nhất một chỉ số sức khỏe để lưu'),
          backgroundColor: AppTheme.danger,
        ),
      );
      return;
    }

    setState(() => _isSaving = true);

    final systolic = sysText.isNotEmpty ? int.tryParse(sysText) : null;
    final diastolic = diaText.isNotEmpty ? int.tryParse(diaText) : null;
    final heartRate = hrText.isNotEmpty ? int.tryParse(hrText) : null;
    final weight = wtText.isNotEmpty ? double.tryParse(wtText) : null;

    final success = await HealthService.addHealthLog(
      systolic: systolic,
      diastolic: diastolic,
      heartRate: heartRate,
      weight: weight,
    );

    setState(() => _isSaving = false);

    if (success) {
      final nowTime = DateFormat('HH:mm').format(DateTime.now());
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Đã lưu lúc $nowTime',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            backgroundColor: AppTheme.secondary,
            duration: const Duration(seconds: 3),
          ),
        );
        Navigator.pop(context, true); // Pass true to signal data change
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Có lỗi xảy ra khi lưu chỉ số. Vui lòng thử lại.'),
            backgroundColor: AppTheme.danger,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surface,
      appBar: AppBar(
        title: const Text('Nhập chỉ số nhanh'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Nhập các chỉ số đo được của bạn bên dưới:',
                style: TextStyle(
                  fontSize: 16,
                  color: AppTheme.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 24),
              _buildLargeInputField(
                label: 'Huyết áp tâm thu (mmHg)',
                controller: _systolicController,
                focusNode: _systolicFocusNode,
                errorText: _systolicError,
                hintText: '---',
                nextFocusNode: _diastolicFocusNode,
              ),
              const SizedBox(height: 24),
              _buildLargeInputField(
                label: 'Huyết áp tâm trương (mmHg)',
                controller: _diastolicController,
                focusNode: _diastolicFocusNode,
                errorText: _diastolicError,
                hintText: '---',
                nextFocusNode: _heartRateFocusNode,
              ),
              const SizedBox(height: 24),
              _buildLargeInputField(
                label: 'Nhịp tim (bpm)',
                controller: _heartRateController,
                focusNode: _heartRateFocusNode,
                errorText: _heartRateError,
                hintText: '---',
                nextFocusNode: _weightFocusNode,
              ),
              const SizedBox(height: 24),
              _buildLargeInputField(
                label: 'Cân nặng (kg)',
                controller: _weightController,
                focusNode: _weightFocusNode,
                errorText: _weightError,
                hintText: '---',
                isDecimal: true,
                isLast: true,
              ),
              const SizedBox(height: 40),
              SizedBox(
                height: 60, // Minimum height 56dp as requested
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    elevation: 4,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  onPressed: _isSaving ? null : _handleSave,
                  child: _isSaving
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text(
                          'LƯU CHỈ SỐ',
                          style: TextStyle(
                            fontSize: 22, // Large text for elderly
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLargeInputField({
    required String label,
    required TextEditingController controller,
    required FocusNode focusNode,
    required String? errorText,
    required String hintText,
    FocusNode? nextFocusNode,
    bool isLast = false,
    bool isDecimal = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 22, // Minimum 22sp for label
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 10),
        TextField(
          controller: controller,
          focusNode: focusNode,
          keyboardType: isDecimal
              ? const TextInputType.numberWithOptions(decimal: true)
              : TextInputType.number,
          style: const TextStyle(
            fontSize: 34, // Minimum 32sp for input value
            fontWeight: FontWeight.bold,
            color: AppTheme.textPrimary,
          ),
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: const TextStyle(color: AppTheme.textMuted),
            filled: true,
            fillColor: AppTheme.card,
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(
                color: errorText != null ? AppTheme.danger : AppTheme.border,
                width: 2,
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(
                color: errorText != null ? AppTheme.danger : AppTheme.border,
                width: 1.5,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(
                color: errorText != null ? AppTheme.danger : AppTheme.primary,
                width: 2.5,
              ),
            ),
          ),
          onChanged: (_) => _validateFields(),
          onSubmitted: (_) {
            if (nextFocusNode != null) {
              nextFocusNode.requestFocus();
            } else if (isLast) {
              _handleSave();
            }
          },
        ),
        if (errorText != null) ...[
          const SizedBox(height: 6),
          Text(
            errorText,
            style: const TextStyle(
              color: AppTheme.danger,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ],
    );
  }
}
