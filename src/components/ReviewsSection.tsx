import React, { useState, useEffect } from 'react';
import { Star, MessageSquarePlus, CheckCircle2, X, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { apiClient } from '../lib/api';
import { Review } from '../types';

export const ReviewsSection: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Review submission state
  const [patientName, setPatientName] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [treatmentName, setTreatmentName] = useState('Cosmetic Veneers & Smile Architecture');
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    loadApprovedReviews();
  }, []);

  const loadApprovedReviews = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getReviews();
      setReviews(res.reviews);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !reviewText.trim()) {
      setSubmitError('Please provide your name and review details.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await apiClient.submitReview({
        patientName: patientName.trim(),
        rating,
        treatmentName,
        reviewText: reviewText.trim(),
      });
      setSubmitSuccessMsg(res.message);
      setPatientName('');
      setReviewText('');
      setTimeout(() => {
        setIsSubmitModalOpen(false);
        setSubmitSuccessMsg(null);
      }, 2500);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="reviews" className="py-20 lg:py-28 bg-[#F7F5F0] border-b border-[#202321]/8">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-10 sm:pb-12 border-b border-[#202321]/8 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs tracking-widest font-mono text-[#78958B] mb-3">
              <span>07</span>
              <span className="w-8 h-px bg-[#78958B]/30" />
              <span>Patient Experiences</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#202321] font-normal tracking-tight">
              Clinical Testimonials & Care
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#202321]/15 hover:border-[#173A35] text-xs font-medium text-[#202321] transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#173A35]"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-[#78958B]" />
              <span>Share Your Experience</span>
            </button>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-10 sm:pt-12">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-6 sm:p-8 rounded-2xl bg-[#EAE6DE]/50 border border-[#202321]/8 flex flex-col justify-between space-y-6 hover:border-[#173A35]/30 transition-all duration-300"
            >
              <div className="space-y-4">
                {/* Rating Stars & Unboxed Metadata */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating
                            ? 'text-[#C7A46A] fill-[#C7A46A]'
                            : 'text-[#202321]/20'
                        }`}
                      />
                    ))}
                  </div>

                  <span className="text-[11px] font-mono text-[#78958B]">
                    Verified Consultation
                  </span>
                </div>

                {/* Treatment Name */}
                {rev.treatmentName && (
                  <div className="text-[11px] font-mono text-[#173A35] font-semibold uppercase tracking-wider">
                    {rev.treatmentName}
                  </div>
                )}

                {/* Review Prose */}
                <p className="text-xs sm:text-sm text-[#202321]/80 leading-relaxed font-light italic">
                  "{rev.reviewText}"
                </p>
              </div>

              {/* Patient Author & Date */}
              <div className="pt-4 border-t border-[#202321]/8 flex items-baseline justify-between text-xs font-mono text-[#202321]/60">
                <span className="font-semibold text-[#202321]">{rev.patientName}</span>
                <span className="text-[11px]">{rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Verified Patient'}</span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Review Submission Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#202321]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#F7F5F0] border border-[#202321]/15 rounded-2xl shadow-2xl p-6 sm:p-8 animate-reveal-up text-[#202321] relative">
            <button
              onClick={() => setIsSubmitModalOpen(false)}
              className="absolute top-5 right-5 text-[#202321]/50 hover:text-[#202321] p-1.5 rounded-lg hover:bg-[#EAE6DE]"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-serif text-2xl text-[#202321] mb-1">
              Share Your Clinical Experience
            </h3>
            <p className="text-xs text-[#202321]/60 mb-6 font-light">
              Your feedback is audited for clinical accuracy before publication.
            </p>

            {submitSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{submitSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                {submitError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div>
                  <label className="block font-mono uppercase text-[#202321]/60 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Priya N."
                    className="w-full bg-[#EAE6DE]/60 border border-[#202321]/15 rounded-lg px-3.5 py-2 text-sm text-[#202321] focus:outline-hidden focus:ring-1 focus:ring-[#173A35]"
                  />
                </div>

                <div>
                  <label className="block font-mono uppercase text-[#202321]/60 mb-1">Treatment Undergone</label>
                  <input
                    type="text"
                    required
                    value={treatmentName}
                    onChange={(e) => setTreatmentName(e.target.value)}
                    placeholder="e.g. Porcelain Veneers, Clear Aligners"
                    className="w-full bg-[#EAE6DE]/60 border border-[#202321]/15 rounded-lg px-3.5 py-2 text-sm text-[#202321] focus:outline-hidden focus:ring-1 focus:ring-[#173A35]"
                  />
                </div>

                <div>
                  <label className="block font-mono uppercase text-[#202321]/60 mb-1">Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= rating ? 'text-[#C7A46A] fill-[#C7A46A]' : 'text-[#202321]/20'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="font-mono text-[#78958B] ml-2">{rating} of 5 stars</span>
                  </div>
                </div>

                <div>
                  <label className="block font-mono uppercase text-[#202321]/60 mb-1">Your Review</label>
                  <textarea
                    rows={4}
                    required
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Describe the clinical care, diagnostic clarity, and treatment outcome..."
                    className="w-full bg-[#EAE6DE]/60 border border-[#202321]/15 rounded-lg px-3.5 py-2 text-sm text-[#202321] focus:outline-hidden focus:ring-1 focus:ring-[#173A35]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-[#202321]/70 hover:text-[#202321]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-lg bg-[#173A35] hover:bg-[#202321] text-[#F7F5F0] text-xs font-semibold tracking-wider uppercase transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Testimonial'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
