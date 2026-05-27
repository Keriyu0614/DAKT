import type { HealthLog, CreateHealthLogPayload } from './health.api';

// MOCK DATA – DEV ONLY – DO NOT SHIP

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';

const now = new Date();
const getOffsetDate = (days: number, hours = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(d.getHours() + hours);
    return d.toISOString();
};

let mockHealthLogs: HealthLog[] = [];

export const healthMockService = {
    getHealthLogs: async () => {
        return { data: [...mockHealthLogs] };
    },

    createHealthLog: async (payload: CreateHealthLogPayload) => {
        const newLog: HealthLog = {
            id: `log-${Date.now()}`,
            userId: MOCK_USER_ID,
            date: payload.date || new Date().toISOString(),
            bloodPressure: payload.bloodPressure,
            heartRate: payload.heartRate,
            weight: payload.weight,
            note: payload.note,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        mockHealthLogs.push(newLog);
        return { data: newLog };
    }
};
