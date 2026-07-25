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
      
      
      const citiesCount = new Set(allRegs.map((r) => (r.city || '').toLowerCase()).filter(Boolean)).size;
      const gamersCount = allRegs.filter((r) => (r.interests || []).includes('gaming')).length;
      const carsCount = allRegs.filter((r) => (r.interests || []).includes('car_meet')).length;

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

    // Set up rapid telemetry polling to keep live server stats updated (every 15s)
    const intervalId = setInterval(() => {
      syncServerStats();
    }, 15000);

    return () => clearInterval(intervalId);
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
    <div className="relative min-h-screen font-sans bg-[#05020c] text-white overflow-x-hidden">
      
      {/* Dynamic Background Stars Ambient Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#201438,transparent_55%)] pointer-events-none z-0" />
      {/* Navigation Header Banner & Merged Navigation */}
      <header className="relative w-full bg-[#05020c] flex flex-col items-center overflow-hidden">
        {/* Continuous background glow sitting behind both the image banner bottom and navigation menu to blend them as one */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(ellipse_at_center,rgba(236,72,153,0.12),transparent_70%)] pointer-events-none z-0" />

        <div className="relative w-full max-w-7xl mx-auto aspect-[1376/768] bg-transparent overflow-hidden z-10">
          <img 
            src={playfestLogo} 
            alt="PlayFest 2026 Botswana Banner" 
            width={1376}
            height={768}
            className="w-full h-full object-cover select-none block"
            referrerPolicy="no-referrer"
          />

          {/* Transparent floating settings button precisely overlaying the gear icon in the image */}
          <button
            onClick={() => {
              storage.trackClick('btn-admin-gate');
              setViewState(viewState === 'admin' ? 'home' : 'admin');
              sounds.playSelect();
            }}
            className="absolute top-[4.5%] right-[3%] w-[7.5%] h-[13.5%] cursor-pointer z-50 rounded-[18%] border border-transparent hover:border-pink-500/50 hover:bg-pink-500/15 hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all duration-300"
            title="Organizer Console"
            aria-label="Settings"
          />
        </div>
      </header>

      {/* Primary Dynamic Main Body Switch */}
      <main className="relative z-10 pt-0">
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

          {/* VIEW: REGULAR LANDING PAGE VIEW (DIRECT REGISTRATION FORM ONLY) */}
          {viewState === 'home' && (
            <motion.div
              key="main-landing-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Direct Registration Form */}
              <RegistrationForm 
                onSuccess={handleRegisterSuccess}
                addToast={addToast}
              />

              {/* Trust/FAQ section */}
              <TestimonialsFAQ />

              {/* Footer Block */}
              <footer className="py-12 px-6 sm:px-12 bg-[#04020a] border-t border-white/5 relative z-10 text-gray-400">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8 items-start">
                  
                  {/* Left Column LOGO brand statement */}
                  <div className="space-y-3 max-w-md">
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

                  {/* Right column quick links & socials */}
                  <div className="space-y-4 flex flex-col items-start md:items-end w-full md:w-auto">
                    <div className="flex flex-wrap gap-4 sm:gap-6 text-xs font-mono">
                      <a href="#" className="hover:text-pink-500/85 transition-colors">TikTok</a>
                      <a 
                        href="https://www.instagram.com/playfestbw?igsh=MTVtc2QxODV2d3FlNQ%3D%3D&utm_source=qr" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:text-pink-500/85 transition-colors"
                      >
                        Instagram
                      </a>
                      <a href="#" className="hover:text-pink-500/85 transition-colors">Facebook</a>
                      <a href="#" className="hover:text-pink-500/85 transition-colors">WhatsApp</a>
                    </div>
                    <div className="text-[11px] text-gray-600 font-mono text-left md:text-right">
                      © {new Date().getFullYear()} PlayFest 2026 Botswana. All Rights Reserved. • Designed Mobile-First
                    </div>
                  </div>

                </div>

                {/* Centered Glowing Settings Cogwheel in Footer */}
                <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/5 flex justify-center">
                  <button
                    onClick={() => {
                      storage.trackClick('btn-admin-gate-cog');
                      setViewState(viewState === 'admin' ? 'home' : 'admin');
                      sounds.playSelect();
                    }}
                    className="p-3 rounded-full bg-black/40 border border-white/10 transition-all duration-300 cursor-pointer flex items-center justify-center hover:scale-110 active:scale-95 hover:border-pink-500/50 group"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(236, 72, 153, 0.4))',
                    }}
                    title="Organizer / Admin Console"
                    aria-label="Settings"
                  >
                    <Settings 
                      className={`w-5 h-5 text-[#ec4899] transition-transform duration-700 ${viewState === 'admin' ? 'rotate-180' : 'group-hover:rotate-90'}`}
                      stroke="#ec4899"
                      strokeWidth={2.2}
                    />
                  </button>
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
