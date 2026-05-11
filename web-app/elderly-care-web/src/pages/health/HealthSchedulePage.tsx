// src/pages/schedule/HealthSchedulePage.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Plus, ChevronLeft, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { medicationService } from '../../services/medication.service';
import { type Medication } from '../../api/medication.api';
import { appointmentApi } from '../../api/appointment.api';
import MedicationForm from '../../components/medication/MedicationForm';
import AppointmentForm from '../../components/appointment/AppointmentForm';
import './HealthSchedulePage.css';

type Tab = 'medication' | 'appointment';

// Appointment type gộp cả mock (dateTime) lẫn real API (appointmentDate)
interface AppointmentItem {
  id: string;
  doctorName: string;
  specialty?: string;
  location: string;
  notes?: string;
  status?: string;
  appointmentDate: string; // chuẩn hoá về đây
}

const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function getWeekDates(offset: number): Date[] {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  if (timeStr.includes('T') || timeStr.length > 8) {
    const d = new Date(timeStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

export const HealthSchedulePage = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('medication');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  });

  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form states
  const [showMedForm, setShowMedForm] = useState(false);
  const [showApptForm, setShowApptForm] = useState(false);

  const weekDates = getWeekDates(weekOffset);
  const selectedDate = weekDates[selectedDayIndex];

  // ─── Data Fetching ───────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [medsData, apptsRes] = await Promise.all([
        medicationService.getMedications(),
        appointmentApi.getAll()
      ]);

      setMedications(medsData);

      // Normalise appointments: handle both `appointmentDate` and mock `dateTime`
      const apptsArray = Array.isArray(apptsRes.data) ? apptsRes.data : [];
      const normalised: AppointmentItem[] = apptsArray.map(apt => ({
        id: apt.id,
        doctorName: apt.doctorName,
        specialty: apt.specialty,
        location: apt.location,
        notes: apt.notes,
        status: apt.status,
        appointmentDate: apt.appointmentDate ?? apt.dateTime,
      }));
      setAppointments(normalised);
    } catch (err) {
      console.error('[HealthSchedulePage] Fetch error:', err);
      setError(t('loading_data_error') || 'Không thể tải dữ liệu lịch trình. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ─── Filter by selected day ──────────────────────────────────────────────────

  // Thuốc: hiển thị nếu ngày chọn nằm trong khoảng startDate–endDate và status Active
  const todayMeds = medications.filter(med => {
    if (med.status !== 'Active') return false;
    const start = new Date(med.startDate);
    start.setHours(0, 0, 0, 0);
    const end = med.endDate ? new Date(med.endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);
    const sel = new Date(selectedDate);
    sel.setHours(12, 0, 0, 0);
    return sel >= start && (!end || sel <= end);
  });

  // Lịch khám: so sánh cùng ngày
  const todayApts = appointments.filter(apt => {
    if (!apt.appointmentDate) return false;
    return isSameDay(new Date(apt.appointmentDate), selectedDate);
  });

  // ─── Lấy danh sách giờ uống từ Medication ───────────────────────────────────
  function getMedTimes(med: Medication): string[] {
    if (med.frequency?.specificTimes?.length) {
      return med.frequency.specificTimes;
    }
    // fallback: chia đều theo timesPerDay
    const count = med.frequency?.timesPerDay ?? 1;
    const defaults = ['08:00', '12:00', '18:00', '21:00'];
    return defaults.slice(0, count);
  }

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  function isAptDone(status?: string) {
    if (!status) return false;
    return status === 'Completed' || status === 'completed';
  }

  const handleManualInput = () => {
    if (activeTab === 'medication') {
      setShowMedForm(true);
    } else {
      setShowApptForm(true);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="schedule-page">
      {/* Header */}
      <div className="schedule-header">
        <h1>{t('health_schedule')}</h1>
      </div>

      {/* Tabs */}
      <div className="schedule-tabs">
        <button
          className={`tab-btn ${activeTab === 'medication' ? 'active' : ''}`}
          onClick={() => setActiveTab('medication')}
        >
          {t('med_schedule')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'appointment' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointment')}
        >
          {t('appt_schedule')}
        </button>
      </div>

      <div className="schedule-body">
        {/* ── Left Panel ── */}
        <div className="schedule-left">

          {/* Action Buttons */}
          <div className="schedule-actions">
            <button className="action-btn primary" onClick={handleManualInput}>
              <Plus size={16} /> {t('manual_input')}
            </button>
            {/* <button className="action-btn secondary">
              <Upload size={16} /> Import từ File (Word/Excel)
            </button> */}
          </div>

          {/* Week Calendar */}
          <div className="week-calendar">
            <div className="week-nav">
              <button onClick={() => setWeekOffset(w => w - 1)}><ChevronLeft size={18} /></button>
              <span className="week-label">
                {weekDates[0].getDate()}/{weekDates[0].getMonth() + 1}
                {' – '}
                {weekDates[6].getDate()}/{weekDates[6].getMonth() + 1}
              </span>
              <button onClick={() => setWeekOffset(w => w + 1)}><ChevronRight size={18} /></button>
            </div>

            <div className="week-days">
              {DAYS.map((label, i) => {
                const d = weekDates[i];
                const isSelected = i === selectedDayIndex;
                const isToday = isSameDay(d, new Date());
                // dot nếu ngày đó có dữ liệu
                const hasMed = medications.some(med => {
                  if (med.status !== 'Active') return false;
                  const start = new Date(med.startDate); start.setHours(0, 0, 0, 0);
                  const end = med.endDate ? new Date(med.endDate) : null;
                  if (end) end.setHours(23, 59, 59, 999);
                  const dd = new Date(d); dd.setHours(12, 0, 0, 0);
                  return dd >= start && (!end || dd <= end);
                });
                const hasApt = appointments.some(apt =>
                  apt.appointmentDate && isSameDay(new Date(apt.appointmentDate), d)
                );
                return (
                  <button
                    key={i}
                    className={`day-btn ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => setSelectedDayIndex(i)}
                  >
                    <span className="day-label">{label}</span>
                    <span className="day-date">{d.getDate()}</span>
                    {(hasMed || hasApt) && !isSelected && <span className="day-dot" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schedule List */}
          <div className="schedule-list">
            <h3 className="list-heading">
              {selectedDate.toLocaleDateString(i18n.language === 'vn' ? 'vi-VN' : 'en-US', { weekday: 'long', day: 'numeric', month: 'numeric' })}
            </h3>

            {loading && <p className="empty-msg">{t('loading_data')}</p>}
            {error && <p className="empty-msg error">{error}</p>}

            {/* ── Tab: Lịch uống thuốc ── */}
            {!loading && activeTab === 'medication' && (
              todayMeds.length === 0
                ? <p className="empty-msg">{t('no_meds_day')}</p>
                : todayMeds.flatMap(med =>
                  getMedTimes(med).map((time, idx) => (
                    <div className="schedule-item" key={`${med.id}-${idx}`}>
                      <div className="item-time">{formatTime(time)}</div>
                      <div className="item-info">
                        <div className="item-name">{med.name}</div>
                        <div className="item-sub">
                          {med.dosage.amount} {med.dosage.unit}
                          {med.instructions ? ` · ${med.instructions}` : ''}
                        </div>
                      </div>
                      <div className="item-status pending">
                        <Clock size={13} /> {t('pending')}
                      </div>
                    </div>
                  ))
                )
            )}

            {/* ── Tab: Lịch khám ── */}
            {!loading && activeTab === 'appointment' && (
              todayApts.length === 0
                ? <p className="empty-msg">{t('no_appts_day')}</p>
                : todayApts.map(apt => (
                  <div className="schedule-item" key={apt.id}>
                    <div className="item-time">{formatTime(apt.appointmentDate)}</div>
                    <div className="item-info">
                      <div className="item-name">{apt.doctorName}</div>
                      <div className="item-sub">
                        {apt.specialty ? `${apt.specialty} · ` : ''}{apt.location}
                      </div>
                    </div>
                    <div className={`item-status ${isAptDone(apt.status) ? 'done' : 'pending'}`}>
                      {isAptDone(apt.status)
                        ? <><CheckCircle2 size={13} /> {t('completed')}</>
                        : <><Clock size={13} /> {t('pending')}</>}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* ── Right Panel — Import ── */}
        <div className="schedule-right">
          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
          >
            <Upload size={36} className="upload-icon" />
            <p>{t('drag_drop_file')}</p>
            <label className="upload-link">
              {t('choose_file')}
              <input
                type="file"
                accept=".doc,.docx,.xls,.xlsx"
                hidden
                onChange={handleFileInput}
              />
            </label>
          </div>

          <div className="upload-selected">
            {t('selected_file')} {selectedFile ? selectedFile.name : t('none')}
          </div>

          <button
            className="upload-btn"
            disabled={!selectedFile}
            onClick={() => alert(`Upload: ${selectedFile?.name}`)}
          >
            {t('upload')}
          </button>
        </div>
      </div>

      {/* Manual Input Forms */}
      <MedicationForm
        isOpen={showMedForm}
        onClose={() => setShowMedForm(false)}
        editingId={null}
        medications={medications}
        onSuccess={fetchData}
      />

      <AppointmentForm
        isOpen={showApptForm}
        onClose={() => setShowApptForm(false)}
        editingAppointment={null}
        onSuccess={fetchData}
      />
    </div>
  );
};