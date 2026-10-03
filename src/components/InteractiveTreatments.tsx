import React, { useState, useEffect } from 'react';
import { CLINIC_SERVICES } from '../data/mockData';
import { Service } from '../types';
import { apiClient } from '../lib/api';
import { ArrowUpRight, Clock, Check } from 'lucide-react';

interface InteractiveTreatmentsProps {
  onSelectService: (service: Service) => void;
}

export const InteractiveTreatments: React.FC<InteractiveTreatmentsProps> = ({ onSelectService }) => {
  const [services, setServices] = useState<Service[]>(CLINIC_SERVICES);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  useEffect(() => {
    apiClient
      .getTreatments()
      .then((res) => {
        if (res.treatments && res.treatments.length > 0) {
          setServices(res.treatments);
        }
      })
      .catch(() => {});
  }, []);

  const activeService = services[activeIndex] || services[0] || CLINIC_SERVICES[0];

  return (
    <section id="treatments" className="py-20 lg:py-28 bg-[#F7F5F0] border-b border-[#202321]/8">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-10 sm:pb-12 border-b border-[#202321]/8 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs tracking-widest font-mono text-[#78958B] mb-3">
              <span>03</span>
              <span className="w-8 h-px bg-[#78958B]/30" />
              <span>Specialized Disciplines</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#202321] font-normal tracking-tight">
              Curated Treatment Portfolio
            </h2>
          </div>

          <p className="text-xs text-[#202321]/60 font-mono max-w-xs sm:text-right">
            Select a discipline to inspect clinical protocols and reserve an expert consultation (₹120).
          </p>
        </div>

        {/* 2-Column Editorial Treatment Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 pt-10 sm:pt-12 items-start">
          
          {/* LEFT: INTERACTIVE EDITORIAL LIST */}
          <div className="lg:col-span-6 divide-y divide-[#202321]/8 border-y border-[#202321]/8">
            {services.map((service, idx) => {
              const isActive = activeIndex === idx;
              const formattedIndex = (idx + 1).toString().padStart(2, '0');
              return (
                <div
                  key={service.id}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => setActiveIndex(idx)}
                  className={`py-5 sm:py-6 cursor-pointer transition-all duration-300 group flex items-start justify-between gap-4 ${
                    isActive ? 'pl-3 sm:pl-4 bg-[#EAE6DE]/20' : 'hover:pl-2'
                  }`}
                >
                  <div className="flex items-baseline gap-4 sm:gap-6">
                    <span className={`font-mono text-xs transition-colors tabular-nums ${
                      isActive ? 'text-[#173A35] font-bold' : 'text-[#202321]/40 group-hover:text-[#202321]'
                    }`}>
                      {formattedIndex}
                    </span>

                    <div>
                      <h3 className={`font-serif text-lg sm:text-xl lg:text-2xl transition-all ${
                        isActive ? 'text-[#173A35] font-medium' : 'text-[#202321] group-hover:text-[#173A35]'
                      }`}>
                        {service.name}
                      </h3>
                      
                      <div className="flex items-center gap-3 text-xs text-[#202321]/50 mt-1">
                        <span>{service.category}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-[#78958B]" /> {service.durationMinutes} min consultation
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 pt-1">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                      isActive
                        ? 'border-[#173A35] bg-[#173A35] text-[#F7F5F0]'
                        : 'border-[#202321]/15 text-[#202321]/40 group-hover:border-[#173A35] group-hover:text-[#173A35]'
                    }`}>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT: DYNAMIC DISCIPLINE SHOWCASE CONTAINER */}
          <div className="lg:col-span-6 sticky top-24">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#EAE6DE]/60 border border-[#202321]/8 space-y-6 backdrop-blur-xs">
              
              {/* Category & Badge */}
              <div className="flex items-center justify-between pb-4 border-b border-[#202321]/8">
                <span className="text-xs tracking-widest font-mono text-[#78958B]">
                  DISCIPLINE {activeIndex + 1} OF {services.length}
                </span>
                <span className="font-mono text-xs text-[#173A35] font-semibold tabular-nums">
                  Consultation Fee: ₹120 (₹100 + ₹20)
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-3">
                <h4 className="font-serif text-2xl sm:text-3xl text-[#202321] font-normal leading-snug">
                  {activeService?.name}
                </h4>
                <p className="text-xs sm:text-sm text-[#202321]/75 leading-relaxed font-light">
                  {activeService?.description}
                </p>
              </div>

              {/* Key Highlights */}
              <div className="space-y-2.5 pt-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#202321]/50 block font-semibold">
                  CLINICAL PROTOCOL SPECIFICATIONS
                </span>
                {activeService?.highlights?.map((highlight, hIdx) => (
                  <div key={hIdx} className="flex items-start gap-2.5 text-xs text-[#202321]/80 font-light">
                    <div className="w-4 h-4 rounded-md bg-[#173A35]/10 border border-[#173A35]/20 flex items-center justify-center shrink-0 mt-0.5 text-[#173A35]">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>

              {/* Direct Booking CTA */}
              <div className="pt-4 border-t border-[#202321]/8 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#202321]/50 block uppercase">1-on-1 Specialist Window</span>
                  <span className="text-xs font-mono font-semibold text-[#173A35]">10-Minute Reserved Hold</span>
                </div>

                <button
                  onClick={() => onSelectService(activeService)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#173A35] text-[#F7F5F0] text-xs font-semibold tracking-wider uppercase hover:bg-[#202321] transition-colors shadow-xs active:scale-98 cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#173A35]"
                >
                  <span>Reserve Consultation</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#C7A46A]" />
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
