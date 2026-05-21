class UserModel {
  final String userId;
  final String name;
  final String email;
  final String role;
  final String token;
  final String? avatarUrl;

  UserModel({
    required this.userId,
    required this.name,
    required this.email,
    required this.role,
    required this.token,
    this.avatarUrl,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      userId: json['userId'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? '',
      token: json['token'] ?? '',
      avatarUrl: json['avatarUrl'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'name': name,
      'email': email,
      'role': role,
      'token': token,
      'avatarUrl': avatarUrl,
    };
  }
}
