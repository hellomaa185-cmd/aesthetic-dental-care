import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { PhilosophySection } from './components/PhilosophySection';
import { InteractiveTreatments } from './components/InteractiveTreatments';
import { ClinicalPrecisionDarkMoment } from './components/ClinicalPrecisionDarkMoment';
import { DoctorsSection } from './components/DoctorsSection';
import { ReviewsSection } from './components/ReviewsSection';
import { PricingTransparencySection } from './components/PricingTransparencySection';
import { DentalCareSearchGrounding } from './components/DentalCareSearchGrounding';
import { AestheticAssistantChatbot } from './components/AestheticAssistantChatbot';
import { WhatsAppFloatingButton } from './components/WhatsAppFloatingButton';
import { BookingWizard } from './components/BookingWizard';
import { AdminPortal } from './components/AdminPortal';
import { StaffPortal } from './components/StaffPortal';
import { QATestingMatrixModal } from './components/QATestingMatrixModal';
import { Footer } from './components/Footer';
import { Service, Doctor, Appointment, AuthUser } from './types';
import { ArrowUpRight, MapPin, Clock } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'patient' | 'staff' | 'admin' | 'oral-guide'>('patient');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isQAMatrixOpen, setIsQAMatrixOpen] = useState(false);
  const [preselectedService, setPreselectedService] = useState<Service | null>(null);
  const [preselectedDoctor, setPreselectedDoctor] = useState<Doctor | null>(null);
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const handleOpenBooking = (service?: Service, doctor?: Doctor) => {
    setPreselectedService(service || null);
    setPreselectedDoctor(doctor || null);
    setIsBookingOpen(true);
  };

  const handleBookingSuccess = (appointment: Appointment) => {
    console.log('Confirmed reservation:', appointment);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('patient');
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#202321] flex flex-col font-sans selection:bg-[#173A35] selection:text-[#F7F5F0] relative overflow-x-hidden">
      
      {/* Top Refined Atelier Announcement Bar */}
      <div className="bg-[#EAE6DE] border-b border-[#202321]/8 px-6 py-2 text-center text-xs font-mono text-[#202321]/70 flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-[#78958B]" />
          <span>Indiranagar Atelier, Bengaluru</span>
        </span>
        <span className="hidden sm:inline text-[#202321]/30">·</span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-[#78958B]" />
          <span>Mon–Sat 09:00–20:00</span>
        </span>
        <span className="hidden sm:inline text-[#202321]/30">·</span>
        <span className="text-[#173A35] font-semibold">
          Consultation: ₹100 Doctor Fee + ₹20 Booking Fee
        </span>
      </div>

      {/* Main Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenBooking={() => handleOpenBooking()}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* VIEW ROUTING */}
      <main className="flex-1">
        {currentView === 'patient' && (
          <div>
            {/* 01. Hero */}
            <HeroSection
              onOpenBooking={() => handleOpenBooking()}
              onExploreTreatments={() => {
                const el = document.getElementById('treatments');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* 02. Philosophy (Whitespace & Typography) */}
            <PhilosophySection />

            {/* 03. Interactive Treatments Architecture */}
            <InteractiveTreatments
              onSelectService={(service) => handleOpenBooking(service)}
            />

            {/* 04. Controlled Dark Section (Clinical Precision) */}
            <ClinicalPrecisionDarkMoment />

            {/* 05. Doctors & Specialists Faculty */}
            <DoctorsSection
              onSelectDoctor={(doctor) => handleOpenBooking(undefined, doctor)}
            />

            {/* 06. Real Patient Reviews System */}
            <ReviewsSection />

            {/* 07. Transparent Pricing & Governance */}
            <PricingTransparencySection
              onOpenBooking={() => handleOpenBooking()}
            />

            {/* 08. Bottom Editorial Call to Action */}
            <section className="py-20 lg:py-28 bg-[#F7F5F0] text-center border-b border-[#202321]/8">
              <div className="max-w-3xl mx-auto px-6 sm:px-8">
                <div className="text-xs font-mono tracking-widest text-[#78958B] mb-3">
                  RESERVATION ATELIER
                </div>
                <h3 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#202321] font-normal leading-tight text-balance">
                  Begin your consultation.
                </h3>
                <p className="text-sm sm:text-base text-[#202321]/70 font-light mt-4 max-w-xl mx-auto leading-relaxed">
                  Reserve a dedicated consultation slot with our master ceramists and surgeons. Protected with 10-minute temporary holds.
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={() => handleOpenBooking()}
                    className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-lg bg-[#173A35] text-[#F7F5F0] text-xs font-semibold tracking-wider uppercase hover:bg-[#202321] transition-colors shadow-xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#173A35]"
                  >
                    <span>Reserve Consultation</span>
                    <ArrowUpRight className="w-4 h-4 text-[#C7A46A]" />
                  </button>

                  <button
                    onClick={() => setCurrentView('oral-guide')}
                    className="px-6 py-3.5 rounded-lg border border-[#202321]/15 text-[#202321] text-xs font-medium tracking-wider uppercase hover:border-[#173A35] hover:text-[#173A35] transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#173A35]"
                  >
                    Clinical Search Guide
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* CLINICAL SEARCH GROUNDING VIEW */}
        {currentView === 'oral-guide' && (
          <DentalCareSearchGrounding />
        )}

        {/* STAFF RECEPTION QUEUE */}
        {currentView === 'staff' && (
          <StaffPortal
            currentUser={currentUser}
            onLoginSuccess={(user) => setCurrentUser(user)}
          />
        )}

        {/* ADMIN CONTROL DESK */}
        {currentView === 'admin' && (
          <AdminPortal
            currentUser={currentUser}
            onLoginSuccess={(user) => setCurrentUser(user)}
            onOpenQAMatrix={() => setIsQAMatrixOpen(true)}
          />
        )}
      </main>

      {/* FLOATING GEMINI CLINICAL ASSISTANT CHATBOT */}
      <AestheticAssistantChatbot
        onOpenBooking={(service, doctor) => handleOpenBooking(service, doctor)}
      />

      {/* PERSISTENT CLINICAL WHATSAPP CONCIERGE BUTTON */}
      <WhatsAppFloatingButton />

      {/* Footer */}
      <Footer
        onOpenStaffPortal={() => setCurrentView('staff')}
        onOpenAdminPortal={() => setCurrentView('admin')}
        onOpenQAMatrix={() => setIsQAMatrixOpen(true)}
      />

      {/* Booking Wizard Modal */}
      <BookingWizard
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        preselectedService={preselectedService}
        preselectedDoctor={preselectedDoctor}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* QA Testing Matrix Modal */}
      <QATestingMatrixModal
        isOpen={isQAMatrixOpen}
        onClose={() => setIsQAMatrixOpen(false)}
      />

    </div>
  );
}
