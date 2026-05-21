import 'dart:convert';
import 'api_service.dart';
import '../models/notification_model.dart';
import 'auth_service.dart';

class NotificationService {
  static Future<List<NotificationModel>> getMyNotifications() async {
    try {
      final userId = AuthService.currentUser?.userId;
      if (userId == null) return [];

      final response = await ApiService.get('notifications?userId=$userId');

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => NotificationModel.fromJson(json)).toList();
      } else {
        return [];
      }
    } catch (e) {
      print('Error fetching notifications: $e');
      return [];
    }
  }

  static Future<bool> markAsRead(String notificationId) async {
    try {
      final response = await ApiService.patch('notifications/$notificationId/read', null);
      return response.statusCode == 200;
    } catch (e) {
      print('Error marking notification as read: $e');
      return false;
    }
  }

  static Future<bool> markAllAsRead() async {
    try {
      final userId = AuthService.currentUser?.userId;
      if (userId == null) return false;

      final response = await ApiService.patch('notifications/user/$userId/read-all', null);
      return response.statusCode == 200;
    } catch (e) {
      print('Error marking all notifications as read: $e');
      return false;
    }
  }
}
