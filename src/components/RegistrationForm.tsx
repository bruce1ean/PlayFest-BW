/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Gamepad2, 
  Car, 
  CheckCircle2, 
  Loader2, 
  ArrowRight, 
  Sparkles,
  Lock,
  Music,
  ShoppingBag,
  Calendar,
  Gift
} from 'lucide-react';
import { AttendeeRegistration } from '../types';
import { storage } from '../lib/storage';
import { sounds } from '../lib/sounds';
import { registerUser } from '../lib/firebase';

interface RegistrationFormProps {
  onSuccess: (data: AttendeeRegistration) => void;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export default function RegistrationForm({ onSuccess, addToast }: RegistrationFormProps) {
  const [submitting, setSubmitting] = useState(false);
  
  // --- Streamlined Attendee State ---
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [ageGroup, setAgeGroup] = useState('18–24');
  
  // Passions/Interests
  const [passions, setPassions] = useState<string[]>([]);
  
  // Conditional: Car Specs
  const [carMakeModel, setCarMakeModel] = useState('');
  const [carDisplay, setCarDisplay] = useState<'Yes' | 'No'>('Yes');

  // Conditional: Gaming Specs
  const [gamingPlatform, setGamingPlatform] = useState<'PC' | 'PlayStation' | 'Xbox' | 'Nintendo' | 'Mobile'>('PlayStation');
  const [gamingTourney, setGamingTourney] = useState<'Yes' | 'No'>('Yes');
  const [gamingGames, setGamingGames] = useState('');

  // VIP / Early Access Perks Choice
  const [vipPerkInterest, setVipPerkInterest] = useState(true);

  // Optional Speak Your Mind Comment
  const [userComment, setUserComment] = useState('');

  const togglePassion = (value: string) => {
    sounds.playHover();
    setPassions((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Core Validations
    if (!fullName.trim() || !email.trim() || !phone.trim() || !city.trim()) {
      sounds.playCancel();
      addToast('Please fill out all required fields.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      sounds.playCancel();
      addToast('Please enter a valid email address.', 'error');
      return;
    }

    // Conditional validations
    if (passions.includes('car_meet') && !carMakeModel.trim()) {
      sounds.playCancel();
      addToast('Please specify your vehicle details for the Car Meet.', 'error');
      return;
    }

    if (passions.includes('gaming') && !gamingGames.trim()) {
      sounds.playCancel();
      addToast('Please specify your favorite competitive games.', 'error');
      return;
    }

    setSubmitting(true);
    
    // Default hidden passwords to make RSVP seamless
    const fallbackPassword = 'playfest2026';

    try {
      // 1. Attempt Firebase Auth registration in background (non-blocking)
      registerUser(email.trim(), fallbackPassword)
        .then((userCred) => {
          console.log('Firebase Auth background registration succeeded:', userCred.user?.uid);
        })
        .catch((authErr) => {
          console.log('Firebase Auth helper skipped/fallback:', authErr.code || authErr);
        });

      // Map interests
      const interestsToSend = passions.length > 0 ? passions : ['General Interest'];

      // Construct compatible payload matching AttendeeRegistration
      const payload: Omit<AttendeeRegistration, 'id' | 'createdAt'> = {
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phone.trim(),
        city: city.trim(),
        ageGroup: ageGroup,
        country: 'Botswana',
        gender: 'Prefer not to say',
        attendanceLikelihood: 'Definitely',
        groupSize: 'Just Me',
        travelDistance: 'Within my city',
        referralSource: 'Instagram',
        interests: interestsToSend,
        approximateSpend: 'P200–P500',
        vipInterest: vipPerkInterest ? 'Yes' : 'No',
        merchInterest: 'Maybe',
        earlyTicketAccess: vipPerkInterest ? 'Yes' : 'No',
      };

      // Add conditional specs if selected
      if (passions.includes('gaming')) {
        payload.gamingDetails = {
          platform: gamingPlatform,
          favoriteGames: gamingGames.trim() || 'Multiple competitive games',
          participateInTournaments: gamingTourney === 'Yes' ? 'Yes' : 'No',
          preferredCategories: ['Fighting', 'Sim Racing', 'FPS']
        };
      }

      if (passions.includes('car_meet')) {
        const parts = carMakeModel.trim().split(' ');
        const make = parts[0] || 'Custom';
        const model = parts.slice(1).join(' ') || 'Tuner';
        
        payload.carDetails = {
          vehicleMake: make,
          vehicleModel: model,
          year: '2026',
          buildType: 'Custom Tuner',
          modifications: 'Showcase Build',
          displayVehicle: carDisplay,
          enterCompetitions: carDisplay
        };
      }

      // 2. Save registration in Cloud/Local Storage
      const result = await storage.saveRegistration(payload);

      // Save credentials locally as a silent helper
      try {
        await (storage as any).saveFallbackCredential(email.trim(), fallbackPassword);
      } catch (credErr) {
        // Soft fail
      }

      // 3. Save comment to Bulletin Board if filled
      if (userComment.trim()) {
        try {
          await storage.saveConceptComment({
            name: fullName.trim(),
            email: email.trim(),
            comment: userComment.trim(),
            vibe: 'stoked',
            demandLevel: 10
          });
        } catch (commentErr) {
          console.warn('Comment upload skipped:', commentErr);
        }
      }

      // Success Callback
      onSuccess(result);
    } catch (err: any) {
      addToast(err.message || 'Error completing registration. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-12 px-4 relative max-w-3xl mx-auto z-10" id="registration-section">
      {/* Background radial soft light blobs */}
      <div className="absolute top-1/4 right-5 w-72 h-72 bg-pink-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-5 w-72 h-72 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Simplified Header */}
      <div className="text-center mb-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-1.5 font-mono">
          Priority Portal
        </h2>
        <h3 className="text-2xl sm:text-4xl font-extrabold font-display uppercase tracking-tight text-white">
          Secure Your Free <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 filter drop-shadow-[0_0_12px_rgba(236,72,153,0.3)] font-black">RSVP Pass</span>
        </h3>
        <p className="text-gray-400 max-w-lg mx-auto mt-2.5 text-xs sm:text-sm font-light leading-relaxed">
          Lock in your priority notification alerts, and stand a chance to win a free VIP Pass and surprise giveaways. Simple, secure, and completed in 15 seconds.
        </p>
      </div>

      {/* Streamlined Single Page Form */}
      <div className="rounded-2xl bg-glassmorphism border border-white/5 shadow-xl relative overflow-hidden p-5 sm:p-8">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-60" />
        
        <form onSubmit={handleFormSubmit} className="space-y-6 text-left">
          
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold font-display uppercase tracking-wider text-white border-b border-white/5 pb-2 flex items-center gap-2">
              <span className="p-1 rounded bg-pink-500/10 text-pink-400"><User className="w-3.5 h-3.5" /></span>
              1. Contact Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-1 font-mono">
                  Full Name <span className="text-pink-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Thabo Motsamai"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-1 font-mono">
                  Email Address <span className="text-pink-500">*</span>
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. thabo@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-1 font-mono">
                  Phone Number <span className="text-pink-500">*</span>
                </label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +267 71 234 567"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-1 font-mono">
                    City / Town <span className="text-pink-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Gaborone"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-1 font-mono">
                    Age Group <span className="text-pink-500">*</span>
                  </label>
                  <select
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0e0a1b] border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm cursor-pointer"
                  >
                    <option value="Under 18">Under 18</option>
                    <option value="18–24">18–24</option>
                    <option value="25–34">25–34</option>
                    <option value="35–44">35–44</option>
                    <option value="45+">45+</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Choose Passions */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold font-display uppercase tracking-wider text-white border-b border-white/5 pb-2 flex items-center gap-2">
              <span className="p-1 rounded bg-cyan-500/10 text-cyan-400"><Sparkles className="w-3.5 h-3.5" /></span>
              2. Choose Your Passions (Select All That Apply)
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: 'gaming', label: 'Gaming / Esports', icon: <Gamepad2 className="w-4 h-4" /> },
                { key: 'car_meet', label: 'Car Showcase', icon: <Car className="w-4 h-4" /> },
                { key: 'live_music', label: 'Live DJs / Music', icon: <Music className="w-4 h-4" /> },
                { key: 'vendors', label: 'Food & Merch', icon: <ShoppingBag className="w-4 h-4" /> },
              ].map((item) => {
                const selected = passions.includes(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => togglePassion(item.key)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      selected
                        ? "bg-pink-500/10 border-pink-500 text-pink-300"
                        : "bg-black/30 border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <span className={selected ? "text-pink-400" : "text-gray-500"}>
                      {item.icon}
                    </span>
                    <span className="text-xs font-semibold tracking-wide">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Conditional Sub-sections with high elegance */}
            <AnimatePresence>
              {passions.includes('car_meet') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-black/25 border border-white/5 space-y-3 mt-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-pink-400">
                      <Car className="w-3.5 h-3.5" />
                      <span>Automotive Tuner Showcase Registration</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-semibold uppercase text-gray-400 mb-1">
                          Vehicle Year, Make & Model <span className="text-pink-500">*</span>
                        </label>
                        <input
                          type="text"
                          required={passions.includes('car_meet')}
                          value={carMakeModel}
                          onChange={(e) => setCarMakeModel(e.target.value)}
                          placeholder="e.g. 2004 Nissan 350Z"
                          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-pink-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold uppercase text-gray-400 mb-1">
                          Do you want to display this vehicle at the show?
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setCarDisplay('Yes')}
                            className={`flex-1 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider cursor-pointer ${
                              carDisplay === 'Yes' ? 'bg-pink-500/15 border-pink-500 text-pink-400' : 'bg-black/25 border-white/5 text-gray-400'
                            }`}
                          >
                            Yes, Exhibit
                          </button>
                          <button
                            type="button"
                            onClick={() => setCarDisplay('No')}
                            className={`flex-1 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider cursor-pointer ${
                              carDisplay === 'No' ? 'bg-pink-500/15 border-pink-500 text-pink-400' : 'bg-black/25 border-white/5 text-gray-400'
                            }`}
                          >
                            No, Spectating
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {passions.includes('gaming') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-black/25 border border-white/5 space-y-3 mt-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      <Gamepad2 className="w-3.5 h-3.5" />
                      <span>Esports & Tournament Signups</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[9px] font-semibold uppercase text-gray-400 mb-1">
                          Favorite Games <span className="text-pink-500">*</span>
                        </label>
                        <input
                          type="text"
                          required={passions.includes('gaming')}
                          value={gamingGames}
                          onChange={(e) => setGamingGames(e.target.value)}
                          placeholder="e.g. Tekken 8, FIFA/FC 24, Assetto Corsa"
                          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:outline-none focus:border-pink-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold uppercase text-gray-400 mb-1">
                          Gaming Platform
                        </label>
                        <select
                          value={gamingPlatform}
                          onChange={(e) => setGamingPlatform(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-lg bg-[#0e0a1b] border border-white/10 text-white focus:outline-none text-xs cursor-pointer"
                        >
                          <option value="PlayStation">PlayStation</option>
                          <option value="PC">PC Masters</option>
                          <option value="Xbox">Xbox</option>
                          <option value="Nintendo">Nintendo Switch</option>
                          <option value="Mobile">Mobile legends</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section 3: VIP Perks choices */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-pink-500/5 to-purple-500/5 border border-pink-500/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-pink-500/15 text-pink-400">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold uppercase text-white tracking-wide">
                    VIP Pass Giveaway & Early Updates
                  </h5>
                  <p className="text-[10px] text-gray-400 font-light">
                    Join the priority alert line and get entry to the free VIP Pass draw.
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => {
                  sounds.playHover();
                  setVipPerkInterest(!vipPerkInterest);
                }}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                  vipPerkInterest ? 'bg-pink-500' : 'bg-gray-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  vipPerkInterest ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          {/* Section 4: Optional Idea comments */}
          <div className="space-y-2">
            <label className="block text-[10px] font-semibold uppercase text-gray-400 tracking-wider font-mono">
              Ideas / Suggestions (Optional)
            </label>
            <textarea
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              placeholder="Tell us what DJs, games, or food stalls you want to see at PlayFest 2026..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm resize-none"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-display font-bold text-xs uppercase tracking-widest text-white hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>SECURING PASS...</span>
                </>
              ) : (
                <>
                  <span>CONFIRM FREE RSVP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </section>
  );
}
