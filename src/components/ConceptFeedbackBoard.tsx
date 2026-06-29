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
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { storage } from '../lib/storage';
import { ConceptComment } from '../types';
import { sounds } from '../lib/sounds';

interface ConceptFeedbackBoardProps {
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

const VIBE_META = {
  stoked: {
    label: 'Stoked / Hyped 🏁',
    colorClass: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    icon: <Flame className="w-3.5 h-3.5 text-pink-500" />,
    badgeColor: 'bg-pink-500',
    helpText: 'STOKED VIBE: Feeling raw anticipation. Absolute must-happen, esports combat ready, stance tuned, exhaust backfires echoing.'
  },
  supportive: {
    label: 'Supportive / Lovin’ It ❤️',
    colorClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: <Heart className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />,
    badgeColor: 'bg-emerald-500',
    helpText: 'SUPPORTIVE VIBE: Standing behind the Gaborone pop culture movement. Cheering on local creators, artists, and lifestyle teams.'
  },
  curious: {
    label: 'Curious / Wondering ❓',
    colorClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    icon: <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />,
    badgeColor: 'bg-cyan-500',
    helpText: 'CURIOUS VIBE: Seeking tournament formats, precise stage locations, date schedules, or prize tier details.'
  },
  creative: {
    label: 'Creative / Idea 💡',
    colorClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    icon: <Sparkles className="w-3.5 h-3.5 text-yellow-500" />,
    badgeColor: 'bg-yellow-500',
    helpText: 'CREATIVE VIBE: Proposing new ideas. Car model exhibits, sim-racing tournament brackets, custom car wrapping booths.'
  },
  critical: {
    label: 'Constructive Critique 🛠️',
    colorClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    icon: <Wrench className="w-3.5 h-3.5 text-purple-400" />,
    badgeColor: 'bg-purple-500',
    helpText: 'CRITICAL VIBE: Practical feedback on traffic logistics, ticket structures, parking security, or venue accessibility.'
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
  const [hoveredField, setHoveredField] = useState<string>('forum');

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
      sounds.playCancel();
      addToast('Please satisfy all fields before sharing.', 'error');
      return;
    }

    setIsSubmitting(true);
    sounds.playSelect();
    try {
      await storage.saveConceptComment({
        name: fullName.trim(),
        email: emailAddress.trim(),
        comment: userComment.trim(),
        vibe: selectedVibe,
        demandLevel: userDemandLevel
      });

      storage.trackClick('btn-submit-concept-feedback');
      sounds.playSuccess();
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
      sounds.playCancel();
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

  const handleFilterClick = (filter: string) => {
    sounds.playSelect();
    setActiveFilter(filter);
  };

  const formHelpMap: Record<string, string> = {
    name: 'NAME / CREW HANDLE: Input your display tag or racing crew handle as it will appear publicly on the live billboard feed.',
    emailAddress: 'SECURE ELECTRONIC EMAIL: Private coordinate strictly for administrative validation, giveaway tracking & updates.',
    vibe_select: 'VIBE CLASSIFICATION: Categorize your submission to guide Gaborone festival planners in organizing relevant zones.',
    hype_rating: 'HYPE ACCELERATION: Calibrate your intensity from 1 (unconcerned) to 10 (absolute high-octane necessity for Gaborone!).',
    thought: 'COMMENTS DISPATCH: Write your gaming tourney suggestions, stance tire specification ideas, or musical set requests.',
    forum: 'COMMUNITY OPINION BULLETIN: Browse through public feedback streams and filter by specific emotional frequencies.'
  };

  return (
    <section className="py-20 px-4 relative max-w-6xl mx-auto z-10" id="feedback">
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-pink-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Description */}
      <div className="text-center mb-12">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-pink-400 text-glow-pink mb-2 font-mono">
          COMMUNITY FEEDBACK MODULE
        </h2>
        <h3 className="text-3xl sm:text-5xl font-black font-display uppercase tracking-tight text-white">
          SPEAK YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 text-glow-purple">MIND</span>
        </h3>
        <p className="text-gray-400 max-w-2xl mx-auto mt-3 text-sm font-light leading-relaxed">
          What do you think of PlayFest Gaborone Nov 20-22? Share your core thoughts, request customized games, nominate artists, and drop automotive suggestions.
        </p>
      </div>

      {/* Stats Counter & Dynamic Metric */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-pink-500 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase font-mono tracking-wider font-semibold">Average Event Demand</div>
            <div className="text-xl font-extrabold text-white tracking-tight mt-0.5">{avgDemand} / 10</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase font-mono tracking-wider font-semibold">Total Event Opinions</div>
            <div className="text-xl font-extrabold text-white tracking-tight mt-0.5">{totalComments} Submissions</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase font-mono tracking-wider font-semibold">Forum Status</div>
            <div className="text-xl font-extrabold text-white tracking-tight mt-0.5 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              Live & Open
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Dynamic GTA style settings categories & Speak form */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-black/60 border border-white/5 rounded-2xl p-6 relative">
            <h4 className="text-lg font-black text-white mb-4 font-display uppercase tracking-wide flex items-center gap-2 border-b border-white/10 pb-3">
              <Sparkles className="w-4 h-4 text-pink-500" /> DISPATCH INPUTS
            </h4>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div onMouseEnter={() => setHoveredField('name')}>
                <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 mb-1.5 label-required">
                  Name / Handle
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Thabo 'Piston' Kgosi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-all font-sans"
                />
              </div>

              <div onMouseEnter={() => setHoveredField('emailAddress')}>
                <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 mb-1.5 label-required">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. thabo@stance.bw"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-all font-sans"
                />
              </div>

              <div onMouseEnter={() => setHoveredField('vibe_select')}>
                <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 mb-1.5 label-required">
                  Your Opinion Category
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {(Object.keys(VIBE_META) as Array<keyof typeof VIBE_META>).map((key) => {
                    const vibeObj = VIBE_META[key];
                    const isSelected = selectedVibe === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          sounds.playSelect();
                          setSelectedVibe(key);
                        }}
                        onMouseEnter={() => {
                          sounds.playHover();
                          setHoveredField(key);
                        }}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left text-[11px] transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-white text-black border-white font-bold shadow-[0_0_12px_rgba(255,255,255,0.25)] translate-x-1.5' 
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

              {/* 1 to 10 Demand Scale */}
              <div onMouseEnter={() => setHoveredField('hype_rating')}>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 label-required">
                    Hype Rating
                  </label>
                  <span className="text-[10px] font-mono font-bold bg-pink-500/10 text-pink-400 px-1.5 py-0.5 rounded">
                    {userDemandLevel}/10
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1 mt-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
                    const isSelected = userDemandLevel === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          sounds.playSelect();
                          storage.trackClick(`btn-demand-level-select-${num}`);
                          setUserDemandLevel(num);
                        }}
                        onMouseEnter={() => sounds.playHover()}
                        className={`h-7 rounded font-mono text-xs font-black transition-all border flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'bg-pink-500 text-white border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.35)] scale-105'
                            : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div onMouseEnter={() => setHoveredField('thought')}>
                <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400 mb-1.5 label-required">
                  Your Thought / Suggestion
                </label>
                <textarea
                  required
                  rows={3}
                  maxLength={400}
                  placeholder="Would you attend? Nominations for artists/gamers?"
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-all font-sans resize-none leading-relaxed"
                />
              </div>

              <AnimatePresence mode="wait">
                {isSuccess && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] flex items-center gap-2 font-mono"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3px] shrink-0" />
                    DISPATCHED BROADCAST SUCCESSFULLY!
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full cursor-pointer py-3.5 px-4 rounded-xl bg-white hover:bg-pink-500 text-black hover:text-white font-black text-xs uppercase tracking-widest font-display transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'DISPATCHING...' : 'DISPATCH EVENT OPINION'}
              </button>
            </form>
          </div>

          {/* HELP COMPASS BOX */}
          <div className="bg-black/95 border-t-2 border-[#ec4899] p-4 font-mono text-[11px] text-gray-300 leading-relaxed rounded-b-lg shadow-2xl relative">
            <div className="absolute top-0 right-4 -translate-y-1/2 bg-[#ec4899] text-white text-[9px] font-bold px-2 py-0.5 rounded tracking-widest uppercase">
              HELP COMPASS
            </div>
            <p className="text-gray-400">
              {formHelpMap[hoveredField] || VIBE_META[hoveredField as keyof typeof VIBE_META]?.helpText || 'COMMUNITY HARMONY: Fill out credentials and express your opinion to affect Gaborone event zoning.'}
            </p>
          </div>
        </div>

        {/* Right Side: public feed with filters */}
        <div 
          className="lg:col-span-7 flex flex-col h-full min-h-[500px]"
          onMouseEnter={() => setHoveredField('forum')}
        >
          {/* Vibe filter filters resembling GTA settings categories */}
          <div className="flex flex-wrap items-center gap-1.5 mb-4 bg-black/40 border border-white/5 p-2 rounded-xl">
            <button
              onClick={() => handleFilterClick('all')}
              onMouseEnter={() => sounds.playHover()}
              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white text-black shadow-md font-black'
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
                  onClick={() => handleFilterClick(key)}
                  onMouseEnter={() => sounds.playHover()}
                  className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                    isActive
                      ? 'bg-white text-black shadow-md font-black'
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
          <div className="relative flex-1 rounded-2xl bg-black/40 border border-white/5 p-4 sm:p-5 overflow-y-auto max-h-[550px] scrollbar-thin scrollbar-thumb-white/10">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-pink-500 animate-spin" />
                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Accessing forum records...</span>
              </div>
            ) : filteredComments.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <AlertCircle className="w-10 h-10 text-gray-600 mb-3" />
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider font-mono">NO ENTRIES IN PROTOCOL</span>
                <p className="text-[11px] text-gray-500 max-w-xs mt-1 font-light leading-relaxed">
                  Be the first to share your creative thoughts, stance car ideas, or esports tournament demands!
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
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
                        className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all relative group"
                      >
                        <div className="flex justify-between items-start gap-4 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded bg-pink-500/10 flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-purple-400" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-white font-display leading-tight">{comment.name}</div>
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
                            <div className={`px-2 py-0.5 rounded border text-[9px] font-mono uppercase tracking-wider flex items-center gap-1 ${meta.colorClass}`}>
                              {meta.icon}
                              {comment.vibe}
                            </div>
                            <div className="text-[8px] font-mono font-black py-0.5 px-1.5 rounded bg-white/5 border border-white/10 text-cyan-400 flex items-center gap-1">
                              HYPE: <span className="text-pink-500 font-bold">{comment.demandLevel || 10}/10</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs font-light text-gray-300 leading-relaxed font-sans pre-line">
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
