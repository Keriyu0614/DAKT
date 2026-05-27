import type { ComprehensiveReport } from '../../types/report.types';
import './ReportSections.css';

interface ReportSummaryCardsProps {
    data: ComprehensiveReport;
}

const ReportSummaryCards = ({ data }: ReportSummaryCardsProps) => {
    const deliveryRate = data.notificationDelivery.totalSent > 0
        ? Math.round((data.notificationDelivery.deliveredCount / data.notificationDelivery.totalSent) * 100)
        : 0;
    
    const adherenceRate = (data.medicationAdherence.acknowledgedCount + data.medicationAdherence.missedRemindersCount) > 0
        ? Math.round((data.medicationAdherence.acknowledgedCount / (data.medicationAdherence.acknowledgedCount + data.medicationAdherence.missedRemindersCount)) * 100)
        : 0;
    
    const safetyRisks = data.appointmentCompliance.noShowRiskCount + 
                        data.systemHealth.failuresByReason.reduce((sum, f) => sum + f.count, 0);

    return (
        <section className="summary-cards">
            <div className="summary-card gold">
                <span className="summary-label">Độ Chính Xác Nhắc Nhở</span>
                <span className="summary-value">{data.reminderPerformance.triggeredOnTime}%</span>
                <span className="summary-hint">Tạo nhắc nhở đúng giờ</span>
            </div>
            <div className="summary-card blue">
                <span className="summary-label">Tỷ Lệ Gửi Thành Công</span>
                <span className="summary-value">{deliveryRate}%</span>
                <span className="summary-hint">Thành công trên tất cả kênh</span>
            </div>
            <div className="summary-card green">
                <span className="summary-label">Tuân Thủ Uống Thuốc</span>
                <span className="summary-value">{adherenceRate}%</span>
                <span className="summary-hint">Tỷ lệ tuân thủ dùng thuốc</span>
            </div>
            <div className="summary-card red">
                <span className="summary-label">Rủi Ro An Toàn</span>
                <span className="summary-value">{safetyRisks}</span>
                <span className="summary-hint">Lỗi ưu tiên cao</span>
            </div>
        </section>
    );
};

export default ReportSummaryCards;
