class HealthLogModel {
  final String id;
  final String userId;
  final DateTime date;
  final String bloodPressure;
  final int? heartRate;
  final String? note;
  final double? weight;

  HealthLogModel({
    required this.id,
    required this.userId,
    required this.date,
    required this.bloodPressure,
    this.heartRate,
    this.note,
    this.weight,
  });

  factory HealthLogModel.fromJson(Map<String, dynamic> json) {
    return HealthLogModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      date: DateTime.parse(json['date']),
      bloodPressure: json['bloodPressure'] ?? '',
      heartRate: json['heartRate'],
      note: json['note'],
      weight: (json['weight'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'date': date.toIso8601String(),
      'bloodPressure': bloodPressure,
      'heartRate': heartRate,
      'note': note,
      'weight': weight,
    };
  }
}
