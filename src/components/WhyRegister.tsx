/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HelpCircle, Star, Shield, Landmark, Trophy, Users, HeartHandshake } from 'lucide-react';

export default function WhyRegister() {
  const reasons = [
    {
      icon: <Users className="w-6 h-6 text-pink-500" />,
      title: 'Estimate Accurate Attendance',
      description: 'Helps us calculate high-fidelity attendance estimates to secure appropriate regional space and manage flow logic.'
    },
    {
      icon: <Star className="w-6 h-6 text-cyan-400" />,
      title: 'Attract Potential Sponsors',
      description: 'High-quality community demographics show commercial power, helping us secure funding for gaming prizes and DJ bookings.'
    },
    {
      icon: <Landmark className="w-6 h-6 text-purple-400" />,
      title: 'Select the Perfect Venue',
      description: 'Provides exact geographic distribution to pick a massive, safe, and easily accessible venue in Gaborone.'
    },
    {
      icon: <Trophy className="w-6 h-6 text-pink-500" />,
      title: 'Organize Big Tournaments',
      description: 'Highlights which platforms (PC, PS5, Xbox, mobile) and esport categories need the biggest tournament setups and prizes.'
    },
    {
      icon: <Shield className="w-6 h-6 text-cyan-400" />,
      title: 'Optimize Space & Logistics',
      description: 'Gives vital insights for securing adequate car showcase parks, vendor stalls, custom setups, and safe crowd operations.'
    },
    {
      icon: <HeartHandshake className="w-6 h-6 text-purple-400" />,
      title: 'Improve Guest Experiences',
      description: 'Ensures we prepare the right food configurations, high-quality audio networks, resting lounges, and lifestyle activities.'
    }
  ];

  return (
    <section className="py-20 px-4 relative max-w-6xl mx-auto z-10">
      {/* Visual Accent Lines */}
      <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      <div className="absolute bottom-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-pink-500/20 to-transparent" />

      {/* Header */}
      <div className="text-center mb-16">
        <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400 text-glow-cyan mb-2 font-display">
          Building the Vision
        </h2>
        <h3 className="text-3xl sm:text-5xl font-extrabold font-display uppercase tracking-tight text-white">
          Why Your Registration <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 filter drop-shadow-[0_0_10px_rgba(236,72,153,0.3)]">Matters</span>
        </h3>
        <p className="text-gray-400 max-w-2xl mx-auto mt-4 text-sm sm:text-base font-light">
          PlayFest 2026 is a community-first movement. Registering your interest gives organizers the metric statistics required to turn this festival from a concept into Botswana's premium lifestyle event.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reasons.map((reason, index) => (
          <div
            key={index}
            className="p-6 rounded-2xl bg-glassmorphism border border-white/5 hover:border-pink-500/20 hover:scale-[1.01] transition-all duration-300 relative group overflow-hidden"
          >
            {/* Hover card ambient back-shimmer */}
            <div className="absolute -inset-0.5 bg-gradient-to-br from-pink-500/10 to-cyan-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            <div className="p-3 w-fit rounded-xl bg-white/5 mb-5 relative z-10">
              {reason.icon}
            </div>
            
            <h4 className="text-lg font-semibold text-white font-display mb-2 relative z-10">
              {reason.title}
            </h4>
            
            <p className="text-sm text-gray-400 leading-relaxed font-light relative z-10">
              {reason.description}
            </p>
          </div>
        ))}
      </div>

      {/* Heavy emphasis free notice Box - Glassmorphic styled */}
      <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-glassmorphism border border-pink-500/20 shadow-[0_0_20px_rgba(236,72,153,0.05)] text-center relative overflow-hidden max-w-4xl mx-auto">
        {/* Subtle pulsating light in background */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-20 bg-pink-500/20 blur-3xl pointer-events-none rounded-full animate-pulse" />
        
        <div className="flex items-center justify-center gap-2.5 mb-2.5">
          <HelpCircle className="w-5 h-5 text-pink-500" />
          <span className="text-xs uppercase font-extrabold tracking-widest text-pink-400 text-glow-pink font-mono">
            FREE & NO STRINGS
          </span>
        </div>

        <p className="text-base sm:text-lg text-white font-medium max-w-2xl mx-auto">
          "Registration is <span className="text-pink-400 font-bold underline decoration-pink-500/40">100% completely free</span> and automatically enters you into our exclusive draws to stand a chance to win a free VIP Pass and future surprise giveaways!"
        </p>

        <p className="text-xs text-gray-400 mt-2 max-w-lg mx-auto font-light">
          Registering doesn't obligate you to buy anything; it keeps you on the priority announcement queue and enters you into our prize giveaways (to be announced in the future).
        </p>
      </div>
    </section>
  );
}
