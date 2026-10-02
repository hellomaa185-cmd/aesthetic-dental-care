import express, { Request, Response } from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import {
  CLINIC_DOCTORS,
  CLINIC_SERVICES,
  CLINIC_SPECIALTIES,
  INITIAL_CLINIC_SETTINGS,
  INITIAL_PRICING,
  INITIAL_STAFF,
  INITIAL_REVIEWS,
  PRIMARY_DOCTOR_ID,
} from './src/data/mockData';
import {
  Appointment,
  Payment,
  WebhookEvent,
  AuditLog,
  ClinicPricing,
  ClinicSettings,
  TimeSlot,
  Doctor,
  Service,
  Specialty,
  StaffAccount,
  Review,
  BlockedSlot,
  DoctorException,
  DoctorWorkingHours,
} from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_aesthetic_demo';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'sec_demo_secret_aesthetic_clinic_982741';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_demo_aesthetic_clinic_webhook_51829';

// Initialize Supabase Client on Server (if env vars provided)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export const supabaseServer = supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// ==============================================================================
// TIMEZONE & CALENDAR HELPERS (Asia/Kolkata)
// ==============================================================================

const CLINIC_TIMEZONE = 'Asia/Kolkata';

export const getKolkataTime = () => {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '';

  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const rawHour = parseInt(getPart('hour'), 10);
  const hour = isNaN(rawHour) ? 0 : rawHour % 24;
  const minute = parseInt(getPart('minute'), 10) || 0;
  const second = parseInt(getPart('second'), 10) || 0;

  const currentDateStr = `${year}-${month}-${day}`;
  const currentTimeMinutes = hour * 60 + minute;
  const timeFormatted = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TIMEZONE,
    weekday: 'long',
  });
  const currentDayOfWeek = dayFormatter.format(now);

  return {
    currentDateStr,
    currentTimeMinutes,
    timeFormatted,
    currentDayOfWeek,
    nowEpochMs: now.getTime(),
  };
};

const timeToMinutes = (time24: string): number => {
  const [h, m] = time24.split(':').map(Number);
  return h * 60 + (m || 0);
};

const time12To24 = (time12: string): string => {
  const [time, period] = time12.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const minutesToTimeFormats = (totalMinutes: number) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const time24 = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const time12 = `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;

  return { time24, time12 };
};

// ==============================================================================
// SUPABASE AUTHORITATIVE IN-MEMORY STORES & REALTIME ADAPTER
// ==============================================================================

let clinicSettings: ClinicSettings = { ...INITIAL_CLINIC_SETTINGS };
let clinicPricing: ClinicPricing = { ...INITIAL_PRICING };
const specialtiesStore: Map<string, Specialty> = new Map(CLINIC_SPECIALTIES.map((s) => [s.id, s]));
const servicesStore: Map<string, Service> = new Map(CLINIC_SERVICES.map((s) => [s.id, s]));
const doctorsStore: Map<string, Doctor> = new Map(CLINIC_DOCTORS.map((d) => [d.id, JSON.parse(JSON.stringify(d))]));
const staffStore: Map<string, StaffAccount> = new Map(INITIAL_STAFF.map((st) => [st.id, st]));
const reviewsStore: Map<string, Review> = new Map(INITIAL_REVIEWS.map((r) => [r.id, r]));
const blockedSlotsStore: Map<string, BlockedSlot> = new Map();

const appointmentsStore: Map<string, Appointment> = new Map();
const appointmentHoldsStore: Map<string, { id: string; appointmentId: string; doctorId: string; holdDate: string; startTime: string; endTime: string; expiresAt: string; status: string; createdAt: string }> = new Map();
const paymentsStore: Map<string, Payment> = new Map();
const webhookEventsStore: Map<string, WebhookEvent> = new Map();
const auditLogsStore: AuditLog[] = [];

// Seed initial appointment
const seedInitialData = () => {
  const seedApptId = 'APT-202610-8420';
  const seedPayId = 'PAY-202610-9182';
  const seedOrderId = 'order_AestheticSeed9821';
  const seedPaymentId = 'pay_RazorpayDemo74829';

  const kt = getKolkataTime();

  const seedAppt: Appointment = {
    id: seedApptId,
    patientName: 'Priya Sharma',
    patientEmail: 'priya.sharma@example.com',
    patientPhone: '+91 9876543210',
    patientAge: 29,
    gender: 'Female',
    doctorId: PRIMARY_DOCTOR_ID,
    doctorName: 'Dr. Maya Rao, MDS',
    serviceId: 'srv-1',
    serviceName: 'Cosmetic Veneers & Smile Architecture',
    serviceDurationMinutes: 60,
    appointmentDate: kt.currentDateStr,
    timeSlot: '11:30 AM',
    status: 'confirmed',
    appointmentFee: 100,
    convenienceFee: 20,
    totalAmount: 120,
    currency: 'INR',
    notes: 'Consultation for upper anterior porcelain veneers.',
    confirmedAt: new Date(Date.now() - 3600000).toISOString(),
    checkInStatus: 'checked_in',
    createdAt: new Date(Date.now() - 4000000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  };

  const seedPayment: Payment = {
    id: seedPayId,
    appointmentId: seedApptId,
    razorpayOrderId: seedOrderId,
    razorpayPaymentId: seedPaymentId,
    razorpaySignature: crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${seedOrderId}|${seedPaymentId}`)
      .digest('hex'),
    amount: 12000,
    currency: 'INR',
    appointmentFee: 10000,
    convenienceFee: 2000,
    status: 'paid',
    paymentMethod: 'upi',
    signatureVerified: true,
    paidAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 4000000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  };

  appointmentsStore.set(seedApptId, seedAppt);
  paymentsStore.set(seedPayId, seedPayment);

  auditLogsStore.push({
    id: 'aud-seed-1',
    entityType: 'appointment',
    entityId: seedApptId,
    action: 'CONFIRMED_VIA_VERIFIED_PAYMENT',
    actorRole: 'razorpay_system',
    details: 'Initial verified appointment confirmed with ₹120 payment.',
    timestamp: new Date().toISOString(),
  });
};

seedInitialData();

// Helper: Log audit
const logAudit = (
  entityType: AuditLog['entityType'],
  entityId: string,
  action: string,
  actorRole: AuditLog['actorRole'],
  details: string
) => {
  auditLogsStore.unshift({
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    entityType,
    entityId,
    action,
    actorRole,
    details,
    timestamp: new Date().toISOString(),
  });
};

// Slot Hold Expiration Worker (runs every 5 seconds)
setInterval(() => {
  const now = Date.now();
  for (const [id, hold] of appointmentHoldsStore.entries()) {
    if (hold.status === 'active') {
      const expires = new Date(hold.expiresAt).getTime();
      if (now > expires) {
        hold.status = 'expired';
        
        const appt = appointmentsStore.get(hold.appointmentId);
        if (appt && appt.status === 'pending_payment') {
          appt.status = 'cancelled';
          appt.updatedAt = new Date().toISOString();

          for (const payment of paymentsStore.values()) {
            if (payment.appointmentId === appt.id && payment.status === 'created') {
              payment.status = 'cancelled';
              payment.updatedAt = new Date().toISOString();
            }
          }

          logAudit('slot', appt.id, 'SLOT_HOLD_EXPIRED', 'system_worker', `10-minute temporary reservation expired for ${appt.id}. Slot released.`);
        }
      }
    }
  }

  for (const [id, appt] of appointmentsStore.entries()) {
    if (appt.status === 'pending_payment' && appt.holdExpiresAt) {
      const expires = new Date(appt.holdExpiresAt).getTime();
      if (now > expires) {
        appt.status = 'cancelled';
        appt.updatedAt = new Date().toISOString();

        for (const payment of paymentsStore.values()) {
          if (payment.appointmentId === id && payment.status === 'created') {
            payment.status = 'cancelled';
            payment.updatedAt = new Date().toISOString();
          }
        }
      }
    }
  }
}, 5000);

// ==============================================================================
// REALTIME AVAILABILITY ENGINE (Asia/Kolkata)
// ==============================================================================

