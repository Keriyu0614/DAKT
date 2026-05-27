import { X } from 'lucide-react';
import type { Appointment } from './AppointmentCard';
import './AppointmentDetailModal.css';

interface AppointmentDetailModalProps {
    appointment: Appointment | null;
    onClose: () => void;
}

const AppointmentDetailModal = ({ appointment, onClose }: AppointmentDetailModalProps) => {
    if (!appointment) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Chi Tiết Lịch Khám</h2>
                    <button className="btn-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                <div className="detail-modal-grid">
                    {appointment.appointmentType && (
                        <div className="detail-block">
                            <span className="detail-label">Loại Khám</span>
                            <span className="detail-text">{appointment.appointmentType}</span>
                        </div>
                    )}
                    <div className="detail-block">
                        <span className="detail-label">Bác Sĩ / Phòng Khám</span>
                        <span className="detail-text">{appointment.doctorName}</span>
                    </div>
                    {appointment.specialty && (
                        <div className="detail-block">
                            <span className="detail-label">Chuyên Khoa</span>
                            <span className="detail-text">{appointment.specialty}</span>
                        </div>
                    )}
                    <div className="detail-block">
                        <span className="detail-label">Ngày & Giờ</span>
                        <span className="detail-text">
                            {new Date(appointment.appointmentDate).toLocaleString('vi-VN')}
                        </span>
                    </div>
                    {appointment.duration && (
                        <div className="detail-block">
                            <span className="detail-label">Thời Lượng</span>
                            <span className="detail-text">{appointment.duration} phút</span>
                        </div>
                    )}
                    <div className="detail-block">
                        <span className="detail-label">Địa Điểm</span>
                        <span className="detail-text">
                            {appointment.isTelehealth ? '🎥 Khám từ xa' : appointment.location}
                        </span>
                    </div>
                    {appointment.transportationNotes && (
                        <div className="detail-block">
                            <span className="detail-label">Ghi Chú Di Chuyển</span>
                            <span className="detail-text">{appointment.transportationNotes}</span>
                        </div>
                    )}
                    {appointment.preparationInstructions && (
                        <div className="detail-block">
                            <span className="detail-label">Hướng Dẫn Chuẩn Bị</span>
                            <span className="detail-text">{appointment.preparationInstructions}</span>
                        </div>
                    )}
                    {appointment.notes && (
                        <div className="detail-block">
                            <span className="detail-label">Ghi Chú Thêm</span>
                            <span className="detail-text">{appointment.notes}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppointmentDetailModal;
