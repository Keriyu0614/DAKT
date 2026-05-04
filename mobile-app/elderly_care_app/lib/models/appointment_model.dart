class AppointmentModel {
  final String id;
  final String userId;
  final String doctorName;
  final String location;
  final DateTime appointmentDate;
  final String? notes;

  AppointmentModel({
    required this.id,
    required this.userId,
    required this.doctorName,
    required this.location,
    required this.appointmentDate,
    this.notes,
  });

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    return AppointmentModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      doctorName: json['doctorName'] ?? '',
      location: json['location'] ?? '',
      appointmentDate: DateTime.parse(json['appointmentDate']),
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'doctorName': doctorName,
      'location': location,
      'appointmentDate': appointmentDate.toIso8601String(),
      'notes': notes,
    };
  }
}
