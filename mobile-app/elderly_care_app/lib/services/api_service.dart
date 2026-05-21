import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Use 10.0.2.2 for Android Emulator, localhost for iOS/Web
  static const String baseUrl = 'http://192.168.0.160:5041/api';
  static const String serverUrl = 'http://192.168.0.160:5041';
  
  static String? _token;

  static void setToken(String token) {
    _token = token;
  }

  static Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (_token != null) 'Authorization': 'Bearer $_token',
  };

  static Future<http.Response> get(String endpoint) async {
    final response = await http.get(
      Uri.parse('$baseUrl/$endpoint'),
      headers: _headers,
    );
    return response;
  }

  static Future<http.Response> post(String endpoint, dynamic data) async {
    final response = await http.post(
      Uri.parse('$baseUrl/$endpoint'),
      headers: _headers,
      body: jsonEncode(data),
    );
    return response;
  }

  static Future<http.Response> put(String endpoint, dynamic data) async {
    final response = await http.put(
      Uri.parse('$baseUrl/$endpoint'),
      headers: _headers,
      body: jsonEncode(data),
    );
    return response;
  }

  static Future<http.Response> delete(String endpoint) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/$endpoint'),
      headers: _headers,
    );
    return response;
  }

  static Future<http.Response> patch(String endpoint, dynamic data) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/$endpoint'),
      headers: _headers,
      body: data != null ? jsonEncode(data) : null,
    );
    return response;
  }

  static Future<http.StreamedResponse> uploadFile(String endpoint, String filePath, String fieldName) async {
    final request = http.MultipartRequest('POST', Uri.parse('$baseUrl/$endpoint'));
    
    if (_token != null) {
      request.headers['Authorization'] = 'Bearer $_token';
    }
    
    request.files.add(await http.MultipartFile.fromPath(fieldName, filePath));
    
    return await request.send();
  }
}
