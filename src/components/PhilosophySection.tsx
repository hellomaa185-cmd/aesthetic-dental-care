import React from 'react';
import { Compass, Eye, ShieldCheck } from 'lucide-react';

export const PhilosophySection: React.FC = () => {
  return (
    <section id="philosophy" className="py-24 bg-[#EAE6DE]/40 border-b border-[#202321]/8">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Section Lead Typography */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start mb-20">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-mono text-[#78958B] mb-3">
              <span>02</span>
              <span className="w-8 h-px bg-[#78958B]/40" />
              <span>Our Philosophy</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#202321] font-normal leading-tight">
              Dentistry with a quieter kind of confidence.
            </h2>
          </div>

          <div className="lg:col-span-8 space-y-6 text-[#202321]/80 text-base sm:text-lg leading-relaxed font-light">
            <p>
              Traditional cosmetic dentistry often relies on aggressive reduction and uniform, opaque materials that look artificial. Our practice begins from a fundamentally different premise: preserving your natural tooth structure and respecting individual facial anatomy.
            </p>
            <p className="text-sm sm:text-base text-[#202321]/70">
              Every procedure is preceded by a digital diagnostic mock-up, allowing you to preview and approve the aesthetic blueprint in real-time before any clinical step is initiated.
            </p>
          </div>
        </div>

        {/* 3 Core Pillars (Clean typography, whitespace, zero pills) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-[#202321]/8">
          
          <div className="space-y-4">
            <div className="text-xs font-mono text-[#173A35] font-semibold">01 / CONSERVATIVE CRAFT</div>
            <h3 className="font-serif text-xl text-[#202321]">
              Micro-Invasive Enamel Preservation
            </h3>
            <p className="text-xs text-[#202321]/70 leading-relaxed">
              We remove only microns of enamel where strictly necessary, utilizing adhesive feldspathic ceramics that bond permanently to natural tooth substrates.
            </p>
          </div>

          <div className="space-y-4">
            <div className="text-xs font-mono text-[#173A35] font-semibold">02 / OPTICAL ACCURACY</div>
            <h3 className="font-serif text-xl text-[#202321]">
              Spectrophotometric Shade Calibration
            </h3>
            <p className="text-xs text-[#202321]/70 leading-relaxed">
              Digital colorimetry ensures zero guesswork. We match polychromatic translucency, mamelon anatomy, and incisal halos to match your natural smile.
            </p>
          </div>

          <div className="space-y-4">
            <div className="text-xs font-mono text-[#173A35] font-semibold">03 / TRUST & CERTAINTY</div>
            <h3 className="font-serif text-xl text-[#202321]">
              Authoritative Payment Verification
            </h3>
            <p className="text-xs text-[#202321]/70 leading-relaxed">
              Complete transparency with our ₹100 appointment + ₹20 booking fee structure. Every slot is protected with server-verified cryptographic locks.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
