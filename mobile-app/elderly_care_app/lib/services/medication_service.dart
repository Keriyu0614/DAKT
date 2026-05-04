import 'dart:convert';
import 'api_service.dart';
import '../models/medication_model.dart';
import 'auth_service.dart';

class MedicationService {
  static Future<List<MedicationModel>> getMyMedications() async {
    try {
      final userId = AuthService.currentUser?.userId;
      if (userId == null) return [];

      final response = await ApiService.get('medications/user/$userId');

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => MedicationModel.fromJson(json)).toList();
      } else {
        return [];
      }
    } catch (e) {
      print('Error fetching medications: $e');
      return [];
    }
  }
}
