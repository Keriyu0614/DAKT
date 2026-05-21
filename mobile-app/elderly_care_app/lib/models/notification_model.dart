class NotificationModel {
  final String id;
  final String userId;
  final String title;
  final String message;
  final DateTime sentAt;
  final String status; // Pending, Sent, Delivered, Read, Acknowledged, Failed
  final String priority; // Low, Normal, High, Critical
  final String? sourceReminderId;

  NotificationModel({
    required this.id,
    required this.userId,
    required this.title,
    required this.message,
    required this.sentAt,
    required this.status,
    required this.priority,
    this.sourceReminderId,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'],
      userId: json['userId'],
      title: json['title'],
      message: json['message'],
      sentAt: DateTime.parse(json['sentAt']),
      status: json['status'],
      priority: json['priority'],
      sourceReminderId: json['sourceReminderId'],
    );
  }
}
