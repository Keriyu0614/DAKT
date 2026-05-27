/**
 * SEED SAMPLE ACCOUNTS SCRIPT
 * 
 * Creates 2 sample accounts with realistic data:
 * 1. Caregiver Account (Nguyễn Thị Mai)
 * 2. Elderly Account (Trần Văn Nam) - linked to caregiver
 */

import authApi, { type RegisterRequest } from '../api/auth.api';
import { medicationApi, type CreateMedicationDto } from '../api/medication.api';
import { appointmentApi, type CreateAppointmentPayload } from '../api/appointment.api';
import { reminderApi, type CreateReminderPayload } from '../api/reminder.api';

// Sample Account Data
const CAREGIVER_ACCOUNT = {
    name: 'Nguyễn Thị Mai',
    email: 'mai.nguyen@example.com',
    password: 'Caregiver123!',
    role: 1 // Caregiver
};

const ELDERLY_ACCOUNT = {
    name: 'Trần Văn Nam',
    email: 'nam.tran@example.com',
    password: 'Elderly123!',
    role: 0 // Elderly
};

// Helper to add days to current date
const addDays = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
};

// Helper to create time string for today
const createTimeToday = (hour: number, minute: number = 0): string => {
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
};

export const seedSampleAccounts = async () => {
    console.log('🌱 Starting seed process...\n');

    try {
        // Step 1: Create Caregiver Account
        console.log('👤 Creating Caregiver Account...');
        const caregiverResponse = await authApi.register(CAREGIVER_ACCOUNT as RegisterRequest);
        const caregiverId = caregiverResponse.data.userId;
        console.log(`✅ Caregiver created: ${CAREGIVER_ACCOUNT.name} (ID: ${caregiverId})`);

        // Step 2: Create Elderly Account
        console.log('\n👴 Creating Elderly Account...');
        const elderlyResponse = await authApi.register(ELDERLY_ACCOUNT as RegisterRequest);
        const elderlyId = elderlyResponse.data.userId;
        console.log(`✅ Elderly created: ${ELDERLY_ACCOUNT.name} (ID: ${elderlyId})`);

        // Step 3: Link Elderly to Caregiver
        console.log('\n🔗 Linking Elderly to Caregiver...');
        await authApi.linkElderly({
            email: ELDERLY_ACCOUNT.email,
            caregiverId: caregiverId
        });
        console.log('✅ Accounts linked successfully');

        // Step 4: Create Medications for Elderly
        console.log('\n💊 Creating Medications...');
        const medications: CreateMedicationDto[] = [
            {
                userId: elderlyId,
                medicationName: 'Aspirin',
                dosage: '100 mg',
                frequency: 'Daily',
                scheduledTimes: '08:00, 20:00',
                instructions: 'Uống sau bữa ăn',
                startDate: addDays(-30),
                endDate: addDays(60)
            },
            {
                userId: elderlyId,
                medicationName: 'Metformin',
                dosage: '500 mg',
                frequency: 'Daily',
                scheduledTimes: '07:30, 19:30',
                instructions: 'Uống trước bữa ăn 30 phút',
                startDate: addDays(-60),
                endDate: addDays(90)
            },
            {
                userId: elderlyId,
                medicationName: 'Lisinopril',
                dosage: '10 mg',
                frequency: 'Daily',
                scheduledTimes: '08:00',
                instructions: 'Uống vào buổi sáng',
                startDate: addDays(-45),
                endDate: addDays(75)
            },
            {
                userId: elderlyId,
                medicationName: 'Vitamin D3',
                dosage: '1000 IU',
                frequency: 'Daily',
                scheduledTimes: '09:00',
                instructions: 'Uống cùng bữa sáng',
                startDate: addDays(-20),
                endDate: addDays(100)
            }
        ];

        const createdMedications = [];
        for (const med of medications) {
            const response = await medicationApi.createMedication(med);
            createdMedications.push(response.data);
            console.log(`  ✓ ${med.medicationName}`);
        }

        // Step 5: Create Appointments
        console.log('\n📅 Creating Appointments...');
        const appointments: CreateAppointmentPayload[] = [
            {
                userId: elderlyId,
                doctorName: 'BS. Nguyễn Văn A',
                location: 'Bệnh viện Đa khoa Trung ương',
                appointmentDate: addDays(3),
                notes: 'Khám định kỳ tim mạch',
                appointmentType: 'Khám định kỳ',
                specialty: 'Tim mạch',
                duration: 30,
                isTelehealth: false,
                preparationInstructions: 'Nhịn ăn 8 tiếng trước khi khám'
            },
            {
                userId: elderlyId,
                doctorName: 'BS. Trần Thị B',
                location: 'Phòng khám Đa khoa Gia đình',
                appointmentDate: addDays(7),
                notes: 'Tái khám tiểu đường',
                appointmentType: 'Tái khám',
                specialty: 'Nội tiết',
                duration: 20,
                isTelehealth: false
            },
            {
                userId: elderlyId,
                doctorName: 'BS. Lê Văn C',
                location: 'Telemedicine',
                appointmentDate: addDays(14),
                notes: 'Tư vấn dinh dưỡng online',
                appointmentType: 'Tư vấn',
                specialty: 'Dinh dưỡng',
                duration: 15,
                isTelehealth: true
            }
        ];

        const createdAppointments = [];
        for (const apt of appointments) {
            const response = await appointmentApi.create(apt);
            createdAppointments.push(response.data);
            console.log(`  ✓ ${apt.doctorName} - ${new Date(apt.appointmentDate).toLocaleDateString('vi-VN')}`);
        }

        // Step 6: Create Reminders
        console.log('\n⏰ Creating Reminders...');
        const reminders: CreateReminderPayload[] = [
            // Medication reminders for today
            {
                userId: elderlyId,
                type: 0, // Medication
                referenceId: createdMedications[0].id,
                scheduledTime: createTimeToday(8, 0)
            },
            {
                userId: elderlyId,
                type: 0,
                referenceId: createdMedications[1].id,
                scheduledTime: createTimeToday(7, 30)
            },
            {
                userId: elderlyId,
                type: 0,
                referenceId: createdMedications[0].id,
                scheduledTime: createTimeToday(20, 0)
            },
            // Appointment reminders
            {
                userId: elderlyId,
                type: 1, // Appointment
                referenceId: createdAppointments[0].id,
                scheduledTime: addDays(2) // 1 day before appointment
            },
            {
                userId: elderlyId,
                type: 1,
                referenceId: createdAppointments[1].id,
                scheduledTime: addDays(6)
            },
            // Health/Exercise reminders
            {
                userId: elderlyId,
                type: 2, // Exercise/Health
                referenceId: 'exercise-morning',
                scheduledTime: createTimeToday(6, 30)
            },
            {
                userId: elderlyId,
                type: 2,
                referenceId: 'exercise-evening',
                scheduledTime: createTimeToday(17, 0)
            }
        ];

        for (const reminder of reminders) {
            await reminderApi.createReminder(reminder);
        }
        console.log(`  ✓ Created ${reminders.length} reminders`);

        // Note: Notifications will be automatically generated by the system
        // when reminders are triggered, so we don't need to create them manually

        // Step 7: Update User Settings
        console.log('\n⚙️ Configuring User Settings...');
        await authApi.updateSettings(elderlyId, {
            language: 'vi',
            theme: 'light',
            notificationsEnabled: true,
            autoLogout: false
        });
        await authApi.updateSettings(caregiverId, {
            language: 'vi',
            theme: 'light',
            notificationsEnabled: true,
            autoLogout: false
        });
        console.log('  ✓ Settings configured');

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('✨ SEED COMPLETED SUCCESSFULLY!\n');
        console.log('📋 Summary:');
        console.log(`   • Caregiver: ${CAREGIVER_ACCOUNT.email} / ${CAREGIVER_ACCOUNT.password}`);
        console.log(`   • Elderly: ${ELDERLY_ACCOUNT.email} / ${ELDERLY_ACCOUNT.password}`);
        console.log(`   • Medications: ${medications.length}`);
        console.log(`   • Appointments: ${appointments.length}`);
        console.log(`   • Reminders: ${reminders.length}`);
        console.log(`   • Notifications: Auto-generated by system`);
        console.log('='.repeat(60));

        return {
            caregiver: { id: caregiverId, ...CAREGIVER_ACCOUNT },
            elderly: { id: elderlyId, ...ELDERLY_ACCOUNT },
            stats: {
                medications: medications.length,
                appointments: appointments.length,
                reminders: reminders.length,
                notifications: 0 // Auto-generated
            }
        };

    } catch (error: any) {
        console.error('\n❌ Seed failed:', error.response?.data || error.message);
        throw error;
    }
};

// Run if executed directly (only works in Node.js environment)
// This file is meant to be run via: npm run seed
// Not imported in browser environment
