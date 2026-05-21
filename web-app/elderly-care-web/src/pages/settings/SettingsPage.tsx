import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import authApi from "../../api/auth.api";
import type { UserSettings } from "../../api/auth.api";
import {
    Bell,
    Globe,
    Moon,
    Shield,
    Check,
    Loader2,
    Save
} from "lucide-react";
import "./SettingsPage.css";

export const SettingsPage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    const [settings, setSettings] = useState<UserSettings>({
        language: "vn",
        theme: "light",
        notificationsEnabled: true,
        autoLogout: true,
    });

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user) return;
            try {
                const response = await authApi.getSettings(user.id);
                setSettings(response.data);
            } catch (error) {
                console.error("Failed to fetch settings", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await authApi.updateSettings(user.id, settings);
            setShowSaved(true);
            setTimeout(() => setShowSaved(false), 3000);
        } catch (error) {
            console.error("Failed to update settings", error);
            alert("Không thể lưu cài đặt. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: keyof UserSettings, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div className="settings-container">
                <div className="loading-card">
                    <Loader2 className="animate-spin" size={32} />
                    <p>Đang tải cài đặt...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="settings-container">
            <header className="settings-header">
                <h1 className="settings-title">Cài Đặt Hệ Thống</h1>
                <p className="settings-subtitle">Quản lý tùy chỉnh ứng dụng và bảo mật của bạn</p>
            </header>

            <div className="settings-content">
                {/* 1. General Preferences */}
                <section className="settings-section">
                    <div className="section-header">
                        <div className="section-icon">
                            <Globe size={20} />
                        </div>
                        <div className="section-title-group">
                            <h2>Giao Diện</h2>
                            <p>Cài đặt giao diện hiển thị</p>
                        </div>
                    </div>
                    <div className="section-body">
                        <div className="setting-item">
                            <div className="setting-info">
                                <div className="setting-label">Giao Diện Màu Sắc</div>
                                <div className="setting-description">Chọn giữa chế độ sáng, tối hoặc tương phản cao</div>
                            </div>
                            <select 
                                className="setting-select"
                                value={settings.theme}
                                onChange={(e) => updateField("theme", e.target.value)}
                            >
                                <option value="light">Chế độ sáng</option>
                                <option value="dark">Chế độ tối</option>
                                <option value="contrast">Tương phản cao</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* 2. Notifications */}
                <section className="settings-section">
                    <div className="section-header">
                        <div className="section-icon">
                            <Bell size={20} />
                        </div>
                        <div className="section-title-group">
                            <h2>Thông Báo</h2>
                            <p>Kiểm soát cách nhận cảnh báo và nhắc nhở</p>
                        </div>
                    </div>
                    <div className="section-body">
                        <div className="setting-item">
                            <div className="setting-info">
                                <div className="setting-label">Thông Báo Đẩy</div>
                                <div className="setting-description">Nhận cảnh báo theo thời gian thực về thuốc và lịch khám</div>
                            </div>
                            <label className="switch">
                                <input 
                                    type="checkbox" 
                                    checked={settings.notificationsEnabled}
                                    onChange={(e) => updateField("notificationsEnabled", e.target.checked)}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </section>

                {/* 3. Security */}
                <section className="settings-section">
                    <div className="section-header">
                        <div className="section-icon">
                            <Shield size={20} />
                        </div>
                        <div className="section-title-group">
                            <h2>Bảo Mật & Quyền Riêng Tư</h2>
                            <p>Bảo vệ tài khoản và dữ liệu phiên đăng nhập của bạn</p>
                        </div>
                    </div>
                    <div className="section-body">
                        <div className="setting-item">
                            <div className="setting-info">
                                <div className="setting-label">Tự Động Đăng Xuất</div>
                                <div className="setting-description">Tự động đăng xuất sau 30 phút không hoạt động</div>
                            </div>
                            <label className="switch">
                                <input 
                                    type="checkbox" 
                                    checked={settings.autoLogout}
                                    onChange={(e) => updateField("autoLogout", e.target.checked)}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </section>

                <div className="settings-actions-footer">
                    <button className="btn-save" onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <><Loader2 className="animate-spin" size={18} /> Đang lưu...</>
                        ) : (
                            <><Save size={18} /> Lưu cài đặt</>
                        )}
                    </button>
                </div>
            </div>

            {showSaved && (
                <div className="saved-toast">
                    <Check size={18} /> Đã lưu tất cả cài đặt thành công
                </div>
            )}
        </div>
    );
};
