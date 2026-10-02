import {
  Appointment,
  Payment,
  WebhookEvent,
  AuditLog,
  ClinicPricing,
  ClinicSettings,
  TimeSlot,
  CreateOrderResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  Doctor,
  Service,
  Specialty,
  StaffAccount,
  AuthUser,
  Review,
  DoctorWorkingHours,
  DoctorException,
  BlockedSlot,
  ChatMessage,
} from '../types';

export const apiClient = {
  // Centralized Clinic Settings
  getClinicSettings: async (): Promise<{ settings: ClinicSettings }> => {
    const res = await fetch('/api/clinic-settings');
    if (!res.ok) throw new Error('Failed to load clinic settings');
    return res.json();
  },

  updateClinicSettings: async (settings: Partial<ClinicSettings>): Promise<{ success: boolean; settings: ClinicSettings }> => {
    const res = await fetch('/api/clinic-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update clinic settings');
    return json;
  },

  // Config & Clinic Time
  getConfig: async (): Promise<{
    razorpayKeyId: string;
    pricing: ClinicPricing;
    clinicSettings: ClinicSettings;
    currentClinicTime: { date: string; time: string; dayOfWeek: string; timezone: string };
  }> => {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('Failed to load clinic configuration');
    return res.json();
  },

  // Auth Login
  login: async (email: string, password: string): Promise<{ success: boolean; user: AuthUser }> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Authentication failed');
    return json;
  },

  // Active Specialties, Services, Doctors
  getSpecialties: async (): Promise<{ specialties: Specialty[] }> => {
    const res = await fetch('/api/specialties');
    if (!res.ok) throw new Error('Failed to load specialties');
    return res.json();
  },

  getTreatments: async (): Promise<{ treatments: Service[] }> => {
    const res = await fetch('/api/treatments');
    if (!res.ok) throw new Error('Failed to load treatments');
    return res.json();
  },

  getDoctors: async (): Promise<{ doctors: Doctor[] }> => {
    const res = await fetch('/api/doctors');
    if (!res.ok) throw new Error('Failed to load doctors');
    return res.json();
  },

  // Real-time Slot Availability
  getAvailableSlots: async (
    doctorId: string,
    date: string,
    serviceId?: string
  ): Promise<{ slots: TimeSlot[]; clinicTime: { currentDate: string; currentTime: string; timezone: string } }> => {
    const url = `/api/slots/available?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}${
      serviceId ? `&serviceId=${encodeURIComponent(serviceId)}` : ''
    }`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load doctor availability');
    return res.json();
  },

  // Admin Availability Management (Schedules, Exceptions, Blocked Slots)
  getDoctorSchedule: async (doctorId: string): Promise<{ schedule: DoctorWorkingHours[] }> => {
    const res = await fetch(`/api/admin/doctors/${doctorId}/schedule`);
    if (!res.ok) throw new Error('Failed to load doctor schedule');
    return res.json();
  },

  updateDoctorSchedule: async (doctorId: string, schedule: DoctorWorkingHours[]): Promise<{ success: boolean; schedule: DoctorWorkingHours[] }> => {
    const res = await fetch(`/api/admin/doctors/${doctorId}/schedule`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedule }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update schedule');
    return json;
  },

  addDoctorException: async (
    doctorId: string,
    data: { date: string; startTime: string; endTime: string; reason: string; exceptionType?: string }
  ): Promise<{ success: boolean; exception: DoctorException }> => {
    const res = await fetch(`/api/admin/doctors/${doctorId}/exceptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to add exception');
    return json;
  },

  deleteDoctorException: async (doctorId: string, exceptionId: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/admin/doctors/${doctorId}/exceptions/${exceptionId}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete exception');
    return json;
  },

  getDoctorBlockedSlots: async (doctorId: string): Promise<{ blockedSlots: BlockedSlot[] }> => {
    const res = await fetch(`/api/admin/doctors/${doctorId}/blocked-slots`);
    if (!res.ok) throw new Error('Failed to load blocked slots');
    return res.json();
  },

  addDoctorBlockedSlot: async (
    doctorId: string,
    data: { blockedDate: string; startTime: string; endTime: string; reason: string; timeSlot12?: string }
  ): Promise<{ success: boolean; blockedSlot: BlockedSlot }> => {
    const res = await fetch(`/api/admin/doctors/${doctorId}/blocked-slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to block slot');
    return json;
  },

  deleteDoctorBlockedSlot: async (slotId: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/admin/blocked-slots/${slotId}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to unblock slot');
    return json;
  },

  // Reviews System
  getReviews: async (): Promise<{ reviews: Review[] }> => {
    const res = await fetch('/api/reviews');
    if (!res.ok) throw new Error('Failed to load reviews');
    return res.json();
  },

  submitReview: async (data: {
    patientName: string;
    rating: number;
    reviewText: string;
    treatmentName?: string;
  }): Promise<{ success: boolean; message: string; review: Review }> => {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to submit review');
    return json;
  },

  getAdminReviews: async (): Promise<{ reviews: Review[] }> => {
    const res = await fetch('/api/admin/reviews');
    if (!res.ok) throw new Error('Failed to load admin reviews');
    return res.json();
  },

  updateAdminReview: async (
    reviewId: string,
    data: { approved?: boolean; featured?: boolean }
  ): Promise<{ success: boolean; review: Review }> => {
    const res = await fetch(`/api/admin/reviews/${reviewId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update review status');
    return json;
  },

  deleteAdminReview: async (reviewId: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/admin/reviews/${reviewId}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete review');
    return json;
  },

  // Create booking intent + Razorpay Order
  createOrder: async (data: {
    doctorId: string;
    serviceId: string;
    appointmentDate: string;
    timeSlot: string;
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    patientAge?: number;
    gender?: string;
    notes?: string;
  }): Promise<CreateOrderResponse> => {
    const res = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Could not create reservation.');
    }
    return json;
  },

  // Server-Side Razorpay Signature Verification
  verifyPayment: async (payload: VerifyPaymentRequest): Promise<VerifyPaymentResponse> => {
    const res = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: json.error || 'We could not verify the payment. Please try again.',
      };
    }
    return json;
  },

  // Release temporary slot hold
  releaseHold: async (appointmentId: string): Promise<void> => {
    await fetch('/api/appointments/release-hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId }),
    });
  },

  // Appointments (Admin/Staff)
  getAllAppointments: async (): Promise<{ appointments: (Appointment & { payment?: Payment })[] }> => {
    const res = await fetch('/api/appointments');
    if (!res.ok) throw new Error('Failed to fetch appointments');
    return res.json();
  },

  getAppointment: async (id: string): Promise<{ appointment: Appointment; payment?: Payment }> => {
    const res = await fetch(`/api/appointments/${id}`);
    if (!res.ok) throw new Error('Failed to fetch appointment');
    return res.json();
  },

  // Staff checkin update
  updateStaffCheckin: async (appointmentId: string, status: string) => {
    const res = await fetch('/api/staff/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId, status }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  // Admin stats
  getAdminStats: async () => {
    const res = await fetch('/api/admin/stats');
    if (!res.ok) throw new Error('Failed to fetch admin stats');
    return res.json();
  },

  // Audit Logs & Webhooks
  getAuditLogs: async (): Promise<{ auditLogs: AuditLog[] }> => {
    const res = await fetch('/api/admin/audit-logs');
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  getWebhooks: async (): Promise<{ webhooks: WebhookEvent[] }> => {
    const res = await fetch('/api/admin/webhooks');
    if (!res.ok) throw new Error('Failed to fetch webhooks');
    return res.json();
  },

  simulateWebhook: async (data: any) => {
    const res = await fetch('/api/payments/simulate-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updatePricing: async (data: { appointmentFee?: number; convenienceFee?: number; slotHoldMinutes?: number }) => {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update pricing');
    return res.json();
  },

  processRefund: async (paymentId: string, reason?: string) => {
    const res = await fetch('/api/admin/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, reason }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Refund failed');
    }
    return res.json();
  },

  // Gemini Chatbot
  sendChatMessage: async (
    messages: { role: 'user' | 'model'; content: string }[],
    userMessage: string
  ): Promise<{
    reply: string;
    actionSuggestion?: {
      type: 'book_appointment';
      serviceId?: string;
      doctorId?: string;
      treatmentName?: string;
    };
  }> => {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, userMessage }),
    });
    if (!res.ok) {
      throw new Error('Failed to send message to assistant');
    }
    return res.json();
  },

  // AI Clinical Search
  searchOralHealth: async (query: string): Promise<{ answer: string; sources: { title: string; url: string }[] }> => {
    const res = await fetch('/api/ai/oral-health-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error('AI search failed');
    return res.json();
  },

  // AI Smile Visualizer
  generateSmileVisualizer: async (data: { treatmentType: string; resolution?: '1K' | '2K' | '4K'; smileGoals?: string }) => {
    const res = await fetch('/api/ai/smile-visualizer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('AI visualizer failed');
    return res.json();
  },
};
