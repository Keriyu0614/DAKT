import { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Calendar, Pill, Activity, Timer, Info } from 'lucide-react';
import { reminderApi, type CreateReminderPayload, type Reminder } from '../../api/reminder.api';
import { toast } from 'react-toastify';
import './ReminderForm.css';

interface Appointment {
    id: string;
    doctorName: string;
    appointmentDate: string;
    appointmentType?: string;
}

interface Medication {
    id: string;
    name: string;
    dosage: any;
    time: string;
}

interface HealthLog {
    id: string;
    date: string;
}

interface FormData {
    reminderType: 'Appointment' | 'Medication' | 'Health' | '';
    sourceEventId: string;
    timingMode: 'relative' | 'absolute';
    relativeTrigger: string;
    absoluteDate: string;
    absoluteTime: string;
    repeatMode: 'none' | 'daily' | 'weekly' | 'custom';
    customInterval: string;
    customUnit: 'hours' | 'days' | 'weeks';
    notes: string;
}

interface FormErrors {
    [key: string]: string;
}

interface ReminderFormProps {
    isOpen: boolean;
    onClose: () => void;
    editingReminder: Reminder | null;
    appointments: Appointment[];
    medications: Medication[];
    healthLogs: HealthLog[];
    userId: string;
    onSuccess: () => void;
}

const INITIAL_FORM: FormData = {
    reminderType: '',
    sourceEventId: '',
    timingMode: 'relative',
    relativeTrigger: '1h_before',
    absoluteDate: '',
    absoluteTime: '',
    repeatMode: 'none',
    customInterval: '1',
    customUnit: 'days',
    notes: ''
};

