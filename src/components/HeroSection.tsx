/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, MapPin, Users, Gamepad2, Car, Store, ChevronDown } from 'lucide-react';
import { storage } from '../lib/storage';

interface HeroSectionProps {
  onRegisterClick: () => void;
  onPartnerClick: () => void;
  stats: {
    total: number;
    cities: number;
    gamers: number;
    cars: number;
    vendors: number;
  };
}

export default function HeroSection({ onRegisterClick, onPartnerClick, stats }: HeroSectionProps) {
  // Real-time Countdown Timer target: Oct 17, 2026
  const targetDate = new Date('2026-10-17T12:00:00-07:00').getTime();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

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

  const handleRegisterCTA = () => {
    storage.trackClick('btn-register-hero');
    onRegisterClick();
  };

  const handlePartnerCTA = () => {
    storage.trackClick('btn-become-partner');
    onPartnerClick();
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-between pt-24 pb-8 px-4 overflow-hidden">
      {/* Background Neon Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-pink-600/15 rounded-full blur-[100px] pointer-events-none animate-glow-slow-1 z-0" />
      <div className="absolute top-1/3 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animate-glow-slow-2 z-0" />
      <div className="absolute bottom-10 right-1/4 w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-purple-600/15 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Palm Tree Silhouettes Custom SVG Graphic */}
      <div className="absolute bottom-0 left-0 right-0 h-48 opacity-10 bg-gradient-to-t from-purple-950 to-transparent pointer-events-none z-0">
        <svg
          viewBox="0 0 1440 320"
          className="absolute bottom-0 w-full h-full scale-y-110"
          preserveAspectRatio="none"
        >
          <path
            fill="#000000"
            d="M0,288L48,272C96,256,192,224,288,218.7C384,213,480,235,576,218.7C672,203,768,149,864,138.7C960,128,1056,160,1152,176C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
          {/* Silhouettes of palms using beautiful paths */}
          <path
            fill="#05020c"
            d="M80,320 Q95,200 40,150 Q105,170 120,320 M800,320 Q815,180 870,120 Q800,160 800,320 M1200,320 Q1180,220 1230,170 Q1160,190 1200,320"
          ></path>
        </svg>
      </div>

      {/* Real Skyline Backdrop */}
      <div className="absolute bottom-0 inset-x-0 h-28 bg-[linear-gradient(to_top,#05020c_20%,transparent)] pointer-events-none z-0 border-b border-purple-500/10" />

      {/* Hero Central Content */}
      <div className="w-full max-w-4xl mx-auto text-center z-10 flex-1 flex flex-col justify-center items-center px-4 mt-8 sm:mt-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-3"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest bg-gradient-to-r from-pink-500/20 to-purple-600/20 border border-pink-500/30 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
            <Calendar className="w-3.5 h-3.5" /> Gaborone, Botswana • November 2026
          </span>
        </motion.div>

        {/* Large Logo */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-6xl sm:text-7xl md:text-8xl font-display font-extrabold tracking-tighter uppercase select-none relative"
        >
          <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent filter drop-shadow-[0_0_30px_rgba(236,72,153,0.3)]">
            PlayFest
          </span>
          <span className="text-white block sm:inline ml-0 sm:ml-4 font-normal text-glow-cyan text-4xl sm:text-5xl md:text-6xl tracking-normal align-middle">
            2026
          </span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="font-display text-lg sm:text-2xl font-semibold tracking-wide text-cyan-400 text-glow-cyan uppercase mt-3 mb-4"
        >
          Cars. Gaming. Culture. One Community.
        </motion.p>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-sm sm:text-lg text-gray-300 max-w-xl mx-auto leading-relaxed font-light mb-8"
        >
          Help shape Botswana’s premier gaming, car culture, music, and lifestyle festival by registering your interest today. 
        </motion.p>

        {/* Dual Actions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center mb-12"
        >
          <button
            id="register-cta-hero"
            onClick={handleRegisterCTA}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-display font-bold text-white uppercase tracking-wider shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:shadow-[0_0_35px_rgba(236,72,153,0.7)] transform hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            Register Your Interest
          </button>
          <button
            id="partner-cta-hero"
            onClick={handlePartnerCTA}
            className="px-8 py-4 rounded-xl bg-glassmorphism hover:bg-glassmorphism-light border border-white/10 hover:border-cyan-500/40 text-glow-cyan font-display font-bold text-cyan-400 uppercase tracking-wider hover:text-white transform hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            Become a Partner
          </button>
        </motion.div>

        {/* Countdown Ticker Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md w-full p-4 rounded-2xl bg-glassmorphism border border-white/5 backdrop-blur-xl shadow-2xl relative mb-12-not-necessary"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/10 to-pink-500/10 rounded-2xl blur opacity-30 pointer-events-none" />
          
          <div className="text-center p-2 rounded-lg bg-black/40">
            <div className="text-xl sm:text-3xl font-bold font-mono text-pink-500 text-glow-pink">
              {String(timeLeft.days).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest font-semibold mt-1">Days</div>
          </div>
          
          <div className="text-center p-2 rounded-lg bg-black/40">
            <div className="text-xl sm:text-3xl font-bold font-mono text-cyan-400 text-glow-cyan">
              {String(timeLeft.hours).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest font-semibold mt-1">Hours</div>
          </div>
          
          <div className="text-center p-2 rounded-lg bg-black/40">
            <div className="text-xl sm:text-3xl font-bold font-mono text-purple-400 text-glow-purple">
              {String(timeLeft.minutes).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest font-semibold mt-1">Min</div>
          </div>
          
          <div className="text-center p-2 rounded-lg bg-black/40">
            <div className="text-xl sm:text-3xl font-bold font-mono text-white">
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest font-semibold mt-1">Sec</div>
          </div>
        </motion.div>
      </div>

      {/* Live Demographic Counters Strip */}
      <div className="w-full max-w-5xl mx-auto z-10 px-2 mt-8">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 max-w-full">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-glassmorphism border border-white/5 relative group hover:border-pink-500/20 transition-all">
            <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-500">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-sm font-light text-gray-400">Registrants</div>
              <div className="text-lg sm:text-xl font-bold font-display text-white tracking-tight">{stats.total}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-glassmorphism border border-white/5 relative group hover:border-cyan-500/20 transition-all">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-500">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 z-10" />
            </div>
            <div>
              <div className="text-sm font-light text-gray-400">Botswana Cities</div>
              <div className="text-lg sm:text-xl font-bold font-display text-white tracking-tight">{stats.cities}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-glassmorphism border border-white/5 relative group hover:border-purple-500/20 transition-all">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600">
              <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-sm font-light text-gray-400">Gamers RSVP</div>
              <div className="text-lg sm:text-xl font-bold font-display text-white tracking-tight">{stats.gamers}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-glassmorphism border border-white/5 relative group hover:border-pink-500/20 transition-all">
            <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-400">
              <Car className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-sm font-light text-gray-400">Car Builds</div>
              <div className="text-lg sm:text-xl font-bold font-display text-white tracking-tight">{stats.cars}</div>
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 flex items-center gap-3 p-3.5 rounded-xl bg-glassmorphism border border-white/5 relative group hover:border-cyan-500/20 transition-all">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Store className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-sm font-light text-gray-400">Vendors Applied</div>
              <div className="text-lg sm:text-xl font-bold font-display text-white tracking-tight">{stats.vendors}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="z-10 mt-6 animate-bounce text-gray-400 cursor-pointer" onClick={onRegisterClick}>
        <ChevronDown className="w-6 h-6" />
      </div>
    </section>
  );
}
