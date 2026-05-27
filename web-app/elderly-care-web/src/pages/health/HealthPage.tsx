import { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { healthApi, type HealthLog } from '../../api/health.api';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, ChevronRight, Plus } from 'lucide-react';
import { socketService } from '../../services/socket.service';

// Sub-components
import HealthStatusCard, { type HealthStatus } from '../../components/health/HealthStatusCard';
import HealthTrendChart from '../../components/health/HealthTrendChart';
import HealthHistoryItem from '../../components/health/HealthHistoryItem';
import HealthEntryForm from '../../components/health/HealthEntryForm';

import './HealthPage.css';

export const HealthPage = () => {
    const { user, managedElderly } = useAuth();
    const activeUserId = managedElderly?.id || user?.id;
    const location = useLocation();

    // --- States ---
    const [logs, setLogs] = useState<HealthLog[]>([]);
    const [fetchError, setFetchError] = useState('');
    const [activeMetric, setActiveMetric] = useState<'bloodPressure' | 'heartRate' | 'weight'>('bloodPressure');

    // UI Modes
    const [isEntryMode, setIsEntryMode] = useState(false);
    const [editingLog, setEditingLog] = useState<HealthLog | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    const fetchLogs = useCallback(async () => {
        if (!activeUserId) return;
        try {
            const response = await healthApi.getHealthLogs(activeUserId);
            const sortedLogs = (response.data || []).sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            setLogs(sortedLogs);
            setFetchError('');
        } catch (err) {
            console.error(err);
            setFetchError('Không thể tải hồ sơ sức khỏe. Vui lòng thử lại sau.');
        }
    }, [activeUserId]);

    // --- Refetch khi navigate tới trang này (React Router SPA) ---
    useEffect(() => {
        fetchLogs();
    }, [location.pathname, fetchLogs]);

    // --- Initial mount + isMounted for chart ---
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // --- Real-time socket sync + refetch on page visibility ---
    useEffect(() => {
        socketService.connect();

        const handleHealthAcknowledged = (data: any) => {
            console.log('[HealthPage] health_acknowledged received:', data);
            fetchLogs();
        };

        const handleHealthLogSubmitted = (data: any) => {
            console.log('[HealthPage] health_log_submitted received:', data);
            fetchLogs();
        };

        socketService.on('health_acknowledged', handleHealthAcknowledged);
        socketService.on('health_log_submitted', handleHealthLogSubmitted);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchLogs();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            socketService.off('health_acknowledged', handleHealthAcknowledged);
            socketService.off('health_log_submitted', handleHealthLogSubmitted);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchLogs]);

    // --- derived data ---
    const latestMetrics = useMemo(() => {
        const metrics = {
            bloodPressure: '--',
            heartRate: '--',
            weight: '--'
        };

        for (const log of logs) {
            const bp = log.bloodPressure || (log as any).BloodPressure;
            const hr = log.heartRate !== undefined ? log.heartRate : (log as any).HeartRate;
            const w = log.weight !== undefined ? log.weight : (log as any).Weight;

            if (metrics.bloodPressure === '--' && bp && bp !== '-') {
                metrics.bloodPressure = bp;
            }
            if (metrics.heartRate === '--' && hr !== undefined && hr !== null) {
                metrics.heartRate = hr.toString();
            }
            if (metrics.weight === '--' && w !== undefined && w !== null) {
                metrics.weight = w.toString();
            }
            if (metrics.bloodPressure !== '--' && metrics.heartRate !== '--' && metrics.weight !== '--') break;
        }
        return metrics;
    }, [logs]);

    const getStatus = (metric: string, value: any): HealthStatus => {
        if (value === '--' || value === '-' || value === undefined || value === null) return 'normal';
        if (metric === 'bloodPressure') {
            const parts = String(value).split('/');
            if (parts.length === 2) {
                const sys = parseInt(parts[0]);
                const dia = parseInt(parts[1]);
                if (sys >= 160 || dia >= 100) return 'critical';
                if (sys >= 140 || dia >= 90) return 'attention';
            }
        } else if (metric === 'heartRate') {
            const hr = Number(value);
            if (hr > 120 || hr < 40) return 'critical';
            if (hr > 100 || hr < 50) return 'attention';
        } else if (metric === 'weight') {
            const w = Number(value);
            if (w > 150 || w < 30) return 'attention';
        }
        return 'normal';
    };

    const chartData = useMemo(() => {
        return [...logs].reverse().map(log => {
            const hr = log.heartRate !== undefined ? log.heartRate : (log as any).HeartRate;
            const w = log.weight !== undefined ? log.weight : (log as any).Weight;
            const bp = log.bloodPressure || (log as any).BloodPressure;

            return {
                date: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                heartRate: hr,
                weight: w,
                bloodPressure: bp && bp !== '-' ? parseInt(bp.split('/')[0]) : null,
            };
        }).filter(d => d.heartRate || d.bloodPressure || d.weight);
    }, [logs]);

    const handleOpenEntry = (log: HealthLog | null = null) => {
        setEditingLog(log);
        setIsEntryMode(true);
    };

    const handleSuccess = () => {
        setIsEntryMode(false);
        setEditingLog(null);
        fetchLogs();
    };

    if (isEntryMode && activeUserId) {
        return (
            <HealthEntryForm
                userId={activeUserId}
                editingLog={editingLog}
                onClose={() => setIsEntryMode(false)}
                onSuccess={handleSuccess}
            />
        );
    }

    return (
        <div className="health-page-container">
            <header className="health-header">
                <h1>Hồ Sơ Sức Khỏe</h1>
                <p>Theo dõi và xem lại các chỉ số sức khỏe hàng ngày để quản lý tình trạng sức khỏe của người cao tuổi.</p>
            </header>

            {fetchError && (
                <div className="error-view-inline">
                    <AlertTriangle size={20} />
                    <span>{fetchError}</span>
                </div>
            )}

            <div className="health-content">
                <section className="health-section">
                    <h2 className="section-title"><ChevronRight size={24} /> Chỉ số mới nhất</h2>
                    <div className="status-grid">
                        <HealthStatusCard
                            type="bloodPressure"
                            value={latestMetrics.bloodPressure}
                            status={getStatus('bloodPressure', latestMetrics.bloodPressure)}
                        />
                        <HealthStatusCard
                            type="heartRate"
                            value={latestMetrics.heartRate}
                            status={getStatus('heartRate', latestMetrics.heartRate)}
                        />
                        <HealthStatusCard
                            type="weight"
                            value={latestMetrics.weight}
                            status={getStatus('weight', latestMetrics.weight)}
                        />
                    </div>
                </section>

                <section className="health-section">
                    <div className="trends-header">
                        <h2 className="section-title">Xu Hướng Sức Khỏe</h2>
                        <div className="metric-toggles">
                            {(['bloodPressure', 'heartRate', 'weight'] as const).map(m => (
                                <button key={m} className={`metric-toggle ${activeMetric === m ? 'active' : ''}`} onClick={() => setActiveMetric(m)}>
                                    {m === 'bloodPressure' ? 'Huyết áp' : m === 'heartRate' ? 'Nhịp tim' : 'Cân nặng'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <HealthTrendChart
                        data={chartData}
                        activeMetric={activeMetric}
                        isMounted={isMounted}
                    />
                </section>

                <section className="health-section">
                    <h2 className="section-title">Nhật ký lịch sử</h2>
                    <div className="history-list">
                        {logs.length === 0 ? (
                            <p className="empty-text">Không tìm thấy hồ sơ sức khỏe nào.</p>
                        ) : (
                            logs.map(log => (
                                <HealthHistoryItem
                                    key={log.id}
                                    log={log}
                                    onEdit={handleOpenEntry}
                                    getStatus={getStatus}
                                />
                            ))
                        )}
                    </div>
                </section>
            </div>

            <button className="add-log-trigger" onClick={() => handleOpenEntry()}>
                <Plus size={20} /> Thêm Hồ Sơ
            </button>
        </div>
    );
};
