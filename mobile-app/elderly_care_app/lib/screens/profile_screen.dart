import 'package:flutter/material.dart';
import '../main.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isUploading = false;
  final ImagePicker _picker = ImagePicker();

  Future<void> _pickImage(ImageSource source) async {
    print('DEBUG: _pickImage called with source: $source');
    try {
      final XFile? image = await _picker.pickImage(
        source: source,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 75,
      );

      print('DEBUG: Image picked: ${image?.path}');

      if (image != null) {
        setState(() => _isUploading = true);
        final newUrl = await AuthService.updateAvatar(image.path);
        setState(() => _isUploading = false);

        if (newUrl != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Cập nhật ảnh đại diện thành công')),
          );
        } else {
          _showError('Không thể tải ảnh lên máy chủ. Vui lòng kiểm tra kết nối mạng.');
        }
      }
    } catch (e) {
      setState(() => _isUploading = false);
      print('Pick image error: $e');
      _showError('Lỗi khi mở máy ảnh hoặc thư viện: $e');
    }
  }

  void _showChangePasswordDialog() {
    final currentPwCtrl = TextEditingController();
    final newPwCtrl = TextEditingController();
    final confirmPwCtrl = TextEditingController();
    bool obscureCurrent = true;
    bool obscureNew = true;
    bool obscureConfirm = true;
    bool isLoading = false;
    String? errorMsg;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Đổi mật khẩu'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (errorMsg != null) ...[
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.danger.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      errorMsg!,
                      style: const TextStyle(color: AppTheme.danger, fontSize: 14),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                TextField(
                  controller: currentPwCtrl,
                  obscureText: obscureCurrent,
                  decoration: InputDecoration(
                    labelText: 'Mật khẩu hiện tại',
                    border: const OutlineInputBorder(),
                    suffixIcon: IconButton(
                      icon: Icon(obscureCurrent ? Icons.visibility_off : Icons.visibility),
                      onPressed: () => setDialogState(() => obscureCurrent = !obscureCurrent),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: newPwCtrl,
                  obscureText: obscureNew,
                  decoration: InputDecoration(
                    labelText: 'Mật khẩu mới',
                    border: const OutlineInputBorder(),
                    suffixIcon: IconButton(
                      icon: Icon(obscureNew ? Icons.visibility_off : Icons.visibility),
                      onPressed: () => setDialogState(() => obscureNew = !obscureNew),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: confirmPwCtrl,
                  obscureText: obscureConfirm,
                  decoration: InputDecoration(
                    labelText: 'Xác nhận mật khẩu mới',
                    border: const OutlineInputBorder(),
                    suffixIcon: IconButton(
                      icon: Icon(obscureConfirm ? Icons.visibility_off : Icons.visibility),
                      onPressed: () => setDialogState(() => obscureConfirm = !obscureConfirm),
                    ),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: isLoading ? null : () => Navigator.pop(ctx),
              child: const Text('Hủy'),
            ),
            TextButton(
              onPressed: isLoading
                  ? null
                  : () async {
                      final current = currentPwCtrl.text.trim();
                      final newPw = newPwCtrl.text.trim();
                      final confirm = confirmPwCtrl.text.trim();

                      if (current.isEmpty || newPw.isEmpty || confirm.isEmpty) {
                        setDialogState(() => errorMsg = 'Vui lòng nhập đầy đủ thông tin.');
                        return;
                      }
                      if (newPw.length < 6) {
                        setDialogState(() => errorMsg = 'Mật khẩu mới phải có ít nhất 6 ký tự.');
                        return;
                      }
                      if (newPw != confirm) {
                        setDialogState(() => errorMsg = 'Mật khẩu xác nhận không khớp.');
                        return;
                      }

                      setDialogState(() { isLoading = true; errorMsg = null; });

                      final result = await AuthService.changePassword(
                        currentPassword: current,
                        newPassword: newPw,
                      );

                      setDialogState(() => isLoading = false);

                      if (result['success'] == true) {
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Đổi mật khẩu thành công'),
                            backgroundColor: AppTheme.secondary,
                          ),
                        );
                      } else {
                        setDialogState(() => errorMsg = result['message'] ?? 'Đổi mật khẩu thất bại.');
                      }
                    },
              child: isLoading
                  ? const SizedBox(
                      width: 18, height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Xác nhận', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  void _showError(String message) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Thông báo'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }

  void _showImageSourceActionSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            Material(
              color: Colors.transparent,
              child: ListTile(
                leading: const Icon(Icons.photo_library_rounded),
                title: const Text('Thư viện ảnh'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.gallery);
                },
              ),
            ),
            Material(
              color: Colors.transparent,
              child: ListTile(
                leading: const Icon(Icons.camera_alt_rounded),
                title: const Text('Máy ảnh'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.camera);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _handleLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xác nhận đăng xuất'),
        content: const Text('Bạn có chắc chắn muốn đăng xuất không?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              AuthService.logout();
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
            },
            child: const Text('Đăng xuất',
                style: TextStyle(color: AppTheme.danger)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthService.currentUser;

    return Scaffold(
      backgroundColor: AppTheme.surface,
      appBar: AppBar(
        title: const Text('Hồ sơ cá nhân'),
        backgroundColor: AppTheme.card,
        surfaceTintColor: Colors.transparent,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 32),

            // Avatar
            Center(
              child: Stack(
                children: [
                  GestureDetector(
                    onTap: _isUploading
                        ? null
                        : () => _showImageSourceActionSheet(context),
                    child: Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        color: AppTheme.primaryLight,
                        shape: BoxShape.circle,
                        border:
                            Border.all(color: AppTheme.primary, width: 3),
                        image: user?.avatarUrl != null
                            ? DecorationImage(
                                image: NetworkImage(
                                    '${ApiService.serverUrl}${user!.avatarUrl}'),
                                fit: BoxFit.cover,
                              )
                            : null,
                      ),
                      child: user?.avatarUrl == null
                          ? const Icon(
                              Icons.person_rounded,
                              size: 80,
                              color: AppTheme.primary,
                            )
                          : null,
                    ),
                  ),
                  if (_isUploading)
                    const Positioned.fill(
                      child: Center(child: CircularProgressIndicator()),
                    ),
                  if (!_isUploading)
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: GestureDetector(
                        onTap: () => _showImageSourceActionSheet(context),
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(
                            color: AppTheme.secondary,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.edit_rounded,
                              color: Colors.white, size: 20),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            Text(
              user?.name ?? 'Chưa cập nhật',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w800,
                color: AppTheme.textPrimary,
              ),
            ),
            Text(
              user?.email ?? 'Chưa cập nhật',
              style: const TextStyle(
                fontSize: 16,
                color: AppTheme.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 32),

            // Settings Section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                decoration: BoxDecoration(
                  color: AppTheme.card,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    _buildActionItem(
                      icon: Icons.security_rounded,
                      label: 'Đổi mật khẩu',
                      onTap: () => _showChangePasswordDialog(),
                      iconColor: AppTheme.primary,
                    ),
                    const Divider(
                        height: 1, color: AppTheme.divider, indent: 60),
                    _buildActionItem(
                      icon: Icons.logout_rounded,
                      label: 'Đăng xuất',
                      onTap: () => _handleLogout(context),
                      iconColor: AppTheme.danger,
                      textColor: AppTheme.danger,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildActionItem({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    required Color iconColor,
    Color? textColor,
  }) {
    return Material(
      color: Colors.transparent,
      child: ListTile(
        onTap: onTap,
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: iconColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: iconColor, size: 22),
        ),
        title: Text(
          label,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: textColor ?? AppTheme.textPrimary,
          ),
        ),
        trailing: const Icon(Icons.chevron_right_rounded,
            color: AppTheme.textMuted),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
    );
  }
}