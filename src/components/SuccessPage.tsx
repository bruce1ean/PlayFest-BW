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
  MapPin,
  ChevronRight
} from 'lucide-react';
import { storage } from '../lib/storage';
import { sounds } from '../lib/sounds';
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
  const [hoveredField, setHoveredField] = useState<string>('ticket');

  const name = registeredDetails?.fullName || registeredDetails?.businessName || 'Friend';
  const city = registeredDetails?.city || 'Gaborone';
  const idBadge = registeredDetails?.id || `PF-${Math.floor(Math.random() * 9000 + 1000)}`;
  
  // Calculate dynamic entry label
  let priority = 'General Entry & Prize Draw';
  if (registrationType === 'vendor') {
    priority = 'Approved Partner Waitlist';
  } else if (registeredDetails?.vipInterest === 'Yes' || registeredDetails?.vipInterest === 'Maybe') {
    priority = 'VIP Pass Giveaway Entry';
  } else if (registeredDetails?.earlyTicketAccess === 'Yes') {
    priority = 'Early Access Priority Waitlist';
  }

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
    sounds.playSelect();
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleAccessToken(result.accessToken);
        sounds.playSuccess();
        addToast('Connected with Google Calendar safely!', 'success');
      }
    } catch (err: any) {
      console.error(err);
      sounds.playCancel();
      addToast(err.message || 'Google account link failed.', 'error');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    sounds.playSelect();
    try {
      await googleLogout();
      setGoogleUser(null);
      setGoogleAccessToken(null);
      setIsCalendarAdded(false);
      sounds.playSuccess();
      addToast('Google account disconnected.', 'info');
    } catch (err: any) {
      sounds.playCancel();
      addToast('Logout action failed.', 'error');
    }
  };

  const handleAddToCalendar = async () => {
    if (!googleAccessToken) {
      sounds.playCancel();
      addToast('Please login with your Google account first.', 'error');
      return;
    }

    const confirmAdd = window.confirm(
      `Would you like to authorize PlayFest to add the 3-day event "PlayFest 2026 Botswana 🇧🇼" (Nov 20-22, 2026) directly to your Google Calendar?`
    );
    if (!confirmAdd) {
      sounds.playCancel();
      return;
    }

    setIsCalendarAdding(true);
    sounds.playSelect();
    try {
      await addPlayFestEventToCalendar(googleAccessToken, {
        name,
        serial: idBadge
      });
      setIsCalendarAdded(true);
      sounds.playSuccess();
      addToast('Successfully added PlayFest 2026 to your Google Calendar!', 'success');
    } catch (err: any) {
      console.error(err);
      sounds.playCancel();
      addToast('Scheduling failed. Please verify grant permissions.', 'error');
    } finally {
      setIsCalendarAdding(false);
    }
  };

  const messageOptions = [
    {
      label: '🏁 Hot Lap / Car Culture',
      text: `🎟️ Just registered for PlayFest 2026 Botswana and entered the draw to win free VIP passes & other giveaways! Gaborone's ultimate car culture, gaming arena, & lifestyle festival is going to be legendary. Save your spot free to win! 🇧🇼 #PlayFest2026 #Botswana ${window.location.origin}`
    },
    {
      label: '🎮 Esports / Gamer Arena',
      text: `🎮 Tournament ready! I registered for PlayFest 2026 Esports & Gaming Hub in Botswana and entered the free VIP Pass giveaway. RSVP is 100% free right now, register to win: ${window.location.origin} 🇧🇼 #Esports #PlayFest`
    },
    {
      label: '✨ VIP Pass Giveaway Entry',
      text: `✨ I am officially registered for PlayFest 2026 Gaborone and entered to win a free VIP Pass! Botswana's premier music, custom stances, gaming, and lifestyle festival is finally here. Register free and stand to win! 🇧🇼 ${window.location.origin}`
    }
  ];

  const shareText = messageOptions[activeMessageIndex].text;

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
  };

  const handleShareClick = (platform: 'whatsapp' | 'twitter') => {
    storage.trackClick(`btn-share-${platform}`);
    sounds.playSelect();
    window.open(shareLinks[platform], '_blank', 'noreferrer,noopener');
    addToast(`Sharing via ${platform === 'whatsapp' ? 'WhatsApp' : 'X (formerly Twitter)'}!`, 'success');
  };

  const copyInviteLink = () => {
    storage.trackClick('btn-share-copy');
    sounds.playSelect();
    navigator.clipboard.writeText(shareText);
    setCopiedStatus(true);
    sounds.playSuccess();
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
      return <Car className="w-5 h-5 text-pink-500" />;
    }
    if (interestsList.includes('gaming')) {
      return <Gamepad2 className="w-5 h-5 text-purple-400" />;
    }
    if (interestsList.includes('music')) {
      return <Music className="w-5 h-5 text-cyan-400" />;
    }
    return <Flame className="w-5 h-5 text-red-400" />;
  };

  const helpMap: Record<string, string> = {
    ticket: 'VERIFIED PLAYFEST ENTRY PASS: This is your dynamic Gaborone digital badge. Protect your Serial Number. It secures your slot in our VIP Pass draw & waitlists.',
    calendar: 'SYNCHRONIZE TO GOOGLE CALENDAR: Integrate PlayFest 2026 (Nov 20-22, 2026) directly with your personal Google Agenda to stay alerted on venue releases.',
    share: 'SHARE STATUS & GAIN INFLUENCE: Amplify PlayFest across WhatsApp or X to secure priority waitlist points and unlock secret automotive tuning updates.',
    return: 'RETURN TO MAIN CONSOLE: Exit the secure entry dispatch portal and navigate back to the primary PlayFest Botswana landing console.'
  };

  return (
    <div className="min-h-screen bg-[#030107] py-24 px-4 sm:px-12 relative flex flex-col justify-between overflow-hidden font-sans">
      
      {/* Background radial gradient */}
      <div className="absolute inset-0 bg-radial-at-t from-purple-950/10 via-black to-black pointer-events-none z-0" />
      
      {/* GTA Scanlines texture */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] opacity-10 z-10" />

      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto relative z-20 items-start">
        
        {/* Left Side: Dynamic GTA style settings categories */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-1">
            <span className="text-xs uppercase font-extrabold tracking-[0.25em] text-[#ec4899] font-mono flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> ENTRY DISPATCH CONFIRMED
            </span>
            <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white uppercase">
              SEAT SECURED<span className="text-pink-500 font-normal">.INI</span>
            </h1>
          </div>

          <div className="space-y-2 border-l-2 border-white/5 pl-2 select-none">
            <button
              onClick={() => {
                sounds.playSelect();
                setHoveredField('ticket');
              }}
              onMouseEnter={() => {
                sounds.playHover();
                setHoveredField('ticket');
              }}
              className={`w-full text-left py-3 px-4 rounded-lg font-display text-xs font-black tracking-widest uppercase transition-all duration-150 flex items-center justify-between border cursor-pointer ${
                hoveredField === 'ticket'
                  ? 'bg-white text-black border-white translate-x-3 shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                  : 'bg-black/50 hover:bg-black/75 text-gray-400 border-white/5 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <ChevronRight className={`w-3.5 h-3.5 ${hoveredField === 'ticket' ? 'text-[#ec4899]' : 'opacity-0'}`} />
                VIEW PASS DETAILS
              </span>
            </button>

            <button
              onClick={() => {
                sounds.playSelect();
                setHoveredField('calendar');
              }}
              onMouseEnter={() => {
                sounds.playHover();
                setHoveredField('calendar');
              }}
              className={`w-full text-left py-3 px-4 rounded-lg font-display text-xs font-black tracking-widest uppercase transition-all duration-150 flex items-center justify-between border cursor-pointer ${
                hoveredField === 'calendar'
                  ? 'bg-white text-black border-white translate-x-3 shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                  : 'bg-black/50 hover:bg-black/75 text-gray-400 border-white/5 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <ChevronRight className={`w-3.5 h-3.5 ${hoveredField === 'calendar' ? 'text-[#ec4899]' : 'opacity-0'}`} />
                GOOGLE CALENDAR SYNC
              </span>
            </button>

            <button
              onClick={() => {
                sounds.playSelect();
                setHoveredField('share');
              }}
              onMouseEnter={() => {
                sounds.playHover();
                setHoveredField('share');
              }}
              className={`w-full text-left py-3 px-4 rounded-lg font-display text-xs font-black tracking-widest uppercase transition-all duration-150 flex items-center justify-between border cursor-pointer ${
                hoveredField === 'share'
                  ? 'bg-white text-black border-white translate-x-3 shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                  : 'bg-black/50 hover:bg-black/75 text-gray-400 border-white/5 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <ChevronRight className={`w-3.5 h-3.5 ${hoveredField === 'share' ? 'text-[#ec4899]' : 'opacity-0'}`} />
                SHARE & PRIZE DRAW
              </span>
            </button>

            <button
              onClick={() => {
                sounds.playSelect();
                onBackToHome();
              }}
              onMouseEnter={() => {
                sounds.playHover();
                setHoveredField('return');
              }}
              className={`w-full text-left py-3 px-4 rounded-lg font-display text-xs font-black tracking-widest uppercase transition-all duration-150 flex items-center justify-between border cursor-pointer ${
                hoveredField === 'return'
                  ? 'bg-[#ec4899] text-white border-[#ec4899] translate-x-3 shadow-[0_0_20px_rgba(236,72,153,0.4)]'
                  : 'bg-black/50 hover:bg-black/75 text-pink-400 border-white/5 hover:text-pink-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <ChevronRight className={`w-3.5 h-3.5 ${hoveredField === 'return' ? 'text-white' : 'opacity-0'}`} />
                RETURN TO WEB CONSOLE
              </span>
            </button>
          </div>

          {/* HELP COMPASS BOX */}
          <div className="bg-black/95 border-t-2 border-[#ec4899] p-4 font-mono text-[11px] text-gray-300 leading-relaxed rounded-b-lg shadow-2xl relative">
            <div className="absolute top-0 right-4 -translate-y-1/2 bg-[#ec4899] text-white text-[9px] font-bold px-2 py-0.5 rounded tracking-widest uppercase">
              HELP COMPASS
            </div>
            <p className="text-gray-400">
              {helpMap[hoveredField] || 'SEAT DISPATCH: View your certified PlayFest Botswana entry passes or schedule directly onto your secure personal calendar.'}
            </p>
          </div>
        </div>

        {/* Right Side: Detailed Info Display Sheets */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* TICKET CARD DISPLAY */}
          <div 
            className="bg-black/60 border border-white/5 p-6 rounded-2xl backdrop-blur-md shadow-2xl relative"
            onMouseEnter={() => setHoveredField('ticket')}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
                LOBBY BADGE ACCESS / WAITLIST
              </span>
              <span className="text-[10px] font-mono text-[#ec4899] font-bold">
                {registrationType === 'attendee' ? 'ATTENDEE LOCKED' : 'PARTNER LOGGED'}
              </span>
            </div>

            {/* Custom Dynamic Ticket / VIP Pass Component */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 p-5 sm:p-6 shadow-inner">
              <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-gradient-to-b from-cyan-500/10 to-[#ec4899]/10 rounded-full blur-[30px] pointer-events-none" />
              
              <div className="flex justify-between items-start border-b border-white/10 pb-3 mb-4">
                <div>
                  <span className="text-[9px] font-mono tracking-widest text-[#ec4899] font-black block uppercase">OFFICIAL LOBBY ACCESS</span>
                  <span className="text-sm sm:text-lg font-bold font-display text-white tracking-wider uppercase">PLAYFEST 2026</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg">
                  {getInterestIcon()}
                  <span className="text-[9px] font-mono text-gray-300 font-bold uppercase tracking-wider">
                    {registrationType === 'attendee' ? 'RSVP' : 'PARTNER'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div>
                    <span className="text-[8px] uppercase font-mono text-gray-500 block">PLAYER HANDLE</span>
                    <span className="text-sm font-semibold text-white truncate block">{name}</span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase font-mono text-gray-500 block">DESTINATION STATION</span>
                    <span className="text-xs text-gray-300 flex items-center gap-1 font-mono font-medium mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-pink-500" />
                      {city}, BW
                    </span>
                  </div>
                </div>

                <div className="space-y-2 sm:text-right flex flex-col justify-between items-start sm:items-end">
                  <div>
                    <span className="text-[8px] uppercase font-mono text-gray-500 block">ACCESS QUALITY</span>
                    <span className="text-xs text-cyan-400 font-mono font-bold uppercase tracking-wide">
                      {priority}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase font-mono text-gray-500 block">SERIAL NO</span>
                    <span className="text-xs text-pink-400 font-mono font-bold">
                      {idBadge}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-dashed border-white/10 pt-4 mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1 opacity-60">
                  <div className="h-6 w-[2px] bg-white" />
                  <div className="h-6 w-[3px] bg-[#ec4899]" />
                  <div className="h-6 w-[1px] bg-white" />
                  <div className="h-6 w-[2px] bg-white" />
                  <div className="h-6 w-[4px] bg-cyan-400" />
                  <div className="h-6 w-[1px] bg-white" />
                  <div className="h-6 w-[2px] bg-white" />
                  <div className="h-6 w-[3px] bg-white" />
                  <div className="h-6 w-[1px] bg-white" />
                  <div className="h-6 w-[4px] bg-[#ec4899]" />
                </div>
                <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">
                  VERIFIED ORIGINAL
                </span>
              </div>
            </div>
          </div>

          {/* CALENDAR SYNC SHEET */}
          <div 
            className="bg-black/60 border border-white/5 p-5 rounded-2xl backdrop-blur-md shadow-2xl relative"
            onMouseEnter={() => setHoveredField('calendar')}
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-white">
                GOOGLE CALENDAR DISPATCH
              </span>
            </div>
            
            <p className="text-xs text-gray-400 mb-4 leading-relaxed font-light">
              Add the official 3-day PlayFest 2026 Gaborone scheduling directly to your personal calendar grid to keep updated on stance, venue coordinates and esports schedules.
            </p>

            {!googleAccessToken ? (
              <button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-pink-500 text-black hover:text-white font-display font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2.5 shadow-md cursor-pointer hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12.24 10.285V14.4h6.887a5.555 5.555 0 0 1-2.4 3.665l3.77 2.925c2.203-2.03 3.472-5.016 3.472-8.56a12.593 12.593 0 0 0-.21-2.145H12.24Z" />
                  <path fill="#4285F4" d="M12.24 24c3.24 0 5.95-1.075 7.93-2.915l-3.77-2.925c-1.045.7-2.385 1.115-3.93 1.115-3.03 0-5.59-2.045-6.51-4.8l-3.9 3.015C4.03 21.09 7.79 24 12.24 24Z" />
                  <path fill="#34A853" d="M5.73 14.475a7.11 7.11 0 0 1 0-4.59l-3.9-3.015a11.96 11.96 0 0 0 0 10.62l3.9-3.015Z" />
                  <path fill="#FBBC05" d="M12.24 4.8c1.765 0 3.35.61 4.595 1.795l3.435-3.435C18.19 1.19 15.48 0 12.24 0 7.79 0 4.03 2.91 2.06 6.87l3.9 3.015c.92-2.755 3.48-4.8 6.51-4.8Z" />
                </svg>
                {isSigningIn ? 'CONNECTING...' : 'CONNECT GOOGLE CALENDAR'}
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
                    <div className="text-xs font-semibold text-white truncate max-w-[150px]">
                      {googleUser?.displayName || 'Google Account'}
                    </div>
                    <button 
                      onClick={handleSignOut} 
                      className="text-[9px] text-[#ec4899] hover:text-pink-400 transition-colors font-mono uppercase block mt-0.5 cursor-pointer hover:underline"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>

                {isCalendarAdded ? (
                  <div className="py-2.5 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-black font-mono tracking-widest flex items-center justify-center gap-1.5 self-start sm:self-center">
                    <Check className="w-3.5 h-3.5 stroke-[3px]" /> SCHEDULING SUCCESS!
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCalendar}
                    disabled={isCalendarAdding}
                    className="py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[10px] uppercase tracking-widest font-display transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isCalendarAdding ? 'SCHEDULING...' : 'ADD FESTIVAL CALENDAR EVENT'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* SOCIAL SHARING SHEET */}
          <div 
            className="bg-black/60 border border-white/5 p-5 rounded-2xl backdrop-blur-md shadow-2xl relative"
            onMouseEnter={() => setHoveredField('share')}
          >
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="w-4 h-4 text-pink-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-white">
                PRIZE DRAW SHARING STATION
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {messageOptions.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    sounds.playSelect();
                    setActiveMessageIndex(i);
                  }}
                  className={`py-2 px-1 rounded-lg text-[9px] font-bold tracking-wide transition-all uppercase cursor-pointer ${
                    activeMessageIndex === i 
                      ? 'bg-[#ec4899] text-white shadow-[0_0_10px_rgba(236,72,153,0.3)]' 
                      : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
                  }`}
                >
                  {opt.label.split(' ')[0]} {opt.label.split(' ')[1]}
                </button>
              ))}
            </div>

            <div className="relative group rounded-xl bg-black/60 border border-white/10 p-4 text-left mb-4">
              <div className="text-[8px] uppercase font-mono text-purple-400 font-black tracking-widest mb-1">
                DISPATCH PITCH
              </div>
              <p className="text-xs font-light text-gray-300 font-sans leading-relaxed break-words">
                {shareText}
              </p>
              <div className="mt-2 flex justify-end">
                <button
                  onClick={copyInviteLink}
                  className="text-[9px] flex items-center gap-1 hover:text-pink-400 text-cyan-400 font-semibold font-mono transition-colors cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  {copiedStatus ? 'COPIED TO CLIPBOARD!' : 'COPY DISPATCH STATUS'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleShareClick('whatsapp')}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider font-display transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Smartphone className="w-4 h-4 text-white" />
                WhatsApp Share
              </button>
              <button
                onClick={() => handleShareClick('twitter')}
                className="py-3 px-4 rounded-xl bg-[#1DA1F2] hover:bg-[#40b5f5] text-white text-xs font-black uppercase tracking-wider font-display transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Send className="w-4 h-4 text-white" />
                Share on X
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Retro Keybind Legend Footer */}
      <div className="max-w-6xl mx-auto w-full relative z-20 mt-12 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-[10px] font-mono text-gray-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">CLICK CATEGORY</span> NAVIGATE
          </span>
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">HOVER</span> UPDATE COMPASS
          </span>
        </div>
        <div>
          OFFICIALLY WAITLISTED AT PLAYFEST2026.BW • DESIGNED MOBILE-FIRST
        </div>
      </div>

    </div>
  );
}