export const calculateDoctorSlots = (
  doctorId: string,
  targetDate: string,
  serviceDurationMinutes: number = 45
): TimeSlot[] => {
  let doctor = doctorsStore.get(doctorId);
  if (!doctor) {
    doctor =
      Array.from(doctorsStore.values()).find(
        (d) => d.id?.toLowerCase() === doctorId?.toLowerCase() || d.name?.toLowerCase() === doctorId?.toLowerCase()
      ) ||
      doctorsStore.get(PRIMARY_DOCTOR_ID) ||
      Array.from(doctorsStore.values())[0];
  }

  if (!doctor || !doctor.isActive) return [];

  const kt = getKolkataTime();
  const isTargetDateToday = targetDate === kt.currentDateStr;
  const isTargetDatePast = targetDate < kt.currentDateStr;

  if (isTargetDatePast) {
    return [];
  }

  // Determine Day of Week in Asia/Kolkata
  const [y, m, d] = targetDate.split('-').map(Number);
  const targetDateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TIMEZONE,
    weekday: 'long',
  });
  const targetDayOfWeek = dayFormatter.format(targetDateObj);

  // Check Doctor Schedule for this Day
  const scheduleDay = doctor.schedule?.find((s) => s.dayOfWeek?.toLowerCase() === targetDayOfWeek?.toLowerCase());
  if (!scheduleDay || !scheduleDay.isActive) {
    return [];
  }

  const doctorStartMinutes = timeToMinutes(scheduleDay.startTime || '09:00');
  const doctorEndMinutes = timeToMinutes(scheduleDay.endTime || '18:00');

  // Collect Occupied Time Windows
  const occupiedSlots: { startMin: number; endMin: number; reason: string }[] = [];

  // 1. Break Windows (e.g. Lunch 13:00 - 14:00)
  if (scheduleDay.breaks && scheduleDay.breaks.length > 0) {
    for (const brk of scheduleDay.breaks) {
      occupiedSlots.push({
        startMin: timeToMinutes(brk.startTime),
        endMin: timeToMinutes(brk.endTime),
        reason: 'break',
      });
    }
  }

  // 2. Doctor Exceptions / Leave for targetDate
  const exceptionsForDay = (doctor.exceptions || []).filter((ex) => ex.date === targetDate);
  for (const ex of exceptionsForDay) {
    occupiedSlots.push({
      startMin: timeToMinutes(ex.startTime),
      endMin: timeToMinutes(ex.endTime),
      reason: 'doctor_leave',
    });
  }

  // 3. Blocked Slots for targetDate
  for (const blk of blockedSlotsStore.values()) {
    if (blk.doctorId === doctorId && blk.blockedDate === targetDate) {
      occupiedSlots.push({
        startMin: timeToMinutes(blk.startTime),
        endMin: timeToMinutes(blk.endTime),
        reason: 'blocked',
      });
    }
  }

  // 4. Existing Confirmed Appointments
  for (const appt of appointmentsStore.values()) {
    if (appt.doctorId === doctorId && appt.appointmentDate === targetDate) {
      if (appt.status === 'confirmed' || appt.status === 'completed') {
        const apptStart = timeToMinutes(time12To24(appt.timeSlot));
        const apptEnd = apptStart + (appt.serviceDurationMinutes || 45);
        occupiedSlots.push({ startMin: apptStart, endMin: apptEnd, reason: 'booked' });
      }
    }
  }

  // 5. Active 10-Minute Temporary Holds
  for (const hold of appointmentHoldsStore.values()) {
    if (hold.doctorId === doctorId && hold.holdDate === targetDate && hold.status === 'active') {
      if (kt.nowEpochMs < new Date(hold.expiresAt).getTime()) {
        const holdStart = timeToMinutes(hold.startTime);
        const holdEnd = timeToMinutes(hold.endTime);
        occupiedSlots.push({ startMin: holdStart, endMin: holdEnd, reason: 'held' });
      }
    }
  }

  // Generate Slots at 30-minute intervals
  const slotIntervalMinutes = 30;
  const slots: TimeSlot[] = [];

  for (
    let currentMin = doctorStartMinutes;
    currentMin + serviceDurationMinutes <= doctorEndMinutes;
    currentMin += slotIntervalMinutes
  ) {
    const slotEndMin = currentMin + serviceDurationMinutes;
    const { time24, time12 } = minutesToTimeFormats(currentMin);

    let isAvailable = true;
    let reason: string | undefined;

    // Rule 1: CRITICAL - For today in Asia/Kolkata, NEVER show slots that have already started/passed
    // Example: If current time is 14:31 IST, 09:30, 10:30, 11:30, 12:30, 13:30, 14:30 must NOT appear
    if (isTargetDateToday && currentMin <= kt.currentTimeMinutes) {
      isAvailable = false;
      reason = 'past_time';
    }

    // Rule 2: Overlaps existing booking, break, exception, hold, or blocked slot
    if (isAvailable) {
      for (const occ of occupiedSlots) {
        const hasOverlap = currentMin < occ.endMin && slotEndMin > occ.startMin;
        if (hasOverlap) {
          isAvailable = false;
          reason = occ.reason;
          break;
        }
      }
    }

    // Only include in public slots if NOT past time
    if (reason !== 'past_time') {
      slots.push({
        time: time12,
        time24,
        isAvailable,
        reason,
        isHeld: reason === 'held',
      });
    }
  }

  return slots;
};

// ==============================================================================
// API ROUTES
// ==============================================================================

// 01. Centralized Clinic Settings
app.get('/api/clinic-settings', (_req: Request, res: Response) => {
  res.json({ settings: clinicSettings });
});

app.put('/api/clinic-settings', (req: Request, res: Response) => {
  clinicSettings = {
    ...clinicSettings,
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  clinicPricing.appointmentFee = clinicSettings.appointmentFee;
  clinicPricing.convenienceFee = clinicSettings.convenienceFee;
  clinicPricing.totalAmount = clinicSettings.totalAmount;
  clinicPricing.slotHoldMinutes = clinicSettings.slotHoldMinutes;

  logAudit('pricing', 'clinic-settings-1', 'UPDATED_CLINIC_SETTINGS', 'admin', 'Clinic settings updated by administrator.');
  res.json({ success: true, settings: clinicSettings });
});

// Config & Clinic Time
app.get('/api/config', (_req: Request, res: Response) => {
  const kt = getKolkataTime();
  res.json({
    razorpayKeyId: RAZORPAY_KEY_ID,
    pricing: clinicPricing,
    clinicSettings,
    currentClinicTime: {
      date: kt.currentDateStr,
      time: kt.timeFormatted,
      dayOfWeek: kt.currentDayOfWeek,
      timezone: CLINIC_TIMEZONE,
    },
  });
});

// Auth Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const staff = Array.from(staffStore.values()).find((s) => s.email.toLowerCase() === email?.toLowerCase());

  if (!staff || !staff.isActive) {
    return res.status(401).json({ error: 'Invalid credentials or inactive account.' });
  }

  if (password !== 'staff123' && password !== 'admin123') {
    return res.status(401).json({ error: 'Invalid password.' });
  }

  staff.lastLoginAt = new Date().toISOString();
  logAudit('staff', staff.id, 'STAFF_LOGIN', staff.role, `Successful login by ${staff.name} (${staff.email})`);

  res.json({
    success: true,
    user: {
      id: staff.id,
      email: staff.email,
      name: staff.name,
      role: staff.role,
      token: `jwt_sim_${staff.id}_${Date.now()}`,
    },
  });
});

// Specialties & Treatments
const handleGetSpecialties = (_req: Request, res: Response) => {
  const active = Array.from(specialtiesStore.values()).filter((s) => s.isActive);
  res.json({ specialties: active });
};
app.get('/api/specialties', handleGetSpecialties);
app.get('/specialties', handleGetSpecialties);

const handleGetTreatments = (_req: Request, res: Response) => {
  const active = Array.from(servicesStore.values()).filter((s) => s.isActive);
  res.json({ treatments: active });
};
app.get('/api/treatments', handleGetTreatments);
app.get('/treatments', handleGetTreatments);

