import { Doctor, Service, Specialty, ClinicSettings, StaffAccount, Review, BlockedSlot } from '../types';

export const PRIMARY_DOCTOR_ID = '227da1bf-d14a-4033-b909-2d53a33129a0';

export const INITIAL_CLINIC_SETTINGS: ClinicSettings = {
  id: 'clinic-settings-1',
  clinicName: 'Aesthetic Dental Clinic',
  tagline: 'A more considered approach to your smile',
  addressLine: 'MediSquare Towers, Level 4, 100 Feet Road, Indiranagar',
  city: 'Bengaluru',
  state: 'Karnataka',
  postalCode: '560038',
  phone: '+91 80 4912 8800',
  email: 'concierge@aestheticdental.com',
  openingHoursWeekdays: 'Monday – Friday: 09:00 – 18:00',
  openingHoursSunday: 'Closed on Sunday',
  appointmentFee: 100, // ₹100
  convenienceFee: 20,  // ₹20
  totalAmount: 120,    // ₹120
  currency: 'INR',
  slotHoldMinutes: 10,
  timezone: 'Asia/Kolkata',
  updatedAt: new Date().toISOString(),
};

export const CLINIC_WHATSAPP_NUMBER = '918049128800';

export const getWhatsAppLink = (customMessage?: string): string => {
  const defaultMsg = 'Hello Aesthetic Dental Clinic, I would like some help regarding a dental concern and would like to know more about consultation.';
  const message = encodeURIComponent(customMessage || defaultMsg);
  return `https://wa.me/${CLINIC_WHATSAPP_NUMBER}?text=${message}`;
};

export const INITIAL_PRICING = {
  appointmentFee: 100,
  convenienceFee: 20,
  totalAmount: 120,
  currency: 'INR',
  slotHoldMinutes: 10,
  timezone: 'Asia/Kolkata',
  openingTime: '09:00',
  closingTime: '18:00',
};

export const CLINIC_SPECIALTIES: Specialty[] = [
  {
    id: 'spec-1',
    name: 'Cosmetic Dentistry & Smile Architecture',
    slug: 'cosmetic-dentistry',
    description: 'Bespoke porcelain veneers, digital optical mock-ups, and polychromatic enamel restoration.',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'spec-2',
    name: 'Implantology & Full Mouth Rehabilitation',
    slug: 'implantology',
    description: 'Computer-guided titanium implants paired with monolithic zirconia ceramic crowns.',
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 'spec-3',
    name: 'Orthodontics & Dentofacial Orthopedics',
    slug: 'orthodontics',
    description: 'Invisible 3D clear aligners and precision biomechanics for adult alignment.',
    displayOrder: 3,
    isActive: true,
  },
  {
    id: 'spec-4',
    name: 'Microscopic Endodontics & Biomimetic Restorations',
    slug: 'restorative',
    description: 'Painless microscopic root canal therapy and conservative biomimetic inlays/onlays.',
    displayOrder: 4,
    isActive: true,
  },
  {
    id: 'spec-5',
    name: 'Periodontal & Preventive Enamel Wellness',
    slug: 'preventive',
    description: 'Ultrasonic air-polishing, deep prophylaxis, and personalized oral microbiome health.',
    displayOrder: 5,
    isActive: true,
  },
];

export const CLINIC_SERVICES: Service[] = [
  {
    id: 'srv-1',
    name: 'Cosmetic Veneers & Smile Architecture',
    slug: 'cosmetic-veneers',
    specialtyId: 'spec-1',
    category: 'Cosmetic Dentistry',
    durationMinutes: 60,
    shortDescription: 'Handcrafted ultra-thin porcelain veneers for natural, radiant smile proportions.',
    description: 'Comprehensive aesthetic evaluation including 3D intraoral optical scanning, digital smile staging, diagnostic wax-up review, and minimally-invasive enamel preservation protocol.',
    highlights: ['Microscopic enamel preservation', '3D Diagnostic mock-up review', 'Optical polychromatic porcelain'],
    isActive: true,
    displayOrder: 1,
  },
  {
    id: 'srv-2',
    name: 'Advanced Laser Teeth Whitening',
    slug: 'laser-whitening',
    specialtyId: 'spec-1',
    category: 'Cosmetic Dentistry',
    durationMinutes: 45,
    shortDescription: 'In-office laser-activated enamel brightening with zero-sensitivity protective barrier.',
    description: 'Clinical-grade dual-wavelength laser whitening targeting deep intrinsic enamel discoloration while shielding periodontal and gingival tissues.',
    highlights: ['Zero-sensitivity desensitizing formulation', 'Immediate shade evaluation', 'Custom post-care maintenance kit'],
    isActive: true,
    displayOrder: 2,
  },
  {
    id: 'srv-3',
    name: 'Invisible Clear Aligners Consultation',
    slug: 'clear-aligners',
    specialtyId: 'spec-3',
    category: 'Orthodontics',
    durationMinutes: 45,
    shortDescription: 'Custom 3D optical orthodontic scan and biomechanical aligner progression map.',
    description: 'Full-arch digital intraoral scan evaluating bite harmony, crowding, deep bite, or spacing corrections without metal brackets.',
    highlights: ['Zero-radiation intraoral 3D scan', 'Outcome simulator preview', 'Accelerated tracking schedule'],
    isActive: true,
    displayOrder: 3,
  },
  {
    id: 'srv-4',
    name: 'Guided Digital Dental Implants',
    slug: 'dental-implants',
    specialtyId: 'spec-2',
    category: 'Implantology',
    durationMinutes: 60,
    shortDescription: 'Titanium osseointegrated fixture with monolithic zirconia ceramic crown.',
    description: 'Precision surgical template planning with 3D CBCT imaging for lifetime durability and natural masticatory restoration.',
    highlights: ['3D CBCT computer-guided placement', 'Grade-5 medical titanium fixture', 'Monolithic zirconia crown'],
    isActive: true,
    displayOrder: 4,
  },
  {
    id: 'srv-5',
    name: 'Microscopic Biomimetic Onlays & Crowns',
    slug: 'biomimetic-restorations',
    specialtyId: 'spec-4',
    category: 'Restorative Care',
    durationMinutes: 45,
    shortDescription: 'Microscope-assisted ceramic restorations that replicate natural tooth flexibility and strength.',
    description: 'Conservative restoration of fractured or decayed teeth using high-strength lithium disilicate ceramics.',
    highlights: ['Operating microscope precision', 'Lithium disilicate (E-Max) ceramics', 'Maximum tooth preservation'],
    isActive: true,
    displayOrder: 5,
  },
  {
    id: 'srv-6',
    name: 'Full Prophylaxis & Enamel Air-Polishing',
    slug: 'preventive-prophylaxis',
    specialtyId: 'spec-5',
    category: 'Preventive Care',
    durationMinutes: 30,
    shortDescription: 'Gentle ultrasonic scaling paired with erythritol air-flow biofilm removal.',
    description: 'Thorough removal of supra- and subgingival calculus, biofilm, and stubborn coffee/tea stains with zero enamel abrasion.',
    highlights: ['Erythritol comfort air-flow polishing', 'Ultrasonic tartar debridement', 'Enamel remineralization varnish'],
    isActive: true,
    displayOrder: 6,
  },
];

