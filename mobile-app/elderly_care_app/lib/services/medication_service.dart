import 'dart:convert';
import 'api_service.dart';
import '../models/medication_model.dart';
import 'auth_service.dart';

class MedicationService {
  static Future<List<MedicationModel>> getMyMedications() async {
    final userId = AuthService.currentUser?.userId;
    if (userId == null) return [];

    final response = await ApiService.get('medications?userId=$userId');

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => MedicationModel.fromJson(json)).toList();
    } else {
      throw Exception('Failed to fetch medications');
    }
  }
}
