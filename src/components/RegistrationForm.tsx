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
  CheckCircle2, 
  Upload, 
  X, 
  Loader2, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Lock
} from 'lucide-react';
import { AttendeeRegistration, VendorApplication } from '../types';
import { storage } from '../lib/storage';
import { sounds } from '../lib/sounds';
import { registerUser } from '../lib/firebase';

interface RegistrationFormProps {
  onSuccess: (data: AttendeeRegistration | VendorApplication, type: 'attendee' | 'vendor') => void;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export default function RegistrationForm({ onSuccess, addToast }: RegistrationFormProps) {
  const [activeTab, setActiveTab] = useState<'attendee' | 'vendor'>('attendee');
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [authDisabledWarning, setAuthDisabledWarning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Attendee Form State ---
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
  
  // Speak Your Mind Fields
  const [selectedVibe, setSelectedVibe] = useState<'stoked' | 'supportive' | 'curious' | 'critical' | 'creative'>('stoked');
  const [userDemandLevel, setUserDemandLevel] = useState<number>(10);
  const [userComment, setUserComment] = useState('');
  
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

  // Tab switch reset
  const handleTabChange = (tab: 'attendee' | 'vendor') => {
    storage.trackClick(`btn-${tab}-tab`);
    sounds.playSelect();
    setActiveTab(tab);
    setStep(1);
  };

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

  // --- Step 1 Navigation Validations ---
  const validateAttendeeStep1 = () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !city.trim() || !password || !confirmPassword) {
      addToast('Please fill out all required personal details and set your account password.', 'error');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      addToast('Please enter a valid email address.', 'error');
      return false;
    }

    if (password.length < 6) {
      addToast('Password must be at least 6 characters long.', 'error');
      return false;
    }

    if (password !== confirmPassword) {
      addToast('Passwords do not match.', 'error');
      return false;
    }

    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    if (cleanPhone.length < 5 || !/^\+?\d+$/.test(cleanPhone)) {
      addToast('Please enter a valid phone number.', 'error');
      return false;
    }

    return true;
  };

  const validateVendorStep1 = () => {
    if (!vendorBusiness.trim() || !vendorContact.trim() || !vendorPhone.trim() || !vendorEmail.trim()) {
      addToast('Please fill out all required business details.', 'error');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(vendorEmail.trim())) {
      addToast('Please enter a valid business email address.', 'error');
      return false;
    }

    const cleanPhone = vendorPhone.replace(/[\s\-()]/g, '');
    if (cleanPhone.length < 5 || !/^\+?\d+$/.test(cleanPhone)) {
      addToast('Please enter a valid business phone number.', 'error');
      return false;
    }

    return true;
  };

  // --- Final Submissions handlers ---
  const handleAttendeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final check for conditional specs
    if (selectedInterests.includes('car_meet')) {
      if (!carMake.trim()) {
        addToast('Please enter your vehicle make (e.g. Toyota, Nissan).', 'error');
        return;
      }
      if (!carModel.trim()) {
        addToast('Please enter your vehicle model (e.g. Supra, Skyline).', 'error');
        return;
      }
      if (!carYear.trim()) {
        addToast('Please enter your vehicle year (e.g. 1998, 2020).', 'error');
        return;
      }
    }

    if (selectedInterests.includes('gaming')) {
      if (!gamingGames.trim()) {
        addToast('Please enter your favorite game(s).', 'error');
        return;
      }
    }

