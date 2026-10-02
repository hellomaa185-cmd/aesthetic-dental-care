import React, { useState, useEffect } from 'react';
import { CLINIC_DOCTORS } from '../data/mockData';
import { Doctor } from '../types';
import { apiClient } from '../lib/api';
import { ArrowUpRight } from 'lucide-react';

interface DoctorsSectionProps {
  onSelectDoctor: (doctor: Doctor) => void;
}

export const DoctorsSection: React.FC<DoctorsSectionProps> = ({ onSelectDoctor }) => {
  const [doctors, setDoctors] = useState<Doctor[]>(CLINIC_DOCTORS);

  useEffect(() => {
    apiClient
      .getDoctors()
      .then((res) => {
        if (res.doctors && res.doctors.length > 0) {
          setDoctors(res.doctors);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section id="doctors" className="py-24 bg-[#F7F5F0] border-b border-[#202321]/8">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-12 border-b border-[#202321]/8 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-mono text-[#78958B] mb-3">
              <span>05</span>
              <span className="w-8 h-px bg-[#78958B]/40" />
              <span>Clinical Faculty</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#202321] font-normal">
              Specialist Faculty & Master Ceramists
            </h2>
          </div>

          <p className="text-xs text-[#202321]/60 font-mono max-w-xs sm:text-right">
            Every patient is treated directly by board-accredited clinical specialists.
          </p>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-12">
          {doctors.map((doctor, idx) => (
            <div
              key={doctor.id}
              className="p-8 rounded-3xl bg-[#EAE6DE]/50 border border-[#202321]/8 flex flex-col justify-between space-y-8 hover:border-[#173A35]/30 transition-all duration-300"
            >
              <div>
                {/* Doctor Head Index */}
                <div className="flex items-center justify-between pb-4 border-b border-[#202321]/8 text-xs font-mono text-[#202321]/60">
                  <span>FACULTY 0{idx + 1}</span>
                  <span className="text-[#173A35] font-semibold">{doctor.experienceYears}+ YRS EXP</span>
                </div>

                {/* Name & Title */}
                <div className="mt-5 space-y-1">
                  <h3 className="font-serif text-2xl text-[#202321] font-normal">
                    {doctor.name}
                  </h3>
                  <div className="text-xs font-medium text-[#173A35]">
                    {doctor.specialtyName || doctor.title}
                  </div>
                </div>

                {/* Qualification */}
                <div className="mt-3 text-[11px] font-mono text-[#202321]/60 leading-relaxed">
                  {doctor.qualification}
                </div>

                {/* Bio Prose */}
                <p className="mt-4 text-xs text-[#202321]/75 leading-relaxed font-light">
                  {doctor.bio}
                </p>

                {/* Consultation Days */}
                <div className="mt-6 pt-4 border-t border-[#202321]/8 text-xs text-[#202321]/60">
                  <span className="text-[10px] uppercase font-semibold text-[#202321]/40 block mb-1">
                    Clinic Days:
                  </span>
                  <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                    {(doctor.consultationDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']).map((day: string) => (
                      <span key={day} className="text-[#202321]/80">
                        {day.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-[#202321]/8">
                <button
                  onClick={() => onSelectDoctor(doctor)}
                  className="w-full py-3 px-4 rounded-full bg-[#173A35] hover:bg-[#202321] text-[#F7F5F0] text-xs font-medium tracking-wide flex items-center justify-center gap-2 transition-colors group shadow-xs cursor-pointer"
                >
                  <span>Consult with {doctor.name.split(' ')[1] || doctor.name} (₹120)</span>
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
