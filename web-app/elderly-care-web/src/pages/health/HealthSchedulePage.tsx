import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Upload, Plus, ChevronLeft, ChevronRight, CheckCircle2, Clock, User, Edit2, Trash2, FileSpreadsheet } from 'lucide-react';
import { medicationService } from '../../services/medication.service';
import { type Medication } from '../../api/medication.api';
import { appointmentApi } from '../../api/appointment.api';
import { reminderApi, type Reminder } from '../../api/reminder.api';
import { medicationApi } from '../../api/medication.api';
import MedicationForm from '../../components/medication/MedicationForm';
import AppointmentForm from '../../components/appointment/AppointmentForm';
import { useAuth } from '../../context/AuthContext';
import { socketService } from '../../services/socket.service';
import { ImportExcelModal } from '../../components/import/ImportExcelModal';
//import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import './HealthSchedulePage.css';

type Tab = 'medication' | 'appointment';

interface AppointmentItem {
  id: string;
  doctorName: string;
  specialty?: string;
  location: string;
  notes?: string;
  status?: string;
  appointmentDate: string;
}

interface SocketStatusData {
  reminderId: string;
  status: number;
  updatedReminder?: { scheduledTime: string };
}

const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function getMonthDates(offset: number): Date[] {
  const now = new Date();
  const targetMonth = now.getMonth() + offset;
  const firstDay = new Date(now.getFullYear(), targetMonth, 1);
  const lastDay = new Date(now.getFullYear(), targetMonth + 1, 0);
  
  const dates: Date[] = [];
  
  let dayOfWeek = firstDay.getDay();
  let startOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  for (let i = startOffset; i > 0; i--) {
    dates.push(new Date(firstDay.getFullYear(), firstDay.getMonth(), 1 - i));
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    dates.push(new Date(firstDay.getFullYear(), firstDay.getMonth(), i));
  }
  
  const remaining = Math.ceil(dates.length / 7) * 7 - dates.length;
  for (let i = 1; i <= remaining; i++) {
    dates.push(new Date(lastDay.getFullYear(), lastDay.getMonth() + 1, i));
  }
  
  return dates;
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
    const h = d.getHours();
    const m = d.getMinutes();
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const ampm = h >= 12 ? 'CH' : 'SA';
    return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  }
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'CH' : 'SA';
  const hour = h % 12 || 12;
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

