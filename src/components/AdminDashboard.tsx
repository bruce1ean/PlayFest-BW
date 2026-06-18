/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Users, 
  Car, 
  Gamepad2, 
  Store, 
  FileSpreadsheet, 
  Download, 
  Search, 
  Filter, 
  Lock, 
  Unlock, 
  Mail, 
  ChevronRight, 
  ArrowLeft, 
  PieChart as PieIcon, 
  TrendingUp, 
  Printer, 
  Calendar,
  X,
  Sparkles,
  MapPin,
  CreditCard
} from 'lucide-react';
import { AttendeeRegistration, VendorApplication, NewsletterSubscriber, AppAnalytics } from '../types';
import { storage } from '../lib/storage';

const interestOptions = [
  { value: 'gaming', label: 'Gaming tournaments & Esports' },
  { value: 'car_meet', label: 'Car Showcase & Tuner Meet' },
  { value: 'live_music', label: 'Live Concert & Sound Stage' },
  { value: 'food_drinks', label: 'Food, Drinks & Premium Stalls' },
  { value: 'merchandise', label: 'Official Lifestyle Merch' },
  { value: 'networking', label: 'Creator Stalls & VIP Lounge' }
];

interface AdminDashboardProps {
  onClose: () => void;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export default function AdminDashboard({ onClose, addToast }: AdminDashboardProps) {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Data State
  const [registrations, setRegistrations] = useState<AttendeeRegistration[]>([]);
  const [vendors, setVendors] = useState<VendorApplication[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [analytics, setAnalytics] = useState<AppAnalytics | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'trends' | 'attendees' | 'cars' | 'gamers' | 'vendors'>('trends');

  // Search/Filters (Attendees)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [filterLikelihood, setFilterLikelihood] = useState('');
  const [filterInterest, setFilterInterest] = useState('');

  // Sponsors printable layout modal
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Authentication: Passcode is Tomcruise@16
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === 'Tomcruise@16') {
      setIsAuthenticated(true);
      addToast('Welcome Back, PlayFest Organizer!', 'success');
      storage.trackClick('btn-admin-login-success');
    } else {
      addToast('Invalid Organizer Key Code. Please try again.', 'error');
      storage.trackClick('btn-admin-login-fail');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllOrganizerData();
    }
  }, [isAuthenticated]);

  const loadAllOrganizerData = async () => {
    try {
      const [allRegs, allVendors, allSubs, allAnalytics] = await Promise.all([
        storage.getRegistrations(),
        storage.getVendorApplications(),
        storage.getNewsletterSubscribers(),
        storage.getAnalytics()
      ]);
      setRegistrations(allRegs);
      setVendors(allVendors);
      setSubscribers(allSubs);
      setAnalytics(allAnalytics);
    } catch {
      addToast('Failed to fetch real-time analytics data.', 'error');
    }
  };

  // --- COMPUTE STATISTICS ---
  const totalRegs = registrations.length;
  const totalVendors = vendors.length;
  const totalSubs = subscribers.length;

  const totalGamers = registrations.filter((r) => r.interests.includes('gaming')).length;
  const totalCars = registrations.filter((r) => r.interests.includes('car_meet')).length;

  // Expected Attendance calculations:
  // Weighted multiplication on registrations based on group size:
  // Just Me = 1, 2-3 = 2.5, 4-6 = 5, 6+ = 7
  // Weighted on likelihood (Definitely = 100%, Probably = 70%, Maybe = 40%)
  const expectedAttendance = Math.round(
    registrations.reduce((acc, r) => {
      let multiplier = 1;
      if (r.groupSize === '2-3 People') multiplier = 2.5;
      else if (r.groupSize === '4-6 People') multiplier = 5;
      else if (r.groupSize === 'More than 6') multiplier = 7.5;

      let probability = 0.4;
      if (r.attendanceLikelihood === 'Definitely') probability = 1;
      else if (r.attendanceLikelihood === 'Probably') probability = 0.7;

      return acc + multiplier * probability;
    }, 0)
  );

  // VIP interest rate
  const vipInterestCount = registrations.filter((r) => r.vipInterest === 'Yes' || r.vipInterest === 'Maybe').length;
  const vipPercentage = totalRegs > 0 ? Math.round((vipInterestCount / totalRegs) * 100) : 0;

  // Merch interest rate
  const merchInterestCount = registrations.filter((r) => r.merchInterest === 'Yes' || r.merchInterest === 'Maybe').length;
  const merchPercentage = totalRegs > 0 ? Math.round((merchInterestCount / totalRegs) * 100) : 0;

  // Spending Habitation Summary (P500+ represents premium spenders)
  const premiumSpenders = registrations.filter((r) => r.approximateSpend === 'P500–P1000' || r.approximateSpend === 'Over P1000').length;
  const premiumSpendPercentage = totalRegs > 0 ? Math.round((premiumSpenders / totalRegs) * 100) : 0;

    // Gender breakdown
  const genders = registrations.reduce((acc: { [key: string]: number }, cur) => {
    const val = cur.gender || 'Prefer not to say';
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  // Age Breakdown
  const ages = registrations.reduce((acc: { [key: string]: number }, cur) => {
    acc[cur.ageGroup] = (acc[cur.ageGroup] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  // City analysis
  const cities = registrations.reduce((acc: { [key: string]: number }, cur) => {
    acc[cur.city] = (acc[cur.city] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
  const topCities = Object.entries(cities)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5);

  // Interest distribution
  const interestsCounts: { [key: string]: number } = {};
  registrations.forEach((r) => {
    r.interests.forEach((intr) => {
      interestsCounts[intr] = (interestsCounts[intr] || 0) + 1;
    });
  });
  const sortedInterests = Object.entries(interestsCounts).sort((a, b) => (b[1] as number) - (a[1] as number));

  // Daily Registration Speed (Grouping by simple slice of createdAt e.g. YYYY-MM-DD)
  const dailyGrowth = registrations.reduce((acc: { [key: string]: number }, r) => {
    const date = r.createdAt.substring(0, 10);
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
  const sortedDailyGrowth = Object.entries(dailyGrowth).sort((a, b) => a[0].localeCompare(b[0])).slice(-7); // Last 7 active days

  // Platform Distribution
  const platforms = registrations.reduce((acc: { [key: string]: number }, r) => {
    if (r.gamingDetails?.platform) {
      const p = r.gamingDetails.platform;
      acc[p] = (acc[p] || 0) + 1;
    }
    return acc;
  }, {} as { [key: string]: number });

  // Make Distribution
  const carMakes = registrations.reduce((acc: { [key: string]: number }, r) => {
    if (r.carDetails?.vehicleMake) {
      const m = r.carDetails.vehicleMake.toUpperCase();
      acc[m] = (acc[m] || 0) + 1;
    }
    return acc;
  }, {} as { [key: string]: number });
  const topMakes = Object.entries(carMakes).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 4);

  // --- EXPORT TO CSV LOGIC ---
  const handleExportCSV = (type: 'attendees' | 'vendors' | 'car-community') => {
    storage.trackClick(`btn-csv-export-${type}`);
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = '';

    if (type === 'attendees') {
      headers = ['ID', 'Date', 'Name', 'Email', 'Phone', 'City', 'Age Group', 'Likelihood', 'Spend Expectation', 'VIP Interest', 'Merch Interest', 'Interests Selected'];
      rows = registrations.map((r) => [
        r.id,
        r.createdAt.substring(0, 10),
        r.fullName,
        r.email,
        r.phoneNumber,
        r.city,
        r.ageGroup,
        r.attendanceLikelihood,
        r.approximateSpend,
        r.vipInterest,
        r.merchInterest,
        r.interests.join(' | ')
      ]);
      filename = `PlayFest2026_Attendees_${new Date().toISOString().slice(0,10)}.csv`;
    } else if (type === 'vendors') {
      headers = ['ID', 'Date', 'Business Name', 'Contact Person', 'Number', 'Email', 'Category', 'Stall Size', 'Power Required', 'Products'];
      rows = vendors.map((v) => [
        v.id,
        v.createdAt.substring(0, 10),
        v.businessName,
        v.contactPerson,
        v.contactNumber,
        v.email,
        v.category,
        v.stallSize,
        v.electricityRequired,
        v.productsOrServices
      ]);
      filename = `PlayFest2026_Vendors_${new Date().toISOString().slice(0,10)}.csv`;
    } else if (type === 'car-community') {
      headers = ['ID', 'Name', 'Vehicle Make', 'Model', 'Year', 'Build Type', 'Modifications', 'Enter Competitions'];
      rows = registrations
        .filter((r) => r.carDetails)
        .map((r) => [
          r.id,
          r.fullName,
          r.carDetails?.vehicleMake || '',
          r.carDetails?.vehicleModel || '',
          r.carDetails?.year || '',
          r.carDetails?.buildType || '',
          r.carDetails?.modifications || '',
          r.carDetails?.enterCompetitions || ''
        ]);
      filename = `PlayFest2026_CarShowcase_${new Date().toISOString().slice(0,10)}.csv`;
    }

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast(`CSV: ${filename} downloaded successfully!`, 'success');
  };

  // --- PRINT SPONSOR REPORT ---
  const handlePrint = () => {
    storage.trackClick('btn-print-sponsor-report');
    window.print();
  };

  // --- FILTERED TABLES COMPILATION ---
  const filteredRegistrations = registrations.filter((r) => {
    const matchesSearch = 
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCity = filterCity ? r.city.toLowerCase() === filterCity.toLowerCase() : true;
    const matchesAge = filterAge ? r.ageGroup === filterAge : true;
    const matchesLikelihood = filterLikelihood ? r.attendanceLikelihood === filterLikelihood : true;
    const matchesInterest = filterInterest ? r.interests.includes(filterInterest) : true;

    return matchesSearch && matchesCity && matchesAge && matchesLikelihood && matchesInterest;
  });

  const carRegistrations = registrations.filter((r) => r.carDetails);
  const gamingRegistrations = registrations.filter((r) => r.gamingDetails);

  // Lists of unique Gaborone cities represented
  const filterCitiesList = Array.from(new Set(registrations.map(r => r.city)));

  return (
    <div className="min-h-screen bg-[#070412] text-gray-200 pt-24 pb-16 px-4 sm:px-6 relative z-10">
      
      {/* Unauthenticated Password lock shield box */}
      {!isAuthenticated ? (
        <div className="max-w-md mx-auto py-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-glassmorphism border border-white/5 p-8 text-center shadow-2xl relative"
          >
            <div className="mx-auto w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold font-display uppercase tracking-tight text-white mb-2">
              Organizer Panel Access
            </h3>
            <p className="text-xs text-gray-400 mb-6 font-light">
              Enter the secure Botswana organizer key code to access the sponsor dashboard, CSV exports, and attendee lists.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter Password Code"
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-center text-white font-mono tracking-widest text-sm focus:border-pink-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-display text-sm font-bold uppercase tracking-wider text-white shadow-lg cursor-pointer hover:brightness-110"
              >
                UNLOCKED SECURE DASHBOARD
              </button>
            </form>

            <button
              onClick={onClose}
              className="mt-6 text-xs text-gray-500 hover:text-white underline font-mono cursor-pointer"
            >
              Cancel & Exit
            </button>
          </motion.div>
        </div>
      ) : (
        
        /* AUTHENTICATED PANEL LAYOUT */
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header Strip */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-pink-500 uppercase tracking-widest font-mono">
                <Unlock className="w-3.5 h-3.5" /> Premium Organizer Console
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold font-display uppercase text-white mt-1">
                PlayFest 2026 <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 text-glow-cyan">Control panel</span>
              </h2>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => setShowPrintModal(true)}
                className="px-4 py-2.5 rounded-xl bg-glassmorphism hover:bg-glassmorphism-light border border-white/10 text-xs font-bold font-display uppercase tracking-wider text-pink-400 text-glow-pink flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Sponsor Ready Report
              </button>
              <button
                onClick={() => handleExportCSV('attendees')}
                className="px-4 py-2.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 text-xs font-bold font-display uppercase tracking-wider text-white flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-pink-400" /> Export CSV
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold font-display uppercase tracking-wider text-gray-300 flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Close Console
              </button>
            </div>
          </div>

          {/* Quick Metrics KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-glassmorphism border border-white/5 relative">
              <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider font-mono">RSVP Registrants</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-1">{totalRegs}</div>
              <TrendingUp className="absolute top-4 right-4 w-4 h-4 text-pink-500" />
            </div>

            <div className="p-4 rounded-xl bg-glassmorphism border border-white/5">
              <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider font-mono">Estimated Attendance</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-display text-cyan-400 text-glow-cyan mt-1">{expectedAttendance}</div>
            </div>

            <div className="p-4 rounded-xl bg-glassmorphism border border-white/5">
              <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider font-mono">Tuners Registered</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-1">{totalCars}</div>
            </div>

            <div className="p-4 rounded-xl bg-glassmorphism border border-white/5">
              <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider font-mono">Gamers Signed</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-1">{totalGamers}</div>
            </div>

            <div className="col-span-2 md:col-span-1 p-4 rounded-xl bg-glassmorphism border border-white/5">
              <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider font-mono">Food / Brand Vendors</div>
              <div className="text-2xl sm:text-3xl font-extrabold font-display text-purple-400 text-glow-purple mt-1">{totalVendors}</div>
            </div>
          </div>

          {/* Organizer Tabs */}
          <div className="flex border-b border-white/5 p-1 max-w-full overflow-x-auto gap-2">
            {[
              { id: 'trends', label: 'Sponsor & Trends Stats', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'attendees', label: `Attendee list [${filteredRegistrations.length}]`, icon: <Users className="w-4 h-4" /> },
              { id: 'cars', label: `Car Showcase [${carRegistrations.length}]`, icon: <Car className="w-4 h-4" /> },
              { id: 'gamers', label: `Gaming Arena [${gamingRegistrations.length}]`, icon: <Gamepad2 className="w-4 h-4" /> },
              { id: 'vendors', label: `Stall bookings [${totalVendors}]`, icon: <Store className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`py-2 px-4 rounded-lg text-xs font-bold font-display uppercase tracking-wider flex items-center gap-2 shrink-0 cursor-pointer transition-all ${
                  activeSubTab === tab.id
                    ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30 shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Subtab Contents Container */}
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              
              {/* TRENDS CHART VIEW */}
              {activeSubTab === 'trends' && (
                <motion.div
                  key="trends-panels"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Column 1: Geographic density (Bar chart) */}
                    <div className="p-6 rounded-2xl bg-glassmorphism border border-white/5">
                      <h4 className="text-sm font-bold font-display uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-pink-500" /> Geographic Density (Top Cities)
                      </h4>
                      <div className="space-y-4">
                        {topCities.map(([cty, cnt]) => {
                          const count = cnt as number;
                          const maxCount = (topCities[0]?.[1] as number) || 1;
                          const ratio = (count / maxCount) * 100;
                          return (
                            <div key={cty} className="space-y-1">
                              <div className="flex justify-between text-xs font-medium text-gray-300">
                                <span>{cty}</span>
                                <span className="font-semibold text-pink-500">{cnt} rsvps</span>
                              </div>
                              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full" style={{ width: `${ratio}%` }} />
                              </div>
                            </div>
                          );
                        })}
                        {topCities.length === 0 && <p className="text-xs text-gray-500">No city data logged yet.</p>}
                      </div>
                    </div>

                    {/* Column 2: Demographic Interests (Bar chart) */}
                    <div className="p-6 rounded-2xl bg-glassmorphism border border-white/5">
                      <h4 className="text-sm font-bold font-display uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-cyan-400" /> Top Attractions Demand
                      </h4>
                      <div className="space-y-4">
                        {sortedInterests.slice(0, 5).map(([intr, cnt]) => {
                          const maxCount = sortedInterests[0]?.[1] || 1;
                          const ratio = (cnt / maxCount) * 100;
                          const label = interestOptions.find((o) => o.value === intr)?.label || intr;
                          return (
                            <div key={intr} className="space-y-1">
                              <div className="flex justify-between text-xs font-medium text-gray-300">
                                <span>{label}</span>
                                <span className="font-semibold text-cyan-400">{cnt} clicks</span>
                              </div>
                              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full" style={{ width: `${ratio}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Column 3: Commercial monetization potential summary */}
                    <div className="p-6 rounded-2xl bg-glassmorphism border border-white/5 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-bold font-display uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-purple-400" /> Sponsor Metrics Conversion
                        </h4>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="p-3 rounded-xl bg-black/30 text-center">
                            <span className="text-[10px] uppercase font-bold text-gray-400 block font-mono">VIP OPT-IN</span>
                            <span className="text-2xl font-bold font-display text-pink-500 text-glow-pink mt-1 block">{vipPercentage}%</span>
                          </div>

                          <div className="p-3 rounded-xl bg-black/30 text-center">
                            <span className="text-[10px] uppercase font-bold text-gray-400 block font-mono">MERCH DEMAND</span>
                            <span className="text-2xl font-bold font-display text-cyan-400 text-glow-cyan mt-1 block">{merchPercentage}%</span>
                          </div>

                          <div className="col-span-2 p-3.5 rounded-xl bg-black/30 text-center">
                            <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider block font-mono">PREMIUM SPENDERS (P500+)</span>
                            <span className="text-3xl font-extrabold font-display text-purple-400 text-glow-purple mt-1 block">{premiumSpendPercentage}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-[10px] text-gray-400 leading-relaxed font-light mt-4">
                        * High-quality data proves Botswana attendees intend to spend, establishing commercial potential for corporate brand partners.
                      </p>
                    </div>
                  </div>

                  {/* Daily signup growth trend charts (SVG represented) */}
                  <div className="p-6 rounded-2xl bg-glassmorphism border border-white/5">
                    <h4 className="text-sm font-bold font-display uppercase tracking-wider text-white mb-6 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-pink-500" /> Registration Speed (Last 7 Active Dates)
                    </h4>
                    
                    <div className="h-48 w-full flex items-end gap-3 px-2">
                      {sortedDailyGrowth.map(([date, cnt]) => {
                        const count = cnt as number;
                        const maxCount = Math.max(...sortedDailyGrowth.map(([, c]) => c as number)) || 1;
                        const barHeight = (count / maxCount) * 85; 
                        return (
                          <div key={date} className="flex-1 flex flex-col items-center justify-end h-full">
                            <span className="text-[10px] font-bold text-pink-400 mb-1.5 font-mono">{count}</span>
                            <div 
                              className="w-full bg-gradient-to-t from-purple-600 via-pink-500 to-cyan-400 rounded-t-lg shadow-[0_0_15px_rgba(236,72,153,0.15)] transition-all duration-500"
                              style={{ height: `${barHeight}%` }}
                            />
                            <span className="text-[9px] text-gray-400 uppercase font-mono tracking-tighter mt-2">{date.substring(5)}</span>
                          </div>
                        );
                      })}
                      {sortedDailyGrowth.length === 0 && (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                          Waiting for more localized dates to log.
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ATTENDEE DATATABLE VIEW */}
              {activeSubTab === 'attendees' && (
                <motion.div
                  key="attendee-panel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Search/Filters bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-white/3 p-4 rounded-xl border border-white/5">
                    <div className="relative col-span-1 sm:col-span-2">
                      <Search className="absolute top-3 left-3 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search name, email, registration id..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full py-2 pl-9 pr-4 rounded-lg bg-black/40 border border-white/5 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <select
                      value={filterCity}
                      onChange={(e) => setFilterCity(e.target.value)}
                      className="py-2 px-3 rounded-lg bg-black/40 border border-white/5 text-xs text-gray-300 cursor-pointer"
                    >
                      <option value="">All Botswana Cities</option>
                      {filterCitiesList.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    <select
                      value={filterLikelihood}
                      onChange={(e) => setFilterLikelihood(e.target.value)}
                      className="py-2 px-3 rounded-lg bg-black/40 border border-white/5 text-xs text-gray-300 cursor-pointer"
                    >
                      <option value="">All Likelihoods</option>
                      <option value="Definitely">Definitely</option>
                      <option value="Probably">Probably</option>
                      <option value="Maybe">Maybe</option>
                    </select>

                    <select
                      value={filterInterest}
                      onChange={(e) => setFilterInterest(e.target.value)}
                      className="py-2 px-3 rounded-lg bg-black/40 border border-white/5 text-xs text-gray-300 cursor-pointer"
                    >
                      <option value="">All Interests</option>
                      <option value="gaming">Gaming</option>
                      <option value="car_meet">Car Meet</option>
                      <option value="live_music">Live Music</option>
                      <option value="food_drinks">Food & Drinks</option>
                    </select>
                  </div>

                  {/* Results list */}
                  <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/30">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          <th className="p-4">Reg ID</th>
                          <th className="p-4">Name</th>
                          <th className="p-4">City</th>
                          <th className="p-4">Likelihood</th>
                          <th className="p-4">Group Size</th>
                          <th className="p-4">VIP Interest</th>
                          <th className="p-4">Approx Spend</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs divide-y divide-white/5">
                        {filteredRegistrations.map((r) => (
                          <tr key={r.id} className="hover:bg-white/3 transition-colors">
                            <td className="p-4 font-mono text-[10px] text-pink-400">{r.id}</td>
                            <td className="p-4 font-semibold text-white">
                              <div>{r.fullName}</div>
                              <div className="text-[10px] text-gray-400 font-normal">{r.email} • {r.phoneNumber}</div>
                            </td>
                            <td className="p-4">{r.city}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono ${
                                r.attendanceLikelihood === 'Definitely' 
                                  ? 'bg-green-500/10 text-green-400' 
                                  : r.attendanceLikelihood === 'Probably' 
                                  ? 'bg-blue-500/10 text-blue-400' 
                                  : 'bg-yellow-500/10 text-yellow-400'
                              }`}>
                                {r.attendanceLikelihood}
                              </span>
                            </td>
                            <td className="p-4">{r.groupSize}</td>
                            <td className="p-4">{r.vipInterest}</td>
                            <td className="p-4 font-mono font-semibold text-pink-400">{r.approximateSpend}</td>
                          </tr>
                        ))}
                        {filteredRegistrations.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-gray-500 font-light">
                              No registrations match filter configurations.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* CAR SHOWCASE VIEW */}
              {activeSubTab === 'cars' && (
                <motion.div
                  key="cars-panel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-bold font-display uppercase tracking-wider text-pink-400 text-glow-pink">
                      Botswana’s Elite Car staging applications
                    </h4>
                    <button
                      onClick={() => handleExportCSV('car-community')}
                      className="px-3 py-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/25 text-xs text-white"
                    >
                      Export Car CSV
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {carRegistrations.map((r) => (
                      <div key={r.id} className="p-5 rounded-xl bg-glassmorphism border border-white/5 hover:border-pink-500/30 transition-all flex gap-4">
                        {r.carDetails?.photoUrl ? (
                          <img
                            src={r.carDetails.photoUrl}
                            alt="Custom build"
                            className="w-24 h-24 rounded-lg object-cover border border-white/10 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-lg bg-black/40 border border-white/5 flex flex-col items-center justify-center shrink-0">
                            <Car className="w-8 h-8 text-pink-500/45" />
                            <span className="text-[8px] text-gray-500 uppercase mt-1">No Image</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h5 className="text-sm font-bold text-white font-display truncate">
                              {r.carDetails?.vehicleMake} {r.carDetails?.vehicleModel}
                            </h5>
                            <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-pink-500/20 text-pink-400">
                              {r.carDetails?.year}
                            </span>
                          </div>
                          
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                            Owner: {r.fullName}
                          </div>

                          <div className="text-xs text-gray-300 font-light mt-2 line-clamp-2">
                            <strong>Build type:</strong> {r.carDetails?.buildType} • {r.carDetails?.modifications}
                          </div>

                          <div className="flex gap-2 mt-3">
                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold font-mono ${
                              r.carDetails?.displayVehicle === 'Yes' ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-400'
                            }`}>
                              Display: {r.carDetails?.displayVehicle}
                            </span>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold font-mono ${
                              r.carDetails?.enterCompetitions === 'Yes' ? 'bg-pink-500/10 text-pink-400' : 'bg-gray-800 text-gray-400'
                            }`}>
                              Compete: {r.carDetails?.enterCompetitions}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {carRegistrations.length === 0 && (
                      <p className="text-xs text-gray-500 col-span-2 text-center p-8">No vehicles registered yet.</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* GAMING ARENA VIEW */}
              {activeSubTab === 'gamers' && (
                <motion.div
                  key="gamers-panel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <h4 className="text-sm font-bold font-display uppercase tracking-wider text-cyan-400 text-glow-cyan mb-1">
                    Esports platform preferences & tournament registrations
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    {/* Platform distribution gauge */}
                    {Object.entries(platforms).map(([plat, cnt]) => {
                      const count = cnt as number;
                      const totalGamersLogged = gamingRegistrations.length || 1;
                      const percent = Math.round((count / totalGamersLogged) * 100);
                      return (
                        <div key={plat} className="p-4 rounded-xl bg-glassmorphism border border-white/5">
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider font-mono">{plat} Share</span>
                          <div className="text-xl font-extrabold text-white font-display mt-0.5">{cnt} gamers</div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/30">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          <th className="p-4">Reg ID</th>
                          <th className="p-4">Gamer Name</th>
                          <th className="p-4">Platform</th>
                          <th className="p-4">Favorite Games</th>
                          <th className="p-4">Competes in tournaments?</th>
                          <th className="p-4">Categories</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs divide-y divide-white/5">
                        {gamingRegistrations.map((g) => (
                          <tr key={g.id} className="hover:bg-white/3 transition-colors">
                            <td className="p-4 font-mono text-[10px] text-cyan-400">{g.id}</td>
                            <td className="p-4 text-white font-semibold">{g.fullName}</td>
                            <td className="p-4 font-mono font-bold text-white">{g.gamingDetails?.platform}</td>
                            <td className="p-4 text-gray-300 max-w-xs truncate">{g.gamingDetails?.favoriteGames}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold font-mono ${
                                g.gamingDetails?.participateInTournaments === 'Yes'
                                  ? 'bg-green-500/10 text-green-400'
                                  : 'bg-yellow-500/10 text-yellow-500'
                              }`}>
                                {g.gamingDetails?.participateInTournaments}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {g.gamingDetails?.preferredCategories.map((c) => (
                                  <span key={c} className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* VENDORS APPLICATIONS TAB */}
              {activeSubTab === 'vendors' && (
                <motion.div
                  key="vendors-panel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-bold font-display uppercase tracking-wider text-purple-400 text-glow-purple">
                      Active Brand & Local Vendor submissions
                    </h4>
                    <button
                      onClick={() => handleExportCSV('vendors')}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 text-xs text-white"
                    >
                      Export Vendor CSV
                    </button>
                  </div>

                  <div className="space-y-4">
                    {vendors.map((v) => (
                      <div key={v.id} className="p-6 rounded-2xl bg-glassmorphism border border-white/5 hover:border-purple-500/20 transition-all">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                          <div>
                            <h5 className="text-base font-bold font-display text-white">{v.businessName}</h5>
                            <span className="text-xs text-gray-400">Contact: {v.contactPerson} • {v.contactNumber} • {v.email}</span>
                          </div>
                          <span className="text-[10px] font-extrabold uppercase font-mono px-3 py-1 rounded bg-purple-500/20 text-purple-400">
                            {v.category}
                          </span>
                        </div>

                        <div className="text-xs text-gray-300 font-light mt-3">
                          <strong>Products description:</strong> {v.productsOrServices}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/5 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 block font-mono">Social links</span>
                            <span className="font-mono text-cyan-400">{v.socialMediaLinks || 'None provided'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 block font-mono">Stall Specs</span>
                            <span className="font-semibold text-white">{v.stallSize}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 block font-mono">Power Required</span>
                            <span className={`font-semibold ${v.electricityRequired === 'Yes' ? 'text-pink-500' : 'text-gray-400'}`}>
                              {v.electricityRequired}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 block font-mono">Enquiry date</span>
                            <span className="text-gray-400 font-mono">{v.createdAt.substring(0, 10)}</span>
                          </div>
                        </div>

                        {v.additionalRequests && (
                          <div className="mt-3 p-3 rounded-lg bg-black/40 border border-white/5 text-xs text-gray-300 font-light">
                            <strong>Additional requests:</strong> {v.additionalRequests}
                          </div>
                        )}
                      </div>
                    ))}
                    {vendors.length === 0 && (
                      <p className="text-xs text-gray-500 text-center p-8">No vendor applications completed yet.</p>
                    )}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>
      )}

      {/* SPONSOR PRINTABLE LAYOUT MODAL */}
      <AnimatePresence>
        {showPrintModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 overflow-y-auto p-4 sm:p-10 flex items-start justify-center backdrop-blur-md"
          >
            <div className="w-full max-w-4xl bg-white text-gray-900 rounded-3xl p-8 shadow-2xl relative border border-gray-200">
              
              {/* Top printing utility commands (Hidden on actual physical window.print) */}
              <div className="flex justify-between items-center pb-6 mb-6 border-b border-gray-100 no-print">
                <span className="text-xs uppercase font-extrabold tracking-widest text-[#070412]">
                  PlayFest 2026 Botswana • Sponsor Ready Report
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 rounded-lg bg-[#070412] text-white hover:brightness-115 text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                  </button>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Close PDF
                  </button>
                </div>
              </div>

              {/* PRINT TARGET INNER LAYOUT */}
              <div className="space-y-8" id="print-content">
                {/* Letterhead */}
                <div className="flex justify-between items-start border-b-4 border-purple-800 pb-6">
                  <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-[#070412]">
                      PLAYFEST BOTSWANA 2026
                    </h1>
                    <p className="text-xs uppercase font-bold tracking-widest text-purple-700">
                      Sponsorship Proposal Demographic Report
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Gaborone, Botswana • Planned Date: November 2026</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono bg-purple-100 text-purple-900 border border-purple-200 px-3 py-1.5 rounded-lg inline-block font-semibold">
                      CONFIDENTIAL REPORT
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1">Generated: 2026-06-17</p>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight border-b pb-1 font-display">
                    1. Executive Summary
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed font-light">
                    This document compiles concrete public interest registration metrics for PlayFest 2026. Rather than relying on standard speculative estimates, we have conducted an extensive audience registration campaign to prove demand and collect precise demographic insights to establish sponsor brand ROI.
                  </p>
                </div>

                {/* KPI metrics row */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 border rounded-xl text-center">
                    <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Total Registers</span>
                    <span className="block text-2xl font-bold font-display mt-1 text-purple-800">{totalRegs}</span>
                  </div>
                  <div className="p-4 bg-gray-50 border rounded-xl text-center">
                    <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Expected Attendance</span>
                    <span className="block text-2xl font-bold font-display mt-1 text-emerald-800">{expectedAttendance}</span>
                  </div>
                  <div className="p-4 bg-gray-50 border rounded-xl text-center">
                    <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Tuner Builds</span>
                    <span className="block text-2xl font-bold font-display mt-1 text-gray-900">{totalCars}</span>
                  </div>
                  <div className="p-4 bg-gray-50 border rounded-xl text-center">
                    <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Esport Players</span>
                    <span className="block text-2xl font-bold font-display mt-1 text-purple-800">{totalGamers}</span>
                  </div>
                </div>

                {/* Key commercial graphs */}
                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div className="p-5 border rounded-xl bg-gray-50">
                    <h4 className="text-xs uppercase font-extrabold text-gray-900 mb-3 font-mono tracking-wider">
                      Attraction Interests Breakdown
                    </h4>
                    <div className="space-y-3">
                      {sortedInterests.slice(0, 6).map(([intr, cnt]) => {
                        const count = cnt as number;
                        const maxCount = (sortedInterests[0]?.[1] as number) || 1;
                        const label = interestOptions.find((o) => o.value === intr)?.label || intr;
                        const ratio = (count / maxCount) * 100;
                        return (
                          <div key={intr} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-gray-700">
                              <span>{label}</span>
                              <span className="text-purple-700 font-bold">{Math.round((cnt/totalRegs)*100)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-200 rounded-full">
                              <div className="h-full bg-purple-700 rounded-full" style={{ width: `${ratio}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-5 border rounded-xl bg-gray-50 space-y-4">
                    <h4 className="text-xs uppercase font-extrabold text-gray-900 font-mono tracking-wider">
                      Attendee Spends & VIP Opt-In Rates
                    </h4>
                    
                    <div className="space-y-2.5">
                      <div className="flex justify-between border-b pb-1.5 text-xs text-gray-700 font-light">
                        <span>VIP / Exclusive Packages Interest Rate:</span>
                        <strong className="text-purple-800 font-bold">{vipPercentage}%</strong>
                      </div>
                      <div className="flex justify-between border-b pb-1.5 text-xs text-gray-700 font-light">
                        <span>Official PlayFest Merch Buying Intent:</span>
                        <strong className="text-purple-800 font-bold">{merchPercentage}%</strong>
                      </div>
                      <div className="flex justify-between border-b pb-1.5 text-xs text-gray-700 font-light">
                        <span>Premium Spending Intent (P500+):</span>
                        <strong className="text-purple-800 font-bold">{premiumSpendPercentage}%</strong>
                      </div>
                      <div className="flex justify-between text-xs text-gray-700 font-light">
                        <span>Cities / Municipal Districts represented:</span>
                        <strong className="text-purple-800 font-bold">{topCities.length} registered</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Disclaimer */}
                <div className="pt-6 border-t font-light text-[10px] text-gray-400 text-center uppercase tracking-widest leading-relaxed">
                  Confidential Document. For Sponsor Auditing & Venue Engagement Purposes Only. <br />
                  © PlayFest 2026 Botswana. All Rights Reserved.
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
