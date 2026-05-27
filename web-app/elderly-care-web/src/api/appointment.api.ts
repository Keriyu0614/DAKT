import axiosClient from "./axiosClient";
import { appointmentMockService } from "./appointment.mock";

export interface CreateAppointmentPayload {
  userId?: string;
  doctorName: string;
  location: string;
  appointmentDate: string;
  notes?: string;
  appointmentType?: string;
  specialty?: string;
  duration?: number;
  isTelehealth?: boolean;
  transportationNotes?: string;
  preparationInstructions?: string;
}

export const appointmentApi = {
  getAll: (userId?: string) =>
    axiosClient.get("/api/appointments", { params: { userId } }),

  create: (payload: CreateAppointmentPayload) =>
    axiosClient.post("/api/appointments", payload),

  update: (id: string, payload: Partial<CreateAppointmentPayload>) =>
    axiosClient.put(`/api/appointments/${id}`, payload),

  delete: (id: string) =>
    axiosClient.delete(`/api/appointments/${id}`),

  importFromExcel: (userId: string, file: File): Promise<import("axios").AxiosResponse<{ message: string; importedCount: number; errors?: string[] }>> => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosClient.post(`/api/appointments/import/${userId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
