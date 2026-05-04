enum ReminderType { medication, appointment, exercise }
enum ReminderStatus { pending, done, missed }

class ReminderModel {
  final String id;
  final String userId;
  final ReminderType type;
  final String referenceId;
  final DateTime scheduledTime;
  final ReminderStatus status;

  ReminderModel({
    required this.id,
    required this.userId,
    required this.type,
    required this.referenceId,
    required this.scheduledTime,
    required this.status,
  });

  factory ReminderModel.fromJson(Map<String, dynamic> json) {
    return ReminderModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      type: ReminderType.values[json['type'] ?? 0],
      referenceId: json['referenceId'] ?? '',
      scheduledTime: DateTime.parse(json['scheduledTime']),
      status: ReminderStatus.values[json['status'] ?? 0],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'type': type.index,
      'referenceId': referenceId,
      'scheduledTime': scheduledTime.toIso8601String(),
      'status': status.index,
    };
  }
}
