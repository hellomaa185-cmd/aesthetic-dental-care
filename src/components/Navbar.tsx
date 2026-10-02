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
      setIsScrolled(window.scrollY > 20);
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
          
          {/* Brand Wordmark */}
          <button
            onClick={() => {
              setCurrentView('patient');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group text-left cursor-pointer"
          >
            <span className="font-serif text-xl sm:text-2xl tracking-tight text-[#202321] font-semibold block transition-colors group-hover:text-[#173A35]">
              Aesthetic Dental
            </span>
          </button>

          {/* Clean Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs tracking-wider uppercase font-medium text-[#202321]/75">
            <button
              onClick={() => {
                setCurrentView('patient');
                const el = document.getElementById('treatments');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`hover:text-[#173A35] transition-colors py-1 cursor-pointer ${
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
              className="hover:text-[#173A35] transition-colors py-1 cursor-pointer"
            >
              Philosophy
            </button>

            <button
              onClick={() => {
                setCurrentView('patient');
                const el = document.getElementById('doctors');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-[#173A35] transition-colors py-1 cursor-pointer"
            >
              Specialists
            </button>

            <button
              onClick={() => {
                setCurrentView('patient');
                const el = document.getElementById('reviews');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-[#173A35] transition-colors py-1 cursor-pointer"
            >
              Reviews
            </button>

            <button
              onClick={() => setCurrentView('oral-guide')}
              className={`hover:text-[#173A35] transition-colors py-1 cursor-pointer ${
                currentView === 'oral-guide' ? 'text-[#173A35] font-semibold' : ''
              }`}
            >
              Clinical Search
            </button>
          </nav>

          {/* Actions: Portal Login + Booking CTA */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Staff / Admin Portal Link */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView(currentUser.role === 'admin' ? 'admin' : 'staff')}
                  className="px-3.5 py-1.5 rounded-full bg-[#EAE6DE] text-[#202321] text-xs font-mono font-medium hover:bg-[#173A35] hover:text-[#F7F5F0] transition-colors cursor-pointer"
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

            {/* Primary Booking CTA */}
            <button
              onClick={onOpenBooking}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#173A35] text-[#F7F5F0] text-xs font-semibold tracking-wider uppercase hover:bg-[#202321] transition-colors shadow-xs active:scale-98 cursor-pointer"
            >
              <span>Consultation (₹120)</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#C7A46A]" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-[#202321] hover:text-[#173A35] transition-colors cursor-pointer"
              aria-label="Toggle navigation"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden pt-4 pb-6 mt-3 border-t border-[#202321]/8 space-y-3 animate-reveal-up">
            <div className="grid grid-cols-2 gap-2 text-xs uppercase tracking-wider font-medium text-[#202321]">
              <button
                onClick={() => {
                  setCurrentView('patient');
                  setIsMobileMenuOpen(false);
                  const el = document.getElementById('treatments');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="p-3 rounded-xl bg-[#EAE6DE]/60 text-left cursor-pointer"
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
                className="p-3 rounded-xl bg-[#EAE6DE]/60 text-left cursor-pointer"
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
                className="p-3 rounded-xl bg-[#EAE6DE]/60 text-left cursor-pointer"
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
                className="p-3 rounded-xl bg-[#EAE6DE]/60 text-left cursor-pointer"
              >
                Reviews
              </button>
              <button
                onClick={() => {
                  setCurrentView('oral-guide');
                  setIsMobileMenuOpen(false);
                }}
                className="col-span-2 p-3 rounded-xl bg-[#EAE6DE]/60 text-left cursor-pointer"
              >
                Clinical Search Guide
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenBooking();
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#173A35] text-[#F7F5F0] text-xs font-semibold tracking-wider uppercase shadow-xs cursor-pointer"
              >
                <span>Book Consultation (₹120)</span>
                <ArrowUpRight className="w-4 h-4 text-[#C7A46A]" />
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
