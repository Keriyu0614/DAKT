import { Globe, Eye, Monitor } from 'lucide-react';

interface PreferenceSettingsProps {
    display: {
        language: 'en' | 'vi';
        fontSize: 'normal' | 'large' | 'xl';
        theme: 'light' | 'contrast';
    };
    accessibility: {
        highContrast: boolean;
        largeButtons: boolean;
        reducedMotion: boolean;
    };
    system: {
        defaultLanding: 'dashboard' | 'appointments' | 'medications';
        autoLogout: boolean;
        sessionDuration: '15m' | '30m' | '1h';
    };
    onUpdateDisplay: (key: string, value: any) => void;
    onToggleAccessibility: (key: string) => void;
    onUpdateSystem: (key: string, value: any) => void;
}

const PreferenceSettings = ({
    display,
    accessibility,
    system,
    onUpdateDisplay,
    onToggleAccessibility,
    onUpdateSystem
}: PreferenceSettingsProps) => {
    return (
        <>
            {/* Giao diện */}
            <section className="settings-section">
                <div className="section-header">
                    <div className="section-icon"><Globe size={20} /></div>
                    <div className="section-title-group">
                        <h2>Giao Diện</h2>
                        <p>Tùy chỉnh trải nghiệm hiển thị của bạn</p>
                    </div>
                </div>
                <div className="section-body">
                    <div className="setting-item">
                        <div>
                            <div className="setting-label">Cỡ Chữ</div>
                        </div>
                        <select
                            className="setting-select"
                            value={display.fontSize}
                            onChange={(e) => onUpdateDisplay('fontSize', e.target.value)}
                        >
                            <option value="normal">Bình thường</option>
                            <option value="large">Lớn</option>
                            <option value="xl">Rất lớn</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Khả Năng Tiếp Cận */}
            <section className="settings-section">
                <div className="section-header">
                    <div className="section-icon"><Eye size={20} /></div>
                    <div className="section-title-group">
                        <h2>Khả Năng Tiếp Cận</h2>
                        <p>Công cụ hỗ trợ điều hướng dễ dàng hơn</p>
                    </div>
                </div>
                <div className="section-body">
                    <div className="setting-item">
                        <div>
                            <div className="setting-label">Chế Độ Tương Phản Cao</div>
                            <div className="setting-description">Tăng sự khác biệt giữa văn bản và nền</div>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={accessibility.highContrast}
                                onChange={() => onToggleAccessibility('highContrast')}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                    <div className="setting-item">
                        <div>
                            <div className="setting-label">Nút Lớn Hơn</div>
                            <div className="setting-description">Mở rộng vùng có thể nhấn</div>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={accessibility.largeButtons}
                                onChange={() => onToggleAccessibility('largeButtons')}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                    <div className="setting-item">
                        <div>
                            <div className="setting-label">Giảm Hiệu Ứng</div>
                            <div className="setting-description">Tối thiểu hoá hoạt ảnh trong ứng dụng</div>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={accessibility.reducedMotion}
                                onChange={() => onToggleAccessibility('reducedMotion')}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                </div>
            </section>

            {/* Tùy Chỉnh Hệ Thống */}
            <section className="settings-section">
                <div className="section-header">
                    <div className="section-icon"><Monitor size={20} /></div>
                    <div className="section-title-group">
                        <h2>Tùy Chỉnh Hệ Thống</h2>
                        <p>Cài đặt hành vi chung của ứng dụng</p>
                    </div>
                </div>
                <div className="section-body">
                    <div className="setting-item">
                        <div>
                            <div className="setting-label">Trang Mặc Định Sau Đăng Nhập</div>
                            <div className="setting-description">Trang hiển thị sau khi đăng nhập</div>
                        </div>
                        <select
                            className="setting-select"
                            value={system.defaultLanding}
                            onChange={(e) => onUpdateSystem('defaultLanding', e.target.value)}
                        >
                            <option value="dashboard">Trang chủ</option>
                            <option value="appointments">Lịch khám</option>
                            <option value="medications">Thuốc</option>
                        </select>
                    </div>
                </div>
            </section>
        </>
    );
};

export default PreferenceSettings;
