/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Gamepad2, 
  Car, 
  Store, 
  ChevronRight, 
  Wifi, 
  Clock, 
  Gamepad, 
  Sparkles,
  Info,
  Volume2,
  VolumeX
} from 'lucide-react';
import { storage } from '../lib/storage';
import { sounds } from '../lib/sounds';
// @ts-ignore
import gtaBg from '../assets/images/playfest_gta_bg_1782682995691.jpg';

interface HeroSectionProps {
  onRegisterClick: () => void;
  onPartnerClick: () => void;
  onFeedbackClick?: () => void;
  onLoginClick?: () => void;
  onAdminClick?: () => void;
  stats: {
    total: number;
    cities: number;
    gamers: number;
    cars: number;
    vendors: number;
  };
}

export default function HeroSection({ 
  onRegisterClick, 
  onPartnerClick, 
  onFeedbackClick,
  onLoginClick,
  onAdminClick,
  stats 
}: HeroSectionProps) {
  // Real-time Countdown Timer target: Nov 21, 2026
  const targetDate = new Date('2026-11-21T12:00:00+02:00').getTime();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [focusedIndex, setFocusedIndex] = useState(0);
  const [lastPlayedIndex, setLastPlayedIndex] = useState(0);
  const [systemTime, setSystemTime] = useState('');
  const [ping, setPing] = useState(18);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // Initialize music status
  useEffect(() => {
    setIsMusicPlaying(sounds.getMusicState().isPlaying);
  }, []);

  // Sync / calculate system clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSystemTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulating small realistic ping fluctuations
  useEffect(() => {
    const pingTimer = setInterval(() => {
      setPing(prev => Math.max(14, Math.min(32, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 4000);
    return () => clearInterval(pingTimer);
  }, []);

  // Trigger hover tick whenever selected index moves (both keyboard or mouse hover)
  useEffect(() => {
    if (focusedIndex !== lastPlayedIndex) {
      sounds.playHover();
      setLastPlayedIndex(focusedIndex);
    }
  }, [focusedIndex, lastPlayedIndex]);

  // Countdown calculations
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    {
      id: 'rsvp',
      label: 'REGISTER & WIN VIP PASS',
      description: 'Register now to stand a chance to win a free VIP Pass and participate in exciting giveaways! Registration does not guarantee a VIP pass, but secures your place in our prize draws and priority waitlist.',
      action: () => {
        storage.trackClick('gta-menu-rsvp');
        onRegisterClick();
      }
    },
    {
      id: 'partner',
      label: 'BECOME A PARTNER',
      description: 'Align your business or brand with thousands of Botswana\'s car builders, retro & next-gen gamers, content creators, and lifestyle demographics.',
      action: () => {
        storage.trackClick('gta-menu-partner');
        onPartnerClick();
      }
    },
    {
      id: 'feedback',
      label: 'SPEAK YOUR MIND',
      description: 'Influence event categories, list favorite gaming titles, suggest auto builders, and cast community votes on the live bulletin feedback board.',
      action: () => {
        storage.trackClick('gta-menu-feedback');
        if (onFeedbackClick) onFeedbackClick();
      }
    },
    {
      id: 'login',
      label: 'MY ENTRY / RETRIEVE REGISTRATION',
      description: 'Access your registration details, view your dynamic entry confirmation, or update food & merchant stall setup credentials.',
      action: () => {
        storage.trackClick('gta-menu-login');
        if (onLoginClick) onLoginClick();
      }
    },
    {
      id: 'admin',
      label: 'ORGANIZER PORTAL',
      description: 'Authorized personnel access gateway. Monitor registration trends, city check-ins, vendor approvals, and live bulletin submissions.',
      action: () => {
        storage.trackClick('gta-menu-admin');
        if (onAdminClick) onAdminClick();
      }
    }
  ];

  // Bind Keyboard navigation like a console/GTA game menu!
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % menuItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        sounds.playSelect();
        menuItems[focusedIndex].action();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex]);

  const handleMusicToggle = () => {
    sounds.playSelect();
    const playing = sounds.toggleMusic();
    setIsMusicPlaying(playing);
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-between pt-24 pb-6 px-4 sm:px-12 overflow-hidden bg-[#030107]">
      
      {/* 1. LAYER 1: Full-screen blurred ambient sunset glow (ensures smooth rich filling of the screen) */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 blur-2xl scale-110 pointer-events-none"
        style={{ backgroundImage: `url(${gtaBg})` }}
      />
      
      {/* 2. LAYER 2: Sharp, perfectly contained, zoomed-out backdrop to avoid ANY layout clipping */}
      <div 
        className="absolute inset-0 bg-contain bg-center bg-no-repeat transition-transform duration-[12000ms] scale-95 sm:scale-100 ease-out animate-pulse-subtle pointer-events-none"
        style={{ backgroundImage: `url(${gtaBg})` }}
      />
      
      {/* Gradients to blend text & layout seamlessly with perfect legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-[#030107]/50 z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#030107] via-black/10 to-black/60 z-10" />
      
      {/* Retro scanline & noise textures */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] opacity-15 z-10" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.95)] z-10" />

      {/* 3. Top Bar HUD Panel */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4 font-mono text-[11px] tracking-wider text-gray-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/20 font-bold">
            PLAYFEST MULTIPLAYER LOBBY
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            GABORONE, BOTSWANA
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Wifi className="w-3.5 h-3.5 animate-pulse" />
            ONLINE [ACTIVE]
          </span>
          <span className="text-gray-500">|</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            LOBBY: {systemTime}
          </span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-300">PING: <span className="text-cyan-400 font-bold">{ping}ms</span></span>
          <span className="text-gray-500">|</span>
          
          {/* HIGH-FIDELITY LOBBY MUSIC CONTROLLER */}
          <button 
            onClick={handleMusicToggle}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] uppercase font-bold cursor-pointer transition-all duration-150 ${
              isMusicPlaying 
                ? 'bg-[#ec4899]/10 text-pink-400 border-pink-500/40 hover:bg-[#ec4899]/20' 
                : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            {isMusicPlaying ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#ec4899] animate-pulse" />
                <span className="flex items-end gap-0.5 h-2.5 mr-1">
                  <span className="w-0.5 h-1.5 bg-[#ec4899] animate-[bounce_0.7s_infinite_100ms]" />
                  <span className="w-0.5 h-2.5 bg-[#ec4899] animate-[bounce_0.7s_infinite_300ms]" />
                  <span className="w-0.5 h-1 bg-[#ec4899] animate-[bounce_0.7s_infinite_500ms]" />
                </span>
                <span>SOUNDTRACK: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-gray-500" />
                <span>SOUNDTRACK: OFF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Main Central Row (Grid) */}
      <div className="relative z-20 grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto pt-6 items-start">
        
        {/* Left Column: Menu Items list (GTA V start menu style) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-1">
            <span className="text-xs uppercase font-extrabold tracking-[0.25em] text-[#ec4899] font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> STAGE STARTING MENU
            </span>
            <h1 className="text-4xl sm:text-5xl font-black font-display tracking-tight text-white uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              PLAYFEST<span className="text-cyan-400 font-normal">2026</span>
            </h1>
          </div>

          {/* Interactive Menu Options */}
          <div 
            className="space-y-2 border-l-2 border-white/5 pl-2 select-none"
            onWheel={(e) => {
              if (e.deltaY > 0) {
                setFocusedIndex((prev) => (prev + 1) % menuItems.length);
              } else if (e.deltaY < 0) {
                setFocusedIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
              }
            }}
          >
            {menuItems.map((item, index) => {
              const isFocused = focusedIndex === index;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    sounds.playSelect();
                    item.action();
                  }}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={`w-full text-left py-3.5 px-4 rounded-lg font-display text-sm font-black tracking-widest uppercase transition-all duration-150 flex items-center justify-between border cursor-pointer ${
                    isFocused
                      ? 'bg-white text-black border-white translate-x-3 shadow-[0_0_20px_rgba(255,255,255,0.4)] font-extrabold'
                      : 'bg-black/50 hover:bg-black/75 text-gray-300 border-white/5 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isFocused && <ChevronRight className="w-4 h-4 text-[#ec4899] animate-pulse" />}
                    {item.label}
                  </span>
                  {isFocused && (
                    <span className="text-[10px] font-mono font-bold bg-[#ec4899]/10 text-[#ec4899] px-2 py-0.5 rounded border border-[#ec4899]/20 animate-pulse">
                      SELECT
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Contextual Description Help Box */}
          <div className="bg-black/85 border-t-2 border-[#ec4899] p-4 font-mono text-[11px] text-gray-300 leading-relaxed rounded-b-lg shadow-2xl relative">
            <div className="absolute top-0 right-4 -translate-y-1/2 bg-[#ec4899] text-white text-[9px] font-bold px-2 py-0.5 rounded tracking-widest uppercase">
              HELP COMPASS
            </div>
            <p className="text-gray-400">
              {menuItems[focusedIndex].description}
            </p>
          </div>
        </div>

        {/* Right Column: Dynamic event telemetry card & countdown HUD */}
        <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-6">
          
          {/* Main Title Banner details */}
          <div className="p-6 rounded-2xl bg-black/60 border border-white/5 backdrop-blur-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs uppercase font-bold tracking-widest text-cyan-400 font-mono">
                EVENT DISPATCH
              </span>
              <span className="text-[10px] font-mono text-gray-500">
                REV: 26.11.21
              </span>
            </div>
            
            <p className="text-sm font-light text-gray-300 leading-relaxed">
              PlayFest is Botswana’s premier intersection of high-octane automotive builds, esports arenas, food stalls, sound clashes, and youth culture. We are building Gaborone’s biggest digital and mechanical playground.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex gap-3">
                <Calendar className="w-5 h-5 text-[#ec4899] shrink-0" />
                <div>
                  <div className="text-[11px] font-mono text-gray-500 uppercase">OFFICIAL DATE</div>
                  <div className="text-xs font-bold text-white">November 21, 2026</div>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex gap-3">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="text-[11px] font-mono text-gray-500 uppercase">LOCATION</div>
                  <div className="text-xs font-bold text-white">Gaborone, Botswana</div>
                </div>
              </div>
            </div>
          </div>

          {/* COUNTDOWN HUD PANEL */}
          <div className="p-6 rounded-2xl bg-black/60 border border-white/5 backdrop-blur-md space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ec4899]/5 blur-3xl pointer-events-none rounded-full" />
            
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Info className="w-4 h-4 text-[#ec4899]" />
              <span className="text-xs font-bold uppercase tracking-widest text-gray-300 font-mono">
                LAUNCH SEQUENCE COUNTDOWN
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3 font-mono">
              <div className="text-center p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="text-3xl sm:text-4xl font-black text-[#ec4899] text-glow-pink">
                  {String(timeLeft.days).padStart(2, '0')}
                </div>
                <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mt-1">Days</div>
              </div>
              
              <div className="text-center p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="text-3xl sm:text-4xl font-black text-cyan-400 text-glow-cyan">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mt-1">Hours</div>
              </div>
              
              <div className="text-center p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="text-3xl sm:text-4xl font-black text-purple-400 text-glow-purple">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mt-1">Mins</div>
              </div>
              
              <div className="text-center p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="text-3xl sm:text-4xl font-black text-white">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mt-1">Secs</div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 5. Bottom HUD: Live Server/Lobby Demographic Statistics Ribbon */}
      <div className="relative z-20 mt-6 pt-6 border-t border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Gamepad className="w-4 h-4 text-[#ec4899]" />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 font-bold">
            Live Server Telemetry Statistics
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/60 border border-white/5 hover:border-[#ec4899]/35 transition-all">
            <div className="p-2 rounded-lg bg-[#ec4899]/10 text-[#ec4899]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-gray-500 uppercase">PLAYERS RSVP</div>
              <div className="text-base font-black text-white font-display tracking-tight">{stats.total}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/60 border border-white/5 hover:border-cyan-400/35 transition-all">
            <div className="p-2 rounded-lg bg-cyan-400/10 text-cyan-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-gray-500 uppercase">CITIES REPRESENTED</div>
              <div className="text-base font-black text-white font-display tracking-tight">{stats.cities || 1}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/60 border border-white/5 hover:border-purple-400/35 transition-all">
            <div className="p-2 rounded-lg bg-purple-400/10 text-purple-400">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-gray-500 uppercase">ESPORTS COMPETITORS</div>
              <div className="text-base font-black text-white font-display tracking-tight">{stats.gamers}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/60 border border-white/5 hover:border-[#ec4899]/35 transition-all">
            <div className="p-2 rounded-lg bg-[#ec4899]/10 text-pink-400">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-gray-500 uppercase">TUNER CAR BUILDS</div>
              <div className="text-base font-black text-white font-display tracking-tight">{stats.cars}</div>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 flex items-center gap-3 p-3 rounded-xl bg-black/60 border border-white/5 hover:border-cyan-400/35 transition-all">
            <div className="p-2 rounded-lg bg-cyan-400/10 text-cyan-400">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-gray-500 uppercase">APPROVED VENDORS</div>
              <div className="text-base font-black text-white font-display tracking-tight">{stats.vendors}</div>
            </div>
          </div>
        </div>

        {/* HUD Keybind Guide tips footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-white/5 text-[10px] font-mono text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">↑↓ ARROWS</span> NAVIGATE
            </span>
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">ENTER</span> SELECT
            </span>
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">MOUSE</span> HOVER CHOOSE
            </span>
          </div>
          <div>
            VERSION 1.0.26 (STABLE) • DESIGNED MOBILE-FIRST
          </div>
        </div>
      </div>

    </section>
  );
}
