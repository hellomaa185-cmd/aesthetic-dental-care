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
      {/* Background subtle architectural coordinate grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(#202321 1px, transparent 1px)',
          backgroundSize: '36px 36px'
        }}
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* LEFT: EDITORIAL VALUE PROPOSITION */}
          <div className="lg:col-span-7 space-y-8">
            
            <div className="flex items-center gap-3 text-xs tracking-widest font-mono text-[#78958B]">
              <span>01</span>
              <span className="w-8 h-px bg-[#78958B]/30" />
              <span>Aesthetic Dental Atelier · Bengaluru</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#202321] font-normal leading-[1.08] tracking-tight max-w-2xl text-balance">
              A more considered <br />
              <span className="italic font-normal text-[#173A35]">approach</span> to your smile.
            </h1>

            <p className="text-[#202321]/75 text-base sm:text-lg leading-relaxed max-w-xl font-light">
              Dentistry with a quieter kind of confidence. We combine conservative microscopic enamel preservation, 3D optical shade mapping, and dedicated 1-on-1 consultations with MDS specialists.
            </p>

            {/* Price & Appointment Guarantee Metadata Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-6 sm:gap-8 border-t border-[#202321]/8 text-xs text-[#202321]/80">
              <div>
                <span className="text-[11px] text-[#202321]/50 uppercase tracking-wider block font-medium">Consultation Fee</span>
                <span className="font-mono font-semibold text-sm text-[#173A35] tabular-nums">₹100 Doctor Fee + ₹20 Booking Fee</span>
              </div>
              <div className="w-px h-8 bg-[#202321]/10 hidden sm:block" />
              <div>
                <span className="text-[11px] text-[#202321]/50 uppercase tracking-wider block font-medium">Reservation Hold</span>
                <span className="text-[#202321]">10-Minute Protected Window</span>
              </div>
              <div className="w-px h-8 bg-[#202321]/10 hidden sm:block" />
              <div>
                <span className="text-[11px] text-[#202321]/50 uppercase tracking-wider block font-medium">Atelier Location</span>
                <span className="text-[#202321]">Indiranagar, Bengaluru</span>
              </div>
            </div>

            {/* Primary & Secondary Action Controls */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onOpenBooking}
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-lg bg-[#173A35] text-[#F7F5F0] text-xs font-semibold tracking-wider uppercase hover:bg-[#202321] transition-all duration-300 shadow-xs active:scale-98 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#173A35]"
              >
                <span>Reserve Consultation</span>
                <ArrowUpRight className="w-4 h-4 text-[#C7A46A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>

              <button
                onClick={onExploreTreatments}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg border border-[#202321]/15 text-[#202321] text-xs font-medium tracking-wider uppercase hover:border-[#173A35] hover:text-[#173A35] transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#173A35]"
              >
                <span>Explore Treatments</span>
                <ArrowDown className="w-3.5 h-3.5 text-[#78958B]" />
              </button>
            </div>

          </div>

          {/* RIGHT: BESPOKE ATELIER CALIBRATION STAGING */}
          <div className="lg:col-span-5 relative">
            <div className="relative p-6 sm:p-8 rounded-2xl bg-[#EAE6DE]/50 border border-[#202321]/8 overflow-hidden backdrop-blur-xs">
              
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#202321]/8 text-[11px] font-mono text-[#202321]/60 tracking-wider">
                <span>ENAMEL CALIBRATION SPECIFICATION</span>
                <span className="text-[#173A35] font-semibold">CUSTOM SHADE MAPPING</span>
              </div>

              {/* Specification Container */}
              <div className="my-5 rounded-xl bg-[#F7F5F0] border border-[#202321]/8 p-5 sm:p-6 flex flex-col justify-between gap-5">
                
                {/* Top Header Row */}
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-[#202321]/70 font-mono pb-1 border-b border-[#202321]/6">
                  <span className="font-medium text-[#202321]/80">Optical Translucency Gradient</span>
                  <span className="text-[#C7A46A] font-semibold tracking-wide">BL1 / BL2 Staging</span>
                </div>

                {/* Structured Specification Rows with Calibration Indicator Bars */}
                <div className="space-y-3.5">
                  
                  {/* Row 1: Incisal Zone */}
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-4 text-xs font-mono">
                      <span className="text-[#202321]/80 font-medium whitespace-nowrap">Incisal Zone</span>
                      <span className="text-[#173A35] font-semibold text-right">Translucent Ceramic (98% L)</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#202321]/10 overflow-hidden">
                      <div className="h-full w-full rounded-full bg-[#173A35]" />
                    </div>
                  </div>

                  {/* Row 2: Dentin Core */}
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-4 text-xs font-mono">
                      <span className="text-[#202321]/80 font-medium whitespace-nowrap">Dentin Core</span>
                      <span className="text-[#78958B] font-semibold text-right">High Chroma Structure</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#202321]/10 overflow-hidden">
                      <div className="h-full w-[80%] rounded-full bg-[#78958B]" />
                    </div>
                  </div>

                  {/* Row 3: Cervical Margin */}
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-4 text-xs font-mono">
                      <span className="text-[#202321]/80 font-medium whitespace-nowrap">Cervical Margin</span>
                      <span className="text-[#202321]/75 font-semibold text-right">Natural Gumline Integration</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#202321]/10 overflow-hidden">
                      <div className="h-full w-[60%] rounded-full bg-[#C7A46A]" />
                    </div>
                  </div>

                </div>

                {/* Editorial Quotation */}
                <div className="pt-4 border-t border-[#202321]/8 text-xs text-[#202321]/75 leading-relaxed font-serif italic">
                  &ldquo;We shape ceramic restorations as natural optical structures that harmonize seamlessly with your facial architecture and ambient light.&rdquo;
                </div>

              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between text-xs text-[#202321]/70 pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#173A35]" />
                  <span>3D Digital Diagnostic Calibration</span>
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
