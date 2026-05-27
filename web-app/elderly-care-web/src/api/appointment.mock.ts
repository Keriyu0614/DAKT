import type { CreateAppointmentPayload } from './appointment.api';

// MOCK DATA – DEV ONLY – DO NOT SHIP

export interface Appointment {
    id: string;
    doctorName: string;
    specialty: string;
    dateTime: string;
    location: string;
    notes: string;
    status: 'upcoming' | 'completed' | 'cancelled';
}

const now = new Date();
const getOffsetDate = (days: number, hours = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(d.getHours() + hours);
    return d.toISOString();
};

let mockAppointments: Appointment[] = [];

export const appointmentMockService = {
    getAll: async () => {
        return { data: [...mockAppointments] };
    },

    create: async (payload: CreateAppointmentPayload) => {
        const newAppt: Appointment = {
            id: crypto.randomUUID(),
            doctorName: payload.doctorName,
            specialty: payload.specialty || 'General',
            dateTime: payload.appointmentDate,
            location: payload.location,
            notes: payload.notes || '',
            status: 'upcoming'
        };
        mockAppointments.push(newAppt);
        return { data: newAppt };
    },

    update: async (id: string, payload: Partial<CreateAppointmentPayload>) => {
        const index = mockAppointments.findIndex(a => a.id === id);
        if (index !== -1) {
            mockAppointments[index] = {
                ...mockAppointments[index],
                doctorName: payload.doctorName || mockAppointments[index].doctorName,
                location: payload.location || mockAppointments[index].location,
                dateTime: payload.appointmentDate || mockAppointments[index].dateTime,
                notes: payload.notes || mockAppointments[index].notes,
                specialty: payload.specialty || mockAppointments[index].specialty
            };
            return { data: mockAppointments[index] };
        }
        throw new Error('Appointment not found');
    },

    delete: async (id: string) => {
        mockAppointments = mockAppointments.filter(a => a.id !== id);
        return { data: null };
    }
};
