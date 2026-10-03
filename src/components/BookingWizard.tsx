import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar as CalendarIcon,
  Printer,
  Lock,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  MessageCircle,
  Sun,
  Moon,
} from 'lucide-react';
import { CLINIC_DOCTORS, CLINIC_SERVICES, getAppointmentWhatsAppLink } from '../data/mockData';
import { Service, Doctor, TimeSlot, Appointment, Payment, CreateOrderResponse } from '../types';
import { apiClient } from '../lib/api';

interface BookingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedService?: Service | null;
  preselectedDoctor?: Doctor | null;
  onBookingSuccess?: (appointment: Appointment) => void;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  isOpen,
  onClose,
  preselectedService,
  preselectedDoctor,
  onBookingSuccess,
}) => {
  const [step, setStep] = useState<number>(1);

  // Dynamic Data Stores
  const [services, setServices] = useState<Service[]>(CLINIC_SERVICES);
  const [doctors, setDoctors] = useState<Doctor[]>(CLINIC_DOCTORS);

  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  
  // Date initialized to current date in India
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

  const [minDate] = useState<string>(() => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(now);
  });

  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Patient Details (Minimal & Privacy-first)
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone10, setPatientPhone10] = useState(''); // 10-digit raw string
  const [gender, setGender] = useState<string>(''); // voluntary, default empty
  const [notes, setNotes] = useState('');

  // Order & Payment State
  const [orderData, setOrderData] = useState<CreateOrderResponse | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [confirmedAppt, setConfirmedAppt] = useState<Appointment | null>(null);
  const [confirmedPayment, setConfirmedPayment] = useState<Payment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Slot Hold Expiry Countdown (10 Minutes)
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(600);
  const [isHoldExpired, setIsHoldExpired] = useState(false);

  // Fallback offline test modal (if external Razorpay script is blocked)
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');

  // Load active services and doctors from server on open
  useEffect(() => {
    if (isOpen) {
      apiClient.getTreatments().then(res => {
        if (res?.treatments && res.treatments.length > 0) {
          setServices(res.treatments);
        }
      }).catch(() => {});

      apiClient.getDoctors().then(res => {
        if (res?.doctors && res.doctors.length > 0) {
          setDoctors(res.doctors);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (preselectedService) {
        setSelectedService(preselectedService);
        setStep(2);
      } else {
        setSelectedService(services[0] || CLINIC_SERVICES[0]);
      }

      if (preselectedDoctor) {
        setSelectedDoctor(preselectedDoctor);
        setStep(3);
      } else {
        setSelectedDoctor(doctors[0] || CLINIC_DOCTORS[0]);
      }
    }
  }, [isOpen, preselectedService, preselectedDoctor, services, doctors]);

  const [slotLoadError, setSlotLoadError] = useState<string | null>(null);

  // Query real-time available slots whenever doctor, date, or service changes
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadSlots(selectedDoctor.id, selectedDate, selectedService?.id);
    }
  }, [selectedDoctor, selectedDate, selectedService]);

  const loadSlots = async (doctorId: string, date: string, serviceId?: string) => {
    setIsLoadingSlots(true);
    setSlotLoadError(null);
    setErrorMessage(null);
    try {
      const data = await apiClient.getAvailableSlots(doctorId, date, serviceId);
      const slots = data?.slots || [];
      setAvailableSlots(slots);
      
      const available = slots.filter((s) => s.isAvailable);
      if (available.length > 0) {
        if (!available.some(s => s.time === selectedSlot)) {
          setSelectedSlot(available[0].time);
        }
      } else {
        setSelectedSlot('');
      }
    } catch (err: any) {
      console.error('Failed to load slots:', err);
      setSlotLoadError(err.message || 'We could not load availability right now. Please try again.');
      setAvailableSlots([]);
      setSelectedSlot('');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Intelligent Next Available Day Finder
  const handleFindNextAvailableDay = async () => {
    if (!selectedDoctor || !selectedDate) return;
    setIsLoadingSlots(true);
    setSlotLoadError(null);

    const [y, m, d] = selectedDate.split('-').map(Number);
    const cursor = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

    for (let i = 1; i <= 14; i++) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      const dayFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        weekday: 'long',
      });
      const dayOfWeek = dayFormatter.format(cursor);

      const schedule = selectedDoctor.schedule?.find(
        (s) => s.dayOfWeek.toLowerCase() === dayOfWeek.toLowerCase()
      );

      if (schedule && schedule.isActive) {
        const year = cursor.getUTCFullYear();
        const month = String(cursor.getUTCMonth() + 1).padStart(2, '0');
        const day = String(cursor.getUTCDate()).padStart(2, '0');
        const nextDateStr = `${year}-${month}-${day}`;

        try {
          const res = await apiClient.getAvailableSlots(selectedDoctor.id, nextDateStr, selectedService?.id);
          const avail = (res?.slots || []).filter((s) => s.isAvailable);
          if (avail.length > 0) {
            setSelectedDate(nextDateStr);
            setAvailableSlots(res.slots);
            setSelectedSlot(avail[0].time);
            setIsLoadingSlots(false);
            return;
          }
        } catch {}
      }
    }

    setIsLoadingSlots(false);
    setSlotLoadError('No open slots found in the next 14 days. Please choose another date or doctor.');
  };

  // Live countdown timer for 10-minute hold window
  useEffect(() => {
    let timer: any;
    if (orderData && orderData.holdExpiresAt && (step === 5 || showFallbackModal)) {
      const expires = new Date(orderData.holdExpiresAt).getTime();
      timer = setInterval(() => {
        const remaining = Math.max(0, Math.floor((expires - Date.now()) / 1000));
        setTimeLeftSeconds(remaining);
        if (remaining <= 0) {
          setIsHoldExpired(true);
          clearInterval(timer);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [orderData, step, showFallbackModal]);

  // Phone input sanitizer (10 digits only)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length <= 10) {
      setPatientPhone10(val);
    }
  };

  // Launch Real Razorpay Checkout Flow
  const handleProceedToPayment = async () => {
    if (isCreatingOrder || isVerifyingPayment) return;

    if (!selectedDoctor || !selectedService || !selectedSlot) {
      setErrorMessage('Please select a doctor, treatment, date, and available time slot.');
      return;
    }

    if (!patientName.trim()) {
      setErrorMessage('Please enter the patient full name.');
      setStep(4);
      return;
    }

    if (patientPhone10.length !== 10 || !/^[6-9]\d{9}$/.test(patientPhone10)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      setStep(4);
      return;
    }

    if (!patientEmail.trim() || !patientEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      setStep(4);
      return;
    }

    setIsCreatingOrder(true);
    setErrorMessage(null);

    try {
      const ensureRazorpayLoaded = (): Promise<boolean> => {
        if (typeof (window as any).Razorpay === 'function') {
          return Promise.resolve(true);
        }
        return new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.onload = () => resolve(typeof (window as any).Razorpay === 'function');
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      // 1. Create Server-Side Order & 10-minute slot hold
      const res = await apiClient.createOrder({
        doctorId: selectedDoctor.id,
        serviceId: selectedService.id,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot,
        patientName: patientName.trim(),
        patientEmail: patientEmail.trim(),
        patientPhone: `+91 ${patientPhone10}`,
        gender: gender || 'Prefer not to say',
        notes: notes.trim(),
      });

      setOrderData(res);
      setIsHoldExpired(false);

      // 2. Check or load official Razorpay SDK script
      const isLoaded = await ensureRazorpayLoaded();
      if (isLoaded && typeof (window as any).Razorpay === 'function') {
        const options = {
          key: res.keyId,
          amount: res.amount, // in paise (12000 = ₹120.00)
          currency: res.currency || 'INR',
          name: 'Aesthetic Dental Clinic',
          description: `${selectedService.name} with ${selectedDoctor.name}`,
          order_id: res.orderId,
          prefill: {
            name: patientName.trim(),
            email: patientEmail.trim(),
            contact: patientPhone10,
          },
          notes: {
            appointment_id: res.appointmentId,
          },
          theme: {
            color: '#173A35',
          },
          modal: {
            ondismiss: async () => {
              setErrorMessage('Payment was not completed. You can try the payment again or choose another time.');
            },
          },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            // 3. Send payment proof to server for cryptographic signature verification
            setIsVerifyingPayment(true);
            setErrorMessage(null);

            try {
              const verifyRes = await apiClient.verifyPayment({
                appointmentId: res.appointmentId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                payment_method: 'razorpay',
              });

              if (verifyRes.success && verifyRes.appointment) {
                setConfirmedAppt(verifyRes.appointment);
                setConfirmedPayment(verifyRes.payment || null);
                setStep(7); // Confirmation
                if (onBookingSuccess) onBookingSuccess(verifyRes.appointment);
              } else {
                setErrorMessage(verifyRes.error || 'Your payment could not be verified. Your appointment has not been confirmed.');
                setStep(8);
              }
            } catch (err: any) {
              setErrorMessage(err.message || 'Payment verification failed. Please try again.');
              setStep(8);
            } finally {
              setIsVerifyingPayment(false);
            }
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (resp: any) => {
          setErrorMessage(resp.error?.description || 'Your payment could not be completed.');
          setStep(8);
        });
        rzp.open();
      } else {
        // Fallback Test Mode dialog when external CDN is inaccessible
        setShowFallbackModal(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'That appointment time is no longer available. Please choose another time.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Fallback Test Payment Completer (when Razorpay CDN is blocked)
  const handleCompleteFallbackTestPayment = async () => {
    if (!orderData || isVerifyingPayment) return;
    setIsVerifyingPayment(true);
    setErrorMessage(null);

    try {
      const testPaymentId = `pay_test_${Date.now().toString(36)}`;
      const simRes = await apiClient.simulateWebhook({
        orderId: orderData.orderId,
        eventType: 'payment.captured',
        sendInvalidSignature: false,
      });

      if (simRes.success) {
        const apptRes = await apiClient.getAppointment(orderData.appointmentId);
        if (apptRes.appointment) {
          setConfirmedAppt(apptRes.appointment);
          setConfirmedPayment(apptRes.payment || null);
          setShowFallbackModal(false);
          setStep(7);
          if (onBookingSuccess) onBookingSuccess(apptRes.appointment);
        }
      } else {
        setErrorMessage('Test payment verification failed.');
        setStep(8);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment verification failed.');
      setStep(8);
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const handleCancelReservation = async () => {
    setShowFallbackModal(false);
    if (orderData) {
      await apiClient.releaseHold(orderData.appointmentId);
    }
    setErrorMessage('Payment was not completed. Your temporary slot hold has been released.');
    setStep(5);
  };

  if (!isOpen) return null;

  // Split slots into morning and afternoon
  const morningSlots = availableSlots.filter(s => {
    const hour = parseInt(s.time24.split(':')[0], 10);
    return hour < 13;
  });

  const afternoonSlots = availableSlots.filter(s => {
    const hour = parseInt(s.time24.split(':')[0], 10);
    return hour >= 13;
  });

  const openSlotsCount = availableSlots.filter(s => s.isAvailable).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#202321]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-reveal-up">
      <div className="relative w-full max-w-2xl bg-[#F7F5F0] border border-[#202321]/15 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-[#202321] my-4 sm:my-8">
        
        {/* Modal Header */}
        <div className="px-6 sm:px-8 py-4 sm:py-5 bg-[#EAE6DE]/50 border-b border-[#202321]/8 flex items-center justify-between">
          <div>
            <span className="font-serif text-lg sm:text-xl font-medium text-[#202321] block">
              Consultation Reservation
            </span>
            <span className="text-[11px] text-[#78958B] font-mono tracking-tight">
              Indiranagar Atelier · ₹100 Doctor Fee + ₹20 Booking Fee
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#EAE6DE] hover:bg-[#202321]/10 flex items-center justify-center transition-colors text-[#202321] cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#173A35]"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-8">
          
          {/* Refined Understated Progress Indicator */}
          {step < 7 && (
            <div className="mb-6 flex items-center justify-between border-b border-[#202321]/8 pb-3.5 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#173A35] tracking-wide uppercase">
                  {step === 1 && '01 · Clinical Treatment'}
                  {step === 2 && '02 · Specialist Faculty'}
                  {step === 3 && '03 · Date & Time Reservation'}
                  {step === 4 && '04 · Patient Information'}
                  {step === 5 && '05 · Review & Payment'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#202321]/40" aria-label={`Step ${step} of 5`}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      s === step ? 'bg-[#173A35]' : s < step ? 'bg-[#78958B]' : 'bg-[#202321]/15'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Error Notice */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 animate-reveal-up" role="alert">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* STEP 1: TREATMENT SELECTION */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-2xl text-[#202321]">Select Clinical Treatment</h3>
                <p className="text-xs text-[#202321]/60 font-light mt-1">Choose a specialized aesthetic procedure or clinical diagnostic consultation.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                {services.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => setSelectedService(service)}
                      className={`p-4 rounded-xl text-left border transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#173A35] ${
                        isSelected
                          ? 'bg-[#173A35] text-[#F7F5F0] border-[#173A35] shadow-xs'
                          : 'bg-[#EAE6DE]/40 text-[#202321] border-[#202321]/8 hover:border-[#173A35]/40'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-[10px] font-mono uppercase tracking-wider ${isSelected ? 'text-[#C7A46A]' : 'text-[#78958B]'}`}>
                          {service.category}
                        </span>
                        <span className={`text-[11px] font-mono ${isSelected ? 'text-[#F7F5F0]/70' : 'text-[#202321]/50'}`}>
                          {service.durationMinutes} min
                        </span>
                      </div>
                      <div className="font-serif text-base font-medium leading-snug">{service.name}</div>
                      <p className={`text-xs mt-1 font-light line-clamp-2 ${isSelected ? 'text-[#F7F5F0]/80' : 'text-[#202321]/70'}`}>
                        {service.shortDescription}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-[#202321]/8 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedService}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#173A35] text-[#F7F5F0] text-xs font-semibold tracking-wider uppercase hover:bg-[#202321] transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <span>Select Specialist</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DOCTOR SELECTION */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-2xl text-[#202321]">Select Specialist Faculty</h3>
                <p className="text-xs text-[#202321]/60 font-light mt-1">Consult with our accredited clinical master ceramists and surgeons.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                {doctors.map((doctor) => {
                  const isSelected = selectedDoctor?.id === doctor.id;
                  return (
                    <button
                      key={doctor.id}
                      type="button"
                      onClick={() => setSelectedDoctor(doctor)}
                      className={`p-4 rounded-xl text-left border transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#173A35] ${
                        isSelected
                          ? 'bg-[#173A35] text-[#F7F5F0] border-[#173A35] shadow-xs'
                          : 'bg-[#EAE6DE]/40 text-[#202321] border-[#202321]/8 hover:border-[#173A35]/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {doctor.avatarUrl ? (
                          <img
                            src={doctor.avatarUrl}
                            alt={doctor.name}
                            className="w-10 h-10 rounded-full object-cover border border-white/20"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-serif text-sm font-semibold border ${
                            isSelected ? 'bg-white/20 text-white border-white/30' : 'bg-[#173A35]/10 text-[#173A35] border-[#173A35]/20'
                          }`}>
                            {doctor.name.replace(/^Dr\.\s*/i, '').charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-serif text-base font-medium leading-snug">{doctor.name}</div>
                          <div className={`text-[11px] font-mono ${isSelected ? 'text-[#C7A46A]' : 'text-[#78958B]'}`}>
                            {doctor.title}
                          </div>
                        </div>
                      </div>
                      <div className={`text-xs font-light line-clamp-2 ${isSelected ? 'text-[#F7F5F0]/80' : 'text-[#202321]/70'}`}>
                        {doctor.qualification} · {doctor.specialtyName}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-[#202321]/8 flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs text-[#202321]/70 hover:text-[#202321] flex items-center gap-1.5 font-medium cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedDoctor}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#173A35] text-[#F7F5F0] text-xs font-semibold tracking-wider uppercase hover:bg-[#202321] transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <span>Select Date & Time</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DATE & TIME SLOT SELECTION */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-2xl text-[#202321]">Select Date & Time Slot</h3>
                <p className="text-xs text-[#202321]/60 font-light mt-1">Live availability calculated in Asia/Kolkata timezone with 10-minute hold protection.</p>
              </div>

              {/* Date Input with Quick Jump Helpers */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#202321]/60 mb-1.5">
                      Consultation Date (Asia/Kolkata)
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        min={minDate}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-[#EAE6DE]/60 border border-[#202321]/15 rounded-lg px-4 py-2.5 text-sm text-[#202321] font-mono focus:outline-hidden focus:ring-1 focus:ring-[#173A35] focus:border-[#173A35]"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#EAE6DE]/40 border border-[#202321]/8 flex flex-col justify-center text-xs">
                    <span className="text-[#202321]/50 uppercase text-[10px] font-mono">Specialist Faculty Schedule</span>
                    <span className="font-medium text-[#202321] mt-0.5">
                      {selectedDoctor?.name} · {selectedDoctor?.consultationDays?.map((d) => d.slice(0, 3)).join(', ') || 'Mon–Fri'}
                    </span>
                  </div>
                </div>

                {/* Quick Date Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
                  <span className="text-[#202321]/40 text-[11px]">Quick Jump:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(minDate)}
                    className={`px-2.5 py-1 rounded-md border text-[11px] transition-colors cursor-pointer ${
                      selectedDate === minDate
                        ? 'bg-[#173A35] text-[#F7F5F0] border-[#173A35]'
                        : 'bg-[#EAE6DE]/50 text-[#202321]/70 border-[#202321]/10 hover:border-[#173A35]'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDate('2026-10-23')}
                    className={`px-2.5 py-1 rounded-md border text-[11px] transition-colors cursor-pointer ${
                      selectedDate === '2026-10-23'
                        ? 'bg-[#173A35] text-[#F7F5F0] border-[#173A35]'
                        : 'bg-[#EAE6DE]/50 text-[#202321]/70 border-[#202321]/10 hover:border-[#173A35]'
                    }`}
                  >
                    Friday 23 Oct
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDate('2026-10-26')}
                    className={`px-2.5 py-1 rounded-md border text-[11px] transition-colors cursor-pointer ${
                      selectedDate === '2026-10-26'
                        ? 'bg-[#173A35] text-[#F7F5F0] border-[#173A35]'
                        : 'bg-[#EAE6DE]/50 text-[#202321]/70 border-[#202321]/10 hover:border-[#173A35]'
                    }`}
                  >
                    Monday 26 Oct
                  </button>
                </div>
              </div>

              {/* Slot Grid Presentation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-[#202321]/60">
                  <span>
                    REAL-TIME AVAILABLE SLOTS
                    {availableSlots.length > 0 && !isLoadingSlots && (
                      <span className="text-[#173A35] font-semibold ml-1.5">
                        ({openSlotsCount} open)
                      </span>
                    )}
                  </span>
                  {isLoadingSlots && (
                    <span className="text-[#173A35] flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin"/> Checking live availability...
                    </span>
                  )}
                </div>

                {isLoadingSlots ? (
                  <div className="p-8 text-center text-xs text-[#202321]/60 bg-[#EAE6DE]/30 rounded-xl border border-[#202321]/8 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#173A35]" />
                    <span>Checking live availability in Asia/Kolkata...</span>
                  </div>
                ) : openSlotsCount === 0 ? (
                  (() => {
                    const emptyState = (() => {
                      if (slotLoadError) {
                        return {
                          title: "We couldn't load availability right now.",
                          desc: slotLoadError,
                          buttonText: 'Try Again',
                          isSearch: false,
                        };
                      }

                      if (!selectedDoctor || !selectedDate) {
                        return {
                          title: 'Select an appointment date',
                          desc: 'Choose a date on the calendar to view doctor availability.',
                          buttonText: null,
                          isSearch: false,
                        };
                      }

                      const [y, m, d] = selectedDate.split('-').map(Number);
                      const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
                      const dayName = new Intl.DateTimeFormat('en-US', {
                        timeZone: 'Asia/Kolkata',
                        weekday: 'long',
                      }).format(dateObj);

                      const schedule = selectedDoctor.schedule?.find(
                        (s) => s.dayOfWeek.toLowerCase() === dayName.toLowerCase()
                      );
                      const isWorking = schedule?.isActive;

                      if (!isWorking) {
                        return {
                          title: 'Clinic closed on this day',
                          desc: `${selectedDoctor.name} does not have clinical hours on ${dayName}s.`,
                          buttonText: 'Check Next Available Day',
                          isSearch: true,
                        };
                      }

                      if (selectedDate === minDate) {
                        return {
                          title: 'No appointments remaining today',
                          desc: 'All consultation windows for today have passed or are booked.',
                          buttonText: 'Check Next Available Day',
                          isSearch: true,
                        };
                      }

                      return {
                        title: 'Fully booked for this date',
                        desc: 'All appointment slots for this date are currently reserved.',
                        buttonText: 'Check Next Available Day',
                        isSearch: true,
                      };
                    })();

                    return (
                      <div className="p-6 text-center text-xs text-[#202321]/70 bg-[#EAE6DE]/30 rounded-xl border border-[#202321]/8 space-y-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-[#202321]">{emptyState.title}</p>
                          <p className="font-light text-[#202321]/60 text-[11px]">{emptyState.desc}</p>
                        </div>
                        {emptyState.buttonText && (
                          <button
                            type="button"
                            onClick={() => {
                              if (emptyState.isSearch) {
                                handleFindNextAvailableDay();
                              } else {
                                loadSlots(selectedDoctor!.id, selectedDate, selectedService?.id);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#173A35] text-[#F7F5F0] text-xs font-medium hover:bg-[#202321] transition-colors cursor-pointer shadow-xs"
                          >
                            <span>{emptyState.buttonText}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
                    
                    {/* Morning Session */}
                    {morningSlots.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#78958B] mb-2 uppercase">
                          <Sun className="w-3 h-3" />
                          <span>Morning Consultations</span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {morningSlots.map((slot) => {
                            const isSelected = selectedSlot === slot.time;
                            return (
                              <button
                                key={slot.time}
                                type="button"
                                disabled={!slot.isAvailable}
                                onClick={() => setSelectedSlot(slot.time)}
                                className={`py-2.5 px-3 rounded-lg text-xs font-mono transition-all border cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#173A35] ${
                                  !slot.isAvailable
                                    ? 'bg-[#EAE6DE]/30 border-[#202321]/6 text-[#202321]/30 cursor-not-allowed line-through'
                                    : isSelected
                                    ? 'bg-[#173A35] text-[#F7F5F0] border-[#173A35] font-semibold shadow-xs'
                                    : 'bg-[#F7F5F0] text-[#202321] border-[#202321]/15 hover:border-[#173A35] hover:bg-[#EAE6DE]/30'
                                }`}
                              >
                                <span>{slot.time}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Lunch Break Notice */}
                    <div className="p-2 rounded-lg bg-[#EAE6DE]/30 border border-[#202321]/6 text-center text-[11px] font-mono text-[#202321]/50">
                      12:30 PM – 02:00 PM · Specialist Break & Enamel Lab Staging
                    </div>

                    {/* Afternoon Session */}
                    {afternoonSlots.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#78958B] mb-2 uppercase">
                          <Moon className="w-3 h-3" />
                          <span>Afternoon & Evening Consultations</span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {afternoonSlots.map((slot) => {
                            const isSelected = selectedSlot === slot.time;
                            return (
                              <button
                                key={slot.time}
                                type="button"
                                disabled={!slot.isAvailable}
                                onClick={() => setSelectedSlot(slot.time)}
                                className={`py-2.5 px-3 rounded-lg text-xs font-mono transition-all border cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#173A35] ${
                                  !slot.isAvailable
                                    ? 'bg-[#EAE6DE]/30 border-[#202321]/6 text-[#202321]/30 cursor-not-allowed line-through'
                                    : isSelected
                                    ? 'bg-[#173A35] text-[#F7F5F0] border-[#173A35] font-semibold shadow-xs'
                                    : 'bg-[#F7F5F0] text-[#202321] border-[#202321]/15 hover:border-[#173A35] hover:bg-[#EAE6DE]/30'
                                }`}
                              >
                                <span>{slot.time}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#202321]/8 flex items-center justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs text-[#202321]/70 hover:text-[#202321] flex items-center gap-1.5 font-medium cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <button
                  onClick={() => setStep(4)}
                  disabled={!selectedSlot}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#173A35] text-[#F7F5F0] text-xs font-semibold tracking-wider uppercase hover:bg-[#202321] transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <span>Patient Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: PATIENT DETAILS */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-2xl text-[#202321]">Patient Contact Details</h3>
                <p className="text-xs text-[#202321]/60 font-light mt-1">Please provide contact information for your official consultation confirmation.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#202321]/60 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-[#EAE6DE]/60 border border-[#202321]/15 rounded-lg px-4 py-2.5 text-sm text-[#202321] focus:outline-hidden focus:ring-1 focus:ring-[#173A35] focus:border-[#173A35]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-[#202321]/60 mb-1.5">Mobile Number *</label>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-3.5 py-2.5 rounded-l-lg bg-[#EAE6DE] border border-r-0 border-[#202321]/15 text-xs font-mono text-[#202321] font-semibold">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={patientPhone10}
                        onChange={handlePhoneChange}
                        placeholder="10-digit number"
                        maxLength={10}
                        className="w-full bg-[#EAE6DE]/60 border border-[#202321]/15 rounded-r-lg px-4 py-2.5 text-sm text-[#202321] focus:outline-hidden focus:ring-1 focus:ring-[#173A35] focus:border-[#173A35] font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-[#202321]/60 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full bg-[#EAE6DE]/60 border border-[#202321]/15 rounded-lg px-4 py-2.5 text-sm text-[#202321] focus:outline-hidden focus:ring-1 focus:ring-[#173A35] focus:border-[#173A35]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#202321]/60 mb-1.5">Gender (Optional)</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-[#EAE6DE]/60 border border-[#202321]/15 rounded-lg px-4 py-2.5 text-sm text-[#202321] focus:outline-hidden focus:ring-1 focus:ring-[#173A35] focus:border-[#173A35]"
                  >
                    <option value="">Select (Optional)</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#202321]/60 mb-1.5">Consultation Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Briefly describe your aesthetic goals or symptoms"
                    className="w-full bg-[#EAE6DE]/60 border border-[#202321]/15 rounded-lg px-4 py-2 text-sm text-[#202321] focus:outline-hidden focus:ring-1 focus:ring-[#173A35] focus:border-[#173A35]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#202321]/8 flex items-center justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2 text-xs text-[#202321]/70 hover:text-[#202321] flex items-center gap-1.5 font-medium cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <button
                  onClick={() => setStep(5)}
                  disabled={!patientName.trim() || patientPhone10.length !== 10 || !patientEmail.trim()}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#173A35] text-[#F7F5F0] text-xs font-semibold tracking-wider uppercase hover:bg-[#202321] transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <span>Review & Pay (₹120)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & TRANSPARENT PRICING */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-2xl text-[#202321]">Review Appointment & Fee</h3>
                <p className="text-xs text-[#202321]/60 font-light mt-1">Review your summary and transparent fee breakdown before final checkout.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-[#EAE6DE]/60 border border-[#202321]/8 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#78958B] font-semibold">APPOINTMENT SUMMARY</span>
                  <div className="font-serif text-base text-[#202321] font-medium">{selectedService?.name}</div>
                  <div className="text-[#202321]/70">{selectedDoctor?.name}</div>
                  <div className="font-mono text-[#173A35] pt-1">{selectedDate} at {selectedSlot}</div>
                </div>

                <div className="p-4 rounded-xl bg-[#EAE6DE]/60 border border-[#202321]/8 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#78958B] font-semibold">PATIENT CONTACT</span>
                  <div className="font-serif text-base text-[#202321] font-medium">{patientName}</div>
                  <div className="text-[#202321]/70 font-mono">+91 {patientPhone10}</div>
                  <div className="text-[#202321]/60 truncate">{patientEmail}</div>
                </div>
              </div>

              {/* Authoritative Fee Breakdown */}
              <div className="p-6 rounded-2xl bg-[#202321] text-[#F7F5F0] space-y-3">
                <div className="flex justify-between pb-2 border-b border-[#F7F5F0]/10 text-xs font-mono text-[#F7F5F0]/60 uppercase">
                  <span>Fee Breakdown</span>
                  <span>Amount</span>
                </div>

                <div className="flex justify-between text-xs text-[#F7F5F0]/80">
                  <span>Doctor Consultation Fee</span>
                  <span className="font-mono font-medium">₹100</span>
                </div>

                <div className="flex justify-between text-xs text-[#F7F5F0]/80">
                  <span>Convenience Fee (10-Minute Reserved Hold)</span>
                  <span className="font-mono font-medium">₹20</span>
                </div>

                <div className="pt-3 border-t border-[#F7F5F0]/15 flex items-baseline justify-between">
                  <div>
                    <span className="text-base font-serif font-medium text-[#F7F5F0]">Total Amount</span>
                    <span className="block text-[10px] font-mono text-[#78958B]">Includes 10-minute temporary slot hold</span>
                  </div>
                  <span className="text-2xl font-mono font-bold text-[#C7A46A]">₹120</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[#202321]/8">
                <button
                  onClick={() => setStep(4)}
                  className="px-4 py-2 text-xs text-[#202321]/70 hover:text-[#202321] flex items-center gap-1.5 font-medium cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <button
                  onClick={handleProceedToPayment}
                  disabled={isCreatingOrder || isVerifyingPayment}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-[#173A35] hover:bg-[#202321] text-[#F7F5F0] text-xs font-semibold tracking-wider uppercase shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isCreatingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Order...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-[#C7A46A]" />
                      <span>Pay ₹120 (Razorpay Test Mode)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: APPOINTMENT CONFIRMED SCREEN */}
          {step === 7 && confirmedAppt && (
            <div className="space-y-6 text-center py-4 animate-reveal-up">
              <div className="w-14 h-14 rounded-full bg-[#173A35]/10 border border-[#173A35]/30 text-[#173A35] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs uppercase font-mono tracking-widest text-[#78958B]">
                  APPOINTMENT BOOKING CONFIRMED
                </span>
                <h3 className="font-serif text-3xl text-[#202321] font-normal mt-1">
                  Appointment Confirmed
                </h3>
                <p className="text-xs text-[#202321]/60 font-light mt-1">
                  Your consultation slot is locked and verified with the clinic faculty.
                </p>
              </div>

              {/* Consultation Summary Card */}
              <div className="p-6 rounded-2xl bg-[#EAE6DE]/70 border border-[#202321]/8 text-left space-y-4 max-w-md mx-auto text-xs">
                <div className="flex justify-between items-baseline pb-3 border-b border-[#202321]/8">
                  <div>
                    <span className="text-[10px] font-mono text-[#202321]/50 uppercase">APPOINTMENT REF</span>
                    <div className="font-mono font-bold text-sm text-[#173A35]">{confirmedAppt.id}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-[#202321]/50 uppercase">PAYMENT STATUS</span>
                    <div className="font-mono font-bold text-emerald-800">PAID ₹{confirmedAppt.totalAmount || 120}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 pb-2 border-b border-[#202321]/6">
                    <span className="text-[#202321]/50 text-[11px] block">Patient Name:</span>
                    <div className="font-medium text-[#202321] text-sm">{confirmedAppt.patientName}</div>
                  </div>
                  <div>
                    <span className="text-[#202321]/50">Doctor:</span>
                    <div className="font-medium text-[#202321]">{confirmedAppt.doctorName}</div>
                  </div>
                  <div>
                    <span className="text-[#202321]/50">Treatment:</span>
                    <div className="font-medium text-[#202321]">{confirmedAppt.serviceName}</div>
                  </div>
                  <div>
                    <span className="text-[#202321]/50">Date:</span>
                    <div className="font-mono text-[#202321]">{confirmedAppt.appointmentDate}</div>
                  </div>
                  <div>
                    <span className="text-[#202321]/50">Time:</span>
                    <div className="font-mono text-[#202321]">{confirmedAppt.timeSlot}</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#F7F5F0] border border-[#202321]/8 font-mono space-y-1">
                  <div className="flex justify-between text-[#202321]/60">
                    <span>Doctor Fee: ₹{confirmedAppt.appointmentFee}</span>
                    <span>Booking Fee: ₹{confirmedAppt.convenienceFee}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#173A35] pt-1 border-t border-[#202321]/6">
                    <span>Total Amount Paid:</span>
                    <span>₹{confirmedAppt.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* WhatsApp Notification Action */}
              <div className="max-w-md mx-auto pt-1 space-y-3">
                <a
                  href={getAppointmentWhatsAppLink(confirmedAppt)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-[#F7F5F0] text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                  <span>Notify us on WhatsApp</span>
                </a>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="px-5 py-2.5 rounded-lg border border-[#202321]/15 hover:border-[#173A35] text-xs font-medium text-[#202321] flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#78958B]" />
                    <span>Print Pass</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-lg bg-[#173A35] hover:bg-[#202321] text-[#F7F5F0] text-xs font-medium tracking-wide cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: PAYMENT FAILURE SCREEN */}
          {step === 8 && (
            <div className="space-y-6 text-center py-6">
              <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-serif text-3xl text-[#202321] font-normal">
                  Payment Not Completed
                </h3>
                <p className="text-xs text-[#202321]/70 max-w-sm mx-auto mt-2 font-light">
                  Your appointment has not been confirmed. You can try the payment again or choose another convenient time slot.
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => setStep(5)}
                  className="px-6 py-3 rounded-lg bg-[#173A35] text-[#F7F5F0] text-xs font-medium tracking-wide hover:bg-[#202321] flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>

                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 rounded-lg border border-[#202321]/15 hover:border-[#173A35] text-xs font-medium text-[#202321] cursor-pointer"
                >
                  <span>Choose Another Time</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* FALLBACK TEST MODE MODAL (When external Razorpay script is blocked or offline) */}
      {showFallbackModal && orderData && (
        <div className="fixed inset-0 z-50 bg-[#202321]/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#F7F5F0] border border-[#202321]/15 rounded-2xl shadow-2xl overflow-hidden animate-reveal-up text-[#202321]">
            
            <div className="bg-[#173A35] p-5 text-[#F7F5F0] flex items-center justify-between">
              <div>
                <div className="font-serif text-lg font-medium tracking-tight">Razorpay Test Checkout</div>
                <div className="text-[11px] text-[#F7F5F0]/70 font-mono mt-0.5">Aesthetic Dental Clinic</div>
              </div>

              <div className="text-right font-mono">
                <span className="text-[10px] text-[#F7F5F0]/70 block">TOTAL PAYABLE</span>
                <span className="text-xl font-bold text-[#C7A46A]">₹120.00</span>
              </div>
            </div>

            <div className="bg-[#EAE6DE] px-5 py-2.5 border-b border-[#202321]/8 flex items-center justify-between text-xs font-mono text-[#202321]/70">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#78958B]" />
                Slot Hold Window:
              </span>
              <span className={`font-bold ${timeLeftSeconds < 120 ? 'text-rose-600' : 'text-[#173A35]'}`}>
                {Math.floor(timeLeftSeconds / 60).toString().padStart(2, '0')}:{(timeLeftSeconds % 60).toString().padStart(2, '0')}
              </span>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[#202321]/60 font-mono text-[10px] uppercase mb-2">
                  Test Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['upi', 'card', 'netbanking'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSelectedMethod(method)}
                      className={`py-2 px-3 rounded-lg font-mono text-xs uppercase border transition-all cursor-pointer ${
                        selectedMethod === method
                          ? 'bg-[#173A35] text-[#F7F5F0] border-[#173A35] font-semibold'
                          : 'bg-[#EAE6DE]/50 text-[#202321] border-[#202321]/10'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#EAE6DE]/60 border border-[#202321]/8 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-[#173A35] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Razorpay Test Sandbox</span>
                </div>
                <p className="text-[11px] text-[#202321]/70">
                  This transaction is processed in Test Mode. No real card will be charged.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={handleCompleteFallbackTestPayment}
                  disabled={isVerifyingPayment || isHoldExpired}
                  className="w-full py-3.5 px-4 rounded-lg bg-[#173A35] hover:bg-[#202321] text-[#F7F5F0] text-xs font-semibold tracking-wider uppercase transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isVerifyingPayment ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying Payment...
                    </span>
                  ) : (
                    <span>Confirm Test Payment (₹120)</span>
                  )}
                </button>

                <button
                  onClick={handleCancelReservation}
                  className="w-full py-2 text-center text-xs text-[#202321]/60 hover:text-[#202321] cursor-pointer"
                >
                  Cancel and Release Slot Hold
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
