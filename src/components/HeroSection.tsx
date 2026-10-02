import React from 'react';
import { ArrowUpRight, ArrowDown } from 'lucide-react';

interface HeroSectionProps {
  onOpenBooking: () => void;
  onExploreTreatments: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenBooking,
  onExploreTreatments,
}) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 bg-[#F7F5F0]">
      {/* Background subtle coordinate grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(#202321 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* LEFT: EDITORIAL COPY */}
          <div className="lg:col-span-7 space-y-8">
            
            <div className="flex items-center gap-3 text-xs uppercase tracking-widest font-mono text-[#78958B]">
              <span>01</span>
              <span className="w-8 h-px bg-[#78958B]/40" />
              <span>Aesthetic Dental Atelier</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#202321] font-normal leading-[1.08] tracking-tight max-w-2xl">
              A more considered <br />
              <span className="italic font-normal text-[#173A35]">approach</span> to your smile.
            </h1>

            <p className="text-[#202321]/75 text-base sm:text-lg leading-relaxed max-w-xl font-light">
              Dentistry with a quieter kind of confidence. We pair microscopic enamel preservation with 3D optical shade mapping and dedicated specialist consultations.
            </p>

            {/* Price & Appointment Guarantee Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-6 sm:gap-8 border-t border-[#202321]/8 text-xs text-[#202321]/80">
              <div>
                <span className="text-[11px] text-[#202321]/50 uppercase tracking-wider block font-medium">Consultation Fee</span>
                <span className="font-mono font-semibold text-sm text-[#173A35]">₹100 + ₹20 Booking Fee</span>
              </div>
              <div className="w-px h-8 bg-[#202321]/10 hidden sm:block" />
              <div>
                <span className="text-[11px] text-[#202321]/50 uppercase tracking-wider block font-medium">Appointment Window</span>
                <span className="text-[#202321]">10-Minute Reserved Slot Hold</span>
              </div>
              <div className="w-px h-8 bg-[#202321]/10 hidden sm:block" />
              <div>
                <span className="text-[11px] text-[#202321]/50 uppercase tracking-wider block font-medium">Location</span>
                <span className="text-[#202321]">Indiranagar, Bengaluru</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onOpenBooking}
                className="group relative inline-flex items-center gap-2.5 px-7 py-4 rounded-full bg-[#173A35] text-[#F7F5F0] text-xs font-semibold tracking-wider uppercase hover:bg-[#202321] transition-all duration-300 shadow-sm active:scale-98"
              >
                <span>Book an Appointment</span>
                <ArrowUpRight className="w-4 h-4 text-[#C7A46A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>

              <button
                onClick={onExploreTreatments}
                className="inline-flex items-center gap-2 px-6 py-4 rounded-full border border-[#202321]/15 text-[#202321] text-xs font-medium tracking-wider uppercase hover:border-[#173A35] hover:text-[#173A35] transition-colors"
              >
                <span>Explore Treatments</span>
                <ArrowDown className="w-3.5 h-3.5 text-[#78958B]" />
              </button>
            </div>

          </div>

          {/* RIGHT: ARCHITECTURAL COMPOSITION */}
          <div className="lg:col-span-5 relative">
            <div className="relative p-6 sm:p-8 rounded-3xl bg-[#EAE6DE]/60 border border-[#202321]/8 overflow-hidden backdrop-blur-xs">
              
              <div className="flex items-center justify-between pb-5 border-b border-[#202321]/8 text-[11px] font-mono text-[#202321]/60">
                <span>ENAMEL CALIBRATION BLUEPRINT</span>
                <span className="text-[#173A35] font-semibold">CUSTOM SHADE MAPPING</span>
              </div>

              <div className="my-6 relative rounded-2xl overflow-hidden bg-[#F7F5F0] border border-[#202321]/8 p-6 flex flex-col justify-between min-h-[280px]">
                
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline text-xs text-[#202321]/70 font-mono">
                    <span>Optical Translucency Staging</span>
                    <span className="text-[#C7A46A] font-semibold">Natural Bleach BL1/BL2</span>
                  </div>

                  <div className="space-y-2">
                    <div className="h-3 rounded-full bg-[#173A35] w-full flex items-center justify-end px-2 text-[9px] font-mono text-[#F7F5F0]">
                      Incisal Edge (Translucent Porcelain)
                    </div>
                    <div className="h-3 rounded-full bg-[#78958B] w-4/5 flex items-center justify-end px-2 text-[9px] font-mono text-[#F7F5F0]">
                      Dentin Body (High Chroma Structure)
                    </div>
                    <div className="h-3 rounded-full bg-[#EAE6DE] w-3/5 border border-[#202321]/10 flex items-center justify-end px-2 text-[9px] font-mono text-[#202321]">
                      Cervical Margin (Soft Integration)
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#202321]/8 text-xs text-[#202321]/70 leading-relaxed font-serif italic">
                  &ldquo;We design teeth not as flat opaque shapes, but as living optical structures that interact seamlessly with ambient light.&rdquo;
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#202321]/70 pt-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#173A35]" />
                  <span>3D Digital Diagnostic Staging</span>
                </div>
                <span className="font-mono text-[11px] text-[#78958B]">Aesthetic Standards</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
