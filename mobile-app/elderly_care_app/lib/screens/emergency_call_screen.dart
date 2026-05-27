import 'dart:async';
import 'dart:developer' as dev;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_ringtone_player/flutter_ringtone_player.dart';
import 'package:vibration/vibration.dart';
import '../services/emergency_service.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../main.dart';

/// Màn hình xác nhận và gửi tín hiệu gọi hỗ trợ khẩn cấp.
/// Người dùng phải giữ nút 3 giây để xác nhận — tránh bấm nhầm.
class EmergencyCallScreen extends StatefulWidget {
  const EmergencyCallScreen({super.key});

  @override
  State<EmergencyCallScreen> createState() => _EmergencyCallScreenState();
}

class _EmergencyCallScreenState extends State<EmergencyCallScreen>
    with TickerProviderStateMixin {
  // ── State ──────────────────────────────────────────────────────────────────
  _ScreenState _state = _ScreenState.confirm;
  bool _isSending = false;
  bool _isHolding = false;
  double _holdProgress = 0.0;
  Timer? _holdTimer;
  Timer? _pulseTimer;

  // ── Animations ─────────────────────────────────────────────────────────────
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  late AnimationController _successController;
  late Animation<double> _successAnimation;

  static const _holdDuration = Duration(seconds: 3);
  static const _holdTick = Duration(milliseconds: 50);

  @override
  void initState() {
    super.initState();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.12).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _successController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _successAnimation = CurvedAnimation(
      parent: _successController,
      curve: Curves.elasticOut,
    );
  }

  @override
  void dispose() {
    _holdTimer?.cancel();
    _pulseTimer?.cancel();
    _pulseController.dispose();
    _successController.dispose();
    FlutterRingtonePlayer().stop();
    super.dispose();
  }

  // ── Hold-to-confirm logic ──────────────────────────────────────────────────
  void _onHoldStart() {
    if (_isSending || _state != _ScreenState.confirm) return;
    setState(() => _isHolding = true);

    HapticFeedback.mediumImpact();

    int ticks = 0;
    final totalTicks = _holdDuration.inMilliseconds ~/ _holdTick.inMilliseconds;

    _holdTimer = Timer.periodic(_holdTick, (timer) {
      ticks++;
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() => _holdProgress = ticks / totalTicks);

      if (ticks >= totalTicks) {
        timer.cancel();
        _triggerEmergency();
      }
    });
  }

  void _onHoldEnd() {
    if (_state != _ScreenState.confirm) return;
    _holdTimer?.cancel();
    if (mounted) {
      setState(() {
        _isHolding = false;
        _holdProgress = 0.0;
      });
    }
  }

  Future<void> _triggerEmergency() async {
    if (_isSending) return;
    setState(() {
      _isSending = true;
      _isHolding = false;
      _holdProgress = 0.0;
      _state = _ScreenState.sending;
    });

    HapticFeedback.heavyImpact();

    // Rung liên tục khi gửi
    final hasVibrator = await Vibration.hasVibrator() ?? false;
    if (hasVibrator) {
      Vibration.vibrate(pattern: [0, 300, 200, 300, 200, 500]);
    }

    dev.log('🚨 Sending emergency signal...');
    dev.log('   API URL: ${ApiService.baseUrl}/emergency/trigger');
    dev.log('   UserId: ${AuthService.currentUser?.userId}');
    
    try {
      final success = await EmergencyService.triggerEmergency(
        message: 'Cần hỗ trợ khẩn cấp',
      );

      if (!mounted) return;

      if (success) {
        setState(() => _state = _ScreenState.success);
        _successController.forward();
        HapticFeedback.heavyImpact();
        FlutterRingtonePlayer().playNotification();
        dev.log('✅ Emergency signal sent successfully');
      } else {
        setState(() {
          _state = _ScreenState.error;
          _isSending = false;
        });
        HapticFeedback.vibrate();
        dev.log('❌ Failed to send emergency signal — server returned non-202');
      }
    } catch (e) {
      dev.log('❌ Exception sending emergency signal: $e');
      if (!mounted) return;
      setState(() {
        _state = _ScreenState.error;
        _isSending = false;
      });
      HapticFeedback.vibrate();
    }
  }

  void _retry() {
    setState(() {
      _state = _ScreenState.confirm;
      _isSending = false;
      _holdProgress = 0.0;
    });
    _successController.reset();
  }

  // ── Build ──────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF5F5),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: Color(0xFF991B1B)),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Gọi hỗ trợ khẩn cấp',
          style: TextStyle(
            color: Color(0xFF991B1B),
            fontWeight: FontWeight.w800,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 400),
          child: _buildBody(),
        ),
      ),
    );
  }

  Widget _buildBody() {
    switch (_state) {
      case _ScreenState.confirm:
        return _buildConfirmView();
      case _ScreenState.sending:
        return _buildSendingView();
      case _ScreenState.success:
        return _buildSuccessView();
      case _ScreenState.error:
        return _buildErrorView();
    }
  }

  // ── Confirm View ───────────────────────────────────────────────────────────
  Widget _buildConfirmView() {
    return SingleChildScrollView(
      key: const ValueKey('confirm'),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Column(
        children: [
          const SizedBox(height: 16),
          // Warning icon
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: const Color(0xFFFEE2E2),
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFFCA5A5), width: 2),
            ),
            child: const Icon(
              Icons.local_hospital_rounded,
              color: Color(0xFFDC2626),
              size: 40,
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Bạn cần hỗ trợ?',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: Color(0xFF7F1D1D),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Người chăm sóc của bạn sẽ nhận được thông báo khẩn cấp ngay lập tức.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 15,
              color: Colors.grey[700],
              height: 1.5,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF3C7),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFFCD34D)),
            ),
            child: Row(
              children: const [
                Icon(Icons.info_outline_rounded,
                    color: Color(0xFFD97706), size: 18),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Giữ nút bên dưới trong 3 giây để xác nhận gửi tín hiệu.',
                    style: TextStyle(
                      fontSize: 13,
                      color: Color(0xFF92400E),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 40),
          // Hold button
          _buildHoldButton(),
          const SizedBox(height: 24),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'Huỷ — Tôi không cần hỗ trợ',
              style: TextStyle(
                color: Color(0xFF6B7280),
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildHoldButton() {
    return GestureDetector(
      onLongPressStart: (_) => _onHoldStart(),
      onLongPressEnd: (_) => _onHoldEnd(),
      onLongPressCancel: _onHoldEnd,
      child: AnimatedBuilder(
        animation: _pulseAnimation,
        builder: (context, child) {
          final scale = _isHolding ? 1.0 : _pulseAnimation.value;
          return Transform.scale(
            scale: scale,
            child: child,
          );
        },
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Outer glow ring
            Container(
              width: 180,
              height: 180,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFFFEE2E2).withOpacity(0.6),
              ),
            ),
            // Progress ring
            SizedBox(
              width: 160,
              height: 160,
              child: CircularProgressIndicator(
                value: _holdProgress,
                strokeWidth: 6,
                backgroundColor: const Color(0xFFFCA5A5),
                valueColor: const AlwaysStoppedAnimation<Color>(
                  Color(0xFFDC2626),
                ),
              ),
            ),
            // Main button
            Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: _isHolding
                      ? [const Color(0xFFB91C1C), const Color(0xFF7F1D1D)]
                      : [const Color(0xFFEF4444), const Color(0xFFDC2626)],
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFDC2626).withOpacity(0.5),
                    blurRadius: _isHolding ? 30 : 20,
                    spreadRadius: _isHolding ? 6 : 2,
                  ),
                ],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.local_hospital_rounded,
                    color: Colors.white,
                    size: 44,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _isHolding
                        ? '${(3 - (_holdProgress * 3)).ceil()}s...'
                        : 'GIỮ ĐỂ\nGỌI',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1,
                      height: 1.2,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Sending View ───────────────────────────────────────────────────────────
  Widget _buildSendingView() {
    return Center(
      key: const ValueKey('sending'),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(
            width: 80,
            height: 80,
            child: CircularProgressIndicator(
              strokeWidth: 6,
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFDC2626)),
            ),
          ),
          const SizedBox(height: 32),
          const Text(
            'Đang gửi tín hiệu...',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: Color(0xFF7F1D1D),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Vui lòng chờ trong giây lát',
            style: TextStyle(fontSize: 15, color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  // ── Success View ───────────────────────────────────────────────────────────
  Widget _buildSuccessView() {
    final name = AuthService.currentUser?.name ?? 'Bạn';
    return Center(
      key: const ValueKey('success'),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ScaleTransition(
              scale: _successAnimation,
              child: Container(
                width: 120,
                height: 120,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0xFFDCFCE7),
                ),
                child: const Icon(
                  Icons.check_circle_rounded,
                  color: Color(0xFF16A34A),
                  size: 72,
                ),
              ),
            ),
            const SizedBox(height: 28),
            const Text(
              'Tín hiệu đã được gửi!',
              style: TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.w900,
                color: Color(0xFF14532D),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Người chăm sóc của $name đã nhận được thông báo khẩn cấp và sẽ liên hệ ngay.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 15,
                color: Colors.grey[700],
                height: 1.6,
              ),
            ),
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF16A34A),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 0,
                ),
                child: const Text(
                  'Đóng',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Error View ─────────────────────────────────────────────────────────────
  Widget _buildErrorView() {
    return Center(
      key: const ValueKey('error'),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0xFFFEE2E2),
              ),
              child: const Icon(
                Icons.wifi_off_rounded,
                color: Color(0xFFDC2626),
                size: 52,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Gửi thất bại',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: Color(0xFF7F1D1D),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 15,
                color: Colors.grey[700],
                height: 1.6,
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _retry,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text(
                  'Thử lại',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFDC2626),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 0,
                ),
              ),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text(
                'Đóng',
                style: TextStyle(
                  color: Color(0xFF6B7280),
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

enum _ScreenState { confirm, sending, success, error }