// Doctors
const handleGetDoctors = (_req: Request, res: Response) => {
  const active = Array.from(doctorsStore.values()).filter((d) => d.isActive);
  res.json({ doctors: active });
};
app.get('/api/doctors', handleGetDoctors);
app.get('/doctors', handleGetDoctors);

// Real-Time Slot Availability
const handleGetSlots = (req: Request, res: Response) => {
  const { doctorId, date, serviceId } = req.query as { doctorId?: string; date?: string; serviceId?: string };

  if (!doctorId || !date) {
    return res.status(400).json({ error: 'doctorId and date (YYYY-MM-DD) are required.' });
  }

  let duration = 45;
  if (serviceId) {
    const service = servicesStore.get(serviceId);
    if (service) duration = service.durationMinutes;
  }

  const slots = calculateDoctorSlots(doctorId, date, duration);
  const kt = getKolkataTime();

  res.json({
    doctorId,
    date,
    serviceDurationMinutes: duration,
    slots,
    clinicTime: {
      currentDate: kt.currentDateStr,
      currentTime: kt.timeFormatted,
      timezone: CLINIC_TIMEZONE,
    },
  });
};
app.get('/api/slots/available', handleGetSlots);
app.get('/slots/available', handleGetSlots);
app.get('/api/slots', handleGetSlots);
app.get('/slots', handleGetSlots);

// Admin Doctor Schedules
app.get('/api/admin/doctors/:id/schedule', (req: Request, res: Response) => {
  const doctor = doctorsStore.get(req.params.id);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
  res.json({ schedule: doctor.schedule });
});

app.put('/api/admin/doctors/:id/schedule', (req: Request, res: Response) => {
  const doctor = doctorsStore.get(req.params.id);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

  const { schedule } = req.body as { schedule: DoctorWorkingHours[] };
  if (!Array.isArray(schedule)) {
    return res.status(400).json({ error: 'Schedule must be an array of working hours.' });
  }

  doctor.schedule = schedule;
  logAudit('doctor', doctor.id, 'UPDATED_DOCTOR_SCHEDULE', 'admin', `Updated weekly working hours for ${doctor.name}.`);
  res.json({ success: true, schedule: doctor.schedule });
});

// Admin Doctor Exceptions
app.post('/api/admin/doctors/:id/exceptions', (req: Request, res: Response) => {
  const doctor = doctorsStore.get(req.params.id);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

  const { date, startTime, endTime, reason, exceptionType } = req.body;
  if (!date || !startTime || !endTime || !reason) {
    return res.status(400).json({ error: 'Missing required exception fields.' });
  }

  const newEx: DoctorException = {
    id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    doctorId: doctor.id,
    date,
    startTime,
    endTime,
    exceptionType: exceptionType || 'leave',
    reason,
    createdAt: new Date().toISOString(),
  };

  doctor.exceptions = doctor.exceptions || [];
  doctor.exceptions.push(newEx);

  logAudit('doctor', doctor.id, 'ADDED_DOCTOR_EXCEPTION', 'admin', `Added exception for ${doctor.name} on ${date}: ${reason}`);
  res.json({ success: true, exception: newEx });
});

app.delete('/api/admin/doctors/:id/exceptions/:exceptionId', (req: Request, res: Response) => {
  const doctor = doctorsStore.get(req.params.id);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

  doctor.exceptions = (doctor.exceptions || []).filter((e) => e.id !== req.params.exceptionId);
  logAudit('doctor', doctor.id, 'REMOVED_DOCTOR_EXCEPTION', 'admin', `Removed exception ${req.params.exceptionId} for ${doctor.name}.`);
  res.json({ success: true });
});

// Admin Blocked Slots
app.get('/api/admin/doctors/:id/blocked-slots', (req: Request, res: Response) => {
  const slots = Array.from(blockedSlotsStore.values()).filter((b) => b.doctorId === req.params.id);
  res.json({ blockedSlots: slots });
});

