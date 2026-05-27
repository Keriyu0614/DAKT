import { useState } from 'react';
import { seedSampleAccounts } from '../../scripts/seedSampleAccounts';
import { toast } from 'react-toastify';
import './SeedDataPage.css';

interface SeedResult {
    caregiver: {
        id: string;
        name: string;
        email: string;
        password: string;
    };
    elderly: {
        id: string;
        name: string;
        email: string;
        password: string;
    };
    stats: {
        medications: number;
        appointments: number;
        reminders: number;
        notifications: number;
    };
}

export const SeedDataPage = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SeedResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSeed = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await seedSampleAccounts();
            setResult(data);
            toast.success('Tạo dữ liệu mẫu thành công!');
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || 'Có lỗi xảy ra';
            setError(errorMsg);
            toast.error('Lỗi tạo dữ liệu: ' + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="seed-data-page">
            <div className="seed-container">
                <header className="seed-header">
                    <h1>🌱 Seed Sample Data</h1>
                    <p>Tạo 2 tài khoản mẫu với dữ liệu đầy đủ cho môi trường phát triển</p>
                </header>

                <div className="seed-info">
                    <h3>Dữ liệu sẽ được tạo:</h3>
                    <ul>
                        <li>✅ 1 tài khoản Người chăm sóc (Nguyễn Thị Mai)</li>
                        <li>✅ 1 tài khoản Người cao tuổi (Trần Văn Nam)</li>
                        <li>✅ Liên kết giữa 2 tài khoản</li>
                        <li>✅ 4 loại thuốc với lịch uống</li>
                        <li>✅ 3 lịch hẹn khám bệnh</li>
                        <li>✅ Nhiều nhắc nhở tự động</li>
                        <li>✅ Thông báo mẫu</li>
                        <li>✅ Cài đặt người dùng</li>
                    </ul>
                </div>

                <div className="seed-actions">
                    <button
                        className="seed-button"
                        onClick={handleSeed}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Đang tạo dữ liệu...
                            </>
                        ) : (
                            <>
                                🚀 Tạo Dữ Liệu Mẫu
                            </>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="seed-error">
                        <h3>❌ Lỗi</h3>
                        <p>{error}</p>
                    </div>
                )}

                {result && (
                    <div className="seed-result">
                        <h3>✨ Tạo thành công!</h3>
                        
                        <div className="account-cards">
                            <div className="account-card caregiver">
                                <h4>👤 Người chăm sóc</h4>
                                <div className="account-info">
                                    <p><strong>Tên:</strong> {result.caregiver.name}</p>
                                    <p><strong>Email:</strong> {result.caregiver.email}</p>
                                    <p><strong>Mật khẩu:</strong> {result.caregiver.password}</p>
                                    <p><strong>ID:</strong> <code>{result.caregiver.id}</code></p>
                                </div>
                            </div>

                            <div className="account-card elderly">
                                <h4>👴 Người cao tuổi</h4>
                                <div className="account-info">
                                    <p><strong>Tên:</strong> {result.elderly.name}</p>
                                    <p><strong>Email:</strong> {result.elderly.email}</p>
                                    <p><strong>Mật khẩu:</strong> {result.elderly.password}</p>
                                    <p><strong>ID:</strong> <code>{result.elderly.id}</code></p>
                                </div>
                            </div>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <span className="stat-icon">💊</span>
                                <span className="stat-value">{result.stats.medications}</span>
                                <span className="stat-label">Thuốc</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-icon">📅</span>
                                <span className="stat-value">{result.stats.appointments}</span>
                                <span className="stat-label">Lịch hẹn</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-icon">⏰</span>
                                <span className="stat-value">{result.stats.reminders}</span>
                                <span className="stat-label">Nhắc nhở</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-icon">🔔</span>
                                <span className="stat-value">{result.stats.notifications}</span>
                                <span className="stat-label">Thông báo</span>
                            </div>
                        </div>

                        <div className="next-steps">
                            <h4>📝 Bước tiếp theo:</h4>
                            <ol>
                                <li>Đăng xuất khỏi tài khoản hiện tại (nếu có)</li>
                                <li>Đăng nhập bằng một trong hai tài khoản trên</li>
                                <li>Khám phá các tính năng với dữ liệu mẫu</li>
                            </ol>
                        </div>
                    </div>
                )}

                <div className="seed-warning">
                    <p>⚠️ <strong>Lưu ý:</strong> Chỉ sử dụng trong môi trường phát triển. Không chạy trên production!</p>
                </div>
            </div>
        </div>
    );
};
