import 'dart:convert';
import 'dart:developer' as dev;
import 'api_service.dart';
import 'auth_service.dart';

class EmergencyService {
  static Future<bool> triggerEmergency({
    double? latitude,
    double? longitude,
    String? message,
  }) async {
    final userId = AuthService.currentUser?.userId;
    if (userId == null) {
      dev.log('❌ EmergencyService: userId is null — user not logged in');
      return false;
    }

    try {
      dev.log('📡 EmergencyService: POST emergency/trigger for userId=$userId');
      final response = await ApiService.post('emergency/trigger', {
        'userId': userId,
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
        'message': message ?? 'Cần hỗ trợ khẩn cấp',
      });

      dev.log('📡 EmergencyService: response status=${response.statusCode}');
      dev.log('📡 EmergencyService: response body=${response.body}');

      return response.statusCode == 202;
    } catch (e) {
      dev.log('❌ EmergencyService: exception=$e');
      return false;
    }
  }
}
