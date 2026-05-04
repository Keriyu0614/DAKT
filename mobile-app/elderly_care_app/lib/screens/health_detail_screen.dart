import 'package:flutter/material.dart';
import '../main.dart';

class HealthDetailScreen extends StatefulWidget {
  const HealthDetailScreen({super.key});

  @override
  State<HealthDetailScreen> createState() => _HealthDetailScreenState();
}

class _HealthDetailScreenState extends State<HealthDetailScreen> {
  bool _showHealthCheck = false;

  @override
  Widget build(BuildContext context) {
    if (_showHealthCheck) {
      return HealthCheckScreen(onBack: () => setState(() => _showHealthCheck = false));
    }

    return Scaffold(
      backgroundColor: AppTheme.surface,
      appBar: AppBar(title: const Text('Chi tiết sức khoẻ')),
      body: SafeArea(
        child: SingleChildScrollView(
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
                      value: '118/76',
                      unit: 'mmHg',
                      icon: Icons.favorite_rounded,
                      color: AppTheme.danger,
                      status: 'Bình thường',
                      statusOk: true,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _MetricCard(
                      label: 'Nhịp tim',
                      value: '72',
                      unit: 'bpm',
                      icon: Icons.monitor_heart_rounded,
                      color: AppTheme.primary,
                      status: 'Bình thường',
                      statusOk: true,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _MetricCard(
                      label: 'Đường huyết',
                      value: '6.4',
                      unit: 'mmol/L',
                      icon: Icons.water_drop_rounded,
                      color: const Color(0xFF8B5CF6),
                      status: 'Chú ý',
                      statusOk: false,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _MetricCard(
                      label: 'Cân nặng',
                      value: '68',
                      unit: 'kg',
                      icon: Icons.monitor_weight_rounded,
                      color: AppTheme.warning,
                      status: 'Bình thường',
                      statusOk: true,
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

              ..._historyData.map((d) => _HistoryItem(data: d)),
            ],
          ),
        ),
      ),
    );
  }

  static const _historyData = [
    {'date': 'Hôm nay', 'bp': '118/76', 'hr': '72', 'status': 'Tốt'},
    {'date': 'Hôm qua', 'bp': '122/80', 'hr': '75', 'status': 'Tốt'},
    {'date': '30/04', 'bp': '130/85', 'hr': '78', 'status': 'Chú ý'},
    {'date': '29/04', 'bp': '120/78', 'hr': '74', 'status': 'Tốt'},
    {'date': '28/04', 'bp': '116/74', 'hr': '71', 'status': 'Tốt'},
  ];
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
                  color: statusOk ? AppTheme.secondaryLight : AppTheme.warningLight,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: statusOk ? AppTheme.secondary : AppTheme.warning,
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
      'q': 'Hôm nay bạn cảm thấy thế nào?',
      'options': ['😊 Rất khoẻ', '🙂 Bình thường', '😔 Không khoẻ lắm', '😟 Mệt mỏi'],
    },
    {
      'q': 'Bạn có đau ngực hay khó thở không?',
      'options': ['Không có', 'Hơi khó chịu một chút', 'Có, khá rõ', 'Có, rất khó chịu'],
    },
    {
      'q': 'Bạn ngủ được mấy tiếng tối qua?',
      'options': ['Hơn 8 tiếng', '6–8 tiếng', '4–6 tiếng', 'Dưới 4 tiếng'],
    },
    {
      'q': 'Bạn đã uống đủ nước hôm nay chưa?',
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

  Widget _buildDone(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surface,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF10B981), Color(0xFF059669)],
                  ),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.secondary.withOpacity(0.35),
                      blurRadius: 36,
                      spreadRadius: 8,
                    ),
                  ],
                ),
                child:
                    const Icon(Icons.check_rounded, color: Colors.white, size: 60),
              ),
              const SizedBox(height: 32),
              const Text(
                'Cảm ơn bạn!',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Đánh giá sức khoẻ của bạn đã được ghi nhận.\nHãy tiếp tục chăm sóc bản thân nhé! 💪',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: AppTheme.textSecondary,
                  height: 1.6,
                ),
              ),
              const SizedBox(height: 40),
              ElevatedButton(
                onPressed: widget.onBack,
                child: const Text('Xem chi tiết sức khoẻ'),
              ),
            ],
          ),
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
