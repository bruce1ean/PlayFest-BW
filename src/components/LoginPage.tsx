/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Lock, Mail, ArrowRight, Sparkles, Loader2, Key, ChevronRight, HelpCircle } from 'lucide-react';
import { storage } from '../lib/storage';
import { sounds } from '../lib/sounds';
import { loginUser } from '../lib/firebase';

interface LoginPageProps {
  onSuccessAttendee: (details: any) => void;
  onSuccessOrganizer: () => void;
  onNavigateToRegister: () => void;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export default function LoginPage({
  onSuccessAttendee,
  onSuccessOrganizer,
  onNavigateToRegister,
  addToast,
}: LoginPageProps) {
  const [activeTab, setActiveTab] = useState<'attendee' | 'organizer'>('attendee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredField, setHoveredField] = useState<string>('email');

  // Trigger hover sound on tab switch
  const handleTabChange = (tab: 'attendee' | 'organizer') => {
    sounds.playHover();
    setActiveTab(tab);
    setHoveredField(tab === 'attendee' ? 'email' : 'passcode');
  };

  const handleAttendeeLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      sounds.playCancel();
      addToast('Please enter your email address.', 'error');
      return;
    }
    if (!password) {
      sounds.playCancel();
      addToast('Please enter your account password.', 'error');
      return;
    }

    setLoading(true);
    storage.trackClick('btn-login-attendee-submit');
    sounds.playSelect();

    try {
      // 1. Authenticate with Firebase first
      const credential = await loginUser(email.trim(), password);
      console.log('Firebase user logged in successfully:', credential.user?.uid);
      
      // 2. Fetch their details from local/database registrations
      const regs = await storage.getRegistrations();
      const match = regs.find((r) => r.email.toLowerCase() === email.trim().toLowerCase());

      if (match) {
        sounds.playSuccess();
        addToast('Welcome back! Your ticket has been retrieved successfully.', 'success');
        onSuccessAttendee(match);
      } else {
        const vendors = await storage.getVendorApplications();
        const vendorMatch = vendors.find((v) => v.email.toLowerCase() === email.trim().toLowerCase());

        if (vendorMatch) {
          sounds.playSuccess();
          addToast('Welcome back! Your vendor application was retrieved successfully.', 'success');
          onSuccessAttendee(vendorMatch);
        } else {
          // If they authenticated but have no details recorded yet, construct a basic player object
          sounds.playSuccess();
          addToast('Logged in successfully! Welcome to PlayFest.', 'success');
          onSuccessAttendee({
            id: credential.user.uid,
            fullName: email.split('@')[0],
            email: email.trim(),
            phone: 'N/A',
            city: 'N/A',
            interests: ['General Interest'],
          });
        }
      }
    } catch (authErr: any) {
      sounds.playCancel();
      if (authErr.code === 'auth/operation-not-allowed') {
        console.warn('Firebase Email/Password Authentication is not enabled in your Firebase project. Please enable it in the Firebase Console (Authentication > Sign-in method).');
      } else {
        console.error('Firebase Auth Login failed:', authErr);
      }
      
      let friendlyMessage = 'Authentication failed. Please check your credentials.';
      if (authErr.code === 'auth/wrong-password') {
        friendlyMessage = 'Incorrect password. Please try again.';
      } else if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
        friendlyMessage = 'No account found with this email, or invalid credentials. Please check your spelling or register.';
      } else if (authErr.code === 'auth/invalid-email') {
        friendlyMessage = 'Invalid email address format.';
      } else if (authErr.code === 'auth/operation-not-allowed') {
        friendlyMessage = 'Firebase Email/Password sign-in is disabled. Please enable it under Authentication > Sign-in method in your Firebase Console.';
      } else if (authErr.message) {
        friendlyMessage = authErr.message;
      }
      addToast(friendlyMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      sounds.playCancel();
      addToast('Please enter the organizer access passcode.', 'error');
      return;
    }

    setLoading(true);
    storage.trackClick('btn-login-organizer-submit');
    sounds.playSelect();

    setTimeout(() => {
      if (passcode.trim() === 'Tomcruise@16') {
        sounds.playSuccess();
        addToast('Welcome Back, PlayFest Organizer!', 'success');
        onSuccessOrganizer();
      } else {
        sounds.playCancel();
        addToast('Invalid Organizer Key Code. Please try again.', 'error');
      }
      setLoading(false);
    }, 600);
  };

  const fieldHelpMap: Record<string, string> = {
    email: 'ENTER SECURE COMMUNICATIVE MAILBOX: Input the email address you originally provided during custom RSVP registration or stall application to retrieve your digital entry passes.',
    password: 'ENTER SECURITY PASSWORD: Input the password associated with your player account to authenticate with Firebase database modules.',
    passcode: 'ORC KEYS: Authorized staff must submit their encrypted municipal command console codes to decrypt registrations & spreadsheet pipelines.',
    rsvp_tab: 'SWITCH TO ENTHUSIAST PASS RETRIEVAL: Search for existing free player passes, tuner garage details, or registered gaming titles.',
    org_tab: 'SWITCH TO STAFF GATEWAY: Access terminal dashboards for attendee check-ins, vendor logistics, and system telemetry stats.'
  };

