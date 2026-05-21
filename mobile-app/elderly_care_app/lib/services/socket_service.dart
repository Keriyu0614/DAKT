import 'dart:developer' as dev;
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'api_service.dart';

class SocketService {
  static IO.Socket? _socket;

  static IO.Socket? get socket => _socket;

  static void connect() {
    if (_socket != null && _socket!.connected) return;

    try {
      final uri = Uri.parse(ApiService.serverUrl);
      final socketUrl = '${uri.scheme}://${uri.host}:5006';
      
      dev.log('Connecting to socket server: $socketUrl');
      
      _socket = IO.io(socketUrl, IO.OptionBuilder()
        .setTransports(['websocket'])
        .disableAutoConnect()
        .build()
      );

      _socket!.connect();

      _socket!.onConnect((_) {
        dev.log('Connected to socket server');
      });

      _socket!.onDisconnect((_) {
        dev.log('Disconnected from socket server');
      });

      _socket!.onConnectError((data) {
        dev.log('Socket Connection Error: $data');
      });
    } catch (e) {
      dev.log('Socket initialization error: $e');
    }
  }

  static void disconnect() {
    if (_socket != null) {
      _socket!.disconnect();
      _socket = null;
    }
  }

  static void emitMedicationTaken(String reminderId) {
    if (_socket == null || !_socket!.connected) {
      connect();
    }
    _socket?.emit('medication_taken', {'reminderId': reminderId});
    dev.log('Socket emitted medication_taken: $reminderId');
  }
}
