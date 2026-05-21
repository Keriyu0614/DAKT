import {
    X,
    CheckCircle2,
    Eye,
    CheckCheck,
    AlertCircle,
    Clock as ClockIcon,
    Bell
} from 'lucide-react';
import {
    type NotificationDetail,
    NotificationStatus,
    DeliveryChannel,
    RecipientType,
    SourceEventType
} from '../../api/notification.api';
import './NotificationDetailModal.css';

interface NotificationDetailModalProps {
    detail: NotificationDetail | null;
    onClose: () => void;
}

const NotificationDetailModal = ({ detail, onClose }: NotificationDetailModalProps) => {
    if (!detail) return null;

    const getStatusBadge = (status: NotificationStatus) => {
        switch (status) {
            case NotificationStatus.Delivered:
                return {
                    icon: <CheckCircle2 size={16} />,
                    text: 'Đã giao',
                    className: 'status-delivered'
                };
            case NotificationStatus.Read:
                return {
                    icon: <Eye size={16} />,
                    text: 'Đã đọc',
                    className: 'status-read'
                };
            case NotificationStatus.Acknowledged:
                return {
                    icon: <CheckCheck size={16} />,
                    text: 'Đã xác nhận',
                    className: 'status-acknowledged'
                };
            case NotificationStatus.Failed:
                return {
                    icon: <AlertCircle size={16} />,
                    text: 'Thất bại',
                    className: 'status-failed'
                };
            case NotificationStatus.Retrying:
                return {
                    icon: <ClockIcon size={16} />,
                    text: 'Đang thử lại',
                    className: 'status-retrying'
                };
            default:
                return {
                    icon: <Bell size={16} />,
                    text: 'Không xác định',
                    className: 'status-unknown'
                };
        }
    };

    const getChannelText = (channel: DeliveryChannel) => {
        switch (channel) {
            case DeliveryChannel.MobilePush: return 'Thông báo di động';
            case DeliveryChannel.Email: return 'Email';
            case DeliveryChannel.SMS: return 'SMS';
            case DeliveryChannel.InApp: return 'Trong ứng dụng';
            default: return 'Không xác định';
        }
    };

    const getRecipientText = (type: RecipientType) => {
        return type === RecipientType.ElderlyUser ? 'Người cao tuổi' : 'Người chăm sóc';
    };

    const getSourceEventText = (type: SourceEventType) => {
        switch (type) {
            case SourceEventType.Medication: return 'Thuốc';
            case SourceEventType.Appointment: return 'Lịch khám';
            case SourceEventType.Health: return 'Sức khỏe';
            default: return 'Không xác định';
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const statusBadge = getStatusBadge(detail.status);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Chi tiết Thông báo</h2>
                    <button className="btn-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Status Badge */}
                    <div className={`status-badge ${statusBadge.className}`}>
                        {statusBadge.icon}
                        <span>{statusBadge.text}</span>
                    </div>

                    <h3 className="detail-title">{detail.title}</h3>

                    {/* Full Message */}
                    <section className="detail-section">
                        <h4>Tin nhắn đầy đủ</h4>
                        <p>{detail.message}</p>
                    </section>

                    {/* Delivery Information */}
                    <section className="detail-section">
                        <h4>Thông tin Giao hàng</h4>
                        <div className="detail-info-grid">
                            <div className="info-item">
                                <span className="info-label">Đã gửi lúc:</span>
                                <span>{formatTime(detail.sentAt)}</span>
                            </div>
                            {detail.deliveredAt && (
                                <div className="info-item">
                                    <span className="info-label">Đã giao lúc:</span>
                                    <span>{formatTime(detail.deliveredAt)}</span>
                                </div>
                            )}
                            {detail.readAt && (
                                <div className="info-item">
                                    <span className="info-label">Đã đọc lúc:</span>
                                    <span>{formatTime(detail.readAt)}</span>
                                </div>
                            )}
                            {detail.acknowledgedAt && (
                                <div className="info-item">
                                    <span className="info-label">Đã xác nhận lúc:</span>
                                    <span>{formatTime(detail.acknowledgedAt)}</span>
                                </div>
                            )}
                            <div className="info-item">
                                <span className="info-label">Kênh:</span>
                                <span>{getChannelText(detail.deliveryChannel)}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Người nhận:</span>
                                <span>{getRecipientText(detail.recipientType)}</span>
                            </div>
                        </div>
                    </section>

                    {/* Source Event */}
                    <section className="detail-section">
                        <h4>Sự kiện Nguồn</h4>
                        <div className="detail-info-grid">
                            <div className="info-item">
                                <span className="info-label">ID Nhắc nhở:</span>
                                <span>{detail.sourceReminderId}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Loại Sự kiện:</span>
                                <span>{getSourceEventText(detail.sourceEventType)}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">ID Sự kiện:</span>
                                <span>{detail.sourceEventId}</span>
                            </div>
                            {detail.sourceEvent && (
                                <div className="info-item">
                                    <span className="info-label">Tên Sự kiện:</span>
                                    <span>{detail.sourceEvent.name}</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Delivery Attempts */}
                    {detail.deliveryAttempts && detail.deliveryAttempts.length > 0 && (
                        <section className="detail-section">
                            <h4>Nỗ lực Giao hàng</h4>
                            <div className="delivery-attempts">
                                {detail.deliveryAttempts.map((attempt, idx) => (
                                    <div key={idx} className={`attempt-item ${attempt.status.toLowerCase()}`}>
                                        <span className="attempt-number">{attempt.attemptNumber}.</span>
                                        <span className="attempt-time">{formatTime(attempt.attemptedAt)}</span>
                                        <span className="attempt-status">{attempt.status}</span>
                                        <span className="attempt-channel">({getChannelText(attempt.channel)})</span>
                                        {attempt.errorReason && (
                                            <span className="attempt-error">- {attempt.errorReason}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationDetailModal;
