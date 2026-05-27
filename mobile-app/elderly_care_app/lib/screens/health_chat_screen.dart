import 'dart:developer' as dev;
import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../main.dart';
import '../models/chat_message_model.dart';
import '../services/ai_chat_service.dart';

class HealthChatScreen extends StatefulWidget {
  const HealthChatScreen({super.key});

  @override
  State<HealthChatScreen> createState() => _HealthChatScreenState();
}

class _HealthChatScreenState extends State<HealthChatScreen> {
  final List<ChatMessage> _messages = [];
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final Uuid _uuid = const Uuid();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _addWelcomeMessage();
  }

  void _addWelcomeMessage() {
    setState(() {
      _messages.add(ChatMessage(
        id: _uuid.v4(),
        content: '''Xin chào! 👋

Tôi là trợ lý AI chuyên về sức khỏe người cao tuổi. Tôi có thể giúp bác:

❤️ Tư vấn về sức khỏe và dinh dưỡng
💊 Giải đáp về thuốc và bệnh tật
🧘 Hướng dẫn tập luyện phù hợp
😴 Cải thiện giấc ngủ và tinh thần

Bác có thắc mắc gì về sức khỏe không?''',
        isUser: false,
        timestamp: DateTime.now(),
      ));
    });
  }

  void _handleSendMessage(String text) async {
    if (text.trim().isEmpty) return;

    final userMessage = ChatMessage(
      id: _uuid.v4(),
      content: text.trim(),
      isUser: true,
      timestamp: DateTime.now(),
    );

    setState(() {
      _messages.add(userMessage);
      _isLoading = true;
    });

    _textController.clear();
    _scrollToBottom();

    try {
      // Build conversation history for context
      final conversationHistory = _messages
          .where((m) => m.content != _messages.first.content) // Skip welcome message
          .map((m) => {
                'role': m.isUser ? 'user' : 'assistant',
                'content': m.content,
              })
          .toList();

      final aiResponse = await AiChatService.sendMessage(
        text.trim(),
        conversationHistory,
      );

      final aiMessage = ChatMessage(
        id: _uuid.v4(),
        content: aiResponse,
        isUser: false,
        timestamp: DateTime.now(),
      );

      setState(() {
        _messages.add(aiMessage);
        _isLoading = false;
      });

      _scrollToBottom();
    } catch (e) {
      dev.log('Error sending message: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _handleSuggestedQuestion(String question) {
    _textController.text = question;
    _handleSendMessage(question);
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surface,
      appBar: AppBar(
        backgroundColor: AppTheme.card,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppTheme.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.primaryLight,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.psychology_rounded,
                color: AppTheme.primary,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Trợ lý Sức khỏe AI',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textPrimary,
                  ),
                ),
                Text(
                  'Luôn sẵn sàng hỗ trợ',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Messages list
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                return _MessageBubble(message: message);
              },
            ),
          ),

          // Loading indicator
          if (_isLoading)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryLight,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.psychology_rounded,
                      color: AppTheme.primary,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'Đang suy nghĩ...',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.textSecondary,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary),
                    ),
                  ),
                ],
              ),
            ),

          // Suggested questions (only show when no messages except welcome)
          if (_messages.length == 1)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Câu hỏi gợi ý:',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: AiChatService.getSuggestedQuestions()
                        .map((q) => _SuggestedQuestionChip(
                              question: q,
                              onTap: () => _handleSuggestedQuestion(q),
                            ))
                        .toList(),
                  ),
                ],
              ),
            ),

          // Input area
          Container(
            decoration: BoxDecoration(
              color: AppTheme.card,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppTheme.surface,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: TextField(
                          controller: _textController,
                          maxLines: null,
                          textInputAction: TextInputAction.send,
                          onSubmitted: _handleSendMessage,
                          style: const TextStyle(
                            fontSize: 15,
                            color: AppTheme.textPrimary,
                          ),
                          decoration: const InputDecoration(
                            hintText: 'Nhập câu hỏi của bạn...',
                            hintStyle: TextStyle(
                              color: AppTheme.textMuted,
                              fontSize: 15,
                            ),
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 12,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: _isLoading
                          ? null
                          : () => _handleSendMessage(_textController.text),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: _isLoading ? AppTheme.border : AppTheme.primary,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.send_rounded,
                          color: Colors.white,
                          size: 22,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
// MESSAGE BUBBLE
// ─────────────────────────────────────────────
class _MessageBubble extends StatelessWidget {
  final ChatMessage message;

  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment:
            message.isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!message.isUser) ...[
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.primaryLight,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.psychology_rounded,
                color: AppTheme.primary,
                size: 20,
              ),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: message.isUser ? AppTheme.primary : AppTheme.card,
                borderRadius: BorderRadius.circular(16),
                border: message.isUser
                    ? null
                    : Border.all(color: AppTheme.border),
              ),
              child: Text.rich(
                _parseMarkdown(
                  message.content,
                  TextStyle(
                    fontSize: 15,
                    color: message.isUser ? Colors.white : AppTheme.textPrimary,
                    height: 1.4,
                  ),
                ),
              ),
            ),
          ),
          if (message.isUser) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.primaryLight,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.person_rounded,
                color: AppTheme.primary,
                size: 20,
              ),
            ),
          ],
        ],
      ),
    );
  }

  TextSpan _parseMarkdown(String text, TextStyle baseStyle) {
    final List<TextSpan> spans = [];
    final parts = text.split('**');

    for (int i = 0; i < parts.length; i++) {
      if (parts[i].isEmpty) continue;
      if (i % 2 == 1) {
        spans.add(TextSpan(
          text: parts[i],
          style: baseStyle.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ));
      } else {
        spans.add(TextSpan(
          text: parts[i],
          style: baseStyle,
        ));
      }
    }

    return TextSpan(children: spans);
  }
}

// ─────────────────────────────────────────────
// SUGGESTED QUESTION CHIP
// ─────────────────────────────────────────────
class _SuggestedQuestionChip extends StatelessWidget {
  final String question;
  final VoidCallback onTap;

  const _SuggestedQuestionChip({
    required this.question,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: AppTheme.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.border),
        ),
        child: Text(
          question,
          style: const TextStyle(
            fontSize: 13,
            color: AppTheme.textSecondary,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }
}
