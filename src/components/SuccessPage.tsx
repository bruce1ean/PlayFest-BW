/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Share2, 
  Check, 
  User, 
  ArrowLeft, 
  Heart, 
  Send, 
  Sparkles, 
  Copy, 
  Smartphone, 
  Calendar, 
  Tag, 
  Car, 
  Gamepad2, 
  Music, 
  Flame,
  Award,
  Badge,
  MapPin
} from 'lucide-react';
import { storage } from '../lib/storage';

interface SuccessPageProps {
  registrationType: 'attendee' | 'vendor';
  registeredDetails: any;
  onBackToHome: () => void;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export default function SuccessPage({ registrationType, registeredDetails, onBackToHome, addToast }: SuccessPageProps) {
  const [copiedStatus, setCopiedStatus] = useState(false);
  
  // Custom message variations to toggle
  const [activeMessageIndex, setActiveMessageIndex] = useState(0);

  const name = registeredDetails?.fullName || registeredDetails?.businessName || 'Friend';
  const city = registeredDetails?.city || 'Gaborone';
  const idBadge = registeredDetails?.id || `PF-${Math.floor(Math.random() * 9000 + 1000)}`;
  const priority = registeredDetails?.ticketPriority || 'General Access RSVP';

  const messageOptions = [
    {
      label: '🏁 Hot Lap / Car Culture',
      text: `🎟️ Just locked in my VIP Waitlist for PlayFest 2026 Botswana! Gaborone's ultimate car culture, gaming arena, & lifestyle festival is going to be legendary. Save your spot free! 🇧🇼 #PlayFest2026 #Botswana ${window.location.origin}`
    },
    {
      label: '🎮 Esports / Gamer Arena',
      text: `🎮 Tournament ready! I registered for PlayFest 2026 Esports & Gaming Hub in Botswana. RSVP is 100% free right now, join me on the priority line: ${window.location.origin} 🇧🇼 #Esports #PlayFest`
    },
    {
      label: '✨ Elite VIP Pass (Default)',
      text: `✨ I am officially waitlisted for PlayFest 2026 Gaborone! Botswana's premier music, custom stances, gaming, and lifestyle festival is finally here. Claim your free access pass too! 🇧🇼 ${window.location.origin}`
    }
  ];

  const shareText = messageOptions[activeMessageIndex].text;

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
  };

  const handleShareClick = (platform: 'whatsapp' | 'twitter') => {
    storage.trackClick(`btn-share-${platform}`);
    window.open(shareLinks[platform], '_blank', 'noreferrer,noopener');
    addToast(`Sharing via ${platform === 'whatsapp' ? 'WhatsApp' : 'X (formerly Twitter)'}!`, 'success');
  };

  const copyInviteLink = () => {
    storage.trackClick('btn-share-copy');
    navigator.clipboard.writeText(shareText);
    setCopiedStatus(true);
    addToast('Cool! Sharing status copied to clipboard.', 'success');
    setTimeout(() => setCopiedStatus(false), 2500);
  };