app.post('/api/admin/doctors/:id/blocked-slots', (req: Request, res: Response) => {
  const doctor = doctorsStore.get(req.params.id);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

  const { blockedDate, startTime, endTime, reason, timeSlot12 } = req.body;
  if (!blockedDate || !startTime || !endTime || !reason) {
    return res.status(400).json({ error: 'Missing blockedDate, startTime, endTime, or reason.' });
  }

  const newBlock: BlockedSlot = {
    id: `blk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    doctorId: doctor.id,
    doctorName: doctor.name,
    blockedDate,
    startTime,
    endTime,
    timeSlot12,
    reason,
    createdAt: new Date().toISOString(),
  };

  blockedSlotsStore.set(newBlock.id, newBlock);
  logAudit('slot', newBlock.id, 'BLOCKED_APPOINTMENT_SLOT', 'admin', `Blocked slot for ${doctor.name} on ${blockedDate} at ${startTime}-${endTime}: ${reason}`);
  res.json({ success: true, blockedSlot: newBlock });
});

app.delete('/api/admin/blocked-slots/:id', (req: Request, res: Response) => {
  const exists = blockedSlotsStore.get(req.params.id);
  if (!exists) return res.status(404).json({ error: 'Blocked slot not found' });

  blockedSlotsStore.delete(req.params.id);
  logAudit('slot', req.params.id, 'UNBLOCKED_APPOINTMENT_SLOT', 'admin', `Unblocked slot ${req.params.id}`);
  res.json({ success: true });
});

// Reviews System
app.get('/api/reviews', (_req: Request, res: Response) => {
  const approved = Array.from(reviewsStore.values())
    .filter((r) => r.approved)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ reviews: approved });
});

app.post('/api/reviews', (req: Request, res: Response) => {
  const { patientName, rating, reviewText, treatmentName } = req.body;

  if (!patientName || !rating || !reviewText) {
    return res.status(400).json({ error: 'Name, rating (1-5), and review text are required.' });
  }

  const numRating = Math.max(1, Math.min(5, Number(rating)));

  const newReview: Review = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    patientName: patientName.trim(),
    rating: numRating,
    reviewText: reviewText.trim(),
    treatmentName: treatmentName || 'Cosmetic Consultation',
    approved: false, // Requires Admin Moderation
    featured: false,
    isDemo: false,
    createdAt: new Date().toISOString(),
  };

  reviewsStore.set(newReview.id, newReview);
  logAudit('review', newReview.id, 'SUBMITTED_PATIENT_REVIEW', 'patient', `Patient ${patientName} submitted review (${numRating} stars).`);

  res.json({
    success: true,
    message: 'Thank you! Your review will be published upon clinical moderation.',
    review: newReview,
  });
});

app.get('/api/admin/reviews', (_req: Request, res: Response) => {
  const allReviews = Array.from(reviewsStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ reviews: allReviews });
});

app.put('/api/admin/reviews/:id', (req: Request, res: Response) => {
  const review = reviewsStore.get(req.params.id);
  if (!review) return res.status(404).json({ error: 'Review not found' });

  const { approved, featured } = req.body;
  if (typeof approved === 'boolean') review.approved = approved;
  if (typeof featured === 'boolean') review.featured = featured;
  review.updatedAt = new Date().toISOString();

  logAudit('review', review.id, 'MODERATED_REVIEW', 'admin', `Review ${review.id} updated: approved=${review.approved}`);
  res.json({ success: true, review });
});

app.delete('/api/admin/reviews/:id', (req: Request, res: Response) => {
  if (!reviewsStore.has(req.params.id)) return res.status(404).json({ error: 'Review not found' });
  reviewsStore.delete(req.params.id);
  logAudit('review', req.params.id, 'DELETED_REVIEW', 'admin', `Review ${req.params.id} deleted.`);
  res.json({ success: true });
});

// ==============================================================================
// ==============================================================================
// SUPABASE SYNC HELPERS (Non-blocking, resilient cloud persistence)
// ==============================================================================

const appointmentSupabaseIdMap = new Map<string, string>();
let cachedDbDoctors: { id: string; name: string }[] | null = null;
let cachedDbServices: { id: string; name: string; slug: string }[] | null = null;

const getDbDoctorId = async (doctorRefId: string, doctorName?: string): Promise<string | null> => {
  if (!supabaseServer) return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(doctorRefId)) {
    return doctorRefId;
  }
  try {
    if (!cachedDbDoctors) {
      const { data } = await supabaseServer.from('doctors').select('id, name');
      if (data) cachedDbDoctors = data;
    }
    if (cachedDbDoctors && cachedDbDoctors.length > 0) {
      if (doctorName) {
        const found = cachedDbDoctors.find(
          (d) => d.name.toLowerCase().includes(doctorName.toLowerCase()) || doctorName.toLowerCase().includes(d.name.toLowerCase())
        );
        if (found) return found.id;
      }
      return cachedDbDoctors[0].id;
    }
  } catch (e) {
    // Non-blocking fallback
  }
  return null;
};

const getDbServiceId = async (serviceRefId: string, serviceName?: string): Promise<string | null> => {
  if (!supabaseServer) return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(serviceRefId)) {
    return serviceRefId;
  }
  try {
    if (!cachedDbServices) {
      const { data } = await supabaseServer.from('services').select('id, name, slug');
      if (data) cachedDbServices = data;
    }
    if (cachedDbServices && cachedDbServices.length > 0) {
      if (serviceName) {
        const found = cachedDbServices.find(
          (s) => s.name.toLowerCase().includes(serviceName.toLowerCase()) || serviceName.toLowerCase().includes(s.name.toLowerCase())
        );
        if (found) return found.id;
      }
      return cachedDbServices[0].id;
    }
  } catch (e) {
    // Non-blocking fallback
  }
  return null;
};

const syncAppointmentToSupabase = async (appt: Appointment) => {
  if (!supabaseServer) return;
  try {
    let patientId: string | null = null;
    const email = appt.patientEmail?.trim().toLowerCase();
    if (email) {
      const { data: existingPatient } = await supabaseServer
        .from('patients')
        .select('id')
        .eq('email', email)
        .limit(1)
        .maybeSingle();
      if (existingPatient) {
        patientId = existingPatient.id;
      } else {
        const { data: newPatient } = await supabaseServer
          .from('patients')
          .insert({
            full_name: appt.patientName || 'Anonymous Patient',
            email: email,
            phone: appt.patientPhone || '+91 9876543210',
          })
          .select('id')
          .single();
        if (newPatient) patientId = newPatient.id;
      }
    }

    const doctorId = await getDbDoctorId(appt.doctorId, appt.doctorName);
    const serviceId = await getDbServiceId(appt.serviceId, appt.serviceName);

    if (!doctorId || !serviceId || !patientId) return;

    const time24 = time12To24(appt.timeSlot);
    const [hStr, mStr] = time24.split(':');
    const h = parseInt(hStr || '10', 10);
    const m = parseInt(mStr || '00', 10);
    const dur = appt.serviceDurationMinutes || 45;
    const endMinutes = h * 60 + m + dur;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const endTime24 = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

    const startAt = `${appt.appointmentDate}T${time24}:00+05:30`;
    const endAt = `${appt.appointmentDate}T${endTime24}:00+05:30`;

    let statusEnum = 'pending_payment';
    if (appt.status === 'confirmed') statusEnum = 'confirmed';
    else if (appt.status === 'cancelled' || appt.status === 'payment_failed') statusEnum = 'cancelled';
    else if (appt.status === 'completed') statusEnum = 'completed';

    const existingSupabaseId = appointmentSupabaseIdMap.get(appt.id);
    if (existingSupabaseId) {
      const { error } = await supabaseServer
        .from('appointments')
        .update({
          status: statusEnum,
          patient_notes: appt.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSupabaseId);
      if (error) console.warn('[Supabase Sync] Appointment update error:', error.message);
    } else {
      const { data, error } = await supabaseServer
        .from('appointments')
        .insert({
          patient_id: patientId,
          doctor_id: doctorId,
          service_id: serviceId,
          start_at: startAt,
          end_at: endAt,
          status: statusEnum,
          patient_notes: appt.notes || null,
        })
        .select('id')
        .single();
      if (error) {
        console.warn('[Supabase Sync] Appointment insert error:', error.message);
      } else if (data) {
        appointmentSupabaseIdMap.set(appt.id, data.id);
      }
    }
  } catch (err: any) {
    console.warn('[Supabase Sync] Failed to sync appointment:', err.message || err);
  }
};

const syncPaymentToSupabase = async (payment: Payment) => {
  if (!supabaseServer) return;
  try {
    const supabaseApptId = appointmentSupabaseIdMap.get(payment.appointmentId) || null;

    let paymentStatus = 'created';
    if (payment.status === 'paid') paymentStatus = 'paid';
    else if (payment.status === 'failed') paymentStatus = 'failed';
    else if (payment.status === 'cancelled') paymentStatus = 'cancelled';
    else if (payment.status === 'refunded') paymentStatus = 'refunded';

    const { data: existingPayment } = await supabaseServer
      .from('payments')
      .select('id')
      .eq('razorpay_order_id', payment.razorpayOrderId)
      .limit(1)
      .maybeSingle();

    if (existingPayment) {
      const { error } = await supabaseServer
        .from('payments')
        .update({
          razorpay_payment_id: payment.razorpayPaymentId || null,
          status: paymentStatus,
          signature_verified: payment.signatureVerified,
          paid_at: payment.paidAt || (payment.status === 'paid' ? new Date().toISOString() : null),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPayment.id);
      if (error) console.warn('[Supabase Sync] Payment update error:', error.message);
    } else if (supabaseApptId) {
      const { error } = await supabaseServer
        .from('payments')
        .insert({
          appointment_id: supabaseApptId,
          razorpay_order_id: payment.razorpayOrderId,
          razorpay_payment_id: payment.razorpayPaymentId || null,
          appointment_fee: payment.appointmentFee,
          convenience_fee: payment.convenienceFee,
          currency: payment.currency || 'INR',
          status: paymentStatus,
          signature_verified: payment.signatureVerified,
          paid_at: payment.paidAt || null,
        });
      if (error) console.warn('[Supabase Sync] Payment insert error:', error.message);
    }
  } catch (err: any) {
    console.warn('[Supabase Sync] Failed to sync payment:', err.message || err);
  }
};

const syncWebhookEventToSupabase = async (event: WebhookEvent) => {
  if (!supabaseServer) return;
  try {
    const { error } = await supabaseServer.from('webhook_events').upsert({
      event_id: event.eventId,
      event_type: event.eventType,
      provider: 'razorpay',
      payload: event.payload,
      processed: event.status === 'processed',
      processed_at: event.processedAt,
      created_at: event.createdAt,
    }, { onConflict: 'event_id' });
    if (error) console.warn('[Supabase Sync] Webhook event upsert error:', error.message);
  } catch (err: any) {
    console.warn('[Supabase Sync] Failed to sync webhook event:', err.message || err);
  }
};

const syncAuditLogToSupabase = async (log: AuditLog) => {
  if (!supabaseServer) return;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(log.entityId);
    const { error } = await supabaseServer.from('audit_logs').insert({
      entity_type: log.entityType,
      entity_id: isUuid ? log.entityId : null,
      action: log.action,
      actor_id: null,
      metadata: {
        actor_role: log.actorRole,
        original_entity_id: log.entityId,
        details: log.details,
      },
      created_at: log.timestamp || new Date().toISOString(),
    });
    if (error) console.warn('[Supabase Sync] Audit log insert error:', error.message);
  } catch (err: any) {
    console.warn('[Supabase Sync] Failed to sync audit log:', err.message || err);
  }
};

const syncAppointmentHoldToSupabase = async (hold: {
  id: string;
  appointmentId: string;
  doctorId: string;
  holdDate: string;
  startTime: string;
  endTime: string;
  expiresAt: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}) => {
  if (!supabaseServer) return;
  try {
    const supabaseApptId = appointmentSupabaseIdMap.get(hold.appointmentId);
    const doctorId = await getDbDoctorId(hold.doctorId);

    if (!doctorId) return;

    const startAt = `${hold.holdDate}T${hold.startTime}:00+05:30`;
    const endAt = `${hold.holdDate}T${hold.endTime}:00+05:30`;

    if (supabaseApptId) {
      const { data: existingHold } = await supabaseServer
        .from('appointment_holds')
        .select('id')
        .eq('appointment_id', supabaseApptId)
        .limit(1)
        .maybeSingle();

      if (existingHold) {
        const { error } = await supabaseServer
          .from('appointment_holds')
          .update({
            status: hold.status,
            expires_at: hold.expiresAt,
          })
          .eq('id', existingHold.id);
        if (error) console.warn('[Supabase Sync] Hold update error:', error.message);
        return;
      }
    }

    const { error } = await supabaseServer
      .from('appointment_holds')
      .insert({
        appointment_id: supabaseApptId || null,
        doctor_id: doctorId,
        start_at: startAt,
        end_at: endAt,
        expires_at: hold.expiresAt,
        status: hold.status,
      });
    if (error) console.warn('[Supabase Sync] Hold insert error:', error.message);
  } catch (err: any) {
    console.warn('[Supabase Sync] Failed to sync appointment hold:', err.message || err);
  }
};

// Periodic Background Hold Cleaner (Every 60 Seconds)
setInterval(() => {
  const now = Date.now();
  for (const hold of appointmentHoldsStore.values()) {
    if (hold.status === 'active' && new Date(hold.expiresAt).getTime() < now) {
      hold.status = 'expired';
      syncAppointmentHoldToSupabase(hold);

      const appt = appointmentsStore.get(hold.appointmentId);
      if (appt && appt.status === 'pending_payment') {
        appt.status = 'cancelled';
        appt.updatedAt = new Date().toISOString();
        syncAppointmentToSupabase(appt);
      }
    }
  }
}, 60000);

// ==============================================================================
// PAYMENTS & ATOMIC 10-MINUTE HOLD CREATION (Razorpay Orders)
// ==============================================================================

const handleCreateOrder = async (req: Request, res: Response) => {
  const { doctorId, serviceId, appointmentDate, timeSlot, patientName, patientEmail, patientPhone, patientAge, gender, notes } = req.body;

  if (!doctorId || !serviceId || !appointmentDate || !timeSlot || !patientName || !patientEmail || !patientPhone) {
    return res.status(400).json({ error: 'Missing required reservation fields.' });
  }

  let doctor = doctorsStore.get(doctorId);
  if (!doctor) {
    doctor =
      Array.from(doctorsStore.values()).find(
        (d) => d.id?.toLowerCase() === doctorId?.toLowerCase() || d.name?.toLowerCase() === doctorId?.toLowerCase()
      ) ||
      doctorsStore.get(PRIMARY_DOCTOR_ID) ||
      Array.from(doctorsStore.values())[0];
  }

  let service = servicesStore.get(serviceId);
  if (!service) {
    service =
      Array.from(servicesStore.values()).find(
        (s) => s.id?.toLowerCase() === serviceId?.toLowerCase() || s.slug?.toLowerCase() === serviceId?.toLowerCase() || s.name?.toLowerCase() === serviceId?.toLowerCase()
      ) ||
      Array.from(servicesStore.values())[0];
  }

  if (!doctor || !service) {
    return res.status(400).json({ error: 'Invalid doctor or service selected.' });
  }

  // 1. Double-Booking Protection: Recheck Slot Availability Server-Side
  const availableSlots = calculateDoctorSlots(doctorId, appointmentDate, service.durationMinutes);
  const requestedSlot = availableSlots.find((s) => s.time === timeSlot);

  if (!requestedSlot || !requestedSlot.isAvailable) {
    return res.status(409).json({
      error: 'That appointment time is no longer available. Please choose another time.',
    });
  }

  // 2. Authoritative Server Pricing (₹100 + ₹20 = ₹120 -> 12000 paise)
  const appointmentFeeINR = clinicPricing.appointmentFee; // ₹100
  const convenienceFeeINR = clinicPricing.convenienceFee;  // ₹20
  const totalAmountINR = appointmentFeeINR + convenienceFeeINR; // ₹120
  const totalAmountPaise = totalAmountINR * 100; // 12000 paise

  const apptId = `APT-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  let orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const holdExpiresAt = new Date(Date.now() + clinicPricing.slotHoldMinutes * 60000).toISOString();

  // Attempt real Razorpay API order creation if configured with live/test keys
  if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET && !RAZORPAY_KEY_ID.includes('placeholder') && RAZORPAY_KEY_ID.startsWith('rzp_')) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          amount: totalAmountPaise,
          currency: 'INR',
          receipt: apptId,
          notes: {
            appointment_id: apptId,
            patient_name: patientName.trim(),
            doctor_id: doctorId,
            service_id: serviceId,
          },
        }),
      });

      if (rzpRes.ok) {
        const rzpData: any = await rzpRes.json();
        if (rzpData && rzpData.id) {
          orderId = rzpData.id;
        }
      } else {
        console.warn('[Razorpay API] Order creation returned non-200, using test order ID');
      }
    } catch (rzpErr) {
      console.warn('[Razorpay API] Network unreachable, using deterministic test order ID:', rzpErr);
    }
  }

  const slot24 = time12To24(timeSlot);
  const slotEndMinutes = timeToMinutes(slot24) + service.durationMinutes;
  const slotEnd24 = minutesToTimeFormats(slotEndMinutes).time24;

  // 3. Create Appointment Record in Pending State
  const newAppt: Appointment = {
    id: apptId,
    patientName: patientName.trim(),
    patientEmail: patientEmail.trim(),
    patientPhone: patientPhone.trim(),
    patientAge: patientAge ? Number(patientAge) : undefined,
    gender: gender || 'Prefer not to say',
    doctorId,
    doctorName: doctor.name,
    serviceId,
    serviceName: service.name,
    serviceDurationMinutes: service.durationMinutes,
    appointmentDate,
    timeSlot,
    status: 'pending_payment',
    appointmentFee: appointmentFeeINR,
    convenienceFee: convenienceFeeINR,
    totalAmount: totalAmountINR,
    currency: 'INR',
    notes: notes ? notes.trim() : undefined,
    holdExpiresAt,
    checkInStatus: 'not_arrived',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 4. Create appointment_holds record
  const holdRecord = {
    id: `hld-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    appointmentId: apptId,
    doctorId,
    holdDate: appointmentDate,
    startTime: slot24,
    endTime: slotEnd24,
    expiresAt: holdExpiresAt,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  const newPayment: Payment = {
    id: `PAY-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    appointmentId: apptId,
    razorpayOrderId: orderId,
    amount: totalAmountPaise,
    currency: 'INR',
    appointmentFee: appointmentFeeINR * 100,
    convenienceFee: convenienceFeeINR * 100,
    status: 'created',
    signatureVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  appointmentsStore.set(apptId, newAppt);
  appointmentHoldsStore.set(holdRecord.id, holdRecord);
  paymentsStore.set(newPayment.id, newPayment);

  // Sync to Supabase in background
  syncAppointmentToSupabase(newAppt);
  syncAppointmentHoldToSupabase(holdRecord);
  syncPaymentToSupabase(newPayment);

  const logEntry: AuditLog = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    entityType: 'appointment',
    entityId: apptId,
    action: 'CREATED_PENDING_HOLD',
    actorRole: 'patient',
    details: `Created temporary 10-minute hold and ₹120 order for ${patientName} on ${appointmentDate} at ${timeSlot}. Order: ${orderId}`,
    timestamp: new Date().toISOString(),
  };
  auditLogsStore.unshift(logEntry);
  syncAuditLogToSupabase(logEntry);

  res.json({
    success: true,
    orderId,
    amount: totalAmountPaise,
    currency: 'INR',
    keyId: RAZORPAY_KEY_ID,
    appointmentId: apptId,
    holdExpiresAt,
    appointmentFee: appointmentFeeINR,
    convenienceFee: convenienceFeeINR,
    totalDisplayAmount: totalAmountINR,
  });
};

