import {
    medicationApi,
    type Medication,
    type MedicationResponseDto,
    type CreateMedicationDto
} from '../api/medication.api';
import { medicationReminderGenerator } from './medicationReminderGenerator';
import { medicationMockService } from '../api/medication.mock';

export const medicationService = {

    getMedications: async (userId?: string): Promise<Medication[]> => {
        const response = await medicationApi.getMedications(userId);
        return response.data.map(mapDtoToFrontend);
    },

    addMedication: async (payload: Medication): Promise<Medication> => {
        console.log('[MedicationService] Adding new medication...');

        const dto = mapFrontendToCreateDto(payload);
        const response = await medicationApi.createMedication(dto);
        const newMed = mapDtoToFrontend(response.data);

        // Backend already creates reminders, no need to do it here
        // await medicationReminderGenerator.generateReminders(newMed);

        return newMed;
    },

    updateMedication: async (id: string, updates: Partial<Medication>): Promise<Medication> => {
        console.log(`[MedicationService] Updating medication ${id}...`);

        const dto = mapFrontendToUpdateDto(updates);
        const response = await medicationApi.updateMedication(id, dto);
        const updatedMed = mapDtoToFrontend(response.data);

        // Backend should handle reminder updates
        // if (updates.frequency || updates.startDate || updates.endDate || updates.status || updates.dosage) {
        //     await medicationReminderGenerator.updateReminders(updatedMed);
        // }

        return updatedMed;
    },

    toggleStatus: async (med: Medication): Promise<Medication> => {
        console.log(`[MedicationService] Toggling status for ${med.id}...`);

        // Since backend doesn't support status, we just simulate the toggle
        const newStatus: Medication['status'] = med.status === 'Active' ? 'Paused' : 'Active';
        const updatedMed = { ...med, status: newStatus };

        // Backend should handle reminder pause/resume
        // if (updatedMed.status === 'Paused') {
        //     await medicationReminderGenerator.pauseReminders(updatedMed.id);
        // } else if (updatedMed.status === 'Active') {
        //     await medicationReminderGenerator.resumeReminders(updatedMed);
        // }

        return updatedMed;
    },

    deleteMedication: async (id: string): Promise<void> => {
        console.log(`[MedicationService] Deleting medication ${id}...`);
        await medicationApi.deleteMedication(id);
        // Backend should handle reminder cancellation
        // await medicationReminderGenerator.cancelReminders(id);
    }
};

/**
 * MAPPING UTILITIES
 */

function mapDtoToFrontend(dto: MedicationResponseDto): Medication {
    // Parse dosage: "10 mg" -> { amount: 10, unit: "mg" }
    const dosageParts = dto.dosage.split(' ');
    const amount = parseFloat(dosageParts[0]) || 0;
    const unit = (dosageParts[1] || 'mg') as Medication['dosage']['unit'];

    // Parse scheduled times - xử lý cả "08:00, 20:00" lẫn "12/30/1899 8:00:00 AM" (OADate từ Excel)
    const parseScheduledTime = (t: string): string | null => {
        t = t.trim();
        // Format chuẩn HH:mm
        if (/^\d{1,2}:\d{2}$/.test(t)) return t;
        // Format OADate: "12/30/1899 8:00:00 AM"
        const oaMatch = t.match(/(\d{1,2}):(\d{2}):\d{2}\s*(AM|PM)/i);
        if (oaMatch) {
            let h = parseInt(oaMatch[1]);
            const m = oaMatch[2];
            const ampm = oaMatch[3].toUpperCase();
            if (ampm === 'PM' && h !== 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;
            return `${String(h).padStart(2, '0')}:${m}`;
        }
        return null;
    };

    const specificTimes = dto.scheduledTimes
        ? dto.scheduledTimes.split(',').map(parseScheduledTime).filter((t): t is string => t !== null)
        : [];

    // Determine status
    // Nếu endDate = startDate (backend default khi không nhập) → coi như Active không giới hạn
    const startStr = dto.startDate?.substring(0, 10);
    const endStr = dto.endDate?.substring(0, 10);
    const endDateIsDefault = !dto.endDate || endStr === startStr;

    let status: Medication['status'] = 'Active';
    if (!endDateIsDefault) {
        const [ey, em, ed] = endStr!.split('-').map(Number);
        const endOfDay = new Date(ey, em - 1, ed, 23, 59, 59, 999);
        if (endOfDay < new Date()) {
            status = 'Completed';
        }
    }

    return {
        id: dto.id,
        userId: dto.userId,
        name: dto.medicationName,
        form: 'Tablet',
        dosage: { amount, unit },
        frequency: {
            type: (dto.frequency as any) || 'Daily',
            timesPerDay: specificTimes.length || 1,
            specificTimes
        },
        startDate: dto.startDate,
        // Nếu endDate = startDate (backend default) → không set endDate để hiển thị mãi
        endDate: endDateIsDefault ? undefined : (dto.endDate ?? undefined),
        instructions: dto.instructions || '',
        status,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt
    };
}

function mapFrontendToCreateDto(med: Partial<Medication>): CreateMedicationDto {
    const scheduledTimes = (med.frequency?.specificTimes && med.frequency.specificTimes.length > 0)
        ? med.frequency.specificTimes.join(', ')
        : '08:00';

    return {
        userId: med.userId || '',
        medicationName: med.name || '',
        dosage: `${med.dosage?.amount || 0} ${med.dosage?.unit || 'mg'}`,
        frequency: med.frequency?.type || 'Daily',
        scheduledTimes,
        instructions: med.instructions,
        startDate: med.startDate || new Date().toISOString(),
        endDate: med.endDate
    };
}

function mapFrontendToUpdateDto(med: Partial<Medication>): Partial<CreateMedicationDto> {
    const dto: Partial<CreateMedicationDto> = {};
    if (med.name) dto.medicationName = med.name;
    if (med.dosage) dto.dosage = `${med.dosage.amount} ${med.dosage.unit}`;
    if (med.frequency) {
        if (med.frequency.type) dto.frequency = med.frequency.type;
        if (med.frequency.specificTimes && med.frequency.specificTimes.length > 0) {
            dto.scheduledTimes = med.frequency.specificTimes.join(', ');
        }
    }
    if (med.instructions !== undefined) dto.instructions = med.instructions;
    if (med.startDate) dto.startDate = med.startDate;
    if (med.endDate !== undefined) dto.endDate = med.endDate;
    return dto;
}
