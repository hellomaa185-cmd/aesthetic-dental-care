// src/server/app.ts
import express from "express";
import crypto from "crypto";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

// src/data/mockData.ts
var PRIMARY_DOCTOR_ID = "227da1bf-d14a-4033-b909-2d53a33129a0";
var INITIAL_CLINIC_SETTINGS = {
  id: "clinic-settings-1",
  clinicName: "Aesthetic Dental Clinic",
  tagline: "A more considered approach to your smile",
  addressLine: "MediSquare Towers, Level 4, 100 Feet Road, Indiranagar",
  city: "Bengaluru",
  state: "Karnataka",
  postalCode: "560038",
  phone: "+91 80 4912 8800",
  email: "concierge@aestheticdental.com",
  openingHoursWeekdays: "Monday \u2013 Friday: 09:00 \u2013 18:00",
  openingHoursSunday: "Closed on Sunday",
  appointmentFee: 100,
  // ₹100
  convenienceFee: 20,
  // ₹20
  totalAmount: 120,
  // ₹120
  currency: "INR",
  slotHoldMinutes: 10,
  timezone: "Asia/Kolkata",
  updatedAt: (/* @__PURE__ */ new Date()).toISOString()
};
var INITIAL_PRICING = {
  appointmentFee: 100,
  convenienceFee: 20,
  totalAmount: 120,
  currency: "INR",
  slotHoldMinutes: 10,
  timezone: "Asia/Kolkata",
  openingTime: "09:00",
  closingTime: "18:00"
};
var CLINIC_SPECIALTIES = [
  {
    id: "spec-1",
    name: "Cosmetic Dentistry & Smile Architecture",
    slug: "cosmetic-dentistry",
    description: "Bespoke porcelain veneers, digital optical mock-ups, and polychromatic enamel restoration.",
    displayOrder: 1,
    isActive: true
  },
  {
    id: "spec-2",
    name: "Implantology & Full Mouth Rehabilitation",
    slug: "implantology",
    description: "Computer-guided titanium implants paired with monolithic zirconia ceramic crowns.",
    displayOrder: 2,
    isActive: true
  },
  {
    id: "spec-3",
    name: "Orthodontics & Dentofacial Orthopedics",
    slug: "orthodontics",
    description: "Invisible 3D clear aligners and precision biomechanics for adult alignment.",
    displayOrder: 3,
    isActive: true
  },
  {
    id: "spec-4",
    name: "Microscopic Endodontics & Biomimetic Restorations",
    slug: "restorative",
    description: "Painless microscopic root canal therapy and conservative biomimetic inlays/onlays.",
    displayOrder: 4,
    isActive: true
  },
  {
    id: "spec-5",
    name: "Periodontal & Preventive Enamel Wellness",
    slug: "preventive",
    description: "Ultrasonic air-polishing, deep prophylaxis, and personalized oral microbiome health.",
    displayOrder: 5,
    isActive: true
  }
];
var CLINIC_SERVICES = [
  {
    id: "srv-1",
    name: "Cosmetic Veneers & Smile Architecture",
    slug: "cosmetic-veneers",
    specialtyId: "spec-1",
    category: "Cosmetic Dentistry",
    durationMinutes: 60,
    shortDescription: "Handcrafted ultra-thin porcelain veneers for natural, radiant smile proportions.",
    description: "Comprehensive aesthetic evaluation including 3D intraoral optical scanning, digital smile staging, diagnostic wax-up review, and minimally-invasive enamel preservation protocol.",
    highlights: ["Microscopic enamel preservation", "3D Diagnostic mock-up review", "Optical polychromatic porcelain"],
    isActive: true,
    displayOrder: 1
  },
  {
    id: "srv-2",
    name: "Advanced Laser Teeth Whitening",
    slug: "laser-whitening",
    specialtyId: "spec-1",
    category: "Cosmetic Dentistry",
    durationMinutes: 45,
    shortDescription: "In-office laser-activated enamel brightening with zero-sensitivity protective barrier.",
    description: "Clinical-grade dual-wavelength laser whitening targeting deep intrinsic enamel discoloration while shielding periodontal and gingival tissues.",
    highlights: ["Zero-sensitivity desensitizing formulation", "Immediate shade evaluation", "Custom post-care maintenance kit"],
    isActive: true,
    displayOrder: 2
  },
  {
    id: "srv-3",
    name: "Invisible Clear Aligners Consultation",
    slug: "clear-aligners",
    specialtyId: "spec-3",
    category: "Orthodontics",
    durationMinutes: 45,
    shortDescription: "Custom 3D optical orthodontic scan and biomechanical aligner progression map.",
    description: "Full-arch digital intraoral scan evaluating bite harmony, crowding, deep bite, or spacing corrections without metal brackets.",
    highlights: ["Zero-radiation intraoral 3D scan", "Outcome simulator preview", "Accelerated tracking schedule"],
    isActive: true,
    displayOrder: 3
  },
  {
    id: "srv-4",
    name: "Guided Digital Dental Implants",
    slug: "dental-implants",
    specialtyId: "spec-2",
    category: "Implantology",
    durationMinutes: 60,
    shortDescription: "Titanium osseointegrated fixture with monolithic zirconia ceramic crown.",
    description: "Precision surgical template planning with 3D CBCT imaging for lifetime durability and natural masticatory restoration.",
    highlights: ["3D CBCT computer-guided placement", "Grade-5 medical titanium fixture", "Monolithic zirconia crown"],
    isActive: true,
    displayOrder: 4
  },
  {
    id: "srv-5",
    name: "Microscopic Biomimetic Onlays & Crowns",
    slug: "biomimetic-restorations",
    specialtyId: "spec-4",
    category: "Restorative Care",
    durationMinutes: 45,
    shortDescription: "Microscope-assisted ceramic restorations that replicate natural tooth flexibility and strength.",
    description: "Conservative restoration of fractured or decayed teeth using high-strength lithium disilicate ceramics.",
    highlights: ["Operating microscope precision", "Lithium disilicate (E-Max) ceramics", "Maximum tooth preservation"],
    isActive: true,
    displayOrder: 5
  },
  {
    id: "srv-6",
    name: "Full Prophylaxis & Enamel Air-Polishing",
    slug: "preventive-prophylaxis",
    specialtyId: "spec-5",
    category: "Preventive Care",
    durationMinutes: 30,
    shortDescription: "Gentle ultrasonic scaling paired with erythritol air-flow biofilm removal.",
    description: "Thorough removal of supra- and subgingival calculus, biofilm, and stubborn coffee/tea stains with zero enamel abrasion.",
    highlights: ["Erythritol comfort air-flow polishing", "Ultrasonic tartar debridement", "Enamel remineralization varnish"],
    isActive: true,
    displayOrder: 6
  }
];
var CLINIC_DOCTORS = [
  {
    id: PRIMARY_DOCTOR_ID,
    // 227da1bf-d14a-4033-b909-2d53a33129a0
    name: "Dr. Maya Rao, MDS",
    title: "Lead Aesthetic Prosthodontist & Ceramist",
    specialtyId: "spec-1",
    specialtyName: "Cosmetic Dentistry & Smile Architecture",
    qualification: "MDS Prosthodontics (Gold Medalist), AACD Member",
    experienceYears: 14,
    avatarUrl: "",
    bio: "Pioneered minimally-invasive ceramic veneer bonding techniques with sub-50 micron precision and natural enamel shade integration.",
    consultationDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    schedule: [
      {
        dayOfWeek: "Monday",
        startTime: "09:00",
        endTime: "18:00",
        breaks: [{ startTime: "13:00", endTime: "14:00", label: "Lunch Break" }],
        isActive: true
      },
      {
        dayOfWeek: "Tuesday",
        startTime: "09:00",
        endTime: "18:00",
        breaks: [{ startTime: "13:00", endTime: "14:00", label: "Lunch Break" }],
        isActive: true
      },
      {
        dayOfWeek: "Wednesday",
        startTime: "09:00",
        endTime: "18:00",
        breaks: [{ startTime: "13:00", endTime: "14:00", label: "Lunch Break" }],
        isActive: true
      },
      {
        dayOfWeek: "Thursday",
        startTime: "09:00",
        endTime: "18:00",
        breaks: [{ startTime: "13:00", endTime: "14:00", label: "Lunch Break" }],
        isActive: true
      },
      {
        dayOfWeek: "Friday",
        startTime: "09:00",
        endTime: "18:00",
        breaks: [{ startTime: "13:00", endTime: "14:00", label: "Lunch Break" }],
        isActive: true
      },
      {
        dayOfWeek: "Saturday",
        startTime: "10:00",
        endTime: "15:00",
        isActive: false
      },
      {
        dayOfWeek: "Sunday",
        startTime: "10:00",
        endTime: "14:00",
        isActive: false
      }
    ],
    exceptions: [],
    blockedSlots: [],
    isActive: true,
    displayOrder: 1
  }
];
var INITIAL_STAFF = [
  {
    id: "staff-1",
    email: "staff@aestheticdental.com",
    name: "Reception & Front Desk",
    role: "staff",
    isActive: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "admin-1",
    email: "admin@aestheticdental.com",
    name: "Clinical Director & Admin",
    role: "admin",
    isActive: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var INITIAL_REVIEWS = [
  {
    id: "rev-1",
    patientName: "Rohan K.",
    rating: 5,
    treatmentName: "Cosmetic Veneers & Smile Architecture",
    reviewText: "The attention to natural enamel translucency is extraordinary. Dr. Maya Rao walked me through the 3D mock-up before touching a tooth. The result is seamlessly natural.",
    approved: true,
    featured: true,
    isDemo: true,
    createdAt: new Date(Date.now() - 864e5 * 5).toISOString()
  },
  {
    id: "rev-2",
    patientName: "Kavita M.",
    rating: 5,
    treatmentName: "Advanced Laser Teeth Whitening",
    reviewText: "Zero pain or sensitivity during laser whitening. Clean, calm clinic ambiance that feels like an architectural atelier rather than a dental clinic.",
    approved: true,
    featured: true,
    isDemo: true,
    createdAt: new Date(Date.now() - 864e5 * 12).toISOString()
  },
  {
    id: "rev-3",
    patientName: "David L.",
    rating: 5,
    treatmentName: "Guided Digital Dental Implants",
    reviewText: "Computer-guided implant surgery by Dr. Maya Rao was completed with incredible precision. Post-op recovery was virtually painless.",
    approved: true,
    featured: true,
    isDemo: true,
    createdAt: new Date(Date.now() - 864e5 * 18).toISOString()
  },
  {
    id: "rev-4",
    patientName: "Ananya D.",
    rating: 5,
    treatmentName: "Invisible Clear Aligners Consultation",
    reviewText: "The 3D intraoral scanner mapped my entire bite in 3 minutes. The transparent fee breakdown and schedule respect made booking effortless.",
    approved: true,
    featured: true,
    isDemo: true,
    createdAt: new Date(Date.now() - 864e5 * 25).toISOString()
  }
];

// src/server/app.ts
dotenv.config();
var app = express();
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-razorpay-signature");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString("utf8");
    }
  })
);
app.use((req, _res, next) => {
  if (req.body && typeof req.body === "object" && !req.rawBody) {
    try {
      req.rawBody = JSON.stringify(req.body);
    } catch {
    }
  }
  if (!req.query || Object.keys(req.query).length === 0 || req.query["0"] || req.query["1"]) {
    try {
      const urlToParse = req.url && req.url.startsWith("http") ? req.url : `http://localhost${req.url || "/"}`;
      const parsed = new URL(urlToParse);
      const queryObj = {};
      parsed.searchParams.forEach((val, key) => {
        if (key !== "0" && key !== "1") {
          queryObj[key] = val;
        }
      });
      req.query = Object.assign({}, queryObj, req.query || {});
    } catch {
    }
  }
  next();
});
var RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_aesthetic_demo";
var RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "sec_demo_secret_aesthetic_clinic_982741";
var RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "whsec_demo_aesthetic_clinic_webhook_51829";
var supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
var supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
var supabaseServer = (() => {
  try {
    if (supabaseUrl && supabaseKey && !supabaseUrl.includes("placeholder") && (supabaseUrl.startsWith("http://") || supabaseUrl.startsWith("https://"))) {
      return createClient(supabaseUrl, supabaseKey);
    }
  } catch (err) {
    console.warn("[Supabase Server Init Warning]:", err?.message || err);
  }
  return null;
})();
var ai = (() => {
  try {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "") {
      return new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    }
  } catch (err) {
    console.warn("[Gemini AI Init Warning]:", err?.message || err);
  }
  return null;
})();
var CLINIC_TIMEZONE = "Asia/Kolkata";
var getKolkataTime = () => {
  const now = /* @__PURE__ */ new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });
  const parts = formatter.formatToParts(now);
  const getPart = (type) => parts.find((p) => p.type === type)?.value || "";
  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const rawHour = parseInt(getPart("hour"), 10);
  const hour = isNaN(rawHour) ? 0 : rawHour % 24;
  const minute = parseInt(getPart("minute"), 10) || 0;
  const second = parseInt(getPart("second"), 10) || 0;
  const currentDateStr = `${year}-${month}-${day}`;
  const currentTimeMinutes = hour * 60 + minute;
  const timeFormatted = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CLINIC_TIMEZONE,
    weekday: "long"
  });
  const currentDayOfWeek = dayFormatter.format(now);
  return {
    currentDateStr,
    currentTimeMinutes,
    timeFormatted,
    currentDayOfWeek,
    nowEpochMs: now.getTime()
  };
};
var timeToMinutes = (time24) => {
  const [h, m] = time24.split(":").map(Number);
  return h * 60 + (m || 0);
};
var time12To24 = (time12) => {
  const [time, period] = time12.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (period === "PM" && h < 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};
var minutesToTimeFormats = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const time24 = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const time12 = `${h12.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${period}`;
  return { time24, time12 };
};
var clinicSettings = { ...INITIAL_CLINIC_SETTINGS };
var clinicPricing = { ...INITIAL_PRICING };
var specialtiesStore = new Map(CLINIC_SPECIALTIES.map((s) => [s.id, s]));
var servicesStore = new Map(CLINIC_SERVICES.map((s) => [s.id, s]));
var doctorsStore = new Map(CLINIC_DOCTORS.map((d) => [d.id, JSON.parse(JSON.stringify(d))]));
var staffStore = new Map(INITIAL_STAFF.map((st) => [st.id, st]));
var reviewsStore = new Map(INITIAL_REVIEWS.map((r) => [r.id, r]));
var blockedSlotsStore = /* @__PURE__ */ new Map();
var appointmentsStore = /* @__PURE__ */ new Map();
var appointmentHoldsStore = /* @__PURE__ */ new Map();
var paymentsStore = /* @__PURE__ */ new Map();
var webhookEventsStore = /* @__PURE__ */ new Map();
var auditLogsStore = [];
var seedInitialData = () => {
  const seedApptId = "APT-202610-8420";
  const seedPayId = "PAY-202610-9182";
  const seedOrderId = "order_AestheticSeed9821";
  const seedPaymentId = "pay_RazorpayDemo74829";
  const kt = getKolkataTime();
  const seedAppt = {
    id: seedApptId,
    patientName: "Priya Sharma",
    patientEmail: "priya.sharma@example.com",
    patientPhone: "+91 9876543210",
    patientAge: 29,
    gender: "Female",
    doctorId: PRIMARY_DOCTOR_ID,
    doctorName: "Dr. Maya Rao, MDS",
    serviceId: "srv-1",
    serviceName: "Cosmetic Veneers & Smile Architecture",
    serviceDurationMinutes: 60,
    appointmentDate: kt.currentDateStr,
    timeSlot: "11:30 AM",
    status: "confirmed",
    appointmentFee: 100,
    convenienceFee: 20,
    totalAmount: 120,
    currency: "INR",
    notes: "Consultation for upper anterior porcelain veneers.",
    confirmedAt: new Date(Date.now() - 36e5).toISOString(),
    checkInStatus: "checked_in",
    createdAt: new Date(Date.now() - 4e6).toISOString(),
    updatedAt: new Date(Date.now() - 36e5).toISOString()
  };
  const seedPayment = {
    id: seedPayId,
    appointmentId: seedApptId,
    razorpayOrderId: seedOrderId,
    razorpayPaymentId: seedPaymentId,
    razorpaySignature: crypto.createHmac("sha256", RAZORPAY_KEY_SECRET).update(`${seedOrderId}|${seedPaymentId}`).digest("hex"),
    amount: 12e3,
    currency: "INR",
    appointmentFee: 1e4,
    convenienceFee: 2e3,
    status: "paid",
    paymentMethod: "upi",
    signatureVerified: true,
    paidAt: new Date(Date.now() - 36e5).toISOString(),
    createdAt: new Date(Date.now() - 4e6).toISOString(),
    updatedAt: new Date(Date.now() - 36e5).toISOString()
  };
  appointmentsStore.set(seedApptId, seedAppt);
  paymentsStore.set(seedPayId, seedPayment);
  auditLogsStore.push({
    id: "aud-seed-1",
    entityType: "appointment",
    entityId: seedApptId,
    action: "CONFIRMED_VIA_VERIFIED_PAYMENT",
    actorRole: "razorpay_system",
    details: "Initial verified appointment confirmed with \u20B9120 payment.",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
};
seedInitialData();
var logAudit = (entityType, entityId, action, actorRole, details) => {
  auditLogsStore.unshift({
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    entityType,
    entityId,
    action,
    actorRole,
    details,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
};
var holdExpiryTimer = setInterval(() => {
  const now = Date.now();
  for (const [id, hold] of appointmentHoldsStore.entries()) {
    if (hold.status === "active") {
      const expires = new Date(hold.expiresAt).getTime();
      if (now > expires) {
        hold.status = "expired";
        const appt = appointmentsStore.get(hold.appointmentId);
        if (appt && appt.status === "pending_payment") {
          appt.status = "cancelled";
          appt.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
          for (const payment of paymentsStore.values()) {
            if (payment.appointmentId === appt.id && payment.status === "created") {
              payment.status = "cancelled";
              payment.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
            }
          }
          logAudit("slot", appt.id, "SLOT_HOLD_EXPIRED", "system_worker", `10-minute temporary reservation expired for ${appt.id}. Slot released.`);
        }
      }
    }
  }
  for (const [id, appt] of appointmentsStore.entries()) {
    if (appt.status === "pending_payment" && appt.holdExpiresAt) {
      const expires = new Date(appt.holdExpiresAt).getTime();
      if (now > expires) {
        appt.status = "cancelled";
        appt.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        for (const payment of paymentsStore.values()) {
          if (payment.appointmentId === id && payment.status === "created") {
            payment.status = "cancelled";
            payment.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
          }
        }
      }
    }
  }
}, 5e3);
if (holdExpiryTimer && typeof holdExpiryTimer.unref === "function") {
  holdExpiryTimer.unref();
}
var calculateDoctorSlots = (doctorId, targetDate, serviceDurationMinutes = 45) => {
  let doctor = doctorsStore.get(doctorId);
  if (!doctor) {
    doctor = Array.from(doctorsStore.values()).find(
      (d2) => d2.id?.toLowerCase() === doctorId?.toLowerCase() || d2.name?.toLowerCase() === doctorId?.toLowerCase()
    ) || doctorsStore.get(PRIMARY_DOCTOR_ID) || Array.from(doctorsStore.values())[0];
  }
  if (!doctor || !doctor.isActive) return [];
  const kt = getKolkataTime();
  const isTargetDateToday = targetDate === kt.currentDateStr;
  const isTargetDatePast = targetDate < kt.currentDateStr;
  if (isTargetDatePast) {
    return [];
  }
  const [y, m, d] = targetDate.split("-").map(Number);
  const targetDateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: CLINIC_TIMEZONE,
    weekday: "long"
  });
  const targetDayOfWeek = dayFormatter.format(targetDateObj);
  const scheduleDay = doctor.schedule?.find((s) => s.dayOfWeek?.toLowerCase() === targetDayOfWeek?.toLowerCase());
  if (!scheduleDay || !scheduleDay.isActive) {
    return [];
  }
  const doctorStartMinutes = timeToMinutes(scheduleDay.startTime || "09:00");
  const doctorEndMinutes = timeToMinutes(scheduleDay.endTime || "18:00");
  const occupiedSlots = [];
  if (scheduleDay.breaks && scheduleDay.breaks.length > 0) {
    for (const brk of scheduleDay.breaks) {
      occupiedSlots.push({
        startMin: timeToMinutes(brk.startTime),
        endMin: timeToMinutes(brk.endTime),
        reason: "break"
      });
    }
  }
  const exceptionsForDay = (doctor.exceptions || []).filter((ex) => ex.date === targetDate);
  for (const ex of exceptionsForDay) {
    occupiedSlots.push({
      startMin: timeToMinutes(ex.startTime),
      endMin: timeToMinutes(ex.endTime),
      reason: "doctor_leave"
    });
  }
  for (const blk of blockedSlotsStore.values()) {
    if (blk.doctorId === doctorId && blk.blockedDate === targetDate) {
      occupiedSlots.push({
        startMin: timeToMinutes(blk.startTime),
        endMin: timeToMinutes(blk.endTime),
        reason: "blocked"
      });
    }
  }
  for (const appt of appointmentsStore.values()) {
    if (appt.doctorId === doctorId && appt.appointmentDate === targetDate) {
      if (appt.status === "confirmed" || appt.status === "completed") {
        const apptStart = timeToMinutes(time12To24(appt.timeSlot));
        const apptEnd = apptStart + (appt.serviceDurationMinutes || 45);
        occupiedSlots.push({ startMin: apptStart, endMin: apptEnd, reason: "booked" });
      }
    }
  }
  for (const hold of appointmentHoldsStore.values()) {
    if (hold.doctorId === doctorId && hold.holdDate === targetDate && hold.status === "active") {
      if (kt.nowEpochMs < new Date(hold.expiresAt).getTime()) {
        const holdStart = timeToMinutes(hold.startTime);
        const holdEnd = timeToMinutes(hold.endTime);
        occupiedSlots.push({ startMin: holdStart, endMin: holdEnd, reason: "held" });
      }
    }
  }
  const slotIntervalMinutes = 30;
  const slots = [];
  for (let currentMin = doctorStartMinutes; currentMin + serviceDurationMinutes <= doctorEndMinutes; currentMin += slotIntervalMinutes) {
    const slotEndMin = currentMin + serviceDurationMinutes;
    const { time24, time12 } = minutesToTimeFormats(currentMin);
    let isAvailable = true;
    let reason;
    if (isTargetDateToday && currentMin <= kt.currentTimeMinutes) {
      isAvailable = false;
      reason = "past_time";
    }
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
    if (reason !== "past_time") {
      slots.push({
        time: time12,
        time24,
        isAvailable,
        reason,
        isHeld: reason === "held"
      });
    }
  }
  return slots;
};
var appointmentSupabaseIdMap = /* @__PURE__ */ new Map();
var cachedDbDoctors = null;
var cachedDbServices = null;
var getDbDoctorId = async (doctorRefId, doctorName) => {
  if (!supabaseServer) return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(doctorRefId)) {
    return doctorRefId;
  }
  try {
    if (!cachedDbDoctors) {
      const { data } = await supabaseServer.from("doctors").select("id, name");
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
  }
  return null;
};
var getDbServiceId = async (serviceRefId, serviceName) => {
  if (!supabaseServer) return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(serviceRefId)) {
    return serviceRefId;
  }
  try {
    if (!cachedDbServices) {
      const { data } = await supabaseServer.from("services").select("id, name, slug");
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
  }
  return null;
};
var syncAppointmentToSupabase = async (appt) => {
  if (!supabaseServer) return;
  try {
    let patientId = null;
    const email = appt.patientEmail?.trim().toLowerCase();
    if (email) {
      const { data: existingPatient } = await supabaseServer.from("patients").select("id").eq("email", email).limit(1).maybeSingle();
      if (existingPatient) {
        patientId = existingPatient.id;
      } else {
        const { data: newPatient } = await supabaseServer.from("patients").insert({
          full_name: appt.patientName || "Anonymous Patient",
          email,
          phone: appt.patientPhone || "+91 9876543210"
        }).select("id").single();
        if (newPatient) patientId = newPatient.id;
      }
    }
    const doctorId = await getDbDoctorId(appt.doctorId, appt.doctorName);
    const serviceId = await getDbServiceId(appt.serviceId, appt.serviceName);
    if (!doctorId || !serviceId || !patientId) return;
    const time24 = time12To24(appt.timeSlot);
    const [hStr, mStr] = time24.split(":");
    const h = parseInt(hStr || "10", 10);
    const m = parseInt(mStr || "00", 10);
    const dur = appt.serviceDurationMinutes || 45;
    const endMinutes = h * 60 + m + dur;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const endTime24 = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;
    const startAt = `${appt.appointmentDate}T${time24}:00+05:30`;
    const endAt = `${appt.appointmentDate}T${endTime24}:00+05:30`;
    let statusEnum = "pending_payment";
    if (appt.status === "confirmed") statusEnum = "confirmed";
    else if (appt.status === "cancelled" || appt.status === "payment_failed") statusEnum = "cancelled";
    else if (appt.status === "completed") statusEnum = "completed";
    let targetRowId = appointmentSupabaseIdMap.get(appt.id) || null;
    if (!targetRowId) {
      const { data: existingAtSlot } = await supabaseServer.from("appointments").select("id, status").eq("doctor_id", doctorId).eq("start_at", startAt).neq("status", "cancelled").limit(1).maybeSingle();
      if (existingAtSlot) {
        targetRowId = existingAtSlot.id;
        appointmentSupabaseIdMap.set(appt.id, existingAtSlot.id);
      }
    }
    if (targetRowId) {
      const { error: updateErr } = await supabaseServer.from("appointments").update({
        patient_id: patientId,
        doctor_id: doctorId,
        service_id: serviceId,
        start_at: startAt,
        end_at: endAt,
        status: statusEnum,
        patient_notes: appt.notes || null,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", targetRowId);
      if (updateErr) {
        if (updateErr.message.includes("appointments_no_overlap") || updateErr.code === "23P01") {
          await supabaseServer.from("appointments").update({ status: "cancelled", updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("doctor_id", doctorId).eq("start_at", startAt).neq("id", targetRowId);
          await supabaseServer.from("appointments").update({
            patient_id: patientId,
            service_id: serviceId,
            status: statusEnum,
            patient_notes: appt.notes || null,
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          }).eq("id", targetRowId);
        } else {
          console.warn("[Supabase Sync] Appointment update notice:", updateErr.message);
        }
      }
    } else {
      if (statusEnum !== "cancelled") {
        const { data: conflictingRows } = await supabaseServer.from("appointments").select("id, status").eq("doctor_id", doctorId).eq("start_at", startAt).neq("status", "cancelled");
        if (conflictingRows && conflictingRows.length > 0) {
          const existingSlotRow = conflictingRows[0];
          targetRowId = existingSlotRow.id;
          if (targetRowId) {
            appointmentSupabaseIdMap.set(appt.id, targetRowId);
          }
          if (conflictingRows.length > 1) {
            const duplicateIds = conflictingRows.slice(1).map((r) => r.id);
            await supabaseServer.from("appointments").update({ status: "cancelled", updated_at: (/* @__PURE__ */ new Date()).toISOString() }).in("id", duplicateIds);
          }
          if (targetRowId) {
            await supabaseServer.from("appointments").update({
              patient_id: patientId,
              doctor_id: doctorId,
              service_id: serviceId,
              start_at: startAt,
              end_at: endAt,
              status: statusEnum,
              patient_notes: appt.notes || null,
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            }).eq("id", targetRowId);
          }
          return;
        }
      }
      const { data, error: insertErr } = await supabaseServer.from("appointments").insert({
        patient_id: patientId,
        doctor_id: doctorId,
        service_id: serviceId,
        start_at: startAt,
        end_at: endAt,
        status: statusEnum,
        patient_notes: appt.notes || null
      }).select("id").single();
      if (insertErr) {
        if (insertErr.message.includes("appointments_no_overlap") || insertErr.code === "23P01") {
          const { data: conflictRow } = await supabaseServer.from("appointments").select("id").eq("doctor_id", doctorId).eq("start_at", startAt).limit(1).maybeSingle();
          if (conflictRow) {
            appointmentSupabaseIdMap.set(appt.id, conflictRow.id);
            await supabaseServer.from("appointments").update({
              patient_id: patientId,
              service_id: serviceId,
              status: statusEnum,
              patient_notes: appt.notes || null,
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            }).eq("id", conflictRow.id);
          }
        } else {
          console.warn("[Supabase Sync] Appointment insert notice:", insertErr.message);
        }
      } else if (data) {
        appointmentSupabaseIdMap.set(appt.id, data.id);
      }
    }
  } catch (err) {
    console.warn("[Supabase Sync] Non-blocking sync notice:", err?.message || err);
  }
};
var syncPaymentToSupabase = async (payment) => {
  if (!supabaseServer) return;
  try {
    const supabaseApptId = appointmentSupabaseIdMap.get(payment.appointmentId) || null;
    let paymentStatus = "created";
    if (payment.status === "paid") paymentStatus = "paid";
    else if (payment.status === "failed") paymentStatus = "failed";
    else if (payment.status === "cancelled") paymentStatus = "cancelled";
    else if (payment.status === "refunded") paymentStatus = "refunded";
    const { data: existingPayment } = await supabaseServer.from("payments").select("id").eq("razorpay_order_id", payment.razorpayOrderId).limit(1).maybeSingle();
    if (existingPayment) {
      const { error } = await supabaseServer.from("payments").update({
        razorpay_payment_id: payment.razorpayPaymentId || null,
        status: paymentStatus,
        signature_verified: payment.signatureVerified,
        paid_at: payment.paidAt || (payment.status === "paid" ? (/* @__PURE__ */ new Date()).toISOString() : null),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", existingPayment.id);
      if (error) console.warn("[Supabase Sync] Payment update error:", error.message);
    } else if (supabaseApptId) {
      const { error } = await supabaseServer.from("payments").insert({
        appointment_id: supabaseApptId,
        razorpay_order_id: payment.razorpayOrderId,
        razorpay_payment_id: payment.razorpayPaymentId || null,
        appointment_fee: payment.appointmentFee,
        convenience_fee: payment.convenienceFee,
        currency: payment.currency || "INR",
        status: paymentStatus,
        signature_verified: payment.signatureVerified,
        paid_at: payment.paidAt || null
      });
      if (error) console.warn("[Supabase Sync] Payment insert error:", error.message);
    }
  } catch (err) {
    console.warn("[Supabase Sync] Failed to sync payment:", err.message || err);
  }
};
var syncWebhookEventToSupabase = async (event) => {
  if (!supabaseServer) return;
  try {
    const { error } = await supabaseServer.from("webhook_events").upsert({
      event_id: event.eventId,
      event_type: event.eventType,
      provider: "razorpay",
      payload: event.payload,
      processed: event.status === "processed",
      processed_at: event.processedAt,
      created_at: event.createdAt
    }, { onConflict: "event_id" });
    if (error) console.warn("[Supabase Sync] Webhook event upsert error:", error.message);
  } catch (err) {
    console.warn("[Supabase Sync] Failed to sync webhook event:", err.message || err);
  }
};
var syncAuditLogToSupabase = async (log) => {
  if (!supabaseServer) return;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(log.entityId);
    const { error } = await supabaseServer.from("audit_logs").insert({
      entity_type: log.entityType,
      entity_id: isUuid ? log.entityId : null,
      action: log.action,
      actor_id: null,
      metadata: {
        actor_role: log.actorRole,
        original_entity_id: log.entityId,
        details: log.details
      },
      created_at: log.timestamp || (/* @__PURE__ */ new Date()).toISOString()
    });
    if (error) console.warn("[Supabase Sync] Audit log insert error:", error.message);
  } catch (err) {
    console.warn("[Supabase Sync] Failed to sync audit log:", err.message || err);
  }
};
var syncAppointmentHoldToSupabase = async (hold) => {
  if (!supabaseServer) return;
  try {
    const supabaseApptId = appointmentSupabaseIdMap.get(hold.appointmentId);
    const doctorId = await getDbDoctorId(hold.doctorId);
    if (!doctorId) return;
    const startAt = `${hold.holdDate}T${hold.startTime}:00+05:30`;
    const endAt = `${hold.holdDate}T${hold.endTime}:00+05:30`;
    let holdStatus = "active";
    if (hold.status === "active" || hold.status === "held") {
      holdStatus = "active";
    } else if (hold.status === "expired") {
      holdStatus = "expired";
    } else if (hold.status === "released" || hold.status === "cancelled" || hold.status === "confirmed" || hold.status === "converted" || hold.status === "completed") {
      holdStatus = "released";
    }
    let holdSupabaseId = null;
    if (supabaseApptId) {
      const { data: existingHold } = await supabaseServer.from("appointment_holds").select("id").eq("appointment_id", supabaseApptId).limit(1).maybeSingle();
      if (existingHold) holdSupabaseId = existingHold.id;
    }
    if (!holdSupabaseId) {
      const { data: existingSlotHold } = await supabaseServer.from("appointment_holds").select("id").eq("doctor_id", doctorId).eq("start_at", startAt).eq("status", "active").limit(1).maybeSingle();
      if (existingSlotHold) holdSupabaseId = existingSlotHold.id;
    }
    if (holdSupabaseId) {
      const { error: error2 } = await supabaseServer.from("appointment_holds").update({
        status: holdStatus,
        expires_at: hold.expiresAt
      }).eq("id", holdSupabaseId);
      if (error2) console.warn("[Supabase Sync] Hold update error:", error2.message);
      return;
    }
    const { error } = await supabaseServer.from("appointment_holds").insert({
      appointment_id: supabaseApptId || null,
      doctor_id: doctorId,
      start_at: startAt,
      end_at: endAt,
      expires_at: hold.expiresAt,
      status: holdStatus
    });
    if (error) console.warn("[Supabase Sync] Hold insert error:", error.message);
  } catch (err) {
    console.warn("[Supabase Sync] Failed to sync appointment hold:", err.message || err);
  }
};
var backgroundHoldCleanerTimer = setInterval(() => {
  const now = Date.now();
  for (const hold of appointmentHoldsStore.values()) {
    if (hold.status === "active" && new Date(hold.expiresAt).getTime() < now) {
      hold.status = "expired";
      syncAppointmentHoldToSupabase(hold);
      const appt = appointmentsStore.get(hold.appointmentId);
      if (appt && appt.status === "pending_payment") {
        appt.status = "cancelled";
        appt.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        syncAppointmentToSupabase(appt);
      }
    }
  }
}, 6e4);
if (backgroundHoldCleanerTimer && typeof backgroundHoldCleanerTimer.unref === "function") {
  backgroundHoldCleanerTimer.unref();
}
var handleCreateOrder = async (req, res) => {
  const { doctorId, serviceId, appointmentDate, timeSlot, patientName, patientEmail, patientPhone, patientAge, gender, notes } = req.body;
  if (!doctorId || !serviceId || !appointmentDate || !timeSlot || !patientName || !patientEmail || !patientPhone) {
    return res.status(400).json({ error: "Missing required reservation fields." });
  }
  let doctor = doctorsStore.get(doctorId);
  if (!doctor) {
    doctor = Array.from(doctorsStore.values()).find(
      (d) => d.id?.toLowerCase() === doctorId?.toLowerCase() || d.name?.toLowerCase() === doctorId?.toLowerCase()
    ) || doctorsStore.get(PRIMARY_DOCTOR_ID) || Array.from(doctorsStore.values())[0];
  }
  let service = servicesStore.get(serviceId);
  if (!service) {
    service = Array.from(servicesStore.values()).find(
      (s) => s.id?.toLowerCase() === serviceId?.toLowerCase() || s.slug?.toLowerCase() === serviceId?.toLowerCase() || s.name?.toLowerCase() === serviceId?.toLowerCase()
    ) || Array.from(servicesStore.values())[0];
  }
  if (!doctor || !service) {
    return res.status(400).json({ error: "Invalid doctor or service selected." });
  }
  const availableSlots = calculateDoctorSlots(doctorId, appointmentDate, service.durationMinutes);
  const requestedSlot = availableSlots.find((s) => s.time === timeSlot);
  if (!requestedSlot || !requestedSlot.isAvailable) {
    return res.status(409).json({
      error: "That appointment time is no longer available. Please choose another time."
    });
  }
  const appointmentFeeINR = clinicPricing.appointmentFee;
  const convenienceFeeINR = clinicPricing.convenienceFee;
  const totalAmountINR = appointmentFeeINR + convenienceFeeINR;
  const totalAmountPaise = totalAmountINR * 100;
  const apptId = `APT-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  let orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const holdExpiresAt = new Date(Date.now() + clinicPricing.slotHoldMinutes * 6e4).toISOString();
  if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET && !RAZORPAY_KEY_ID.includes("placeholder") && RAZORPAY_KEY_ID.startsWith("rzp_")) {
    try {
      const authHeader = "Basic " + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
      const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader
        },
        body: JSON.stringify({
          amount: totalAmountPaise,
          currency: "INR",
          receipt: apptId,
          notes: {
            appointment_id: apptId,
            patient_name: patientName.trim(),
            doctor_id: doctorId,
            service_id: serviceId
          }
        })
      });
      if (rzpRes.ok) {
        const rzpData = await rzpRes.json();
        if (rzpData && rzpData.id) {
          orderId = rzpData.id;
        }
      } else {
        console.warn("[Razorpay API] Order creation returned non-200, using test order ID");
      }
    } catch (rzpErr) {
      console.warn("[Razorpay API] Network unreachable, using deterministic test order ID:", rzpErr);
    }
  }
  const slot24 = time12To24(timeSlot);
  const slotEndMinutes = timeToMinutes(slot24) + service.durationMinutes;
  const slotEnd24 = minutesToTimeFormats(slotEndMinutes).time24;
  const newAppt = {
    id: apptId,
    patientName: patientName.trim(),
    patientEmail: patientEmail.trim(),
    patientPhone: patientPhone.trim(),
    patientAge: patientAge ? Number(patientAge) : void 0,
    gender: gender || "Prefer not to say",
    doctorId,
    doctorName: doctor.name,
    serviceId,
    serviceName: service.name,
    serviceDurationMinutes: service.durationMinutes,
    appointmentDate,
    timeSlot,
    status: "pending_payment",
    appointmentFee: appointmentFeeINR,
    convenienceFee: convenienceFeeINR,
    totalAmount: totalAmountINR,
    currency: "INR",
    notes: notes ? notes.trim() : void 0,
    holdExpiresAt,
    checkInStatus: "not_arrived",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const holdRecord = {
    id: `hld-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    appointmentId: apptId,
    doctorId,
    holdDate: appointmentDate,
    startTime: slot24,
    endTime: slotEnd24,
    expiresAt: holdExpiresAt,
    status: "active",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const newPayment = {
    id: `PAY-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    appointmentId: apptId,
    razorpayOrderId: orderId,
    amount: totalAmountPaise,
    currency: "INR",
    appointmentFee: appointmentFeeINR * 100,
    convenienceFee: convenienceFeeINR * 100,
    status: "created",
    signatureVerified: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  appointmentsStore.set(apptId, newAppt);
  appointmentHoldsStore.set(holdRecord.id, holdRecord);
  paymentsStore.set(newPayment.id, newPayment);
  syncAppointmentToSupabase(newAppt);
  syncAppointmentHoldToSupabase(holdRecord);
  syncPaymentToSupabase(newPayment);
  const logEntry = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    entityType: "appointment",
    entityId: apptId,
    action: "CREATED_PENDING_HOLD",
    actorRole: "patient",
    details: `Created temporary 10-minute hold and \u20B9120 order for ${patientName} on ${appointmentDate} at ${timeSlot}. Order: ${orderId}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  auditLogsStore.unshift(logEntry);
  syncAuditLogToSupabase(logEntry);
  res.json({
    success: true,
    orderId,
    amount: totalAmountPaise,
    currency: "INR",
    keyId: RAZORPAY_KEY_ID,
    appointmentId: apptId,
    holdExpiresAt,
    appointmentFee: appointmentFeeINR,
    convenienceFee: convenienceFeeINR,
    totalDisplayAmount: totalAmountINR
  });
};
app.post("/api/payments/create-order", handleCreateOrder);
app.post("/api/razorpay/create-order", handleCreateOrder);
var handleVerifyPayment = (req, res) => {
  const appointmentId = req.body.appointmentId || req.body.appointment_id;
  const razorpay_order_id = req.body.razorpay_order_id || req.body.razorpayOrderId;
  const razorpay_payment_id = req.body.razorpay_payment_id || req.body.razorpayPaymentId;
  const razorpay_signature = req.body.razorpay_signature || req.body.razorpaySignature;
  const payment_method = req.body.payment_method || req.body.paymentMethod;
  if (!appointmentId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({
      success: false,
      error: "Missing required signature verification parameters."
    });
  }
  const appt = appointmentsStore.get(appointmentId);
  if (!appt) {
    return res.status(404).json({ success: false, error: "Appointment not found." });
  }
  if (appt.status === "confirmed") {
    let existingPay;
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
      receiptNumber: `RCP-${Date.now().toString().slice(-6)}`
    });
  }
  let paymentRecord;
  for (const p of paymentsStore.values()) {
    if (p.appointmentId === appointmentId && p.razorpayOrderId === razorpay_order_id) {
      paymentRecord = p;
      break;
    }
  }
  const expectedSignature = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
  let isSignatureValid = false;
  try {
    isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf8"),
      Buffer.from(razorpay_signature, "utf8")
    );
  } catch {
    isSignatureValid = false;
  }
  if (!isSignatureValid) {
    appt.status = "payment_failed";
    appt.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (paymentRecord) {
      paymentRecord.status = "failed";
      paymentRecord.errorCode = "BAD_SIGNATURE";
      paymentRecord.errorDescription = "Signature verification mismatch.";
      paymentRecord.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      syncPaymentToSupabase(paymentRecord);
    }
    for (const hold of appointmentHoldsStore.values()) {
      if (hold.appointmentId === appointmentId && hold.status === "active") {
        hold.status = "released";
        syncAppointmentHoldToSupabase(hold);
      }
    }
    syncAppointmentToSupabase(appt);
    const failLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      entityType: "payment",
      entityId: appointmentId,
      action: "SIGNATURE_VERIFICATION_FAILED",
      actorRole: "razorpay_system",
      details: `Invalid signature for order ${razorpay_order_id}. Payment rejected.`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    auditLogsStore.unshift(failLog);
    syncAuditLogToSupabase(failLog);
    return res.status(400).json({
      success: false,
      error: "Your payment could not be verified. Your appointment has not been confirmed."
    });
  }
  const paidAt = (/* @__PURE__ */ new Date()).toISOString();
  appt.status = "confirmed";
  appt.confirmedAt = paidAt;
  appt.updatedAt = paidAt;
  delete appt.holdExpiresAt;
  for (const hold of appointmentHoldsStore.values()) {
    if (hold.appointmentId === appointmentId && hold.status === "active") {
      hold.status = "converted_to_appointment";
      syncAppointmentHoldToSupabase(hold);
    }
  }
  if (paymentRecord) {
    paymentRecord.status = "paid";
    paymentRecord.razorpayPaymentId = razorpay_payment_id;
    paymentRecord.razorpaySignature = razorpay_signature;
    paymentRecord.signatureVerified = true;
    paymentRecord.paymentMethod = payment_method || "upi";
    paymentRecord.paidAt = paidAt;
    paymentRecord.updatedAt = paidAt;
    syncPaymentToSupabase(paymentRecord);
  }
  syncAppointmentToSupabase(appt);
  const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;
  const successLog = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    entityType: "payment",
    entityId: appointmentId,
    action: "PAYMENT_VERIFIED_CONFIRMED",
    actorRole: "razorpay_system",
    details: `Payment verified and appointment ${appointmentId} confirmed for ${appt.patientName}. Receipt: ${receiptNumber}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  auditLogsStore.unshift(successLog);
  syncAuditLogToSupabase(successLog);
  res.json({
    success: true,
    appointment: appt,
    payment: paymentRecord,
    receiptNumber
  });
};
app.post("/api/payments/verify", handleVerifyPayment);
app.post("/api/payments/verify-payment", handleVerifyPayment);
app.post("/api/razorpay/verify", handleVerifyPayment);
app.post("/api/razorpay/verify-payment", handleVerifyPayment);
var handleRazorpayWebhook = async (req, res) => {
  const webhookSignature = req.headers["x-razorpay-signature"] || "";
  const rawBody = req.rawBody || JSON.stringify(req.body);
  let isSigValid = false;
  if (webhookSignature && RAZORPAY_WEBHOOK_SECRET) {
    const expectedSig = crypto.createHmac("sha256", RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
    try {
      isSigValid = crypto.timingSafeEqual(
        Buffer.from(expectedSig, "utf8"),
        Buffer.from(webhookSignature, "utf8")
      );
    } catch {
      isSigValid = false;
    }
  }
  const payload = req.body || {};
  const eventType = payload.event || "unknown";
  const eventId = payload.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const paymentEntity = payload.payload?.payment?.entity;
  const orderId = paymentEntity?.order_id || payload.payload?.order?.entity?.id || "";
  const paymentId = paymentEntity?.id || "";
  if (webhookEventsStore.has(eventId)) {
    return res.status(200).json({ status: "ok", message: "Duplicate webhook event ignored" });
  }
  const whEvent = {
    id: `wh-${Date.now()}`,
    eventId,
    eventType,
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    signature: webhookSignature,
    signatureVerified: isSigValid,
    payload,
    status: isSigValid ? "processed" : "rejected_signature",
    processedAt: (/* @__PURE__ */ new Date()).toISOString(),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  webhookEventsStore.set(eventId, whEvent);
  syncWebhookEventToSupabase(whEvent);
  if (!isSigValid) {
    logAudit("webhook", eventId, "WEBHOOK_SIGNATURE_REJECTED", "razorpay_system", `Rejected webhook event ${eventType} due to invalid signature.`);
    return res.status(400).json({ status: "error", error: "Invalid webhook signature" });
  }
  if (eventType === "payment.captured" || eventType === "order.paid") {
    let matchedPayment;
    for (const p of paymentsStore.values()) {
      if (p.razorpayOrderId === orderId) {
        matchedPayment = p;
        break;
      }
    }
    if (matchedPayment) {
      matchedPayment.status = "paid";
      matchedPayment.signatureVerified = true;
      matchedPayment.razorpayPaymentId = paymentId || matchedPayment.razorpayPaymentId;
      matchedPayment.paidAt = (/* @__PURE__ */ new Date()).toISOString();
      matchedPayment.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      syncPaymentToSupabase(matchedPayment);
      const matchedAppt = appointmentsStore.get(matchedPayment.appointmentId);
      if (matchedAppt) {
        matchedAppt.status = "confirmed";
        matchedAppt.confirmedAt = matchedPayment.paidAt;
        matchedAppt.updatedAt = matchedPayment.paidAt;
        delete matchedAppt.holdExpiresAt;
        syncAppointmentToSupabase(matchedAppt);
        for (const hold of appointmentHoldsStore.values()) {
          if (hold.appointmentId === matchedAppt.id && hold.status === "active") {
            hold.status = "converted_to_appointment";
            syncAppointmentHoldToSupabase(hold);
          }
        }
      }
    }
    logAudit("webhook", eventId, "WEBHOOK_PAYMENT_CAPTURED", "razorpay_system", `Processed ${eventType} for order ${orderId}, payment ${paymentId}.`);
  } else if (eventType === "payment.failed") {
    let matchedPayment;
    for (const p of paymentsStore.values()) {
      if (p.razorpayOrderId === orderId) {
        matchedPayment = p;
        break;
      }
    }
    if (matchedPayment) {
      matchedPayment.status = "failed";
      matchedPayment.errorCode = paymentEntity?.error_code || "PAYMENT_FAILED";
      matchedPayment.errorDescription = paymentEntity?.error_description || "Payment failed via webhook";
      matchedPayment.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      syncPaymentToSupabase(matchedPayment);
      const matchedAppt = appointmentsStore.get(matchedPayment.appointmentId);
      if (matchedAppt && matchedAppt.status === "pending_payment") {
        matchedAppt.status = "payment_failed";
        matchedAppt.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        syncAppointmentToSupabase(matchedAppt);
        for (const hold of appointmentHoldsStore.values()) {
          if (hold.appointmentId === matchedAppt.id && hold.status === "active") {
            hold.status = "released";
            syncAppointmentHoldToSupabase(hold);
          }
        }
      }
    }
    logAudit("webhook", eventId, "WEBHOOK_PAYMENT_FAILED", "razorpay_system", `Processed payment.failed for order ${orderId}.`);
  } else if (eventType === "refund.processed") {
    let matchedPayment;
    for (const p of paymentsStore.values()) {
      if (p.razorpayOrderId === orderId || paymentId && p.razorpayPaymentId === paymentId) {
        matchedPayment = p;
        break;
      }
    }
    if (matchedPayment) {
      matchedPayment.status = "refunded";
      matchedPayment.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      syncPaymentToSupabase(matchedPayment);
      const matchedAppt = appointmentsStore.get(matchedPayment.appointmentId);
      if (matchedAppt) {
        matchedAppt.status = "cancelled";
        matchedAppt.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        syncAppointmentToSupabase(matchedAppt);
      }
    }
    logAudit("webhook", eventId, "WEBHOOK_REFUND_PROCESSED", "razorpay_system", `Processed refund for order ${orderId}.`);
  }
  return res.status(200).json({ status: "ok" });
};
app.post("/api/razorpay/webhook", handleRazorpayWebhook);
app.post("/api/webhooks/razorpay", handleRazorpayWebhook);
app.post("/api/appointments/release-hold", (req, res) => {
  const { appointmentId } = req.body;
  const appt = appointmentsStore.get(appointmentId);
  if (appt && appt.status === "pending_payment") {
    appt.status = "cancelled";
    appt.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    syncAppointmentToSupabase(appt);
    for (const hold of appointmentHoldsStore.values()) {
      if (hold.appointmentId === appointmentId && hold.status === "active") {
        hold.status = "released";
        syncAppointmentHoldToSupabase(hold);
      }
    }
    for (const payment of paymentsStore.values()) {
      if (payment.appointmentId === appointmentId && payment.status === "created") {
        payment.status = "cancelled";
        payment.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        syncPaymentToSupabase(payment);
      }
    }
    logAudit("slot", appointmentId, "SLOT_HOLD_MANUALLY_RELEASED", "patient", `Hold released for ${appointmentId}.`);
  }
  res.json({ success: true });
});
app.get("/api/clinic-settings", (_req, res) => {
  res.json({ settings: clinicSettings });
});
app.put("/api/clinic-settings", (req, res) => {
  clinicSettings = {
    ...clinicSettings,
    ...req.body,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  clinicPricing.appointmentFee = clinicSettings.appointmentFee;
  clinicPricing.convenienceFee = clinicSettings.convenienceFee;
  clinicPricing.totalAmount = clinicSettings.totalAmount;
  clinicPricing.slotHoldMinutes = clinicSettings.slotHoldMinutes;
  logAudit("pricing", "clinic-settings-1", "UPDATED_CLINIC_SETTINGS", "admin", "Clinic settings updated by administrator.");
  res.json({ success: true, settings: clinicSettings });
});
app.get("/api/config", (_req, res) => {
  const kt = getKolkataTime();
  res.json({
    razorpayKeyId: RAZORPAY_KEY_ID,
    pricing: clinicPricing,
    clinicSettings,
    currentClinicTime: {
      date: kt.currentDateStr,
      time: kt.timeFormatted,
      dayOfWeek: kt.currentDayOfWeek,
      timezone: CLINIC_TIMEZONE
    }
  });
});
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const staff = Array.from(staffStore.values()).find((s) => s.email.toLowerCase() === email?.toLowerCase());
  if (!staff || !staff.isActive) {
    return res.status(401).json({ error: "Invalid credentials or inactive account." });
  }
  if (password !== "staff123" && password !== "admin123") {
    return res.status(401).json({ error: "Invalid password." });
  }
  staff.lastLoginAt = (/* @__PURE__ */ new Date()).toISOString();
  logAudit("staff", staff.id, "STAFF_LOGIN", staff.role, `Successful login by ${staff.name} (${staff.email})`);
  res.json({
    success: true,
    user: {
      id: staff.id,
      email: staff.email,
      name: staff.name,
      role: staff.role,
      token: `jwt_sim_${staff.id}_${Date.now()}`
    }
  });
});
var handleGetSpecialties = (_req, res) => {
  const active = Array.from(specialtiesStore.values()).filter((s) => s.isActive);
  res.json({ specialties: active });
};
app.get("/api/specialties", handleGetSpecialties);
app.get("/specialties", handleGetSpecialties);
var handleGetTreatments = (_req, res) => {
  const active = Array.from(servicesStore.values()).filter((s) => s.isActive);
  res.json({ treatments: active });
};
app.get("/api/treatments", handleGetTreatments);
app.get("/treatments", handleGetTreatments);
var handleGetDoctors = (_req, res) => {
  const active = Array.from(doctorsStore.values()).filter((d) => d.isActive);
  res.json({ doctors: active });
};
app.get("/api/doctors", handleGetDoctors);
app.get("/doctors", handleGetDoctors);
var handleGetSlots = (req, res) => {
  let doctorId = req.query?.doctorId || "";
  let date = req.query?.date || "";
  let serviceId = req.query?.serviceId || "";
  let durationStr = req.query?.serviceDurationMinutes || "";
  if (!doctorId || !date) {
    try {
      const urlToParse = req.url && req.url.startsWith("http") ? req.url : `http://localhost${req.url || "/"}`;
      const parsed = new URL(urlToParse);
      doctorId = doctorId || parsed.searchParams.get("doctorId") || "";
      date = date || parsed.searchParams.get("date") || "";
      serviceId = serviceId || parsed.searchParams.get("serviceId") || "";
      durationStr = durationStr || parsed.searchParams.get("serviceDurationMinutes") || "";
    } catch {
    }
  }
  if (!doctorId && doctorsStore.size > 0) {
    doctorId = PRIMARY_DOCTOR_ID || Array.from(doctorsStore.values())[0]?.id || "";
  }
  if (!doctorId || !date) {
    return res.status(400).json({ error: "doctorId and date (YYYY-MM-DD) are required." });
  }
  let duration = parseInt(durationStr, 10) || 45;
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
      timezone: CLINIC_TIMEZONE
    }
  });
};
app.get("/api/slots/available", handleGetSlots);
app.get("/slots/available", handleGetSlots);
app.get("/api/slots", handleGetSlots);
app.get("/slots", handleGetSlots);
app.get("/api/admin/doctors/:id/schedule", (req, res) => {
  const doctor = doctorsStore.get(req.params.id);
  if (!doctor) return res.status(404).json({ error: "Doctor not found" });
  res.json({ schedule: doctor.schedule });
});
app.put("/api/admin/doctors/:id/schedule", (req, res) => {
  const doctor = doctorsStore.get(req.params.id);
  if (!doctor) return res.status(404).json({ error: "Doctor not found" });
  const { schedule } = req.body;
  if (!Array.isArray(schedule)) {
    return res.status(400).json({ error: "Schedule must be an array of working hours." });
  }
  doctor.schedule = schedule;
  logAudit("doctor", doctor.id, "UPDATED_DOCTOR_SCHEDULE", "admin", `Updated weekly working hours for ${doctor.name}.`);
  res.json({ success: true, schedule: doctor.schedule });
});
app.post("/api/admin/doctors/:id/exceptions", (req, res) => {
  const doctor = doctorsStore.get(req.params.id);
  if (!doctor) return res.status(404).json({ error: "Doctor not found" });
  const { date, startTime, endTime, reason, exceptionType } = req.body;
  if (!date || !startTime || !endTime || !reason) {
    return res.status(400).json({ error: "Missing required exception fields." });
  }
  const newEx = {
    id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    doctorId: doctor.id,
    date,
    startTime,
    endTime,
    exceptionType: exceptionType || "leave",
    reason,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  doctor.exceptions = doctor.exceptions || [];
  doctor.exceptions.push(newEx);
  logAudit("doctor", doctor.id, "ADDED_DOCTOR_EXCEPTION", "admin", `Added exception for ${doctor.name} on ${date}: ${reason}`);
  res.json({ success: true, exception: newEx });
});
app.delete("/api/admin/doctors/:id/exceptions/:exceptionId", (req, res) => {
  const doctor = doctorsStore.get(req.params.id);
  if (!doctor) return res.status(404).json({ error: "Doctor not found" });
  doctor.exceptions = (doctor.exceptions || []).filter((e) => e.id !== req.params.exceptionId);
  logAudit("doctor", doctor.id, "REMOVED_DOCTOR_EXCEPTION", "admin", `Removed exception ${req.params.exceptionId} for ${doctor.name}.`);
  res.json({ success: true });
});
app.get("/api/admin/doctors/:id/blocked-slots", (req, res) => {
  const slots = Array.from(blockedSlotsStore.values()).filter((b) => b.doctorId === req.params.id);
  res.json({ blockedSlots: slots });
});
app.post("/api/admin/doctors/:id/blocked-slots", (req, res) => {
  const doctor = doctorsStore.get(req.params.id);
  if (!doctor) return res.status(404).json({ error: "Doctor not found" });
  const { blockedDate, startTime, endTime, reason, timeSlot12 } = req.body;
  if (!blockedDate || !startTime || !endTime || !reason) {
    return res.status(400).json({ error: "Missing blockedDate, startTime, endTime, or reason." });
  }
  const newBlock = {
    id: `blk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    doctorId: doctor.id,
    doctorName: doctor.name,
    blockedDate,
    startTime,
    endTime,
    timeSlot12,
    reason,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  blockedSlotsStore.set(newBlock.id, newBlock);
  logAudit("slot", newBlock.id, "BLOCKED_APPOINTMENT_SLOT", "admin", `Blocked slot for ${doctor.name} on ${blockedDate} at ${startTime}-${endTime}: ${reason}`);
  res.json({ success: true, blockedSlot: newBlock });
});
app.delete("/api/admin/blocked-slots/:id", (req, res) => {
  const exists = blockedSlotsStore.get(req.params.id);
  if (!exists) return res.status(404).json({ error: "Blocked slot not found" });
  blockedSlotsStore.delete(req.params.id);
  logAudit("slot", req.params.id, "UNBLOCKED_APPOINTMENT_SLOT", "admin", `Unblocked slot ${req.params.id}`);
  res.json({ success: true });
});
app.get("/api/reviews", (_req, res) => {
  const approved = Array.from(reviewsStore.values()).filter((r) => r.approved).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ reviews: approved });
});
app.post("/api/reviews", (req, res) => {
  const { patientName, rating, reviewText, treatmentName } = req.body;
  if (!patientName || !rating || !reviewText) {
    return res.status(400).json({ error: "Name, rating (1-5), and review text are required." });
  }
  const numRating = Math.max(1, Math.min(5, Number(rating)));
  const newReview = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    patientName: patientName.trim(),
    rating: numRating,
    reviewText: reviewText.trim(),
    treatmentName: treatmentName || "Cosmetic Consultation",
    approved: false,
    featured: false,
    isDemo: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  reviewsStore.set(newReview.id, newReview);
  logAudit("review", newReview.id, "SUBMITTED_PATIENT_REVIEW", "patient", `Patient ${patientName} submitted review (${numRating} stars).`);
  res.json({
    success: true,
    message: "Thank you! Your review will be published upon clinical moderation.",
    review: newReview
  });
});
app.get("/api/admin/reviews", (_req, res) => {
  const allReviews = Array.from(reviewsStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ reviews: allReviews });
});
app.put("/api/admin/reviews/:id", (req, res) => {
  const review = reviewsStore.get(req.params.id);
  if (!review) return res.status(404).json({ error: "Review not found" });
  const { approved, featured } = req.body;
  if (typeof approved === "boolean") review.approved = approved;
  if (typeof featured === "boolean") review.featured = featured;
  review.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  logAudit("review", review.id, "MODERATED_REVIEW", "admin", `Review ${review.id} updated: approved=${review.approved}`);
  res.json({ success: true, review });
});
app.delete("/api/admin/reviews/:id", (req, res) => {
  if (!reviewsStore.has(req.params.id)) return res.status(404).json({ error: "Review not found" });
  reviewsStore.delete(req.params.id);
  logAudit("review", req.params.id, "DELETED_REVIEW", "admin", `Review ${req.params.id} deleted.`);
  res.json({ success: true });
});
app.get("/api/appointments", (_req, res) => {
  const list = Array.from(appointmentsStore.values()).map((appt) => {
    let payment;
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
app.get("/api/appointments/:id", (req, res) => {
  const appt = appointmentsStore.get(req.params.id);
  if (!appt) return res.status(404).json({ error: "Appointment not found" });
  let payment;
  for (const p of paymentsStore.values()) {
    if (p.appointmentId === appt.id) {
      payment = p;
      break;
    }
  }
  res.json({ appointment: appt, payment });
});
app.post("/api/staff/checkin", (req, res) => {
  const { appointmentId, status } = req.body;
  const appt = appointmentsStore.get(appointmentId);
  if (!appt) return res.status(404).json({ error: "Appointment not found" });
  appt.checkInStatus = status;
  appt.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  syncAppointmentToSupabase(appt);
  logAudit("appointment", appointmentId, "STAFF_STATUS_UPDATE", "staff", `Updated status to ${status} for ${appt.patientName}.`);
  res.json({ success: true, appointment: appt });
});
app.get("/api/admin/stats", (_req, res) => {
  const appts = Array.from(appointmentsStore.values());
  const payments = Array.from(paymentsStore.values());
  const confirmedAppts = appts.filter((a) => a.status === "confirmed");
  const totalRevenuePaise = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  res.json({
    totalAppointments: appts.length,
    confirmedCount: confirmedAppts.length,
    pendingCount: appts.filter((a) => a.status === "pending_payment").length,
    failedCount: appts.filter((a) => a.status === "payment_failed").length,
    totalRevenueINR: totalRevenuePaise / 100,
    verifiedSignaturesCount: payments.filter((p) => p.signatureVerified).length,
    pricing: clinicPricing
  });
});
app.get("/api/admin/audit-logs", (_req, res) => {
  res.json({ auditLogs: auditLogsStore.slice(0, 100) });
});
app.get("/api/admin/webhooks", (_req, res) => {
  res.json({ webhooks: Array.from(webhookEventsStore.values()) });
});
app.post("/api/admin/settings", (req, res) => {
  const { appointmentFee, convenienceFee, slotHoldMinutes } = req.body;
  if (appointmentFee !== void 0) clinicPricing.appointmentFee = Number(appointmentFee);
  if (convenienceFee !== void 0) clinicPricing.convenienceFee = Number(convenienceFee);
  clinicPricing.totalAmount = clinicPricing.appointmentFee + clinicPricing.convenienceFee;
  if (slotHoldMinutes !== void 0) clinicPricing.slotHoldMinutes = Number(slotHoldMinutes);
  clinicSettings.appointmentFee = clinicPricing.appointmentFee;
  clinicSettings.convenienceFee = clinicPricing.convenienceFee;
  clinicSettings.totalAmount = clinicPricing.totalAmount;
  clinicSettings.slotHoldMinutes = clinicPricing.slotHoldMinutes;
  logAudit("pricing", "clinic-pricing-1", "UPDATED_PRICING", "admin", `Pricing updated: \u20B9${clinicPricing.appointmentFee} + \u20B9${clinicPricing.convenienceFee} = \u20B9${clinicPricing.totalAmount}.`);
  res.json({ success: true, pricing: clinicPricing });
});
app.post("/api/admin/refund", (req, res) => {
  const { paymentId, reason } = req.body;
  const payment = paymentsStore.get(paymentId);
  if (!payment) return res.status(404).json({ error: "Payment record not found" });
  payment.status = "refunded";
  payment.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  syncPaymentToSupabase(payment);
  const appt = appointmentsStore.get(payment.appointmentId);
  if (appt) {
    appt.status = "cancelled";
    appt.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    syncAppointmentToSupabase(appt);
  }
  logAudit("payment", paymentId, "ADMIN_REFUND_PROCESSED", "admin", `Refunded \u20B9${payment.amount / 100} for appointment ${payment.appointmentId}. Reason: ${reason || "N/A"}`);
  res.json({ success: true, payment });
});
app.post("/api/payments/simulate-webhook", async (req, res) => {
  const { orderId, eventType, sendInvalidSignature } = req.body;
  const eventId = `evt_sim_${Date.now()}`;
  const payload = {
    entity: "event",
    account_id: "acc_AestheticClinicSim",
    event: eventType || "payment.captured",
    contains: ["payment"],
    payload: {
      payment: {
        entity: {
          id: `pay_sim_${Date.now()}`,
          order_id: orderId || "order_AestheticSeed9821",
          amount: 12e3,
          currency: "INR",
          status: "captured",
          method: "upi"
        }
      }
    }
  };
  const payloadStr = JSON.stringify(payload);
  const signature = sendInvalidSignature ? "invalid_webhook_sig" : crypto.createHmac("sha256", RAZORPAY_WEBHOOK_SECRET).update(payloadStr).digest("hex");
  const isSigValid = !sendInvalidSignature;
  const whEvent = {
    id: `wh-${Date.now()}`,
    eventId,
    eventType: eventType || "payment.captured",
    razorpayOrderId: orderId || "order_AestheticSeed9821",
    razorpayPaymentId: payload.payload.payment.entity.id,
    signature,
    signatureVerified: isSigValid,
    payload,
    status: isSigValid ? "processed" : "rejected_signature",
    processedAt: (/* @__PURE__ */ new Date()).toISOString(),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  webhookEventsStore.set(eventId, whEvent);
  syncWebhookEventToSupabase(whEvent);
  logAudit("webhook", eventId, "SIMULATED_WEBHOOK", "system_worker", `Simulated webhook ${eventType} for ${orderId}. Status: ${whEvent.status}`);
  res.json({ success: true, webhookEvent: whEvent });
});
app.post("/api/ai/chat", async (req, res) => {
  const { messages, userMessage } = req.body;
  if (!userMessage && (!messages || messages.length === 0)) {
    return res.status(400).json({ error: "User message or conversation history required." });
  }
  const doctorList = Array.from(doctorsStore.values()).map((d) => `- ${d.name} (${d.title}): Specializes in ${d.specialtyName}. Clinic days: ${d.consultationDays.join(", ")}.`).join("\n");
  const treatmentList = Array.from(servicesStore.values()).map((s) => `- ${s.name} (${s.category}, ${s.durationMinutes} min): ${s.shortDescription}`).join("\n");
  const systemInstruction = `You are the Aesthetic Assistant, the refined clinical concierge for Aesthetic Dental Clinic in Indiranagar, Bengaluru.

CLINIC INFORMATION:
- Address: ${clinicSettings.addressLine}, ${clinicSettings.city}, ${clinicSettings.state} ${clinicSettings.postalCode}.
- Opening Hours: ${clinicSettings.openingHoursWeekdays}; ${clinicSettings.openingHoursSunday}.
- Consultation Fee: \u20B9100 Specialist Fee + \u20B920 Booking Fee = \u20B9120 Total Payable (includes 10-minute temporary slot hold).

ATTENDING SPECIALIST:
${doctorList}

TREATMENTS:
${treatmentList}

GUIDELINES & MEDICAL SAFETY:
1. Tone: Calm, refined, articulate, empathetic, concise, and professional.
2. Medical Safety: Educational guidance only. Never diagnose or prescribe medication. Always advise scheduling an in-person clinical consultation.
3. Pricing: Always state the transparent \u20B9100 + \u20B920 = \u20B9120 fee structure.
4. Booking: If user wants to book, warmly guide them to select a treatment/slot.`;
  try {
    if (!ai) {
      return res.json({
        reply: `Welcome to Aesthetic Dental Clinic. We offer specialized care in Cosmetic Dentistry, Guided Implants, Clear Aligners, and Restorations with Dr. Maya Rao. Our consultation fee is \u20B9100 + \u20B920 booking fee (\u20B9120 total). How may I assist you today?`
      });
    }
    const contents = [];
    if (Array.isArray(messages)) {
      for (const msg of messages) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        });
      }
    }
    if (userMessage) {
      contents.push({
        role: "user",
        parts: [{ text: userMessage }]
      });
    }
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.4,
        maxOutputTokens: 600
      }
    });
    const replyText = response.text || "I would be delighted to assist you with our treatments or consultation bookings.";
    let actionSuggestion = void 0;
    const lower = (userMessage || "").toLowerCase();
    if (lower.includes("book") || lower.includes("appointment") || lower.includes("reserve") || lower.includes("slot") || lower.includes("consult")) {
      actionSuggestion = {
        type: "book_appointment",
        doctorId: PRIMARY_DOCTOR_ID
      };
      if (lower.includes("veneer") || lower.includes("whitening") || lower.includes("maya")) {
        actionSuggestion.serviceId = "srv-1";
        actionSuggestion.treatmentName = "Cosmetic Veneers";
      } else if (lower.includes("implant")) {
        actionSuggestion.serviceId = "srv-4";
        actionSuggestion.treatmentName = "Guided Implants";
      } else if (lower.includes("align") || lower.includes("ortho")) {
        actionSuggestion.serviceId = "srv-3";
        actionSuggestion.treatmentName = "Clear Aligners";
      }
    }
    res.json({
      reply: replyText,
      actionSuggestion
    });
  } catch (error) {
    console.error("Gemini chat error:", error);
    res.json({
      reply: `Our atelier welcomes you. You can consult with our lead prosthodontist Dr. Maya Rao for \u20B9120 (\u20B9100 Doctor Fee + \u20B920 Booking Fee). Please let me know if you would like treatment details or assistance reserving a slot.`
    });
  }
});
app.post("/api/ai/oral-health-search", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Query required" });
  if (!ai) {
    return res.json({
      answer: `Cosmetic veneers and clinical smile makeovers involve 3D intraoral optical scanning to stage natural polychromatic porcelain restorations with minimal enamel reduction. Consult with an accredited prosthodontist for clinical diagnostics.`,
      sources: [{ title: "American Academy of Cosmetic Dentistry (AACD)", url: "https://aacd.com" }]
    });
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an expert clinical dental researcher. Provide an accurate, peer-reviewed summary for the following oral health inquiry: "${query}". Address clinical mechanisms, indication criteria, and enamel preservation guidelines.`,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3
      }
    });
    const answer = response.text || "Information unavailable.";
    const sources = [];
    const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (Array.isArray(searchChunks)) {
      for (const chunk of searchChunks) {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ title: chunk.web.title, url: chunk.web.uri });
        }
      }
    }
    res.json({ answer, sources });
  } catch (err) {
    console.error("AI search error:", err);
    res.json({
      answer: `Cosmetic porcelain veneers and clear orthodontic aligners represent the standard of care for modern aesthetic rehabilitation. A comprehensive clinical consultation is recommended for personalized treatment planning.`,
      sources: [{ title: "Aesthetic Dental Research Repository", url: "https://aestheticdental.com" }]
    });
  }
});
app.post("/api/ai/smile-visualizer", async (req, res) => {
  const { treatmentType, resolution } = req.body;
  const resLabel = resolution || "2K";
  res.json({
    success: true,
    treatmentType: treatmentType || "Cosmetic Veneers",
    resolution: resLabel,
    simulatedImageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80",
    analysis: `Simulated high-resolution ${resLabel} transformation staged for ${treatmentType || "Cosmetic Veneers"}. Natural incisal translucency BL1/BL2 shade gradient with preserved gingival contours.`
  });
});
var handleHealthCheck = (_req, res) => {
  res.json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    service: "Aesthetic Dental Clinic API",
    environment: process.env.NODE_ENV || "development"
  });
};
app.get("/api/health", handleHealthCheck);
app.get("/health", handleHealthCheck);
app.get("/api", handleHealthCheck);
app.use((err, _req, res, _next) => {
  console.error("[Aesthetic Dental API Error]:", err);
  res.status(500).json({ error: err?.message || "Internal Server Error" });
});
var app_default = app;

