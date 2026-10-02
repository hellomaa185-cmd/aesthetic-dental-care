import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Search,
  Database,
  Sliders,
  Send,
  Check,
  ArrowUpRight,
  Lock,
  FlaskConical,
  Calendar,
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  MapPin,
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { Appointment, Payment, WebhookEvent, AuditLog, ClinicPricing, ClinicSettings, AuthUser, Review } from '../types';
import { AdminAvailability } from './AdminAvailability';

interface AdminPortalProps {
  currentUser?: AuthUser | null;
  onLoginSuccess?: (user: AuthUser) => void;
  onOpenQAMatrix?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  onLoginSuccess,
  onOpenQAMatrix,
}) => {
  const [email, setEmail] = useState('admin@aestheticdental.com');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<'appointments' | 'availability' | 'reviews' | 'webhooks' | 'audit' | 'settings' | 'supabase'>('appointments');
  const [stats, setStats] = useState<any>(null);
  const [appointments, setAppointments] = useState<(Appointment & { payment?: Payment })[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [adminReviews, setAdminReviews] = useState<Review[]>([]);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pricing & Settings form state
  const [appointmentFee, setAppointmentFee] = useState<number>(100);
  const [convenienceFee, setConvenienceFee] = useState<number>(20);
  const [slotHoldMinutes, setSlotHoldMinutes] = useState<number>(10);
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [clinicEmail, setClinicEmail] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Webhook simulator state
  const [simOrderId, setSimOrderId] = useState('');
  const [simEventType, setSimEventType] = useState('payment.captured');
  const [simInvalidSig, setSimInvalidSig] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadData();
    }
  }, [currentUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await apiClient.login(email, password);
      if (res.success && res.user) {
        if (res.user.role !== 'admin') {
          setLoginError('This account does not have Administrative privileges. Please use an admin credential.');
          return;
        }
        if (onLoginSuccess) onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Invalid administrator credentials');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, apptsData, webhooksData, auditData, reviewsData, settingsData] = await Promise.all([
        apiClient.getAdminStats(),
        apiClient.getAllAppointments(),
        apiClient.getWebhooks(),
        apiClient.getAuditLogs(),
        apiClient.getAdminReviews(),
        apiClient.getClinicSettings(),
      ]);
      setStats(statsData);
      setAppointments(apptsData.appointments);
      setWebhooks(webhooksData.webhooks);
      setAuditLogs(auditData.auditLogs);
      setAdminReviews(reviewsData.reviews);
      setClinicSettings(settingsData.settings);

      if (settingsData.settings) {
        setAppointmentFee(settingsData.settings.appointmentFee);
        setConvenienceFee(settingsData.settings.convenienceFee);
        setSlotHoldMinutes(settingsData.settings.slotHoldMinutes);
        setAddressLine(settingsData.settings.addressLine);
        setCity(settingsData.settings.city);
        setState(settingsData.settings.state);
        setPostalCode(settingsData.settings.postalCode);
        setPhone(settingsData.settings.phone);
        setClinicEmail(settingsData.settings.email);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await apiClient.updateClinicSettings({
        appointmentFee: Number(appointmentFee),
        convenienceFee: Number(convenienceFee),
        totalAmount: Number(appointmentFee) + Number(convenienceFee),
        slotHoldMinutes: Number(slotHoldMinutes),
        addressLine,
        city,
        state,
        postalCode,
        phone,
        email: clinicEmail,
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveReview = async (reviewId: string, approved: boolean) => {
    try {
      await apiClient.updateAdminReview(reviewId, { approved });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFeatureReview = async (reviewId: string, featured: boolean) => {
    try {
      await apiClient.updateAdminReview(reviewId, { featured });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await apiClient.deleteAdminReview(reviewId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleProcessRefund = async (paymentId: string) => {
    if (!confirm('Are you sure you want to process a refund for this transaction?')) return;
    try {
      await apiClient.processRefund(paymentId, 'Administrative refund requested');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Refund failed');
    }
  };

  const handleSimulateWebhook = async () => {
    if (!simOrderId) {
      alert('Please enter an Order ID or pick one from the appointments table.');
      return;
    }
    try {
      const res = await apiClient.simulateWebhook({
        orderId: simOrderId,
        eventType: simEventType,
        sendInvalidSignature: simInvalidSig,
      });
      setSimResult(res);
      loadData();
    } catch (err: any) {
      setSimResult({ error: err.message });
    }
  };

  // If not logged in as Admin, show clean authentication screen
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="py-20 px-6 max-w-md mx-auto text-[#202321]">
        <div className="p-8 rounded-3xl bg-[#EAE6DE]/70 border border-[#202321]/10 space-y-6 shadow-xs">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#173A35] text-[#F7F5F0] flex items-center justify-center mx-auto mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-2xl font-medium text-[#202321]">Administrative Control</h2>
            <p className="text-xs text-[#202321]/60 font-light">
              Secure administration portal for doctor availability, financial audits, reviews moderation, and pricing configuration.
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-center font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block uppercase text-[#202321]/60 text-[10px] mb-1">Admin Email</label>
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
              {isLoggingIn ? 'Authenticating...' : 'Sign In as Administrator'}
            </button>
          </form>

          {onOpenQAMatrix && (
            <div className="pt-4 border-t border-[#202321]/8 text-center">
              <button
                onClick={onOpenQAMatrix}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#78958B] hover:text-[#173A35] underline"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Launch Diagnostics & QA Matrix</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const filteredAppointments = appointments.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.id.toLowerCase().includes(q) ||
      a.patientName.toLowerCase().includes(q) ||
      a.patientPhone.toLowerCase().includes(q) ||
      a.doctorName.toLowerCase().includes(q) ||
      a.serviceName.toLowerCase().includes(q) ||
      (a.payment?.razorpayOrderId?.toLowerCase().includes(q) ?? false) ||
      (a.payment?.razorpayPaymentId?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="py-12 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-8 text-[#202321]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-[#202321]/8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-mono text-[#78958B] mb-2">
            <span>CLINICAL GOVERNANCE & OPERATIONS</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#202321]">
            Administrative Operations
          </h1>
          <p className="text-xs text-[#202321]/60 font-light mt-1">
            Doctor availability scheduling, patient review moderation, financial auditing, and centralized clinic configuration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onOpenQAMatrix && (
            <button
              onClick={onOpenQAMatrix}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#EAE6DE] hover:bg-[#173A35] hover:text-[#F7F5F0] text-xs font-mono text-[#202321] transition-colors"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>QA Matrix</span>
            </button>
          )}

          <button
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#202321]/15 hover:border-[#173A35] text-xs font-medium text-[#202321] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#173A35]' : ''}`} />
            <span>Sync Records</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-5 rounded-2xl bg-[#EAE6DE]/50 border border-[#202321]/8 space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#202321]/50">TOTAL REVENUE</span>
            <div className="text-2xl font-serif font-normal text-[#173A35]">₹{stats.totalRevenueINR}</div>
            <span className="text-[10px] font-mono text-[#202321]/40 block">Authoritative Collected</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#EAE6DE]/50 border border-[#202321]/8 space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#202321]/50">CONFIRMED</span>
            <div className="text-2xl font-serif font-normal text-emerald-800">{stats.confirmedCount}</div>
            <span className="text-[10px] font-mono text-emerald-800/70 block">Verified Bookings</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#EAE6DE]/50 border border-[#202321]/8 space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#202321]/50">PENDING HOLDS</span>
            <div className="text-2xl font-serif font-normal text-[#202321]">{stats.pendingCount}</div>
            <span className="text-[10px] font-mono text-[#202321]/40 block">10-Min Locks</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#EAE6DE]/50 border border-[#202321]/8 space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#202321]/50">PENDING REVIEWS</span>
            <div className="text-2xl font-serif font-normal text-amber-800">
              {adminReviews.filter((r) => !r.approved).length}
            </div>
            <span className="text-[10px] font-mono text-amber-800/70 block">Awaiting Moderation</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#EAE6DE]/50 border border-[#202321]/8 space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#202321]/50">SIGNATURES</span>
            <div className="text-2xl font-serif font-normal text-[#173A35]">{stats.verifiedSignaturesCount}</div>
            <span className="text-[10px] font-mono text-[#78958B] block">Valid Signatures</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#202321]/8 pb-2 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2 rounded-full transition-all ${
            activeTab === 'appointments'
              ? 'bg-[#173A35] text-[#F7F5F0]'
              : 'text-[#202321]/70 hover:text-[#202321]'
          }`}
        >
          Appointments ({appointments.length})
        </button>

        <button
          onClick={() => setActiveTab('availability')}
          className={`px-4 py-2 rounded-full transition-all ${
            activeTab === 'availability'
              ? 'bg-[#173A35] text-[#F7F5F0]'
              : 'text-[#202321]/70 hover:text-[#202321]'
          }`}
        >
          Doctor Availability & Schedules
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 rounded-full transition-all ${
            activeTab === 'reviews'
              ? 'bg-[#173A35] text-[#F7F5F0]'
              : 'text-[#202321]/70 hover:text-[#202321]'
          }`}
        >
          Reviews Moderation ({adminReviews.length})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-full transition-all ${
            activeTab === 'settings'
              ? 'bg-[#173A35] text-[#F7F5F0]'
              : 'text-[#202321]/70 hover:text-[#202321]'
          }`}
        >
          Clinic Settings & Pricing
        </button>

        <button
          onClick={() => setActiveTab('webhooks')}
          className={`px-4 py-2 rounded-full transition-all ${
            activeTab === 'webhooks'
              ? 'bg-[#173A35] text-[#F7F5F0]'
              : 'text-[#202321]/70 hover:text-[#202321]'
          }`}
        >
          Webhook Inspector ({webhooks.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-full transition-all ${
            activeTab === 'audit'
              ? 'bg-[#173A35] text-[#F7F5F0]'
              : 'text-[#202321]/70 hover:text-[#202321]'
          }`}
        >
          Security Audit Trail ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('supabase')}
          className={`px-4 py-2 rounded-full transition-all ${
            activeTab === 'supabase'
              ? 'bg-[#173A35] text-[#F7F5F0]'
              : 'text-[#202321]/70 hover:text-[#202321]'
          }`}
        >
          Supabase DDL & RLS
        </button>
      </div>

      {/* TAB 1: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-[#202321]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search appointments, patients, order IDs..."
              className="w-full bg-[#EAE6DE]/50 border border-[#202321]/15 rounded-xl pl-10 pr-4 py-2 text-xs text-[#202321] focus:outline-none focus:border-[#173A35]"
            />
          </div>

          <div className="bg-[#F7F5F0] border border-[#202321]/10 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#EAE6DE]/70 border-b border-[#202321]/8 text-[11px] font-mono text-[#202321]/60 uppercase">
                    <th className="py-3 px-4">Appointment</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Specialist & Slot</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Payment Ref</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202321]/6">
                  {filteredAppointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-[#EAE6DE]/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-[#173A35]">
                        {appt.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#202321]">{appt.patientName}</div>
                        <div className="text-[11px] text-[#202321]/60 font-mono">{appt.patientPhone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-[#202321]">{appt.doctorName}</div>
                        <div className="text-[11px] font-mono text-[#78958B]">{appt.appointmentDate} · {appt.timeSlot}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold">
                        ₹{appt.totalAmount || 120}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                          appt.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : appt.status === 'pending_payment'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {appt.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#202321]/70">
                        {appt.payment?.razorpayPaymentId || appt.payment?.razorpayOrderId || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {appt.status === 'confirmed' && appt.payment && (
                          <button
                            onClick={() => handleProcessRefund(appt.payment!.id)}
                            className="text-[11px] text-rose-700 hover:text-rose-900 underline font-medium"
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOCTOR AVAILABILITY ENGINE */}
      {activeTab === 'availability' && (
        <AdminAvailability onAvailabilityChanged={loadData} />
      )}

      {/* TAB 3: REVIEWS MODERATION */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-2xl font-normal text-[#202321]">Patient Review Moderation</h3>
              <p className="text-xs text-[#202321]/60 font-light mt-0.5">
                Reviews submitted by patients require clinical approval before being published publicly.
              </p>
            </div>
          </div>

          <div className="bg-[#F7F5F0] border border-[#202321]/10 rounded-3xl overflow-hidden shadow-xs">
            <div className="divide-y divide-[#202321]/6 text-xs">
              {adminReviews.map((rev) => (
                <div key={rev.id} className="p-6 hover:bg-[#EAE6DE]/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-serif text-base font-medium text-[#202321]">{rev.patientName}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${s <= rev.rating ? 'text-[#C7A46A] fill-[#C7A46A]' : 'text-[#202321]/20'}`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-mono text-[#78958B]">{rev.treatmentName}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                        rev.approved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rev.approved ? 'PUBLISHED' : 'PENDING APPROVAL'}
                      </span>
                      {rev.featured && (
                        <span className="px-2 py-0.5 rounded-full bg-[#173A35] text-[#F7F5F0] text-[10px] font-mono">
                          FEATURED
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#202321]/80 italic leading-relaxed font-light">
                      "{rev.reviewText}"
                    </p>

                    <div className="text-[10px] font-mono text-[#202321]/40">
                      Submitted on {new Date(rev.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApproveReview(rev.id, !rev.approved)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-colors ${
                        rev.approved
                          ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                          : 'bg-emerald-700 text-[#F7F5F0] hover:bg-emerald-800'
                      }`}
                    >
                      {rev.approved ? 'Unpublish' : 'Approve & Publish'}
                    </button>

                    <button
                      onClick={() => handleToggleFeatureReview(rev.id, !rev.featured)}
                      className="px-3 py-1.5 rounded-full border border-[#202321]/15 hover:border-[#173A35] text-xs font-mono text-[#202321] transition-colors"
                    >
                      {rev.featured ? 'Unfeature' : 'Feature'}
                    </button>

                    <button
                      onClick={() => handleDeleteReview(rev.id)}
                      className="p-2 rounded-full hover:bg-rose-50 text-rose-700 transition-colors"
                      title="Delete review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CLINIC SETTINGS & PRICING */}
      {activeTab === 'settings' && (
        <div className="space-y-8">
          <div className="p-8 rounded-3xl bg-[#EAE6DE]/50 border border-[#202321]/8 space-y-6 text-xs max-w-3xl">
            <div>
              <h3 className="font-serif text-2xl font-normal text-[#202321]">Centralized Clinic Settings</h3>
              <p className="text-[#202321]/60 font-light mt-1">
                Single source of truth for public clinic contact details, location, and official consultation pricing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase text-[#202321]/60 mb-1">Street Address</label>
                <input
                  type="text"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="w-full bg-[#F7F5F0] border border-[#202321]/15 rounded-xl px-4 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#202321]/60 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#F7F5F0] border border-[#202321]/15 rounded-xl px-4 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#202321]/60 mb-1">State & Postal Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-1/2 bg-[#F7F5F0] border border-[#202321]/15 rounded-xl px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-1/2 bg-[#F7F5F0] border border-[#202321]/15 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#202321]/60 mb-1">Clinic Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#F7F5F0] border border-[#202321]/15 rounded-xl px-4 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#202321]/60 mb-1">Concierge Email</label>
                <input
                  type="email"
                  value={clinicEmail}
                  onChange={(e) => setClinicEmail(e.target.value)}
                  className="w-full bg-[#F7F5F0] border border-[#202321]/15 rounded-xl px-4 py-2 text-xs"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#202321]/8 space-y-4">
              <h4 className="font-serif text-lg text-[#202321]">Authoritative Consultation Pricing</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
                <div>
                  <label className="block text-[10px] uppercase text-[#202321]/60 mb-1">Doctor Fee (₹)</label>
                  <input
                    type="number"
                    value={appointmentFee}
                    onChange={(e) => setAppointmentFee(Number(e.target.value))}
                    className="w-full bg-[#F7F5F0] border border-[#202321]/15 rounded-xl px-4 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#202321]/60 mb-1">Convenience Fee (₹)</label>
                  <input
                    type="number"
                    value={convenienceFee}
                    onChange={(e) => setConvenienceFee(Number(e.target.value))}
                    className="w-full bg-[#F7F5F0] border border-[#202321]/15 rounded-xl px-4 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F7F5F0] border border-[#202321]/10 flex justify-between items-baseline">
                <span className="font-sans text-xs text-[#202321]">Total Customer Amount:</span>
                <span className="font-mono text-xl font-bold text-[#173A35]">
                  ₹{Number(appointmentFee) + Number(convenienceFee)}
                </span>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="px-6 py-3 rounded-full bg-[#173A35] text-[#F7F5F0] text-xs font-semibold uppercase tracking-wider hover:bg-[#202321] transition-colors"
            >
              {settingsSaved ? 'Settings Saved' : 'Save Central Settings'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: WEBHOOK INSPECTOR */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#EAE6DE]/50 border border-[#202321]/8 space-y-4">
            <h3 className="font-serif text-xl text-[#202321]">Simulate Razorpay Webhook Event</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <label className="block text-[10px] uppercase text-[#202321]/60 mb-1">Razorpay Order ID</label>
                <input
                  type="text"
                  value={simOrderId}
                  onChange={(e) => setSimOrderId(e.target.value)}
                  placeholder="order_..."
                  className="w-full bg-[#F7F5F0] border border-[#202321]/15 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#202321]/60 mb-1">Event Type</label>
                <select
                  value={simEventType}
                  onChange={(e) => setSimEventType(e.target.value)}
                  className="w-full bg-[#F7F5F0] border border-[#202321]/15 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="payment.captured">payment.captured</option>
                  <option value="payment.failed">payment.failed</option>
                  <option value="order.paid">order.paid</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleSimulateWebhook}
                  className="w-full py-2 px-4 rounded-full bg-[#173A35] text-[#F7F5F0] text-xs font-medium hover:bg-[#202321] transition-colors"
                >
                  Dispatch Webhook
                </button>
              </div>
            </div>

            {simResult && (
              <pre className="p-4 rounded-2xl bg-[#F7F5F0] border border-[#202321]/10 text-xs font-mono overflow-x-auto text-[#202321]">
                {JSON.stringify(simResult, null, 2)}
              </pre>
            )}
          </div>

          <div className="bg-[#F7F5F0] border border-[#202321]/10 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-4 bg-[#EAE6DE]/70 border-b border-[#202321]/8 font-mono text-xs font-semibold text-[#202321]">
              PROCESSED WEBHOOK EVENT LOGS
            </div>
            <div className="divide-y divide-[#202321]/6 font-mono text-xs">
              {webhooks.map((wh) => (
                <div key={wh.id} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#173A35]">{wh.eventId}</span>
                    <span className="text-[#202321]/50 ml-3">{wh.eventType}</span>
                  </div>
                  <span className="text-emerald-800 font-semibold">{wh.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-[#F7F5F0] border border-[#202321]/10 rounded-3xl overflow-hidden shadow-xs">
          <div className="p-4 bg-[#EAE6DE]/70 border-b border-[#202321]/8 font-mono text-xs font-semibold text-[#202321]">
            IMMUTABLE SECURITY & AUDIT TRAIL
          </div>
          <div className="divide-y divide-[#202321]/6 text-xs max-h-[480px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-[#EAE6DE]/30 transition-colors space-y-1">
                <div className="flex justify-between items-baseline font-mono text-[11px]">
                  <span className="font-bold text-[#173A35]">{log.action}</span>
                  <span className="text-[#202321]/40">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-[#202321]/80 font-light">{log.details}</p>
                <div className="text-[10px] font-mono text-[#202321]/40">
                  {log.entityType}/{log.entityId} · Actor: {log.actorRole}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: SUPABASE SCHEMA */}
      {activeTab === 'supabase' && (
        <div className="p-8 rounded-3xl bg-[#EAE6DE]/50 border border-[#202321]/8 space-y-4">
          <div className="flex justify-between items-center font-mono text-xs">
            <span className="font-semibold text-[#173A35]">SUPABASE POSTGRESQL & RLS POLICIES</span>
            <span className="text-[#202321]/50">/supabase/migrations/20261001_aesthetic_dental_init.sql</span>
          </div>

          <pre className="p-4 rounded-2xl bg-[#F7F5F0] border border-[#202321]/10 text-xs font-mono overflow-x-auto text-[#202321] leading-relaxed max-h-[360px]">
{`-- Dedicated Payments Table (Smallest unit: 12000 paise = ₹120.00)
-- Row Level Security isolating public customer access from admin payment records

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read schedules" ON public.doctor_schedules FOR SELECT USING (active = true);
CREATE POLICY "Admin manage schedules" ON public.doctor_schedules FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Public read approved reviews" ON public.reviews FOR SELECT USING (approved = true);
CREATE POLICY "Public submit review" ON public.reviews FOR INSERT WITH CHECK (approved = false);
CREATE POLICY "Admin manage reviews" ON public.reviews FOR ALL USING (auth.jwt() ->> 'role' = 'admin');`}
          </pre>
        </div>
      )}

    </div>
  );
};
