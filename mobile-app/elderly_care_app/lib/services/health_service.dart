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
  static Future<bool> addHealthLog({
    int? systolic,
    int? diastolic,
    int? heartRate,
  }) async {
    try {
      final userId = AuthService.currentUser?.userId;
      if (userId == null) return false;

      final nowString = DateTime.now().toUtc().toIso8601String();
      final response = await ApiService.post('health-logs', {
        'userId': userId,
        'date': nowString,
        'recordedAt': nowString,
        'systolic': systolic,
        'diastolic': diastolic,
        'heartRate': heartRate,
        'recordedBy': 'self',
      });

      return response.statusCode == 201 || response.statusCode == 200;
    } catch (e) {
      print('Error adding health log: $e');
      return false;
    }
  }
}
