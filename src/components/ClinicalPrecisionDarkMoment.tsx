import React from 'react';
import { Sparkles, Clock, Compass, ShieldCheck } from 'lucide-react';

export const ClinicalPrecisionDarkMoment: React.FC = () => {
  return (
    <section className="py-28 bg-[#202321] text-[#F7F5F0] relative overflow-hidden">
      {/* Subtle deep forest ambient vignette */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#173A35]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        
        {/* Section Lead */}
        <div className="max-w-3xl mb-20">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-mono text-[#78958B] mb-3">
            <span>04</span>
            <span className="w-8 h-px bg-[#78958B]/40" />
            <span>Clinical Laboratory Standards</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl text-[#F7F5F0] font-normal leading-tight">
            Precision in every restoration.
          </h2>
          <p className="text-[#F7F5F0]/70 text-base sm:text-lg leading-relaxed mt-4 font-light max-w-2xl">
            Our clinic combines in-house digital 3D CAD/CAM milling with master ceramist artistry, creating bespoke ceramic restorations tailored to your facial aesthetics.
          </p>
        </div>

        {/* 4 Quantitative Specifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-8 border-t border-[#F7F5F0]/10">
          
          <div className="space-y-3">
            <div className="font-mono text-3xl sm:text-4xl font-light text-[#C7A46A] tracking-tight">
              3D<span className="text-xl font-normal"> Scan</span>
            </div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#F7F5F0]/50">Optical Digital Impression</div>
            <p className="text-xs text-[#F7F5F0]/70 leading-relaxed font-light">
              High-definition digital intraoral scans replacing impression trays for precise and comfortable diagnostics.
            </p>
          </div>

          <div className="space-y-3">
            <div className="font-mono text-3xl sm:text-4xl font-light text-[#C7A46A] tracking-tight">
              1-on-1<span className="text-xl font-normal"> Care</span>
            </div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#F7F5F0]/50">Dedicated Chair Time</div>
            <p className="text-xs text-[#F7F5F0]/70 leading-relaxed font-light">
              Full 45–60 minute comprehensive diagnostic evaluations with our accredited prosthodontists and surgeons.
            </p>
          </div>

          <div className="space-y-3">
            <div className="font-mono text-3xl sm:text-4xl font-light text-[#C7A46A] tracking-tight">
              16<span className="text-xl font-normal"> Shades</span>
            </div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#F7F5F0]/50">Natural Shade Mapping</div>
            <p className="text-xs text-[#F7F5F0]/70 leading-relaxed font-light">
              From natural high-value bleaches to organic enamel gradients with lifelike translucency and opalescence.
            </p>
          </div>

          <div className="space-y-3">
            <div className="font-mono text-3xl sm:text-4xl font-light text-[#C7A46A] tracking-tight">
              10<span className="text-xl font-normal"> Min</span>
            </div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#F7F5F0]/50">Reserved Slot Hold</div>
            <p className="text-xs text-[#F7F5F0]/70 leading-relaxed font-light">
              Your chosen consultation time is held exclusively for you during checkout, preventing double bookings.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
