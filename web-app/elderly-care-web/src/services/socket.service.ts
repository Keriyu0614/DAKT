import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5008';

class SocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Set<(data: any) => void>> = new Map();

    connect() {
        if (this.socket?.connected) {
            return;
        }

        this.socket = io(SOCKET_URL, {
            transports: ['polling', 'websocket'],
            autoConnect: true,
        });

        this.socket.on('connect', () => {
            console.log('Socket connected to server');
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected from server');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        // Listen to all events and notify registered listeners
        this.socket.onAny((eventName, ...args) => {
            const callbacks = this.listeners.get(eventName);
            if (callbacks) {
                callbacks.forEach(callback => callback(args[0]));
            }
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    on(event: string, callback: (data: any) => void) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);
    }

    off(event: string, callback: (data: any) => void) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    emit(event: string, data: any) {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        }
    }

    // Emit medication deleted event
    emitMedicationDeleted(medicationId: string, userId?: string) {
        this.emit('medication_deleted', { medicationId, userId });
        console.log('Emitted medication_deleted:', medicationId);
    }

    // Emit appointment deleted event
    emitAppointmentDeleted(appointmentId: string, userId?: string) {
        this.emit('appointment_deleted', { appointmentId, userId });
        console.log('Emitted appointment_deleted:', appointmentId);
    }

    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }
}

// Export singleton instance
export const socketService = new SocketService();
