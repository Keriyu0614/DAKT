import { useNavigate } from 'react-router-dom';
import {
    Heart,
    Calendar,
    Clock,
    Activity,
    Smartphone,
    Layout,
    ShieldCheck,
    UserCheck,
    ArrowRight
} from 'lucide-react';
import './HomePage.css';

export const HomePage = () => {
    const navigate = useNavigate();
    const handleLogin = () => navigate('/login');
    const handleRegister = () => navigate('/register');

    return (
        <div className="homepage-container">
            {/* Header */}
            <header className="homepage-header">
                <div className="logo-container">
                    <Heart size={22} fill="#0ea5e9" stroke="#0ea5e9" />
                    <span>CareLink</span>
                </div>
                <nav className="nav-links">
                    <a href="#hero">Trang chủ</a>
                    <a href="#features">Tính năng</a>
                    <a href="#how-it-works">Cách dùng</a>
                </nav>
                <div className="auth-buttons">
                    <button onClick={handleLogin} className="btn btn-outline">Đăng nhập</button>
                    <button onClick={handleRegister} className="btn btn-primary">Đăng ký</button>
                </div>
            </header>

            {/* Hero */}
            <section id="hero" className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge">
                        <Heart size={12} fill="currentColor" /> Hệ thống chăm sóc sức khỏe
                    </div>
                    <h1 className="hero-title">
                        Quản lý sức khỏe <span>người thân</span> toàn diện
                    </h1>
                    <p className="hero-subtitle">
                        Theo dõi lịch khám, thuốc uống, và tình trạng sức khỏe — tất cả trong một nền tảng.
                        Được thiết kế cho người chăm sóc, mang lại sự an tâm mỗi ngày.
                    </p>
                    <div className="hero-buttons">
                        <button onClick={handleLogin} className="btn btn-primary">
                            Vào Dashboard <ArrowRight size={18} />
                        </button>
                        <button onClick={handleRegister} className="btn btn-outline">
                            Tạo tài khoản
                        </button>
                    </div>
                </div>
                <div className="hero-image">
                    <div className="hero-visual">
                        <div className="hero-visual-header">
                            <div className="hero-avatar">👴</div>
                            <div className="hero-visual-info">
                                <div className="hero-visual-name">Nguyễn Văn An</div>
                                <div className="hero-visual-role">Bệnh nhân • 72 tuổi</div>
                            </div>
                            <div className="hero-status-dot"></div>
                        </div>
                        <div className="hero-stat-row">
                            <div className="hero-stat">
                                <div className="hero-stat-num">3</div>
                                <div className="hero-stat-label">Thuốc hôm nay</div>
                            </div>
                            <div className="hero-stat">
                                <div className="hero-stat-num">2</div>
                                <div className="hero-stat-label">Lịch khám</div>
                            </div>
                            <div className="hero-stat">
                                <div className="hero-stat-num">120/80</div>
                                <div className="hero-stat-label">Huyết áp</div>
                            </div>
                        </div>
                        <div className="hero-timeline">
                            <div className="hero-timeline-item">
                                <div className="hero-timeline-dot dot-blue"></div>
                                💊 Uống Metformin 500mg
                                <span className="hero-timeline-time">7:00 SA</span>
                            </div>
                            <div className="hero-timeline-item">
                                <div className="hero-timeline-dot dot-green"></div>
                                🏥 Khám Tim mạch – BV Chợ Rẫy
                                <span className="hero-timeline-time">9:30 SA</span>
                            </div>
                            <div className="hero-timeline-item">
                                <div className="hero-timeline-dot dot-amber"></div>
                                💊 Uống Amlodipine 5mg
                                <span className="hero-timeline-time">12:00 TR</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="features-section">
                <span className="section-eyebrow">Tính năng nổi bật</span>
                <h2 className="section-title">Quản lý chăm sóc toàn diện</h2>
                <p className="section-subtitle">Mọi thứ bạn cần để chăm sóc tốt nhất cho người thân yêu của mình.</p>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon"><Clock size={26} /></div>
                        <h3>Quản lý thuốc</h3>
                        <p>Thiết lập lịch uống thuốc chính xác và nhắc nhở thông minh để không bao giờ bỏ sót.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><Calendar size={26} /></div>
                        <h3>Lịch khám bệnh</h3>
                        <p>Theo dõi các buổi khám bác sĩ, kiểm tra định kỳ và lịch tư vấn y tế.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><Activity size={26} /></div>
                        <h3>Theo dõi sức khỏe</h3>
                        <p>Ghi nhận và theo dõi các chỉ số như huyết áp, nhịp tim, cân nặng theo thời gian.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon"><UserCheck size={26} /></div>
                        <h3>Giám sát người chăm sóc</h3>
                        <p>Quản lý toàn bộ lịch trình và xem báo cáo sức khỏe chi tiết từ xa.</p>
                    </div>
                </div>
            </section>

            {/* App Comparison */}
            <section className="app-comparison-section">
                <span className="section-eyebrow">Hệ sinh thái</span>
                <h2 className="section-title">Hai nền tảng, một hệ thống</h2>
                <p className="section-subtitle">Ứng dụng Web cho người chăm sóc và App di động cho người cao tuổi.</p>

                <div className="comparison-container">
                    <div className="app-card">
                        <div className="web-app-header app-card-header">
                            <Layout size={52} />
                            <h2>Ứng dụng Web</h2>
                            <span>Dành cho Người chăm sóc & Quản lý</span>
                        </div>
                        <div className="app-card-body">
                            <ul>
                                <li>Dashboard quản lý toàn diện</li>
                                <li>Báo cáo & biểu đồ sức khỏe chi tiết</li>
                                <li>Quản lý lịch uống thuốc</li>
                                <li>Điều khiển lịch khám</li>
                                <li>Quản lý hồ sơ người dùng</li>
                            </ul>
                        </div>
                    </div>
                    <div className="app-card">
                        <div className="mobile-app-header app-card-header">
                            <Smartphone size={52} />
                            <h2>Ứng dụng Mobile</h2>
                            <span>Dành cho Người cao tuổi</span>
                        </div>
                        <div className="app-card-body">
                            <ul>
                                <li>Giao diện đơn giản, chữ lớn</li>
                                <li>Nhận nhắc nhở uống thuốc</li>
                                <li>Xác nhận đã uống thuốc</li>
                                <li>Xem lịch khám hôm nay</li>
                                <li>Thông báo giọng nói (sắp ra mắt)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section id="how-it-works" className="how-it-works-section">
                <span className="section-eyebrow">Quy trình sử dụng</span>
                <h2 className="section-title">Bắt đầu trong 3 bước đơn giản</h2>
                <div className="steps-container">
                    <div className="step-item">
                        <div className="step-number">1</div>
                        <h3>Đăng ký</h3>
                        <p>Người chăm sóc tạo tài khoản và thiết lập hồ sơ người cao tuổi.</p>
                    </div>
                    <div className="step-item">
                        <div className="step-number">2</div>
                        <h3>Quản lý</h3>
                        <p>Nhập thuốc, lịch khám và ghi chép sức khỏe trên Web App.</p>
                    </div>
                    <div className="step-item">
                        <div className="step-number">3</div>
                        <h3>Theo dõi</h3>
                        <p>Người cao tuổi nhận thông báo trên Mobile. Bạn giám sát tình trạng.</p>
                    </div>
                </div>
            </section>

            {/* Trust */}
            <section className="trust-section">
                <div className="trust-inner">
                    <ShieldCheck size={40} color="#0ea5e9" />
                    <h2>Độ tin cậy cấp y tế</h2>
                    <p>
                        Hệ thống được xây dựng với tính nhất quán và độ tin cậy cao.
                        Đảm bảo mọi nhắc nhở đều được gửi đi và mọi dữ liệu sức khỏe đều được lưu trữ an toàn.
                    </p>
                </div>
            </section>

            {/* CTA */}
            <section className="cta-section">
                <h2>Sẵn sàng đơn giản hóa việc chăm sóc?</h2>
                <p>Tham gia cùng hàng nghìn người chăm sóc đang tin dùng CareLink mỗi ngày.</p>
                <button onClick={handleRegister} className="cta-btn">
                    Bắt đầu miễn phí <ArrowRight size={20} />
                </button>
            </section>

            {/* Footer */}
            <footer className="homepage-footer">
                <div className="footer-content">
                    <div>
                        <div className="footer-logo">
                            <Heart size={18} fill="white" stroke="white" /> CareLink
                        </div>
                        <p>Trao quyền cho người chăm sóc, hỗ trợ người cao tuổi.</p>
                    </div>
                    <div className="footer-links">
                        <a href="#hero">Trang chủ</a>
                        <a href="#features">Tính năng</a>
                        <a href="/login">Đăng nhập</a>
                        <a href="/register">Đăng ký</a>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2026 Elderly Care Management System. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};