app.post('/api/payments/create-order', handleCreateOrder);
app.post('/api/razorpay/create-order', handleCreateOrder);

const handleVerifyPayment = (req: Request, res: Response) => {
  const appointmentId = req.body.appointmentId || req.body.appointment_id;
  const razorpay_order_id = req.body.razorpay_order_id || req.body.razorpayOrderId;
  const razorpay_payment_id = req.body.razorpay_payment_id || req.body.razorpayPaymentId;
  const razorpay_signature = req.body.razorpay_signature || req.body.razorpaySignature;
  const payment_method = req.body.payment_method || req.body.paymentMethod;

  if (!appointmentId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({
      success: false,
      error: 'Missing required signature verification parameters.',
    });
  }

  const appt = appointmentsStore.get(appointmentId);
  if (!appt) {
    return res.status(404).json({ success: false, error: 'Appointment not found.' });
  }

  // Idempotency: If already confirmed for this order, return success
  if (appt.status === 'confirmed') {
    let existingPay: Payment | undefined;
    for (const p of paymentsStore.values()) {
      if (p.appointmentId === appointmentId && p.razorpayOrderId === razorpay_order_id) {
        existingPay = p;
        break;
      }
    }
    return res.json({
      success: true,
      appointment: appt,
      payment: existingPay,
      receiptNumber: `RCP-${Date.now().toString().slice(-6)}`,
    });
  }

  let paymentRecord: Payment | undefined;
  for (const p of paymentsStore.values()) {
    if (p.appointmentId === appointmentId && p.razorpayOrderId === razorpay_order_id) {
      paymentRecord = p;
      break;
    }
  }

  // Cryptographic HMAC SHA-256 Signature Verification
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  let isSignatureValid = false;
  try {
    isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(razorpay_signature, 'utf8')
    );
  } catch {
    isSignatureValid = false;
  }

  if (!isSignatureValid) {
    appt.status = 'payment_failed';
    appt.updatedAt = new Date().toISOString();

    if (paymentRecord) {
      paymentRecord.status = 'failed';
      paymentRecord.errorCode = 'BAD_SIGNATURE';
      paymentRecord.errorDescription = 'Signature verification mismatch.';
      paymentRecord.updatedAt = new Date().toISOString();
      syncPaymentToSupabase(paymentRecord);
    }

    // Release hold on failure
    for (const hold of appointmentHoldsStore.values()) {
      if (hold.appointmentId === appointmentId && hold.status === 'active') {
        hold.status = 'released';
        syncAppointmentHoldToSupabase(hold);
      }
    }

    syncAppointmentToSupabase(appt);

    const failLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      entityType: 'payment',
      entityId: appointmentId,
      action: 'SIGNATURE_VERIFICATION_FAILED',
      actorRole: 'razorpay_system',
      details: `Invalid signature for order ${razorpay_order_id}. Payment rejected.`,
      timestamp: new Date().toISOString(),
    };
    auditLogsStore.unshift(failLog);
    syncAuditLogToSupabase(failLog);

    return res.status(400).json({
      success: false,
      error: 'Your payment could not be verified. Your appointment has not been confirmed.',
    });
  }

  // Payment Verified Successfully: Confirm appointment and convert hold
  const paidAt = new Date().toISOString();
  appt.status = 'confirmed';
  appt.confirmedAt = paidAt;
  appt.updatedAt = paidAt;
  delete appt.holdExpiresAt;

  // Convert hold to confirmed
  for (const hold of appointmentHoldsStore.values()) {
    if (hold.appointmentId === appointmentId && hold.status === 'active') {
      hold.status = 'converted_to_appointment';
      syncAppointmentHoldToSupabase(hold);
    }
  }

  if (paymentRecord) {
    paymentRecord.status = 'paid';
    paymentRecord.razorpayPaymentId = razorpay_payment_id;
    paymentRecord.razorpaySignature = razorpay_signature;
    paymentRecord.signatureVerified = true;
    paymentRecord.paymentMethod = (payment_method as any) || 'upi';
    paymentRecord.paidAt = paidAt;
    paymentRecord.updatedAt = paidAt;
    syncPaymentToSupabase(paymentRecord);
  }

  syncAppointmentToSupabase(appt);

  const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;

  const successLog: AuditLog = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    entityType: 'payment',
    entityId: appointmentId,
    action: 'PAYMENT_VERIFIED_CONFIRMED',
    actorRole: 'razorpay_system',
    details: `Payment verified and appointment ${appointmentId} confirmed for ${appt.patientName}. Receipt: ${receiptNumber}`,
    timestamp: new Date().toISOString(),
  };
  auditLogsStore.unshift(successLog);
  syncAuditLogToSupabase(successLog);

  res.json({
    success: true,
    appointment: appt,
    payment: paymentRecord,
    receiptNumber,
  });
};

