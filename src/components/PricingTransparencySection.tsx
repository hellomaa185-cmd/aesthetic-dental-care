import React from 'react';
import { ShieldCheck, ArrowUpRight } from 'lucide-react';

interface PricingTransparencySectionProps {
  onOpenBooking: () => void;
}

export const PricingTransparencySection: React.FC<PricingTransparencySectionProps> = ({ onOpenBooking }) => {
  return (
    <section className="py-20 lg:py-28 bg-[#EAE6DE]/40 border-b border-[#202321]/8">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          {/* Left Text */}
          <div className="lg:col-span-6 space-y-5">
            <div className="flex items-center gap-2 text-xs tracking-widest font-mono text-[#78958B]">
              <span>06</span>
              <span className="w-8 h-px bg-[#78958B]/30" />
              <span>Transparent Pricing</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#202321] font-normal leading-[1.12] tracking-tight text-balance">
              A clear, upfront consultation fee.
            </h2>

            <p className="text-[#202321]/75 text-base sm:text-lg leading-relaxed font-light">
              We believe in complete financial transparency. Every consultation includes a thorough clinical examination, 3D optical imaging review, and bespoke aesthetic treatment planning with zero hidden costs.
            </p>

            <div className="space-y-3 pt-2 text-xs sm:text-sm text-[#202321]/80 font-light">
              <div className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#173A35] mt-2 shrink-0" />
                <span>
                  <strong className="font-semibold text-[#202321]">₹100 Specialist Consultation:</strong> Dedicated 1-on-1 diagnostic consultation with our lead prosthodontists and cosmetic ceramists.
                </span>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#173A35] mt-2 shrink-0" />
                <span>
                  <strong className="font-semibold text-[#202321]">₹20 Slot Reservation:</strong> Covers temporary 10-minute slot holding and digital chart setup.
                </span>
              </div>
            </div>
          </div>

          {/* Right Pricing Card */}
          <div className="lg:col-span-6">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#F7F5F0] border border-[#202321]/10 shadow-xs space-y-6">
              
              <div className="flex justify-between items-baseline pb-4 border-b border-[#202321]/8 font-mono text-xs text-[#202321]/60">
                <span>CONSULTATION FEE BREAKDOWN</span>
                <span className="text-[#173A35] font-semibold">ALL INCLUSIVE</span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-[#202321]/80">
                  <span>Specialist Consultation Fee</span>
                  <span className="font-mono font-medium">₹100</span>
                </div>

                <div className="flex justify-between text-[#202321]/80">
                  <span>Convenience & 10-Minute Reserved Hold</span>
                  <span className="font-mono font-medium">₹20</span>
                </div>

                <div className="pt-4 border-t border-[#202321]/10 flex justify-between items-baseline">
                  <div>
                    <span className="font-serif text-xl sm:text-2xl text-[#202321] font-medium">Total Payable Amount</span>
                    <span className="block text-[11px] font-mono text-[#78958B]">Required to confirm your appointment</span>
                  </div>
                  <span className="font-mono text-3xl font-bold text-[#173A35]">₹120</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#EAE6DE]/50 border border-[#202321]/8 flex items-start gap-3 text-xs text-[#202321]/70">
                <ShieldCheck className="w-4 h-4 text-[#173A35] shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Protected by 10-minute temporary reservation. Slots are freed automatically if booking is cancelled.
                </span>
              </div>

              <button
                onClick={onOpenBooking}
                className="w-full py-3.5 px-6 rounded-lg bg-[#173A35] hover:bg-[#202321] text-[#F7F5F0] text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#173A35]"
              >
                <span>Reserve Consultation (₹120)</span>
                <ArrowUpRight className="w-4 h-4 text-[#C7A46A]" />
              </button>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
