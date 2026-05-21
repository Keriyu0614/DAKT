import { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import authApi from "../../api/auth.api";
import {
    User as UserIcon,
    ShieldCheck,
    LogOut,
    CheckCircle2,
    Camera,
    Mail,
    Loader2
} from "lucide-react";
import "./ProfilePage.css";

export const ProfilePage = () => {
    const { user, logout, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.name || "");
    const [showSavedMsg, setShowSavedMsg] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!user) {
        return (
            <div className="profile-container">
                <div className="loading-card">Đang tải hồ sơ...</div>
            </div>
        );
    }

    const isCaregiver = String(user.role) === "Caregiver" || String(user.role) === "1";

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const response = await authApi.updateProfile(user.id, { name });
            updateUser({ name: response.data.name });
            setShowSavedMsg(true);
            setIsEditing(false);
            setTimeout(() => setShowSavedMsg(false), 3000);
        } catch (error) {
            console.error("Lỗi cập nhật hồ sơ", error);
            alert("Không thể cập nhật hồ sơ. Vui lòng thử lại.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        try {
            const response = await authApi.uploadAvatar(user.id, file);
            // The response returns the partial path, we might need to prepend base URL if needed
            // But let's assume the backend returns a usable URL or the frontend handles it
            updateUser({ avatarUrl: response.data.avatarUrl });
        } catch (error) {
            console.error("Lỗi tải lên ảnh đại diện", error);
            alert("Không thể tải lên ảnh đại diện. Vui lòng thử lại.");
        } finally {
            setIsUploading(false);
        }
    };

    const getAvatarContent = () => {
        if (isUploading) return <Loader2 className="animate-spin" size={24} />;
        if (user.avatarUrl) {
            // Assuming the avatarUrl is a relative path like /avatars/filename.jpg
            // In a real app, you'd use a full URL or a proxy
            const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
            return <img src={`${baseUrl}${user.avatarUrl}`} alt={user.name} className="profile-img" />;
        }
        return user.name.charAt(0).toUpperCase();
    };

    return (
        <div className="profile-container">
            {showSavedMsg && (
                <div className="saved-msg">
                    <CheckCircle2 size={18} /> Đã lưu thay đổi thành công!
                </div>
            )}

            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-avatar-wrapper" onClick={handleAvatarClick}>
                        <div className="profile-avatar-large">
                            {getAvatarContent()}
                        </div>
                        <div className="avatar-edit-overlay">
                            <Camera size={20} />
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            style={{ display: 'none' }} 
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>
                    <h1 className="profile-name-title">{user.name}</h1>
                    <div className="role-badge-large role-badge-caregiver">
                        <ShieldCheck size={16} />
                        {isCaregiver ? "Người chăm sóc" : "Người dùng"}
                    </div>
                </div>

                <section className="profile-section">
                    <div className="section-title">
                        <UserIcon size={20} className="section-icon" />
                        <h2>Thông tin cá nhân</h2>
                    </div>

                    <div className="info-grid">
                        <div className="info-item">
                            <label className="info-label">Họ và Tên</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="info-value"
                                    autoFocus
                                />
                            ) : (
                                <div className="info-value read-only">
                                    {user.name}
                                </div>
                            )}
                        </div>

                        <div className="info-item">
                            <label className="info-label">Địa chỉ Email</label>
                            <div className="info-value read-only" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Mail size={14} color="#94a3b8" />
                                {user.email}
                            </div>
                        </div>
                    </div>

                    <div className="profile-actions">
                        {isEditing ? (
                            <>
                                <button className="btn-cancel" onClick={() => { setIsEditing(false); setName(user.name); }}>
                                    Hủy
                                </button>
                                <button className="btn-save" onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                                </button>
                            </>
                        ) : (
                            <button className="btn-edit" onClick={() => setIsEditing(true)}>
                                Chỉnh sửa Hồ sơ
                            </button>
                        )}
                    </div>
                </section>

                <section className="profile-section" style={{ borderBottom: 'none' }}>
                    <div className="section-title danger">
                        <LogOut size={20} className="section-icon danger" />
                        <h2>Quản lý Tài khoản</h2>
                    </div>
                    
                    <button className="btn-danger" onClick={() => logout()}>
                        <LogOut size={18} /> Đăng xuất
                    </button>
                </section>
            </div>

            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', paddingBottom: '20px' }}>
                ID Người dùng: {user.id} • Phiên bản 1.1.0
            </div>
        </div>
    );
};
