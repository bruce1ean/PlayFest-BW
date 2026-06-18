/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Gamepad2, 
  Car, 
  Music, 
  Utensils, 
  Store, 
  Video, 
  Camera, 
  Gift, 
  Sparkles, 
  Tag, 
  Cpu, 
  Smile 
} from 'lucide-react';

export default function FestivalAttractions() {
  const attractions = [
    {
      icon: <Gamepad2 className="w-6 h-6 text-pink-500" />,
      title: 'Gaming Tournaments',
      tag: 'Competitive',
      description: 'Massive LAN & console brackets with cash prizes. Show down in fighting games, racing simulators, and mobile battle royale.'
    },
    {
      icon: <Car className="w-6 h-6 text-cyan-400" />,
      title: 'Car Showcase & Meet',
      tag: 'Lifestyle',
      description: 'Botswana’s ultimate custom builds, stance crews, sports luxury supercars, dyno performance, and sound match showcase.'
    },
    {
      icon: <Music className="w-6 h-6 text-purple-400" />,
      title: 'Live DJs & Music',
      tag: 'Entertainment',
      description: 'An electrifying electronic energy stage featuring local Amapiano, Afro-house, and techno icons blasting under ambient laser lights.'
    },
    {
      icon: <Utensils className="w-6 h-6 text-pink-500" />,
      title: 'Food & Drinks',
      tag: 'Hospitality',
      description: 'Gourmet local street grills, smokehouse BBQ, custom mocktails, sweet eats, and premium beverage cooling zones.'
    },
    {
      icon: <Store className="w-6 h-6 text-cyan-400" />,
      title: 'Vendor Marketplace',
      tag: 'Shopping',
      description: 'Shop premium gaming hardware kits, automotive custom merch, streetwear labels, local handcrafted accessories, and novelties.'
    },
    {
      icon: <Video className="w-6 h-6 text-purple-400" />,
      title: 'Content Creator Zone',
      tag: 'Social Media',
      description: 'Meet Botswana’s top streamers, lifestyle vloggers, and gaming influencers recording live and doing fan meet-ups.'
    },
    {
      icon: <Camera className="w-6 h-6 text-pink-500" />,
      title: 'Photography & Media',
      tag: 'Creative',
      description: 'Custom photo booths, futuristic neon tunnel backgrounds, professional action car rigs, and interactive videography stations.'
    },
    {
      icon: <Gift className="w-6 h-6 text-cyan-400" />,
      title: 'Prize Giveaways',
      tag: 'Rewards',
      description: 'Hourly crowd raffle draws, registration number drops, speed challenges, and interactive sponsor goodies giveaways.'
    },
    {
      icon: <Sparkles className="w-6 h-6 text-purple-400" />,
      title: 'Cosplay Showcase',
      tag: 'Fashion Art',
      description: 'Dress up as your favorite gaming or pop-culture character with professional judging panels and custom prizes.'
    },
    {
      icon: <Tag className="w-6 h-6 text-pink-500" />,
      title: 'Local Brands Spotlight',
      tag: 'Community',
      description: 'Celebrating local creators, lifestyle brands, entrepreneurs, and artists pushing Botswana tech and design forward.'
    },
    {
      icon: <Cpu className="w-6 h-6 text-cyan-400" />,
      title: 'Technology Exhibitions',
      tag: 'Innovation',
      description: 'Check out immersive virtual reality rigs, motion simulator simulators, simulator cockpits, and advanced computing setups.'
    },
    {
      icon: <Smile className="w-6 h-6 text-purple-400" />,
      title: 'Family Activities',
      tag: 'All Ages Welcome',
      description: 'Safe simulator rides, casual multiplayer screens, interactive games, photo hubs, and premium shaded resting gardens.'
    }
  ];

  return (
    <section className="py-20 px-4 relative max-w-7xl mx-auto z-10" id="experience">
      {/* Background radial soft light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-16">
        <h2 className="text-sm font-bold uppercase tracking-widest text-pink-400 text-glow-pink mb-2 font-display">
          What is PlayFest?
        </h2>
        <h3 className="text-3xl sm:text-5xl font-extrabold font-display uppercase tracking-tight text-white mb-4">
          Unleash the <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 text-glow-cyan">Experience</span>
        </h3>
        <p className="text-gray-400 max-w-2xl mx-auto text-sm sm:text-base font-light">
          An premium multi-genre collision of high-octane luxury motor tuning, esports, live electronic soundwaves, and interactive local streetwear.
        </p>
      </div>

      {/* Bento Grid layout but clean responsive cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {attractions.map((att, idx) => (
          <div
            key={idx}
            className="group flex flex-col justify-between p-6 rounded-2xl bg-glassmorphism border border-white/5 hover:border-cyan-500/20 transition-all duration-300 hover:-translate-y-1"
          >
            <div>
              {/* Header inside card */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="p-3 rounded-xl bg-white/5 text-white transform group-hover:scale-110 transition-transform duration-300">
                  {att.icon}
                </div>
                <span className="text-[10px] font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-full bg-white/5 text-gray-400 group-hover:text-cyan-400 transition-colors font-mono">
                  {att.tag}
                </span>
              </div>

              {/* Title */}
              <h4 className="text-lg font-bold text-white font-display uppercase tracking-tight mb-2 group-hover:text-pink-400 transition-colors">
                {att.title}
              </h4>

              {/* Description */}
              <p className="text-xs text-gray-400 leading-relaxed font-light">
                {att.description}
              </p>
            </div>

            {/* Glowing bottom line asset */}
            <div className="w-0 group-hover:w-full h-[2px] bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 transition-all duration-500 mt-6" />
          </div>
        ))}
      </div>
    </section>
  );
}
