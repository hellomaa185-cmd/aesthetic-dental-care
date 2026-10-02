import React, { useState, useEffect } from 'react';
import { RefreshCw, Printer, Clock, Lock, UserCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { apiClient } from '../lib/api';
import { Appointment, Payment, AuthUser } from '../types';

interface StaffPortalProps {
  currentUser: AuthUser | null;
  onLoginSuccess: (user: AuthUser) => void;
}

export const StaffPortal: React.FC<StaffPortalProps> = ({ currentUser, onLoginSuccess }) => {
  const [email, setEmail] = useState('staff@aestheticdental.com');
  const [password, setPassword] = useState('staff123');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [appointments, setAppointments] = useState<(Appointment & { payment?: Payment })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState<string>('');

  useEffect(() => {
    // Update live IST time ticker
    const updateTime = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      setCurrentTimeDisplay(`${formatter.format(now)} IST`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadAppointments();
    }
  }, [currentUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await apiClient.login(email, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Invalid credentials');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getAllAppointments();
      setAppointments(data.appointments);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (appointmentId: string, status: 'checked_in' | 'in_chair' | 'completed') => {
    try {
      await apiClient.updateStaffCheckin(appointmentId, status);
      loadAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  // If not logged in, show clean authentication screen
  if (!currentUser) {
    return (
      <div className="py-20 px-6 max-w-md mx-auto text-[#202321]">
        <div className="p-8 rounded-3xl bg-[#EAE6DE]/70 border border-[#202321]/10 space-y-6 shadow-xs">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#173A35] text-[#F7F5F0] flex items-center justify-center mx-auto mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-2xl font-medium text-[#202321]">Staff Desk Authentication</h2>
            <p className="text-xs text-[#202321]/60 font-light">
              Restricted portal for clinical reception and chair scheduling operations.
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-center font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block uppercase text-[#202321]/60 text-[10px] mb-1">Staff Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#F7F5F0] border border-[#202321]/15 rounded-xl px-4 py-2.5 text-xs text-[#202321] focus:outline-none focus:border-[#173A35]"
              />
            </div>

            <div>
              <label className="block uppercase text-[#202321]/60 text-[10px] mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#F7F5F0] border border-[#202321]/15 rounded-xl px-4 py-2.5 text-xs text-[#202321] focus:outline-none focus:border-[#173A35]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 px-4 rounded-full bg-[#173A35] hover:bg-[#202321] text-[#F7F5F0] text-xs font-medium tracking-wide uppercase transition-colors shadow-xs"
            >
              {isLoggingIn ? 'Authenticating...' : 'Sign In to Staff Desk'}
            </button>
          </form>

          <div className="pt-2 text-center text-[11px] text-[#202321]/40 font-mono">
            Clinic Timezone: Asia/Kolkata
          </div>
        </div>
      </div>
    );
  }

  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const todayAppointments = appointments.filter(a => a.appointmentDate === todayStr);

  const filtered = appointments.filter((a) => {
    if (filterStatus === 'today') return a.appointmentDate === todayStr;
    if (filterStatus === 'confirmed') return a.status === 'confirmed';
    if (filterStatus === 'checked_in') return a.checkInStatus === 'checked_in';
    if (filterStatus === 'completed') return a.checkInStatus === 'completed' || a.status === 'completed';
    return true;
  });

  return (
    <div className="py-12 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-8 text-[#202321]">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-[#202321]/8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-mono text-[#78958B] mb-2">
            <span>CLINICAL RECEPTION DESK</span>
            <span>·</span>
            <span className="text-[#173A35] font-semibold">{currentTimeDisplay}</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#202321]">
            Daily Patient Queue
          </h1>
          <p className="text-xs text-[#202321]/60 font-light mt-1">
            Logged in as {currentUser.name} ({currentUser.email}).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#202321]/15 hover:border-[#173A35] text-xs font-medium text-[#202321] transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-[#78958B]" />
            <span>Print Day Schedule</span>
          </button>

          <button
            onClick={loadAppointments}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#173A35] text-[#F7F5F0] text-xs font-medium hover:bg-[#202321] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Schedule</span>
          </button>
        </div>
      </div>

      {/* Operational Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#EAE6DE]/50 border border-[#202321]/8 space-y-1">
          <span className="text-[10px] uppercase font-mono text-[#202321]/50">TODAY'S SCHEDULE</span>
          <div className="text-2xl font-serif font-normal text-[#173A35]">{todayAppointments.length}</div>
          <span className="text-[10px] font-mono text-[#202321]/40 block">Patients booked today</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#EAE6DE]/50 border border-[#202321]/8 space-y-1">
          <span className="text-[10px] uppercase font-mono text-[#202321]/50">CHECKED IN</span>
          <div className="text-2xl font-serif font-normal text-indigo-800">
            {todayAppointments.filter(a => a.checkInStatus === 'checked_in').length}
          </div>
          <span className="text-[10px] font-mono text-indigo-800/70 block">Waiting in lobby</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#EAE6DE]/50 border border-[#202321]/8 space-y-1">
          <span className="text-[10px] uppercase font-mono text-[#202321]/50">IN OPERATORY</span>
          <div className="text-2xl font-serif font-normal text-[#173A35]">
            {todayAppointments.filter(a => a.checkInStatus === 'in_chair').length}
          </div>
          <span className="text-[10px] font-mono text-[#78958B] block">Treatment in progress</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#EAE6DE]/50 border border-[#202321]/8 space-y-1">
          <span className="text-[10px] uppercase font-mono text-[#202321]/50">COMPLETED</span>
          <div className="text-2xl font-serif font-normal text-emerald-800">
            {todayAppointments.filter(a => a.checkInStatus === 'completed' || a.status === 'completed').length}
          </div>
          <span className="text-[10px] font-mono text-emerald-800/70 block">Finished today</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs font-medium">
        {['all', 'today', 'confirmed', 'checked_in', 'completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterStatus(tab)}
            className={`px-4 py-2 rounded-full capitalize transition-all ${
              filterStatus === tab
                ? 'bg-[#173A35] text-[#F7F5F0]'
                : 'bg-[#EAE6DE]/60 text-[#202321]/70 hover:text-[#202321]'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Queue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-[#202321]/40 bg-[#EAE6DE]/30 rounded-3xl border border-[#202321]/8">
            No patients currently in this queue filter.
          </div>
        ) : (
          filtered.map((appt) => {
            const isPaid = appt.payment?.status === 'paid' || appt.status === 'confirmed';
            return (
              <div
                key={appt.id}
                className="p-6 rounded-3xl bg-[#EAE6DE]/50 border border-[#202321]/8 flex flex-col justify-between space-y-6 shadow-xs hover:border-[#173A35]/30 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#202321]/8">
                    <span className="font-mono text-xs font-bold text-[#173A35] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#78958B]" />
                      {appt.timeSlot} · {appt.appointmentDate}
                    </span>

                    {isPaid ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                        PAID ₹120
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                        PENDING
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-serif text-lg font-medium text-[#202321] truncate">{appt.patientName}</h3>
                      <span className="text-[10px] font-mono text-[#202321]/40">{appt.id}</span>
                    </div>
                    <div className="text-xs font-mono text-[#202321]/60">{appt.patientPhone}</div>
                    <div className="text-xs text-[#173A35] pt-1">{appt.serviceName} ({appt.serviceDurationMinutes || 45} min)</div>
                    <div className="text-xs text-[#202321]/60">Specialist: {appt.doctorName}</div>
                    {appt.notes && (
                      <div className="mt-2 p-2 rounded-xl bg-[#F7F5F0] text-[11px] text-[#202321]/70 italic">
                        &ldquo;{appt.notes}&rdquo;
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#202321]/8 flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-mono text-[#202321]/50">
                    Status: {appt.checkInStatus?.replace('_', ' ') || 'Waiting'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {appt.checkInStatus !== 'checked_in' && appt.checkInStatus !== 'in_chair' && appt.checkInStatus !== 'completed' && (
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'checked_in')}
                        className="px-3 py-1 rounded-full bg-[#173A35] text-[#F7F5F0] text-[11px] font-medium hover:bg-[#202321] transition-colors"
                      >
                        Check In
                      </button>
                    )}

                    {appt.checkInStatus === 'checked_in' && (
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'in_chair')}
                        className="px-3 py-1 rounded-full bg-[#78958B] text-[#F7F5F0] text-[11px] font-medium hover:bg-[#173A35] transition-colors"
                      >
                        In Chair
                      </button>
                    )}

                    {appt.checkInStatus === 'in_chair' && (
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'completed')}
                        className="px-3 py-1 rounded-full bg-emerald-700 text-[#F7F5F0] text-[11px] font-medium hover:bg-emerald-800 transition-colors"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
