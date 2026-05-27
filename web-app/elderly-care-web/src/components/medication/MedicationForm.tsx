import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { medicationService } from '../../services/medication.service';
import type { Medication } from '../../api/medication.api';
import './MedicationForm.css';

interface MedicationFormData {
    name: string;
    form: Medication['form'];
    dosageAmount: number;
    dosageUnit: Medication['dosage']['unit'];
    frequencyType: Medication['frequency']['type'];
    timesPerDay: number;
    specificTimes: string[];
    intervalDays: number;
    daysOfWeek: number[];
    startDate: string;
    endDate: string;
    instructions: string;
}

const INITIAL_FORM: MedicationFormData = {
    name: '',
    form: 'Tablet',
    dosageAmount: 0,
    dosageUnit: 'mg',
    frequencyType: 'Daily',
    timesPerDay: 1,
    specificTimes: ['08:00'],
    intervalDays: 1,
    daysOfWeek: [],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    instructions: ''
};

interface MedicationFormProps {
    isOpen: boolean;
    onClose: () => void;
    editingId: string | null;
    medications: Medication[];
    onSuccess: () => void;
    userId?: string;
}

const MedicationForm = ({
    isOpen,
    onClose,
    editingId,
    medications,
    onSuccess,
    userId
}: MedicationFormProps) => {
    const { user, managedElderly } = useAuth();
    const [formData, setFormData] = useState<MedicationFormData>(INITIAL_FORM);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (editingId) {
            const med = medications.find(m => m.id === editingId);
            if (med) {
                setFormData({
                    name: med.name,
                    form: med.form,
                    dosageAmount: med.dosage.amount,
                    dosageUnit: med.dosage.unit,
                    frequencyType: med.frequency.type,
                    timesPerDay: med.frequency.timesPerDay || 1,
                    specificTimes: med.frequency.specificTimes || ['08:00'],
                    intervalDays: med.frequency.intervalDays || 1,
                    daysOfWeek: med.frequency.daysOfWeek || [],
                    startDate: new Date(med.startDate).toISOString().split('T')[0],
                    endDate: med.endDate ? new Date(med.endDate).toISOString().split('T')[0] : '',
                    instructions: med.instructions || ''
                });
            }
        } else {
            setFormData(INITIAL_FORM);
        }
        setFormErrors({});
    }, [editingId, medications, isOpen]);

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) errors.name = 'Tên thuốc là bắt buộc';
        if (formData.dosageAmount <= 0) errors.dosage = 'Liều lượng phải lớn hơn 0';
        if (!formData.startDate) errors.startDate = 'Ngày bắt đầu là bắt buộc';

        if (formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
            errors.endDate = 'Ngày kết thúc không thể trước ngày bắt đầu';
        }

        if (!userId && !user?.id) {
            errors.userId = 'Không xác định được người dùng để lưu thuốc';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        if (editingId) {
            const existing = medications.find(m => m.id === editingId);
            if (existing && existing.linkedRemindersCount && existing.linkedRemindersCount > 0) {
                const confirmed = window.confirm(
                    `⚠️ Cảnh báo: Loại thuốc này có ${existing.linkedRemindersCount} nhắc nhở đang hoạt động.\n\nViệc thay đổi lịch trình sẽ cập nhật tất cả các nhắc nhở trong tương lai. Tiếp tục?`
                );
                if (!confirmed) return;
            }
        }

        const actualUserId = userId || managedElderly?.id || user?.id;
        console.log('[MedicationForm] Saving medication with userId:', actualUserId);
        console.log('[MedicationForm] userId prop:', userId);
        console.log('[MedicationForm] managedElderly?.id:', managedElderly?.id);
        console.log('[MedicationForm] user?.id:', user?.id);
        
        if (!actualUserId) {
            toast.error('Không xác định được tài khoản người dùng. Vui lòng đăng nhập lại.');
            return;
        }

        try {
            const payload: Partial<Medication> = {
                userId: actualUserId,
                name: formData.name,
                form: formData.form,
                dosage: {
                    amount: formData.dosageAmount,
                    unit: formData.dosageUnit
                },
                frequency: {
                    type: formData.frequencyType,
                    timesPerDay: formData.timesPerDay,
                    specificTimes: formData.specificTimes,
                    intervalDays: formData.intervalDays,
                    daysOfWeek: formData.daysOfWeek
                },
                startDate: new Date(formData.startDate).toISOString(),
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
                instructions: formData.instructions
            };

            console.log('[MedicationForm] Payload:', payload);

            if (editingId) {
                await medicationService.updateMedication(editingId, payload);
                toast.success('Đã cập nhật thuốc thành công');
            } else {
                await medicationService.addMedication(payload as any);
                toast.success('Đã thêm thuốc thành công');
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi lưu thông tin thuốc');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{editingId ? 'Cập nhật Thuốc' : 'Thêm Thuốc Mới'}</h2>
                    <button className="btn-close" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="modal-body form-body">
                    {/* Section 1: Identity */}
                    <div className="form-section">
                        <h3>1. Chi tiết Thuốc</h3>
                        <div className="form-group">
                            <label>Tên Thuốc</label>
                            <input
                                className="form-input"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ví dụ: Lisinopril"
                            />
                            {formErrors.name && <div className="form-error">{formErrors.name}</div>}
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Dạng bào chế</label>
                                <select
                                    className="form-select"
                                    value={formData.form}
                                    onChange={e => setFormData({ ...formData, form: e.target.value as any })}
                                >
                                    <option value="Tablet">Viên nén</option>
                                    <option value="Capsule">Viên nang</option>
                                    <option value="Liquid">Chất lỏng</option>
                                    <option value="Injection">Tiêm</option>
                                    <option value="Other">Khác</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Dosage */}
                    <div className="form-section">
                        <h3>2. Liều lượng</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Số lượng</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.dosageAmount}
                                    onChange={e => setFormData({ ...formData, dosageAmount: Number(e.target.value) })}
                                />
                                {formErrors.dosage && <div className="form-error">{formErrors.dosage}</div>}
                            </div>
                            <div className="form-group">
                                <label>Đơn vị</label>
                                <select
                                    className="form-select"
                                    value={formData.dosageUnit}
                                    onChange={e => setFormData({ ...formData, dosageUnit: e.target.value as any })}
                                >
                                    <option value="mg">mg</option>
                                    <option value="ml">ml</option>
                                    <option value="tablet">viên</option>
                                    <option value="pills">viên thuốc</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-hint">Liều lượng điển hình: 250-500mg đối với hầu hết các loại thuốc kháng sinh</div>
                    </div>

                    {/* Section 3: Schedule */}
                    <div className="form-section">
                        <h3>3. Lịch trình</h3>
                        <div className="form-group">
                            <label>Tần suất</label>
                            <select
                                className="form-select"
                                value={formData.frequencyType}
                                onChange={e => {
                                    setFormData({
                                        ...formData,
                                        frequencyType: e.target.value as any,
                                        specificTimes: e.target.value === 'Daily' ? ['08:00'] : []
                                    });
                                }}
                            >
                                <option value="Daily">Hàng ngày</option>
                                <option value="Weekly">Hàng tuần</option>
                                <option value="Interval">Mỗi X ngày</option>
                                <option value="AsNeeded">Khi cần thiết (PRN)</option>
                            </select>
                        </div>

                        {formData.frequencyType === 'Daily' && (
                            <div className="form-group">
                                <label>Số lần mỗi ngày</label>
                                <select
                                    className="form-select"
                                    value={formData.timesPerDay}
                                    onChange={e => {
                                        const count = Number(e.target.value);
                                        const newTimes = [...formData.specificTimes];
                                        while (newTimes.length < count) newTimes.push('12:00');
                                        while (newTimes.length > count) newTimes.pop();

                                        setFormData({ ...formData, timesPerDay: count, specificTimes: newTimes });
                                    }}
                                >
                                    {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} lần</option>)}
                                </select>
                            </div>
                        )}

                        {formData.frequencyType === 'Daily' && (
                            <div className="form-group">
                                <label>Giờ dùng thuốc</label>
                                <div className="form-row">
                                    {formData.specificTimes.map((time, idx) => (
                                        <input
                                            key={idx}
                                            type="time"
                                            className="form-input"
                                            value={time}
                                            onChange={e => {
                                                const newTimes = [...formData.specificTimes];
                                                newTimes[idx] = e.target.value;
                                                setFormData({ ...formData, specificTimes: newTimes });
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 4: Duration */}
                    <div className="form-section">
                        <h3>4. Thời hạn</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Ngày bắt đầu</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.startDate}
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                />
                                {formErrors.startDate && <div className="form-error">{formErrors.startDate}</div>}
                            </div>
                            <div className="form-group">
                                <label>Ngày kết thúc (Không bắt buộc)</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.endDate}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                />
                                {formErrors.endDate && <div className="form-error">{formErrors.endDate}</div>}
                            </div>
                        </div>
                    </div>

                    {/* Section 5: Instructions */}
                    <div className="form-section" style={{ borderBottom: 'none' }}>
                        <h3>5. Hướng dẫn</h3>
                        <div className="form-group">
                            <label>Hướng dẫn đặc biệt</label>
                            <textarea
                                className="form-input"
                                rows={3}
                                value={formData.instructions}
                                onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                                placeholder="Ví dụ: Uống cùng thức ăn, không vận hành máy móc hạng nặng..."
                            />
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Hủy</button>
                    <button className="btn-save" onClick={handleSave}>
                        {editingId ? 'Lưu Thay Đổi' : 'Tạo Thuốc'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MedicationForm;
