import { useEffect, useState, useMemo } from 'react';
import { reminderApi, type Reminder } from '../../api/reminder.api';
import { appointmentApi } from '../../api/appointment.api';
import { medicationApi } from '../../api/medication.api';
import { healthApi } from '../../api/health.api';
import { useAuth } from '../../context/AuthContext';
import ReminderCard, { type EnrichedReminder } from '../../components/reminder/ReminderCard';
import ReminderForm from '../../components/reminder/ReminderForm';
import {
    Bell,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Plus
} from 'lucide-react';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import './RemindersPage.css';

export const RemindersPage = () => {
    // --- Auth ---
    const { user } = useAuth();

    // --- State ---
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [enrichedReminders, setEnrichedReminders] = useState<EnrichedReminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const socket = io("http://localhost:5006");

        socket.on("status_updated", (data: any) => {
            console.log("Socket status_updated received in Reminders:", data);
            setReminders(prev => prev.map(r => 
                r.id === data.reminderId ? { ...r, status: 1 } : r
            ));
        });

        socket.on("medication_missed", (data: any) => {
            console.log("Socket medication_missed received in Reminders:", data);
            setReminders(prev => prev.map(r => 
                r.id === data.reminderId ? { ...r, status: 2 } : r
            ));
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Source Events
    const [appointments, setAppointments] = useState<any[]>([]);
    const [medications, setMedications] = useState<any[]>([]);
    const [healthLogs, setHealthLogs] = useState<any[]>([]);

    // UI State
    const [isPastCollapsed, setIsPastCollapsed] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
    const [snoozeDropdown, setSnoozeDropdown] = useState<string | null>(null);

    // --- Data Fetching ---
    useEffect(() => {
        fetchReminders();
        fetchSourceEvents();
    }, []);

    // Enrich reminders when source events or reminders change
    useEffect(() => {
        enrichReminders();
    }, [reminders, appointments, medications, healthLogs]);

    const fetchReminders = async () => {
        setLoading(true);
        try {
            const response = await reminderApi.getReminders();
            const sorted = response.data.sort(
                (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
            );
            setReminders(sorted);
            setError('');
        } catch (err) {
            setError('Không thể tải danh sách nhắc nhở. Vui lòng kiểm tra kết nối.');
        } finally {
            setLoading(false);
        }
    };

    const fetchSourceEvents = async () => {
        try {
            const [apptRes, medRes, healthRes] = await Promise.all([
                appointmentApi.getAll().catch(() => ({ data: [] })),
                medicationApi.getMedications().catch(() => ({ data: [] })),
                healthApi.getHealthLogs().catch(() => ({ data: [] }))
            ]);
            setAppointments(apptRes.data);
            setMedications(medRes.data);
            setHealthLogs(healthRes.data);
        } catch (err) {
            console.error('Error fetching source events:', err);
        }
    };

    const enrichReminders = () => {
        const enriched: EnrichedReminder[] = reminders.map(rem => {
            let sourceEventName = 'Unknown';
            let sourceEventType = '';

            if (rem.type === 1) {
                sourceEventType = 'Lịch khám';
                const apt = appointments.find(a => a.id === rem.referenceId);
                if (apt) sourceEventName = apt.doctorName;
            } else if (rem.type === 0) {
                sourceEventType = 'Thuốc';
                const med = medications.find(m => m.id === rem.referenceId);
                if (med) sourceEventName = med.name;
            } else if (rem.type === 2) {
                sourceEventType = 'Sức khỏe';
                const log = healthLogs.find(h => h.id === rem.referenceId);
                if (log) sourceEventName = `Nhật ký sức khỏe - ${new Date(log.date).toLocaleDateString()}`;
            }

            return {
                ...rem,
                message: `${sourceEventType}: ${sourceEventName}`,
                sourceEventName,
                sourceEventType
            };
        });

        setEnrichedReminders(enriched);
    };

    // --- Logic & Grouping ---
    const now = new Date();

    const getReminderStatus = (rem: Reminder): string => {
        if (rem.status === 1) return 'completed';
        const scheduled = new Date(rem.scheduledTime);
        if (scheduled < now) return 'overdue';
        return 'active';
    };

    const groupedReminders = useMemo(() => {
        const todayStr = now.toDateString();
        const upcoming = enrichedReminders.filter(r => new Date(r.scheduledTime) >= now && r.status !== 1);
        const past = enrichedReminders.filter(r => new Date(r.scheduledTime) < now || r.status === 1).reverse();

        return {
            today: upcoming.filter(r => new Date(r.scheduledTime).toDateString() === todayStr),
            upcoming: upcoming.filter(r => new Date(r.scheduledTime).toDateString() !== todayStr),
            past
        };
    }, [enrichedReminders]);

    // --- Action Handlers ---
    const handleMarkDone = async (rem: Reminder) => {
        try {
            await reminderApi.markAsCompleted(rem.id);
            toast.success('Đã đánh dấu nhắc nhở hoàn thành');
            fetchReminders();
        } catch (err) {
            toast.error('Lỗi khi đánh dấu nhắc nhở hoàn thành');
        }
    };

    const handleSnooze = async (rem: Reminder, minutes: number) => {
        try {
            await reminderApi.snooze(rem.id, minutes);
            toast.info(`Đã báo lại trong ${minutes} phút`);
            setSnoozeDropdown(null);
            fetchReminders();
        } catch (err) {
            toast.error('Lỗi khi báo lại nhắc nhở');
        }
    };

    const handleDelete = async (rem: Reminder) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa nhắc nhở này?`)) return;

        try {
            await reminderApi.deleteReminder(rem.id);
            toast.info('Đã xóa nhắc nhở');
            fetchReminders();
        } catch (err) {
            toast.error('Lỗi khi xóa nhắc nhở');
        }
    };

    // --- Helper Functions ---
    const formatRelativeTime = (dateStr: string): string => {
        const date = new Date(dateStr);
        const diffMs = date.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 0) return 'Quá hạn';
        if (diffMins < 60) return `Trong ${diffMins} phút`;
        if (diffHours < 24) return `Trong ${diffHours} giờ`;
        if (diffDays === 1) return 'Ngày mai';
        return `Trong ${diffDays} ngày`;
    };

    const formatAbsoluteTime = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) return <div className="loading-view">Đang tải nhắc nhở...</div>;

    return (
        <div className="reminders-container">
            <header className="reminders-header">
                <div className="header-content">
                    <div>
                        <h1><Bell size={32} /> Nhắc Nhở</h1>
                        <p>Thông báo được lên lịch cho các sự kiện chăm sóc của bạn</p>
                    </div>
                    <button className="btn-primary btn-add" onClick={() => { setEditingReminder(null); setShowForm(true); }}>
                        <Plus size={20} /> Thêm Nhắc Nhở
                    </button>
                </div>
            </header>

            {error && <div className="error-box">{error}</div>}

            <div className="reminders-content">
                {groupedReminders.today.length > 0 && (
                    <section className="reminder-section">
                        <h2 className="section-title">
                            <Calendar size={28} /> Hôm nay
                        </h2>
                        <div className="reminder-list">
                            {groupedReminders.today.map(rem => (
                                <ReminderCard
                                    key={rem.id}
                                    rem={rem}
                                    onMarkDone={handleMarkDone}
                                    onSnooze={handleSnooze}
                                    onEdit={(r) => { setEditingReminder(r); setShowForm(true); }}
                                    onDelete={handleDelete}
                                    snoozeDropdown={snoozeDropdown}
                                    setSnoozeDropdown={setSnoozeDropdown}
                                    formatRelativeTime={formatRelativeTime}
                                    formatAbsoluteTime={formatAbsoluteTime}
                                    getReminderStatus={getReminderStatus}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {groupedReminders.upcoming.length > 0 && (
                    <section className="reminder-section">
                        <h2 className="section-title">
                            <Calendar size={28} /> Sắp tới
                        </h2>
                        <div className="reminder-list">
                            {groupedReminders.upcoming.map(rem => (
                                <ReminderCard
                                    key={rem.id}
                                    rem={rem}
                                    onMarkDone={handleMarkDone}
                                    onSnooze={handleSnooze}
                                    onEdit={(r) => { setEditingReminder(r); setShowForm(true); }}
                                    onDelete={handleDelete}
                                    snoozeDropdown={snoozeDropdown}
                                    setSnoozeDropdown={setSnoozeDropdown}
                                    formatRelativeTime={formatRelativeTime}
                                    formatAbsoluteTime={formatAbsoluteTime}
                                    getReminderStatus={getReminderStatus}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {groupedReminders.past.length > 0 && (
                    <section className="reminder-section">
                        <h2
                            className="section-title collapsible"
                            onClick={() => setIsPastCollapsed(!isPastCollapsed)}
                        >
                            <CheckCircle2 size={28} /> Đã hoàn thành / Đã qua ({groupedReminders.past.length})
                            {isPastCollapsed ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
                        </h2>
                        {!isPastCollapsed && (
                            <div className="reminder-list">
                                {groupedReminders.past.map(rem => (
                                    <ReminderCard
                                        key={rem.id}
                                        rem={rem}
                                        onMarkDone={handleMarkDone}
                                        onSnooze={handleSnooze}
                                        onEdit={(r) => { setEditingReminder(r); setShowForm(true); }}
                                        onDelete={handleDelete}
                                        snoozeDropdown={snoozeDropdown}
                                        setSnoozeDropdown={setSnoozeDropdown}
                                        formatRelativeTime={formatRelativeTime}
                                        formatAbsoluteTime={formatAbsoluteTime}
                                        getReminderStatus={getReminderStatus}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {enrichedReminders.length === 0 && (
                    <div className="empty-state">
                        <Bell size={64} />
                        <h3>Chưa có nhắc nhở nào</h3>
                        <p>Tạo một nhắc nhở để nhận thông báo về lịch khám, đơn thuốc hoặc sức khỏe</p>
                        <button className="btn-primary" onClick={() => { setEditingReminder(null); setShowForm(true); }}>
                            <Plus size={20} /> Thêm Nhắc Nhở Đầu Tiên
                        </button>
                    </div>
                )}
            </div>

            <ReminderForm
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                editingReminder={editingReminder}
                appointments={appointments}
                medications={medications}
                healthLogs={healthLogs}
                userId={user?.id || ''}
                onSuccess={fetchReminders}
            />
        </div>
    );
};
