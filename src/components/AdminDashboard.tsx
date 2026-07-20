import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  FileSpreadsheet, 
  Trash2, 
  X, 
  RefreshCw, 
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  User,
  Sparkles,
  Gamepad2,
  Car,
  Calendar,
  Phone,
  MapPin,
  Globe,
  Trophy,
  ShoppingBag,
  CheckCircle,
  Ticket,
  Mail,
  Eye
} from 'lucide-react';
import { AttendeeRegistration } from '../types';
import { storage } from '../lib/storage';
import { sounds } from '../lib/sounds';

interface AdminDashboardProps {
  onClose: () => void;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export default function AdminDashboard({ onClose, addToast }: AdminDashboardProps) {
  const [regs, setRegs] = useState<AttendeeRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allRegs = await storage.getRegistrations();
      setRegs(allRegs);
    } catch (err) {
      addToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    sounds.playSelect();
    if (regs.length === 0) {
      addToast('No registrations available to export', 'error');
      return;
    }

    const headers = [
      'Registration ID',
      'Registration Date',
      'Full Name',
      'Email Address',
      'Phone Number',
      'Country of Residence',
      'Resident City/Town',
      'Individual Age',
      'Gender Identity',
      'Attendance Likelihood',
      'Group Size',
      'Travel Distance',
      'Referral Source',
      'Interests Chosen',
      'Estimated Spend',
      'VIP Tier Interest',
      'Merch Interest',
      'Early Access Interest',
      'Gaming Platform',
      'Favorite Games',
      'Gaming Tournament Intent',
      'Tournament Genres',
      'Car Make',
      'Car Model',
      'Car Year',
      'Car Build Style',
      'Car Modifications',
      'Display Vehicle at Show',
      'Enter Staging Competitions'
    ];

    const rows = regs.map(r => {
      const g = r.gamingDetails || {};
      const c = r.carDetails || {};
      
      const cleanField = (val: any) => {
        if (val === undefined || val === null) return '""';
        const str = String(val);
        return `"${str.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
      };

      return [
        cleanField(r.id),
        cleanField(new Date(r.createdAt).toLocaleString()),
        cleanField(r.fullName),
        cleanField(r.email),
        cleanField(r.phoneNumber),
        cleanField(r.country || 'Botswana'),
        cleanField(r.city),
        cleanField(r.ageGroup),
        cleanField(r.gender || 'Not specified'),
        cleanField(r.attendanceLikelihood),
        cleanField(r.groupSize),
        cleanField(r.travelDistance),
        cleanField(r.referralSource),
        cleanField((r.interests || []).join(', ')),
        cleanField(r.approximateSpend),
        cleanField(r.vipInterest),
        cleanField(r.merchInterest),
        cleanField(r.earlyTicketAccess),
        cleanField(g.platform || 'N/A'),
        cleanField(g.favoriteGames || 'N/A'),
        cleanField(g.participateInTournaments || 'N/A'),
        cleanField((g.preferredCategories || []).join(', ') || 'N/A'),
        cleanField(c.vehicleMake || 'N/A'),
        cleanField(c.vehicleModel || 'N/A'),
        cleanField(c.year || 'N/A'),
        cleanField(c.buildType || 'N/A'),
        cleanField(c.modifications || 'N/A'),
        cleanField(c.displayVehicle || 'N/A'),
        cleanField(c.enterCompetitions || 'N/A')
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `PlayFest_2026_Attendees_Full_Report.csv`;
    link.click();
    addToast('Comprehensive CSV exported with 29 data fields!', 'success');
  };

  const handleResetRegistrations = async () => {
    sounds.playSelect();
    setIsResetting(true);
    try {
      localStorage.removeItem('playfest_registrations');
      setRegs([]);
      setShowResetConfirm(false);
      addToast('All registrations deleted locally.', 'success');
    } catch (err) {
      addToast('Error resetting data.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  // Derive stats for deep telemetry summaries
  const carShowcaseCount = regs.filter(r => r.interests.includes('car_meet')).length;
  const gamingChallengersCount = regs.filter(r => r.interests.includes('gaming') && r.gamingDetails?.participateInTournaments === 'Yes').length;
  const vipProspectsCount = regs.filter(r => r.vipInterest === 'Yes').length;

  return (
    <div className="min-h-screen bg-[#06040f] text-white p-6 sm:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Control Deck */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
          <div>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-display uppercase tracking-tight text-white mt-1">
              PlayFest 2026 <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Control Panel</span>
            </h2>
            <p className="text-xs text-gray-400 font-mono mt-1">ORGANIZER TELEMETRY PORTAL — MULTI-DIMENSIONAL AUDIT SUITE</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button 
              onClick={handleExportCSV} 
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-xs font-bold font-display uppercase text-pink-400 flex items-center justify-center gap-1.5 border border-pink-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export All Data CSV
            </button>
            <button 
              onClick={() => { sounds.playSelect(); setShowResetConfirm(true); }} 
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-bold font-display uppercase text-red-400 flex items-center justify-center gap-1.5 border border-red-500/30 transition-all active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Reset Database
            </button>
            <button 
              onClick={() => { sounds.playSelect(); onClose(); }} 
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold font-display uppercase text-gray-300 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to App
            </button>
          </div>
        </div>

        {/* Dynamic Telemetry Bento Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-black/40 border border-white/5 p-5 rounded-2xl flex items-center gap-4 hover:border-pink-500/20 transition-all">
            <div className="p-3.5 rounded-xl bg-pink-500/10 text-pink-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-gray-500 font-bold">Total Registrations</div>
              <div className="text-xl sm:text-2xl font-black font-display text-white mt-0.5">{regs.length}</div>
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 p-5 rounded-2xl flex items-center gap-4 hover:border-cyan-400/20 transition-all">
            <div className="p-3.5 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-gray-500 font-bold">Showcase Vehicles</div>
              <div className="text-xl sm:text-2xl font-black font-display text-white mt-0.5">{carShowcaseCount}</div>
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 p-5 rounded-2xl flex items-center gap-4 hover:border-purple-400/20 transition-all">
            <div className="p-3.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-gray-500 font-bold">Tournament Contenders</div>
              <div className="text-xl sm:text-2xl font-black font-display text-white mt-0.5">{gamingChallengersCount}</div>
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 p-5 rounded-2xl flex items-center gap-4 hover:border-emerald-400/20 transition-all">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-gray-500 font-bold">VIP Prospects</div>
              <div className="text-xl sm:text-2xl font-black font-display text-white mt-0.5">{vipProspectsCount}</div>
            </div>
          </div>
        </div>

        {/* Database List HUD */}
        <div className="bg-black/60 border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" /> Recent Registrations Database
              </h3>
              <p className="text-xs text-gray-400 mt-1">Click on any registrant row to unpack their complete multidimensional dossier.</p>
            </div>
            <div className="text-[10px] font-mono text-gray-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
              DATABASE COUNTER: {regs.length} RECORDS
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
              <p className="font-mono text-xs uppercase tracking-wider">Synchronizing state matrices...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase font-mono tracking-wider text-gray-500">
                    <th className="p-4 font-bold">Attendee Name</th>
                    <th className="p-4 font-bold">Secure Email</th>
                    <th className="p-4 font-bold">City / Residence</th>
                    <th className="p-4 font-bold">Selected Passions</th>
                    <th className="p-4 font-bold text-right">Dossier Access</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-light divide-y divide-white/5">
                  {regs.map(r => {
                    const isExpanded = expandedId === r.id;
                    return (
                      <React.Fragment key={r.id}>
                        <tr 
                          onClick={() => {
                            sounds.playSelect();
                            toggleExpand(r.id);
                          }}
                          className={`hover:bg-white/[0.03] transition-colors cursor-pointer ${isExpanded ? 'bg-white/[0.02]' : ''}`}
                        >
                          <td className="p-4 font-bold text-white flex items-center gap-2">
                            <span className="text-gray-500">
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                            </span>
                            {r.fullName}
                          </td>
                          <td className="p-4 text-gray-400 font-mono text-xs">{r.email}</td>
                          <td className="p-4 text-gray-400">{r.city}</td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1.5">
                              {(r.interests || []).map(i => {
                                let label = i;
                                let colorClass = 'bg-gray-500/10 text-gray-400 border-gray-500/20';
                                if (i === 'gaming') {
                                  label = '🎮 Gaming';
                                  colorClass = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
                                } else if (i === 'car_meet') {
                                  label = '🚗 Car Showcase';
                                  colorClass = 'bg-pink-500/10 text-pink-400 border-pink-500/20';
                                } else if (i === 'live_music') {
                                  label = '🎵 Live Music';
                                  colorClass = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
                                } else if (i === 'vendors') {
                                  label = '🛍️ Merchandise';
                                  colorClass = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
                                }
                                return (
                                  <span key={i} className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono uppercase border ${colorClass}`}>
                                    {label}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <button className="px-2.5 py-1 rounded bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 hover:bg-cyan-400/20 text-[10px] font-bold font-display uppercase tracking-wider transition-all">
                              {isExpanded ? 'CLOSE' : 'EXPAND'}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Multi-Dimensional Dossier Panel */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="p-0 bg-black/40 border-b border-white/5">
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }} 
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25 }}
                                className="p-6 overflow-hidden"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {/* Column 1: Demographics & Security Dossier */}
                                  <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-4">
                                    <h4 className="text-xs font-bold font-display uppercase tracking-wider text-pink-400 flex items-center gap-2 border-b border-white/5 pb-2">
                                      <User className="w-3.5 h-3.5" /> 1. Registrant Dossier
                                    </h4>
                                    
                                    <div className="space-y-2.5 text-xs">
                                      <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded">
                                        <span className="text-gray-500 font-mono">PHONE NUMBER</span>
                                        <span className="text-white font-bold font-mono flex items-center gap-1">
                                          <Phone className="w-3 h-3 text-gray-400" /> {r.phoneNumber}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded">
                                        <span className="text-gray-500 font-mono">RESIDENCE COUNTRY</span>
                                        <span className="text-white font-bold flex items-center gap-1">
                                          <Globe className="w-3 h-3 text-gray-400" /> {r.country || 'Botswana'}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded">
                                        <span className="text-gray-500 font-mono">INDIVIDUAL AGE</span>
                                        <span className="text-white font-bold">
                                          {/^\d+$/.test(r.ageGroup) ? `${r.ageGroup} Years Old` : r.ageGroup}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded">
                                        <span className="text-gray-500 font-mono">GENDER IDENTITY</span>
                                        <span className="text-white font-bold">{r.gender || 'Prefer not to say'}</span>
                                      </div>
                                      <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded">
                                        <span className="text-gray-500 font-mono">TRAFFIC REFERRAL</span>
                                        <span className="text-white font-bold text-pink-400 font-mono">{r.referralSource}</span>
                                      </div>
                                      <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded">
                                        <span className="text-gray-500 font-mono">TIMESTAMP</span>
                                        <span className="text-white font-mono text-[10px]">{new Date(r.createdAt).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Column 2: Event Metrics & Pass Priorities */}
                                  <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-4">
                                    <h4 className="text-xs font-bold font-display uppercase tracking-wider text-cyan-400 flex items-center gap-2 border-b border-white/5 pb-2">
                                      <Sparkles className="w-3.5 h-3.5" /> 2. Logistics & Pass Options
                                    </h4>

                                    <div className="space-y-2.5 text-xs">
                                      <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded">
                                        <span className="text-gray-500 font-mono">ATTENDANCE LEVEL</span>
                                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                                          r.attendanceLikelihood === 'Definitely' 
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                            : r.attendanceLikelihood === 'Probably'
                                            ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                                            : 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20'
                                        }`}>
                                          {r.attendanceLikelihood}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded">
                                        <span className="text-gray-500 font-mono">GROUP SIZE</span>
                                        <span className="text-white font-bold">{r.groupSize}</span>
                                      </div>
                                      <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded">
                                        <span className="text-gray-500 font-mono">TRAVEL DISTANCE</span>
                                        <span className="text-white font-light text-right">{r.travelDistance}</span>
                                      </div>
                                      <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded">
                                        <span className="text-gray-500 font-mono">ESTIMATED SPEND</span>
                                        <span className="text-cyan-400 font-bold font-mono">{r.approximateSpend}</span>
                                      </div>
                                      <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded">
                                        <span className="text-gray-500 font-mono">VIP TICKET INTEREST</span>
                                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                                          r.vipInterest === 'Yes'
                                            ? 'bg-pink-500/15 text-pink-400 border border-pink-500/30'
                                            : r.vipInterest === 'Maybe'
                                            ? 'bg-purple-500/10 text-purple-300'
                                            : 'bg-gray-800 text-gray-400'
                                        }`}>
                                          {r.vipInterest === 'Yes' ? '⚡ VIP PRIORITY' : r.vipInterest}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded">
                                        <span className="text-gray-500 font-mono">OFFICIAL MERCH</span>
                                        <span className="text-white font-bold">{r.merchInterest}</span>
                                      </div>
                                      <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded">
                                        <span className="text-gray-500 font-mono">EARLY LAUNCH NOTIFICATION</span>
                                        <span className="text-white font-bold text-cyan-400">{r.earlyTicketAccess}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Column 3: Interest Specific Dossier (Esports Arena OR Garage Staging) */}
                                  <div className="space-y-4 lg:col-span-1 md:col-span-2">
                                    {r.interests.includes('gaming') && r.gamingDetails && (
                                      <div className="p-4 rounded-xl bg-[#0b0819] border border-cyan-500/20 space-y-3">
                                        <h4 className="text-xs font-bold font-display uppercase tracking-wider text-cyan-400 flex items-center gap-2 border-b border-cyan-500/10 pb-2">
                                          <Gamepad2 className="w-3.5 h-3.5" /> 3a. Esports Battle Station
                                        </h4>
                                        <div className="space-y-2 text-xs">
                                          <div className="flex justify-between bg-black/30 p-2 rounded">
                                            <span className="text-gray-500 font-mono">PRIMARY PLATFORM</span>
                                            <span className="text-cyan-300 font-bold font-mono">{r.gamingDetails.platform}</span>
                                          </div>
                                          <div className="bg-black/30 p-2 rounded space-y-1">
                                            <span className="text-gray-500 font-mono text-[10px] block">FAVORITE TITLES</span>
                                            <span className="text-white font-bold block leading-relaxed">{r.gamingDetails.favoriteGames}</span>
                                          </div>
                                          <div className="flex justify-between bg-black/30 p-2 rounded">
                                            <span className="text-gray-500 font-mono">TOURNAMENT AMBITION</span>
                                            <span className={`px-2 py-0.2 rounded font-bold text-[9px] uppercase ${
                                              r.gamingDetails.participateInTournaments === 'Yes' 
                                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                                                : 'bg-gray-800 text-gray-500'
                                            }`}>
                                              {r.gamingDetails.participateInTournaments === 'Yes' ? '🏆 FIGHTER' : r.gamingDetails.participateInTournaments}
                                            </span>
                                          </div>
                                          <div className="bg-black/30 p-2 rounded space-y-1.5">
                                            <span className="text-gray-500 font-mono text-[10px] block font-bold">PREFERRED GENRES</span>
                                            <div className="flex flex-wrap gap-1">
                                              {(r.gamingDetails.preferredCategories || []).map(cat => (
                                                <span key={cat} className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-900 font-mono text-[9px] font-bold">
                                                  {cat}
                                                </span>
                                              ))}
                                              {(r.gamingDetails.preferredCategories || []).length === 0 && (
                                                <span className="text-gray-600 font-light italic text-[10px]">None chosen</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {r.interests.includes('car_meet') && r.carDetails && (
                                      <div className="p-4 rounded-xl bg-[#110714] border border-pink-500/20 space-y-3">
                                        <h4 className="text-xs font-bold font-display uppercase tracking-wider text-pink-400 flex items-center gap-2 border-b border-pink-500/10 pb-2">
                                          <Car className="w-3.5 h-3.5" /> 3b. Tuner Showcase Staging
                                        </h4>
                                        <div className="space-y-2 text-xs">
                                          <div className="flex justify-between bg-black/30 p-2 rounded">
                                            <span className="text-gray-500 font-mono">SPEC VEHICLE</span>
                                            <span className="text-white font-bold font-mono">
                                              {r.carDetails.year} {r.carDetails.vehicleMake} {r.carDetails.vehicleModel}
                                            </span>
                                          </div>
                                          <div className="flex justify-between bg-black/30 p-2 rounded">
                                            <span className="text-gray-500 font-mono">BUILD STYLE / GENRE</span>
                                            <span className="text-pink-300 font-bold font-mono">{r.carDetails.buildType}</span>
                                          </div>
                                          <div className="bg-black/30 p-2 rounded space-y-1">
                                            <span className="text-gray-500 font-mono text-[10px] block">KEY MODIFICATIONS</span>
                                            <span className="text-gray-300 block font-light leading-relaxed truncate-2-lines">{r.carDetails.modifications}</span>
                                          </div>
                                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                                            <div className="bg-black/30 p-1.5 rounded flex flex-col items-center">
                                              <span className="text-gray-500 font-mono block">DISPLAY VEHICLE?</span>
                                              <span className={`font-black uppercase mt-0.5 ${r.carDetails.displayVehicle === 'Yes' ? 'text-pink-400' : 'text-gray-500'}`}>
                                                {r.carDetails.displayVehicle}
                                              </span>
                                            </div>
                                            <div className="bg-black/30 p-1.5 rounded flex flex-col items-center">
                                              <span className="text-gray-500 font-mono block">COMPETITIONS?</span>
                                              <span className={`font-black uppercase mt-0.5 ${r.carDetails.enterCompetitions === 'Yes' ? 'text-pink-400' : 'text-gray-500'}`}>
                                                {r.carDetails.enterCompetitions}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Vehicle Staging Photo Preview */}
                                          {r.carDetails.photoUrl && (
                                            <div className="mt-2 relative rounded-lg overflow-hidden border border-white/10 aspect-video group bg-black/40">
                                              <img 
                                                src={r.carDetails.photoUrl} 
                                                alt="Tuner Staging" 
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                referrerPolicy="no-referrer"
                                              />
                                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[9px] font-mono font-bold tracking-wider text-pink-400">TUNER EXHIBIT PHOTO PREVIEW</span>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Safeguard if neither of the conditional modules are chosen */}
                                    {!r.interests.includes('gaming') && !r.interests.includes('car_meet') && (
                                      <div className="p-8 rounded-xl bg-black/30 border border-white/5 text-center text-gray-500 text-xs italic flex flex-col items-center justify-center gap-2 h-full">
                                        <Sparkles className="w-6 h-6 text-gray-600 animate-pulse" />
                                        <span>General Enthusiast RSVP — No specific Car Showcase or Esports Arena credentials requested.</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {regs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-gray-500">
                        <Users className="w-8 h-8 opacity-40 mx-auto mb-2 text-gray-500 animate-pulse" />
                        <p className="font-mono text-xs uppercase tracking-widest">Dossier terminal offline</p>
                        <p className="text-xs text-gray-600 mt-1">No registrant entries saved in active cache.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showResetConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0f0c1e] border border-white/10 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative">
              <h3 className="text-lg font-bold text-white mb-2">Reset Database?</h3>
              <p className="text-xs text-gray-400 mb-6">This will delete all local registration records permanently. This action is irreversible.</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => { sounds.playSelect(); setShowResetConfirm(false); }} 
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 border border-white/5 cursor-pointer transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleResetRegistrations} 
                  disabled={isResetting} 
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-[0_0_15px_rgba(220,38,38,0.2)] cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  {isResetting ? 'Resetting...' : 'Permanently Delete'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

