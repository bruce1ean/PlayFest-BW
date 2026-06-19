/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { 
  initAuth, 
  googleSignIn, 
  logout as googleLogout, 
  addPlayFestEventToCalendar 
} from '../lib/googleCalendar';

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

  // Google Calendar Auth States
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isCalendarAdding, setIsCalendarAdding] = useState(false);
  const [isCalendarAdded, setIsCalendarAdded] = useState(false);

  const name = registeredDetails?.fullName || registeredDetails?.businessName || 'Friend';
  const city = registeredDetails?.city || 'Gaborone';
  const idBadge = registeredDetails?.id || `PF-${Math.floor(Math.random() * 9000 + 1000)}`;
  const priority = registeredDetails?.ticketPriority || 'General Access RSVP';

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleAccessToken(result.accessToken);
        addToast('Connected with Google Calendar safely!', 'success');
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Google account link failed.', 'error');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleLogout();
      setGoogleUser(null);
      setGoogleAccessToken(null);
      setIsCalendarAdded(false);
      addToast('Google account disconnected.', 'info');
    } catch (err: any) {
      addToast('Logout action failed.', 'error');
    }
  };

  const handleAddToCalendar = async () => {
    if (!googleAccessToken) {
      addToast('Please login with your Google account first.', 'error');
      return;
    }

    // Explicit confirmation dialog (mandated by Workspace mutated/created data constraints)
    const confirmAdd = window.confirm(
      `Would you like to authorize PlayFest to add the 3-day event "PlayFest 2026 Botswana 🇧🇼" (Nov 20-22, 2026) directly to your Google Calendar?`
    );
    if (!confirmAdd) return;

    setIsCalendarAdding(true);
    try {
      await addPlayFestEventToCalendar(googleAccessToken, {
        name,
        serial: idBadge
      });
      setIsCalendarAdded(true);
      addToast('Successfully added PlayFest 2026 to your Google Calendar!', 'success');
    } catch (err: any) {
      console.error(err);
      addToast('Scheduling failed. Please verify grant permissions.', 'error');
    } finally {
      setIsCalendarAdding(false);
    }
  };

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
                  <div className="text-xs text-secondary font-mono font-medium mt-0.5">
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

        {/* Google Calendar Add Event Integration */}
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/5 text-left relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h4 className="text-xs sm:text-sm font-semibold tracking-wide text-white uppercase font-display flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-cyan-400" /> Sync to Google Calendar
              </h4>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-1 font-light leading-relaxed">
                Add PlayFest 2026 Botswana (November 20-22, 2026) directly to your calendar to receive event updates, waitlist status, and dynamic RSVP reminders.
              </p>
            </div>
          </div>

          {!googleAccessToken ? (
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 border border-white/10 transition-all cursor-pointer shadow-md"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887a5.555 5.555 0 0 1-2.4 3.665l3.77 2.925c2.203-2.03 3.472-5.016 3.472-8.56a12.593 12.593 0 0 0-.21-2.145H12.24Z" />
                <path fill="#4285F4" d="M12.24 24c3.24 0 5.95-1.075 7.93-2.915l-3.77-2.925c-1.045.7-2.385 1.115-3.93 1.115-3.03 0-5.59-2.045-6.51-4.8l-3.9 3.015C4.03 21.09 7.79 24 12.24 24Z" />
                <path fill="#34A853" d="M5.73 14.475a7.11 7.11 0 0 1 0-4.59l-3.9-3.015a11.96 11.96 0 0 0 0 10.62l3.9-3.015Z" />
                <path fill="#FBBC05" d="M12.24 4.8c1.765 0 3.35.61 4.595 1.795l3.435-3.435C18.19 1.19 15.48 0 12.24 0 7.79 0 4.03 2.91 2.06 6.87l3.9 3.015c.92-2.755 3.48-4.8 6.51-4.8Z" />
              </svg>
              {isSigningIn ? 'Connecting google account...' : 'Connect Google Calendar'}
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-black/40 p-3 rounded-xl border border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-white/5 flex items-center justify-center">
                  {googleUser?.photoURL ? (
                    <img 
                      src={googleUser.photoURL} 
                      alt={googleUser.displayName || 'OAuth Account'} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <User className="w-4 h-4 text-cyan-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white truncate max-w-[160px] sm:max-w-[200px]">
                    {googleUser?.displayName || 'Google Account'}
                  </div>
                  <button 
                    onClick={handleSignOut} 
                    className="text-[9px] text-pink-500 hover:text-pink-400 transition-colors font-mono uppercase block mt-0.5 cursor-pointer hover:underline"
                  >
                    Disconnect Access
                  </button>
                </div>
              </div>

              {isCalendarAdded ? (
                <div className="py-2 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-black font-mono tracking-widest flex items-center justify-center gap-1.5 self-start sm:self-center">
                  <Check className="w-3.5 h-3.5 stroke-[3px]" /> ADDED TO CALENDAR!
                </div>
              ) : (
                <button
                  onClick={handleAddToCalendar}
                  disabled={isCalendarAdding}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 override-gradient-cyan to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black text-[10px] uppercase tracking-widest font-display transition-all shadow-[0_4px_15px_rgba(236,72,153,0.25)] cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isCalendarAdding ? 'Scheduling...' : 'Add Festival Calendar Event'}
                </button>
              )}
            </div>
          )}
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
