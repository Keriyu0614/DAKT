import 'dart:convert';
import 'api_service.dart';
import '../models/reminder_model.dart';
import 'auth_service.dart';

class ReminderService {
  static Future<List<ReminderModel>> getMyReminders() async {
    try {
      final userId = AuthService.currentUser?.userId;
      if (userId == null) return [];

      final response = await ApiService.get('reminders/user/$userId');

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => ReminderModel.fromJson(json)).toList();
      } else {
        return [];
      }
    } catch (e) {
      print('Error fetching reminders: $e');
      return [];
    }
  }
}
