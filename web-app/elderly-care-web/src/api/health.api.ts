import type { AxiosResponse } from "axios";
import axiosClient from "./axiosClient";
import { healthMockService } from "./health.mock";

export interface HealthLog {
    id: string;
    userId: string;
    date: string;
    bloodPressure: string;
    heartRate?: number;
    weight?: number;
    note?: string;
    createdAt: string;
    updatedAt: string;
    recordedBy?: string;
}

export interface CreateHealthLogPayload {
    userId: string;
    date: string;
    bloodPressure: string;
    heartRate?: number;
    weight?: number;
    note?: string;
    recordedBy?: string;
}

export const healthApi = {
    getHealthLogs: (userId?: string): Promise<AxiosResponse<HealthLog[]>> => {
        if (!userId || userId === 'undefined') {
            return Promise.resolve({ data: [] } as any);
        }
        return axiosClient.get(`/api/health-logs/user/${userId}`);
    },

    createHealthLog: (payload: CreateHealthLogPayload): Promise<AxiosResponse<HealthLog>> =>
        axiosClient.post("/api/health-logs", payload),

    importFromExcel: (userId: string, file: File): Promise<AxiosResponse<{ message: string; importedCount: number; errors?: string[] }>> => {
        const formData = new FormData();
        formData.append("file", file);
        return axiosClient.post(`/api/health-logs/import/${userId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};