const ReminderForm = ({
    isOpen,
    onClose,
    editingReminder,
    appointments,
    medications,
    healthLogs,
    userId,
    onSuccess
}: ReminderFormProps) => {
    const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [isDirty, setIsDirty] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    useEffect(() => {
        if (editingReminder) {
            const remDate = new Date(editingReminder.scheduledTime);
            let reminderType: 'Appointment' | 'Medication' | 'Health' = 'Appointment';
            if (editingReminder.type === 0) reminderType = 'Medication';
            else if (editingReminder.type === 1) reminderType = 'Appointment';
            else if (editingReminder.type === 2) reminderType = 'Health';

            setFormData({
                reminderType,
                sourceEventId: editingReminder.referenceId,
                timingMode: 'absolute',
                relativeTrigger: '1h_before',
                absoluteDate: remDate.toISOString().split('T')[0],
                absoluteTime: remDate.toTimeString().slice(0, 5),
                repeatMode: 'none',
                customInterval: '1',
                customUnit: 'days',
                notes: ''
            });
            setIsDirty(false);
        } else {
            setFormData(INITIAL_FORM);
            setFormErrors({});
            setIsDirty(false);
        }
    }, [editingReminder, isOpen]);

    const handleFormChange = (field: keyof FormData, value: string) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'reminderType') {
                updated.sourceEventId = '';
            }
            return updated;
        });
        setIsDirty(true);
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateField = (field: keyof FormData, value: string): string => {
        switch (field) {
            case 'reminderType':
                return !value ? 'Vui lòng chọn loại nhắc nhở' : '';
            case 'sourceEventId':
                return !value ? `Vui lòng chọn một sự kiện` : '';
            case 'absoluteDate':
                return formData.timingMode === 'absolute' && !value ? 'Vui lòng chọn ngày' : '';
            case 'absoluteTime':
                return formData.timingMode === 'absolute' && !value ? 'Vui lòng chọn giờ' : '';
            case 'customInterval':
                return formData.repeatMode === 'custom' && (!value || Number(value) <= 0)
                    ? 'Khoảng thời gian phải ít nhất là 1' : '';
            default:
                return '';
        }
    };

    const handleBlur = (field: keyof FormData) => {
        const error = validateField(field, formData[field]);
        setFormErrors(prev => ({ ...prev, [field]: error }));
    };

    const calculateTriggerTime = (): Date | null => {
        if (formData.timingMode === 'absolute') {
            if (!formData.absoluteDate || !formData.absoluteTime) return null;
            return new Date(`${formData.absoluteDate}T${formData.absoluteTime}`);
        }

        if (!formData.sourceEventId) return null;

        let sourceTime: Date | null = null;
        if (formData.reminderType === 'Appointment') {
            const apt = appointments.find(a => a.id === formData.sourceEventId);
            if (apt) sourceTime = new Date(apt.appointmentDate);
        } else if (formData.reminderType === 'Medication') {
            const med = medications.find(m => m.id === formData.sourceEventId);
            if (med) {
                const today = new Date();
                const [hours, minutes] = med.time.split(':');
                sourceTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(),
                    parseInt(hours), parseInt(minutes));
            }
        }

        if (!sourceTime) return null;
        const triggerTime = new Date(sourceTime);

        switch (formData.relativeTrigger) {
            case 'at_event': break;
            case '15m_before': triggerTime.setMinutes(triggerTime.getMinutes() - 15); break;
            case '30m_before': triggerTime.setMinutes(triggerTime.getMinutes() - 30); break;
            case '1h_before': triggerTime.setHours(triggerTime.getHours() - 1); break;
            case '2h_before': triggerTime.setHours(triggerTime.getHours() - 2); break;
            case '1d_before': triggerTime.setDate(triggerTime.getDate() - 1); break;
        }
        return triggerTime;
    };

    const validateForm = (): boolean => {
        const errors: FormErrors = {};
        const now = new Date();

        errors.reminderType = validateField('reminderType', formData.reminderType);
        errors.sourceEventId = validateField('sourceEventId', formData.sourceEventId);

        if (formData.timingMode === 'absolute') {
            errors.absoluteDate = validateField('absoluteDate', formData.absoluteDate);
            errors.absoluteTime = validateField('absoluteTime', formData.absoluteTime);
        }

        if (formData.repeatMode === 'custom') {
            errors.customInterval = validateField('customInterval', formData.customInterval);
        }

        const triggerTime = calculateTriggerTime();
        if (triggerTime && triggerTime < now) {
            errors.triggerTime = `Thời gian nhắc nhở không được trong quá khứ. Đã chọn: ${triggerTime.toLocaleString()}`;
        }

        const filteredErrors = Object.fromEntries(Object.entries(errors).filter(([_, v]) => v !== ''));
        setFormErrors(filteredErrors);
        return Object.keys(filteredErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const triggerTime = calculateTriggerTime();
            if (!triggerTime) return;

            let typeEnum: 0 | 1 | 2;
            switch (formData.reminderType) {
                case 'Medication': typeEnum = 0; break;
                case 'Appointment': typeEnum = 1; break;
                case 'Health': typeEnum = 2; break;
                default: return;
            }

            const payload: CreateReminderPayload = {
                userId,
                type: typeEnum,
                referenceId: formData.sourceEventId,
                scheduledTime: triggerTime.toISOString()
            };

            if (editingReminder) {
                await reminderApi.updateReminder(editingReminder.id, payload);
                toast.success('Đã cập nhật nhắc nhở');
            } else {
                await reminderApi.createReminder(payload);
                toast.success('Đã tạo nhắc nhở');
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Lỗi khi lưu nhắc nhở');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelForm = () => {
        if (isDirty) setShowExitConfirm(true);
        else onClose();
    };

    const getSourceEventOptions = () => {
        if (formData.reminderType === 'Appointment') {
            return appointments.map(apt => ({
                id: apt.id, label: `${apt.doctorName} - ${new Date(apt.appointmentDate).toLocaleDateString()}`
            }));
        } else if (formData.reminderType === 'Medication') {
            return medications.map(med => ({
                id: med.id, label: `${med.name}`
            }));
        } else if (formData.reminderType === 'Health') {
            return healthLogs.map(log => ({
                id: log.id, label: `Nhật ký sức khỏe - ${new Date(log.date).toLocaleDateString()}`
            }));
        }
        return [];
    };

    const getPreviewText = (): string => {
        const triggerTime = calculateTriggerTime();
        if (!triggerTime) return 'Chọn sự kiện và thời gian để xem trước';
        const sourceOptions = getSourceEventOptions();
        const sourceEvent = sourceOptions.find(opt => opt.id === formData.sourceEventId);
        return `Thời gian: ${triggerTime.toLocaleString()} • Cho: ${sourceEvent?.label || 'Chưa rõ'}`;
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content form-modal">
                <form onSubmit={handleSubmit}>
                    <div className="modal-header">
                        <div>
                            <h2>{editingReminder ? 'Cập nhật Nhắc Nhở' : 'Thêm Nhắc Nhở Mới'}</h2>
                            <p className="form-subtitle">Cài đặt kích hoạt thông báo</p>
                        </div>
                        <button type="button" className="btn-close" onClick={handleCancelForm}><X size={24} /></button>
                    </div>

                    <div className="form-body">
                        <section className="form-section">
                            <h3 className="form-section-title"><LinkIcon size={20} /> Nguồn Nhắc Nhở</h3>
                            <div className="form-field">
                                <label>Nhắc nhở này dành cho cái gì? (Bắt buộc)</label>
                                <div className="radio-group">
                                    {(['Appointment', 'Medication', 'Health'] as const).map(type => (
                                        <label key={type} className="radio-label">
                                            <input
                                                type="radio"
                                                checked={formData.reminderType === type}
                                                onChange={() => handleFormChange('reminderType', type)}
                                                disabled={!!editingReminder}
                                            />
                                            {type === 'Appointment' ? <Calendar size={20} /> : type === 'Medication' ? <Pill size={20} /> : <Activity size={20} />}
                                            <span>{type === 'Appointment' ? 'Lịch khám' : type === 'Medication' ? 'Thuốc' : 'Sức khỏe'}</span>
                                        </label>
                                    ))}
                                </div>
                                {formErrors.reminderType && <span className="error-text">{formErrors.reminderType}</span>}
                            </div>

                            {formData.reminderType && (
                                <div className="form-field">
                                    <label htmlFor="sourceEventId">Chọn {formData.reminderType === 'Appointment' ? 'Lịch khám' : formData.reminderType === 'Medication' ? 'Thuốc' : 'Sức khỏe'} (Bắt buộc)</label>
                                    <select
                                        id="sourceEventId"
                                        value={formData.sourceEventId}
                                        onChange={(e) => handleFormChange('sourceEventId', e.target.value)}
                                        onBlur={() => handleBlur('sourceEventId')}
                                        className={formErrors.sourceEventId ? 'error' : ''}
                                        disabled={!!editingReminder}
                                    >
                                        <option value="">Chọn...</option>
                                        {getSourceEventOptions().map(opt => (
                                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                                        ))}
                                    </select>
                                    {formErrors.sourceEventId && <span className="error-text">{formErrors.sourceEventId}</span>}
                                </div>
                            )}
                        </section>

                        <section className="form-section">
                            <h3 className="form-section-title"><Timer size={20} /> Thời Gian Kích Hoạt</h3>
                            <div className="form-field">
                                <label>Khi nào nhắc nhở này kích hoạt? (Bắt buộc)</label>
                                <div className="radio-group vertical">
                                    <label className="radio-label">
                                        <input type="radio" checked={formData.timingMode === 'relative'} onChange={() => handleFormChange('timingMode', 'relative')} />
                                        <span>Dựa trên thời gian sự kiện (Đề xuất)</span>
                                    </label>
                                    <label className="radio-label">
                                        <input type="radio" checked={formData.timingMode === 'absolute'} onChange={() => handleFormChange('timingMode', 'absolute')} />
                                        <span>Ngày và giờ cụ thể</span>
                                    </label>
                                </div>
                            </div>

                            {formData.timingMode === 'relative' ? (
                                <div className="form-field">
                                    <label>Thời gian kích hoạt tương đối</label>
                                    <select value={formData.relativeTrigger} onChange={(e) => handleFormChange('relativeTrigger', e.target.value)}>
                                        <option value="at_event">Vào lúc sự kiện</option>
                                        <option value="15m_before">Trước 15 phút</option>
                                        <option value="30m_before">Trước 30 phút</option>
                                        <option value="1h_before">Trước 1 giờ</option>
                                        <option value="2h_before">Trước 2 giờ</option>
                                        <option value="1d_before">Trước 1 ngày</option>
                                    </select>
                                </div>
                            ) : (
                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Ngày</label>
                                        <input type="date" value={formData.absoluteDate} onChange={(e) => handleFormChange('absoluteDate', e.target.value)} onBlur={() => handleBlur('absoluteDate')} />
                                        {formErrors.absoluteDate && <span className="error-text">{formErrors.absoluteDate}</span>}
                                    </div>
                                    <div className="form-field">
                                        <label>Giờ</label>
                                        <input type="time" value={formData.absoluteTime} onChange={(e) => handleFormChange('absoluteTime', e.target.value)} onBlur={() => handleBlur('absoluteTime')} />
                                        {formErrors.absoluteTime && <span className="error-text">{formErrors.absoluteTime}</span>}
                                    </div>
                                </div>
                            )}
                        </section>

                        <div className="delivery-preview">
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: '#3498db' }}>
                                <Info size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                                Xem trước Nhắc Nhở
                            </h4>
                            <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>{getPreviewText()}</p>
                            {formErrors.triggerTime && <span className="error-text" style={{ marginTop: '10px' }}>{formErrors.triggerTime}</span>}
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={handleCancelForm}>Hủy</button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Đang lưu...' : editingReminder ? 'Cập nhật Nhắc Nhở' : 'Tạo Nhắc Nhở'}</button>
                    </div>
                </form>
            </div>

            {showExitConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content confirm-modal">
                        <div className="modal-body">
                            <h3>Hủy các thay đổi chưa lưu?</h3>
                            <p>Bạn có các thay đổi chưa được lưu. Bạn có chắc chắn muốn đóng biểu mẫu không?</p>
                            <div className="form-actions" style={{ padding: 0, marginTop: '20px' }}>
                                <button className="btn-secondary" onClick={() => setShowExitConfirm(false)}>Ở lại</button>
                                <button className="btn-primary" style={{ background: '#e74c3c' }} onClick={() => { setShowExitConfirm(false); onClose(); }}>Hủy bỏ</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReminderForm;
