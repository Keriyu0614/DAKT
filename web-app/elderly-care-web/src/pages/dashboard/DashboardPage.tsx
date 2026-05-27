import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
//import { io } from "socket.io-client";
import { socketService } from '../../services/socket.service';
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
    MoreVertical,
    Activity,
    AlertTriangle,
    AlertCircle
} from "lucide-react";
import "./DashboardPage.css";
import { appointmentApi } from "../../api/appointment.api";
import { medicationService } from "../../services/medication.service";
import { type Medication } from "../../api/medication.api";
import { reminderApi, type Reminder } from "../../api/reminder.api";
import { notificationApi, type Notification } from "../../api/notification.api";
import { useAuth } from "../../context/AuthContext";
import authApi from "../../api/auth.api";

interface DashboardData {
    appointments: any[];
    medications: Medication[];
    reminders: Reminder[];
    notifications: Notification[];
    managedElderly: any[];
}

export const DashboardPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [data, setData] = useState<DashboardData>({
        appointments: [],
        medications: [],
        reminders: [],
        notifications: [],
        managedElderly: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    useEffect(() => {
        socketService.connect();

        const handleStatusUpdated = (data: any) => {
            console.log("Socket status_updated received in Dashboard:", data);
            const status = typeof data.status === 'number' ? data.status : 1;
            setData(prev => ({
                ...prev,
                reminders: prev.reminders.map(r =>
                    r.id === data.reminderId ? { ...r, status } : r
                )
            }));
        };

        const handleMedicationMissed = (data: any) => {
            console.log("Socket medication_missed received in Dashboard:", data);
            setData(prev => ({
                ...prev,
                reminders: prev.reminders.map(r =>
                    r.id === data.reminderId ? { ...r, status: 2 } : r
                )
            }));
            toast.error(
                `⚠️ Cảnh báo: Người thân đã bỏ lỡ lịch uống thuốc lúc ${data.updatedReminder?.scheduledTime
                    ? new Date(data.updatedReminder.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : ''}!`,
                { position: "top-right", autoClose: 10000 }
            );
        };

        socketService.on('status_updated', handleStatusUpdated);
        socketService.on('medication_missed', handleMedicationMissed);

        return () => {
            socketService.off('status_updated', handleStatusUpdated);
            socketService.off('medication_missed', handleMedicationMissed);
        };
    }, []);

    // --- 1. Lấy dữ liệu từ API ---
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                // Lấy danh sách người già được quản lý trước
                const elderlyRes = await authApi.getManagedElderly(user!.id).catch(() => ({ data: [] }));
                const managedElderly: any[] = (elderlyRes as any).data || [];

                // Lấy notifications của người chăm sóc
                const notifRes = await notificationApi.getNotifications(user!.id).catch(() => ({ data: [] }));

                // Lấy medications, appointments, reminders của TẤT CẢ người già được quản lý
                const elderlyIds: string[] = managedElderly.map((e: any) => e.id);

                let allMedications: Medication[] = [];
                let allAppointments: any[] = [];
                let allReminders: Reminder[] = [];

                if (elderlyIds.length > 0) {
                    const results = await Promise.all(
                        elderlyIds.map(eid => Promise.all([
                            medicationService.getMedications(eid).catch(() => []),
                            appointmentApi.getAll(eid).catch(() => ({ data: [] })),
                            reminderApi.getReminders(eid).catch(() => ({ data: [] })),
                        ]))
                    );
                    results.forEach(([meds, apts, rems]) => {
                        allMedications = allMedications.concat(meds as Medication[]);
                        allAppointments = allAppointments.concat((apts as any).data || []);
                        allReminders = allReminders.concat((rems as any).data || []);
                    });
                }

                setData({
                    appointments: allAppointments,
                    medications: allMedications,
                    reminders: allReminders,
                    notifications: (notifRes as any).data || [],
                    managedElderly
                });

                // DEBUG
                console.log('[Dashboard] user.id:', user?.id);
                console.log('[Dashboard] elderlyIds:', elderlyIds);
                console.log('[Dashboard] medications count:', allMedications.length);
                console.log('[Dashboard] appointments count:', allAppointments.length);

                setError(null);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
                setError(t('dashboard_error') || "Không thể tải dữ liệu dashboard. Vui lòng kiểm tra backend.");
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            fetchDashboardData();
        }
    }, [user?.id, t]);

    // --- 2. Logic xử lý dữ liệu để hiển thị lên giao diện thiết kế ---

    // Tìm các nhắc nhở bị bỏ lỡ (Status = 2: Missed) để hiển thị Banner Cảnh báo
    const missedReminders = useMemo(() =>
        data.reminders.filter(r => r.status === 2).sort((a, b) =>
            new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime()
        ), [data.reminders]);

    // Hoạt động gần đây: lấy trực tiếp từ medications + appointments
    // Hiển thị 7 ngày qua + 7 ngày tới (bao gồm hôm nay) để luôn có dữ liệu
    const recentActivities = useMemo(() => {
        const activities: Array<{
            id: string;
            title: string;
            desc: string;
            time: Date;
            status: number;
            type: 'medication' | 'appointment';
            details?: string;
            navigateTo: string;
        }> = [];

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        // Xây map reminder status để tra cứu (key: medId-year-month-date-hour-minute local time)
        const reminderStatusMap = new Map<string, 0 | 1 | 2>();
        data.reminders.forEach(r => {
            if (r.type === 0) {
                const rTime = new Date(r.scheduledTime);
                const key = `${r.referenceId}-${rTime.getFullYear()}-${rTime.getMonth()}-${rTime.getDate()}-${rTime.getHours()}-${rTime.getMinutes()}`;
                reminderStatusMap.set(key, r.status);
            }
        });

        // Medications: tạo entry cho mỗi lần uống trong window [-7, +30] ngày
        data.medications.forEach(med => {
            // Parse giờ uống - xử lý cả format "HH:mm" lẫn "12/30/1899 H:mm:ss AM/PM" (OADate từ Excel)
            const parseTime = (t: string): string | null => {
                t = t.trim();
                if (/^\d{1,2}:\d{2}$/.test(t)) return t;
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

            const rawTimes: string[] = (med.frequency?.specificTimes || [])
                .map(t => parseTime(t))
                .filter((t): t is string => t !== null);

            const times: string[] = rawTimes.length > 0
                ? rawTimes
                : ['08:00', '12:00', '18:00', '21:00'].slice(0, med.frequency?.timesPerDay || 1);

            // Parse ngày bắt đầu/kết thúc tránh lệch UTC
            const startStr = (med.startDate || '').substring(0, 10);
            const [sy, sm, sd] = startStr.split('-').map(Number);
            const medStart = new Date(sy, sm - 1, sd, 0, 0, 0, 0);

            // Nếu không có endDate hoặc endDate = startDate (backend default) → coi như không giới hạn
            let medEnd: Date | null = null;
            if (med.endDate && med.endDate.substring(0, 10) !== startStr) {
                const endStr = med.endDate.substring(0, 10);
                const [ey, em, ed] = endStr.split('-').map(Number);
                medEnd = new Date(ey, em - 1, ed, 23, 59, 59, 999);
            }

            console.log(`[Dashboard] Med: ${med.name}, startDate raw: ${med.startDate}, endDate raw: ${med.endDate}, status: ${med.status}, times:`, times, 'medStart:', medStart, 'medEnd:', medEnd);

            // Duyệt từ 7 ngày trước đến 30 ngày sau
            for (let dayOffset = -7; dayOffset <= 30; dayOffset++) {
                const targetDate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
                const dayCheck = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 12, 0, 0, 0);
                if (dayCheck < medStart || (medEnd && dayCheck > medEnd)) continue;

                times.forEach(time => {
                    const [hour, minute] = time.split(':').map(Number);
                    const medTime = new Date(
                        targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(),
                        hour, minute, 0, 0
                    );
                    // Chỉ lấy trong window [-7, +30]
                    if (medTime < sevenDaysAgo || medTime > thirtyDaysLater) return;

                    const key = `${med.id}-${medTime.getFullYear()}-${medTime.getMonth()}-${medTime.getDate()}-${hour}-${minute}`;
                    const reminderStatus = reminderStatusMap.get(key);
                    // Nếu giờ đã qua mà không có reminder done → Đang chờ/Bỏ lỡ
                    // Nếu giờ chưa tới → Sắp tới
                    const isPast = medTime <= now;
                    const status = reminderStatus !== undefined ? reminderStatus : (isPast ? 0 : 0);
                    const statusText = status === 1 ? 'Đã hoàn thành'
                                     : status === 2 ? 'Đã bỏ lỡ'
                                     : isPast ? 'Đang chờ' : 'Sắp tới';

                    activities.push({
                        id: `med-${med.id}-${medTime.getTime()}`,
                        title: `Uống thuốc ${med.name}`,
                        desc: statusText,
                        time: medTime,
                        status,
                        type: 'medication',
                        details: `${med.dosage.amount} ${med.dosage.unit}${med.instructions ? ` · ${med.instructions}` : ''}`,
                        navigateTo: `/app/health-schedule?id=${med.userId}&name=${encodeURIComponent(data.managedElderly.find((e: any) => e.id === med.userId)?.name || '')}`
                    });
                });
            }
        });

        // Appointments: lấy trong window [-7, +30] ngày
        data.appointments.forEach(apt => {
            const aptTime = new Date(apt.appointmentDate);
            if (aptTime < sevenDaysAgo || aptTime > thirtyDaysLater) return;

            const status = apt.status === 'Completed' ? 1
                         : apt.status === 'Missed' ? 2 : 0;
            const statusText = apt.status === 'Completed' ? 'Đã hoàn thành'
                             : apt.status === 'Cancelled' ? 'Đã hủy'
                             : apt.status === 'Missed' ? 'Đã bỏ lỡ'
                             : aptTime > now ? 'Sắp tới' : 'Đang chờ';

            activities.push({
                id: `apt-${apt.id}`,
                title: `Khám bác sĩ ${apt.doctorName}`,
                desc: statusText,
                time: aptTime,
                status,
                type: 'appointment',
                details: `${apt.specialty ? apt.specialty + ' · ' : ''}${apt.location}`,
                navigateTo: `/app/health-schedule?id=${apt.userId}&name=${encodeURIComponent(data.managedElderly.find((e: any) => e.id === apt.userId)?.name || '')}`
            });
        });

        // Sắp xếp: ưu tiên gần thời điểm hiện tại nhất (cả quá khứ lẫn tương lai)
        return activities
            .sort((a, b) => Math.abs(a.time.getTime() - now.getTime()) - Math.abs(b.time.getTime() - now.getTime()))
            .slice(0, 5);
    }, [data.medications, data.appointments, data.reminders]);

    // --- 3. Render giao diện ---

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>{t('connecting_system')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <AlertCircle size={48} color="#e74c3c" />
                <h3>{t('connection_error')}</h3>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="action-btn">{t('retry')}</button>
            </div>
        );
    }

    const handleUnlinkElderly = async (elderlyId: string) => {
        if (!user?.id) return;
        if (window.confirm(t('confirm_delete_relative') || "Bạn có chắc muốn xóa người thân này?")) {
            try {
                await authApi.unlinkElderly(user.id, elderlyId);
                // Refresh data
                setData(prev => ({
                    ...prev,
                    managedElderly: prev.managedElderly.filter(e => e.id !== elderlyId)
                }));
                setMenuOpenId(null);
            } catch (err) {
                console.error("Failed to unlink elderly", err);
                alert("Không thể xóa người thân.");
            }
        }
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <header className="dashboard-header">
                <h1 className="dashboard-greeting">{t('dashboard_greeting', { name: user?.name || 'User' })}</h1>
                <div className="header-actions">
                    {/* <button className="btn-add-med" onClick={() => navigate('/app/medications')}>
                        <Plus size={18} /> {t('add_med_dashboard')}
                    </button> */}
                </div>
            </header>

            {/* Priority Alert Section - Chỉ hiện nếu có liều thuốc bị bỏ lỡ */}
            {missedReminders.length > 0 ? (
                <section className="priority-alert-box">
                    <div className="alert-icon-red">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="alert-text">
                        <h2>{t('missed_med_alert')}</h2>
                        <p>
                            {t('missed_med_desc', { count: missedReminders.length })}
                        </p>
                    </div>
                    <button className="btn-check-alert" onClick={() => navigate('/app/reminders')}>
                        {t('check_now')}
                    </button>
                </section>
            ) : (
                // Chỉ hiển thị "Mọi thứ đều ổn" khi không có reminder nào bị missed
                data.reminders.length > 0 && data.reminders.every(r => r.status !== 2) ? (
                    <section className="priority-alert-box" style={{ backgroundColor: '#e8f5e9', borderColor: '#c8e6c9' }}>
                        <div className="alert-icon-red" style={{ backgroundColor: '#4caf50' }}>✓</div>
                        <div className="alert-text">
                            <h2 style={{ color: '#2e7d32' }}>{t('everything_ok')}</h2>
                            <p style={{ color: '#4caf50' }}>{t('all_done_desc')}</p>
                        </div>
                    </section>
                ) : null
            )}

            {/* Relatives Section */}
            <section className="relatives-section">
                <h2 className="section-heading">{t('relatives_list')}</h2>
                <div className="relatives-grid">
                    {data.managedElderly.length > 0 ? (
                        data.managedElderly.map((person) => (
                            <div className="relative-card" key={person.id}>
                                <div className="card-header">
                                    <div
                                        className="avatar-placeholder"
                                        style={{
                                            backgroundColor: person.id.charCodeAt(0) % 2 === 0 ? '#ccff99' : '#ffe5e5',
                                            color: person.id.charCodeAt(0) % 2 === 0 ? '#4caf50' : '#ff4d4d'
                                        }}
                                    >
                                        {person.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="relative-name">{person.name}</span>
                                    <div className="menu-container">
                                        <MoreVertical
                                            size={20}
                                            className="more-icon"
                                            onClick={() => setMenuOpenId(menuOpenId === person.id ? null : person.id)}
                                        />
                                        {menuOpenId === person.id && (
                                            <div className="dropdown-menu">
                                                <button onClick={() => navigate(`/app/health-schedule?id=${person.id}&name=${encodeURIComponent(person.name)}`)}>
                                                    {t('view_calendar')}
                                                </button>
                                                <button className="delete-option" onClick={() => handleUnlinkElderly(person.id)}>
                                                    {t('delete_relative')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* <div className="status-badge completed">
                                    <span>✅ {t('member')}</span>
                                </div> */}
                                <p className="next-schedule">{person.email}</p>
                            </div>
                        ))
                    ) : (
                        <div className="no-data-msg" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '20px', color: '#888' }}>
                            <p>{t('no_elderly_found')}</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Bottom Grid: Stats & Activity */}
            <div className="bottom-grid">
                {/* Hoạt động gần đây từ lịch cá nhân */}
                <div className="stat-box">
                    <h3 className="stat-title"><Activity size={18} /> {t('recent_activity')}</h3>
                    <ul className="activity-list">
                        {recentActivities.length > 0 ? (
                            recentActivities.map((act) => (
                                <li
                                    className="activity-item"
                                    key={act.id}
                                    onClick={() => navigate(act.navigateTo)}
                                    style={{ cursor: 'pointer' }}
                                    title="Xem lịch trình"
                                >
                                    <span className={`dot-indicator ${
                                        act.status === 1 ? 'bg-success' : 
                                        act.status === 2 ? 'bg-danger' : 'bg-primary'
                                    }`}></span>
                                    <div className="activity-content">
                                        <strong>{act.title}</strong>
                                        <span className="desc">{act.desc}</span>
                                        {act.details && (
                                            <small className="activity-details">{act.details}</small>
                                        )}
                                    </div>
                                    <div className="activity-time-info">
                                        <span className="activity-time">
                                            {act.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <small className="activity-date">
                                            {act.time.toLocaleDateString('vi-VN', { 
                                                day: '2-digit', 
                                                month: '2-digit' 
                                            })}
                                        </small>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="no-activity-msg">
                                <p>{t('no_recent_activity')}</p>
                                <small>Chưa có hoạt động nào trong 7 ngày qua</small>
                            </li>
                        )}
                    </ul>
                    {recentActivities.length > 0 && (
                        <div className="activity-footer">
                            <button 
                                className="view-all-btn"
                                onClick={() => navigate('/app/health-schedule')}
                            >
                                Xem tất cả lịch trình →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};