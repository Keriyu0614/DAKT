import 'dart:convert';
import 'api_service.dart';
import 'socket_service.dart';
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
    double? weight,
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
        if (weight != null) 'weight': weight,
        'recordedBy': 'self',
      });

      if (response.statusCode == 201 || response.statusCode == 200) {
        // Emit socket event so caregiver gets real-time notification on web
        try {
          final body = jsonDecode(response.body);
          final healthLogId = body['id'] ?? '';
          final bpStr = (systolic != null && diastolic != null)
              ? '$systolic/$diastolic'
              : null;
          SocketService.emitHealthLogSubmitted(
            userId: userId,
            healthLogId: healthLogId,
            bloodPressure: bpStr,
            heartRate: heartRate,
          );
        } catch (e) {
          print('Error emitting health_log_submitted socket event: $e');
        }
        return true;
      }
      return false;
    } catch (e) {
      print('Error adding health log: $e');
      return false;
    }
  }
}
