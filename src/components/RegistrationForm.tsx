/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Gamepad2, 
  Car, 
  Briefcase, 
  CreditCard, 
  CheckCircle2, 
  Upload, 
  X, 
  Eye, 
  Loader2 
} from 'lucide-react';
import { AttendeeRegistration, VendorApplication } from '../types';
import { storage } from '../lib/storage';

interface RegistrationFormProps {
  onSuccess: (data: AttendeeRegistration | VendorApplication, type: 'attendee' | 'vendor') => void;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export default function RegistrationForm({ onSuccess, addToast }: RegistrationFormProps) {
  const [activeTab, setActiveTab] = useState<'attendee' | 'vendor'>('attendee');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Attendee Form State ---
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dialCode, setDialCode] = useState('+267');
  const [customDialCode, setCustomDialCode] = useState('');
  const [country, setCountry] = useState('Botswana');
  const [customCountry, setCustomCountry] = useState('');
  const [ageGroup, setAgeGroup] = useState<AttendeeRegistration['ageGroup']>('18-24');
  const [gender, setGender] = useState<AttendeeRegistration['gender']>('Prefer not to say');
  const [city, setCity] = useState('');
  const [likelihood, setLikelihood] = useState<AttendeeRegistration['attendanceLikelihood']>('Definitely');
  const [groupSize, setGroupSize] = useState<AttendeeRegistration['groupSize']>('Just Me');
  const [travelDist, setTravelDist] = useState<AttendeeRegistration['travelDistance']>('Within my city');
  const [referral, setReferral] = useState<AttendeeRegistration['referralSource']>('Instagram');
  
  // Interests (checkboxes)
  const interestOptions = [
    { value: 'gaming', label: 'Gaming/Esports' },
    { value: 'car_meet', label: 'Car Showcase & Meet' },
    { value: 'live_music', label: 'Live DJs & Music' },
    { value: 'food_drinks', label: 'Food & Drinks' },
    { value: 'vendors', label: 'Vendor Marketplace' },
    { value: 'photography', label: 'Photography & Media' },
    { value: 'content_creation', label: 'Content Creation' },
    { value: 'networking', label: 'Networking/Community' },
    { value: 'competitions', label: 'Prize Competitions' },
    { value: 'family_activities', label: 'Family Activities' }
  ];
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Spending habits
  const [spend, setSpend] = useState<AttendeeRegistration['approximateSpend']>('P200–P500');
  const [vipInterest, setVipInterest] = useState<AttendeeRegistration['vipInterest']>('Maybe');
  const [merchInterest, setMerchInterest] = useState<AttendeeRegistration['merchInterest']>('Maybe');
  const [earlyAccess, setEarlyAccess] = useState<AttendeeRegistration['earlyTicketAccess']>('Yes');

