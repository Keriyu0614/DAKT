import {
    CheckCircle2,
    Eye,
    CheckCheck,
    AlertCircle,
    Clock as ClockIcon,
    Bell,
    Smartphone,
    Mail,
    MessageSquare,
    RefreshCw
} from 'lucide-react';
import {
    type Notification,
    NotificationStatus,
    DeliveryChannel,
    RecipientType,
    SourceEventType
} from '../../api/notification.api';
import './NotificationCard.css';

interface NotificationCardProps {
    notif: Notification;
    onMarkAsRead: (notif: Notification) => void;
    onAcknowledge: (notif: Notification) => void;
    onRetry: (notif: Notification) => void;
    onViewDetails: (notif: Notification) => void;
    actioningId: string | null;
    loadingDetail: boolean;
}

const NotificationCard = ({
    notif,
    onMarkAsRead,
    onAcknowledge,
    onRetry,
    onViewDetails,
    actioningId,
    loadingDetail
}: NotificationCardProps) => {
    const isActioning = actioningId === notif.id;

    const getStatusBadge = (status: NotificationStatus) => {
        switch (status) {
            case NotificationStatus.Delivered:
                return {
                    icon: <CheckCircle2 size={16} />,
                    text: 'Đã gửi',
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
                    text: 'Không rõ',
                    className: 'status-unknown'
                };
        }
    };

    const getChannelIcon = (channel: DeliveryChannel) => {
        switch (channel) {
            case DeliveryChannel.MobilePush: return <Smartphone size={14} />;
            case DeliveryChannel.Email: return <Mail size={14} />;
            case DeliveryChannel.SMS: return <MessageSquare size={14} />;
            case DeliveryChannel.InApp: return <Bell size={14} />;
            default: return <Bell size={14} />;
        }
    };

    const getChannelText = (channel: DeliveryChannel) => {
        switch (channel) {
            case DeliveryChannel.MobilePush: return 'Thông báo đẩy';
            case DeliveryChannel.Email: return 'Email';
            case DeliveryChannel.SMS: return 'SMS';
            case DeliveryChannel.InApp: return 'Trong ứng dụng';
            default: return 'Không rõ';
        }
    };

    const getRecipientText = (type: RecipientType) => {
        return type === RecipientType.ElderlyUser ? 'Người cao tuổi' : 'Người chăm sóc';
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

    const truncateMessage = (message: string, maxLength: number = 150) => {
        if (message.length <= maxLength) return message;
        return message.substring(0, maxLength) + '...';
    };

    const statusBadge = getStatusBadge(notif.status);
    const sourceType = notif.title.includes('Appointment') ? 'Lịch khám' : notif.title.includes('Medication') ? 'Thuốc' : 'Sức khỏe';

    const isHealthNotif = notif.sourceEventType === SourceEventType.Health
        || notif.title.toLowerCase().includes('chỉ số')
        || notif.title.toLowerCase().includes('sức khỏe')
        || notif.title.toLowerCase().includes('tự ghi')
        || notif.title.toLowerCase().includes('cảnh báo chỉ số');

    return (
        <div className={`notification-card ${statusBadge.className}`} onClick={() => onViewDetails(notif)} style={{ cursor: 'pointer' }}>
            <div className={`status-badge ${statusBadge.className}`}>
                {statusBadge.icon}
                <span>{statusBadge.text}</span>
            </div>

            <div className="notification-content">
                <h3 className="notification-title">{notif.title}</h3>
                <p className="notification-message">{truncateMessage(notif.message)}</p>
                <button
                    className="view-details-link"
                    onClick={(e) => { e.stopPropagation(); onViewDetails(notif); }}
                    disabled={loadingDetail}
                >
                    {loadingDetail ? 'Đang tải...' : 'Xem chi tiết →'}
                </button>
            </div>

            <div className="notification-metadata">
                <div className="metadata-item">
                    <ClockIcon size={14} />
                    <span>Gửi lúc: {formatTime(notif.sentAt)}</span>
                </div>
                <div className="metadata-item">
                    {getChannelIcon(notif.deliveryChannel)}
                    <span>Kênh: {getChannelText(notif.deliveryChannel)}</span>
                </div>
                <div className="metadata-item">
                    <Bell size={14} />
                    <span>Người nhận: {getRecipientText(notif.recipientType)}</span>
                </div>
                <div className="metadata-item">
                    <span className="source-link" onClick={(e) => { e.stopPropagation(); onViewDetails(notif); }}>
                        🔗 Nguồn: Nhắc nhở → {sourceType}
                    </span>
                </div>
                {notif.failureReason && (
                    <div className="metadata-item error-reason">
                        <AlertCircle size={14} />
                        <span>Lỗi: {notif.failureReason}</span>
                    </div>
                )}
            </div>

            <div className="notification-actions" onClick={(e) => e.stopPropagation()}>
                {notif.status === NotificationStatus.Delivered && (
                    <button
                        className="btn-action btn-primary"
                        onClick={(e) => { e.stopPropagation(); onMarkAsRead(notif); }}
                        disabled={isActioning}
                    >
                        <Eye size={20} />
                        {isActioning ? 'Đang đánh dấu...' : 'Đánh dấu đã đọc'}
                    </button>
                )}
                {notif.status === NotificationStatus.Read && (
                    <button
                        className="btn-action btn-primary"
                        onClick={(e) => { e.stopPropagation(); onAcknowledge(notif); }}
                        disabled={isActioning}
                    >
                        <CheckCheck size={20} />
                        {isActioning
                            ? 'Đang xác nhận...'
                            : isHealthNotif
                                ? 'Xác nhận & lưu vào hồ sơ'
                                : 'Xác nhận'
                        }
                    </button>
                )}
                {notif.status === NotificationStatus.Failed && (
                    <button
                        className="btn-action btn-warning"
                        onClick={(e) => { e.stopPropagation(); onRetry(notif); }}
                        disabled={isActioning}
                    >
                        <RefreshCw size={20} />
                        {isActioning ? 'Đang thử lại...' : 'Thử lại Gửi'}
                    </button>
                )}
                {notif.status === NotificationStatus.Retrying && (
                    <button className="btn-action" disabled>
                        <ClockIcon size={20} />
                        Đang thử lại...
                    </button>
                )}
            </div>
        </div>
    );
};

export default NotificationCard;
