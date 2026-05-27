import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  notificationApi,
  type Notification,
  NotificationStatus,
} from "../../api/notification.api";
import {
  Bell,
  AlertTriangle,
  Check,
  Activity,
  Clock,
  ExternalLink,
  Info,
} from "lucide-react";
import { toast } from "react-toastify";
import "./NotificationBell.css";

export default function NotificationBell() {
  const { user, managedElderly } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isCaregiver = user?.role === "Caregiver" || user?.role === "1" || String(user?.role) === "1";

  // Caregiver chỉ dùng id người cao tuổi đang quản lý, không fallback về user?.id
  const activeUserId = isCaregiver ? managedElderly?.id : user?.id;

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch data
  const fetchData = async (isSilent = false) => {
    if (!activeUserId) return;
    if (!isSilent) setLoading(true);
    try {
      const notifRes = await notificationApi.getNotifications(activeUserId);
      setNotifications(notifRes.data);
    } catch (error) {
      console.error("[NotificationBell] Error:", error);
      setNotifications([]);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // Poll mỗi 8 giây — reset khi không có activeUserId
  useEffect(() => {
    if (activeUserId) {
      fetchData(true);
      const interval = setInterval(() => fetchData(true), 8000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setIsOpen(false);
    }
  }, [activeUserId]);

  // Tất cả useMemo phải ở đây, TRƯỚC return null
  const unreadNotifCount = useMemo(() => {
    const uniqueNotifs = Array.from(new Map(notifications.map(n => [n.id, n])).values());
    return uniqueNotifs.filter(
      (n) => n.status !== NotificationStatus.Read && n.status !== NotificationStatus.Acknowledged
    ).length;
  }, [notifications]);

  const uniqueNotifications = useMemo(() => {
    return Array.from(new Map(notifications.map(n => [n.id, n])).values());
  }, [notifications]);

  // Ẩn chuông nếu là caregiver chưa chọn người cao tuổi — return null SAU tất cả hooks
  if (isCaregiver && !managedElderly) {
    return null;
  }

  const totalCount = unreadNotifCount;

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) fetchData();
  };

  const handleMarkNotifRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: NotificationStatus.Read } : n))
      );
      toast.success("Đã đánh dấu đã đọc");
    } catch {
      toast.error("Lỗi khi cập nhật trạng thái thông báo");
    }
  };

  const handleMarkAllRead = async () => {
    const uniqueNotifs = Array.from(new Map(notifications.map(n => [n.id, n])).values());
    const unread = uniqueNotifs.filter(
      (n) => n.status !== NotificationStatus.Read && n.status !== NotificationStatus.Acknowledged
    );
    if (unread.length === 0) return;
    try {
      await Promise.all(unread.map((n) => notificationApi.markAsRead(n.id)));
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: NotificationStatus.Read }))
      );
      toast.success("Đã đánh dấu tất cả đã đọc");
    } catch {
      toast.error("Lỗi khi cập nhật thông báo");
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getNotificationIcon = (title: string, message: string) => {
    const combined = `${title} ${message}`.toLowerCase();
    if (combined.includes("khẩn cấp") || combined.includes("cần hỗ trợ")) {
      return <AlertTriangle className="notif-item-icon warning" size={18} style={{ color: "#dc2626" }} />;
    }
    if (combined.includes("cảnh báo") || combined.includes("bất thường") || combined.includes("nguy hiểm")) {
      return <AlertTriangle className="notif-item-icon warning" size={18} />;
    }
    if (combined.includes("tự ghi") || combined.includes("chỉ số")) {
      return <Activity className="notif-item-icon info" size={18} />;
    }
    return <Info className="notif-item-icon default" size={18} />;
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className={`bell-trigger-button ${isOpen ? "active" : ""}`}
        aria-label="Thông báo"
      >
        <Bell size={22} className={totalCount > 0 ? "wiggle-animation" : ""} />
        {totalCount > 0 && (
          <span className="bell-badge-count">
            {totalCount > 99 ? "99+" : totalCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="bell-dropdown-panel animate-slide-in">
          <div className="bell-dropdown-header">
            <h3>Trung tâm thông báo</h3>
            {unreadNotifCount > 0 && (
              <button onClick={handleMarkAllRead} className="btn-mark-all-read">
                <Check size={14} /> Đọc tất cả
              </button>
            )}
          </div>

          <div className="bell-dropdown-content-list custom-scrollbar">
            {loading ? (
              <div className="bell-dropdown-placeholder">
                <div className="spinner"></div>
                <p>Đang tải dữ liệu...</p>
              </div>
            ) : uniqueNotifications.length === 0 ? (
              <div className="bell-dropdown-placeholder">
                <Activity size={36} className="placeholder-icon" />
                <p>Không có thông báo mới nào</p>
              </div>
            ) : (
              uniqueNotifications.slice(0, 10).map((notif) => {
                const isUnread =
                  notif.status !== NotificationStatus.Read &&
                  notif.status !== NotificationStatus.Acknowledged;
                return (
                  <div
                    key={notif.id}
                    className={`bell-list-item notif-item ${isUnread ? "unread" : ""}`}
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/app/notifications");
                    }}
                  >
                    {getNotificationIcon(notif.title, notif.message)}
                    <div className="item-details">
                      <h4 className="item-title">{notif.title}</h4>
                      <p className="item-message">{notif.message}</p>
                      <span className="item-time">
                        <Clock size={12} /> {formatTime(notif.sentAt)}
                      </span>
                    </div>
                    {isUnread && (
                      <button
                        onClick={(e) => handleMarkNotifRead(notif.id, e)}
                        className="btn-item-action mark-read"
                        title="Đánh dấu đã đọc"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="bell-dropdown-footer">
            <Link to="/app/notifications" onClick={() => setIsOpen(false)} className="btn-view-all">
              Xem tất cả thông báo <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}