import React, { useState } from 'react';
import { MessageCircle, X, Send, Sparkles, Clock, ShieldCheck } from 'lucide-react';
import { getWhatsAppLink, CLINIC_WHATSAPP_NUMBER } from '../data/mockData';

export const WhatsAppFloatingButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [customText, setCustomText] = useState(
    'Hello Aesthetic Dental Clinic, I would like some assistance with an appointment.'
  );

  const QUICK_INTENTS = [
    'I would like to book a consultation (₹120).',
    'I have a question regarding cosmetic veneers & pricing.',
    'I want to check doctor availability for this week.',
    'I need guidance on clear aligners & orthodontic scans.',
  ];

  const handleSend = () => {
    const url = getWhatsAppLink(customText);
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] right-4 md:bottom-6 md:left-6 md:right-auto z-40 select-none">
      
      {/* Expanded WhatsApp Concierge Dialog */}
      {isOpen && (
        <div className="mb-3 w-[calc(100vw-2rem)] max-w-[340px] sm:max-w-[360px] rounded-3xl bg-[#121413] border border-white/15 text-[#F7F5F0] p-5 shadow-2xl animate-reveal-up overflow-hidden backdrop-blur-md">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-700/80 flex items-center justify-center text-white">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-medium text-[#F7F5F0]">Clinical Concierge</h4>
                <span className="text-[10px] font-mono text-emerald-400 block">Active · Mon–Sat 09:00–18:00</span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close WhatsApp Concierge"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Prompt / Instructions */}
          <div className="py-3 space-y-2 text-xs">
            <p className="text-[#F7F5F0]/75 font-light text-[11px] leading-relaxed">
              Message our Indiranagar dental desk directly on WhatsApp for immediate assistance, directions, or preliminary questions.
            </p>

            {/* Quick Intent Pills */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#C7A46A]">
                Quick Select:
              </span>
              <div className="flex flex-col gap-1.5">
                {QUICK_INTENTS.map((intent, i) => (
                  <button
                    key={i}
                    onClick={() => setCustomText(intent)}
                    className="text-left text-[11px] p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-[#F7F5F0]/85 hover:text-white cursor-pointer"
                  >
                    {intent}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea for message preview */}
            <div className="pt-2">
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl bg-white/5 border border-white/15 text-[#F7F5F0] focus:outline-none focus:border-[#C7A46A] resize-none"
                placeholder="Type your inquiry..."
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={handleSend}
              className="w-full py-3 px-4 rounded-full bg-emerald-700 hover:bg-emerald-600 text-[#F7F5F0] text-xs font-mono font-medium tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Open in WhatsApp</span>
            </button>
          </div>

        </div>
      )}

      {/* Persistent Restrained Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group inline-flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#121413] hover:bg-[#173A35] text-[#F7F5F0] border border-white/15 hover:border-[#C7A46A] shadow-xl transition-all duration-300 cursor-pointer"
        aria-label="Chat with Aesthetic Dental Clinic on WhatsApp"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <MessageCircle className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />
        <span className="text-xs font-mono tracking-wider uppercase text-[#F7F5F0]">
          WhatsApp Desk
        </span>
      </button>

    </div>
  );
};
