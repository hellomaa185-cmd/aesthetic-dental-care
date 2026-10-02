/**
 * Production-Ready Data Models and State Machine Types
 * Aesthetic Dental Clinic
 */

export type AppointmentStatus = 
  | 'pending_payment'
  | 'confirmed'
  | 'payment_failed'
  | 'cancelled'
  | 'completed'
  | 'rescheduled';

export type PaymentStatus = 
  | 'created'
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'refund_requested';

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet';

export type UserRole = 'patient' | 'staff' | 'admin';

export interface BreakPeriod {
  startTime: string; // '13:00' (24h)
  endTime: string;   // '14:00' (24h)
  label?: string;    // 'Lunch Break', 'Sterilization Window', etc.
}

export interface DoctorWorkingHours {
  dayOfWeek: string; // 'Monday' | 'Tuesday' | ... | 'Sunday'
  startTime: string; // '09:00' (24h)
  endTime: string;   // '18:00' (24h)
  breaks?: BreakPeriod[];
  isActive: boolean;
}

export type ExceptionType = 'leave' | 'holiday' | 'personal' | 'emergency' | 'training' | 'other';

export interface DoctorException {
  id: string;
  doctorId: string;
  date: string; // 'YYYY-MM-DD'
  startTime: string; // '10:00'
  endTime: string;   // '14:00'
  exceptionType: ExceptionType;
  reason: string; // 'Medical Conference' | 'Annual Leave' | 'Emergency'
  createdAt?: string;
}

export interface BlockedSlot {
  id: string;
  doctorId: string;
  doctorName?: string;
  blockedDate: string; // 'YYYY-MM-DD'
  startTime: string; // '15:30' (24h)
  endTime: string;   // '16:30' (24h)
  timeSlot12?: string; // '03:30 PM'
  reason: string; // 'Internal meeting', 'Emergency procedure', etc.
  createdBy?: string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  title: string;
  specialtyId: string;
  specialtyName: string;
  qualification: string;
  experienceYears: number;
  avatarUrl: string;
  bio: string;
  consultationDays: string[];
  schedule: DoctorWorkingHours[];
  exceptions: DoctorException[];
  blockedSlots?: BlockedSlot[];
  isActive: boolean;
  displayOrder: number;
}

export interface Specialty {
  id: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  specialtyId: string;
  category: string;
  durationMinutes: number; // 30, 45, 60
  shortDescription: string;
  description: string;
  highlights: string[];
  priceINR?: number;
  isActive: boolean;
  displayOrder: number;
}

export interface ClinicSettings {
  id: string;
  clinicName: string;
  tagline: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string;
  openingHoursWeekdays: string;
  openingHoursSunday: string;
  appointmentFee: number; // ₹100
  convenienceFee: number; // ₹20
  totalAmount: number;    // ₹120
  currency: string;       // 'INR'
  slotHoldMinutes: number; // 10 minutes
  timezone: string;       // 'Asia/Kolkata'
  updatedAt: string;
}

export interface ClinicPricing {
  appointmentFee: number; // ₹100
  convenienceFee: number; // ₹20
  totalAmount: number;    // ₹120
  currency: string;       // 'INR'
  slotHoldMinutes: number; // 10 minutes
  timezone: string;       // 'Asia/Kolkata'
  openingTime: string;    // '09:00'
  closingTime: string;    // '19:00'
}

export interface TimeSlot {
  time: string; // "09:30 AM"
  time24: string; // "09:30"
  isAvailable: boolean;
  reason?: string; // 'past_time' | 'booked' | 'held' | 'break' | 'blocked' | 'doctor_leave' | 'doctor_unavailable';
  isHeld?: boolean;
  holdExpiresAt?: string;
}

export interface Appointment {
  id: string; // e.g. APT-202610-8491
  patientName: string;
  patientEmail: string;
  patientPhone: string; // e.g. "+91 9876543210"
  patientAge?: number;
  gender?: 'Female' | 'Male' | 'Other' | 'Prefer not to say';
  doctorId: string;
  doctorName: string;
  serviceId: string;
  serviceName: string;
  serviceDurationMinutes: number;
  appointmentDate: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "03:30 PM"
  status: AppointmentStatus;
  
  // Historical Snapshot
  appointmentFee: number;
  convenienceFee: number;
  totalAmount: number;
  currency: string;
  
  notes?: string;
  holdExpiresAt?: string;
  confirmedAt?: string;
  checkInStatus?: 'not_arrived' | 'checked_in' | 'in_chair' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string; // PAY-202610-XXXX
  appointmentId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number; // 12000 paise
  currency: string;
  appointmentFee: number; // 10000 paise
  convenienceFee: number; // 2000 paise
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  signatureVerified: boolean;
  paidAt?: string;
  errorCode?: string;
  errorDescription?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEvent {
  id: string;
  eventId: string;
  eventType: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  signature: string;
  signatureVerified: boolean;
  payload: Record<string, unknown>;
  status: 'processed' | 'duplicate_ignored' | 'failed' | 'rejected_signature';
  processedAt: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entityType: 'appointment' | 'payment' | 'webhook' | 'slot' | 'pricing' | 'doctor' | 'service' | 'staff' | 'schedule' | 'exception' | 'blocked_slot' | 'review';
  entityId: string;
  action: string;
  actorRole: 'patient' | 'admin' | 'staff' | 'razorpay_system' | 'system_worker';
  details: string;
  timestamp: string;
}

export interface StaffAccount {
  id: string;
  email: string;
  name: string;
  role: 'staff' | 'admin';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'staff' | 'admin';
  token: string;
}

export interface Review {
  id: string;
  patientName: string;
  rating: number; // 1-5
  reviewText: string;
  treatmentName?: string;
  approved: boolean;
  featured: boolean;
  isDemo?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  actionSuggestion?: {
    type: 'book_appointment';
    serviceId?: string;
    doctorId?: string;
    treatmentName?: string;
  };
}

export interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  amount: number; // 12000
  currency: string;
  keyId: string;
  appointmentId: string;
  holdExpiresAt: string;
  appointmentFee: number; // 100
  convenienceFee: number; // 20
  totalDisplayAmount: number; // 120
  error?: string;
}

export interface VerifyPaymentRequest {
  appointmentId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  payment_method?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  appointment?: Appointment;
  payment?: Payment;
  receiptNumber?: string;
  error?: string;
}
