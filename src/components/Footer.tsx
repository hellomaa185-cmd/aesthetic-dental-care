import React from 'react';
import { MapPin, Phone, Mail, Clock, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onOpenStaffPortal?: () => void;
  onOpenAdminPortal?: () => void;
  onOpenQAMatrix?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenStaffPortal,
  onOpenAdminPortal,
  onOpenQAMatrix,
}) => {
  return (
    <footer className="bg-[#202321] text-[#F7F5F0] text-xs py-16 border-t border-[#F7F5F0]/10">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#F7F5F0]/10">
          
          {/* Brand & Wordmark */}
          <div className="space-y-4">
            <span className="font-serif text-2xl font-normal text-[#F7F5F0] block">
              Aesthetic Dental
            </span>
            <p className="text-xs text-[#F7F5F0]/70 leading-relaxed font-light">
              A bespoke cosmetic and restorative dental studio. Dedicated to microscopic enamel preservation, 3D smile design, and clinical excellence.
            </p>
            <div className="text-[11px] font-mono text-[#78958B]">
              Accredited Clinical Faculty · Bengaluru
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#F7F5F0]/50">CLINIC ATELIER</div>
            <div className="text-xs text-[#F7F5F0]/80 space-y-1 font-light leading-relaxed">
              <div>MediSquare Towers, Level 4</div>
              <div>100 Feet Road, Indiranagar</div>
              <div>Bengaluru, Karnataka 560038</div>
            </div>
          </div>

          {/* Consultation Hours */}
          <div className="space-y-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#F7F5F0]/50">HOURS & CONSULTATIONS</div>
            <div className="text-xs text-[#F7F5F0]/80 space-y-1 font-light leading-relaxed">
              <div>Monday – Saturday: 09:00 – 20:00</div>
              <div>Sunday: 10:00 – 14:00</div>
              <div className="text-[#C7A46A] pt-1 font-mono text-[11px]">
                Consultation: ₹100 Doctor Fee + ₹20 Booking Fee
              </div>
            </div>
          </div>

          {/* Contact & Portals */}
          <div className="space-y-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#F7F5F0]/50">DIRECT ENQUIRIES</div>
            <div className="text-xs text-[#F7F5F0]/80 space-y-1 font-mono">
              <div>+91 80 4912 8800</div>
              <div>concierge@aestheticdental.com</div>
              <div className="pt-3 flex flex-col gap-1.5 text-[11px]">
                {onOpenStaffPortal && (
                  <button
                    onClick={onOpenStaffPortal}
                    className="text-left text-[#78958B] hover:text-[#F7F5F0] transition-colors"
                  >
                    Staff Reception Desk →
                  </button>
                )}
                {onOpenAdminPortal && (
                  <button
                    onClick={onOpenAdminPortal}
                    className="text-left text-[#78958B] hover:text-[#F7F5F0] transition-colors"
                  >
                    Clinical Administration →
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#F7F5F0]/50 text-[11px] font-mono">
          <div>
            © {new Date().getFullYear()} Aesthetic Dental Clinic. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Secure Consultations</span>
            <span>·</span>
            <span>Transparent Pricing</span>
            {onOpenQAMatrix && (
              <>
                <span>·</span>
                <button
                  onClick={onOpenQAMatrix}
                  className="text-[#78958B] hover:text-[#F7F5F0] transition-colors underline"
                >
                  Diagnostics Matrix
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
