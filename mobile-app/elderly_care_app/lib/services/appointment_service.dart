import 'dart:convert';
import 'dart:developer' as dev;
import 'api_service.dart';
import '../models/appointment_model.dart';
import 'auth_service.dart';

class AppointmentService {
  static Future<List<AppointmentModel>> getMyAppointments() async {
    final userId = AuthService.currentUser?.userId;
    if (userId == null) {
      dev.log('AppointmentService: No userId found');
      return [];
    }

    dev.log('AppointmentService: Fetching appointments for userId=$userId');
    final response = await ApiService.get('appointments?userId=$userId');

    dev.log('AppointmentService: Response status=${response.statusCode}');
    dev.log('AppointmentService: Response body=${response.body}');

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      dev.log('AppointmentService: Parsed ${data.length} appointments');
      return data.map((json) => AppointmentModel.fromJson(json)).toList();
    } else {
      dev.log('AppointmentService: Failed with status ${response.statusCode}');
      throw Exception('Failed to fetch appointments');
    }
  }
}
