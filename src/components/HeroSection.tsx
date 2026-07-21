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
  VolumeX,
  Lock
} from 'lucide-react';
import { storage } from '../lib/storage';
import { sounds } from '../lib/sounds';


interface HeroSectionProps {
  onRegisterClick: () => void;
  onPartnerClick: () => void;
  onFeedbackClick?: () => void;
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

  const handleMusicToggle = () => {
    sounds.playSelect();
    const playing = sounds.toggleMusic();
    setIsMusicPlaying(playing);
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-between pt-24 pb-6 px-4 sm:px-12 overflow-hidden bg-[#030107]">
      
      {/* 1. Full-screen ambient cyber gradient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#ec4899]/15 blur-[120px] animate-pulse-subtle" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/15 blur-[120px] animate-pulse-subtle" />
        <div className="absolute top-[30%] left-[25%] w-[45%] h-[45%] rounded-full bg-purple-600/10 blur-[140px] animate-pulse-subtle" />
      </div>
      
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
        
        {/* Left Column: Player Hub Passports Panel (Premium, Ultra-clean, Non-redundant) */}
        <div className="lg:col-span-5 relative overflow-hidden rounded-2xl border border-white/10 p-6 bg-black/60 backdrop-blur-md shadow-2xl group transition-all duration-300 hover:border-pink-500/30 hover:shadow-[0_0_35px_rgba(236,72,153,0.25)]">
          
          {/* Subtle Pink/Cyan glowing overlays */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-cyan-500/10 opacity-40 group-hover:opacity-80 transition-opacity duration-300 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80 z-0 pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="space-y-1">
              <span className="text-xs uppercase font-extrabold tracking-[0.25em] text-[#ec4899] font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> OFFICIAL REGISTRATION DESK
              </span>
              <h1 className="text-4xl sm:text-5xl font-black font-display tracking-tight text-white uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                PLAYFEST<span className="text-cyan-400 font-normal">2026</span>
              </h1>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed font-light">
              Welcome to Gaborone’s biggest digital and mechanical playground. Grab your free RSVP spot to participate in cash esport brackets, tuner showcase meets, and priority entry pass draws.
            </p>

            {/* Core Action Gateway: Simple, direct, beautifully polished */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  sounds.playSelect();
                  onRegisterClick();
                }}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 font-display font-black text-xs uppercase tracking-widest text-white shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.55)] hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
                <span>SECURE FREE RSVP TICKET</span>
                <ChevronRight className="w-4 h-4 text-white" />
              </button>

              <button
                onClick={() => {
                  sounds.playSelect();
                  if (onAdminClick) onAdminClick();
                }}
                className="w-full py-3 px-6 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/35 hover:bg-white/10 text-gray-400 hover:text-white font-display font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5 text-gray-500" />
                <span>ORGANIZER / ADMIN PORTAL</span>
              </button>
            </div>

            {/* Contextual Status Help Box */}
            <div className="bg-black/85 border-t-2 border-[#ec4899] p-4 font-mono text-[11px] text-gray-300 leading-relaxed rounded-b-lg shadow-2xl relative">
              <div className="absolute top-0 right-4 -translate-y-1/2 bg-[#ec4899] text-white text-[9px] font-bold px-2 py-0.5 rounded tracking-widest uppercase">
                GUEST PERK
              </div>
              <p className="text-gray-400">
                🎁 COMPLETING RSVP AUTOMATICALLY ENTERS YOU INTO OUR VIP ENTRY DRAWINGS • 100% FREE INTRODUCTORY SLOTS
              </p>
            </div>
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

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
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
        </div>

        {/* HUD Guide tips footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-white/5 text-[10px] font-mono text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
              ● REAL-TIME METRIC TRANSMISSION IN PROGRESS
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
