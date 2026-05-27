import { useTranslation } from 'react-i18next';
import type { ComprehensiveReport } from '../../types/report.types';

interface AppointmentComplianceSectionProps {
    data: ComprehensiveReport;
}

const AppointmentComplianceSection = ({ data }: AppointmentComplianceSectionProps) => {
    const { t } = useTranslation();
    const complianceRate = data.appointmentCompliance.totalAppointments > 0
        ? Math.round((data.appointmentCompliance.withReminders / data.appointmentCompliance.totalAppointments) * 100)
        : 0;

    const getRiskDescription = () => {
        const count = data.appointmentCompliance.noShowRiskCount;
        if (count === 0) return t('risk_excellent');
        if (count <= 2) return t('risk_low');
        if (count <= 5) return t('risk_medium');
        return t('risk_high');
    };

    return (
        <div className="report-section slide-in">
            <div className="section-header">
                <h2>{t('appointment_compliance_audit')}</h2>
                <p>{t('appointment_compliance_desc')}</p>
            </div>
            <div className="section-grid">
                <div className="stats-panel">
                    <div className="stat-row">
                        <span>{t('total_appointments')}</span>
                        <strong>{data.appointmentCompliance.totalAppointments}</strong>
                    </div>
                    <div className="stat-row">
                        <span>{t('protected_with_reminders')}</span>
                        <strong className="text-success">{data.appointmentCompliance.withReminders}</strong>
                    </div>
                    <div className="stat-row">
                        <span>{t('unprotected_risk')}</span>
                        <strong className="text-danger">{data.appointmentCompliance.withoutReminders}</strong>
                    </div>
                    <div className="stat-row">
                        <span>{t('compliance_rate_label')}</span>
                        <strong>{complianceRate}%</strong>
                    </div>
                    <div className="stat-row">
                        <span>{t('delivered_before_appointment')}</span>
                        <strong>{data.appointmentCompliance.deliveredBefore}</strong>
                    </div>
                </div>
                <div className="chart-container">
                    <h3>{t('no_show_risk_indicator')}</h3>
                    <p>{t('no_show_risk_desc')}</p>
                    <h1 className="risk-level" style={{ 
                        color: data.appointmentCompliance.noShowRiskCount > 5 ? '#e74c3c' : 
                               data.appointmentCompliance.noShowRiskCount > 2 ? '#f1c40f' : '#2ecc71'
                    }}>
                        {data.appointmentCompliance.noShowRiskCount}
                    </h1>
                    <p className="risk-description">
                        {getRiskDescription()}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AppointmentComplianceSection;