  // Conditional: Car Specs
  const [carMake, setCarMake] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carYear, setCarYear] = useState('');
  const [carBuild, setCarBuild] = useState('Stance');
  const [carMods, setCarMods] = useState('');
  const [carDisplay, setCarDisplay] = useState<'Yes' | 'No'>('Yes');
  const [carComp, setCarComp] = useState<'Yes' | 'No'>('Yes');
  const [carPhoto, setCarPhoto] = useState<string>(''); // Base64 image
  const [dragging, setDragging] = useState(false);

  // Conditional: Gaming Specs
  const [gamingPlatform, setGamingPlatform] = useState<AttendeeRegistration['gamingDetails']['platform']>('PlayStation');
  const [gamingGames, setGamingGames] = useState('');
  const [gamingTourney, setGamingTourney] = useState<'Yes' | 'No' | 'Maybe'>('Yes');
  const [gamingCats, setGamingCats] = useState<string[]>([]);

  // --- Vendor Form State ---
  const [vendorBusiness, setVendorBusiness] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorDialCode, setVendorDialCode] = useState('+267');
  const [vendorCustomDialCode, setVendorCustomDialCode] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorCountry, setVendorCountry] = useState('Botswana');
  const [vendorCustomCountry, setVendorCustomCountry] = useState('');
  const [vendorCategory, setVendorCategory] = useState<VendorApplication['category']>('Food & Drinks');
  const [vendorProducts, setVendorProducts] = useState('');
  const [vendorSocials, setVendorSocials] = useState('');
  const [vendorStallSize, setVendorStallSize] = useState<VendorApplication['stallSize']>('Small (3m x 3m)');
  const [vendorPower, setVendorPower] = useState<'Yes' | 'No'>('No');
  const [vendorRequests, setVendorRequests] = useState('');

  // Interest Checkboxes handles
  const handleInterestChange = (val: string) => {
    setSelectedInterests((prev) => 
      prev.includes(val) ? prev.filter((i) => i !== val) : [...prev, val]
    );
  };

  const handleGameCatChange = (val: string) => {
    setGamingCats((prev) => 
      prev.includes(val) ? prev.filter((i) => i !== val) : [...prev, val]
    );
  };

  // Car Photo Base64 Uploader & Drag and Drop
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processPhotoFile(file);
    }
  };

  const processPhotoFile = (file: File) => {
    if (file.size > 2.5 * 1024 * 1024) {
      addToast('Image is too large (Maximum 2.5MB)', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setCarPhoto(reader.result as string);
      addToast('Vehicle photo loaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processPhotoFile(file);
    }
  };

  const removeCarPhoto = () => {
    setCarPhoto('');
  };

  // --- Submissions handlers ---
  const handleAttendeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !city) {
      addToast('Please fill out all required personal details.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const interestsToSend = selectedInterests.length > 0 ? selectedInterests : ['General Interest'];
      
      const activeDial = dialCode === 'Other' ? (customDialCode.trim() || '+') : dialCode;
      const finalPhone = activeDial ? `${activeDial} ${phone.trim()}` : phone.trim();
      const finalCountry = country === 'Other' ? (customCountry.trim() || 'International') : country;

      const payload: Omit<AttendeeRegistration, 'id' | 'createdAt'> = {
        fullName,
        email,
        phoneNumber: finalPhone,
        country: finalCountry,
        ageGroup,
        gender,
        city,
        attendanceLikelihood: likelihood,
        groupSize,
        travelDistance: travelDist,
        referralSource: referral,
        interests: interestsToSend,
        approximateSpend: spend,
        vipInterest,
        merchInterest,
        earlyTicketAccess: earlyAccess,
      };

      // Conditionals
      if (selectedInterests.includes('gaming')) {
        payload.gamingDetails = {
          platform: gamingPlatform,
          favoriteGames: gamingGames || 'Multiple casual games',
          participateInTournaments: gamingTourney,
          preferredCategories: gamingCats.length > 0 ? gamingCats : ['Casual']
        };
      }

      if (selectedInterests.includes('car_meet')) {
        payload.carDetails = {
          vehicleMake: carMake || 'Custom / Tuner',
          vehicleModel: carModel || 'Build',
          year: carYear || 'Unspecified',
          buildType: carBuild,
          modifications: carMods || 'Suspension, wheels, custom details',
          displayVehicle: carDisplay,
          enterCompetitions: carComp,
          photoUrl: carPhoto
        };
      }

      const result = await storage.saveRegistration(payload);
      onSuccess(result, 'attendee');
    } catch {
      addToast('Error saving registration. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorBusiness || !vendorContact || !vendorPhone || !vendorEmail) {
      addToast('Please complete key business contact fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const activeVendorDial = vendorDialCode === 'Other' ? (vendorCustomDialCode.trim() || '+') : vendorDialCode;
      const finalVendorPhone = activeVendorDial ? `${activeVendorDial} ${vendorPhone.trim()}` : vendorPhone.trim();
      const finalVendorCountry = vendorCountry === 'Other' ? (vendorCustomCountry.trim() || 'International') : vendorCountry;

      const payload: Omit<VendorApplication, 'id' | 'createdAt'> = {
        businessName: vendorBusiness,
        contactPerson: vendorContact,
        contactNumber: finalVendorPhone,
        email: vendorEmail,
        country: finalVendorCountry,
        category: vendorCategory,
        productsOrServices: vendorProducts,
        socialMediaLinks: vendorSocials,
        stallSize: vendorStallSize,
        electricityRequired: vendorPower,
        additionalRequests: vendorRequests
      };

      const result = await storage.saveVendorApplication(payload);
      onSuccess(result, 'vendor');
    } catch {
      addToast('Error submitting vendor proposal. Please retry.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-20 px-4 relative max-w-4xl mx-auto z-10" id="registration-section">
      {/* Background dynamic blur orbs */}
      <div className="absolute top-1/4 right-10 w-96 h-96 bg-pink-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-10 w-96 h-96 bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400 text-glow-cyan mb-2 font-display">
          Registration Hub
        </h2>
        <h3 className="text-3xl sm:text-5xl font-extrabold font-display uppercase tracking-tight text-white">
          Secure Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 text-glow-pink">Spot</span>
        </h3>
        <p className="text-gray-400 max-w-xl mx-auto mt-3 text-sm sm:text-base font-light">
          Choose whether you are registering as an attendee, showcasing a custom vehicle, or booking commercial food/stall workspace.
        </p>
      </div>

      {/* Dual Tab switches */}
      <div className="flex justify-center p-1.5 rounded-xl bg-glassmorphism max-w-md mx-auto mb-10 border border-white/5 relative">
        <button
          onClick={() => {
            storage.trackClick('btn-attendee-tab');
            setActiveTab('attendee');
          }}
          className={`flex-1 py-3 text-sm font-display font-bold uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'attendee'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/20'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" /> Attendee / Enthusiast
        </button>
        <button
          onClick={() => {
            storage.trackClick('btn-vendor-tab');
            setActiveTab('vendor');
          }}
          className={`flex-1 py-3 text-sm font-display font-bold uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'vendor'
              ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Brand & Vendor
        </button>
      </div>

      {/* Forms Area wrapper */}
      <div className="rounded-3xl bg-glassmorphism border border-white/5 shadow-2xl relative overflow-hidden p-6 sm:p-10">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-60" />
        
        <AnimatePresence mode="wait">
          {activeTab === 'attendee' ? (
            <motion.form
              key="attendee-form"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleAttendeeSubmit}
              className="space-y-8"
            >
              {/* Pillar 1: Personal Demographic Details */}
              <div>
                <h4 className="text-lg font-bold font-display uppercase text-white flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                  <span className="p-1 rounded bg-pink-500/10 text-pink-400"><User className="w-4 h-4" /></span> Personal Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                      Full Name <span className="text-pink-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Thabo Motsamai"
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none focus:ring-1 focus:ring-pink-500/30 transition-all font-light text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                      Email Address <span className="text-pink-500">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. thabo@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none focus:ring-1 focus:ring-pink-500/30 transition-all font-light text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                      Phone Number <span className="text-pink-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={dialCode}
                        onChange={(e) => setDialCode(e.target.value)}
                        className="px-3 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none text-xs cursor-pointer max-w-[120px]"
                      >
                        <option value="+267">🇧🇼 +267</option>
                        <option value="+27">🇿🇦 +27</option>
                        <option value="+263">🇿🇼 +263</option>
                        <option value="+264">🇳🇦 +264</option>
                        <option value="+260">🇿🇲 +260</option>
                        <option value="+266">🇱🇸 +266</option>
                        <option value="+268">🇸🇿 +268</option>
                        <option value="+258">🇲🇿 +258</option>
                        <option value="+265">🇲🇼 +265</option>
                        <option value="+244">🇦🇴 +244</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="Other">Other</option>
                      </select>

                      {dialCode === 'Other' && (
                        <input
                          required
                          type="text"
                          value={customDialCode}
                          onChange={(e) => setCustomDialCode(e.target.value)}
                          placeholder="+123"
                          className="w-16 px-2 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none text-center font-mono text-xs"
                        />
                      )}

                      <input
                        required
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 71 234 567"
                        className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none focus:ring-1 focus:ring-pink-500/30 transition-all font-light text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                      Country of Residence <span className="text-pink-500">*</span>
                    </label>
                    <div className="space-y-2">
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm cursor-pointer"
                      >
                        <option className="bg-[#0f0c1e]" value="Botswana">Botswana 🇧🇼</option>
                        <option className="bg-[#0f0c1e]" value="South Africa">South Africa 🇿🇦</option>
                        <option className="bg-[#0f0c1e]" value="Zimbabwe">Zimbabwe 🇿🇼</option>
                        <option className="bg-[#0f0c1e]" value="Namibia">Namibia 🇳🇦</option>
                        <option className="bg-[#0f0c1e]" value="Zambia">Zambia 🇿🇲</option>
                        <option className="bg-[#0f0c1e]" value="Lesotho">Lesotho 🇱🇸</option>
                        <option className="bg-[#0f0c1e]" value="Eswatini">Eswatini 🇸🇿</option>
                        <option className="bg-[#0f0c1e]" value="Mozambique">Mozambique 🇲🇿</option>
                        <option className="bg-[#0f0c1e]" value="Angola">Angola 🇦🇴</option>
                        <option className="bg-[#0f0c1e]" value="Malawi">Malawi 🇲🇼</option>
                        <option className="bg-[#0f0c1e]" value="Other">Other / International</option>
                      </select>

                      {country === 'Other' && (
                        <input
                          required
                          type="text"
                          value={customCountry}
                          onChange={(e) => setCustomCountry(e.target.value)}
                          placeholder="Enter your country name"
                          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                      Resident City / Town <span className="text-pink-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Gaborone or Johannesburg"
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none focus:ring-1 focus:ring-pink-500/30 transition-all font-light text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                      Age Group <span className="text-pink-500">*</span>
                    </label>
                    <select
                      value={ageGroup}
                      onChange={(e) => setAgeGroup(e.target.value as AttendeeRegistration['ageGroup'])}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm cursor-pointer"
                    >
                      <option className="bg-[#0f0c1e]" value="Under 18">Under 18</option>
                      <option className="bg-[#0f0c1e]" value="18-24">18-24</option>
                      <option className="bg-[#0f0c1e]" value="25-34">25-34</option>
                      <option className="bg-[#0f0c1e]" value="35-44">35-44</option>
                      <option className="bg-[#0f0c1e]" value="45+ flex">45+</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                      Gender Identity (Optional)
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as AttendeeRegistration['gender'])}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm cursor-pointer"
                    >
                      <option className="bg-[#0f0c1e]" value="Male">Male</option>
                      <option className="bg-[#0f0c1e]" value="Female">Female</option>
                      <option className="bg-[#0f0c1e]" value="Non-binary">Non-binary</option>
                      <option className="bg-[#0f0c1e]" value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pillar 2: Attendance details */}
              <div>
                <h4 className="text-lg font-bold font-display uppercase text-white flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                  <span className="p-1 rounded bg-cyan-500/10 text-cyan-400"><MapPin className="w-4 h-4" /></span> Attendance Intent
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                      Would you attend PlayFest 2026? <span className="text-pink-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Definitely', 'Probably', 'Maybe'] as AttendeeRegistration['attendanceLikelihood'][]).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setLikelihood(opt)}
                          className={`py-2.5 rounded-lg font-display text-xs font-bold uppercase border transition-all cursor-pointer ${
                            likelihood === opt
                              ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                              : 'border-white/5 bg-black/20 text-gray-400 hover:text-white'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                      Expected Group Size <span className="text-pink-500">*</span>
                    </label>
                    <select
                      value={groupSize}
                      onChange={(e) => setGroupSize(e.target.value as AttendeeRegistration['groupSize'])}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm cursor-pointer"
                    >
                      <option className="bg-[#0f0c1e]" value="Just Me">Just Me</option>
                      <option className="bg-[#0f0c1e]" value="2-3 People">2–3 People</option>
                      <option className="bg-[#0f0c1e]" value="4-6 People">4–6 People</option>
                      <option className="bg-[#0f0c1e]" value="More than 6">More than 6</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                      How Far Would You Travel? <span className="text-pink-500">*</span>
                    </label>
                    <select
                      value={travelDist}
                      onChange={(e) => setTravelDist(e.target.value as AttendeeRegistration['travelDistance'])}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm cursor-pointer"
                    >
                      <option className="bg-[#0f0c1e]" value="Within my city">Within my city</option>
                      <option className="bg-[#0f0c1e]" value="Less than 100 km">Less than 100 km</option>
                      <option className="bg-[#0f0c1e]" value="More than 100 km">More than 100 km</option>
                      <option className="bg-[#0f0c1e]" value="From another country">From another country</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                      How did you hear about PlayFest? <span className="text-pink-500">*</span>
                    </label>
                    <select
                      value={referral}
                      onChange={(e) => setReferral(e.target.value as AttendeeRegistration['referralSource'])}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm cursor-pointer"
                    >
                      <option className="bg-[#0f0c1e]" value="TikTok">TikTok</option>
                      <option className="bg-[#0f0c1e]" value="Instagram">Instagram</option>
                      <option className="bg-[#0f0c1e]" value="Facebook">Facebook</option>
                      <option className="bg-[#0f0c1e]" value="WhatsApp">WhatsApp</option>
                      <option className="bg-[#0f0c1e]" value="Friend">Friend / Word of Mouth</option>
                      <option className="bg-[#0f0c1e]" value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pillar 3: What interests you most */}
              <div>
                <h4 className="text-lg font-bold font-display uppercase text-white flex items-center gap-2 mb-2 border-b border-white/5 pb-2">
                  <span className="p-1 rounded bg-purple-500/10 text-purple-400"><Gamepad2 className="w-4 h-4" /></span> What Interests You Most?
                </h4>
                <p className="text-xs text-gray-400 mb-4">Select all relevant, this triggers additional specialized registrations below!</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {interestOptions.map((opt) => {
                    const isSelected = selectedInterests.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleInterestChange(opt.value)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'border-pink-500 bg-pink-500/10 text-white shadow-[0_0_10px_rgba(236,72,153,0.1)]'
                            : 'border-white/5 bg-black/20 text-gray-400 hover:text-white hover:border-white/10'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center border text-white ${
                          isSelected ? 'border-pink-400 bg-pink-500' : 'border-gray-600'
                        }`}>
                          {isSelected && <span className="text-[10px] font-bold">✓</span>}
                        </div>
                        <span className="text-xs sm:text-sm font-medium">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conditional 1: Car Showcase Meet spec sheet */}
              {selectedInterests.includes('car_meet') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-6 rounded-2xl bg-[#ec4899]/5 border border-[#ec4899]/20 space-y-6"
                >
                  <div className="flex items-center gap-2 border-b border-pink-500/10 pb-2">
                    <Car className="w-5 h-5 text-pink-500" />
                    <div>
                      <h4 className="text-md font-bold font-display uppercase text-white">Car Community Registration</h4>
                      <p className="text-xs text-pink-400">Lock in details for Botswana’s elite car tuner exhibit zone.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Vehicle Make <span className="text-pink-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        value={carMake}
                        onChange={(e) => setCarMake(e.target.value)}
                        placeholder="e.g. Volkswagen, Toyota, Subaru"
                        className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none text-sm font-light"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Vehicle Model <span className="text-pink-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        value={carModel}
                        onChange={(e) => setCarModel(e.target.value)}
                        placeholder="e.g. Golf VII R, Silvia S15, WRX STI"
                        className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none text-sm font-light"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Year of manufacture <span className="text-pink-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        value={carYear}
                        onChange={(e) => setCarYear(e.target.value)}
                        placeholder="e.g. 2018"
                        className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none text-sm font-light"
                      />
                    </div>

                    {/* Registration/Plate field removed */}

                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Type of Build <span className="text-pink-500">*</span>
                      </label>
                      <select
                        value={carBuild}
                        onChange={(e) => setCarBuild(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none text-sm font-light cursor-pointer"
                      >
                        <option value="Stance">Stance (Low/Airlift/Fitted)</option>
                        <option value="Performance">Performance Tuning & Speed</option>
                        <option value="Drift Spec">Drift & Sideway Kings</option>
                        <option value="OEM+ / Clean">OEM+ / Sleeper</option>
                        <option value="Supercar Luxury">Supercar / High-End Luxury</option>
                        <option value="Sound Match">Car Audio & Soundmatch</option>
                        <option value="Classic Classic">Vintage / Restoration</option>
                      </select>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                          Display Vehicle?
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {['Yes', 'No'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setCarDisplay(opt as 'Yes' | 'No')}
                              className={`py-2 rounded-lg font-mono text-xs uppercase font-bold text-center border transition-all cursor-pointer ${
                                carDisplay === opt
                                  ? 'border-pink-500 bg-pink-500/10 text-pink-400'
                                  : 'border-white/5 bg-black/20 text-gray-400'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex-1">
                        <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                          Enter Competitions?
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {['Yes', 'No'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setCarComp(opt as 'Yes' | 'No')}
                              className={`py-2 rounded-lg font-mono text-xs uppercase font-bold text-center border transition-all cursor-pointer ${
                                carComp === opt
                                  ? 'border-pink-500 bg-pink-500/10 text-pink-400'
                                  : 'border-white/5 bg-black/20 text-gray-400'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Modifications & Build Specs <span className="text-pink-500">*</span>
                      </label>
                      <textarea
                        required
                        value={carMods}
                        onChange={(e) => setCarMods(e.target.value)}
                        placeholder="List performance, aesthetics, audio changes (e.g. Rotiform R18s, Stage 2 remapped ECU, lowered coilovers)"
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none text-sm font-light resize-none"
                      />
                    </div>

                    {/* Premium Drag and Drop Photo Loader */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-2 font-mono">
                        Vehicle Photo (Optional)
                      </label>

                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                          dragging 
                            ? 'border-pink-500 bg-pink-500/10' 
                            : carPhoto 
                            ? 'border-green-500/40 bg-green-500/5' 
                            : 'border-white/10 bg-black/30 hover:border-pink-500/30'
                        }`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          accept="image/*"
                          className="hidden"
                        />

                        {carPhoto ? (
                          <div className="relative flex flex-col items-center justify-center">
                            <img
                              src={carPhoto}
                              alt="Uploaded Build"
                              className="max-h-40 rounded-xl object-contain border border-white/10 mb-2"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex gap-2">
                              <span className="text-xs text-green-400 font-mono flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Ready for upload
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeCarPhoto();
                                }}
                                className="text-xs text-red-400 underline font-mono cursor-pointer hover:text-red-300"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <Upload className="w-8 h-8 text-gray-400 mb-2 animate-pulse" />
                            <p className="text-xs font-semibold text-gray-300 mb-1">
                              Drag and drop your car image, or <span className="text-pink-500 underline">browse</span>
                            </p>
                            <p className="text-[10px] text-gray-500 font-mono">
                              PNG, JPG, WebP (Max 2.5MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Conditional 2: Gaming spec sheet */}
              {selectedInterests.includes('gaming') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 space-y-6"
                >
                  <div className="flex items-center gap-2 border-b border-cyan-500/10 pb-2">
                    <Gamepad2 className="w-5 h-5 text-cyan-500" />
                    <div>
                      <h4 className="text-md font-bold font-display uppercase text-white">Gaming Community Form</h4>
                      <p className="text-xs text-cyan-400 font-mono font-semibold">Ready up for Gaborone’s biggest LAN & Arena showdown.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Preferred Platform <span className="text-pink-500">*</span>
                      </label>
                      <select
                        value={gamingPlatform}
                        onChange={(e) => setGamingPlatform(e.target.value as AttendeeRegistration['gamingDetails']['platform'])}
                        className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:border-cyan-500/60 focus:outline-none text-sm font-light cursor-pointer"
                      >
                        <option value="PC">PC Masters</option>
                        <option value="PlayStation">PlayStation (PS5/PS4)</option>
                        <option value="Xbox">Xbox Series X/S</option>
                        <option value="Nintendo">Nintendo Switch</option>
                        <option value="Mobile">Mobile Esports</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Would you enter Tournaments? <span className="text-pink-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Yes', 'No', 'Maybe'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setGamingTourney(opt as 'Yes' | 'No' | 'Maybe')}
                            className={`py-2 rounded-lg font-mono text-xs uppercase font-bold text-center border transition-all cursor-pointer ${
                              gamingTourney === opt
                                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                                : 'border-white/5 bg-black/20 text-gray-400'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Favorite Game titles <span className="text-pink-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        value={gamingGames}
                        onChange={(e) => setGamingGames(e.target.value)}
                        placeholder="e.g. Call of Duty: Warzone, FIFA 26, Tekken 8, GT7"
                        className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:border-cyan-500/60 focus:outline-none text-sm font-light"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-2 font-mono">
                        Preferred Tournament categories
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {['Fighting Games', 'Racing', 'Battle Royale', 'Sports', 'FPS'].map((opt) => {
                          const isSelected = gamingCats.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleGameCatChange(opt)}
                              className={`py-2 rounded-lg border text-center transition-all cursor-pointer text-xs font-bold font-display ${
                                isSelected
                                  ? 'border-cyan-400 bg-cyan-500/10 text-white'
                                  : 'border-white/5 bg-black/30 text-gray-400 hover:text-white'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Pillar 4: Spending logic */}
              <div>
                <h4 className="text-lg font-bold font-display uppercase text-white flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                  <span className="p-1 rounded bg-purple-500/10 text-purple-400"><CreditCard className="w-4 h-4" /></span> Spend & Ticket Preferences
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                      Expected Event Spend <span className="text-pink-500">*</span>
                    </label>
                    <select
                      value={spend}
                      onChange={(e) => setSpend(e.target.value as AttendeeRegistration['approximateSpend'])}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none text-sm font-light cursor-pointer"
                    >
                      <option className="bg-[#0f0c1e]" value="Under P200">Under P200 (approx. $15 USD / R270 ZAR)</option>
                      <option className="bg-[#0f0c1e]" value="P200–P500">P200–P500 (approx. $15–$37 USD / R270–R670 ZAR)</option>
                      <option className="bg-[#0f0c1e]" value="P500–P1000">P500–P1000 (approx. $37–$75 USD / R670–R1350 ZAR)</option>
                      <option className="bg-[#0f0c1e]" value="Over P1000">Over P1000 (approx. $75+ USD / R1350+ ZAR)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                      Interested In VIP Experiences? <span className="text-pink-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Yes', 'Maybe', 'No'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setVipInterest(opt as AttendeeRegistration['vipInterest'])}
                          className={`py-2.5 rounded-lg font-mono text-xs uppercase font-bold text-center border transition-all cursor-pointer ${
                            vipInterest === opt
                              ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                              : 'border-white/5 bg-black/20 text-gray-400'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                      Interested in PlayFest Merch? <span className="text-pink-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Yes', 'Maybe', 'No'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setMerchInterest(opt as AttendeeRegistration['merchInterest'])}
                          className={`py-2.5 rounded-lg font-mono text-xs uppercase font-bold text-center border transition-all cursor-pointer ${
                            merchInterest === opt
                              ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                              : 'border-white/5 bg-black/20 text-gray-400'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                      Early access tickets when ready? <span className="text-pink-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Yes', 'No'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setEarlyAccess(opt as AttendeeRegistration['earlyTicketAccess'])}
                          className={`py-2.5 rounded-lg font-mono text-xs uppercase font-bold text-center border transition-all cursor-pointer ${
                            earlyAccess === opt
                              ? 'border-pink-500 bg-pink-500/10 text-pink-400'
                              : 'border-white/5 bg-black/20 text-gray-400'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-gray-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-pink-500" /> By registering, you help bring Botswana’s biggest festival to life.
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-10 py-4 w-full sm:w-auto rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white font-display uppercase tracking-widest font-extrabold hover:brightness-110 cursor-pointer text-center relative overflow-hidden transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> REGISTERING...
                    </span>
                  ) : (
                    'SUBMIT RSVP INTEREST'
                  )}
                </button>
              </div>
            </motion.form>
          ) : (
            /* --- BRAND & VENDOR PROPOSALS --- */
            <motion.form
              key="vendor-form"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleVendorSubmit}
              className="space-y-6"
            >
              <div className="border-b border-white/5 pb-4 mb-4">
                <h4 className="text-md font-bold text-white uppercase font-display">Stall & Exhibitor Booking enquiry</h4>
                <p className="text-xs text-gray-400">Put your brand in front of 500+ active car enthusiasts, gamers, and youth demographics.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                    Business Name <span className="text-pink-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={vendorBusiness}
                    onChange={(e) => setVendorBusiness(e.target.value)}
                    placeholder="e.g. Choma Flame & Grills"
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-cyan-500/60 focus:outline-none text-sm font-light"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                    Contact Person Name <span className="text-pink-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={vendorContact}
                    onChange={(e) => setVendorContact(e.target.value)}
                    placeholder="e.g. Thapelo Choma"
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-cyan-500/60 focus:outline-none text-sm font-light"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                    Contact Mobile Number <span className="text-pink-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={vendorDialCode}
                      onChange={(e) => setVendorDialCode(e.target.value)}
                      className="px-3 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-cyan-500/60 focus:outline-none text-xs cursor-pointer max-w-[120px]"
                    >
                      <option value="+267">🇧🇼 +267</option>
                      <option value="+27">🇿🇦 +27</option>
                      <option value="+263">🇿🇼 +263</option>
                      <option value="+264">🇳🇦 +264</option>
                      <option value="+260">🇿🇲 +260</option>
                      <option value="+266">🇱🇸 +266</option>
                      <option value="+268">🇸🇿 +268</option>
                      <option value="+258">🇲🇿 +258</option>
                      <option value="+265">🇲🇼 +265</option>
                      <option value="+244">🇦🇴 +244</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="Other">Other</option>
                    </select>

                    {vendorDialCode === 'Other' && (
                      <input
                        required
                        type="text"
                        value={vendorCustomDialCode}
                        onChange={(e) => setVendorCustomDialCode(e.target.value)}
                        placeholder="+123"
                        className="w-16 px-2 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-cyan-500/60 focus:outline-none text-center font-mono text-xs"
                      />
                    )}

                    <input
                      required
                      type="tel"
                      value={vendorPhone}
                      onChange={(e) => setVendorPhone(e.target.value)}
                      placeholder="e.g. 71 000 000"
                      className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-cyan-500/60 focus:outline-none text-sm font-light"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                    Country of Operation <span className="text-pink-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <select
                      value={vendorCountry}
                      onChange={(e) => setVendorCountry(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-cyan-500/60 focus:outline-none transition-all font-light text-sm cursor-pointer"
                    >
                      <option className="bg-[#0f0c1e]" value="Botswana">Botswana 🇧🇼</option>
                      <option className="bg-[#0f0c1e]" value="South Africa">South Africa 🇿🇦</option>
                      <option className="bg-[#0f0c1e]" value="Zimbabwe">Zimbabwe 🇿🇼</option>
                      <option className="bg-[#0f0c1e]" value="Namibia">Namibia 🇳🇦</option>
                      <option className="bg-[#0f0c1e]" value="Zambia">Zambia 🇿🇲</option>
                      <option className="bg-[#0f0c1e]" value="Lesotho">Lesotho 🇱🇸</option>
                      <option className="bg-[#0f0c1e]" value="Eswatini">Eswatini 🇸🇿</option>
                      <option className="bg-[#0f0c1e]" value="Mozambique">Mozambique 🇲🇿</option>
                      <option className="bg-[#0f0c1e]" value="Angola">Angola 🇦🇴</option>
                      <option className="bg-[#0f0c1e]" value="Malawi">Malawi 🇲🇼</option>
                      <option className="bg-[#0f0c1e]" value="Other">Other / International</option>
                    </select>

                    {vendorCountry === 'Other' && (
                      <input
                        required
                        type="text"
                        value={vendorCustomCountry}
                        onChange={(e) => setVendorCustomCountry(e.target.value)}
                        placeholder="Enter your country name"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-cyan-500/60 focus:outline-none transition-all font-light text-sm"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                    Business Email <span className="text-pink-500">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={vendorEmail}
                    onChange={(e) => setVendorEmail(e.target.value)}
                    placeholder="e.g. thapelo@chomaflame.bw"
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-cyan-500/60 focus:outline-none text-sm font-light"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                    Stall Theme Category <span className="text-pink-500">*</span>
                  </label>
                  <select
                    value={vendorCategory}
                    onChange={(e) => setVendorCategory(e.target.value as VendorApplication['category'])}
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-cyan-500/60 focus:outline-none text-sm font-light cursor-pointer"
                  >
                    <option className="bg-[#0f0c1e]" value="Food & Drinks">Food & Drinks</option>
                    <option className="bg-[#0f0c1e]" value="Gaming Merch / Accessories">Gaming Merch & Equipment</option>
                    <option className="bg-[#0f0c1e]" value="Apparel/Lifestyle">Apparel / Streetwear Fashion</option>
                    <option className="bg-[#0f0c1e]" value="Automotive">Automotive Tuning & Cosmetics</option>
                    <option className="bg-[#0f0c1e]" value="Tech/Exhibition">Tech Hardware / VR display</option>
                    <option className="bg-[#0f0c1e]" value="Art & Crafts">Art & Casual Crafts</option>
                    <option className="bg-[#0f0c1e]" value="Other">Other / Commercial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                    Social Media Handles
                  </label>
                  <input
                    type="text"
                    value={vendorSocials}
                    onChange={(e) => setVendorSocials(e.target.value)}
                    placeholder="e.g. instagram.com/chomagrills"
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-cyan-500/60 focus:outline-none text-sm font-light"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                    Stall Size Required <span className="text-pink-500">*</span>
                  </label>
                  <select
                    value={vendorStallSize}
                    onChange={(e) => setVendorStallSize(e.target.value as VendorApplication['stallSize'])}
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-cyan-500/60 focus:outline-none text-sm font-light cursor-pointer"
                  >
                    <option className="bg-[#0f0c1e]" value="Small (3m x 3m)">Small Gazebo (3m x 3m)</option>
                    <option className="bg-[#0f0c1e]" value="Medium (6m x 3m)">Medium Food/Display Truck (6m x 3m)</option>
                    <option className="bg-[#0f0c1e]" value="Large Custom Space">Large Custom Exhibit Arena Space</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                    Do you need electricity? <span className="text-pink-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Yes', 'No'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setVendorPower(opt as 'Yes' | 'No')}
                        className={`py-2.5 rounded-lg font-mono text-xs uppercase font-bold text-center border transition-all cursor-pointer ${
                          vendorPower === opt
                            ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                            : 'border-white/5 bg-black/20 text-gray-400'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                    Describe your products or services <span className="text-pink-500">*</span>
                  </label>
                  <textarea
                    required
                    value={vendorProducts}
                    onChange={(e) => setVendorProducts(e.target.value)}
                    placeholder="List menu items, apparel lines description, or computing rigs you aim to exhibit."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-cyan-500/60 focus:outline-none text-sm font-light resize-none animate-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                    Additional Requests / Infrastructure needs
                  </label>
                  <textarea
                    value={vendorRequests}
                    onChange={(e) => setVendorRequests(e.target.value)}
                    placeholder="Special electrical phases, backroom washing sinks, low water sources, placement specifications..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-cyan-500/60 focus:outline-none text-sm font-light resize-none"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-gray-400">
                  ⚡ We will evaluate your proposal and reach out via email.
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-10 py-4 w-full sm:w-auto rounded-xl bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 text-white font-display uppercase tracking-widest font-extrabold hover:brightness-110 cursor-pointer transform hover:-translate-y-0.5"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> SENDING ENQUIRY...
                    </span>
                  ) : (
                    'SUBMIT VENDOR PROPOSAL'
                  )}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
