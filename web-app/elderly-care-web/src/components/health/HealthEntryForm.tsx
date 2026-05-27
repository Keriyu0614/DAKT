import { useState, useCallback, useEffect } from 'react';
import { Heart, X, Save, Clock, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { healthApi, type HealthLog, type CreateHealthLogPayload } from '../../api/health.api';
import { socketService } from '../../services/socket.service';

interface HealthEntryFormProps {
    userId: string;
    editingLog: HealthLog | null;
    onClose: () => void;
    onSuccess: () => void;
}

const HealthEntryForm = ({ userId, editingLog, onClose, onSuccess }: HealthEntryFormProps) => {
    const [formData, setFormData] = useState({
        bloodPressure: '',
        heartRate: '',
        weight: '',
        note: ''
    });
    const [timestamp, setTimestamp] = useState(new Date().toISOString());
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isDirty, setIsDirty] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const resetForm = useCallback((log: HealthLog | null = null) => {
        if (log) {
            const hr = log.heartRate !== undefined ? log.heartRate : (log as any).HeartRate;
            const w = log.weight !== undefined ? log.weight : (log as any).Weight;
            const bp = log.bloodPressure || (log as any).BloodPressure;
            setFormData({
                bloodPressure: (bp && bp !== '-') ? bp : '',
                heartRate: hr !== undefined && hr !== null ? String(hr) : '',
                weight: w !== undefined && w !== null ? String(w) : '',
                note: log.note || ''
            });
            setTimestamp(log.date);
        } else {
            setFormData({ bloodPressure: '', heartRate: '', weight: '', note: '' });
            setTimestamp(new Date().toISOString());
        }
        setErrors({});
        setIsDirty(false);
        setSaveSuccess(false);
    }, []);

    useEffect(() => {
        resetForm(editingLog);
    }, [editingLog, resetForm]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
        if (errors[field]) {
            setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        // Huyết áp — bắt buộc
        if (!formData.bloodPressure.trim()) {
            newErrors.bloodPressure = 'Vui lòng nhập huyết áp.';
        } else if (!/^\d{2,3}\/\d{2,3}$/.test(formData.bloodPressure.trim())) {
            newErrors.bloodPressure = 'Định dạng phải là Tâm thu/Tâm trương (ví dụ: 120/80).';
        }

        // Nhịp tim — bắt buộc
        if (!formData.heartRate.trim()) {
            newErrors.heartRate = 'Vui lòng nhập nhịp tim.';
        } else {
            const hr = parseInt(formData.heartRate);
            if (isNaN(hr) || hr < 30 || hr > 250) {
                newErrors.heartRate = 'Nhịp tim phải từ 30 đến 250 bpm.';
            }
        }

        // Cân nặng — bắt buộc
        if (!formData.weight.trim()) {
            newErrors.weight = 'Vui lòng nhập cân nặng.';
        } else {
            const w = parseFloat(formData.weight);
            if (isNaN(w) || w < 20 || w > 500) {
                newErrors.weight = 'Cân nặng phải từ 20 đến 500 kg.';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        try {
            setLoading(true);

            const payload: CreateHealthLogPayload = {
                userId,
                date: timestamp,
                bloodPressure: formData.bloodPressure.trim(),
                heartRate: parseInt(formData.heartRate),
                weight: parseFloat(formData.weight),
                note: formData.note || undefined,
                recordedBy: 'caregiver',
            };

            const result = await healthApi.createHealthLog(payload);

            try {
                const savedLog = result.data;
                socketService.emit('health_log_submitted', {
                    userId,
                    healthLogId: savedLog?.id || '',
                    bloodPressure: payload.bloodPressure,
                    heartRate: payload.heartRate,
                    weight: payload.weight,
                    recordedBy: 'caregiver',
                });
            } catch (e) {
                console.warn('[HealthEntryForm] Failed to emit socket event:', e);
            }

            setSaveSuccess(true);
            setTimeout(() => { onSuccess(); }, 1500);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (isDirty) setShowCancelModal(true);
        else onClose();
    };

    const inputStyle = (field: string): React.CSSProperties => ({
        height: '48px', width: '100%', borderRadius: '8px',
        border: errors[field] ? '2px solid var(--hp-critical)' : '1px solid var(--hp-border)',
        padding: '0 1rem', fontSize: '1.125rem', boxSizing: 'border-box'
    });

    return (
        <div className="health-page-container" style={{ maxWidth: '800px' }}>
            <header className="health-header">
                <button className="metric-toggle" onClick={handleClose} style={{ marginBottom: '1rem' }}>
                    <X size={20} /> Đóng
                </button>
                <h1>{editingLog ? 'Sửa Hồ Sơ Sức Khỏe' : 'Thêm Hồ Sơ Sức Khỏe'}</h1>
                <p>Vui lòng nhập đầy đủ các chỉ số sức khỏe bên dưới.</p>
            </header>

            {saveSuccess ? (
                <div className="status-card normal" style={{ alignItems: 'center', padding: '3rem' }}>
                    <CheckCircle2 size={64} color="var(--hp-success)" />
                    <h2 style={{ marginTop: '1rem' }}>Lưu Hồ Sơ Thành Công</h2>
                    <p>Đang quay lại bảng điều khiển...</p>
                </div>
            ) : (
                <div className="health-section">
                    {editingLog && (
                        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', marginBottom: '2rem', border: '1px solid var(--hp-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <span className="history-metric-label">Ngày ghi ban đầu</span>
                                <p style={{ margin: 0, fontWeight: 600 }}>{new Date(editingLog.date).toLocaleString()}</p>
                            </div>
                            {editingLog.recordedBy === 'self' && (
                                <div style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.875rem', fontWeight: 700, padding: '4px 12px', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
                                    Tự ghi
                                </div>
                            )}
                        </div>
                    )}

                    <section style={{ marginBottom: '2rem' }}>
                        <h3 className="section-title"><Heart size={20} /> Chỉ Số Sức Khỏe <span style={{ color: 'var(--hp-critical)', fontSize: '0.875rem', fontWeight: 400 }}>(Tất cả bắt buộc)</span></h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                            {/* Huyết áp */}
                            <div className="form-group">
                                <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>
                                    Huyết Áp (mmHg) <span style={{ color: 'var(--hp-critical)' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ví dụ: 120/80"
                                    value={formData.bloodPressure}
                                    onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
                                    onBlur={validate}
                                    style={inputStyle('bloodPressure')}
                                />
                                {errors.bloodPressure && <p style={{ color: 'var(--hp-critical)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors.bloodPressure}</p>}
                            </div>

                            {/* Nhịp tim */}
                            <div className="form-group">
                                <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>
                                    Nhịp Tim (bpm) <span style={{ color: 'var(--hp-critical)' }}>*</span>
                                </label>
                                <input
                                    type="number"
                                    placeholder="Ví dụ: 72"
                                    value={formData.heartRate}
                                    onChange={(e) => handleInputChange('heartRate', e.target.value)}
                                    onBlur={validate}
                                    style={inputStyle('heartRate')}
                                />
                                {errors.heartRate && <p style={{ color: 'var(--hp-critical)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors.heartRate}</p>}
                            </div>

                            {/* Cân nặng */}
                            <div className="form-group">
                                <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>
                                    Cân Nặng (kg) <span style={{ color: 'var(--hp-critical)' }}>*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="Ví dụ: 70.5"
                                    value={formData.weight}
                                    onChange={(e) => handleInputChange('weight', e.target.value)}
                                    onBlur={validate}
                                    style={inputStyle('weight')}
                                />
                                {errors.weight && <p style={{ color: 'var(--hp-critical)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors.weight}</p>}
                            </div>
                        </div>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h3 className="section-title"><Clock size={20} /> Thời Gian</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}><Calendar size={14} /> Ngày</label>
                                <input
                                    type="date"
                                    value={timestamp.split('T')[0]}
                                    onChange={(e) => { const time = timestamp.split('T')[1] || '00:00:00'; setTimestamp(`${e.target.value}T${time}`); setIsDirty(true); }}
                                    style={{ height: '48px', width: '100%', borderRadius: '8px', border: '1px solid var(--hp-border)', padding: '0 1rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}><Clock size={14} /> Giờ</label>
                                <input
                                    type="time"
                                    value={timestamp.split('T').length > 1 ? timestamp.split('T')[1].substring(0, 5) : '00:00'}
                                    onChange={(e) => { const date = timestamp.split('T')[0]; setTimestamp(`${date}T${e.target.value}:00.000Z`); setIsDirty(true); }}
                                    style={{ height: '48px', width: '100%', borderRadius: '8px', border: '1px solid var(--hp-border)', padding: '0 1rem' }}
                                />
                            </div>
                        </div>
                    </section>

                    <section style={{ marginBottom: '2rem' }}>
                        <h3 className="section-title"><FileText size={20} /> Ghi Chú (Không bắt buộc)</h3>
                        <textarea
                            placeholder="Các triệu chứng hoặc tình trạng quan sát được..."
                            value={formData.note}
                            onChange={(e) => handleInputChange('note', e.target.value)}
                            style={{ width: '100%', height: '120px', borderRadius: '12px', border: '1px solid var(--hp-border)', padding: '1rem', fontSize: '1rem', resize: 'vertical', boxSizing: 'border-box' }}
                        />
                    </section>

                    <div style={{ display: 'flex', gap: '1rem', paddingTop: '2rem', borderTop: '2px solid var(--hp-border)' }}>
                        <button
                            className="add-log-trigger"
                            style={{ position: 'static', flex: 1, justifyContent: 'center', boxShadow: 'none' }}
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? 'Đang lưu...' : <><Save size={20} /> Lưu Hồ Sơ Sức Khỏe</>}
                        </button>
                        <button
                            className="metric-toggle"
                            style={{ flex: 1, justifyContent: 'center', height: '56px', borderRadius: '9999px', border: '2px solid var(--hp-border)' }}
                            onClick={handleClose}
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            )}

            {showCancelModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', maxWidth: '400px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
                        <h2 style={{ marginBottom: '1rem' }}>Thay Đổi Chưa Lưu</h2>
                        <p style={{ color: 'var(--hp-text-muted)', marginBottom: '2rem' }}>Bạn đã nhập thông tin nhưng chưa lưu. Bạn có chắc chắn muốn hủy bỏ hồ sơ này không?</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: 'none', background: 'var(--hp-critical)', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                                onClick={() => { setShowCancelModal(false); setIsDirty(false); onClose(); }}>
                                Hủy Bỏ
                            </button>
                            <button style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: '1px solid var(--hp-border)', background: 'white', fontWeight: 700, cursor: 'pointer' }}
                                onClick={() => setShowCancelModal(false)}>
                                Tiếp Tục Chỉnh Sửa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HealthEntryForm;
