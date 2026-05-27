import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { AlertTriangle } from 'lucide-react';
import type { ComprehensiveReport } from '../../types/report.types';
import { chartHelpers } from '../../utils/report.charts';

interface SystemHealthSectionProps {
    data: ComprehensiveReport;
}

const SystemHealthSection = ({ data }: SystemHealthSectionProps) => {
    const { colors } = chartHelpers;

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
                    <div className="stat-row">
                        <span>Tổng Lỗi:</span>
                        <strong className="text-danger">
                            {data.systemHealth.failuresByReason.reduce((sum, f) => sum + f.count, 0)}
                        </strong>
                    </div>
                </div>
            </div>
            {data.systemHealth.peakFailureWindows.length > 0 && (
                <div className="chart-container">
                    <h3>Khung Giờ Lỗi Cao Điểm</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.systemHealth.peakFailureWindows}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="window" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill={colors.danger} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="disclaimer-area">
                        <AlertTriangle size={16} />
                        <span>Biểu đồ này giúp xác định các khung giờ có nhiều lỗi nhất để tối ưu hóa hệ thống.</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemHealthSection;
