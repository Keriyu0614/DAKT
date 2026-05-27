/// API Configuration Example
/// Copy this file to api_config.dart and fill in your actual API keys
/// 
/// SETUP INSTRUCTIONS:
/// 1. Copy this file: cp api_config.example.dart api_config.dart
/// 2. Get your OpenRouter API key from: https://openrouter.ai/keys
/// 3. Replace 'YOUR_OPENROUTER_API_KEY_HERE' with your actual key
/// 4. Never commit api_config.dart to version control!

class ApiConfig {
  // OpenRouter AI API Key
  // Get your free API key from: https://openrouter.ai/keys
  static const String openRouterApiKey = 'YOUR_OPENROUTER_API_KEY_HERE';
  
  // OpenRouter API URL
  static const String openRouterApiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  
  // AI Model to use (free model)
  static const String aiModel = 'liquid/lfm-2.5-1.2b-instruct:free';
  
  // App information for OpenRouter
  static const String appReferer = 'https://elderly-care-app.com';
  static const String appTitle = 'Elderly Care Health Assistant';
}
