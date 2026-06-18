/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ChevronDown, ChevronUp, MessageSquare, Quote } from 'lucide-react';

export default function TestimonialsFAQ() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const testimonials = [
    {
      name: 'Kabelo "StanceBW" Phiri',
      role: 'Automotive Enthusiast & Tuner',
      comment: 'Botswana’s automotive culture has been waiting for an exclusive, highly organized event like PlayFest. Bringing customization lifestyle, esports, and music together under neon city lights is the dream combo.',
      rating: 5,
      avatar: '🚗'
    },
    {
      name: 'Lesedi "LexiPlay" Tau',
      role: 'Esports Athlete & Streamer',
      comment: 'Finally, a festival that prioritizes official brackets and tournaments with real setups! Botswana has insanely passionate gamers looking for high-tier arenas to showcase their skills.',
      rating: 5,
      avatar: '🎮'
    },
    {
      name: 'Tumelo "DJ Flame" Letsholo',
      role: 'Local electronic DJ & Producer',
      comment: 'The music, car, and gaming worlds are deeply connected in Botswana. This lifestyle synergy is going to draw massive crowds. I cannot wait to stand behind the decks with glowing state laser rigs!',
      rating: 5,
      avatar: '🎵'
    }
  ];

  const faqs = [
    {
      q: 'What is PlayFest 2026?',
      a: 'PlayFest 2026 is Botswana’s upcoming premier gaming, car culture, music, and lifestyle festival inspired by neon city nightlife, custom automotive styling, esports tournaments, and local community sounds.'
    },
    {
      q: 'Is registration free?',
      a: 'Yes, registration is 100% completely free! It is simply an audience registration stage to measure demographic sizes, activity interest, and geographical distribution to prepare for an incredible festival.'
    },
    {
      q: 'Does registering guarantee a ticket?',
      a: 'No. Registering your interest does not guarantee a ticket, but it puts you on the exclusive VIP Priority List, granting you direct 6-hour early-access priority notifications and discount rates when ticket slots officially open.'
    },
    {
      q: 'When will tickets become available?',
      a: 'Organizers plan to release early-bird batches once venue capacity counts and sponsor-funded prize targets are fully locked in. All registrants will receive an instant email and SMS notice.'
    },
    {
      q: 'Can businesses register now?',
      a: 'Yes! Local brands, developers, food trucks, and craft producers can submit a vendor proposal directly through the "Brand & Vendor" tab in our Registration Hub to save stall space.'
    },
    {
      q: 'Can I display my car?',
      a: 'Absolutely! If you select "Car Showcase & Meet" under interests on the registration page, you can enter your vehicle technical statistics and optional photo. Our staging committees review and invite builds.'
    },
    {
      q: 'When will tournament games be announced?',
      a: 'Preliminary titles (like FIFA, Tekken, and Racing sims) are already on the calendar, with exact console choices and competitive rulebooks releasing 6 weeks before the event.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <section className="py-20 px-4 relative max-w-6xl mx-auto z-10" id="faq">
      {/* Testimonials */}
      <div className="mb-24">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold uppercase tracking-widest text-pink-400 text-glow-pink mb-2 font-display">
            The Buzz
          </h2>
          <h3 className="text-3xl sm:text-5xl font-extrabold font-display uppercase tracking-tight text-white">
            Community <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 text-glow-purple">Voices</span>
          </h3>
          <p className="text-gray-400 max-w-xl mx-auto mt-3 text-sm font-light">
            Here is what esports champions, automotive tuners, and local lifestyle creators expect from PlayFest 2026.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((test, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-glassmorphism border border-white/5 relative group hover:border-pink-500/20 transition-all duration-300 flex flex-col justify-between"
            >
              <Quote className="absolute top-4 right-4 w-12 h-12 text-pink-500/5 rotate-18" />
              
              <div>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: test.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-pink-500 text-pink-500" />
                  ))}
                </div>
                
                <p className="text-sm text-gray-300 leading-relaxed font-light italic mb-6">
                  "{test.comment}"
                </p>
              </div>

              <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg select-none">
                  {test.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white font-display">{test.name}</div>
                  <div className="text-xs text-gray-400">{test.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Accordion */}
      <div>
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400 text-glow-cyan mb-2 font-display">
            Got Questions?
          </h2>
          <h3 className="text-3xl sm:text-5xl font-extrabold font-display uppercase tracking-tight text-white">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 text-glow-cyan">Answers</span>
          </h3>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFAQ === idx;
            return (
              <div
                key={idx}
                className="rounded-xl bg-glassmorphism border border-white/5 overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full p-5 text-left flex justify-between items-center gap-4 text-glow-cyan hover:text-white transition-colors cursor-pointer"
                >
                  <span className="font-display font-medium text-white text-sm sm:text-base">
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-pink-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-cyan-400 shrink-0" />
                  )}
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="p-5 pt-0 border-t border-white/5 text-xs sm:text-sm text-gray-400 leading-relaxed font-light">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