app.post('/api/payments/verify', handleVerifyPayment);
app.post('/api/payments/verify-payment', handleVerifyPayment);
app.post('/api/razorpay/verify', handleVerifyPayment);
app.post('/api/razorpay/verify-payment', handleVerifyPayment);

// ==============================================================================
// RAZORPAY REAL WEBHOOK HANDLER
// ==============================================================================

const handleRazorpayWebhook = async (req: Request, res: Response) => {
  const webhookSignature = (req.headers['x-razorpay-signature'] as string) || '';
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  let isSigValid = false;
  if (webhookSignature && RAZORPAY_WEBHOOK_SECRET) {
    const expectedSig = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    try {
      isSigValid = crypto.timingSafeEqual(
        Buffer.from(expectedSig, 'utf8'),
        Buffer.from(webhookSignature, 'utf8')
      );
    } catch {
      isSigValid = false;
    }
  }

  const payload = req.body || {};
  const eventType = payload.event || 'unknown';
  const eventId = payload.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const paymentEntity = payload.payload?.payment?.entity;
  const orderId = paymentEntity?.order_id || payload.payload?.order?.entity?.id || '';
  const paymentId = paymentEntity?.id || '';

  // Idempotent deduplication check
  if (webhookEventsStore.has(eventId)) {
    return res.status(200).json({ status: 'ok', message: 'Duplicate webhook event ignored' });
  }

  const whEvent: WebhookEvent = {
    id: `wh-${Date.now()}`,
    eventId,
    eventType,
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    signature: webhookSignature,
    signatureVerified: isSigValid,
    payload,
    status: isSigValid ? 'processed' : 'rejected_signature',
    processedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  webhookEventsStore.set(eventId, whEvent);
  syncWebhookEventToSupabase(whEvent);

  if (!isSigValid) {
    logAudit('webhook', eventId, 'WEBHOOK_SIGNATURE_REJECTED', 'razorpay_system', `Rejected webhook event ${eventType} due to invalid signature.`);
    return res.status(400).json({ status: 'error', error: 'Invalid webhook signature' });
  }

  // Handle Event Types
  if (eventType === 'payment.captured' || eventType === 'order.paid') {
    // Find appointment by order ID
    let matchedPayment: Payment | undefined;
    for (const p of paymentsStore.values()) {
      if (p.razorpayOrderId === orderId) {
        matchedPayment = p;
        break;
      }
    }

    if (matchedPayment) {
      matchedPayment.status = 'paid';
      matchedPayment.signatureVerified = true;
      matchedPayment.razorpayPaymentId = paymentId || matchedPayment.razorpayPaymentId;
      matchedPayment.paidAt = new Date().toISOString();
      matchedPayment.updatedAt = new Date().toISOString();
      syncPaymentToSupabase(matchedPayment);

      const matchedAppt = appointmentsStore.get(matchedPayment.appointmentId);
      if (matchedAppt) {
        matchedAppt.status = 'confirmed';
        matchedAppt.confirmedAt = matchedPayment.paidAt;
        matchedAppt.updatedAt = matchedPayment.paidAt;
        delete matchedAppt.holdExpiresAt;
        syncAppointmentToSupabase(matchedAppt);

        // Convert hold
        for (const hold of appointmentHoldsStore.values()) {
          if (hold.appointmentId === matchedAppt.id && hold.status === 'active') {
            hold.status = 'converted_to_appointment';
            syncAppointmentHoldToSupabase(hold);
          }
        }
      }
    }

    logAudit('webhook', eventId, 'WEBHOOK_PAYMENT_CAPTURED', 'razorpay_system', `Processed ${eventType} for order ${orderId}, payment ${paymentId}.`);
  } else if (eventType === 'payment.failed') {
    let matchedPayment: Payment | undefined;
    for (const p of paymentsStore.values()) {
      if (p.razorpayOrderId === orderId) {
        matchedPayment = p;
        break;
      }
    }

    if (matchedPayment) {
      matchedPayment.status = 'failed';
      matchedPayment.errorCode = paymentEntity?.error_code || 'PAYMENT_FAILED';
      matchedPayment.errorDescription = paymentEntity?.error_description || 'Payment failed via webhook';
      matchedPayment.updatedAt = new Date().toISOString();
      syncPaymentToSupabase(matchedPayment);

      const matchedAppt = appointmentsStore.get(matchedPayment.appointmentId);
      if (matchedAppt && matchedAppt.status === 'pending_payment') {
        matchedAppt.status = 'payment_failed';
        matchedAppt.updatedAt = new Date().toISOString();
        syncAppointmentToSupabase(matchedAppt);

        for (const hold of appointmentHoldsStore.values()) {
          if (hold.appointmentId === matchedAppt.id && hold.status === 'active') {
            hold.status = 'released';
            syncAppointmentHoldToSupabase(hold);
          }
        }
      }
    }

    logAudit('webhook', eventId, 'WEBHOOK_PAYMENT_FAILED', 'razorpay_system', `Processed payment.failed for order ${orderId}.`);
  } else if (eventType === 'refund.processed') {
    let matchedPayment: Payment | undefined;
    for (const p of paymentsStore.values()) {
      if (p.razorpayOrderId === orderId || (paymentId && p.razorpayPaymentId === paymentId)) {
        matchedPayment = p;
        break;
      }
    }

    if (matchedPayment) {
      matchedPayment.status = 'refunded';
      matchedPayment.updatedAt = new Date().toISOString();
      syncPaymentToSupabase(matchedPayment);

      const matchedAppt = appointmentsStore.get(matchedPayment.appointmentId);
      if (matchedAppt) {
        matchedAppt.status = 'cancelled';
        matchedAppt.updatedAt = new Date().toISOString();
        syncAppointmentToSupabase(matchedAppt);
      }
    }

    logAudit('webhook', eventId, 'WEBHOOK_REFUND_PROCESSED', 'razorpay_system', `Processed refund for order ${orderId}.`);
  }

  return res.status(200).json({ status: 'ok' });
};

app.post('/api/razorpay/webhook', handleRazorpayWebhook);
app.post('/api/webhooks/razorpay', handleRazorpayWebhook);

// Release Temporary Slot Hold Endpoint
app.post('/api/appointments/release-hold', (req: Request, res: Response) => {
  const { appointmentId } = req.body;
  const appt = appointmentsStore.get(appointmentId);

  if (appt && appt.status === 'pending_payment') {
    appt.status = 'cancelled';
    appt.updatedAt = new Date().toISOString();
    syncAppointmentToSupabase(appt);

    for (const hold of appointmentHoldsStore.values()) {
      if (hold.appointmentId === appointmentId && hold.status === 'active') {
        hold.status = 'released';
        syncAppointmentHoldToSupabase(hold);
      }
    }

    for (const payment of paymentsStore.values()) {
      if (payment.appointmentId === appointmentId && payment.status === 'created') {
        payment.status = 'cancelled';
        payment.updatedAt = new Date().toISOString();
        syncPaymentToSupabase(payment);
      }
    }

    logAudit('slot', appointmentId, 'SLOT_HOLD_MANUALLY_RELEASED', 'patient', `Hold released for ${appointmentId}.`);
  }

  res.json({ success: true });
});

// Appointments (Admin / Staff)
app.get('/api/appointments', (_req: Request, res: Response) => {
  const list = Array.from(appointmentsStore.values()).map((appt) => {
    let payment: Payment | undefined;
    for (const p of paymentsStore.values()) {
      if (p.appointmentId === appt.id) {
        payment = p;
        break;
      }
    }
    return { ...appt, payment };
  });

  res.json({ appointments: list });
});

app.get('/api/appointments/:id', (req: Request, res: Response) => {
  const appt = appointmentsStore.get(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Appointment not found' });

  let payment: Payment | undefined;
  for (const p of paymentsStore.values()) {
    if (p.appointmentId === appt.id) {
      payment = p;
      break;
    }
  }

  res.json({ appointment: appt, payment });
});

app.post('/api/staff/checkin', (req: Request, res: Response) => {
  const { appointmentId, status } = req.body;
  const appt = appointmentsStore.get(appointmentId);
  if (!appt) return res.status(404).json({ error: 'Appointment not found' });

  appt.checkInStatus = status;
  appt.updatedAt = new Date().toISOString();
  syncAppointmentToSupabase(appt);

  logAudit('appointment', appointmentId, 'STAFF_STATUS_UPDATE', 'staff', `Updated status to ${status} for ${appt.patientName}.`);
  res.json({ success: true, appointment: appt });
});

// Admin Stats
app.get('/api/admin/stats', (_req: Request, res: Response) => {
  const appts = Array.from(appointmentsStore.values());
  const payments = Array.from(paymentsStore.values());

  const confirmedAppts = appts.filter((a) => a.status === 'confirmed');
  const totalRevenuePaise = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);

  res.json({
    totalAppointments: appts.length,
    confirmedCount: confirmedAppts.length,
    pendingCount: appts.filter((a) => a.status === 'pending_payment').length,
    failedCount: appts.filter((a) => a.status === 'payment_failed').length,
    totalRevenueINR: totalRevenuePaise / 100,
    verifiedSignaturesCount: payments.filter((p) => p.signatureVerified).length,
    pricing: clinicPricing,
  });
});

app.get('/api/admin/audit-logs', (_req: Request, res: Response) => {
  res.json({ auditLogs: auditLogsStore.slice(0, 100) });
});

app.get('/api/admin/webhooks', (_req: Request, res: Response) => {
  res.json({ webhooks: Array.from(webhookEventsStore.values()) });
});

app.post('/api/admin/settings', (req: Request, res: Response) => {
  const { appointmentFee, convenienceFee, slotHoldMinutes } = req.body;
  if (appointmentFee !== undefined) clinicPricing.appointmentFee = Number(appointmentFee);
  if (convenienceFee !== undefined) clinicPricing.convenienceFee = Number(convenienceFee);
  clinicPricing.totalAmount = clinicPricing.appointmentFee + clinicPricing.convenienceFee;
  if (slotHoldMinutes !== undefined) clinicPricing.slotHoldMinutes = Number(slotHoldMinutes);

  clinicSettings.appointmentFee = clinicPricing.appointmentFee;
  clinicSettings.convenienceFee = clinicPricing.convenienceFee;
  clinicSettings.totalAmount = clinicPricing.totalAmount;
  clinicSettings.slotHoldMinutes = clinicPricing.slotHoldMinutes;

  logAudit('pricing', 'clinic-pricing-1', 'UPDATED_PRICING', 'admin', `Pricing updated: ₹${clinicPricing.appointmentFee} + ₹${clinicPricing.convenienceFee} = ₹${clinicPricing.totalAmount}.`);
  res.json({ success: true, pricing: clinicPricing });
});

app.post('/api/admin/refund', (req: Request, res: Response) => {
  const { paymentId, reason } = req.body;
  const payment = paymentsStore.get(paymentId);
  if (!payment) return res.status(404).json({ error: 'Payment record not found' });

  payment.status = 'refunded';
  payment.updatedAt = new Date().toISOString();
  syncPaymentToSupabase(payment);

  const appt = appointmentsStore.get(payment.appointmentId);
  if (appt) {
    appt.status = 'cancelled';
    appt.updatedAt = new Date().toISOString();
    syncAppointmentToSupabase(appt);
  }

  logAudit('payment', paymentId, 'ADMIN_REFUND_PROCESSED', 'admin', `Refunded ₹${payment.amount / 100} for appointment ${payment.appointmentId}. Reason: ${reason || 'N/A'}`);
  res.json({ success: true, payment });
});

// Webhook simulation endpoint (for QA and testing verification)
app.post('/api/payments/simulate-webhook', async (req: Request, res: Response) => {
  const { orderId, eventType, sendInvalidSignature } = req.body;
  const eventId = `evt_sim_${Date.now()}`;
  const payload = {
    entity: 'event',
    account_id: 'acc_AestheticClinicSim',
    event: eventType || 'payment.captured',
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: `pay_sim_${Date.now()}`,
          order_id: orderId || 'order_AestheticSeed9821',
          amount: 12000,
          currency: 'INR',
          status: 'captured',
          method: 'upi',
        },
      },
    },
  };

  const payloadStr = JSON.stringify(payload);
  const signature = sendInvalidSignature
    ? 'invalid_webhook_sig'
    : crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET).update(payloadStr).digest('hex');

  const isSigValid = !sendInvalidSignature;
  const whEvent: WebhookEvent = {
    id: `wh-${Date.now()}`,
    eventId,
    eventType: eventType || 'payment.captured',
    razorpayOrderId: orderId || 'order_AestheticSeed9821',
    razorpayPaymentId: payload.payload.payment.entity.id,
    signature,
    signatureVerified: isSigValid,
    payload,
    status: isSigValid ? 'processed' : 'rejected_signature',
    processedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  webhookEventsStore.set(eventId, whEvent);
  syncWebhookEventToSupabase(whEvent);
  logAudit('webhook', eventId, 'SIMULATED_WEBHOOK', 'system_worker', `Simulated webhook ${eventType} for ${orderId}. Status: ${whEvent.status}`);

  res.json({ success: true, webhookEvent: whEvent });
});

