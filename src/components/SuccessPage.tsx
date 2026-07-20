import React, { useState } from 'react';
import { CheckCircle2, Ticket, QrCode, ArrowLeft, Download, ShieldCheck, Mail, Loader2, Award, Car, Gamepad2, Gift } from 'lucide-react';
import { AttendeeRegistration } from '../types';
import { sounds } from '../lib/sounds';

interface SuccessPageProps {
  registeredDetails: any;
  onBackToHome: () => void;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export default function SuccessPage({ registeredDetails, onBackToHome, addToast }: SuccessPageProps) {
  const [isGmailSending, setIsGmailSending] = useState(false);
  const registrationType = "attendee";

  return (
    <div className="min-h-screen bg-[#06040f] flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-black/60 border border-white/5 p-8 rounded-2xl text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-pink-500 blur-xl opacity-50 rounded-full animate-pulse" />
            <CheckCircle2 className="w-20 h-20 text-pink-500 relative z-10" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-widest font-display">
          Registration Confirmed!
        </h2>
        <p className="text-gray-400">
          Your ticket for PlayFest 2026 has been successfully generated.
        </p>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6 text-left">
          <QrCode className="w-24 h-24 text-white opacity-80" />
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white uppercase tracking-widest">{registeredDetails?.fullName || 'VIP Guest'}</h3>
            <div className="text-sm text-gray-400 font-mono">
              <p>ID: {registeredDetails?.id}</p>
              <p>TYPE: {registrationType.toUpperCase()}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            sounds.playSelect();
            onBackToHome();
          }}
          className="w-full py-4 rounded-xl bg-white text-black font-display font-black text-xs uppercase tracking-widest hover:bg-pink-500 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Home
        </button>
      </div>
    </div>
  );
}
