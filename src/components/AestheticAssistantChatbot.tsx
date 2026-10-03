import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Loader2,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Clock,
  User,
  Info,
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { ChatMessage, Service, Doctor } from '../types';

interface AestheticAssistantChatbotProps {
  onOpenBooking: (service?: Service, doctor?: Doctor) => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    role: 'model',
    content: `Welcome to Aesthetic Dental Clinic. I am your clinical concierge. I can assist you with our cosmetic and restorative treatments, specialist qualifications, clinic hours, or guide you through scheduling a consultation (₹100 Doctor Fee + ₹20 Booking Fee). How may I assist you today?`,
    timestamp: new Date().toISOString(),
  },
];

const SUGGESTED_QUESTIONS = [
  'What treatments do you offer?',
  'How much is the consultation fee?',
  'Tell me about Dr. Maya Rao',
  'What are your clinic hours?',
  'Can I book a consultation for veneers?',
];

export const AestheticAssistantChatbot: React.FC<AestheticAssistantChatbotProps> = ({ onOpenBooking }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputVal;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await apiClient.sendChatMessage(history, text.trim());

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: res.reply,
        timestamp: new Date().toISOString(),
        actionSuggestion: res.actionSuggestion,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const fallbackMsg: ChatMessage = {
        id: `bot-fallback-${Date.now()}`,
        role: 'model',
        content: `Our clinic is located in Indiranagar, Bengaluru. We offer consultations with Dr. Maya Rao, Dr. Arjun Mehta, and Dr. Siddharth Varma for ₹120 (₹100 Specialist Fee + ₹20 Booking Fee). You can reserve an appointment directly at any time.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-4 md:bottom-6 md:right-6 z-40">
      
      {/* FLOATING LAUNCHER BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-[#173A35] text-[#F7F5F0] hover:bg-[#202321] shadow-2xl transition-all duration-300 active:scale-95 border border-[#C7A46A]/30 cursor-pointer"
          aria-label="Open Aesthetic Assistant"
        >
          <div className="w-2 h-2 rounded-full bg-[#C7A46A] animate-pulse" />
          <span className="font-serif text-xs tracking-wider uppercase">Aesthetic Assistant</span>
          <MessageSquare className="w-4 h-4 text-[#C7A46A] group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* CHAT ATELIER PANEL */}
      {isOpen && (
        <div className="w-[calc(100vw-2rem)] max-w-[420px] h-[580px] max-h-[80vh] sm:max-h-[85vh] bg-[#F7F5F0] border border-[#202321]/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#202321] animate-reveal-up">
          
          {/* Panel Header */}
          <div className="px-5 py-4 bg-[#173A35] text-[#F7F5F0] flex items-center justify-between border-b border-[#202321]/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/15">
                <Sparkles className="w-4 h-4 text-[#C7A46A]" />
              </div>
              <div>
                <h3 className="font-serif text-sm font-medium tracking-wide">Aesthetic Assistant</h3>
                <span className="text-[10px] font-mono text-[#F7F5F0]/70 block">
                  Clinical Concierge · Indiranagar
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-[#F7F5F0] flex items-center justify-center transition-colors"
              aria-label="Close Assistant"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Medical Safety Disclaimer Strip */}
          <div className="px-4 py-1.5 bg-[#EAE6DE] border-b border-[#202321]/8 text-[10px] font-mono text-[#202321]/60 flex items-center gap-1.5">
            <Info className="w-3 h-3 text-[#78958B] shrink-0" />
            <span>Educational guidance only. In-person clinical diagnosis required.</span>
          </div>

          {/* Conversation Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed font-light ${
                      isUser
                        ? 'bg-[#173A35] text-[#F7F5F0] rounded-br-none shadow-xs font-sans'
                        : 'bg-[#EAE6DE]/70 text-[#202321] border border-[#202321]/8 rounded-bl-none font-sans'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Action Suggestion inside bot response */}
                  {!isUser && msg.actionSuggestion?.type === 'book_appointment' && (
                    <div className="mt-2">
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          onOpenBooking();
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#173A35] hover:bg-[#202321] text-[#F7F5F0] text-[11px] font-medium tracking-wide uppercase transition-colors shadow-xs"
                      >
                        <Calendar className="w-3 h-3 text-[#C7A46A]" />
                        <span>Book Consultation (₹120)</span>
                        <ArrowUpRight className="w-3 h-3 text-[#C7A46A]" />
                      </button>
                    </div>
                  )}

                  <span className="text-[9px] font-mono text-[#202321]/40 mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-[#173A35] font-mono p-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Consulting clinic records...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-[#EAE6DE]/40 border-t border-[#202321]/8 overflow-x-auto flex gap-1.5 scrollbar-none">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={isLoading}
                className="whitespace-nowrap px-3 py-1 rounded-full bg-[#F7F5F0] border border-[#202321]/10 text-[11px] font-mono text-[#202321]/75 hover:border-[#173A35] hover:text-[#173A35] transition-colors shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-[#F7F5F0] border-t border-[#202321]/8 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask about treatments, doctors, hours..."
              disabled={isLoading}
              className="flex-1 bg-[#EAE6DE]/60 border border-[#202321]/15 rounded-full px-4 py-2 text-xs text-[#202321] focus:outline-none focus:border-[#173A35]"
            />

            <button
              type="submit"
              disabled={!inputVal.trim() || isLoading}
              className="w-8 h-8 rounded-full bg-[#173A35] hover:bg-[#202321] text-[#F7F5F0] flex items-center justify-center transition-colors disabled:opacity-40 shrink-0"
              aria-label="Send Message"
            >
              <Send className="w-3.5 h-3.5 text-[#C7A46A]" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
};