// Gemini Chatbot Assistant
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  const { messages, userMessage } = req.body;

  if (!userMessage && (!messages || messages.length === 0)) {
    return res.status(400).json({ error: 'User message or conversation history required.' });
  }

  const doctorList = Array.from(doctorsStore.values())
    .map((d) => `- ${d.name} (${d.title}): Specializes in ${d.specialtyName}. Clinic days: ${d.consultationDays.join(', ')}.`)
    .join('\n');

  const treatmentList = Array.from(servicesStore.values())
    .map((s) => `- ${s.name} (${s.category}, ${s.durationMinutes} min): ${s.shortDescription}`)
    .join('\n');

  const systemInstruction = `You are the Aesthetic Assistant, the refined clinical concierge for Aesthetic Dental Clinic in Indiranagar, Bengaluru.

CLINIC INFORMATION:
- Address: ${clinicSettings.addressLine}, ${clinicSettings.city}, ${clinicSettings.state} ${clinicSettings.postalCode}.
- Opening Hours: ${clinicSettings.openingHoursWeekdays}; ${clinicSettings.openingHoursSunday}.
- Consultation Fee: ₹100 Specialist Fee + ₹20 Booking Fee = ₹120 Total Payable (includes 10-minute temporary slot hold).

ATTENDING SPECIALIST:
${doctorList}

TREATMENTS:
${treatmentList}

GUIDELINES & MEDICAL SAFETY:
1. Tone: Calm, refined, articulate, empathetic, concise, and professional.
2. Medical Safety: Educational guidance only. Never diagnose or prescribe medication. Always advise scheduling an in-person clinical consultation.
3. Pricing: Always state the transparent ₹100 + ₹20 = ₹120 fee structure.
4. Booking: If user wants to book, warmly guide them to select a treatment/slot.`;

  try {
    if (!ai) {
      return res.json({
        reply: `Welcome to Aesthetic Dental Clinic. We offer specialized care in Cosmetic Dentistry, Guided Implants, Clear Aligners, and Restorations with Dr. Maya Rao. Our consultation fee is ₹100 + ₹20 booking fee (₹120 total). How may I assist you today?`,
      });
    }

    const contents: any[] = [];
    if (Array.isArray(messages)) {
      for (const msg of messages) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      }
    }

    if (userMessage) {
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.4,
        maxOutputTokens: 600,
      },
    });

    const replyText = response.text || 'I would be delighted to assist you with our treatments or consultation bookings.';

    let actionSuggestion: any = undefined;
    const lower = (userMessage || '').toLowerCase();
    if (lower.includes('book') || lower.includes('appointment') || lower.includes('reserve') || lower.includes('slot') || lower.includes('consult')) {
      actionSuggestion = {
        type: 'book_appointment',
        doctorId: PRIMARY_DOCTOR_ID,
      };
      if (lower.includes('veneer') || lower.includes('whitening') || lower.includes('maya')) {
        actionSuggestion.serviceId = 'srv-1';
        actionSuggestion.treatmentName = 'Cosmetic Veneers';
      } else if (lower.includes('implant')) {
        actionSuggestion.serviceId = 'srv-4';
        actionSuggestion.treatmentName = 'Guided Implants';
      } else if (lower.includes('align') || lower.includes('ortho')) {
        actionSuggestion.serviceId = 'srv-3';
        actionSuggestion.treatmentName = 'Clear Aligners';
      }
    }

    res.json({
      reply: replyText,
      actionSuggestion,
    });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    res.json({
      reply: `Our atelier welcomes you. You can consult with our lead prosthodontist Dr. Maya Rao for ₹120 (₹100 Doctor Fee + ₹20 Booking Fee). Please let me know if you would like treatment details or assistance reserving a slot.`,
    });
  }
});

