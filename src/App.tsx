/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Send 
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

import { storage } from './lib/storage';
import { sounds } from './lib/sounds';
import { AttendeeRegistration, VendorApplication } from './types';

export default function App() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [viewState, setViewState] = useState<'home' | 'register' | 'login' | 'success' | 'admin' | 'feedback'>('home');
  const [lastSubmissionType, setLastSubmissionType] = useState<'attendee' | 'vendor'>('attendee');
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
      const allVendors = await storage.getVendorApplications();
      
      const citiesCount = new Set(allRegs.map((r) => r.city.toLowerCase())).size;
      const gamersCount = allRegs.filter((r) => r.interests.includes('gaming')).length;
      const carsCount = allRegs.filter((r) => r.interests.includes('car_meet')).length;

      setStats({
        total: allRegs.length,
        cities: citiesCount,
        gamers: gamersCount,
        cars: carsCount,
        vendors: allVendors.length
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

  const handleRegisterSuccess = (data: AttendeeRegistration | VendorApplication, type: 'attendee' | 'vendor') => {
    setLastSubmissionType(type);
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

  const navigateToLogin = () => {
    storage.trackClick('btn-navigate-login');
    sounds.playSelect();
    setViewState('login');
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
      
      {/* Navigation Header bar */}
      <header className="fixed top-0 inset-x-0 h-20 bg-[#05020c]/70 backdrop-blur-xl border-b border-white/5 z-40 flex items-center justify-between px-6 sm:px-12">
        <div 
          onClick={navigateToHome}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold font-display uppercase shadow-[0_0_15px_rgba(236,72,153,0.3)] group-hover:scale-105 transition-all">
            P
          </div>
          <span className="font-display font-black text-xl tracking-wider text-white uppercase">
            PLAY<span className="text-pink-500">FEST</span>
          </span>
        </div>

        {/* Desktop navbar options */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-widest text-gray-400">
          <button 
            onClick={navigateToHome} 
            className={`hover:text-white transition-colors cursor-pointer bg-transparent border-0 outline-none pb-1 ${viewState === 'home' ? 'text-pink-500 font-bold border-b-2 border-pink-500' : ''}`}
          >
            Home
          </button>
          <button 
            onClick={navigateToRegister} 
            className={`hover:text-white transition-colors cursor-pointer bg-transparent border-0 outline-none pb-1 ${viewState === 'register' ? 'text-pink-500 font-bold border-b-2 border-pink-500' : ''}`}
          >
            RSVP & Vendor
          </button>
          <button 
            onClick={navigateToFeedback} 
            className={`hover:text-white transition-colors cursor-pointer bg-transparent border-0 outline-none pb-1 ${viewState === 'feedback' ? 'text-pink-500 font-bold border-b-2 border-pink-500' : ''}`}
          >
            Speak Your Mind
          </button>
          <button 
            onClick={navigateToLogin} 
            className={`hover:text-white transition-colors cursor-pointer bg-transparent border-0 outline-none pb-1 ${viewState === 'login' ? 'text-pink-500 font-bold border-b-2 border-pink-500' : ''}`}
          >
            My Pass / Log In
          </button>
          <button 
            onClick={() => {
              storage.trackClick('btn-admin-gate');
              setViewState('admin');
            }}
            className={`hover:text-pink-400 text-glow-pink transition-colors font-mono cursor-pointer bg-transparent border-0 outline-none pb-1 ${viewState === 'admin' ? 'text-pink-500 font-bold border-b-2 border-pink-500' : ''}`}
          >
            Organizer Console
          </button>
        </nav>

        {/* Main Header CTA Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              storage.trackClick('btn-admin-mobile-gate');
              setViewState(viewState === 'admin' ? 'home' : 'admin');
            }}
            className="md:hidden p-2 rounded-lg bg-white/5 text-gray-300 hover:text-white border border-white/5"
            title="Organizer Gate"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={navigateToRegister}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 font-display font-bold text-xs uppercase tracking-wider text-white hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] cursor-pointer transition-all"
          >
            RSVP FOR FREE
          </button>
        </div>
      </header>

      {/* Primary Dynamic Main Body Switch */}
      <main className="relative z-10 pt-20">
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
                registrationType={lastSubmissionType}
                registeredDetails={lastSubmissionDetails}
                onBackToHome={() => setViewState('home')}
                addToast={addToast}
              />
            </motion.div>
          )}

          {/* VIEW: LOGIN & PASS CHECKUP PORTAL */}
          {viewState === 'login' && (
            <motion.div
              key="login-portal-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <LoginPage 
                onSuccessAttendee={(details) => {
                  setLastSubmissionDetails(details);
                  const type = details.businessName ? 'vendor' : 'attendee';
                  setLastSubmissionType(type);
                  setViewState('success');
                }}
                onSuccessOrganizer={() => {
                  setViewState('admin');
                }}
                onNavigateToRegister={navigateToRegister}
                addToast={addToast}
              />
              
              {/* Footer Block */}
              <footer className="py-16 px-6 sm:px-12 bg-[#04020a] border-t border-white/5 text-gray-400">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] font-mono">
                  <div>© {new Date().getFullYear()} PlayFest Gaborone. Designed Mobile-First.</div>
                  <div className="flex gap-4">
                    <a href="https://www.instagram.com/playfestbw?igsh=MTVtc2QxODV2d3FlNQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500">Instagram</a>
                    <a href="#" className="hover:text-pink-500">TikTok</a>
                  </div>
                </div>
              </footer>
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
                onLoginClick={navigateToLogin}
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

              {/* 6. Sponsor Spotlight Strip */}
              <section className="py-16 px-4 bg-black/40 border-t border-b border-white/5 text-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/5 blur-3xl pointer-events-none rounded-full" />
                
                <h4 className="text-xs uppercase font-bold tracking-widest text-cyan-400 mb-2 font-mono">
                  Partner Spotlight
                </h4>
                <p className="text-sm text-gray-400 font-light max-w-xl mx-auto mb-10">
                  Ready to align your brand with thousands of Botswana's car tuning, gaming arena enthusiasts, and lifestyle demographics?
                </p>

                <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-30 select-none mb-10">
                  <div className="px-6 py-4 rounded-xl border-2 border-dashed border-white/20 font-display font-medium text-xs uppercase tracking-wider text-gray-400">
                    YOUR BRAND HERE
                  </div>
                </div>

                <button
                  id="partner-low-enquiry-cta"
                  onClick={navigateToRegister}
                  className="px-8 py-3 rounded-lg bg-glassmorphism border border-white/10 hover:border-pink-500/20 text-xs font-bold font-display uppercase tracking-wider text-pink-400 hover:text-white transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> SUBMIT BRAND ENQUIRY
                </button>
              </section>

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
