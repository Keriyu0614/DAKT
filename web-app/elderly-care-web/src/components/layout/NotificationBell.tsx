import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  notificationApi,
  type Notification,
  NotificationStatus,
} from "../../api/notification.api";
import { reminderApi, type Reminder } from "../../api/reminder.api";
import { medicationApi } from "../../api/medication.api";
import { appointmentApi } from "../../api/appointment.api";
import {
  Bell,
  Calendar,
  AlertTriangle,
  Check,
  Activity,
  Clock,
  ExternalLink,
  Eye,
  Info,
} from "lucide-react";
import { toast } from "react-toastify";
import "./NotificationBell.css";

interface EnrichedReminder extends Reminder {
  message?: string;
  sourceEventName?: string;
  sourceEventType?: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"notifications" | "reminders">("notifications");
  
  // Data State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

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
    if (!user?.id) return;
    if (!isSilent) setLoading(true);
    
    try {
      const [notifRes, remRes, medRes, apptRes] = await Promise.all([
        notificationApi.getNotifications(user.id).catch(() => ({ data: [] })),
        reminderApi.getReminders().catch(() => ({ data: [] })),
        medicationApi.getMedications().catch(() => ({ data: [] })),
        appointmentApi.getAll().catch(() => ({ data: [] })),
      ]);

      setNotifications(notifRes.data);
      
      // Sort reminders by time ascending
      const sortedRem = (remRes.data as Reminder[]).sort(
        (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
      );
      setReminders(sortedRem);
      setMedications(medRes.data);
      setAppointments(apptRes.data);
    } catch (error) {
      console.error("Error loading notification bell data:", error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // Poll for updates every 8 seconds
  useEffect(() => {
    if (user?.id) {
      fetchData(true);
      const interval = setInterval(() => fetchData(true), 8000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  // Handle open dropdown
  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchData();
    }
  };

  // Compute active counts
  const unreadNotifCount = useMemo(() => {
    return notifications.filter(
      (n) => n.status !== NotificationStatus.Read && n.status !== NotificationStatus.Acknowledged
    ).length;
  }, [notifications]);

  const activeReminderCount = useMemo(() => {
    // Only count today's pending reminders
    const todayStr = new Date().toDateString();
    return reminders.filter(
      (r) => r.status === 0 && new Date(r.scheduledTime).toDateString() === todayStr
    ).length;
  }, [reminders]);

  const totalCount = unreadNotifCount + activeReminderCount;

  // Enrich reminders
  const enrichedReminders = useMemo((): EnrichedReminder[] => {
    return reminders.map((rem) => {
      let sourceEventName = "Xem chi tiết";
      let sourceEventType = "Nhắc nhở";

      if (rem.type === 1) {
        sourceEventType = "Lịch khám";
        const apt = appointments.find((a) => a.id === rem.referenceId);
        if (apt) sourceEventName = apt.doctorName;
      } else if (rem.type === 0) {
        sourceEventType = "Thuốc";
        const med = medications.find((m) => m.id === rem.referenceId);
        if (med) sourceEventName = med.name;
      }

      return {
        ...rem,
        message: `${sourceEventType}: ${sourceEventName}`,
        sourceEventName,
        sourceEventType,
      };
    });
  }, [reminders, appointments, medications]);

  // Today's pending reminders
  const pendingRemindersToday = useMemo(() => {
    const todayStr = new Date().toDateString();
    return enrichedReminders.filter(
      (r) => r.status === 0 && new Date(r.scheduledTime).toDateString() === todayStr
    );
  }, [enrichedReminders]);

  // Mark single notification as read
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

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    const unread = notifications.filter(
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

  // Mark reminder as done
  const handleMarkReminderDone = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await reminderApi.markAsCompleted(id);
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 1 } : r))
      );
      toast.success("Đã hoàn thành nhắc nhở");
    } catch {
      toast.error("Lỗi khi hoàn thành nhắc nhở");
    }
  };

  // Helper formatting relative time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Get icon for notification
  const getNotificationIcon = (title: string, message: string) => {
    const combined = `${title} ${message}`.toLowerCase();
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
      {/* Bell Trigger Icon */}
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

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="bell-dropdown-panel animate-slide-in">
          {/* Header */}
          <div className="bell-dropdown-header">
            <h3>Trung tâm thông báo</h3>
            {activeTab === "notifications" && unreadNotifCount > 0 && (
              <button onClick={handleMarkAllRead} className="btn-mark-all-read">
                <Check size={14} /> Đọc tất cả
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="bell-dropdown-tabs">
            <button
              onClick={() => setActiveTab("notifications")}
              className={`bell-tab-btn ${activeTab === "notifications" ? "active" : ""}`}
            >
              Thông báo ({unreadNotifCount})
            </button>
            <button
              onClick={() => setActiveTab("reminders")}
              className={`bell-tab-btn ${activeTab === "reminders" ? "active" : ""}`}
            >
              Nhắc nhở hôm nay ({activeReminderCount})
            </button>
          </div>

          {/* List Content */}
          <div className="bell-dropdown-content-list custom-scrollbar">
            {loading ? (
              <div className="bell-dropdown-placeholder">
                <div className="spinner"></div>
                <p>Đang tải dữ liệu...</p>
              </div>
            ) : activeTab === "notifications" ? (
              // --- NOTIFICATIONS LIST ---
              notifications.length === 0 ? (
                <div className="bell-dropdown-placeholder">
                  <Activity size={36} className="placeholder-icon" />
                  <p>Không có thông báo mới nào</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notif) => {
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
              )
            ) : (
              // --- REMINDERS LIST ---
              pendingRemindersToday.length === 0 ? (
                <div className="bell-dropdown-placeholder">
                  <Calendar size={36} className="placeholder-icon" />
                  <p>Không có nhắc nhở chưa hoàn thành hôm nay</p>
                </div>
              ) : (
                pendingRemindersToday.slice(0, 10).map((rem) => (
                  <div
                    key={rem.id}
                    className="bell-list-item reminder-item"
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/app/reminders");
                    }}
                  >
                    {rem.type === 0 ? (
                      <Activity className="notif-item-icon medication" size={18} />
                    ) : (
                      <Calendar className="notif-item-icon appointment" size={18} />
                    )}
                    <div className="item-details">
                      <h4 className="item-title">{rem.sourceEventType}</h4>
                      <p className="item-message">{rem.sourceEventName}</p>
                      <span className="item-time">
                        <Clock size={12} /> {formatTime(rem.scheduledTime)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleMarkReminderDone(rem.id, e)}
                      className="btn-item-action mark-done"
                      title="Hoàn thành"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ))
              )
            )}
          </div>

          {/* Footer */}
          <div className="bell-dropdown-footer">
            {activeTab === "notifications" ? (
              <Link to="/app/notifications" onClick={() => setIsOpen(false)} className="btn-view-all">
                Xem tất cả thông báo <ExternalLink size={14} />
              </Link>
            ) : (
              <Link to="/app/reminders" onClick={() => setIsOpen(false)} className="btn-view-all">
                Quản lý lịch nhắc nhở <ExternalLink size={14} />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
