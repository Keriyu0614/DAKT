import 'dart:convert';
import 'api_service.dart';
import '../models/appointment_model.dart';
import 'auth_service.dart';

class AppointmentService {
  static Future<List<AppointmentModel>> getMyAppointments() async {
    try {
      final userId = AuthService.currentUser?.userId;
      if (userId == null) return [];

      final response = await ApiService.get('appointments/user/$userId');

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => AppointmentModel.fromJson(json)).toList();
      } else {
        return [];
      }
    } catch (e) {
      print('Error fetching appointments: $e');
      return [];
    }
  }
}
