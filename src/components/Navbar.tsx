import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { AuthUser } from '../types';

interface NavbarProps {
  currentView: 'patient' | 'staff' | 'admin' | 'oral-guide';
  setCurrentView: (view: 'patient' | 'staff' | 'admin' | 'oral-guide') => void;
  onOpenBooking: () => void;
  currentUser: AuthUser | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenBooking,
  currentUser,
  onLogout,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#F7F5F0]/95 backdrop-blur-md py-3.5 border-b border-[#202321]/8 shadow-xs'
          : 'bg-[#F7F5F0] py-5 border-b border-[#202321]/6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between">
          
          {/* Zone 1: Single Text Element Brand Wordmark */}
          <button
            onClick={() => {
              setCurrentView('patient');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group text-left cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#173A35]"
            aria-label="Aesthetic Dental Clinic Home"
          >
            <span className="font-serif text-xl sm:text-2xl tracking-tight text-[#202321] font-medium block transition-colors group-hover:text-[#173A35]">
              Aesthetic Dental
            </span>
          </button>

          {/* Zone 2: 4–6 Clean Text Navigation Links with Subtle Underlines */}
          <nav className="hidden lg:flex items-center gap-8 text-xs tracking-wider uppercase font-medium text-[#202321]/75">
            <button
              onClick={() => {
                setCurrentView('patient');
                const el = document.getElementById('treatments');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`hover:text-[#173A35] transition-colors py-1 cursor-pointer relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-[#173A35] hover:after:w-full after:transition-all ${
                currentView === 'patient' ? 'text-[#202321] font-semibold' : ''
              }`}
            >
              Treatments
            </button>

            <button
              onClick={() => {
                setCurrentView('patient');
                const el = document.getElementById('philosophy');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-[#173A35] transition-colors py-1 cursor-pointer relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-[#173A35] hover:after:w-full after:transition-all"
            >
              Philosophy
            </button>

            <button
              onClick={() => {
                setCurrentView('patient');
                const el = document.getElementById('doctors');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-[#173A35] transition-colors py-1 cursor-pointer relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-[#173A35] hover:after:w-full after:transition-all"
            >
              Specialists
            </button>

            <button
              onClick={() => {
                setCurrentView('patient');
                const el = document.getElementById('reviews');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-[#173A35] transition-colors py-1 cursor-pointer relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-[#173A35] hover:after:w-full after:transition-all"
            >
              Reviews
            </button>

            <button
              onClick={() => setCurrentView('oral-guide')}
              className={`hover:text-[#173A35] transition-colors py-1 cursor-pointer relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px after:bg-[#173A35] hover:after:w-full after:transition-all ${
                currentView === 'oral-guide' ? 'text-[#173A35] font-semibold' : ''
              }`}
            >
              Clinical Search
            </button>
          </nav>

          {/* Zone 3: 1–2 Primary Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Authenticated Staff / Admin Desk */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView(currentUser.role === 'admin' ? 'admin' : 'staff')}
                  className="px-3.5 py-1.5 rounded-lg bg-[#EAE6DE] text-[#202321] text-xs font-mono font-medium hover:bg-[#173A35] hover:text-[#F7F5F0] transition-colors cursor-pointer"
                >
                  {currentUser.role === 'admin' ? 'Admin Desk' : 'Staff Desk'}
                </button>
                <button
                  onClick={onLogout}
                  className="text-xs text-[#202321]/50 hover:text-[#202321] underline cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : null}

            {/* Primary Consultation Reservation CTA */}
            <button
              onClick={onOpenBooking}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#173A35] text-[#F7F5F0] text-xs font-medium tracking-wider uppercase hover:bg-[#202321] transition-colors shadow-xs active:scale-98 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#173A35]"
            >
              <span>Consultation (₹120)</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#C7A46A]" />
            </button>

            {/* Mobile Hamburger Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-[#202321] hover:text-[#173A35] transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#173A35]"
              aria-label={isMobileMenuOpen ? "Close Navigation Menu" : "Open Navigation Menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#F7F5F0] border-b border-[#202321]/10 px-6 py-6 animate-reveal-up">
          <nav className="flex flex-col gap-4 text-sm font-medium text-[#202321]/80">
            <button
              onClick={() => {
                setCurrentView('patient');
                setIsMobileMenuOpen(false);
                const el = document.getElementById('treatments');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-left py-2 hover:text-[#173A35] transition-colors cursor-pointer"
            >
              Treatments
            </button>

            <button
              onClick={() => {
                setCurrentView('patient');
                setIsMobileMenuOpen(false);
                const el = document.getElementById('philosophy');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-left py-2 hover:text-[#173A35] transition-colors cursor-pointer"
            >
              Philosophy
            </button>

            <button
              onClick={() => {
                setCurrentView('patient');
                setIsMobileMenuOpen(false);
                const el = document.getElementById('doctors');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-left py-2 hover:text-[#173A35] transition-colors cursor-pointer"
            >
              Specialists
            </button>

            <button
              onClick={() => {
                setCurrentView('patient');
                setIsMobileMenuOpen(false);
                const el = document.getElementById('reviews');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-left py-2 hover:text-[#173A35] transition-colors cursor-pointer"
            >
              Patient Reviews
            </button>

            <button
              onClick={() => {
                setCurrentView('oral-guide');
                setIsMobileMenuOpen(false);
              }}
              className="text-left py-2 text-[#173A35] font-semibold transition-colors cursor-pointer"
            >
              Clinical Search Guide
            </button>

            <div className="pt-4 border-t border-[#202321]/10 flex flex-col gap-3">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenBooking();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#173A35] text-[#F7F5F0] text-xs font-medium tracking-wider uppercase cursor-pointer"
              >
                <span>Reserve Consultation (₹120)</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#C7A46A]" />
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
