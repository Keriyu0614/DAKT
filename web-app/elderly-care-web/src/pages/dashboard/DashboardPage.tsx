import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    MoreVertical,
    Activity,
    Pill,
    AlertTriangle,
    AlertCircle
} from "lucide-react";
import "./DashboardPage.css";
import { appointmentApi } from "../../api/appointment.api";
import { medicationService } from "../../services/medication.service";
import { type Medication } from "../../api/medication.api";
import { reminderApi, type Reminder } from "../../api/reminder.api";
import { healthApi, type HealthLog } from "../../api/health.api";
import { notificationApi, type Notification } from "../../api/notification.api";
import { useAuth } from "../../context/AuthContext";

interface DashboardData {
    appointments: any[];
    medications: Medication[];
    reminders: Reminder[];
    healthLogs: HealthLog[];
    notifications: Notification[];
}

export const DashboardPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [data, setData] = useState<DashboardData>({
        appointments: [],
        medications: [],
        reminders: [],
        healthLogs: [],
        notifications: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- 1. Lấy dữ liệu từ API ---
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                // Gọi song song tất cả các API
                const [apptRes, medRes, remRes, healthRes, notifRes] = await Promise.all([
                    appointmentApi.getAll().catch(() => ({ data: [] })),
                    medicationService.getMedications().catch(() => []),
                    reminderApi.getReminders().catch(() => ({ data: [] })),
                    healthApi.getHealthLogs().catch(() => ({ data: [] })),
                    user?.id ? notificationApi.getNotifications(user.id).catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
                ]);

                setData({
                    appointments: apptRes.data || [],
                    medications: (medRes as any) || [],
                    reminders: remRes.data || [],
                    healthLogs: healthRes.data || [],
                    notifications: (notifRes as any).data || []
                });
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
    }, [user?.id]);

    // --- 2. Logic xử lý dữ liệu để hiển thị lên giao diện thiết kế ---

    // Tìm các nhắc nhở bị bỏ lỡ (Status = 2: Missed) để hiển thị Banner Cảnh báo
    const missedReminders = useMemo(() =>
        data.reminders.filter(r => r.status === 2).sort((a, b) =>
            new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime()
        ), [data.reminders]);

    // Thống kê tỷ lệ tuân thủ (giả lập dựa trên số nhắc nhở thành công / tổng số)
    const complianceStats = useMemo(() => {
        // Đây là logic mẫu, bạn có thể điều chỉnh tùy theo dữ liệu thực tế
        return [60, 45, 70, 85, 40]; // Tương ứng T2, T3, T4, T5, T6
    }, []);

    // Hoạt động gần đây (Gộp nhắc nhở và lịch hẹn)
    const recentActivities = useMemo(() => {
        const activities = [
            ...data.reminders.map(r => ({
                id: r.id,
                title: r.type === 0 ? t('medications') : t('reminders'),
                desc: r.status === 1 ? t('completed') : r.status === 2 ? t('missed_badge') : t('pending'),
                time: new Date(r.scheduledTime),
                status: r.status
            })),
            ...data.appointments.map(a => ({
                id: a.id,
                title: `${t('appointments')} Dr. ${a.doctorName}`,
                desc: a.status || t('pending'),
                time: new Date(a.appointmentDate),
                status: 3
            }))
        ];
        return activities.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 3);
    }, [data.reminders, data.appointments]);

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

    return (
        <div className="dashboard-container">
            {/* Header */}
            <header className="dashboard-header">
                <h1 className="dashboard-greeting">{t('dashboard_greeting', { name: user?.name || 'User' })}</h1>
                <div className="header-actions">
                    <button className="btn-add-med" onClick={() => navigate('/app/medications')}>
                        <Plus size={18} /> {t('add_med_dashboard')}
                    </button>
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
                <section className="priority-alert-box" style={{ backgroundColor: '#e8f5e9', borderColor: '#c8e6c9' }}>
                    <div className="alert-icon-red" style={{ backgroundColor: '#4caf50' }}>✓</div>
                    <div className="alert-text">
                        <h2 style={{ color: '#2e7d32' }}>{t('everything_ok')}</h2>
                        <p style={{ color: '#4caf50' }}>{t('all_done_desc')}</p>
                    </div>
                </section>
            )}

            {/* Relatives Section */}
            <section className="relatives-section">
                <h2 className="section-heading">{t('relatives_list')}</h2>
                <div className="relatives-grid">
                    {/* Ở đây bạn có thể map qua danh sách bệnh nhân/người thân nếu có API riêng, 
                        hiện tại giữ nguyên 2 thẻ mẫu theo thiết kế */}
                    <div className="relative-card">
                        <div className="card-header">
                            <div className="avatar-placeholder" style={{ backgroundColor: '#ccff99', color: '#4caf50' }}>P</div>
                            <span className="relative-name">{t('grandma')}</span>
                            <MoreVertical size={20} className="more-icon" />
                        </div>
                        <div className={`status-badge ${missedReminders.length > 0 ? 'missed' : 'completed'}`}>
                            <span>{missedReminders.length > 0 ? `❌ ${t('missed_badge')}` : `✅ ${t('completed_badge')}`}</span>
                        </div>
                        <p className="next-schedule">{t('meds_using')} {data.medications.length}</p>
                        <button className="btn-details" onClick={() => navigate('/app/medications')}>
                            {t('view_details')}
                        </button>
                    </div>

                    <div className="relative-card">
                        <div className="card-header">
                            <div className="avatar-placeholder" style={{ backgroundColor: '#ffe5e5', color: '#ff4d4d' }}>F</div>
                            <span className="relative-name">{t('grandpa')}</span>
                            <MoreVertical size={20} className="more-icon" />
                        </div>
                        <div className="status-badge completed">
                            <span>✅ {t('completed_badge')}</span>
                        </div>
                        <p className="next-schedule">{t('health_status')} {t('normal')}</p>
                        <button className="btn-details" onClick={() => navigate('/app/health')}>
                            {t('view_details')}
                        </button>
                    </div>
                </div>
            </section>

            {/* Bottom Grid: Stats & Activity */}
            <div className="bottom-grid">
                {/* Biểu đồ tuân thủ */}
                <div className="stat-box">
                    <h3 className="stat-title"><Pill size={18} /> {t('compliance_rate')}</h3>
                    <div className="chart-placeholder">
                        {complianceStats.map((val, idx) => (
                            <div
                                key={idx}
                                className={`bar ${idx === 3 ? 'active' : ''}`}
                                style={{ height: `${val}%` }}
                            ></div>
                        ))}
                    </div>
                    <div className="chart-labels">
                        <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span>
                    </div>
                </div>

                {/* Hoạt động gần đây từ API */}
                <div className="stat-box">
                    <h3 className="stat-title"><Activity size={18} /> {t('recent_activity')}</h3>
                    <ul className="activity-list">
                        {recentActivities.length > 0 ? (
                            recentActivities.map((act) => (
                                <li className="activity-item" key={act.id}>
                                    <span className={`dot-indicator ${act.status === 1 ? 'bg-success' : act.status === 2 ? 'bg-danger' : 'bg-primary'}`}></span>
                                    <div className="activity-content">
                                        <strong>{act.title}</strong> - {act.desc}
                                        <span className="activity-time">{act.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <p>{t('no_recent_activity')}</p>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};