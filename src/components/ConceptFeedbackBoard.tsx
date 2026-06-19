/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  User, 
  Check, 
  Activity, 
  Flame, 
  Heart, 
  HelpCircle, 
  Wrench, 
  AlertCircle
} from 'lucide-react';
import { storage } from '../lib/storage';
import { ConceptComment } from '../types';

interface ConceptFeedbackBoardProps {
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

const VIBE_META = {
  stoked: {
    label: 'Stoked / Hyped 🏁',
    colorClass: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    icon: <Flame className="w-3.5 h-3.5 text-pink-500" />,
    badgeColor: 'bg-pink-500'
  },
  supportive: {
    label: 'Supportive / Lovin’ It ❤️',
    colorClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: <Heart className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />,
    badgeColor: 'bg-emerald-500'
  },
  curious: {
    label: 'Curious / Wondering ❓',
    colorClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    icon: <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />,
    badgeColor: 'bg-cyan-500'
  },
  creative: {
    label: 'Creative / Idea 💡',
    colorClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    icon: <Sparkles className="w-3.5 h-3.5 text-yellow-500" />,
    badgeColor: 'bg-yellow-500'
  },
  critical: {
    label: 'Constructive Critique 🛠️',
    colorClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    icon: <Wrench className="w-3.5 h-3.5 text-purple-400" />,
    badgeColor: 'bg-purple-500'
  }
};

export default function ConceptFeedbackBoard({ addToast }: ConceptFeedbackBoardProps) {
  const [comments, setComments] = useState<ConceptComment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [fullName, setFullName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [userComment, setUserComment] = useState('');
  const [selectedVibe, setSelectedVibe] = useState<'stoked' | 'supportive' | 'curious' | 'creative' | 'critical'>('stoked');
  const [userDemandLevel, setUserDemandLevel] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Filter State
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Load comments
  const loadCommentsList = async () => {
    try {
      const data = await storage.getConceptComments();
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommentsList();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !emailAddress.trim() || !userComment.trim()) {
      addToast('Please satisfy all fields before sharing.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await storage.saveConceptComment({
        name: fullName.trim(),
        email: emailAddress.trim(),
        comment: userComment.trim(),
        vibe: selectedVibe,
        demandLevel: userDemandLevel
      });

      storage.trackClick('btn-submit-concept-feedback');
      addToast('Legendary! Your thought on PlayFest has been added.', 'success');
      
      // Reset form & show successful submission feedback
      setFullName('');
      setEmailAddress('');
      setUserComment('');
      setSelectedVibe('stoked');
      setUserDemandLevel(10);
      setIsSuccess(true);
      
      // Reload comments list
      await loadCommentsList();

      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (err) {
      console.error(err);
      addToast('Failed to lock in your comment.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter logic
  const filteredComments = comments.filter(c => {
    if (activeFilter === 'all') return true;
    return c.vibe === activeFilter;
  });

  // Derived stats
  const totalComments = comments.length;
  const avgDemand = totalComments > 0
    ? (comments.reduce((sum, c) => sum + (c.demandLevel || 10), 0) / totalComments).toFixed(1)
    : "0.0";

  return (
    <section className="py-20 px-4 relative max-w-6xl mx-auto z-10" id="feedback">
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-pink-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Description */}
      <div className="text-center mb-16">
        <h2 className="text-sm font-bold uppercase tracking-widest text-pink-400 text-glow-pink mb-2 font-display">
          Community Vibes
        </h2>
        <h3 className="text-3xl sm:text-5xl font-extrabold font-display uppercase tracking-tight text-white">
          Event <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 text-glow-purple">Concept Board</span>
        </h3>
        <p className="text-gray-400 max-w-2xl mx-auto mt-3 text-sm font-light leading-relaxed">
          PlayFest 2026 brings automotive customization, esports tournament battles, and youth lifestyle culture to Gaborone. 
          What do you think of this event idea? Share your hype, request ideas, or drop key suggestions directly into our open forum!
        </p>
      </div>

      {/* Stats Counter & Dynamic Metric */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
            <Flame className="w-6 h-6 text-pink-500 animate-pulse" />
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase font-mono tracking-wider font-semibold">Average Event Demand</div>
            <div className="text-2xl font-extrabold text-white tracking-tight mt-0.5">{avgDemand} / 10</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase font-mono tracking-wider font-semibold">Total Event Opinions</div>
            <div className="text-2xl font-extrabold text-white tracking-tight mt-0.5">{totalComments} Submissions</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Activity className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase font-mono tracking-wider font-semibold">Forum Status</div>
            <div className="text-2xl font-extrabold text-white tracking-tight mt-0.5 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              Live & Open
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Submit your response concept */}
        <div className="lg:col-span-5 bg-glassmorphism border border-white/10 rounded-3xl p-6 sm:p-8 relative">
          <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-pink-500/5 rounded-full blur-[40px] pointer-events-none" />
          
          <h4 className="text-xl font-bold text-white mb-2 font-display uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-500" /> Speak Your Mind
          </h4>
          <p className="text-xs text-gray-400 font-light mb-6">
            Help shape PlayFest 2026. Your opinion directly affects Gaborone staging schedules, featured games, and priority categories!
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 mb-1.5 label-required">
                Your Name / Crew Handle
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Thabo 'Piston' Kgosi"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all font-sans"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 mb-1.5 label-required">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="e.g. thabo@stance.co.bw"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all font-sans"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 mb-1.5 label-required">
                Define Your Vibe / Opinion Category
              </label>
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(VIBE_META) as Array<keyof typeof VIBE_META>).map((key) => {
                  const vibeObj = VIBE_META[key];
                  const isSelected = selectedVibe === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedVibe(key)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-purple-600/20 border-purple-500 text-purple-200 font-bold shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                          : 'bg-black/30 border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${vibeObj.badgeColor}`} />
                      {vibeObj.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 1 to 10 Demand Scale selector */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 label-required">
                  How badly do you want this event to happen?
                </label>
                <span className="text-[11px] font-mono font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2 py-0.5 rounded">
                  HYPE RATING: {userDemandLevel}/10
                </span>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 mt-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
                  const isSelected = userDemandLevel === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        storage.trackClick(`btn-demand-level-select-${num}`);
                        setUserDemandLevel(num);
                      }}
                      className={`h-9 rounded-lg font-mono text-xs font-black transition-all border flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.35)] scale-105'
                          : 'bg-black/30 border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
              <p className="text-[9px] text-gray-500 font-light mt-1.5 flex justify-between px-1 uppercase font-mono tracking-wider">
                <span>1 = Do not care</span>
                <span>5 = Sounds good</span>
                <span>10 = Absolute MUST-HAPPEN! 🇧🇼</span>
              </p>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 mb-1.5 label-required">
                Your Thought / Suggestion / Review
              </label>
              <textarea
                required
                rows={4}
                maxLength={400}
                placeholder="Would you attend? What is your favorite attraction? Any specific ideas for gaming, cars, tuning or artists for Gaborone Botswana?"
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all font-sans resize-none leading-relaxed"
              />
            </div>

            {/* Response Animation Alert */}
            <AnimatePresence mode="wait">
              {isSuccess && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3px] shrink-0" />
                  Your event design opinion was broadcasted to the public queue successfully!
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full cursor-pointer py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black text-xs uppercase tracking-widest font-display transition-all shadow-[0_4px_20px_rgba(236,72,153,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Posting your thought...' : 'Dispatch Event Opinion'}
            </button>
          </form>
        </div>

        {/* Right Side: public feed with filters */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-[500px]">
          {/* Vibe filter filters */}
          <div className="flex flex-wrap items-center gap-1.5 mb-6 bg-white/[0.02] border border-white/5 p-2 rounded-2xl">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              All Vibes
            </button>
            {(Object.keys(VIBE_META) as Array<keyof typeof VIBE_META>).map((key) => {
              const meta = VIBE_META[key];
              const isActive = activeFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-cyan-500 text-white shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {meta.icon}
                  {key}
                </button>
              );
            })}
          </div>

          {/* Comments Feed List */}
          <div className="relative flex-1 rounded-3xl bg-black/20 border border-white/5 p-4 sm:p-6 overflow-y-auto max-h-[550px] scrollbar-thin scrollbar-thumb-white/10">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-pink-500 animate-spin" />
                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Accessing forum records...</span>
              </div>
            ) : filteredComments.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <AlertCircle className="w-10 h-10 text-gray-600 mb-3" />
                <span className="text-sm text-gray-400 font-bold uppercase tracking-wide font-display">No comments here yet</span>
                <p className="text-xs text-gray-500 max-w-xs mt-1.5 font-light leading-relaxed">
                  Be the first to share your creative thoughts, stance car ideas, or esports tournament demands!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {filteredComments.map((comment) => {
                    const meta = VIBE_META[comment.vibe] || VIBE_META.stoked;
                    return (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all relative group"
                      >
                        <div className="flex justify-between items-start gap-4 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white font-display leading-tight">{comment.name}</div>
                              <div className="text-[9px] font-mono text-gray-500 mt-0.5">
                                {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 ${meta.colorClass}`}>
                              {meta.icon}
                              {comment.vibe}
                            </div>
                            <div className="text-[9px] font-mono font-black py-0.5 px-2 rounded-md bg-white/5 border border-white/10 text-cyan-400 flex items-center gap-1">
                              DEMAND: <span className="text-pink-500 font-bold">{comment.demandLevel || 10}/10</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm font-light text-gray-300 leading-relaxed font-sans pre-line">
                          "{comment.comment}"
                        </p>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
