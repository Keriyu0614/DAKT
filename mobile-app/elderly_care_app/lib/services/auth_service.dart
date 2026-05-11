import 'dart:convert';
import 'api_service.dart';
import '../models/user_model.dart';

class AuthService {
  static UserModel? currentUser;

  static Future<bool> login(String email, String password) async {
    try {
      final response = await ApiService.post('auth/login', {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        currentUser = UserModel.fromJson(data);
        ApiService.setToken(currentUser!.token);
        return true;
      } else {
        return false;
      }
    } catch (e) {
      print('Login error: $e');
      return false;
    }
  }

  static Future<bool> loginAsGuest() async {
    try {
      // Create a dummy guest user for demo/testing
      currentUser = UserModel(
        userId: 'guest-id',
        name: 'Khách',
        email: 'guest@example.com',
        role: 'Elderly',
        token: 'demo-token-guest',
      );
      ApiService.setToken(currentUser!.token);
      return true;
    } catch (e) {
      print('Guest login error: $e');
      return false;
    }
  }

  static Future<bool> register(String name, String email, String password) async {
    try {
      final response = await ApiService.post('auth/register', {
        'name': name,
        'email': email,
        'password': password,
        'role': 0, // Default to Elderly
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        currentUser = UserModel.fromJson(data);
        ApiService.setToken(currentUser!.token);
        return true;
      } else {
        return false;
      }
    } catch (e) {
      print('Registration error: $e');
      return false;
    }
  }

  static void logout() {
    currentUser = null;
    ApiService.setToken('');
  }
}