// AI Search
app.post('/api/ai/oral-health-search', async (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Query required' });

  if (!ai) {
    return res.json({
      answer: `Cosmetic veneers and clinical smile makeovers involve 3D intraoral optical scanning to stage natural polychromatic porcelain restorations with minimal enamel reduction. Consult with an accredited prosthodontist for clinical diagnostics.`,
      sources: [{ title: 'American Academy of Cosmetic Dentistry (AACD)', url: 'https://aacd.com' }],
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert clinical dental researcher. Provide an accurate, peer-reviewed summary for the following oral health inquiry: "${query}". Address clinical mechanisms, indication criteria, and enamel preservation guidelines.`,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3,
      },
    });

    const answer = response.text || 'Information unavailable.';
    const sources: { title: string; url: string }[] = [];

    const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (Array.isArray(searchChunks)) {
      for (const chunk of searchChunks) {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ title: chunk.web.title, url: chunk.web.uri });
        }
      }
    }

    res.json({ answer, sources });
  } catch (err: any) {
    console.error('AI search error:', err);
    res.json({
      answer: `Cosmetic porcelain veneers and clear orthodontic aligners represent the standard of care for modern aesthetic rehabilitation. A comprehensive clinical consultation is recommended for personalized treatment planning.`,
      sources: [{ title: 'Aesthetic Dental Research Repository', url: 'https://aestheticdental.com' }],
    });
  }
});

// AI Smile Visualizer
app.post('/api/ai/smile-visualizer', async (req: Request, res: Response) => {
  const { treatmentType, resolution } = req.body;
  const resLabel = resolution || '2K';

  res.json({
    success: true,
    treatmentType: treatmentType || 'Cosmetic Veneers',
    resolution: resLabel,
    simulatedImageUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80',
    analysis: `Simulated high-resolution ${resLabel} transformation staged for ${treatmentType || 'Cosmetic Veneers'}. Natural incisal translucency BL1/BL2 shade gradient with preserved gingival contours.`,
  });
});

// Health Check Endpoint (Non-sensitive)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Aesthetic Dental Clinic API',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Vite Middleware Integration for Development & Static Serving for Standalone Production
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else if (!process.env.VERCEL) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

// Start HTTP server in standalone container / local mode
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Aesthetic Dental Clinic] Server running on port ${PORT}`);
  });
}

export default app;
export { app };
