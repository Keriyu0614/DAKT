// Mock Notification Data Generator
// This file provides mock data for testing NotificationsPage
// Remove this when backend NotificationService is ready

import {
    type Notification,
    type NotificationDetail,
    NotificationStatus,
    DeliveryChannel,
    RecipientType
} from './notification.api';

const now = new Date();

// Helper to create dates relative to now
const daysAgo = (days: number, hours: number = 0) => {
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    date.setHours(date.getHours() - hours);
    return date.toISOString();
};

export const mockNotifications: Notification[] = [];

export const mockNotificationDetail: NotificationDetail | null = null;

// Mock API responses for development
export const mockNotificationApi = {
    getNotifications: () => Promise.resolve({ data: mockNotifications }),

    getNotificationDetail: (id: string) => {
        const notification = mockNotifications.find(n => n.id === id);
        if (!notification) {
            return Promise.reject(new Error('Notification not found'));
        }

        const detail: NotificationDetail = {
            ...notification,
            sourceEventType: notification.title.includes('Appointment') ? 1 : notification.title.includes('Medication') ? 0 : 2,
            sourceEventId: 'evt-' + notification.id,
            sourceEvent: {
                type: notification.title.includes('Appointment') ? 'Appointment' : notification.title.includes('Medication') ? 'Medication' : 'Health',
                name: notification.title.replace('Reminder: ', '')
            },
            deliveryAttempts: [
                {
                    attemptNumber: 1,
                    attemptedAt: notification.sentAt,
                    status: notification.status === NotificationStatus.Failed ? 'Failed' : 'Success',
                    channel: notification.deliveryChannel,
                    errorReason: notification.failureReason
                }
            ]
        };

        return Promise.resolve({ data: detail });
    },

    markAsRead: (id: string) => {
        const notification = mockNotifications.find(n => n.id === id);
        if (!notification) {
            return Promise.reject(new Error('Notification not found'));
        }

        return Promise.resolve({
            data: {
                ...notification,
                status: NotificationStatus.Read,
                readAt: new Date().toISOString()
            }
        });
    },

    acknowledge: (id: string) => {
        const notification = mockNotifications.find(n => n.id === id);
        if (!notification) {
            return Promise.reject(new Error('Notification not found'));
        }

        return Promise.resolve({
            data: {
                ...notification,
                status: NotificationStatus.Acknowledged,
                acknowledgedAt: new Date().toISOString()
            }
        });
    },

    retryDelivery: (id: string) => {
        const notification = mockNotifications.find(n => n.id === id);
        if (!notification) {
            return Promise.reject(new Error('Notification not found'));
        }

        // Simulate retry
        const success = Math.random() > 0.3; // 70% success rate

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (success) {
                    resolve({
                        data: {
                            ...notification,
                            status: NotificationStatus.Delivered,
                            deliveredAt: new Date().toISOString(),
                            retryCount: notification.retryCount + 1,
                            failureReason: undefined
                        }
                    });
                } else {
                    reject({
                        response: {
                            data: {
                                message: 'Device still offline'
                            }
                        }
                    });
                }
            }, 1500);
        });
    }
};
