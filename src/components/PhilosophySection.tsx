import React from 'react';

export const PhilosophySection: React.FC = () => {
  return (
    <section id="philosophy" className="py-20 lg:py-28 bg-[#EAE6DE]/35 border-b border-[#202321]/8">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Section Lead Typography */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start mb-16 lg:mb-20">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2 text-xs tracking-widest font-mono text-[#78958B] mb-3">
              <span>02</span>
              <span className="w-8 h-px bg-[#78958B]/30" />
              <span>Clinical Principles</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#202321] font-normal leading-[1.12] text-balance">
              Dentistry with a quieter kind of confidence.
            </h2>
          </div>

          <div className="lg:col-span-7 space-y-5 text-[#202321]/75 text-base sm:text-lg leading-relaxed font-light">
            <p>
              Traditional cosmetic dentistry frequently defaults to aggressive reduction and uniform, high-opacity ceramics that appear artificial. Our practice begins from a fundamentally different premise: preserving your biological tooth structure and respecting natural facial kinetics.
            </p>
            <p className="text-sm sm:text-base text-[#202321]/70">
              Every procedure is preceded by a digital diagnostic mock-up, allowing you to preview and approve the aesthetic blueprint before any clinical intervention begins.
            </p>
          </div>
        </div>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-[#202321]/8">
          
          <div className="space-y-3">
            <div className="text-xs font-mono text-[#173A35] font-semibold tracking-wider">01. Conservative Craft</div>
            <h3 className="font-serif text-xl sm:text-2xl text-[#202321] font-normal">
              Micro-Invasive Enamel Preservation
            </h3>
            <p className="text-xs sm:text-sm text-[#202321]/70 leading-relaxed font-light">
              We remove only microns of enamel where strictly necessary, utilizing adhesive feldspathic ceramics that bond permanently to natural tooth substrates.
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-mono text-[#173A35] font-semibold tracking-wider">02. Optical Accuracy</div>
            <h3 className="font-serif text-xl sm:text-2xl text-[#202321] font-normal">
              Spectrophotometric Shade Calibration
            </h3>
            <p className="text-xs sm:text-sm text-[#202321]/70 leading-relaxed font-light">
              Digital colorimetry ensures zero guesswork. We match polychromatic translucency, internal mamelon anatomy, and incisal halos to match your natural smile.
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-mono text-[#173A35] font-semibold tracking-wider">03. Trust & Governance</div>
            <h3 className="font-serif text-xl sm:text-2xl text-[#202321] font-normal">
              Transparent Pricing & Reserved Holds
            </h3>
            <p className="text-xs sm:text-sm text-[#202321]/70 leading-relaxed font-light">
              Complete fee transparency with our ₹100 appointment + ₹20 booking fee structure. Every slot is protected with server-verified cryptographic locks.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
