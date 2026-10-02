import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  RefreshCw,
  User,
  ShieldAlert,
  Sliders,
  Coffee,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { Doctor, DoctorWorkingHours, DoctorException, BlockedSlot, TimeSlot } from '../types';

interface AdminAvailabilityProps {
  onAvailabilityChanged?: () => void;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const AdminAvailability: React.FC<AdminAvailabilityProps> = ({ onAvailabilityChanged }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(now);
  });

  const [schedule, setSchedule] = useState<DoctorWorkingHours[]>([]);
  const [exceptions, setExceptions] = useState<DoctorException[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [daySlotsPreview, setDaySlotsPreview] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // New Exception Form state
  const [newExDate, setNewExDate] = useState('');
  const [newExStart, setNewExStart] = useState('09:00');
  const [newExEnd, setNewExEnd] = useState('18:00');
  const [newExReason, setNewExReason] = useState('');
  const [newExType, setNewExType] = useState('leave');
  const [isAddingEx, setIsAddingEx] = useState(false);

  // New Blocked Slot Form state
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockStart, setNewBlockStart] = useState('14:00');
  const [newBlockEnd, setNewBlockEnd] = useState('15:00');
  const [newBlockReason, setNewBlockReason] = useState('');
  const [isAddingBlock, setIsAddingBlock] = useState(false);

  // Active sub-tab
  const [subTab, setSubTab] = useState<'schedule' | 'exceptions' | 'blocked' | 'timeline'>('schedule');

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctorId) {
      loadDoctorData(selectedDoctorId);
    }
  }, [selectedDoctorId]);

  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      loadDayPreview(selectedDoctorId, selectedDate);
    }
  }, [selectedDoctorId, selectedDate]);

  const loadDoctors = async () => {
    try {
      const res = await apiClient.getDoctors();
      setDoctors(res.doctors);
      if (res.doctors.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(res.doctors[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadDoctorData = async (docId: string) => {
    setIsLoading(true);
    try {
      const [schedRes, blockRes] = await Promise.all([
        apiClient.getDoctorSchedule(docId),
        apiClient.getDoctorBlockedSlots(docId),
      ]);
      setSchedule(schedRes.schedule || []);
      setBlockedSlots(blockRes.blockedSlots || []);

      const doc = doctors.find((d) => d.id === docId);
      if (doc) {
        setExceptions(doc.exceptions || []);
      }

      loadDayPreview(docId, selectedDate);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDayPreview = async (docId: string, date: string) => {
    try {
      const res = await apiClient.getAvailableSlots(docId, date);
      setDaySlotsPreview(res.slots);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateScheduleDay = (
    day: string,
    field: keyof DoctorWorkingHours,
    value: any
  ) => {
    setSchedule((prev) =>
      prev.map((s) => (s.dayOfWeek.toLowerCase() === day.toLowerCase() ? { ...s, [field]: value } : s))
    );
  };

  const handleUpdateBreak = (
    day: string,
    breakStart: string,
    breakEnd: string
  ) => {
    setSchedule((prev) =>
      prev.map((s) => {
        if (s.dayOfWeek.toLowerCase() === day.toLowerCase()) {
          return {
            ...s,
            breaks: [{ startTime: breakStart, endTime: breakEnd, label: 'Break' }],
          };
        }
        return s;
      })
    );
  };

  const handleSaveSchedule = async () => {
    if (!selectedDoctorId) return;
    setIsLoading(true);
    try {
      await apiClient.updateDoctorSchedule(selectedDoctorId, schedule);
      setSaveSuccessMsg('Doctor schedule saved successfully.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      loadDayPreview(selectedDoctorId, selectedDate);
      if (onAvailabilityChanged) onAvailabilityChanged();
    } catch (err: any) {
      alert(err.message || 'Failed to save schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !newExDate || !newExReason) return;

    try {
      const res = await apiClient.addDoctorException(selectedDoctorId, {
        date: newExDate,
        startTime: newExStart,
        endTime: newExEnd,
        reason: newExReason,
        exceptionType: newExType,
      });
      setExceptions((prev) => [...prev, res.exception]);
      setIsAddingEx(false);
      setNewExReason('');
      setSaveSuccessMsg(`Exception for ${newExDate} added.`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      loadDayPreview(selectedDoctorId, selectedDate);
      if (onAvailabilityChanged) onAvailabilityChanged();
    } catch (err: any) {
      alert(err.message || 'Failed to add exception');
    }
  };

  const handleDeleteException = async (exId: string) => {
    if (!selectedDoctorId) return;
    try {
      await apiClient.deleteDoctorException(selectedDoctorId, exId);
      setExceptions((prev) => prev.filter((e) => e.id !== exId));
      loadDayPreview(selectedDoctorId, selectedDate);
      if (onAvailabilityChanged) onAvailabilityChanged();
    } catch (err: any) {
      alert(err.message || 'Failed to delete exception');
    }
  };

  const handleAddBlockedSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !newBlockDate || !newBlockReason) return;

    try {
      const res = await apiClient.addDoctorBlockedSlot(selectedDoctorId, {
        blockedDate: newBlockDate,
        startTime: newBlockStart,
        endTime: newBlockEnd,
        reason: newBlockReason,
      });
      setBlockedSlots((prev) => [...prev, res.blockedSlot]);
      setIsAddingBlock(false);
      setNewBlockReason('');
      setSaveSuccessMsg(`Slot block on ${newBlockDate} created.`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      loadDayPreview(selectedDoctorId, selectedDate);
      if (onAvailabilityChanged) onAvailabilityChanged();
    } catch (err: any) {
      alert(err.message || 'Failed to block slot');
    }
  };

  const handleDeleteBlockedSlot = async (slotId: string) => {
    try {
      await apiClient.deleteDoctorBlockedSlot(slotId);
      setBlockedSlots((prev) => prev.filter((b) => b.id !== slotId));
      loadDayPreview(selectedDoctorId, selectedDate);
      if (onAvailabilityChanged) onAvailabilityChanged();
    } catch (err: any) {
      alert(err.message || 'Failed to delete blocked slot');
    }
  };

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  return (
    <div className="space-y-6">
      {/* Header & Doctor Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[#202321]/8 gap-4">
        <div>
          <span className="text-xs uppercase font-mono text-[#78958B] tracking-widest block mb-1">
            CLINICAL AVAILABILITY ENGINE
          </span>
          <h2 className="font-serif text-2xl font-normal text-[#202321]">
            Doctor Schedules, Exceptions & Slot Blocks
          </h2>
          <p className="text-xs text-[#202321]/60 font-light mt-0.5">
            Manage working hours, breaks, leaves, and instant slot locks with real-time patient calendar sync.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Doctor Dropdown */}
          <div className="relative">
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="bg-[#F7F5F0] border border-[#202321]/15 rounded-xl px-4 py-2 text-xs font-mono text-[#202321] focus:outline-none focus:border-[#173A35]"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialtyName || d.title})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => selectedDoctorId && loadDoctorData(selectedDoctorId)}
            className="p-2 rounded-xl border border-[#202321]/15 hover:border-[#173A35] text-[#202321] transition-colors"
            title="Refresh availability"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#173A35]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {saveSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#202321]/8 pb-2 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setSubTab('schedule')}
          className={`px-4 py-2 rounded-full transition-all ${
            subTab === 'schedule'
              ? 'bg-[#173A35] text-[#F7F5F0]'
              : 'text-[#202321]/70 hover:text-[#202321]'
          }`}
        >
          Weekly Working Hours & Breaks
        </button>

        <button
          onClick={() => setSubTab('exceptions')}
          className={`px-4 py-2 rounded-full transition-all ${
            subTab === 'exceptions'
              ? 'bg-[#173A35] text-[#F7F5F0]'
              : 'text-[#202321]/70 hover:text-[#202321]'
          }`}
        >
          Exceptions & Leave ({exceptions.length})
        </button>

        <button
          onClick={() => setSubTab('blocked')}
          className={`px-4 py-2 rounded-full transition-all ${
            subTab === 'blocked'
              ? 'bg-[#173A35] text-[#F7F5F0]'
              : 'text-[#202321]/70 hover:text-[#202321]'
          }`}
        >
          Manual Blocked Slots ({blockedSlots.length})
        </button>

        <button
          onClick={() => setSubTab('timeline')}
          className={`px-4 py-2 rounded-full transition-all ${
            subTab === 'timeline'
              ? 'bg-[#173A35] text-[#F7F5F0]'
              : 'text-[#202321]/70 hover:text-[#202321]'
          }`}
        >
          Real-Time Slot Preview
        </button>
      </div>

      {/* TAB 1: WORKING HOURS & BREAKS */}
      {subTab === 'schedule' && (
        <div className="space-y-6">
          <div className="bg-[#F7F5F0] border border-[#202321]/10 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-4 bg-[#EAE6DE]/70 border-b border-[#202321]/8 flex items-center justify-between text-xs font-mono text-[#202321]">
              <span className="font-semibold uppercase tracking-wider">
                WEEKLY SCHEDULE: {selectedDoctor?.name}
              </span>
              <span className="text-[#202321]/60">Auto-Generates Patient Consultation Slots</span>
            </div>

            <div className="divide-y divide-[#202321]/6">
              {DAYS_OF_WEEK.map((day) => {
                const daySched = schedule.find((s) => s.dayOfWeek.toLowerCase() === day.toLowerCase()) || {
                  dayOfWeek: day,
                  startTime: '09:00',
                  endTime: '18:00',
                  breaks: [{ startTime: '13:00', endTime: '14:00', label: 'Lunch' }],
                  isActive: day !== 'Sunday',
                };

                const currentBreak = daySched.breaks?.[0] || { startTime: '13:00', endTime: '14:00' };

                return (
                  <div
                    key={day}
                    className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                      daySched.isActive ? 'hover:bg-[#EAE6DE]/30' : 'bg-[#EAE6DE]/20 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <input
                        type="checkbox"
                        checked={daySched.isActive}
                        onChange={(e) => handleUpdateScheduleDay(day, 'isActive', e.target.checked)}
                        className="w-4 h-4 rounded text-[#173A35] focus:ring-[#173A35]"
                      />
                      <span className="font-serif text-base text-[#202321]">{day}</span>
                    </div>

                    {daySched.isActive ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono flex-1">
                        <div>
                          <label className="block text-[10px] uppercase text-[#202321]/50 mb-1">Clinic Start</label>
                          <input
                            type="time"
                            value={daySched.startTime}
                            onChange={(e) => handleUpdateScheduleDay(day, 'startTime', e.target.value)}
                            className="w-full bg-[#EAE6DE]/60 border border-[#202321]/15 rounded-xl px-3 py-1.5 text-xs text-[#202321]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase text-[#202321]/50 mb-1">Clinic End</label>
                          <input
                            type="time"
                            value={daySched.endTime}
                            onChange={(e) => handleUpdateScheduleDay(day, 'endTime', e.target.value)}
                            className="w-full bg-[#EAE6DE]/60 border border-[#202321]/15 rounded-xl px-3 py-1.5 text-xs text-[#202321]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase text-[#202321]/50 mb-1">Break Start</label>
                          <input
                            type="time"
                            value={currentBreak.startTime}
                            onChange={(e) => handleUpdateBreak(day, e.target.value, currentBreak.endTime)}
                            className="w-full bg-[#EAE6DE]/60 border border-[#202321]/15 rounded-xl px-3 py-1.5 text-xs text-[#202321]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase text-[#202321]/50 mb-1">Break End</label>
                          <input
                            type="time"
                            value={currentBreak.endTime}
                            onChange={(e) => handleUpdateBreak(day, currentBreak.startTime, e.target.value)}
                            className="w-full bg-[#EAE6DE]/60 border border-[#202321]/15 rounded-xl px-3 py-1.5 text-xs text-[#202321]"
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-mono text-[#202321]/40 italic">Clinic closed / Doctor off-duty</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveSchedule}
              disabled={isLoading}
              className="px-7 py-3 rounded-full bg-[#173A35] hover:bg-[#202321] text-[#F7F5F0] text-xs font-semibold tracking-wider uppercase transition-colors shadow-xs"
            >
              {isLoading ? 'Saving Schedule...' : 'Save Weekly Schedule'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: EXCEPTIONS & LEAVES */}
      {subTab === 'exceptions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl text-[#202321]">Configured Exceptions & Leaves</h3>
            <button
              onClick={() => setIsAddingEx(!isAddingEx)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#173A35] text-[#F7F5F0] text-xs font-medium hover:bg-[#202321] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Exception</span>
            </button>
          </div>

          {/* New Exception Form */}
          {isAddingEx && (
            <form onSubmit={handleAddException} className="p-6 rounded-3xl bg-[#EAE6DE]/70 border border-[#202321]/10 space-y-4 text-xs font-mono">
              <h4 className="font-serif text-base font-medium text-[#202321]">Create Exception for {selectedDoctor?.name}</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-[#202321]/60 mb-1">Date</label>
                  <input
                    type="date"
                    value={newExDate}
                    onChange={(e) => setNewExDate(e.target.value)}
                    required
                    className="w-full bg-[#F7F5F0] border border-[#202321]/15 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#202321]/60 mb-1">Type</label>
                  <select
                    value={newExType}
                    onChange={(e) => setNewExType(e.target.value)}
                    className="w-full bg-[#F7F5F0] border border-[#202321]/15 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="leave">Annual Leave</option>
                    <option value="holiday">Clinic Holiday</option>
                    <option value="emergency">Emergency Closure</option>
                    <option value="training">Medical Conference / Training</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#202321]/60 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newExStart}
                    onChange={(e) => setNewExStart(e.target.value)}
                    className="w-full bg-[#F7F5F0] border border-[#202321]/15 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#202321]/60 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newExEnd}
                    onChange={(e) => setNewExEnd(e.target.value)}
                    className="w-full bg-[#F7F5F0] border border-[#202321]/15 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#202321]/60 mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={newExReason}
                  onChange={(e) => setNewExReason(e.target.value)}
                  placeholder="e.g. Attending AACD Dental Symposium"
                  required
                  className="w-full bg-[#F7F5F0] border border-[#202321]/15 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingEx(false)}
                  className="px-4 py-2 rounded-full border border-[#202321]/15 text-xs text-[#202321]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#173A35] text-[#F7F5F0] text-xs font-semibold uppercase tracking-wider"
                >
                  Save Exception
                </button>
              </div>
            </form>
          )}

          {/* Exceptions List */}
          <div className="bg-[#F7F5F0] border border-[#202321]/10 rounded-3xl overflow-hidden shadow-xs">
            {exceptions.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#202321]/60 font-mono">
                No exceptions or leaves logged for {selectedDoctor?.name}.
              </div>
            ) : (
              <div className="divide-y divide-[#202321]/6 text-xs font-mono">
                {exceptions.map((ex) => (
                  <div key={ex.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#EAE6DE]/30 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#173A35]">{ex.date}</span>
                        <span className="text-[#202321]/40">·</span>
                        <span className="text-[#202321]/70">{ex.startTime} – {ex.endTime}</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#EAE6DE] text-[10px] uppercase text-[#78958B]">
                          {ex.exceptionType || 'Leave'}
                        </span>
                      </div>
                      <p className="text-xs text-[#202321]/80 mt-1 font-sans font-light">{ex.reason}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteException(ex.id)}
                      className="p-2 rounded-full hover:bg-rose-50 text-rose-700 transition-colors"
                      title="Delete exception"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BLOCKED SLOTS */}
      {subTab === 'blocked' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl text-[#202321]">Instant Slot Blocks</h3>
              <p className="text-xs text-[#202321]/60 font-light mt-0.5">
                Block specific time windows for emergency procedures, internal meetings, or disinfection.
              </p>
            </div>

            <button
              onClick={() => setIsAddingBlock(!isAddingBlock)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#173A35] text-[#F7F5F0] text-xs font-medium hover:bg-[#202321] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Block Slot</span>
            </button>
          </div>

          {/* New Block Form */}
          {isAddingBlock && (
            <form onSubmit={handleAddBlockedSlot} className="p-6 rounded-3xl bg-[#EAE6DE]/70 border border-[#202321]/10 space-y-4 text-xs font-mono">
              <h4 className="font-serif text-base font-medium text-[#202321]">Block Consultation Slot for {selectedDoctor?.name}</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-[#202321]/60 mb-1">Date</label>
                  <input
                    type="date"
                    value={newBlockDate}
                    onChange={(e) => setNewBlockDate(e.target.value)}
                    required
                    className="w-full bg-[#F7F5F0] border border-[#202321]/15 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#202321]/60 mb-1">Start Time (24h)</label>
                  <input
                    type="time"
                    value={newBlockStart}
                    onChange={(e) => setNewBlockStart(e.target.value)}
                    className="w-full bg-[#F7F5F0] border border-[#202321]/15 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#202321]/60 mb-1">End Time (24h)</label>
                  <input
                    type="time"
                    value={newBlockEnd}
                    onChange={(e) => setNewBlockEnd(e.target.value)}
                    className="w-full bg-[#F7F5F0] border border-[#202321]/15 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#202321]/60 mb-1">Reason / Note</label>
                <input
                  type="text"
                  value={newBlockReason}
                  onChange={(e) => setNewBlockReason(e.target.value)}
                  placeholder="e.g. Sterilization protocol / Complex surgical staging"
                  required
                  className="w-full bg-[#F7F5F0] border border-[#202321]/15 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingBlock(false)}
                  className="px-4 py-2 rounded-full border border-[#202321]/15 text-xs text-[#202321]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#173A35] text-[#F7F5F0] text-xs font-semibold uppercase tracking-wider"
                >
                  Block This Window
                </button>
              </div>
            </form>
          )}

          {/* Blocked Slots Table */}
          <div className="bg-[#F7F5F0] border border-[#202321]/10 rounded-3xl overflow-hidden shadow-xs">
            {blockedSlots.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#202321]/60 font-mono">
                No slots currently blocked for {selectedDoctor?.name}.
              </div>
            ) : (
              <div className="divide-y divide-[#202321]/6 text-xs font-mono">
                {blockedSlots.map((b) => (
                  <div key={b.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#EAE6DE]/30 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-800">{b.blockedDate}</span>
                        <span className="text-[#202321]/40">·</span>
                        <span className="text-[#202321]">{b.startTime} – {b.endTime}</span>
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-[10px] uppercase text-rose-800 font-semibold">
                          BLOCKED
                        </span>
                      </div>
                      <p className="text-xs text-[#202321]/80 mt-1 font-sans font-light">{b.reason}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteBlockedSlot(b.id)}
                      className="p-2 rounded-full hover:bg-rose-50 text-rose-700 transition-colors"
                      title="Unblock slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: REAL-TIME TIMELINE / PREVIEW */}
      {subTab === 'timeline' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#EAE6DE]/50 border border-[#202321]/8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl text-[#202321]">Daily Availability Timeline</h3>
              <p className="text-xs text-[#202321]/60 font-light mt-0.5">
                Inspect how working hours, lunch breaks, exceptions, and blocked slots compile into patient booking slots.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-mono text-[#202321]/60 uppercase">Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-[#F7F5F0] border border-[#202321]/15 rounded-xl px-3 py-1.5 text-xs font-mono"
              />
            </div>
          </div>

          <div className="bg-[#F7F5F0] border border-[#202321]/10 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-[#202321]/60 pb-3 border-b border-[#202321]/8">
              <span>{selectedDoctor?.name} · {selectedDate}</span>
              <span className="text-[#173A35] font-semibold">{daySlotsPreview.filter((s) => s.isAvailable).length} AVAILABLE SLOTS</span>
            </div>

            {daySlotsPreview.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#202321]/60 font-mono">
                No slots active for this date (Doctor is off-duty, past date, or full day leave).
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {daySlotsPreview.map((slot) => {
                  let badge = 'Available';
                  let bg = 'bg-[#EAE6DE]/60 border-[#202321]/10 text-[#202321]';

                  if (!slot.isAvailable) {
                    if (slot.reason === 'break') {
                      badge = 'Break';
                      bg = 'bg-amber-50 border-amber-200 text-amber-900 opacity-60';
                    } else if (slot.reason === 'blocked') {
                      badge = 'Blocked';
                      bg = 'bg-rose-50 border-rose-200 text-rose-900 opacity-60';
                    } else if (slot.reason === 'doctor_leave') {
                      badge = 'Leave';
                      bg = 'bg-slate-100 border-slate-200 text-slate-700 opacity-60';
                    } else if (slot.reason === 'booked') {
                      badge = 'Booked';
                      bg = 'bg-[#173A35]/10 border-[#173A35]/30 text-[#173A35] font-semibold';
                    } else if (slot.reason === 'held') {
                      badge = 'Hold';
                      bg = 'bg-amber-100 border-amber-300 text-amber-900';
                    } else {
                      badge = 'Unavailable';
                      bg = 'bg-slate-100 text-slate-400 opacity-50';
                    }
                  } else {
                    bg = 'bg-[#173A35] text-[#F7F5F0] border-[#173A35] font-semibold shadow-xs';
                  }

                  return (
                    <div
                      key={slot.time}
                      className={`p-3 rounded-2xl border flex flex-col justify-between text-xs font-mono transition-all ${bg}`}
                    >
                      <span className="font-bold text-sm">{slot.time}</span>
                      <span className="text-[10px] uppercase tracking-wider mt-1 opacity-80">{badge}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
