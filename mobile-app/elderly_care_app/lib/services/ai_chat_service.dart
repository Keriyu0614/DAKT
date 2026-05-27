import 'dart:convert';
import 'package:http/http.dart' as http;
import 'dart:developer' as dev;
import '../config/api_config.dart';

class AiChatService {
  // API configuration moved to api_config.dart for security
  static const String _apiKey = ApiConfig.openRouterApiKey;
  static const String _apiUrl = ApiConfig.openRouterApiUrl;
  static const String _model = ApiConfig.aiModel;

  static Future<String> sendMessage(String userMessage, List<Map<String, String>> conversationHistory) async {
    try {
      dev.log('=== Sending message to AI ===');
      dev.log('User message: $userMessage');
      dev.log('Model: $_model');

      // Build messages array with system prompt
      final messages = [
        {
          'role': 'system',
          'content': '''Bạn là trợ lý AI chuyên về sức khỏe người cao tuổi, thân thiện và am hiểu.

NHIỆM VỤ:
- Tư vấn về sức khỏe, dinh dưỡng, tập luyện cho người cao tuổi
- Giải đáp thắc mắc về thuốc, bệnh tật, triệu chứng
- Đưa ra lời khuyên chăm sóc sức khỏe hàng ngày
- Hỗ trợ về tâm lý, tinh thần

QUY TẮC:
- Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu
- Thân thiện, tôn trọng, kiên nhẫn
- Nếu vấn đề nghiêm trọng, khuyên đi khám bác sĩ
- Không thay thế ý kiến bác sĩ chuyên môn
- Tập trung vào phòng ngừa và chăm sóc sức khỏe

PHONG CÁCH:
- Gọi người dùng là "bác" hoặc "cô/chú"
- Dùng emoji phù hợp (❤️ 💊 🏥 🍎 🧘)
- Chia nhỏ thông tin thành các điểm dễ đọc
- Khuyến khích lối sống lành mạnh'''
        },
        ...conversationHistory,
        {
          'role': 'user',
          'content': userMessage,
        }
      ];

      dev.log('Sending request to OpenRouter...');
      final requestBody = {
        'model': _model,
        'messages': messages,
        'temperature': 0.7,
        'max_tokens': 800,
      };
      dev.log('Request body: ${jsonEncode(requestBody)}');

      final response = await http.post(
        Uri.parse(_apiUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_apiKey',
          'HTTP-Referer': ApiConfig.appReferer,
          'X-Title': ApiConfig.appTitle,
        },
        body: jsonEncode(requestBody),
      ).timeout(const Duration(seconds: 30));

      dev.log('Response status: ${response.statusCode}');
      dev.log('Response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        // Check if response has expected structure
        if (data['choices'] == null || data['choices'].isEmpty) {
          dev.log('ERROR: No choices in response');
          throw Exception('Invalid response structure');
        }
        
        final aiResponse = data['choices'][0]['message']['content'] as String;
        dev.log('AI response: $aiResponse');
        return aiResponse;
      } else {
        dev.log('ERROR: HTTP ${response.statusCode}');
        dev.log('Error response body: ${response.body}');
        
        // Try to parse error message
        try {
          final errorData = jsonDecode(response.body);
          final errorMessage = errorData['error']?['message'] ?? 'Unknown error';
          dev.log('Error message: $errorMessage');
          return 'Xin lỗi, có lỗi xảy ra: $errorMessage 🙏';
        } catch (e) {
          return 'Xin lỗi, không thể kết nối với AI. Vui lòng thử lại sau. 🙏';
        }
      }
    } on http.ClientException catch (e) {
      dev.log('❌ Network error: $e');
      return 'Xin lỗi, không có kết nối mạng. Vui lòng kiểm tra internet. 📡';
    } on FormatException catch (e) {
      dev.log('❌ JSON parse error: $e');
      return 'Xin lỗi, dữ liệu trả về không hợp lệ. Vui lòng thử lại. 🙏';
    } catch (e, stackTrace) {
      dev.log('❌ Error in sendMessage: $e');
      dev.log('Stack trace: $stackTrace');
      return 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau. 🙏';
    }
  }

  // Get suggested questions for first-time users
  static List<String> getSuggestedQuestions() {
    return [
      '💊 Tôi nên uống thuốc huyết áp vào lúc nào?',
      '🍎 Chế độ ăn nào tốt cho người cao tuổi?',
      '🧘 Bài tập nào phù hợp với người già?',
      '😴 Làm sao để ngủ ngon hơn?',
      '🏥 Khi nào cần đi khám bác sĩ?',
    ];
  }
}
