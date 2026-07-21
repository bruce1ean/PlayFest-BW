/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Send,
  Gamepad2,
  Car,
  Music,
  Star,
  Users
} from 'lucide-react';

import HeroSection from './components/HeroSection';
import WhyRegister from './components/WhyRegister';
import FestivalAttractions from './components/FestivalAttractions';
import RegistrationForm from './components/RegistrationForm';
import TestimonialsFAQ from './components/TestimonialsFAQ';
import ConceptFeedbackBoard from './components/ConceptFeedbackBoard';
import SuccessPage from './components/SuccessPage';
import AdminDashboard from './components/AdminDashboard';
import LoginPage from './components/LoginPage';
import CustomToast, { ToastMessage } from './components/CustomToast';
import playfestLogo from './assets/images/playfest_header_banner_premium_1784061639206.jpg';

import { storage } from './lib/storage';
import { sounds } from './lib/sounds';
import { AttendeeRegistration } from './types';

export default function App() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [viewState, setViewState] = useState<'home' | 'register' | 'success' | 'admin' | 'feedback'>('home');
  
  const [lastSubmissionDetails, setLastSubmissionDetails] = useState<any>(null);

  // Stats Counters
  const [stats, setStats] = useState({
    total: 0,
    cities: 0,
    gamers: 0,
    cars: 0,
    vendors: 0
  });

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribingNews, setSubscribingNews] = useState(false);

  // Add Toast helper
  const addToast = (text: string, type: 'success' | 'error' | 'info') => {
    const newToast: ToastMessage = {
      id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text,
      type
    };
    setToasts((prev) => [...prev, newToast]);
  };

  // Sync / Calc Stats initially
  const syncServerStats = async () => {
    try {
      const allRegs = await storage.getRegistrations();
      
      
      const citiesCount = new Set(allRegs.map((r) => r.city.toLowerCase())).size;
      const gamersCount = allRegs.filter((r) => r.interests.includes('gaming')).length;
      const carsCount = allRegs.filter((r) => r.interests.includes('car_meet')).length;

      setStats({
        total: allRegs.length,
        cities: citiesCount,
        gamers: gamersCount,
        cars: carsCount,
        vendors: 0
      });
    } catch {
      // Soft fail
    }
  };

  useEffect(() => {
    // Record visit analytics
    storage.trackVisit();
    syncServerStats();
  }, []);

  const handleRegisterSuccess = (data: AttendeeRegistration) => {
    
    setLastSubmissionDetails(data);
    setViewState('success');
    sounds.playSuccess();
    syncServerStats();
    addToast('Registration received! Thank you for supporting PlayFest.', 'success');
    
    // Auto Scroll to top for success focus
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    setSubscribingNews(true);
    storage.trackClick('btn-newsletter-subscribe');

    try {
      await storage.subscribeNewsletter(newsletterEmail);
      sounds.playSuccess();
      addToast('Subscribed! You’re on the priority updates queue.', 'success');
      setNewsletterEmail('');
    } catch {
      addToast('Unable to subscribe. Please try again.', 'error');
    } finally {
      setSubscribingNews(false);
    }
  };

  const navigateToRegister = () => {
    storage.trackClick('btn-navigate-register');
    sounds.playSelect();
    setViewState('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToHome = () => {
    sounds.playCancel();
    setViewState('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToFeedback = () => {
    storage.trackClick('btn-navigate-feedback');
    sounds.playSelect();
    setViewState('feedback');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen font-sans bg-[#05020c] text-white">
      
      {/* Dynamic Background Stars Ambient Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#201438,transparent_55%)] pointer-events-none z-0" />
      {/* Navigation Header Banner */}
      <header className="relative w-full bg-black">
        <div className="relative w-full max-w-7xl mx-auto">
          <img 
            src={playfestLogo} 
            alt="PlayFest 2026 Botswana Banner" 
            className="w-full h-auto object-contain select-none block"
            referrerPolicy="no-referrer"
          />

          {/* Invisible floating settings button precisely overlaying the gear icon in the image */}
          <button
            onClick={() => {
              storage.trackClick('btn-admin-gate');
              setViewState(viewState === 'admin' ? 'home' : 'admin');
              sounds.playSelect();
            }}
            className="absolute top-[3%] right-[3%] w-[12%] aspect-square cursor-pointer z-50 bg-transparent border-none outline-none opacity-0"
            title="Organizer Console"
            aria-label="Settings"
          />
        </div>
      </header>

      {/* Premium Glassmorphic Navbar Strip below the header */}
      <div className="w-full bg-[#050509]/95 backdrop-blur-md border-b border-white/5 py-4 px-6 z-30 relative">
        <nav className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-4 sm:gap-10 text-xs font-semibold uppercase tracking-widest text-gray-400">
          {[
            { id: 'home', label: 'Home' },
            { id: 'register', label: 'RSVP Ticket' },
            { id: 'feedback', label: 'Speak Your Mind' }
          ].map((tab) => {
            const isActive = viewState === (tab.id as any);
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'home') navigateToHome();
                  else if (tab.id === 'register') navigateToRegister();
                  else if (tab.id === 'feedback') navigateToFeedback();
                }}
                className={`relative pb-2 cursor-pointer bg-transparent border-0 outline-none transition-colors duration-300 uppercase tracking-widest text-xs font-bold ${
                  isActive 
                    ? 'text-pink-500 text-shadow-[0_0_10px_rgba(236,72,153,0.5)]' 
                    : 'text-gray-400 hover:text-white hover:text-shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                }`}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeHeaderTab"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-pink-500 to-purple-600 shadow-[0_0_8px_rgba(236,72,153,0.8)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Primary Dynamic Main Body Switch */}
      <main className="relative z-10 pt-4">
        <AnimatePresence mode="wait">
          
          {/* VIEW: ADMIN ORGANIZER CONSOLE */}
          {viewState === 'admin' && (
            <motion.div
              key="admin-dashboard-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              <AdminDashboard 
                onClose={() => setViewState('home')} 
                addToast={addToast}
              />
            </motion.div>
          )}

          {/* VIEW: REGISTRATION SUCCESS SCREEN */}
          {viewState === 'success' && (
            <motion.div
              key="success-confirmation-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <SuccessPage
                
                registeredDetails={lastSubmissionDetails}
                onBackToHome={() => setViewState('home')}
                addToast={addToast}
              />
            </motion.div>
          )}

          {/* VIEW: STANDALONE REGISTER STEP FORM */}
          {viewState === 'register' && (
            <motion.div
              key="register-portal-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <RegistrationForm 
                onSuccess={handleRegisterSuccess}
                addToast={addToast}
              />

              {/* FAQs directly on RSVP view for seamless reassurance */}
              <TestimonialsFAQ />

              {/* Footer Block */}
              <footer className="py-16 px-6 sm:px-12 bg-[#04020a] border-t border-white/5 text-gray-400">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] font-mono">
                  <div>© {new Date().getFullYear()} PlayFest Botswana. Standalone Form.</div>
                  <div className="flex gap-4">
                    <a href="https://www.instagram.com/playfestbw?igsh=MTVtc2QxODV2d3FlNQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500">Instagram</a>
                    <a href="#" className="hover:text-pink-500">TikTok</a>
                  </div>
                </div>
              </footer>
            </motion.div>
          )}

          {/* VIEW: REGULAR LANDING PAGE VIEW */}
          {viewState === 'home' && (
            <motion.div
              key="main-landing-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* 1. Hero Block */}
              <HeroSection 
                onRegisterClick={navigateToRegister}
                onPartnerClick={navigateToRegister}
                onFeedbackClick={navigateToFeedback}
                onAdminClick={() => {
                  storage.trackClick('btn-admin-gate');
                  setViewState('admin');
                }}
                stats={stats}
              />

              {/* 2. Why Register */}
              <WhyRegister />

              {/* 3. Attractions Showcase */}
              <FestivalAttractions />

              {/* 4. FAQs Section */}
              <TestimonialsFAQ />



              {/* Footer Block */}
              <footer className="py-16 px-6 sm:px-12 bg-[#04020a] border-t border-white/5 relative z-10 text-gray-400">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
                  
                  {/* Left Column LOGO brand statement */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold font-display">P</div>
                      <span className="font-display font-black text-lg tracking-wider text-white uppercase">PLAYFEST 2026</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed font-light">
                      Botswana's premier gaming, automotive tuning, electronic soundwaves, and lifestyle collision event. Powering digital pop-culture, creators and elite custom garages.
                    </p>
                    <div className="text-xs font-semibold text-white">
                      Email Contact: <a href="mailto:info@playfest2026.bw" className="text-pink-500 hover:underline">info@playfest2026.bw</a>
                    </div>
                  </div>

                  {/* Right column quick newsletter */}
                  <div className="space-y-4 md:col-span-2 flex flex-col md:items-end justify-between">
                    <div className="w-full max-w-sm">
                      <h5 className="text-xs uppercase font-extrabold text-white tracking-widest mb-2 font-mono">
                        Stay Tuned via priority feed
                      </h5>
                      <p className="text-[11px] text-gray-500 mb-4">
                        Join the email queue for Gaborone staging releases and tournament updates. No spam.
                      </p>
                      
                      <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                        <input
                          required
                          type="email"
                          value={newsletterEmail}
                          onChange={(e) => setNewsletterEmail(e.target.value)}
                          placeholder="Your active email"
                          className="flex-1 px-3.5 py-2.5 rounded-lg bg-black/60 border border-white/5 focus:border-pink-500 focus:outline-none text-xs text-white"
                        />
                        <button
                          type="submit"
                          disabled={subscribingNews}
                          className="px-5 rounded-lg bg-purple-600 text-white font-display font-bold text-xs uppercase hover:bg-purple-500 cursor-pointer transition-colors disabled:opacity-50"
                        >
                          {subscribingNews ? 'QUEUEING...' : 'SIGNUP'}
                        </button>
                      </form>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-[11px] text-gray-600 pt-6 font-mono md:text-right w-full justify-between items-center md:justify-end">
                      <div className="flex gap-4">
                        <a href="#" className="hover:text-pink-500/85">TikTok</a>
                        <a 
                          href="https://www.instagram.com/playfestbw?igsh=MTVtc2QxODV2d3FlNQ%3D%3D&utm_source=qr" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="hover:text-pink-500/85"
                        >
                          Instagram
                        </a>
                        <a href="#" className="hover:text-pink-500/85">Facebook</a>
                        <a href="#" className="hover:text-pink-500/85">WhatsApp</a>
                      </div>
                      <div className="text-gray-600">
                        © {new Date().getFullYear()} PlayFest 2026 Botswana. All Rights Reserved. • Designed Mobile-First
                      </div>
                    </div>
                  </div>

                </div>
              </footer>

            </motion.div>
          )}

          {/* VIEW: SPEAK YOUR MIND (CONCEPT FEEDBACK BOARD) */}
          {viewState === 'feedback' && (
            <motion.div
              key="feedback-portal-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <ConceptFeedbackBoard addToast={addToast} />

              {/* Footer Block */}
              <footer className="py-16 px-6 sm:px-12 bg-[#04020a] border-t border-white/5 text-gray-400">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] font-mono">
                  <div>© {new Date().getFullYear()} PlayFest Botswana. Speak Your Mind.</div>
                  <div className="flex gap-4">
                    <a href="https://www.instagram.com/playfestbw?igsh=MTVtc2QxODV2d3FlNQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500">Instagram</a>
                    <a href="#" className="hover:text-pink-500">TikTok</a>
                  </div>
                </div>
              </footer>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Global custom toasts component */}
      <CustomToast toasts={toasts} setToasts={setToasts} />
    </div>
  );
}
