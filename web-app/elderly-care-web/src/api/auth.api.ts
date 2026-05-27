import axiosClient from "./axiosClient";

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    role: number; // 0 = Elderly, 1 = Caregiver
}

export interface AuthResponse {
    userId: string;
    name: string;
    email: string;
    role: string;
    token: string;
    avatarUrl?: string;
}

export interface UpdateProfileRequest {
    name: string;
    avatarUrl?: string;
}

export interface UserSettings {
    language: string;
    theme: string;
    notificationsEnabled: boolean;
    autoLogout: boolean;
}

const authApi = {
    login: (data: LoginRequest) => {
        return axiosClient.post<AuthResponse>("/api/auth/login", data);
    },
    register: (data: RegisterRequest) => {
        return axiosClient.post<AuthResponse>("/api/auth/register", data);
    },
    googleLogin: (idToken: string) => {
        return axiosClient.post<AuthResponse>("/api/auth/google-login", { idToken });
    },
    createElderly: (data: { name: string; email: string; password: string; caregiverId: string }) => {
        return axiosClient.post<AuthResponse>("/api/auth/create-elderly", data);
    },
    linkElderly: (data: { email: string; caregiverId: string }) => {
        return axiosClient.post<AuthResponse>("/api/auth/link-elderly", data);
    },
    getManagedElderly: (caregiverId: string) => {
        return axiosClient.get<any[]>(`/api/auth/managed-elderly/${caregiverId}`);
    },
    unlinkElderly: (caregiverId: string, elderlyId: string) => {
        return axiosClient.delete(`/api/auth/unlink-elderly/${caregiverId}/${elderlyId}`);
    },
    updateProfile: (userId: string, data: UpdateProfileRequest) => {
        return axiosClient.put<AuthResponse>(`/api/auth/profile/${userId}`, data);
    },
    uploadAvatar: (userId: string, file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return axiosClient.post<{ avatarUrl: string }>(`/api/auth/avatar/${userId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
    getSettings: (userId: string) => {
        return axiosClient.get<UserSettings>(`/api/auth/settings/${userId}`);
    },
    updateSettings: (userId: string, data: UserSettings) => {
        return axiosClient.put<UserSettings>(`/api/auth/settings/${userId}`, data);
    },
    changePassword: (userId: string, data: { currentPassword: string; newPassword: string }) => {
        return axiosClient.post(`/api/auth/change-password/${userId}`, data);
    },
};

export default authApi;
