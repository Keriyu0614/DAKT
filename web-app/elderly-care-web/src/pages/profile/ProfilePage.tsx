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
    Loader2,
    Lock,
    Eye,
    EyeOff
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

    // --- Đổi mật khẩu ---
    const [showPwSection, setShowPwSection] = useState(false);
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [pwError, setPwError] = useState("");
    const [pwSuccess, setPwSuccess] = useState(false);
    const [isSavingPw, setIsSavingPw] = useState(false);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

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
            updateUser({ avatarUrl: response.data.avatarUrl });
        } catch (error) {
            console.error("Lỗi tải lên ảnh đại diện", error);
            alert("Không thể tải lên ảnh đại diện. Vui lòng thử lại.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleChangePassword = async () => {
        setPwError("");
        if (!currentPw || !newPw || !confirmPw) {
            setPwError("Vui lòng nhập đầy đủ thông tin.");
            return;
        }
        if (newPw.length < 6) {
            setPwError("Mật khẩu mới phải có ít nhất 6 ký tự.");
            return;
        }
        if (newPw !== confirmPw) {
            setPwError("Mật khẩu xác nhận không khớp.");
            return;
        }

        setIsSavingPw(true);
        try {
            await authApi.changePassword(user.id, { currentPassword: currentPw, newPassword: newPw });
            setPwSuccess(true);
            setCurrentPw(""); setNewPw(""); setConfirmPw("");
            setTimeout(() => { setPwSuccess(false); setShowPwSection(false); }, 2500);
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Đổi mật khẩu thất bại.";
            setPwError(msg);
        } finally {
            setIsSavingPw(false);
        }
    };

    const getAvatarContent = () => {
        if (isUploading) return <Loader2 className="animate-spin" size={24} />;
        if (user.avatarUrl) {
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
                                <div className="info-value read-only">{user.name}</div>
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

                {/* ── Đổi mật khẩu ── */}
                {!user.isGoogle && (
                    <section className="profile-section">
                        <div className="section-title" style={{ cursor: 'pointer' }} onClick={() => { setShowPwSection(v => !v); setPwError(""); setPwSuccess(false); }}>
                            <Lock size={20} className="section-icon" />
                            <h2>Đổi mật khẩu</h2>
                            <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#64748b' }}>
                                {showPwSection ? "Thu gọn ▲" : "Mở rộng ▼"}
                            </span>
                        </div>

                        {showPwSection && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                                {pwError && (
                                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#dc2626', fontSize: '14px' }}>
                                        {pwError}
                                    </div>
                                )}
                                {pwSuccess && (
                                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', color: '#16a34a', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <CheckCircle2 size={16} /> Đổi mật khẩu thành công!
                                    </div>
                                )}

                                {/* Mật khẩu hiện tại */}
                                <div className="info-item">
                                    <label className="info-label">Mật khẩu hiện tại <span style={{ color: '#ef4444' }}>*</span></label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showCurrentPw ? "text" : "password"}
                                            value={currentPw}
                                            onChange={e => setCurrentPw(e.target.value)}
                                            placeholder="Nhập mật khẩu hiện tại"
                                            className="info-value"
                                            style={{ paddingRight: '44px' }}
                                        />
                                        <button type="button" onClick={() => setShowCurrentPw(v => !v)}
                                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                            {showCurrentPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Mật khẩu mới */}
                                <div className="info-item">
                                    <label className="info-label">Mật khẩu mới <span style={{ color: '#ef4444' }}>*</span></label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showNewPw ? "text" : "password"}
                                            value={newPw}
                                            onChange={e => setNewPw(e.target.value)}
                                            placeholder="Ít nhất 6 ký tự"
                                            className="info-value"
                                            style={{ paddingRight: '44px' }}
                                        />
                                        <button type="button" onClick={() => setShowNewPw(v => !v)}
                                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                            {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Xác nhận mật khẩu mới */}
                                <div className="info-item">
                                    <label className="info-label">Xác nhận mật khẩu mới <span style={{ color: '#ef4444' }}>*</span></label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showConfirmPw ? "text" : "password"}
                                            value={confirmPw}
                                            onChange={e => setConfirmPw(e.target.value)}
                                            placeholder="Nhập lại mật khẩu mới"
                                            className="info-value"
                                            style={{ paddingRight: '44px' }}
                                            onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
                                        />
                                        <button type="button" onClick={() => setShowConfirmPw(v => !v)}
                                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                            {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="profile-actions">
                                    <button className="btn-cancel" onClick={() => { setShowPwSection(false); setCurrentPw(""); setNewPw(""); setConfirmPw(""); setPwError(""); }}>
                                        Hủy
                                    </button>
                                    <button className="btn-save" onClick={handleChangePassword} disabled={isSavingPw}>
                                        {isSavingPw ? "Đang lưu..." : "Xác nhận đổi mật khẩu"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                <section className="profile-section" style={{ borderBottom: 'none' }}>
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
