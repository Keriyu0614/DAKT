import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../main.dart';
import '../services/health_service.dart';
import '../services/socket_service.dart';
import '../models/health_log_model.dart';
import 'quick_health_entry_screen.dart';

class HealthDetailScreen extends StatefulWidget {
  const HealthDetailScreen({super.key});

  @override
  State<HealthDetailScreen> createState() => _HealthDetailScreenState();
}

class _HealthDetailScreenState extends State<HealthDetailScreen> {
  bool _showHealthCheck = false;
  List<HealthLogModel> _healthLogs = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchLogs();
    // Listen for caregiver-submitted health logs via socket
    SocketService.connect();
    SocketService.on('health_log_submitted', _onHealthLogSubmitted);
  }

  @override
  void dispose() {
    SocketService.off('health_log_submitted', _onHealthLogSubmitted);
    super.dispose();
  }

  void _onHealthLogSubmitted(dynamic data) {
    // Refresh when caregiver submits a health log for this user
    if (data is Map && data['recordedBy'] == 'caregiver') {
      _fetchLogs();
    }
  }

  Future<void> _fetchLogs() async {
    setState(() => _isLoading = true);
    try {
      final logs = await HealthService.getMyHealthLogs();
      setState(() {
        _healthLogs = logs;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading logs: $e');
      setState(() => _isLoading = false);
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final localDate = date.toLocal();
    final checkDate = DateTime(localDate.year, localDate.month, localDate.day);

    if (checkDate == today) {
      return 'Hôm nay';
    } else if (checkDate == yesterday) {
      return 'Hôm qua';
    } else {
      return DateFormat('dd/MM').format(localDate);
    }
  }

  String _getStatus(HealthLogModel log) {
    final bp = log.bloodPressure;
    if (bp.isNotEmpty && bp != '-') {
      final parts = bp.split('/');
      if (parts.length == 2) {
        final sys = int.tryParse(parts[0]);
        final dia = int.tryParse(parts[1]);
        if (sys != null && (sys > 140 || sys < 90)) return 'Chú ý';
        if (dia != null && (dia > 90 || dia < 60)) return 'Chú ý';
      }
    }
    final hr = log.heartRate;
    if (hr != null && (hr > 100 || hr < 50)) {
      return 'Chú ý';
    }
    return 'Bình thường';
  }

  bool _isStatusOk(HealthLogModel log) {
    return _getStatus(log) == 'Bình thường';
  }

  @override
  Widget build(BuildContext context) {
    if (_showHealthCheck) {
      return HealthCheckScreen(onBack: () => setState(() => _showHealthCheck = false));
    }

    // Determine current values based on latest log (if any)
    // statusOk=false + status='Chưa có dữ liệu' renders a neutral badge (warning color = gray-ish)
    String bpValue = '--';
    String bpStatus = 'Chưa có dữ liệu';
    bool bpStatusOk = false; // false = neutral/warning badge color, won't show green

    String hrValue = '--';
    String hrStatus = 'Chưa có dữ liệu';
    bool hrStatusOk = false;

    String weightValue = '--';
    String weightStatus = 'Chưa có dữ liệu';
    bool weightStatusOk = false;

    if (_healthLogs.isNotEmpty) {
      // Find latest log with blood pressure
      try {
        final latestBpLog = _healthLogs.firstWhere(
          (log) => log.bloodPressure.isNotEmpty && log.bloodPressure != '-',
        );
        bpValue = latestBpLog.bloodPressure;
        final isOk = _isStatusOk(latestBpLog);
        bpStatus = isOk ? 'Bình thường' : 'Chú ý';
        bpStatusOk = isOk;
      } catch (_) {}

      // Find latest log with heart rate
      try {
        final latestHrLog = _healthLogs.firstWhere(
          (log) => log.heartRate != null,
        );
        hrValue = latestHrLog.heartRate.toString();
        final isOk = _isStatusOk(latestHrLog);
        hrStatus = isOk ? 'Bình thường' : 'Chú ý';
        hrStatusOk = isOk;
      } catch (_) {}

      // Find latest log with weight
      try {
        final latestWeightLog = _healthLogs.firstWhere(
          (log) => log.weight != null,
        );
        weightValue = latestWeightLog.weight!.toStringAsFixed(1);
        weightStatus = 'Bình thường';
        weightStatusOk = true;
      } catch (_) {}
    }

    final List<Map<String, String>> historyList = [];
    if (_healthLogs.isNotEmpty) {
      for (var log in _healthLogs) {
        historyList.add({
          'date': _formatDate(log.date),
          'bp': log.bloodPressure.isNotEmpty ? log.bloodPressure : '-',
          'hr': log.heartRate != null ? log.heartRate.toString() : '-',
          'status': _isStatusOk(log) ? 'Tốt' : 'Chú ý',
        });
      }
    }

    return Scaffold(
      backgroundColor: AppTheme.surface,
      appBar: AppBar(title: const Text('Chi tiết sức khoẻ')),
      body: SafeArea(
        child: _isLoading && _healthLogs.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: _fetchLogs,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header metric cards
                      Row(
                        children: [
                          Expanded(
                            child: _MetricCard(
                              label: 'Huyết áp',
                              value: bpValue,
                              unit: 'mmHg',
                              icon: Icons.favorite_rounded,
                              color: AppTheme.danger,
                              status: bpStatus,
                              statusOk: bpStatusOk,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: _MetricCard(
                              label: 'Nhịp tim',
                              value: hrValue,
                              unit: 'bpm',
                              icon: Icons.monitor_heart_rounded,
                              color: AppTheme.primary,
                              status: hrStatus,
                              statusOk: hrStatusOk,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _MetricCard(
                              label: 'Cân nặng',
                              value: weightValue,
                              unit: 'kg',
                              icon: Icons.monitor_weight_rounded,
                              color: AppTheme.warning,
                              status: weightStatus,
                              statusOk: weightStatusOk,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // Health check CTA
                      GestureDetector(
                        onTap: () => setState(() => _showHealthCheck = true),
                        child: Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF2563EB), Color(0xFF7C3AED)],
                              begin: Alignment.centerLeft,
                              end: Alignment.centerRight,
                            ),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.primary.withOpacity(0.3),
                                blurRadius: 20,
                                offset: const Offset(0, 6),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: const Icon(Icons.quiz_rounded,
                                    color: Colors.white, size: 28),
                              ),
                              const SizedBox(width: 16),
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Đánh giá sức khoẻ hôm nay',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 16,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    SizedBox(height: 4),
                                    Text(
                                      'Trả lời vài câu hỏi nhanh để theo dõi sức khoẻ',
                                      style: TextStyle(
                                        color: Colors.white70,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const Icon(Icons.arrow_forward_ios_rounded,
                                  color: Colors.white, size: 18),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 24),

                      // History
                      const Text(
                        'Lịch sử 7 ngày qua',
                        style: TextStyle(
                          fontSize: 19,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 12),

                      if (historyList.isEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 20),
                          decoration: BoxDecoration(
                            color: AppTheme.card,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: AppTheme.border),
                          ),
                          child: const Column(
                            children: [
                              Icon(Icons.bar_chart_rounded, size: 48, color: AppTheme.textMuted),
                              SizedBox(height: 12),
                              Text(
                                'Chưa có dữ liệu sức khoẻ',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.textSecondary,
                                ),
                              ),
                              SizedBox(height: 6),
                              Text(
                                'Nhấn nút "+ Nhập chỉ số" để bắt đầu\ntheo dõi sức khoẻ của bạn',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: AppTheme.textMuted,
                                  height: 1.5,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        )
                      else
                        ...historyList.map((d) => _HistoryItem(data: d)),

                    ],
                  ),
                ),
              ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const QuickHealthEntryScreen(),
            ),
          );
          if (result == true) {
            _fetchLogs();
          }
        },
        icon: const Icon(Icons.add_rounded, size: 28),
        label: const Text(
          'Nhập chỉ số',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
      ),
    );
  }
}


class _MetricCard extends StatelessWidget {
  final String label;
  final String value;
  final String unit;
  final IconData icon;
  final Color color;
  final String status;
  final bool statusOk;

  const _MetricCard({
    required this.label,
    required this.value,
    required this.unit,
    required this.icon,
    required this.color,
    required this.status,
    required this.statusOk,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(18),
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: color, size: 22),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: status == 'Chưa có dữ liệu'
                      ? AppTheme.divider
                      : (statusOk ? AppTheme.secondaryLight : AppTheme.warningLight),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: status == 'Chưa có dữ liệu'
                        ? AppTheme.textSecondary
                        : (statusOk ? AppTheme.secondary : AppTheme.warning),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w800,
              color: AppTheme.textPrimary,
            ),
          ),
          Text(
            unit,
            style: const TextStyle(
              fontSize: 12,
              color: AppTheme.textMuted,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              color: AppTheme.textSecondary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _HistoryItem extends StatelessWidget {
  final Map<String, String> data;
  const _HistoryItem({required this.data});

  @override
  Widget build(BuildContext context) {
    final isOk = data['status'] == 'Tốt';
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          Text(
            data['date']!,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Row(
              children: [
                _Tag(
                    icon: Icons.favorite_rounded,
                    value: data['bp']!,
                    color: AppTheme.danger),
                const SizedBox(width: 12),
                _Tag(
                    icon: Icons.monitor_heart_rounded,
                    value: '${data['hr']} bpm',
                    color: AppTheme.primary),
              ],
            ),
          ),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: isOk ? AppTheme.secondaryLight : AppTheme.warningLight,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              data['status']!,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: isOk ? AppTheme.secondary : AppTheme.warning,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  final IconData icon;
  final String value;
  final Color color;
  const _Tag({required this.icon, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: color, size: 14),
        const SizedBox(width: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppTheme.textPrimary,
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────
// HEALTH CHECK / SURVEY SCREEN
// ─────────────────────────────────────────────
class HealthCheckScreen extends StatefulWidget {
  final VoidCallback onBack;
  const HealthCheckScreen({super.key, required this.onBack});

  @override
  State<HealthCheckScreen> createState() => _HealthCheckScreenState();
}

class _HealthCheckScreenState extends State<HealthCheckScreen> {
  int _step = 0;
  final List<int?> _answers = [null, null, null, null];
  bool _done = false;

  final _questions = [
    {
      'q': 'Hôm nay cụ cảm thấy thế nào?',
      'options': ['😊 Rất khoẻ', '🙂 Bình thường', '😔 Không khoẻ lắm', '😟 Mệt mỏi'],
    },
    {
      'q': 'Cụ có đau ngực hay khó thở không?',
      'options': ['Không có', 'Hơi khó chịu một chút', 'Có, khá rõ', 'Có, rất khó chịu'],
    },
    {
      'q': 'Cụ ngủ được mấy tiếng tối qua?',
      'options': ['Hơn 8 tiếng', '6–8 tiếng', '4–6 tiếng', 'Dưới 4 tiếng'],
    },
    {
      'q': 'Cụ đã uống đủ nước hôm nay chưa?',
      'options': ['Rồi, đủ 2L', 'Khoảng 1L', 'Ít hơn 1L', 'Chưa uống gì'],
    },
  ];

  @override
  Widget build(BuildContext context) {
    if (_done) {
      return _buildDone(context);
    }

    final q = _questions[_step];
    return Scaffold(
      backgroundColor: AppTheme.surface,
      appBar: AppBar(
        title: const Text('Đánh giá sức khoẻ'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded),
          onPressed: widget.onBack,
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Progress
              Row(
                children: List.generate(
                  _questions.length,
                  (i) => Expanded(
                    child: Container(
                      height: 6,
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      decoration: BoxDecoration(
                        color: i <= _step
                            ? AppTheme.primary
                            : AppTheme.border,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Câu ${_step + 1} / ${_questions.length}',
                style: const TextStyle(
                  fontSize: 13,
                  color: AppTheme.textMuted,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 32),

              Text(
                q['q'] as String,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                  height: 1.3,
                ),
              ),
              const SizedBox(height: 32),

              ...(q['options'] as List<String>).asMap().entries.map(
                    (e) => _OptionButton(
                      label: e.value,
                      selected: _answers[_step] == e.key,
                      onTap: () => setState(() => _answers[_step] = e.key),
                    ),
                  ),

              const Spacer(),

              ElevatedButton(
                onPressed: _answers[_step] == null
                    ? null
                    : () {
                        if (_step < _questions.length - 1) {
                          setState(() => _step++);
                        } else {
                          setState(() => _done = true);
                        }
                      },
                child: Text(
                    _step < _questions.length - 1 ? 'Tiếp theo' : 'Hoàn thành'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Map<String, dynamic> _generateHealthFeedback() {
    List<String> advices = [];
    String statusTitle = 'Sức khoẻ ổn định';
    Color statusColor = AppTheme.secondary;
    IconData statusIcon = Icons.check_circle_rounded;
    bool hasCriticalAlert = false;
    bool hasWarning = false;

    // Check Chest Pain / Breathlessness (Question 1)
    final q1Answer = _answers[1];
    if (q1Answer == 2 || q1Answer == 3) {
      hasCriticalAlert = true;
      advices.add('🔴 Cụ đang có biểu hiện đau ngực hoặc khó thở. Hãy ngồi nghỉ ngơi ở nơi thoáng mát, tránh lo lắng. Nếu cơn đau kéo dài hoặc nghiêm trọng hơn, vui lòng gọi điện thoại ngay cho người thân hoặc cơ sở y tế gần nhất!');
    }

    // Check Overall Feeling (Question 0)
    final q0Answer = _answers[0];
    if (q0Answer == 2 || q0Answer == 3) {
      hasWarning = true;
      advices.add('🟡 Cơ thể hôm nay cảm thấy không khỏe hoặc mệt mỏi. cụ nên đo lại huyết áp và nhịp tim ngay. Tránh làm việc nặng hoặc ra ngoài trời nắng, dành thời gian nghỉ ngơi yên tĩnh.');
    }

    // Check Sleep (Question 2)
    final q2Answer = _answers[2];
    if (q2Answer == 2 || q2Answer == 3) {
      hasWarning = true;
      advices.add('💤 Giấc ngủ tối qua của cụ hơi ít hoặc chập chờn. Hãy bổ sung một giấc ngủ trưa ngắn khoảng 20-30 phút để phục hồi sức khỏe, tránh dùng trà hoặc cà phê vào buổi chiều tối.');
    } else {
      advices.add('🟢 Giấc ngủ của Cụ rất tốt, hãy tiếp tục duy trì việc ngủ đủ giấc từ 6-8 tiếng mỗi ngày để giữ tinh thần minh mẫn.');
    }

    // Check Water (Question 3)
    final q3Answer = _answers[3];
    if (q3Answer == 2 || q3Answer == 3) {
      hasWarning = true;
      advices.add('💧 Lượng nước uống hôm nay của cụ đang bị thiếu. Hãy rót ngay một cốc nước ấm ấm uống từng ngụm nhỏ, cố gắng bổ sung thêm nước trong ngày.');
    } else if (q3Answer == 1) {
      advices.add('💧 Cụ đã uống được khoảng 1L nước. Hãy cố gắng uống thêm 1-2 cốc nước nữa để cơ thể thải độc tốt hơn.');
    } else {
      advices.add('💧 Tuyệt vời! Cụ đã uống đủ lượng nước cần thiết cho cơ thể ngày hôm nay.');
    }

    if (hasCriticalAlert) {
      statusTitle = 'Cần chú ý đặc biệt!';
      statusColor = AppTheme.danger;
      statusIcon = Icons.warning_rounded;
    } else if (hasWarning) {
      statusTitle = 'Cần chú ý sức khoẻ';
      statusColor = AppTheme.warning;
      statusIcon = Icons.info_rounded;
    } else {
      statusTitle = 'Sức khoẻ rất tốt!';
      statusColor = AppTheme.secondary;
      statusIcon = Icons.sentiment_very_satisfied_rounded;
    }

    // If no critical alert and no overall feeling issues, add a positive general advice at the beginning
    if (!hasCriticalAlert && !hasWarning) {
      advices.insert(0, '☀️ Trạng thái tinh thần và thể chất của cụ hôm nay rất tốt. Hãy duy trì thói quen đi bộ nhẹ nhàng và trò chuyện cùng người thân nhé!');
    }

    return {
      'title': statusTitle,
      'color': statusColor,
      'icon': statusIcon,
      'advices': advices,
    };
  }

  Widget _buildDone(BuildContext context) {
    final feedback = _generateHealthFeedback();
    final String statusTitle = feedback['title'];
    final Color statusColor = feedback['color'];
    final IconData statusIcon = feedback['icon'];
    final List<String> advices = feedback['advices'];

    return Scaffold(
      backgroundColor: AppTheme.surface,
      appBar: AppBar(
        title: const Text('Kết quả đánh giá'),
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                child: Column(
                  children: [
                    // Status Badge with glow
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.15),
                        shape: BoxShape.circle,
                        border: Border.all(color: statusColor, width: 3),
                      ),
                      child: Icon(
                        statusIcon,
                        color: statusColor,
                        size: 50,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      statusTitle,
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        color: statusColor,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    
                    // Advice Card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppTheme.card,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppTheme.border),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.04),
                            blurRadius: 16,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.spa_rounded, color: statusColor, size: 24),
                              const SizedBox(width: 8),
                              const Text(
                                'Lời khuyên dành cho cụ:',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                            ],
                          ),
                          const Divider(height: 24, color: AppTheme.divider),
                          ...advices.map((advice) => Padding(
                                padding: const EdgeInsets.only(bottom: 16),
                                child: Text(
                                  advice,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    height: 1.6,
                                    color: AppTheme.textPrimary,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              )),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            // Bottom Action
            Padding(
              padding: const EdgeInsets.all(24),
              child: ElevatedButton(
                onPressed: widget.onBack,
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 60),
                ),
                child: const Text('XÁC NHẬN & QUAY LẠI'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OptionButton extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _OptionButton(
      {required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primaryLight : AppTheme.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selected ? AppTheme.primary : AppTheme.border,
            width: selected ? 2 : 1,
          ),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: AppTheme.primary.withOpacity(0.15),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : [],
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 17,
                  fontWeight:
                      selected ? FontWeight.w700 : FontWeight.w500,
                  color: selected ? AppTheme.primary : AppTheme.textPrimary,
                ),
              ),
            ),
            if (selected)
              const Icon(Icons.check_circle_rounded,
                  color: AppTheme.primary, size: 24),
          ],
        ),
      ),
    );
  }
}
