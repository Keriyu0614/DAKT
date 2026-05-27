import { type HealthLog } from '../../api/health.api';

interface HealthHistoryItemProps {
    log: HealthLog;
    onEdit: (log: HealthLog) => void;
    getStatus: (metric: string, value: any) => 'normal' | 'attention' | 'critical';
}

const HealthHistoryItem = ({ log, onEdit, getStatus }: HealthHistoryItemProps) => {
    const hr = log.heartRate !== undefined ? log.heartRate : (log as any).HeartRate;
    const w = log.weight !== undefined ? log.weight : (log as any).Weight;
    const bp = log.bloodPressure || (log as any).BloodPressure;

    return (
        <div className="history-item" onClick={() => onEdit(log)} style={{ cursor: 'pointer' }}>
            <div className="history-date">
                <span>{new Date(log.date).toLocaleDateString()}</span>
                <span style={{ fontWeight: 500, fontSize: '13px', color: '#64748b' }}>
                    {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {log.recordedBy === 'self' && (
                    <span style={{
                        display: 'inline-block',
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '12px',
                        marginTop: '4px',
                        width: 'fit-content'
                    }}>
                        Tự ghi
                    </span>
                )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div className="history-metrics">
                    <div className="history-metric">
                        <span className="history-metric-label">Huyết áp</span>
                        <span className={`history-metric-value ${getStatus('bloodPressure', bp)}`}>
                            {bp || '--'}
                        </span>
                    </div>
                    <div className="history-metric">
                        <span className="history-metric-label">Nhịp tim</span>
                        <span className={`history-metric-value ${getStatus('heartRate', hr)}`}>
                            {hr || '--'}
                        </span>
                    </div>
                    <div className="history-metric">
                        <span className="history-metric-label">Cân nặng</span>
                        <span className={`history-metric-value ${getStatus('weight', w)}`}>
                            {w || '--'}
                        </span>
                    </div>
                </div>
                {log.note && <div className="history-note">Ghi chú: {log.note}</div>}
            </div>
        </div>
    );
};

export default HealthHistoryItem;
