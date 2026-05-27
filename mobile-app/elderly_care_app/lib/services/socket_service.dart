import 'dart:developer' as dev;
import 'package:flutter/material.dart';
import '../main.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'api_service.dart';

class SocketService {
  static IO.Socket? _socket;
  static final Map<String, Set<Function(dynamic)>> _listeners = {};
  static bool _isConnecting = false;

  static IO.Socket? get socket => _socket;
  static bool get isConnected => _socket != null && _socket!.connected;

  static void connect() {
    if (_socket != null && _socket!.connected) {
      dev.log('Socket already connected');
      return;
    }

    if (_isConnecting) {
      dev.log('Socket connection already in progress');
      return;
    }

    _isConnecting = true;

    try {
      final uri = Uri.parse(ApiService.serverUrl);
      final socketUrl = '${uri.scheme}://${uri.host}:5008';
      
      dev.log('Connecting to socket server: $socketUrl');
      
      _socket = IO.io(socketUrl, IO.OptionBuilder()
        .setTransports(['websocket'])
        .disableAutoConnect()
        .setReconnectionAttempts(5)
        .setReconnectionDelay(2000)
        .build()
      );

      _socket!.connect();

      _socket!.onConnect((_) {
        dev.log('✅ Connected to socket server');
        _isConnecting = false;
        // Re-register all existing listeners after connection
        _reregisterListeners();
      });

      _socket!.onDisconnect((_) {
        dev.log('❌ Disconnected from socket server');
        _isConnecting = false;
      });

      _socket!.onConnectError((data) {
        dev.log('❌ Socket Connection Error: $data');
        _isConnecting = false;
      });

      _socket!.onError((data) {
        dev.log('❌ Socket Error: $data');
      });

      // Listen to all events and notify registered listeners
      _socket!.onAny((event, data) {
        dev.log('📡 Socket event received: $event with data: $data');
        final callbacks = _listeners[event];
        if (callbacks != null && callbacks.isNotEmpty) {
          dev.log('   → Notifying ${callbacks.length} listener(s) for event: $event');
          for (var callback in callbacks) {
            try {
              callback(data);
            } catch (e) {
              dev.log('   ❌ Error in socket callback for event $event: $e');
            }
          }
        } else {
          dev.log('   ⚠️ No listeners registered for event: $event');
        }
      });
    } catch (e) {
      dev.log('❌ Socket initialization error: $e');
      _isConnecting = false;
    }
  }

  static void _reregisterListeners() {
    // This ensures listeners work even if registered before connection
    dev.log('Re-registering ${_listeners.length} event types with ${_listeners.values.fold(0, (sum, set) => sum + set.length)} total listeners');
    for (var entry in _listeners.entries) {
      dev.log('  - ${entry.key}: ${entry.value.length} listener(s)');
    }
  }

  static void disconnect() {
    if (_socket != null) {
      _socket!.disconnect();
      _socket = null;
      _isConnecting = false;
      dev.log('Socket disconnected manually');
    }
  }

  // Register event listener
  static void on(String event, Function(dynamic) callback) {
    if (!_listeners.containsKey(event)) {
      _listeners[event] = {};
    }
    _listeners[event]!.add(callback);
    dev.log('✅ Registered listener for event: $event (total: ${_listeners[event]!.length})');
  }

  // Unregister event listener
  static void off(String event, Function(dynamic) callback) {
    if (_listeners.containsKey(event)) {
      _listeners[event]!.remove(callback);
      if (_listeners[event]!.isEmpty) {
        _listeners.remove(event);
      }
      dev.log('✅ Unregistered listener for event: $event');
    }
  }

  static void emitAppointmentDone(String appointmentId, {String? doctorName, String? userId}) {
    if (_socket == null || !_socket!.connected) {
      dev.log('⚠️ Socket not connected, connecting now...');
      connect();
      // Wait a bit for connection
      Future.delayed(const Duration(milliseconds: 500), () {
        if (_socket != null && _socket!.connected) {
          _socket!.emit('appointment_done', {
            'appointmentId': appointmentId,
            'doctorName': doctorName,
            'userId': userId,
          });
          dev.log('📤 Socket emitted appointment_done: $appointmentId');
        } else {
          dev.log('❌ Failed to emit appointment_done: socket not connected');
        }
      });
    } else {
      _socket!.emit('appointment_done', {
        'appointmentId': appointmentId,
        'doctorName': doctorName,
        'userId': userId,
      });
      dev.log('📤 Socket emitted appointment_done: $appointmentId');
    }
  }

  // Emit medication taken event
  static void emitMedicationTaken(String reminderId, {String? medicationName, String? userId}) {
    if (_socket == null || !_socket!.connected) {
      dev.log('⚠️ Socket not connected, connecting now...');
      connect();
      // Wait a bit for connection
      Future.delayed(const Duration(milliseconds: 500), () {
        if (_socket != null && _socket!.connected) {
          _socket!.emit('medication_taken', {
            'reminderId': reminderId,
            'medicationName': medicationName,
            'userId': userId,
          });
          dev.log('📤 Socket emitted medication_taken: $reminderId');
        } else {
          dev.log('❌ Failed to emit medication_taken: socket not connected');
        }
      });
    } else {
      _socket!.emit('medication_taken', {
        'reminderId': reminderId,
        'medicationName': medicationName,
        'userId': userId,
      });
      dev.log('📤 Socket emitted medication_taken: $reminderId');
    }
  }

  // Emit medication snoozed event
  static void emitMedicationSnoozed(String reminderId, {String? medicationName, String? userId}) {
    if (_socket == null || !_socket!.connected) {
      dev.log('⚠️ Socket not connected, connecting now...');
      connect();
      // Wait a bit for connection
      Future.delayed(const Duration(milliseconds: 500), () {
        if (_socket != null && _socket!.connected) {
          _socket!.emit('medication_snoozed', {
            'reminderId': reminderId,
            'medicationName': medicationName,
            'userId': userId,
          });
          dev.log('📤 Socket emitted medication_snoozed: $reminderId');
        } else {
          dev.log('❌ Failed to emit medication_snoozed: socket not connected');
        }
      });
    } else {
      _socket!.emit('medication_snoozed', {
        'reminderId': reminderId,
        'medicationName': medicationName,
        'userId': userId,
      });
      dev.log('📤 Socket emitted medication_snoozed: $reminderId');
    }
  }

  /// Emit health_log_submitted event so caregiver gets real-time notification on web
  static void emitHealthLogSubmitted({
    required String userId,
    required String healthLogId,
    String? bloodPressure,
    int? heartRate,
    double? weight,
  }) {
    final payload = {
      'userId': userId,
      'healthLogId': healthLogId,
      if (bloodPressure != null) 'bloodPressure': bloodPressure,
      if (heartRate != null) 'heartRate': heartRate,
      if (weight != null) 'weight': weight,
    };

    if (_socket == null || !_socket!.connected) {
      dev.log('⚠️ Socket not connected, connecting now...');
      connect();
      Future.delayed(const Duration(milliseconds: 500), () {
        if (_socket != null && _socket!.connected) {
          _socket!.emit('health_log_submitted', payload);
          dev.log('📤 Socket emitted health_log_submitted: $healthLogId');
        } else {
          dev.log('❌ Failed to emit health_log_submitted: socket not connected');
        }
      });
    } else {
      _socket!.emit('health_log_submitted', payload);
      dev.log('📤 Socket emitted health_log_submitted: $healthLogId');
    }
  }
}
