class MedicationModel {
  final String id;
  final String userId;
  final String medicationName;
  final String dosage;
  final String frequency;
  final String scheduledTimes;
  final String? instructions;
  final DateTime startDate;
  final DateTime? endDate;

  MedicationModel({
    required this.id,
    required this.userId,
    required this.medicationName,
    required this.dosage,
    required this.frequency,
    required this.scheduledTimes,
    this.instructions,
    required this.startDate,
    this.endDate,
  });

  factory MedicationModel.fromJson(Map<String, dynamic> json) {
    return MedicationModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      medicationName: json['medicationName'] ?? '',
      dosage: json['dosage'] ?? '',
      frequency: json['frequency'] ?? '',
      scheduledTimes: json['scheduledTimes'] ?? '',
      instructions: json['instructions'],
      startDate: DateTime.parse(json['startDate']),
      endDate: json['endDate'] != null ? DateTime.parse(json['endDate']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'medicationName': medicationName,
      'dosage': dosage,
      'frequency': frequency,
      'scheduledTimes': scheduledTimes,
      'instructions': instructions,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate?.toIso8601String(),
    };
  }
}
