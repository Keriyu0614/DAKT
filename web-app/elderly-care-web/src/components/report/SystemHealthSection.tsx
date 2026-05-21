import type { ComprehensiveReport } from '../../types/report.types';

interface SystemHealthSectionProps {
    data: ComprehensiveReport;
}

const SystemHealthSection = ({ data }: SystemHealthSectionProps) => {
    return (
        <div className="report-section slide-in">
            <div className="section-header">
                <h2>Sức Khỏe Hệ Thống & Độ Tin Cậy</h2>
                <p>Phát hiện rủi ro hệ thống và lỗi tích hợp.</p>
            </div>
            <div className="section-grid">
                <div className="stats-panel">
                    <h3>Thông Báo Lỗi Theo Nguyên Nhân</h3>
                    {data.systemHealth.failuresByReason.length === 0 ? (
                        <p className="no-data">Không có lỗi nào được ghi nhận trong thời gian này.</p>
                    ) : (
                        <ul className="fail-reasons">
                            {data.systemHealth.failuresByReason.map((r, i) => (
                                <li key={i}>
                                    <span>{r.reason}</span>
                                    <span className="count-pill">{r.count}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="stats-panel">
                    <div className="stat-row">
                        <span>Tỷ Lệ Thử Lại Thành Công:</span>
                        <strong>{data.systemHealth.retrySuccessRate}%</strong>
                    </div>
                    <div className="stat-row">
                        <span>Độ Trễ Giao Hàng TB:</span>
                        <strong>{data.systemHealth.averageDelayMs}ms</strong>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemHealthSection;
