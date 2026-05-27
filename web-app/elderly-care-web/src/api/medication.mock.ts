import type { Medication } from './medication.api';

// Helper for consistent mock GUIDs
const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';

// Initial Mock Data (Refactored to meet strict dataset requirements)
let mockMedications: Medication[] = [];

const SIMULATED_DELAY = 600;

export const medicationMockService = {
    getMedications: async (): Promise<Medication[]> => {
        return new Promise(resolve => {
            setTimeout(() => resolve([...mockMedications]), SIMULATED_DELAY);
        });
    },

    addMedication: async (med: Omit<Medication, 'id' | 'userId' | 'linkedRemindersCount' | 'createdAt' | 'updatedAt'>): Promise<Medication> => {
        return new Promise(resolve => {
            setTimeout(() => {
                const newMed: Medication = {
                    ...med,
                    id: crypto.randomUUID(),
                    userId: MOCK_USER_ID,
                    linkedRemindersCount: 0,
                    status: 'Active',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                mockMedications.push(newMed);
                resolve(newMed);
            }, SIMULATED_DELAY);
        });
    },

    updateMedication: async (id: string, updates: Partial<Medication>): Promise<Medication> => {
        return new Promise<Medication>((resolve, reject) => {
            setTimeout(() => {
                const index = mockMedications.findIndex(m => m.id === id);
                if (index === -1) {
                    reject(new Error('Medication not found'));
                    return;
                }
                const updated = { ...mockMedications[index], ...updates, updatedAt: new Date().toISOString() };
                mockMedications[index] = updated;
                resolve(updated);
            }, SIMULATED_DELAY);
        });
    },

    toggleStatus: async (id: string): Promise<Medication> => {
        return new Promise<Medication>((resolve, reject) => {
            setTimeout(() => {
                const index = mockMedications.findIndex(m => m.id === id);
                if (index === -1) {
                    reject(new Error('Medication not found'));
                    return;
                }
                const current = mockMedications[index];
                let newStatus: Medication['status'] = current.status;

                if (current.status === 'Active') {
                    newStatus = 'Paused';
                } else if (current.status === 'Paused') {
                    newStatus = 'Active';
                }

                const updated = { ...current, status: newStatus, updatedAt: new Date().toISOString() };
                mockMedications[index] = updated;
                resolve(updated);
            }, SIMULATED_DELAY);
        });
    },

    deleteMedication: async (id: string): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            setTimeout(() => {
                const index = mockMedications.findIndex(m => m.id === id);
                if (index === -1) {
                    reject(new Error('Medication not found'));
                    return;
                }
                mockMedications = mockMedications.filter(m => m.id !== id);
                resolve();
            }, SIMULATED_DELAY);
        });
    }
};
