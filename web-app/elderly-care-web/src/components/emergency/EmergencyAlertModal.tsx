import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { socketService } from "../../services/socket.service";
import { MapPin, X, AlertTriangle, CheckCircle } from "lucide-react";
import "./EmergencyAlertModal.css";

interface EmergencyAlertData {
  eventId: string;
  elderlyName: string;
  elderlyUserId: string;
  caregiverIds: string[];
  latitude?: number;
  longitude?: number;
  message: string;
  triggeredAt: string;
}

/**
 * EmergencyAlertModal — hiển thị popup khẩn cấp toàn màn hình khi người cao tuổi
 * nhấn nút "GỌI HỖ TRỢ" trên mobile.
 *
 * - Đặt ở root App.tsx — luôn active bất kể đang ở trang nào
 * - Chỉ hiển thị cho Caregiver đang đăng nhập
 * - Nhận event `emergency_alert` qua Socket.IO (SocketServer consume từ RabbitMQ)
 * - Broadcast cho TẤT CẢ caregiver đang online — không lọc theo caregiverId
 *   vì SocketServer đã tạo notification đúng người, socket chỉ để alert real-time
 */
export default function EmergencyAlertModal() {
  const { user } = useAuth();
  const [alert, setAlert] = useState<EmergencyAlertData | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const audioIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isCaregiver =
    user?.role === "Caregiver" ||
    user?.role === "1" ||
    String(user?.role) === "1";

  // ── Âm thanh cảnh báo (Web Audio API — không cần file) ───────────────────
  const playBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Tạo 3 beep liên tiếp
      [[880, 0], [660, 0.18], [880, 0.36]].forEach(([freq, offset]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.5, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.15);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.15);
      });
    } catch {
      // AudioContext không khả dụng
    }
  }, []);

  const startAlertSound = useCallback(() => {
    playBeep();
    audioIntervalRef.current = setInterval(playBeep, 2500);
  }, [playBeep]);

  const stopAlertSound = useCallback(() => {
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
  }, []);

  // ── Socket listener — luôn kết nối khi là Caregiver ──────────────────────
  useEffect(() => {
    if (!isCaregiver) return;

    // Đảm bảo socket đã connect
    socketService.connect();

    const handleEmergencyAlert = (data: EmergencyAlertData) => {
      console.log("[🚨 EmergencyAlert] Received emergency_alert event:", data);
      // Hiển thị cho TẤT CẢ caregiver đang online — không lọc theo caregiverId
      setAlert(data);
      setAcknowledged(false);
      startAlertSound();
    };

    socketService.on("emergency_alert", handleEmergencyAlert);
    console.log("[EmergencyAlert] Listener registered for emergency_alert");

    return () => {
      socketService.off("emergency_alert", handleEmergencyAlert);
      stopAlertSound();
    };
  }, [isCaregiver, startAlertSound, stopAlertSound]);

  // Cleanup âm thanh khi unmount
  useEffect(() => () => stopAlertSound(), [stopAlertSound]);

  // Không render gì nếu không phải caregiver hoặc chưa có alert
  if (!isCaregiver || !alert) return null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAcknowledge = () => {
    stopAlertSound();
    setAcknowledged(true);
    setTimeout(() => setAlert(null), 2000);
  };

  const handleDismiss = () => {
    stopAlertSound();
    setAlert(null);
  };

  const handleOpenMap = () => {
    if (alert.latitude && alert.longitude) {
      window.open(
        `https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`,
        "_blank"
      );
    }
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="emergency-overlay" role="alertdialog" aria-modal="true" aria-label="Cảnh báo khẩn cấp">
      <div className={`emergency-modal ${acknowledged ? "acknowledged" : ""}`}>

        {/* Close button */}
        {!acknowledged && (
          <button className="emergency-close-btn" onClick={handleDismiss} aria-label="Đóng">
            <X size={20} />
          </button>
        )}

        {acknowledged ? (
          /* ── Đã xác nhận ── */
          <div className="emergency-ack-state">
            <div className="emergency-ack-icon">
              <CheckCircle size={64} color="#16a34a" />
            </div>
            <h2>Đã xác nhận</h2>
            <p>Bạn đã nhận thông báo khẩn cấp từ <strong>{alert.elderlyName}</strong>.</p>
          </div>
        ) : (
          /* ── Cảnh báo ── */
          <>
            <div className="emergency-header">
              <div className="emergency-pulse-ring" />
              <div className="emergency-icon-wrap">
                <AlertTriangle size={40} color="#fff" />
              </div>
              <div className="emergency-badge">KHẨN CẤP</div>
            </div>

            <div className="emergency-body">
              <h1 className="emergency-title">
                {alert.elderlyName} cần hỗ trợ!
              </h1>
              <p className="emergency-message">{alert.message}</p>

              <div className="emergency-meta">
                <span className="emergency-time">🕐 {formatTime(alert.triggeredAt)}</span>
              </div>

              {alert.latitude && alert.longitude && (
                <button className="emergency-location-btn" onClick={handleOpenMap}>
                  <MapPin size={16} />
                  Xem vị trí trên bản đồ
                </button>
              )}
            </div>

            <div className="emergency-actions">
              <button className="emergency-ack-btn" onClick={handleAcknowledge}>
                <CheckCircle size={20} />
                Tôi đã nhận — Đang xử lý
              </button>
              <button className="emergency-dismiss-btn" onClick={handleDismiss}>
                Bỏ qua
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
