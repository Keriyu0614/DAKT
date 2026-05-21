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
    ReminderType parsedType = ReminderType.medication;
    final rawType = json['type'];
    if (rawType is int) {
      if (rawType >= 0 && rawType < ReminderType.values.length) {
        parsedType = ReminderType.values[rawType];
      }
    } else if (rawType is String) {
      switch (rawType.toLowerCase()) {
        case 'medication':
          parsedType = ReminderType.medication;
          break;
        case 'appointment':
          parsedType = ReminderType.appointment;
          break;
        case 'exercise':
          parsedType = ReminderType.exercise;
          break;
      }
    }

    ReminderStatus parsedStatus = ReminderStatus.pending;
    final rawStatus = json['status'];
    if (rawStatus is int) {
      if (rawStatus >= 0 && rawStatus < ReminderStatus.values.length) {
        parsedStatus = ReminderStatus.values[rawStatus];
      }
    } else if (rawStatus is String) {
      switch (rawStatus.toLowerCase()) {
        case 'pending':
          parsedStatus = ReminderStatus.pending;
          break;
        case 'done':
          parsedStatus = ReminderStatus.done;
          break;
        case 'missed':
          parsedStatus = ReminderStatus.missed;
          break;
      }
    }

    return ReminderModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      type: parsedType,
      referenceId: json['referenceId'] ?? '',
      scheduledTime: DateTime.parse(json['scheduledTime']),
      status: parsedStatus,
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