// api/index.ts
function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-razorpay-signature");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  const rawUrl = req.url || "";
  const matchedPath = req.headers["x-matched-path"] || "";
  const forwardedUri = req.headers["x-forwarded-uri"] || "";
  const originalUri = req.headers["x-original-uri"] || "";
  if (matchedPath && !matchedPath.includes("/api/index")) {
    const qIndex = rawUrl.indexOf("?");
    const query = qIndex !== -1 ? rawUrl.slice(qIndex) : "";
    req.url = matchedPath.includes("?") ? matchedPath : `${matchedPath}${query}`;
  } else if (forwardedUri && !forwardedUri.includes("/api/index")) {
    req.url = forwardedUri;
  } else if (originalUri && !originalUri.includes("/api/index")) {
    req.url = originalUri;
  } else if (rawUrl.includes("/api/index.ts") || rawUrl.includes("/api/index")) {
    const qIndex = rawUrl.indexOf("?");
    if (qIndex !== -1) {
      const searchParams = new URLSearchParams(rawUrl.slice(qIndex));
      const group0 = searchParams.get("0") || searchParams.get("1");
      if (group0) {
        searchParams.delete("0");
        searchParams.delete("1");
        const rest = searchParams.toString();
        req.url = `/api/${group0}${rest ? `?${rest}` : ""}`;
      }
    }
  }
  if (req.url && !req.url.startsWith("/api/") && !req.url.startsWith("/api?") && req.url !== "/api") {
    req.url = `/api${req.url.startsWith("/") ? req.url : `/${req.url}`}`;
  }
  const url = req.url || "";
  if (url === "/api/health" || url === "/health" || url === "/api/health/" || url === "/health/" || url.startsWith("/api/health?") || url.startsWith("/health?")) {
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({
      ok: true,
      status: "ok",
      environment: process.env.VERCEL ? "vercel" : process.env.NODE_ENV || "development",
      service: "aesthetic-dental-api",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  return app_default(req, res);
}
export {
  handler as default
};