export const CLINIC_DOCTORS: Doctor[] = [
  {
    id: PRIMARY_DOCTOR_ID, // 227da1bf-d14a-4033-b909-2d53a33129a0
    name: 'Dr. Maya Rao, MDS',
    title: 'Lead Aesthetic Prosthodontist & Ceramist',
    specialtyId: 'spec-1',
    specialtyName: 'Cosmetic Dentistry & Smile Architecture',
    qualification: 'MDS Prosthodontics (Gold Medalist), AACD Member',
    experienceYears: 14,
    avatarUrl: '',
    bio: 'Pioneered minimally-invasive ceramic veneer bonding techniques with sub-50 micron precision and natural enamel shade integration.',
    consultationDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    schedule: [
      {
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '18:00',
        breaks: [{ startTime: '13:00', endTime: '14:00', label: 'Lunch Break' }],
        isActive: true,
      },
      {
        dayOfWeek: 'Tuesday',
        startTime: '09:00',
        endTime: '18:00',
        breaks: [{ startTime: '13:00', endTime: '14:00', label: 'Lunch Break' }],
        isActive: true,
      },
      {
        dayOfWeek: 'Wednesday',
        startTime: '09:00',
        endTime: '18:00',
        breaks: [{ startTime: '13:00', endTime: '14:00', label: 'Lunch Break' }],
        isActive: true,
      },
      {
        dayOfWeek: 'Thursday',
        startTime: '09:00',
        endTime: '18:00',
        breaks: [{ startTime: '13:00', endTime: '14:00', label: 'Lunch Break' }],
        isActive: true,
      },
      {
        dayOfWeek: 'Friday',
        startTime: '09:00',
        endTime: '18:00',
        breaks: [{ startTime: '13:00', endTime: '14:00', label: 'Lunch Break' }],
        isActive: true,
      },
      {
        dayOfWeek: 'Saturday',
        startTime: '10:00',
        endTime: '15:00',
        isActive: false,
      },
      {
        dayOfWeek: 'Sunday',
        startTime: '10:00',
        endTime: '14:00',
        isActive: false,
      },
    ],
    exceptions: [],
    blockedSlots: [],
    isActive: true,
    displayOrder: 1,
  },
];

export const INITIAL_STAFF: StaffAccount[] = [
  {
    id: 'staff-1',
    email: 'staff@aestheticdental.com',
    name: 'Reception & Front Desk',
    role: 'staff',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'admin-1',
    email: 'admin@aestheticdental.com',
    name: 'Clinical Director & Admin',
    role: 'admin',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    patientName: 'Rohan K.',
    rating: 5,
    treatmentName: 'Cosmetic Veneers & Smile Architecture',
    reviewText: 'The attention to natural enamel translucency is extraordinary. Dr. Maya Rao walked me through the 3D mock-up before touching a tooth. The result is seamlessly natural.',
    approved: true,
    featured: true,
    isDemo: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'rev-2',
    patientName: 'Kavita M.',
    rating: 5,
    treatmentName: 'Advanced Laser Teeth Whitening',
    reviewText: 'Zero pain or sensitivity during laser whitening. Clean, calm clinic ambiance that feels like an architectural atelier rather than a dental clinic.',
    approved: true,
    featured: true,
    isDemo: true,
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: 'rev-3',
    patientName: 'David L.',
    rating: 5,
    treatmentName: 'Guided Digital Dental Implants',
    reviewText: 'Computer-guided implant surgery by Dr. Maya Rao was completed with incredible precision. Post-op recovery was virtually painless.',
    approved: true,
    featured: true,
    isDemo: true,
    createdAt: new Date(Date.now() - 86400000 * 18).toISOString(),
  },
  {
    id: 'rev-4',
    patientName: 'Ananya D.',
    rating: 5,
    treatmentName: 'Invisible Clear Aligners Consultation',
    reviewText: 'The 3D intraoral scanner mapped my entire bite in 3 minutes. The transparent fee breakdown and schedule respect made booking effortless.',
    approved: true,
    featured: true,
    isDemo: true,
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
  },
];
