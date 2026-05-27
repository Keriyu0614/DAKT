import React, { useState, useEffect } from 'react';
import {
    X,
    Stethoscope,
    Calendar,
    AlertCircle,
    MapPin,
    Home,
    Video,
    FileText
} from 'lucide-react';
import { toast } from 'react-toastify';
import { appointmentApi, type CreateAppointmentPayload } from '../../api/appointment.api';
import type { Appointment } from './AppointmentCard';
import './AppointmentForm.css';

interface AppointmentFormProps {
    isOpen: boolean;
    onClose: () => void;
    editingAppointment: Appointment | null;
    onSuccess: () => void;
    userId?: string;
}

interface FormData {
    appointmentType: string;
    doctorName: string;
    specialty: string;
    appointmentDate: string;
    appointmentTime: string;
    duration: string;
    location: string;
    isTelehealth: boolean;
    transportationNotes: string;
    preparationInstructions: string;
    notes: string;
}

interface FormErrors {
    [key: string]: string;
}

const AppointmentForm = ({
    isOpen,
    onClose,
    editingAppointment,
    onSuccess,
    userId
}: AppointmentFormProps) => {
    const [formData, setFormData] = useState<FormData>({
        appointmentType: '',
        doctorName: '',
        specialty: '',
        appointmentDate: '',
        appointmentTime: '',
        duration: '',
        location: '',
        isTelehealth: false,
        transportationNotes: '',
        preparationInstructions: '',
        notes: ''
    });
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [isDirty, setIsDirty] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    useEffect(() => {
        if (editingAppointment) {
            const aptDate = new Date(editingAppointment.appointmentDate);
            setFormData({
                appointmentType: editingAppointment.appointmentType || '',
                doctorName: editingAppointment.doctorName,
                specialty: editingAppointment.specialty || '',
                appointmentDate: aptDate.toISOString().split('T')[0],
                appointmentTime: aptDate.toTimeString().slice(0, 5),
                duration: editingAppointment.duration?.toString() || '',
                location: editingAppointment.location,
                isTelehealth: editingAppointment.isTelehealth || false,
                transportationNotes: editingAppointment.transportationNotes || '',
                preparationInstructions: editingAppointment.preparationInstructions || '',
                notes: editingAppointment.notes || ''
            });
            setIsDirty(false);
        } else {
            resetForm();
        }
    }, [editingAppointment, isOpen]);

    const resetForm = () => {
        setFormData({
            appointmentType: '',
            doctorName: '',
            specialty: '',
            appointmentDate: '',
            appointmentTime: '',
            duration: '',
            location: '',
            isTelehealth: false,
            transportationNotes: '',
            preparationInstructions: '',
            notes: ''
        });
        setFormErrors({});
        setIsDirty(false);
    };

    const handleFormChange = (field: keyof FormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateField = (field: keyof FormData, value: string | boolean): string => {
        switch (field) {
            case 'appointmentType':
                return !value ? 'Vui lòng chọn loại lịch khám' : '';
            case 'doctorName':
                return !value ? 'Vui lòng nhập tên bác sĩ hoặc cơ sở y tế' :
                    (value as string).length < 2 ? 'Tên phải có ít nhất 2 ký tự' : '';
            case 'appointmentDate':
                return !value ? 'Vui lòng chọn ngày khám' : '';
            case 'appointmentTime':
                return !value ? 'Vui lòng chọn giờ khám hợp lệ' : '';
            case 'duration':
                return value && Number(value) <= 0 ? 'Thời lượng phải lớn hơn 0' : '';
            default:
                return '';
        }
    };

    const handleBlur = (field: keyof FormData) => {
        const error = validateField(field, formData[field]);
        setFormErrors(prev => ({ ...prev, [field]: error }));
    };

    const validateForm = (): boolean => {
        const errors: FormErrors = {};
        errors.appointmentType = validateField('appointmentType', formData.appointmentType);
        errors.doctorName = validateField('doctorName', formData.doctorName);
        errors.appointmentDate = validateField('appointmentDate', formData.appointmentDate);
        errors.appointmentTime = validateField('appointmentTime', formData.appointmentTime);
        errors.duration = validateField('duration', formData.duration);

        const filteredErrors = Object.fromEntries(
            Object.entries(errors).filter(([_, v]) => v !== '')
        );

        setFormErrors(filteredErrors);
        return Object.keys(filteredErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Validate userId
        if (!userId) {
            toast.error('Không thể tạo lịch khám: Thiếu thông tin người dùng. Vui lòng đăng nhập lại.');
            return;
        }

        setIsSubmitting(true);
        try {
            const dateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`);
            const payload: CreateAppointmentPayload = {
                userId: userId,
                doctorName: formData.doctorName,
                location: formData.location,
                appointmentDate: dateTime.toISOString(),
                notes: formData.notes,
                appointmentType: formData.appointmentType,
                specialty: formData.specialty,
                duration: formData.duration ? Number(formData.duration) : undefined,
                isTelehealth: formData.isTelehealth,
                transportationNotes: formData.transportationNotes,
                preparationInstructions: formData.preparationInstructions
            };

            if (editingAppointment) {
                await appointmentApi.update(editingAppointment.id, payload);
                toast.success('Đã cập nhật lịch khám thành công');
            } else {
                await appointmentApi.create(payload);
                toast.success('Đã tạo lịch khám thành công');
            }

            onSuccess();
            onClose();
            resetForm();
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || 'Lỗi khi lưu lịch khám. Vui lòng thử lại.';
            toast.error(errorMessage);
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelForm = () => {
        if (isDirty) {
            setShowExitConfirm(true);
        } else {
            onClose();
            resetForm();
        }
    };

    const handleConfirmExit = () => {
        setShowExitConfirm(false);
        onClose();
        resetForm();
    };

    const isPastDateTime = () => {
        if (!formData.appointmentDate || !formData.appointmentTime) return false;
        const selectedDateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`);
        return selectedDateTime < new Date();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content form-modal" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="modal-header">
                        <div>
                            <h2>{editingAppointment ? 'Cập nhật Lịch khám' : 'Thêm Lịch khám mới'}</h2>
                            <p className="form-subtitle">Lên lịch hẹn y tế</p>
                        </div>
                        <button type="button" className="btn-close" onClick={handleCancelForm}>
                            <X size={24} />
                        </button>
                    </div>

                    <div className="form-body">
                        {/* Section 1: Appointment Identity */}
                        <section className="form-section">
                            <h3 className="form-section-title">
                                <Stethoscope size={20} /> Thông tin Lịch khám
                            </h3>

                            <div className="form-field">
                                <label htmlFor="appointmentType">Loại lịch khám (Bắt buộc)</label>
                                <select
                                    id="appointmentType"
                                    value={formData.appointmentType}
                                    onChange={(e) => handleFormChange('appointmentType', e.target.value)}
                                    onBlur={() => handleBlur('appointmentType')}
                                    className={formErrors.appointmentType ? 'error' : ''}
                                >
                                    <option value="">Chọn loại...</option>
                                    <option value="Checkup">Kiểm tra sức khỏe</option>
                                    <option value="Test">Xét nghiệm</option>
                                    <option value="Surgery">Phẫu thuật</option>
                                    <option value="Consultation">Tư vấn</option>
                                    <option value="Follow-up">Tái khám</option>
                                    <option value="Emergency">Cấp cứu</option>
                                </select>
                                {formErrors.appointmentType && (
                                    <span className="error-text">{formErrors.appointmentType}</span>
                                )}
                                <span className="helper-text">Ví dụ: Kiểm tra sức khỏe, Xét nghiệm, Tái khám</span>
                            </div>

                            <div className="form-field">
                                <label htmlFor="doctorName">Tên Bác sĩ / Cơ sở y tế (Bắt buộc)</label>
                                <input
                                    type="text"
                                    id="doctorName"
                                    value={formData.doctorName}
                                    onChange={(e) => handleFormChange('doctorName', e.target.value)}
                                    onBlur={() => handleBlur('doctorName')}
                                    className={formErrors.doctorName ? 'error' : ''}
                                    maxLength={100}
                                />
                                {formErrors.doctorName && (
                                    <span className="error-text">{formErrors.doctorName}</span>
                                )}
                            </div>

                            <div className="form-field">
                                <label htmlFor="specialty">Chuyên khoa (Không bắt buộc)</label>
                                <input
                                    type="text"
                                    id="specialty"
                                    value={formData.specialty}
                                    onChange={(e) => handleFormChange('specialty', e.target.value)}
                                    maxLength={50}
                                />
                                <span className="helper-text">Ví dụ: Tim mạch, Chấn thương chỉnh hình</span>
                            </div>
                        </section>

                        {/* Section 2: Date & Time */}
                        <section className="form-section">
                            <h3 className="form-section-title">
                                <Calendar size={20} /> Ngày & Giờ
                            </h3>

                            <div className="form-row">
                                <div className="form-field">
                                    <label htmlFor="appointmentDate">Ngày khám (Bắt buộc)</label>
                                    <input
                                        type="date"
                                        id="appointmentDate"
                                        value={formData.appointmentDate}
                                        onChange={(e) => handleFormChange('appointmentDate', e.target.value)}
                                        onBlur={() => handleBlur('appointmentDate')}
                                        className={formErrors.appointmentDate ? 'error' : ''}
                                    />
                                    {formErrors.appointmentDate && (
                                        <span className="error-text">{formErrors.appointmentDate}</span>
                                    )}
                                </div>

                                <div className="form-field">
                                    <label htmlFor="appointmentTime">Giờ khám (Bắt buộc)</label>
                                    <input
                                        type="time"
                                        id="appointmentTime"
                                        value={formData.appointmentTime}
                                        onChange={(e) => handleFormChange('appointmentTime', e.target.value)}
                                        onBlur={() => handleBlur('appointmentTime')}
                                        className={formErrors.appointmentTime ? 'error' : ''}
                                    />
                                    {formErrors.appointmentTime && (
                                        <span className="error-text">{formErrors.appointmentTime}</span>
                                    )}
                                </div>
                            </div>

                            {isPastDateTime() && (
                                <div className="warning-box">
                                    <AlertCircle size={20} />
                                    <span>Lịch khám này được lên lịch trong quá khứ. Vui lòng xác nhận điều này là chính xác.</span>
                                </div>
                            )}

                            <div className="form-field">
                                <label htmlFor="duration">Thời lượng (Không bắt buộc)</label>
                                <div className="input-with-unit">
                                    <input
                                        type="number"
                                        id="duration"
                                        value={formData.duration}
                                        onChange={(e) => handleFormChange('duration', e.target.value)}
                                        onBlur={() => handleBlur('duration')}
                                        className={formErrors.duration ? 'error' : ''}
                                        min="1"
                                    />
                                    <span className="unit">phút</span>
                                </div>
                                {formErrors.duration && (
                                    <span className="error-text">{formErrors.duration}</span>
                                )}
                                <span className="helper-text">Thời gian khám dự kiến</span>
                            </div>
                        </section>

                        {/* Section 3: Location & Access */}
                        <section className="form-section">
                            <h3 className="form-section-title">
                                <MapPin size={20} /> Địa điểm & Hình thức
                            </h3>

                            <div className="form-field">
                                <label htmlFor="location">Địa chỉ khám</label>
                                <input
                                    type="text"
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => handleFormChange('location', e.target.value)}
                                    maxLength={200}
                                    placeholder="123 Main St, City, State ZIP"
                                />
                            </div>

                            <div className="form-field">
                                <label>Hình thức khám</label>
                                <div className="radio-group">
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            name="appointmentFormat"
                                            checked={!formData.isTelehealth}
                                            onChange={() => handleFormChange('isTelehealth', false)}
                                        />
                                        <Home size={20} />
                                        <span>Khám trực tiếp</span>
                                    </label>
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            name="appointmentFormat"
                                            checked={formData.isTelehealth}
                                            onChange={() => handleFormChange('isTelehealth', true)}
                                        />
                                        <Video size={20} />
                                        <span>Khám từ xa</span>
                                    </label>
                                </div>
                            </div>

                            <div className="form-field">
                                <label htmlFor="transportationNotes">Ghi chú phương tiện di chuyển (Không bắt buộc)</label>
                                <textarea
                                    id="transportationNotes"
                                    value={formData.transportationNotes}
                                    onChange={(e) => handleFormChange('transportationNotes', e.target.value)}
                                    maxLength={300}
                                    rows={3}
                                />
                                <span className="helper-text">Ví dụ: "Đã đặt taxi", "Người nhà chở đi"</span>
                            </div>
                        </section>

                        {/* Section 4: Preparation & Notes */}
                        <section className="form-section">
                            <h3 className="form-section-title">
                                <FileText size={20} /> Chuẩn bị & Ghi chú
                            </h3>

                            <div className="form-field">
                                <label htmlFor="preparationInstructions">Hướng dẫn chuẩn bị</label>
                                <textarea
                                    id="preparationInstructions"
                                    value={formData.preparationInstructions}
                                    onChange={(e) => handleFormChange('preparationInstructions', e.target.value)}
                                    maxLength={500}
                                    rows={4}
                                />
                                <span className="helper-text">Ví dụ: "Cần nhịn ăn", "Mang theo hồ sơ cũ"</span>
                            </div>

                            <div className="form-field">
                                <label htmlFor="notes">Ghi chú bổ sung</label>
                                <textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => handleFormChange('notes', e.target.value)}
                                    maxLength={1000}
                                    rows={5}
                                />
                                <span className="helper-text">Thông tin quan trọng khác</span>
                            </div>
                        </section>

                        {/* Section 5: Identity Block (Edit Mode Only) */}
                        {editingAppointment && (
                            <section className="form-section identity-block">
                                <h3 className="form-section-title">
                                    🔒 Hồ sơ lịch khám
                                </h3>
                                <div className="identity-info">
                                    <p><strong>ID Lịch khám:</strong> {editingAppointment.id}</p>
                                    <p><strong>Ngày tạo:</strong> {new Date(editingAppointment.appointmentDate).toLocaleString()}</p>
                                </div>
                            </section>
                        )}
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Đang lưu...' : (editingAppointment ? 'Cập nhật Lịch khám' : 'Lưu Lịch khám')}
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleCancelForm}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </button>
                    </div>
                </form>

                {showExitConfirm && (
                    <div className="modal-overlay">
                        <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>⚠️ Thay Đổi Chưa Lưu</h2>
                            </div>
                            <div className="modal-body">
                                <p>Bạn có thay đổi lịch khám chưa được lưu. Bạn có chắc chắn muốn rời đi?</p>
                            </div>
                            <div className="form-actions">
                                <button className="btn-primary" onClick={() => setShowExitConfirm(false)}>
                                    Ở lại Trang
                                </button>
                                <button className="btn-secondary" onClick={handleConfirmExit}>
                                    Rời đi Không Lưu
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppointmentForm;
