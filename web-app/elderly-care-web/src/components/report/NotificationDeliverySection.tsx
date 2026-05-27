import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import type { ComprehensiveReport } from '../../types/report.types';
import { chartHelpers } from '../../utils/report.charts';
import './ReportSections.css';

interface NotificationDeliverySectionProps {
    data: ComprehensiveReport;
}

const NotificationDeliverySection = ({ data }: NotificationDeliverySectionProps) => {
    const { colors } = chartHelpers;

    return (
        <div className="report-section slide-in">
            <div className="section-header">
                <h2>Gửi Thông Báo & Tỷ Lệ Đọc</h2>
                <p>Kiểm tra độ tin cậy của hệ thống gửi thông báo</p>
            </div>
            
            <div className="metrics-grid">
                <div className="metric-card">
                    <h4>Tổng số gửi</h4>
                    <p className="value">{data.notificationDelivery.totalSent}</p>
                </div>
                <div className="metric-card">
                    <h4>Đã gửi thành công</h4>
                    <p className="value success">{data.notificationDelivery.deliveredCount}</p>
                </div>
                <div className="metric-card">
                    <h4>Gửi thất bại</h4>
                    <p className="value danger">{data.notificationDelivery.failedCount}</p>
                </div>
                <div className="metric-card">
                    <h4>Tỷ lệ đọc</h4>
                    <p className="value">{data.notificationDelivery.readRate}%</p>
                </div>
            </div>

            <div className="section-grid">
                <div className="chart-container">
                    <h3>Phân Loại Theo Kênh</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.notificationDelivery.channelBreakdown}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={colors.primary} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-container">
                    <h3>Phân Loại Người Nhận</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={data.notificationDelivery.recipientBreakdown.filter(item => item.value > 0)}
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={data.notificationDelivery.recipientBreakdown.filter(item => item.value > 0).length > 1 ? 5 : 0}
                                dataKey="value"
                                label={(entry) => `${entry.name}: ${entry.value}`}
                            >
                                {data.notificationDelivery.recipientBreakdown.filter(item => item.value > 0).map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={colors.chart[index % colors.chart.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="stats-panel">
                <div className="stat-row">
                    <span>Tỷ lệ xác nhận:</span>
                    <strong className="text-success">{data.notificationDelivery.acknowledgementRate}%</strong>
                </div>
                <div className="stat-row">
                    <span>Số lần thử lại trung bình:</span>
                    <strong>{data.notificationDelivery.averageRetries.toFixed(1)}</strong>
                </div>
                <div className="stat-row">
                    <span>Số lần thử lại tối đa:</span>
                    <strong className="text-warning">{data.notificationDelivery.maxRetries}</strong>
                </div>
            </div>
        </div>
    );
};

export default NotificationDeliverySection;