    setSubmitting(true);
    setAuthDisabledWarning(false);
    try {
      // 1. Register the user with Firebase Auth first
      let userCredential = null;
      try {
        userCredential = await registerUser(email.trim(), password);
        console.log('Firebase registration successful:', userCredential.user?.uid);
      } catch (authErr: any) {
        if (authErr.code === 'auth/operation-not-allowed') {
          console.warn('Firebase Email/Password Authentication is not enabled in your Firebase project. Please enable it in the Firebase Console (Authentication > Sign-in method).');
          setAuthDisabledWarning(true);
        } else {
          console.error('Firebase Auth error during registration:', authErr);
        }
        
        // Handle standard user-input validation errors synchronously by blocking
        if (authErr.code === 'auth/email-already-in-use') {
          addToast('This email address is already registered. Please login instead.', 'error');
          setSubmitting(false);
          return;
        } else if (authErr.code === 'auth/invalid-email') {
          addToast('Invalid email address format.', 'error');
          setSubmitting(false);
          return;
        } else if (authErr.code === 'auth/weak-password') {
          addToast('The password is too weak. It must be at least 6 characters.', 'error');
          setSubmitting(false);
          return;
        } else if (authErr.code === 'auth/operation-not-allowed') {
          // If Email/Password provider is disabled, display configuration guide & proceed in fallback mode
          addToast('Firebase Email/Password sign-in is disabled. Registering in fallback mode. Please enable it in your Firebase Console.', 'info');
        } else {
          // General connection/config issues: log and proceed
          addToast(`Firebase Auth unavailable: ${authErr.message || authErr}. Completing registration in fallback mode.`, 'info');
        }
      }

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

      // Save Speak Your Mind Comment if filled
      if (userComment.trim()) {
        try {
          await storage.saveConceptComment({
            name: fullName.trim(),
            email: email.trim(),
            comment: userComment.trim(),
            vibe: selectedVibe,
            demandLevel: userDemandLevel
          });
        } catch (err) {
          console.error('Failed to save Speak Your Mind comment', err);
        }
      }

      onSuccess(result, 'attendee');
    } catch (err: any) {
      addToast(err.message || 'Error saving registration. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorProducts.trim()) {
      addToast('Please describe your exhibition products or services.', 'error');
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
    } catch (err: any) {
      addToast(err.message || 'Error submitting vendor proposal. Please retry.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-16 px-4 relative max-w-4xl mx-auto z-10" id="registration-section">
      {/* Background dynamic blur orbs */}
      <div className="absolute top-1/4 right-10 w-96 h-96 bg-pink-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-10 w-96 h-96 bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400 text-glow-cyan mb-2 font-display">
          Registration Portal
        </h2>
        <h3 className="text-3xl sm:text-5xl font-extrabold font-display uppercase tracking-tight text-white">
          Secure Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 text-glow-pink font-black">Spot</span>
        </h3>
        <p className="text-gray-400 max-w-xl mx-auto mt-3 text-sm font-light">
          Register now to stand a chance to win a free VIP Pass and join future exclusive giveaways (to be announced)! It also locks in your early priority notifications.
        </p>
      </div>

      {/* Dual Tab switches */}
      <div className="flex justify-center p-1.5 rounded-xl bg-glassmorphism max-w-md mx-auto mb-6 border border-white/5 relative">
        <button
          onClick={() => handleTabChange('attendee')}
          className={`flex-1 py-3 text-sm font-display font-bold uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'attendee'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/20'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" /> Enthusiast RSVP
        </button>
        <button
          onClick={() => handleTabChange('vendor')}
          className={`flex-1 py-3 text-sm font-display font-bold uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'vendor'
              ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Brand & Vendor
        </button>
      </div>

      {/* Visual Step Indicator Progress */}
      <div className="max-w-md mx-auto mb-8 bg-black/20 p-3.5 rounded-2xl border border-white/5">
        <div className="flex items-center justify-between text-xs font-semibold font-mono uppercase tracking-wider">
          <button
            onClick={() => { 
              if (step === 2) {
                sounds.playSelect();
                setStep(1); 
              }
            }}
            onMouseEnter={() => {
              if (step === 2) sounds.playHover();
            }}
            className={`transition-all ${step === 1 ? "text-pink-500 font-bold" : "text-gray-400 hover:text-white"}`}
          >
            1. Personal Info
          </button>
          <div className="flex-1 h-[2px] mx-4 bg-white/5 relative rounded-full">
            <motion.div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"
              animate={{ width: step === 2 ? "100%" : "0%" }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <button
            disabled={step === 1 && !(activeTab === 'attendee' ? fullName && email && phone && city && password && confirmPassword : vendorBusiness && vendorContact && vendorPhone && vendorEmail)}
            onClick={() => {
              if (step === 1) {
                if (activeTab === 'attendee' ? validateAttendeeStep1() : validateVendorStep1()) {
                  sounds.playSelect();
                  setStep(2);
                } else {
                  sounds.playCancel();
                }
              }
            }}
            onMouseEnter={() => {
              if (step === 1 && (activeTab === 'attendee' ? fullName && email && phone && city && password && confirmPassword : vendorBusiness && vendorContact && vendorPhone && vendorEmail)) {
                sounds.playHover();
              }
            }}
            className={`transition-all disabled:opacity-30 ${step === 2 ? "text-purple-400 font-bold" : "text-gray-500"}`}
          >
            {activeTab === 'attendee' ? "2. Interests & Specs" : "2. Exhibition Specs"}
          </button>
        </div>
      </div>

      {/* Forms Area wrapper */}
      <div className="rounded-3xl bg-glassmorphism border border-white/5 shadow-2xl relative overflow-hidden p-6 sm:p-10">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-60" />
        
        {authDisabledWarning && (
          <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Firebase Email/Password Provider is Disabled</span>
            </div>
            <p className="leading-relaxed opacity-90">
              The Firebase project owner needs to enable the <strong>Email/Password</strong> sign-in method under the <strong>Sign-in method</strong> tab of the <strong>Authentication</strong> section in the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline text-amber-300 hover:text-amber-100 font-bold">Firebase Console</a>.
            </p>
            <p className="text-xs opacity-80">
              Registration completed successfully in <strong>Guest Fallback mode</strong>, but you will not be able to log back in using this password until Email/Password authentication is enabled in Firebase Console.
            </p>
          </div>
        )}
        
        <AnimatePresence mode="wait">
          {activeTab === 'attendee' ? (
            step === 1 ? (
              <motion.div
                key="attendee-step-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <h4 className="text-lg font-bold font-display uppercase text-white flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                    <span className="p-1 rounded bg-pink-500/10 text-pink-400"><User className="w-4 h-4" /></span> Personal Information (Page 1)
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
                        Password <span className="text-pink-500">*</span>
                      </label>
                      <input
                        required
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none focus:ring-1 focus:ring-pink-500/30 transition-all font-light text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Confirm Password <span className="text-pink-500">*</span>
                      </label>
                      <input
                        required
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
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
                        placeholder="e.g. Gaborone or Francistown"
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
                        <option className="bg-[#0f0c1e]" value="45+">45+</option>
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

                <div className="pt-6 border-t border-white/5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (validateAttendeeStep1()) {
                        setStep(2);
                      }
                    }}
                    className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-display font-bold text-xs uppercase tracking-widest text-white hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>CONTINUE TO INTERESTS</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="attendee-step-2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleAttendeeSubmit}
                className="space-y-8"
              >
                {/* Pillar: Interests Choice checklist */}
                <div>
                  <h4 className="text-lg font-bold font-display uppercase text-white flex items-center gap-2 mb-2 border-b border-white/5 pb-2">
                    <span className="p-1 rounded bg-purple-500/10 text-purple-400"><Gamepad2 className="w-4 h-4" /></span> Interests & Demographics (Page 2)
                  </h4>
                  <p className="text-xs text-gray-400 mb-4 font-light">Select all activities you intend to check out. This unlocks specialized entry sections below!</p>

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

                {/* Conditional: Car Showcase specification details */}
                {selectedInterests.includes('car_meet') && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl bg-[#ec4899]/5 border border-[#ec4899]/20 space-y-6"
                  >
                    <div className="flex items-center gap-2 border-b border-pink-500/10 pb-2">
                      <Car className="w-5 h-5 text-pink-500" />
                      <div>
                        <h4 className="text-md font-bold font-display uppercase text-white">Car Showcase & Meet Registration</h4>
                        <p className="text-xs text-pink-400">Lock in details for Gaborone's elite custom tuner exhibit zone.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                          Vehicle Make <span className="text-pink-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={carMake}
                          onChange={(e) => setCarMake(e.target.value)}
                          placeholder="e.g. Toyota, Nissan, VW"
                          className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none text-sm font-light"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                          Vehicle Model <span className="text-pink-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={carModel}
                          onChange={(e) => setCarModel(e.target.value)}
                          placeholder="e.g. Supra RZ, Skyline GT-R, Golf R"
                          className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none text-sm font-light"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                          Year of manufacture <span className="text-pink-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={carYear}
                          onChange={(e) => setCarYear(e.target.value)}
                          placeholder="e.g. 1999 or 2018"
                          className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none text-sm font-light"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                          Build Type Category
                        </label>
                        <select
                          value={carBuild}
                          onChange={(e) => setCarBuild(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none text-sm font-light cursor-pointer"
                        >
                          <option value="Stance">Low & Stanced / Fitment</option>
                          <option value="Performance">Track/Performance / Drag / Drift</option>
                          <option value="Classic">Classic / Vintage Retro</option>
                          <option value="Supercar">Modern Performance / Supercar</option>
                          <option value="Audio/ICE">Sound & Custom ICE / Audio Build</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                          Key Modifications list
                        </label>
                        <textarea
                          value={carMods}
                          onChange={(e) => setCarMods(e.target.value)}
                          placeholder="Specify custom modifications (e.g. air suspension, turbo kit, widebody, audio, carbon aero...)"
                          rows={2}
                          className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none text-sm font-light resize-none"
                        />
                      </div>

                      {/* Photo drag upload */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                          Upload Vehicle Picture (Optional)
                        </label>
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                            dragging 
                              ? 'border-pink-500 bg-pink-500/10' 
                              : carPhoto 
                                ? 'border-green-500/30 bg-green-500/5' 
                                : 'border-white/10 bg-black/20 hover:border-pink-500/20 hover:bg-black/30'
                          }`}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          {carPhoto ? (
                            <div className="space-y-3">
                              <div className="mx-auto max-w-[200px] h-[120px] rounded-lg overflow-hidden border border-white/10 relative">
                                <img src={carPhoto} alt="Uploaded car" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeCarPhoto();
                                  }}
                                  className="absolute top-1 right-1 p-1 rounded-full bg-black/80 text-white hover:bg-pink-500"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-xs text-green-400 font-medium">✓ Image upload successful. Click to change.</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="w-6 h-6 mx-auto text-gray-500" />
                              <p className="text-xs text-gray-300 font-medium">Drag & Drop or Click to Upload Car Image</p>
                              <p className="text-[10px] text-gray-500">Supports PNG, JPG (Max 2.5MB)</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Conditional: Gaming specs details */}
                {selectedInterests.includes('gaming') && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl bg-[#9333ea]/5 border border-[#9333ea]/20 space-y-6"
                  >
                    <div className="flex items-center gap-2 border-b border-purple-500/10 pb-2">
                      <Gamepad2 className="w-5 h-5 text-purple-400" />
                      <div>
                        <h4 className="text-md font-bold font-display uppercase text-white">Gaming Arena Specifications</h4>
                        <p className="text-xs text-purple-400 font-light">Custom Esports console, PC platform, and tournament enlistments.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                          Primary Gaming Platform <span className="text-pink-500">*</span>
                        </label>
                        <select
                          value={gamingPlatform}
                          onChange={(e) => setGamingPlatform(e.target.value as AttendeeRegistration['gamingDetails']['platform'])}
                          className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:border-purple-500/60 focus:outline-none text-sm font-light cursor-pointer"
                        >
                          <option value="PC">High-End PC Rig</option>
                          <option value="PlayStation">PlayStation (PS5/PS4)</option>
                          <option value="Xbox">Xbox Series X/S / One</option>
                          <option value="Mobile">Mobile Gaming (iOS/Android)</option>
                          <option value="Nintendo">Nintendo Switch</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                          Favorite Games <span className="text-pink-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={gamingGames}
                          onChange={(e) => setGamingGames(e.target.value)}
                          placeholder="e.g. FC 25, Call of Duty, Tekken 8, Apex"
                          className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:border-purple-500/60 focus:outline-none text-sm font-light"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-3 font-mono">
                          Enlist for Tournaments & Duels?
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Yes', 'No', 'Maybe'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setGamingTourney(opt as 'Yes' | 'No' | 'Maybe')}
                              className={`py-2.5 rounded-lg font-mono text-xs uppercase font-bold text-center border transition-all cursor-pointer ${
                                gamingTourney === opt
                                  ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                                  : 'border-white/5 bg-black/20 text-gray-400'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Shared Ticketing & Priorities Block */}
                <div>
                  <h4 className="text-md font-bold font-display uppercase text-white flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                    <CheckCircle2 className="w-4 h-4 text-pink-500" /> Attendance Preferences
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Approximate Event Spend Budget (BWP)
                      </label>
                      <select
                        value={spend}
                        onChange={(e) => setSpend(e.target.value as AttendeeRegistration['approximateSpend'])}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none text-sm font-light cursor-pointer"
                      >
                        <option value="Under P200">Under P200</option>
                        <option value="P200–P500">P200–P500</option>
                        <option value="P500–P1000">P500–P1000</option>
                        <option value="Over P1000">Over P1000</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-0.5 font-mono">
                        Enter VIP Pass Giveaway Draw?
                      </label>
                      <span className="block text-[10px] text-gray-500 mb-1.5 leading-tight font-light">
                        Opt-in to stand a chance to win a free VIP Pass and other upcoming surprise giveaways!
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {['Yes', 'Maybe', 'No'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setVipInterest(opt as AttendeeRegistration['vipInterest'])}
                            className={`py-2.5 rounded-lg text-xs font-medium text-center border transition-all cursor-pointer ${
                              vipInterest === opt
                                ? 'border-pink-500 bg-pink-500/15 text-pink-400 font-semibold'
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
                        Interested in PlayFest Merch & Jerseys?
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {['Yes', 'Maybe', 'No'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setMerchInterest(opt as AttendeeRegistration['merchInterest'])}
                            className={`py-2.5 rounded-lg text-xs font-medium text-center border transition-all cursor-pointer ${
                              merchInterest === opt
                                ? 'border-pink-500 bg-pink-500/15 text-pink-400 font-semibold'
                                : 'border-white/5 bg-black/20 text-gray-400 hover:text-white'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-0.5 font-mono">
                        Sign Up for Early-Bird Notifications?
                      </label>
                      <span className="block text-[10px] text-gray-500 mb-1.5 leading-tight font-light font-mono">
                        Get priority alerts when standard & VIP tickets officially drop!
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {['Yes', 'Maybe', 'No'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setEarlyAccess(opt as AttendeeRegistration['earlyTicketAccess'])}
                            className={`py-2.5 rounded-lg text-xs font-medium text-center border transition-all cursor-pointer ${
                              earlyAccess === opt
                                ? 'border-pink-500 bg-pink-500/15 text-pink-400 font-semibold'
                                : 'border-white/5 bg-black/20 text-gray-400 hover:text-white'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Speak Your Mind - Integrated Registration Section */}
                <div className="p-6 rounded-2xl bg-[#ec4899]/5 border border-[#ec4899]/20 space-y-6">
                  <div className="flex items-center gap-2 border-b border-pink-500/10 pb-2">
                    <Sparkles className="w-5 h-5 text-pink-500" />
                    <div>
                      <h4 className="text-md font-bold font-display uppercase text-white">Speak Your Mind</h4>
                      <p className="text-xs text-pink-400">Help shape PlayFest 2026. Your opinion directly affects Gaborone staging schedules, featured games, and priority categories!</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Define Your Vibe / Opinion Category <span className="text-pink-500">*</span>
                      </label>
                      <select
                        value={selectedVibe}
                        onChange={(e) => setSelectedVibe(e.target.value as any)}
                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none text-sm font-light cursor-pointer"
                      >
                        <option value="stoked" className="bg-[#0f0c1e]">Stoked / Hyped 🏁</option>
                        <option value="supportive" className="bg-[#0f0c1e]">Supportive / Lovin’ It ❤️</option>
                        <option value="curious" className="bg-[#0f0c1e]">Curious / Wondering ❓</option>
                        <option value="creative" className="bg-[#0f0c1e]">Creative / Idea 💡</option>
                        <option value="critical" className="bg-[#0f0c1e]">Constructive Critique 🛠️</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider font-mono">
                          How badly do you want this event to happen? <span className="text-pink-500">*</span>
                        </label>
                        <span className="text-[11px] font-mono font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2 py-0.5 rounded shrink-0">
                          HYPE: {userDemandLevel}/10
                        </span>
                      </div>
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
                          const isSelected = userDemandLevel === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setUserDemandLevel(num)}
                              className={`h-9 rounded-lg font-mono text-xs font-black transition-all border flex items-center justify-center cursor-pointer ${
                                isSelected
                                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.35)]'
                                  : 'bg-black/30 border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                              }`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Your Thought / Suggestion / Review (Optional)
                      </label>
                      <textarea
                        rows={3}
                        maxLength={400}
                        placeholder="Would you attend? What is your favorite attraction? Any specific ideas for gaming, cars, tuning or artists for Gaborone Botswana?"
                        value={userComment}
                        onChange={(e) => setUserComment(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none text-sm font-light resize-none leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit and Back CTAs */}
                <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono font-semibold uppercase tracking-wider text-gray-300 transition-all flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
                  >
                    <ArrowLeft className="w-4 h-4" /> BACK TO PAGE 1
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-10 py-4 w-full sm:w-auto rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 text-white font-display uppercase tracking-widest font-extrabold hover:brightness-110 cursor-pointer transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> REGISTERING...
                      </>
                    ) : (
                      <>
                        <span>CONFIRM & REGISTER RSVP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )
          ) : (
            // --- VENDOR APPLICATION FLOW ---
            step === 1 ? (
              <motion.div
                key="vendor-step-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <h4 className="text-lg font-bold font-display uppercase text-white flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                    <span className="p-1 rounded bg-cyan-500/10 text-cyan-400"><Briefcase className="w-4 h-4" /></span> Business Contact Info (Page 1)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Business / Brand Name <span className="text-pink-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        value={vendorBusiness}
                        onChange={(e) => setVendorBusiness(e.target.value)}
                        placeholder="e.g. Choma Flame Grills"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-cyan-500/60 focus:outline-none transition-all font-light text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Contact Person <span className="text-pink-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        value={vendorContact}
                        onChange={(e) => setVendorContact(e.target.value)}
                        placeholder="e.g. Thapelo Nkosi"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-cyan-500/60 focus:outline-none transition-all font-light text-sm"
                      />
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
                        Contact Number <span className="text-pink-500">*</span>
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
                          placeholder="e.g. 72 345 678"
                          className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-cyan-500/60 focus:outline-none text-sm font-light"
                        />
                      </div>
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
                        Country of Origin <span className="text-pink-500">*</span>
                      </label>
                      <div className="space-y-2">
                        <select
                          value={vendorCountry}
                          onChange={(e) => setVendorCountry(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-cyan-500/60 focus:outline-none text-sm font-light cursor-pointer"
                        >
                          <option className="bg-[#0f0c1e]" value="Botswana">Botswana 🇧🇼</option>
                          <option className="bg-[#0f0c1e]" value="South Africa">South Africa 🇿🇦</option>
                          <option className="bg-[#0f0c1e]" value="Zimbabwe">Zimbabwe 🇿🇼</option>
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
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (validateVendorStep1()) {
                        setStep(2);
                      }
                    }}
                    className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 font-display font-bold text-xs uppercase tracking-widest text-white hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>CONTINUE TO BOOTH SPECS</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="vendor-step-2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleVendorSubmit}
                className="space-y-6"
              >
                <div>
                  <h4 className="text-lg font-bold font-display uppercase text-white flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                    <span className="p-1 rounded bg-cyan-500/10 text-cyan-400"><Briefcase className="w-4 h-4" /></span> Exhibition Booth Details (Page 2)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Stall Size Required <span className="text-pink-500">*</span>
                      </label>
                      <select
                        value={vendorStallSize}
                        onChange={(e) => setVendorStallSize(e.target.value as VendorApplication['stallSize'])}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-cyan-500/60 focus:outline-none text-sm font-light cursor-pointer"
                      >
                        <option value="Small (3m x 3m)">Small Gazebo (3m x 3m)</option>
                        <option value="Medium (6m x 3m)">Medium Food/Display Truck (6m x 3m)</option>
                        <option value="Large Custom Space">Large Custom Exhibit Arena Space</option>
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

                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Social Media Handles
                      </label>
                      <input
                        type="text"
                        value={vendorSocials}
                        onChange={(e) => setVendorSocials(e.target.value)}
                        placeholder="e.g. instagram.com/brandname"
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-cyan-500/60 focus:outline-none text-sm font-light"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Describe your products or services <span className="text-pink-500">*</span>
                      </label>
                      <textarea
                        value={vendorProducts}
                        onChange={(e) => setVendorProducts(e.target.value)}
                        placeholder="List menu items, apparel description, or equipment you aim to sell/exhibit."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-cyan-500/60 focus:outline-none text-sm font-light resize-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Additional Requests / Infrastructure needs
                      </label>
                      <textarea
                        value={vendorRequests}
                        onChange={(e) => setVendorRequests(e.target.value)}
                        placeholder="Special electrical phases, backroom washing sinks, placement specifications..."
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-cyan-500/60 focus:outline-none text-sm font-light resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit and Back CTAs */}
                <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono font-semibold uppercase tracking-wider text-gray-300 transition-all flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
                  >
                    <ArrowLeft className="w-4 h-4" /> BACK TO PAGE 1
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-10 py-4 w-full sm:w-auto rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-cyan-500 text-white font-display uppercase tracking-widest font-extrabold hover:brightness-110 cursor-pointer transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> SUBMITTING...
                      </>
                    ) : (
                      <>
                        <span>SUBMIT PROPOSAL</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