  // Determine Primary Interest Badge Icon
  const getInterestIcon = () => {
    if (registrationType === 'vendor') {
      return <Award className="w-5 h-5 text-yellow-400" />;
    }
    const interestsList = registeredDetails?.interests || [];
    if (interestsList.includes('car_meet')) {
      return <Car className="w-5 h-5 text-pink-500 animate-pulse" />;
    }
    if (interestsList.includes('gaming')) {
      return <Gamepad2 className="w-5 h-5 text-purple-400" />;
    }
    if (interestsList.includes('music')) {
      return <Music className="w-5 h-5 text-cyan-400" />;
    }
    return <Flame className="w-5 h-5 text-red-400" />;
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 z-10 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-2xl mx-auto rounded-3xl bg-glassmorphism border border-white/10 p-6 sm:p-10 text-center shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400" />

        {/* Success check ring */}
        <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.4)] mb-5">
          <Check className="w-7 h-7 text-white stroke-[3px]" />
        </div>

        <h3 className="text-2xl sm:text-3xl font-black font-display uppercase tracking-tight text-white mb-1.5">
          Seat Secured, You Are <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 text-glow-pink">Confirmed!</span>
        </h3>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase font-bold tracking-widest text-cyan-400 font-mono mb-6">
          <Sparkles className="w-3 h-3 text-pink-500" />
          {registrationType === 'attendee' ? 'Attendee Registry RSVP Locked' : 'Partner Vendor Application Logged'}
        </div>

        {/* Custom Dynamic Ticket / VIP Pass component block */}
        <div className="mb-8 relative" id="share-pass-card">
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#05020c] rounded-full border-r border-white/10 z-10" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#05020c] rounded-full border-l border-white/10 z-10" />
          
          <div className="w-full rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/10 p-5 sm:p-7 relative text-left overflow-hidden shadow-inner">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-gradient-to-b from-cyan-500/10 to-pink-500/10 rounded-full blur-[30px] pointer-events-none" />
            
            {/* Ticket Header */}
            <div className="flex justify-between items-start border-b border-white/10 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-pink-500 uppercase font-black block">OFFICIAL ENTRY ACCESS</span>
                <span className="text-base sm:text-xl font-bold font-display text-white tracking-wide uppercase">PLAYFEST 2026</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                {getInterestIcon()}
                <span className="text-[9px] font-mono text-gray-300 font-bold uppercase tracking-wider">
                  {registrationType === 'attendee' ? 'RSVP' : 'PARTNER'}
                </span>
              </div>
            </div>

            {/* Ticket Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-3">
                <div>
                  <div className="text-[9px] uppercase font-mono text-gray-400">WAITLISTEE NAME</div>
                  <div className="text-sm sm:text-base font-semibold text-white truncate">{name}</div>
                </div>

                <div>
                  <div className="text-[9px] uppercase font-mono text-gray-400">DESTINATION STATION</div>
                  <div className="text-xs text-gray-200 flex items-center gap-1 font-medium mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-pink-500" />
                    {city}, Botswana
                  </div>
                </div>
              </div>

              <div className="space-y-3 sm:text-right flex flex-col sm:justify-between h-full">
                <div className="sm:self-end">
                  <div className="text-[9px] uppercase font-mono text-gray-400 sm:text-right">ACCESS QUALITY</div>
                  <div className="text-xs text-cyan-400 font-mono font-bold mt-0.5 uppercase tracking-wide">
                    {priority}
                  </div>
                </div>

                <div className="sm:self-end">
                  <div className="text-[9px] uppercase font-mono text-gray-400 sm:text-right">SERIAL NO</div>
                  <div className="text-xs text-gray-300 font-mono font-medium mt-0.5">
                    {idBadge}
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Neon Barcode */}
            <div className="border-t border-dashed border-white/10 pt-4 flex items-center justify-between gap-4">
              <div className="flex-1 flex items-center gap-[2.5px] opacity-70">
                <div className="h-7 w-[2px] bg-white/40" />
                <div className="h-7 w-[3px] bg-pink-500/60" />
                <div className="h-7 w-[1px] bg-white/20" />
                <div className="h-7 w-[2px] bg-white/40" />
                <div className="h-7 w-[4px] bg-cyan-400/60" />
                <div className="h-7 w-[1px] bg-white/20" />
                <div className="h-7 w-[2px] bg-white/40" />
                <div className="h-7 w-[3px] bg-white/30" />
                <div className="h-7 w-[1px] bg-white/20" />
                <div className="h-7 w-[4px] bg-purple-500/50" />
                <div className="h-7 w-[1px] bg-white/20" />
                <div className="h-7 w-[2px] bg-white/40" />
                <div className="h-7 w-[2px] bg-white/40" />
                <div className="h-7 w-[3px] bg-cyan-400/40" />
                <div className="h-7 w-[1px] bg-white/20" />
                <div className="h-7 w-[4px] bg-white/60" />
                <div className="h-7 w-[2px] bg-white/40" />
                <div className="h-7 w-[1px] bg-white/25" />
                <div className="h-7 w-[3px] bg-pink-500/40" />
                <div className="h-7 w-[1px] bg-white/20" />
                <div className="h-7 w-[2px] bg-white/40" />
              </div>
              <div className="text-[8px] font-mono text-gray-500 text-right uppercase tracking-[0.2em]">
                VERIFIED PLAYFEST ORIGINAL
              </div>
            </div>
          </div>
        </div>

        {/* Share Component Section */}
        <div className="border-t border-white/5 pt-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300 font-mono flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-pink-500" /> Share Status & Get Priority Point
            </span>
            <span className="text-[10px] text-gray-500 font-mono">Select Pitch Style</span>
          </div>

          {/* Social Pitch Style Switcher */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {messageOptions.map((opt, i) => (
              <button
                key={i}
                onClick={() => {
                  storage.trackClick(`btn-share-toggle-pitch-${i}`);
                  setActiveMessageIndex(i);
                }}
                className={`py-1.5 px-1 rounded-lg text-[10px] font-semibold tracking-wide transition-all uppercase cursor-pointer ${
                  activeMessageIndex === i 
                    ? 'bg-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.3)]' 
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                {opt.label.split(' ')[0]} {opt.label.split(' ')[1]}
              </button>
            ))}
          </div>

          {/* Custom Editable Status Preview Display */}
          <div className="relative group rounded-xl bg-black/60 border border-white/10 p-3 sm:p-4 text-left mb-5">
            <div className="text-[9px] uppercase font-mono text-purple-400 font-black tracking-widest mb-1.5">SOCIAL POST PREVIEW</div>
            <p className="text-xs font-light text-gray-300 font-sans leading-relaxed break-words line-clamp-3">
              {shareText}
            </p>
            <div className="mt-2.5 flex justify-end border-t border-white/5 pt-2">
              <button
                onClick={copyInviteLink}
                className="text-[10px] flex items-center gap-1.5 hover:text-pink-400 text-cyan-400 font-semibold font-mono transition-colors cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                {copiedStatus ? 'COPIED!' : 'COPY DISPATCH STATUS'}
              </button>
            </div>
          </div>

          {/* Direct Platform Launcher Buttons */}
          <div className="grid grid-cols-2 gap-3.5">
            <button
              onClick={() => handleShareClick('whatsapp')}
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider font-display transition-all shadow-[0_4px_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2 cursor-pointer group"
            >
              <Smartphone className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
              WhatsApp Share
            </button>
            <button
              onClick={() => handleShareClick('twitter')}
              className="py-3 px-4 rounded-xl bg-[#1DA1F2] hover:bg-[#40b5f5] active:bg-[#1a8cd8] text-white text-xs font-black uppercase tracking-wider font-display transition-all shadow-[0_4px_15px_rgba(29,161,242,0.2)] flex items-center justify-center gap-2 cursor-pointer group"
            >
              <Send className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
              Share on X
            </button>
          </div>
        </div>

        {/* Return Button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={onBackToHome}
            className="px-6 py-3 rounded-xl border border-white/10 hover:border-pink-500/30 text-gray-400 hover:text-white transition-all text-xs font-black font-display uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer bg-white/[0.02]"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Website
          </button>
        </div>

        <div className="mt-7 flex items-center justify-center gap-1.5 text-[9px] text-gray-500 font-mono uppercase tracking-widest">
          <Heart className="w-3 h-3 text-pink-500 animate-pulse" /> Officially waitlisted at playfest2026.bw
        </div>
      </motion.div>
    </div>
  );
}
