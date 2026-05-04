import 'dart:convert';
import 'api_service.dart';
import '../models/health_log_model.dart';
import 'auth_service.dart';

class HealthService {
  static Future<List<HealthLogModel>> getMyHealthLogs() async {
    try {
      final userId = AuthService.currentUser?.userId;
      if (userId == null) return [];

      final response = await ApiService.get('health-logs/user/$userId');

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => HealthLogModel.fromJson(json)).toList();
      } else {
        return [];
      }
    } catch (e) {
      print('Error fetching health logs: $e');
      return [];
    }
  }
}
