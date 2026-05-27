import { AlertCircle } from 'lucide-react';
import type { ComprehensiveReport } from '../../types/report.types';
import './ReportSections.css';

interface MedicationAdherenceSectionProps {
    data: ComprehensiveReport;
}

const MedicationAdherenceSection = ({ data }: MedicationAdherenceSectionProps) => {
    const totalReminders = data.medicationAdherence.acknowledgedCount + data.medicationAdherence.missedRemindersCount;
    const adherenceRate = totalReminders > 0
        ? Math.round((data.medicationAdherence.acknowledgedCount / totalReminders) * 100)
        : 0;

    return (
        <div className="report-section slide-in">
            <div className="section-header">
                <h2>Tuân Thủ Uống Thuốc</h2>
                <p>Theo dõi an toàn dựa trên xác nhận nhắc nhở</p>
            </div>
            
            <div className="metrics-grid">
                <div className="metric-card">
                    <h4>Thuốc đang theo dõi</h4>
                    <p className="value">{data.medicationAdherence.activeMedications}</p>
                </div>
                <div className="metric-card">
                    <h4>Tỷ lệ tuân thủ</h4>
                    <p className="value success">{adherenceRate}%</p>
                </div>
                <div className="metric-card">
                    <h4>Liều bỏ lỡ</h4>
                    <p className="value danger">{data.medicationAdherence.missedRemindersCount}</p>
                </div>
                <div className="metric-card">
                    <h4>Liều đã xác nhận</h4>
                    <p className="value">{data.medicationAdherence.acknowledgedCount}</p>
                </div>
            </div>

            <div className="stat-info-box">
                <AlertCircle size={20} />
                <p>
                    <strong>Lưu ý An Toàn:</strong> Tỷ lệ tuân thủ được suy ra từ các tương tác hệ thống.
                    Đây không phải là xác minh kỹ thuật số về việc uống thuốc thực tế.
                </p>
            </div>
        </div>
    );
};

export default MedicationAdherenceSection;
