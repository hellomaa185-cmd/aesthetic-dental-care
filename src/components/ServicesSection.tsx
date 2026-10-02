import React from 'react';
import { CLINIC_SERVICES } from '../data/mockData';
import { Clock, ArrowUpRight, Sparkles } from 'lucide-react';
import { Service } from '../types';

interface ServicesSectionProps {
  onSelectService: (service: Service) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onSelectService }) => {
  return (
    <section className="py-24 bg-[#F7F5F0] border-b border-[#202321]/8">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-12 border-b border-[#202321]/8 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-mono text-[#78958B] mb-3">
              <span>03</span>
              <span className="w-8 h-px bg-[#78958B]/40" />
              <span>Disciplines & Procedures</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#202321] font-normal">
              Specialized Aesthetic Treatments
            </h2>
          </div>

          <p className="text-xs text-[#202321]/60 font-mono max-w-xs sm:text-right">
            Every procedure begins with a 3D digital diagnosis and bespoke treatment roadmap.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-12">
          {CLINIC_SERVICES.map((service, idx) => (
            <div
              key={service.id}
              className="p-8 rounded-3xl bg-[#EAE6DE]/50 border border-[#202321]/8 flex flex-col justify-between hover:border-[#173A35]/30 hover:bg-[#EAE6DE]/70 transition-all duration-300 group space-y-6"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#202321]/8 text-xs font-mono text-[#202321]/60">
                  <span>PROCEDURE 0{idx + 1}</span>
                  <span className="text-[#173A35] font-semibold">{service.durationMinutes} MINS</span>
                </div>

                <div className="mt-5 text-xs uppercase tracking-wider font-mono text-[#78958B]">
                  {service.category}
                </div>

                <h3 className="font-serif text-2xl font-normal text-[#202321] mt-1 group-hover:text-[#173A35] transition-colors">
                  {service.name}
                </h3>

                <p className="mt-3 text-xs text-[#202321]/75 leading-relaxed font-light">
                  {service.shortDescription || service.description}
                </p>

                {/* Highlights */}
                <div className="mt-5 space-y-1.5 pt-4 border-t border-[#202321]/8">
                  {service.highlights.slice(0, 3).map((highlight, hIdx) => (
                    <div key={hIdx} className="flex items-start gap-2 text-xs text-[#202321]/70 font-light">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#173A35] mt-1.5 shrink-0" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-[#202321]/8">
                <button
                  onClick={() => onSelectService(service)}
                  className="w-full py-3 px-4 rounded-full bg-[#173A35] hover:bg-[#202321] text-[#F7F5F0] text-xs font-medium tracking-wide flex items-center justify-center gap-2 transition-colors group shadow-xs"
                >
                  <span>Reserve Consultation (₹120)</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#C7A46A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
