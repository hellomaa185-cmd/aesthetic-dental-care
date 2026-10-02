import React, { useState, useEffect } from 'react';
import { Star, MessageSquarePlus, CheckCircle2, X, AlertTriangle, ArrowUpRight, ShieldCheck } from 'lucide-react';
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
    <section id="reviews" className="py-24 bg-[#F7F5F0] border-b border-[#202321]/8">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-12 border-b border-[#202321]/8 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-mono text-[#78958B] mb-3">
              <span>07</span>
              <span className="w-8 h-px bg-[#78958B]/40" />
              <span>Patient Experiences</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#202321] font-normal">
              Clinical Testimonials & Care
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#202321]/15 hover:border-[#173A35] text-xs font-medium text-[#202321] transition-colors"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-[#78958B]" />
              <span>Share Your Experience</span>
            </button>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-12">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-8 rounded-3xl bg-[#EAE6DE]/50 border border-[#202321]/8 flex flex-col justify-between space-y-6 hover:border-[#173A35]/30 transition-all duration-300"
            >
              <div className="space-y-4">
                {/* Rating Stars */}
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

                  {rev.isDemo && (
                    <span className="px-2 py-0.5 rounded-full bg-[#EAE6DE] text-[10px] font-mono text-[#78958B]">
                      Demo Testimonial
                    </span>
                  )}
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
                <span className="text-[11px]">
                  {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* SUBMIT REVIEW MODAL */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#202321]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#F7F5F0] border border-[#202321]/15 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-[#202321]">
            
            <div className="flex items-center justify-between pb-4 border-b border-[#202321]/8">
              <div>
                <h3 className="font-serif text-xl font-medium text-[#202321]">
                  Share Your Consultation Experience
                </h3>
                <span className="text-[11px] text-[#78958B] font-mono block mt-0.5">
                  Verified patient testimonials are moderated prior to public release.
                </span>
              </div>

              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="w-8 h-8 rounded-full border border-[#202321]/15 text-[#202321] flex items-center justify-center hover:border-[#202321]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitSuccessMsg ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-serif text-lg text-[#202321]">Review Received</h4>
                <p className="text-xs text-[#202321]/70 font-light max-w-sm mx-auto">
                  {submitSuccessMsg}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4 text-xs font-mono">
                {submitError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    {submitError}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase text-[#202321]/60 mb-1">Your Name *</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Rohan K."
                    required
                    className="w-full bg-[#EAE6DE]/60 border border-[#202321]/15 rounded-xl px-4 py-2.5 text-xs text-[#202321] focus:outline-none focus:border-[#173A35]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#202321]/60 mb-1">Treatment / Procedure</label>
                  <select
                    value={treatmentName}
                    onChange={(e) => setTreatmentName(e.target.value)}
                    className="w-full bg-[#EAE6DE]/60 border border-[#202321]/15 rounded-xl px-4 py-2.5 text-xs text-[#202321] focus:outline-none focus:border-[#173A35]"
                  >
                    <option value="Cosmetic Veneers & Smile Architecture">Cosmetic Veneers & Smile Architecture</option>
                    <option value="Advanced Laser Teeth Whitening">Advanced Laser Teeth Whitening</option>
                    <option value="Invisible Clear Aligners Consultation">Invisible Clear Aligners Consultation</option>
                    <option value="Guided Digital Dental Implants">Guided Digital Dental Implants</option>
                    <option value="Microscopic Biomimetic Onlays & Crowns">Microscopic Biomimetic Onlays & Crowns</option>
                    <option value="General Consultation & Diagnosis">General Consultation & Diagnosis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#202321]/60 mb-1.5">Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            s <= rating
                              ? 'text-[#C7A46A] fill-[#C7A46A]'
                              : 'text-[#202321]/20'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 font-bold text-[#173A35]">{rating} of 5 Stars</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#202321]/60 mb-1">Your Review *</label>
                  <textarea
                    rows={4}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Describe your treatment experience, clinical care, and results..."
                    required
                    className="w-full bg-[#EAE6DE]/60 border border-[#202321]/15 rounded-xl px-4 py-2.5 text-xs text-[#202321] focus:outline-none focus:border-[#173A35]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-5 py-2.5 rounded-full border border-[#202321]/15 text-xs text-[#202321]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-full bg-[#173A35] hover:bg-[#202321] text-[#F7F5F0] text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
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