  return (
    <div className="min-h-screen bg-[#030107] py-24 px-4 sm:px-12 relative flex flex-col justify-between overflow-hidden">
      
      {/* Background ambient sunset overlay */}
      <div className="absolute inset-0 bg-radial-at-t from-purple-900/10 via-black/90 to-black pointer-events-none z-0" />
      
      {/* GTA Scanlines texture */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] opacity-10 z-10" />

      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto relative z-20 items-start">
        
        {/* Left Side: Dynamic GTA style category switcher & page header */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-1">
            <span className="text-xs uppercase font-extrabold tracking-[0.25em] text-[#ec4899] font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> SECURE GATEWAY / USER PORTAL
            </span>
            <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white uppercase">
              LOBBY LOGIN<span className="text-cyan-400 font-normal">.EXE</span>
            </h1>
          </div>

          {/* Selector options resembling GTA setup menus */}
          <div className="space-y-2 border-l-2 border-white/5 pl-2">
            <button
              onClick={() => handleTabChange('attendee')}
              onMouseEnter={() => {
                sounds.playHover();
                setHoveredField('rsvp_tab');
              }}
              className={`w-full text-left py-3.5 px-4 rounded-lg font-display text-sm font-black tracking-widest uppercase transition-all duration-150 flex items-center justify-between border cursor-pointer ${
                activeTab === 'attendee'
                  ? 'bg-white text-black border-white translate-x-3 shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                  : 'bg-black/50 hover:bg-black/75 text-gray-400 border-white/5 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                {activeTab === 'attendee' && <ChevronRight className="w-4 h-4 text-[#ec4899] animate-pulse" />}
                ENTHUSIAST ACCESS
              </span>
              {activeTab === 'attendee' && (
                <span className="text-[9px] font-mono font-bold bg-pink-500/10 text-pink-500 px-1.5 py-0.5 rounded border border-pink-500/20">
                  ACTIVE
                </span>
              )}
            </button>
          </div>

          {/* Bottom HELP COMPASS */}
          <div className="bg-black/90 border-t-2 border-[#ec4899] p-4 font-mono text-[11px] text-gray-300 leading-relaxed rounded-b-lg shadow-2xl relative">
            <div className="absolute top-0 right-4 -translate-y-1/2 bg-[#ec4899] text-white text-[9px] font-bold px-2 py-0.5 rounded tracking-widest uppercase">
              HELP COMPASS
            </div>
            <p className="text-gray-400">
              {fieldHelpMap[hoveredField] || 'LOBBY LOGIN: Access your waitlist pass or authorize administrator console protocols.'}
            </p>
          </div>
        </div>

        {/* Right Side: Active Console Settings Panel Form */}
        <div className="lg:col-span-7 bg-black/60 border border-white/5 p-6 sm:p-8 rounded-2xl backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
              {activeTab === 'attendee' ? 'CLIENT TICKETING VERIFICATION' : 'STAFF CREDENTIAL CONSOLE'}
            </span>
            <span className="text-[10px] font-mono text-gray-500">
              STATUS: LOBBY_OPEN
            </span>
          </div>

          {activeTab === 'attendee' ? (
            <form onSubmit={handleAttendeeLookup} className="space-y-6">
              <div 
                className="space-y-2"
                onMouseEnter={() => setHoveredField('email')}
              >
                <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400">
                  REGISTERED ACCOUNT EMAIL
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. thabo@example.co.bw"
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-600 focus:border-pink-500 focus:outline-none text-sm transition-all font-sans"
                  />
                </div>
              </div>

              <div 
                className="space-y-2"
                onMouseEnter={() => setHoveredField('password')}
              >
                <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400">
                  SECURE PASSWORD
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-600 focus:border-pink-500 focus:outline-none text-sm transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-white hover:bg-pink-500 text-black hover:text-white font-display font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:shadow-[0_0_20px_rgba(236,72,153,0.4)]"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>CHECK RSVP & PRIZE STATUS</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2 border-t border-white/5 flex flex-col items-center gap-2">
                <div>
                  <span className="text-xs text-gray-500 font-light">Don't have an RSVP ticket yet?</span>{' '}
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playSelect();
                      onNavigateToRegister();
                    }}
                    className="text-xs text-[#ec4899] font-bold hover:underline font-mono cursor-pointer"
                  >
                    REGISTER NOW & WIN VIP →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange('organizer')}
                  className="text-[9px] text-gray-700 hover:text-cyan-500 transition-colors font-mono uppercase mt-1 tracking-widest cursor-pointer"
                >
                  🔒 Authorized Admin Console
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOrganizerLogin} className="space-y-6">
              <div 
                className="space-y-2"
                onMouseEnter={() => setHoveredField('passcode')}
              >
                <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400">
                  SECURE PASSCODE
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="••••••••••••••"
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-600 focus:border-cyan-500 focus:outline-none text-sm tracking-widest transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-display font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>AUTHORIZE STAFF ACCESS</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10 text-[11px] text-yellow-400/80 leading-relaxed font-mono">
                🔑 DATA COMPLIANCE ALERT: This secure terminal yields analytical database telemetry, Google Sheets mapping, and approved stance car tuner listings.
              </div>

              <div className="text-center pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => handleTabChange('attendee')}
                  className="text-[10px] text-gray-500 hover:text-white transition-colors font-mono uppercase cursor-pointer"
                >
                  ← Return to Enthusiast Login
                </button>
              </div>
            </form>
          )}
        </div>

      </div>

      {/* Retro Keybind Legend Footer */}
      <div className="max-w-6xl mx-auto w-full relative z-20 mt-12 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-[10px] font-mono text-gray-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">TAB SWAP</span> CLICK OPTION
          </span>
          <span className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">HOVER</span> UPDATE COMPASS
          </span>
        </div>
        <div>
          ENCRYPTED GATEWAY LOBBY • DESIGNED MOBILE-FIRST
        </div>
      </div>

    </div>
  );
}