export const HealthSchedulePage = () => {
  const { t, i18n } = useTranslation();
  const { user, managedElderly } = useAuth();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('id');
  const targetUserName = searchParams.get('name');
  
  // Use targetUserId from URL, or fall back to managedElderly or current user
  const activeUserId = targetUserId || managedElderly?.id || user?.id;

  const [activeTab, setActiveTab] = useState<Tab>('medication');
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDateState, setSelectedDateState] = useState<Date>(new Date());

  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showMedForm, setShowMedForm] = useState(false);
  const [showApptForm, setShowApptForm] = useState(false);
  const [editMedId, setEditMedId] = useState<string | null>(null);
  const [editAppt, setEditAppt] = useState<AppointmentItem | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState<'medication' | 'appointment'>('medication');

  const monthDates = getMonthDates(monthOffset);
  const selectedDate = selectedDateState;

  // ─── Data Fetching ───────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [medsData, apptsRes, remindersRes] = await Promise.all([
        medicationService.getMedications(activeUserId || undefined),
        appointmentApi.getAll(activeUserId || undefined),
        reminderApi.getReminders(activeUserId || undefined).catch(() => ({ data: [] }))
      ]);

      setMedications(medsData);
      setReminders(remindersRes.data || []);

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
  }, [activeUserId, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Socket ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    socketService.connect();

    const handleStatusUpdated = (data: SocketStatusData) => {
      console.log('Socket status_updated received in HealthSchedule:', data);
      console.log('Current reminders:', reminders.map(r => ({ id: r.id, status: r.status })));
      const status = (typeof data.status === 'number' ? data.status : 1) as 0 | 1 | 2;
      setReminders(prev => prev.map(r =>
          r.id === data.reminderId ? { ...r, status } : r
      ));
      fetchData();
  };

    const handleMedicationMissed = (data: SocketStatusData) => {
        console.log('Socket medication_missed received in HealthSchedule:', data);
        setReminders(prev => prev.map(r =>
            r.id === data.reminderId ? { ...r, status: 2 as 0 | 1 | 2 } : r
        ));
        fetchData();
        toast.error(
            `⚠️ Cảnh báo: Người thân đã bỏ lỡ lịch uống thuốc lúc ${data.updatedReminder?.scheduledTime
                ? new Date(data.updatedReminder.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : ''}!`,
            { position: 'top-right', autoClose: 10000 }
        );
    };

    socketService.on('status_updated', handleStatusUpdated);
    socketService.on('medication_missed', handleMedicationMissed);

    return () => {
        socketService.off('status_updated', handleStatusUpdated);
        socketService.off('medication_missed', handleMedicationMissed);
    };
}, [fetchData]);

  const getMedReminderStatusInfo = (medId: string, time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const targetDate = new Date(selectedDate);
    targetDate.setHours(hour, minute, 0, 0);

    const r = reminders.find(rem => {
      if (rem.type !== 0) return false;
      if (rem.referenceId !== medId) return false;
      const rTime = new Date(rem.scheduledTime);
      return rTime.getFullYear() === targetDate.getFullYear() &&
        rTime.getMonth() === targetDate.getMonth() &&
        rTime.getDate() === targetDate.getDate() &&
        rTime.getHours() === targetDate.getHours() &&
        rTime.getMinutes() === targetDate.getMinutes();
    });

    if (!r) return { text: '🟡 Đang chờ', className: 'pending' };
    if (r.status === 1) return { text: '🟢 Đã xong', className: 'done' };
    if (r.status === 2) return { text: '🔴 Bỏ lỡ', className: 'missed' };
    return { text: '🟡 Đang chờ', className: 'pending' };
  };

  // ─── Filter by selected day ──────────────────────────────────────────────────
  const todayMeds = medications.filter(med => {
    if (med.status !== 'Active') return false;
    // Parse date-only (yyyy-MM-dd) to avoid UTC→local timezone shift
    const startStr = med.startDate.substring(0, 10); // "2026-06-01"
    const [sy, sm, sd] = startStr.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);

    let end: Date | null = null;
    if (med.endDate) {
      const endStr = med.endDate.substring(0, 10);
      const [ey, em, ed] = endStr.split('-').map(Number);
      end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
    }

    const sel = new Date(selectedDate);
    sel.setHours(12, 0, 0, 0);
    return sel >= start && (!end || sel <= end);
  });

  const todayApts = appointments.filter(apt => {
    if (!apt.appointmentDate) return false;
    return isSameDay(new Date(apt.appointmentDate), selectedDate);
  });

  // Sort medications by time (newest first - descending order)
  const sortedTodayMeds = todayMeds.flatMap(med =>
    getMedTimes(med).map((time, idx) => ({
      med,
      time,
      idx,
      timeValue: time
    }))
  ).sort((a, b) => {
    // Parse time strings for comparison (HH:MM format)
    const [aHour, aMin] = a.timeValue.split(':').map(Number);
    const [bHour, bMin] = b.timeValue.split(':').map(Number);
    const aMinutes = aHour * 60 + aMin;
    const bMinutes = bHour * 60 + bMin;
    return bMinutes - aMinutes; // Descending order (newest first)
  });

  // Sort appointments by time (newest first - descending order)
  const sortedTodayApts = todayApts.sort((a, b) => {
    const aTime = new Date(a.appointmentDate).getTime();
    const bTime = new Date(b.appointmentDate).getTime();
    return bTime - aTime; // Descending order (newest first)
  });

  function getMedTimes(med: Medication): string[] {
    if (med.frequency?.specificTimes?.length) {
      return med.frequency.specificTimes;
    }
    const count = med.frequency?.timesPerDay ?? 1;
    const defaults = ['08:00', '12:00', '18:00', '21:00'];
    return defaults.slice(0, count);
  }

  // ─── Handlers ────────────────────────────────────────────────────────────────
  function isAptDone(status?: string) {
    if (!status) return false;
    return status === 'Completed' || status === 'completed';
  }

  const handleManualInput = () => {
    if (activeTab === 'medication') {
      setEditMedId(null);
      setShowMedForm(true);
    } else {
      setEditAppt(null);
      setShowApptForm(true);
    }
  };

  const handleOpenImport = () => {
    setImportType(activeTab === 'medication' ? 'medication' : 'appointment');
    setShowImportModal(true);
  };

  const handleImportMedication = async (file: File) => {
    if (!activeUserId) throw new Error('Không xác định được người dùng');
    const res = await medicationApi.importFromExcel(activeUserId, file);
    fetchData();
    return res.data;
  };

  const handleImportAppointment = async (file: File) => {
    if (!activeUserId) throw new Error('Không xác định được người dùng');
    const res = await appointmentApi.importFromExcel(activeUserId, file);
    fetchData();
    return res.data;
  };

  const medicationTemplateData = [
    {
      'Tên thuốc': 'Aspirin',
      'Liều lượng (số)': 100,
      'Đơn vị': 'mg',
      'Số lần/ngày': 2,
      'Giờ uống (HH:mm, cách nhau bằng dấu phẩy)': '08:00,20:00',
      'Hướng dẫn': 'Uống sau ăn',
      'Ngày bắt đầu (yyyy-MM-dd)': '2026-06-01',
      'Ngày kết thúc (yyyy-MM-dd)': '2026-12-31',
    },
  ];

  const appointmentTemplateData = [
    {
      'Tên bác sĩ': 'BS. Nguyễn Văn A',
      'Địa điểm': 'Bệnh viện Bạch Mai',
      'Ngày giờ khám (yyyy-MM-dd HH:mm)': '2026-06-15 09:00',
      'Ghi chú': 'Mang theo hồ sơ bệnh án',
    },
  ];

  const handleEditMed = (id: string) => {
    setEditMedId(id);
    setShowMedForm(true);
  };

  const handleDeleteMed = async (id: string) => {
    if (window.confirm(t('confirm_delete') || 'Bạn có chắc chắn muốn xoá?')) {
      try {
        await medicationService.deleteMedication(id);
        toast.success(t('delete_success') || 'Đã xoá thành công');
        
        // Emit socket event for real-time sync
        socketService.emitMedicationDeleted(id, activeUserId);
        
        fetchData();
      } catch {
        toast.error(t('delete_error') || 'Xoá thất bại');
      }
    }
  };

  const handleEditAppt = (apt: AppointmentItem) => {
    setEditAppt(apt);
    setShowApptForm(true);
  };

  const handleDeleteAppt = async (id: string) => {
    if (window.confirm(t('confirm_delete') || 'Bạn có chắc chắn muốn xoá?')) {
      try {
        await appointmentApi.delete(id);
        toast.success(t('delete_success') || 'Đã xoá thành công');
        
        // Emit socket event for real-time sync
        socketService.emitAppointmentDeleted(id, activeUserId);
        
        fetchData();
      } catch {
        toast.error(t('delete_error') || 'Xoá thất bại');
      }
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <div className="header-with-user">
          <h1>{t('health_schedule')}</h1>
          {targetUserName && (
            <div className="user-badge">
              <User size={16} />
              <span>{targetUserName}</span>
            </div>
          )}
        </div>
      </div>

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
        <div className="schedule-left">
          <div className="schedule-actions">
            <button className="action-btn primary" onClick={handleManualInput}>
              <Plus size={16} /> {t('manual_input')}
            </button>
            <button className="action-btn secondary" onClick={handleOpenImport}>
              <FileSpreadsheet size={16} /> {t('Nhập từ file Excel') || 'Import Excel'}
            </button>
          </div>

          <div className="week-calendar">
            <div className="week-nav">
              <button onClick={() => setMonthOffset(m => m - 1)}><ChevronLeft size={18} /></button>
              <span className="week-label">
                Tháng {new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset).getMonth() + 1} / {new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset).getFullYear()}
              </span>
              <button onClick={() => setMonthOffset(m => m + 1)}><ChevronRight size={18} /></button>
            </div>

            <div className="month-days-header">
              {DAYS.map(label => (
                <div key={label} className="day-header-label">{label}</div>
              ))}
            </div>

            <div className="month-grid">
              {monthDates.map((d, i) => {
                const isSelected = isSameDay(d, selectedDate);
                const isToday = isSameDay(d, new Date());
                const isCurrentMonth = d.getMonth() === new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset).getMonth();
                
                const hasMed = medications.some(med => {
                  if (med.status !== 'Active') return false;
                  const startStr = med.startDate.substring(0, 10);
                  const [sy, sm, sd] = startStr.split('-').map(Number);
                  const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
                  let end: Date | null = null;
                  if (med.endDate) {
                    const endStr = med.endDate.substring(0, 10);
                    const [ey, em, ed] = endStr.split('-').map(Number);
                    end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
                  }
                  const dd = new Date(d); dd.setHours(12, 0, 0, 0);
                  return dd >= start && (!end || dd <= end);
                });
                const hasApt = appointments.some(apt =>
                  apt.appointmentDate && isSameDay(new Date(apt.appointmentDate), d)
                );
                return (
                  <button
                    key={i}
                    className={`day-btn ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
                    onClick={() => setSelectedDateState(d)}
                  >
                    <span className="day-date">{d.getDate()}</span>
                    {(hasMed || hasApt) && !isSelected && <span className="day-dot" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="schedule-list">
            <h3 className="list-heading">
              {selectedDate.toLocaleDateString(i18n.language === 'vn' ? 'vi-VN' : 'en-US', { weekday: 'long', day: 'numeric', month: 'numeric' })}
            </h3>

            {loading && <p className="empty-msg">{t('loading_data')}</p>}
            {error && <p className="empty-msg error">{error}</p>}

            {!loading && activeTab === 'medication' && (
              sortedTodayMeds.length === 0
                ? <p className="empty-msg">{t('no_meds_day')}</p>
                : sortedTodayMeds.map(({ med, time, idx }) => {
                    const statusInfo = getMedReminderStatusInfo(med.id, time);
                    return (
                      <div className="schedule-item" key={`${med.id}-${idx}`}>
                        <div className="item-time">{formatTime(time)}</div>
                        <div className="item-info">
                          <div className="item-name">{med.name}</div>
                          <div className="item-sub">
                            {med.dosage.amount} {med.dosage.unit}
                            {med.instructions ? ` · ${med.instructions}` : ''}
                          </div>
                        </div>
                        <div className={`item-status ${statusInfo.className}`}>
                          {statusInfo.text}
                        </div>
                        <div className="item-actions">
                          <button className="action-icon-btn" onClick={() => handleEditMed(med.id)} title={t('edit') || 'Sửa'}>
                            <Edit2 size={16} />
                          </button>
                          <button className="action-icon-btn delete" onClick={() => handleDeleteMed(med.id)} title={t('delete') || 'Xoá'}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })
            )}

            {!loading && activeTab === 'appointment' && (
              sortedTodayApts.length === 0
                ? <p className="empty-msg">{t('no_appts_day')}</p>
                : sortedTodayApts.map(apt => (
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
                    <div className="item-actions">
                      <button className="action-icon-btn" onClick={() => handleEditAppt(apt)} title={t('edit') || 'Sửa'}>
                        <Edit2 size={16} />
                      </button>
                      <button className="action-icon-btn delete" onClick={() => handleDeleteAppt(apt.id)} title={t('delete') || 'Xoá'}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* <div className="schedule-right">
          <div className="import-info-card">
            <FileSpreadsheet size={32} className="import-info-icon" />
            <h3>{t('EXCEL') || 'Import từ Excel'}</h3>
            <p>
              {activeTab === 'medication'
                ? (t('Nhập danh sách thuốc từ file excel') || 'Nhập danh sách thuốc hàng loạt từ file Excel.')
                : (t('Nhập danh sách lịch khám từ file excel') || 'Nhập danh sách lịch khám hàng loạt từ file Excel.')}
            </p>
            <button className="action-btn secondary" onClick={handleOpenImport}>
              <Upload size={16} /> {t('Tải excel lên') || 'Import Excel'}
            </button>
          </div>
        </div> */}
      </div>

      <MedicationForm
        isOpen={showMedForm}
        onClose={() => { setShowMedForm(false); setEditMedId(null); }}
        editingId={editMedId}
        medications={medications}
        onSuccess={fetchData}
        userId={activeUserId}
      />

      <AppointmentForm
        isOpen={showApptForm}
        onClose={() => { setShowApptForm(false); setEditAppt(null); }}
        editingAppointment={editAppt ? {
          ...editAppt,
          status: editAppt.status as 'Completed' | 'Upcoming' | 'Missed' | 'Cancelled' | undefined,
        } : null}
        onSuccess={fetchData}
        userId={activeUserId}
      />

      {/* Import Excel Modal */}
      <ImportExcelModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={importType === 'medication' ? handleImportMedication : handleImportAppointment}
        title={importType === 'medication'
          ? (t('Tải danh sách thuôc') || 'Import danh sách thuốc')
          : (t('Tải danh sách lịch khám') || 'Import lịch khám')}
        description={importType === 'medication'
          ? (t('') || 'Tải lên file Excel chứa danh sách thuốc.')
          : (t('') || 'Tải lên file Excel chứa danh sách lịch khám.')}
        templateData={importType === 'medication' ? medicationTemplateData : appointmentTemplateData}
        templateFilename={importType === 'medication' ? 'template_thuoc.csv' : 'template_lich_kham.csv'}
      />
    </div>
  );
};