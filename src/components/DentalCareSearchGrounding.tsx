import React, { useState } from 'react';
import { Search, Loader2, ArrowUpRight, ExternalLink } from 'lucide-react';
import { apiClient } from '../lib/api';

export const DentalCareSearchGrounding: React.FC = () => {
  const [query, setQuery] = useState('How long do porcelain veneers last and what is the post-care maintenance?');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ answer: string; sources: { title: string; url: string }[] } | null>(null);

  const sampleQueries = [
    'How long do porcelain veneers last and what is the post-care maintenance?',
    'What is the difference between clear aligners and traditional braces for adult deep bite?',
    'Is in-office laser teeth whitening safe for thin tooth enamel?',
  ];

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setIsLoading(true);
    try {
      const data = await apiClient.searchOralHealth(q);
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-16 px-6 sm:px-8 lg:px-12 max-w-4xl mx-auto space-y-8 text-[#202321]">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-mono text-[#78958B] mb-2">
          <span>SEARCH-GROUNDED KNOWLEDGE PLANE</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#202321]">
          Clinical Research & Oral Care Guide
        </h2>
        <p className="text-xs sm:text-sm text-[#202321]/70 font-light mt-2">
          Grounded with real-time dental medical literature and American Academy of Cosmetic Dentistry (AACD) references.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="p-6 rounded-3xl bg-[#EAE6DE]/60 border border-[#202321]/8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#202321]/40 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ask any aesthetic dental question..."
              className="w-full bg-[#F7F5F0] border border-[#202321]/15 rounded-full pl-11 pr-4 py-3 text-xs text-[#202321] focus:outline-none focus:border-[#173A35]"
            />
          </div>

          <button
            onClick={() => handleSearch()}
            disabled={isLoading}
            className="px-6 py-3 rounded-full bg-[#173A35] hover:bg-[#202321] text-[#F7F5F0] text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Querying...
              </span>
            ) : (
              <span>Search Literature</span>
            )}
          </button>
        </div>

        {/* Preset suggestions */}
        <div className="flex flex-wrap gap-2 text-xs text-[#202321]/60">
          <span className="font-mono text-[10px] uppercase">Example queries:</span>
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(q);
                handleSearch(q);
              }}
              className="text-[11px] underline hover:text-[#173A35] text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Answer Output */}
      {result && (
        <div className="p-8 rounded-3xl bg-[#F7F5F0] border border-[#202321]/10 space-y-6 shadow-xs animate-reveal-up">
          <div className="text-xs font-mono text-[#78958B] uppercase pb-3 border-b border-[#202321]/8">
            CLINICAL FINDINGS
          </div>

          <div className="text-xs sm:text-sm text-[#202321]/85 leading-relaxed font-light whitespace-pre-line">
            {result.answer}
          </div>

          {result.sources && result.sources.length > 0 && (
            <div className="pt-4 border-t border-[#202321]/8 space-y-2">
              <span className="text-[10px] uppercase font-mono text-[#202321]/50">Grounding References:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.sources.map((src, sIdx) => (
                  <a
                    key={sIdx}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-[#EAE6DE]/40 border border-[#202321]/8 hover:border-[#173A35] text-xs text-[#202321] flex items-center justify-between transition-colors group"
                  >
                    <span className="truncate pr-2">{src.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#202321]/40 group-hover:text-[#173A35] shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
