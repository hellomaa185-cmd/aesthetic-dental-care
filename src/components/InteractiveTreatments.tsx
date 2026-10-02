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
    <section id="treatments" className="py-24 bg-[#F7F5F0] border-b border-[#202321]/8">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-12 border-b border-[#202321]/8 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-mono text-[#78958B] mb-3">
              <span>03</span>
              <span className="w-8 h-px bg-[#78958B]/40" />
              <span>Specialized Disciplines</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#202321] font-normal">
              Curated Treatment Portfolio
            </h2>
          </div>

          <p className="text-xs text-[#202321]/60 font-mono max-w-xs sm:text-right">
            Select a discipline to inspect clinical protocols and reserve an expert consultation (₹120).
          </p>
        </div>

        {/* 2-Column Editorial Treatment Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 pt-12 items-start">
          
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
                  className={`py-6 sm:py-7 cursor-pointer transition-all duration-300 group flex items-start justify-between gap-4 ${
                    isActive ? 'pl-3' : 'hover:pl-2'
                  }`}
                >
                  <div className="flex items-baseline gap-4 sm:gap-6">
                    <span className={`font-mono text-xs transition-colors ${
                      isActive ? 'text-[#173A35] font-bold' : 'text-[#202321]/40 group-hover:text-[#202321]'
                    }`}>
                      {formattedIndex}
                    </span>

                    <div>
                      <h3 className={`font-serif text-xl sm:text-2xl transition-all ${
                        isActive ? 'text-[#173A35] font-medium translate-x-1' : 'text-[#202321] group-hover:text-[#173A35]'
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

                  <div className="shrink-0 pt-1.5">
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
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
          <div className="lg:col-span-6 sticky top-28">
            <div className="p-8 sm:p-10 rounded-3xl bg-[#EAE6DE]/70 border border-[#202321]/8 space-y-8 backdrop-blur-xs">
              
              {/* Category & Badge */}
              <div className="flex items-center justify-between pb-4 border-b border-[#202321]/8">
                <span className="text-xs uppercase tracking-widest font-mono text-[#78958B]">
                  DISCIPLINE {activeIndex + 1} OF {services.length}
                </span>
                <span className="font-mono text-xs text-[#173A35] font-semibold">
                  INR 120 (₹100 + ₹20)
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-4">
                <h4 className="font-serif text-3xl text-[#202321] font-normal leading-snug">
                  {activeService?.name}
                </h4>
                <p className="text-xs sm:text-sm text-[#202321]/75 leading-relaxed font-light">
                  {activeService?.description}
                </p>
              </div>

              {/* Key Highlights */}
              <div className="space-y-2.5 pt-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#202321]/40 block font-semibold">
                  CLINICAL PROTOCOL SPECIFICATIONS
                </span>
                {activeService?.highlights?.map((highlight, hIdx) => (
                  <div key={hIdx} className="flex items-start gap-3 text-xs text-[#202321]/80 font-light">
                    <div className="w-4 h-4 rounded-full bg-[#173A35]/10 border border-[#173A35]/20 flex items-center justify-center shrink-0 mt-0.5 text-[#173A35]">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>

              {/* Reservation CTA */}
              <div className="pt-6 border-t border-[#202321]/8 flex items-center justify-between gap-4">
                <div className="text-xs font-mono text-[#202321]/60">
                  <span>Reserved Slot Hold: </span>
                  <span className="text-[#173A35] font-semibold">10 Mins</span>
                </div>

                <button
                  onClick={() => onSelectService(activeService)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#173A35] hover:bg-[#202321] text-[#F7F5F0] text-xs font-medium tracking-wide uppercase transition-colors group shadow-xs cursor-pointer"
                >
                  <span>Reserve Consultation</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#C7A46A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
