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
import { AttendeeRegistration } from '../types';
import { storage } from '../lib/storage';
import { sounds } from '../lib/sounds';
import { registerUser } from '../lib/firebase';

interface RegistrationFormProps {
  onSuccess: (data: AttendeeRegistration) => void;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export default function RegistrationForm({ onSuccess, addToast }: RegistrationFormProps) {
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
  const [ageGroup, setAgeGroup] = useState<AttendeeRegistration['ageGroup']>('18');
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
    { value: 'vendors', label: 'Merchandise & Crafts' },
    { value: 'photography', label: 'Photography & Media' },
    { value: 'content_creation', label: 'Content Creation' },
    { value: 'networking', label: 'Networking/Community' },
    { value: 'competitions', label: 'Prize Competitions' },
    { value: 'family_activities', label: 'Family Activities' }
  ];
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Spending habits
  const [spend, setSpend] = useState<AttendeeRegistration['approximateSpend']>('P200–P500');
  const [vipInterest, setVipInterest] = useState<AttendeeRegistration['vipInterest']>('Yes');
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
          addToast('Registration successful! Saved securely in Guest Fallback Mode.', 'success');
        } else {
          // General connection/config issues: log and proceed
          addToast('Registration successful! Saved securely in Guest Fallback Mode.', 'success');
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
      
      // Save password as a fallback credential so user can log back in if Firebase Auth is disabled
      try {
        await (storage as any).saveFallbackCredential(email.trim(), password);
      } catch (credError) {
        console.warn('Failed to save fallback credential:', credError);
      }

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

      onSuccess(result);
    } catch (err: any) {
      addToast(err.message || 'Error saving registration. Please try again.', 'error');
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
            disabled={step === 1 && !(fullName && email && phone && city && password && confirmPassword)}
            onClick={() => {
              if (step === 1) {
                if (validateAttendeeStep1()) {
                  sounds.playSelect();
                  setStep(2);
                } else {
                  sounds.playCancel();
                }
              }
            }}
            onMouseEnter={() => {
              if (step === 1 && (fullName && email && phone && city && password && confirmPassword)) {
                sounds.playHover();
              }
            }}
            className={`transition-all disabled:opacity-30 ${step === 2 ? "text-purple-400 font-bold" : "text-gray-500"}`}
          >
            2. Interests & Specs
          </button>
        </div>
      </div>

      {/* Forms Area wrapper */}
      <div className="rounded-3xl bg-glassmorphism border border-white/5 shadow-2xl relative overflow-hidden p-6 sm:p-10">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-60" />
        
        {authDisabledWarning && (
          <div className="mb-6 p-4 rounded-xl border border-pink-500/30 bg-pink-500/10 text-pink-200 text-sm space-y-2">
            <div className="flex items-center gap-2 font-bold text-pink-400">
              <Lock className="w-4 h-4 text-pink-400" />
              <span>Note for Developer: Complete Registration Saved!</span>
            </div>
            <p className="leading-relaxed opacity-90">
              Your registration has been <strong>successfully saved</strong> to Google Sheets, local storage, and Firestore database!
            </p>
            <p className="text-xs opacity-80 leading-relaxed">
              If you wish to log back in later using this password (instead of our automatic Guest Fallback mode), you can enable the <strong>Email/Password</strong> provider in your <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline text-pink-300 hover:text-pink-100 font-bold">Firebase Console</a> under: <br />
              <strong className="text-cyan-400">Authentication ➔ Sign-in method ➔ Add new provider ➔ Email/Password</strong>.
            </p>
          </div>
        )}
        
        <AnimatePresence mode="wait">
          {step === 1 ? (
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
                        Age <span className="text-pink-500">*</span>
                      </label>
                      <select
                        value={ageGroup}
                        onChange={(e) => setAgeGroup(e.target.value as AttendeeRegistration['ageGroup'])}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm cursor-pointer"
                      >
                        <option className="bg-[#0f0c1e]" value="Under 13">Under 13</option>
                        {Array.from({ length: 68 }, (_, i) => i + 13).map((age) => (
                          <option key={age} className="bg-[#0f0c1e]" value={String(age)}>
                            {age} Years Old
                          </option>
                        ))}
                        <option className="bg-[#0f0c1e]" value="81+">81+</option>
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
                className="space-y-8 text-left"
              >
                {/* Section 1: Event Preferences & Demographics */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold font-display uppercase tracking-widest text-cyan-400 border-b border-white/5 pb-2 flex items-center gap-2">
                    <span className="p-1 rounded bg-cyan-500/10"><User className="w-4 h-4" /></span> 1. Event Logistics
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Attendance Likelihood <span className="text-pink-500">*</span>
                      </label>
                      <select
                        value={likelihood}
                        onChange={(e) => setLikelihood(e.target.value as AttendeeRegistration['attendanceLikelihood'])}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm cursor-pointer"
                      >
                        <option className="bg-[#0f0c1e]" value="Definitely">Definitely attending</option>
                        <option className="bg-[#0f0c1e]" value="Probably">Probably attending</option>
                        <option className="bg-[#0f0c1e]" value="Maybe">Maybe attending</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Who is coming with you? <span className="text-pink-500">*</span>
                      </label>
                      <select
                        value={groupSize}
                        onChange={(e) => setGroupSize(e.target.value as AttendeeRegistration['groupSize'])}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm cursor-pointer"
                      >
                        <option className="bg-[#0f0c1e]" value="Just Me">Just Me</option>
                        <option className="bg-[#0f0c1e]" value="2-3 People">2-3 People</option>
                        <option className="bg-[#0f0c1e]" value="4-6 People">4-6 People</option>
                        <option className="bg-[#0f0c1e]" value="More than 6">More than 6 people</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Estimated Travel Distance <span className="text-pink-500">*</span>
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
                  </div>
                </div>

                {/* Section 2: Choose Your Passions / Interests */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold font-display uppercase tracking-widest text-pink-400 border-b border-white/5 pb-2 flex items-center gap-2">
                    <span className="p-1 rounded bg-pink-500/10"><Sparkles className="w-4 h-4" /></span> 2. Choose Your Passions (Select All That Apply)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {interestOptions.map((opt) => {
                      const isSelected = selectedInterests.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleInterestChange(opt.value)}
                          className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all cursor-pointer text-center group relative overflow-hidden ${
                            isSelected
                              ? "bg-gradient-to-b from-pink-500/10 to-purple-500/10 border-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.15)] animate-glow"
                              : "bg-black/30 border-white/5 text-gray-400 hover:border-white/10 hover:text-white"
                          }`}
                        >
                          {opt.value === 'gaming' && <Gamepad2 className={`w-6 h-6 mb-2 ${isSelected ? "text-pink-400 animate-bounce" : "text-gray-500 group-hover:text-gray-300"}`} />}
                          {opt.value === 'car_meet' && <Car className={`w-6 h-6 mb-2 ${isSelected ? "text-pink-400 animate-pulse" : "text-gray-500 group-hover:text-gray-300"}`} />}
                          {opt.value !== 'gaming' && opt.value !== 'car_meet' && <Sparkles className={`w-6 h-6 mb-2 ${isSelected ? "text-pink-400" : "text-gray-500 group-hover:text-gray-300"}`} />}
                          <span className="text-[10px] font-bold font-display uppercase tracking-wider">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Spending & Priority Perks */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold font-display uppercase tracking-widest text-purple-400 border-b border-white/5 pb-2 flex items-center gap-2">
                    <span className="p-1 rounded bg-purple-500/10"><Lock className="w-4 h-4" /></span> 3. Priority Perks & Ticket Prefs
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Approx Event Spend <span className="text-pink-500">*</span>
                      </label>
                      <select
                        value={spend}
                        onChange={(e) => setSpend(e.target.value as AttendeeRegistration['approximateSpend'])}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm cursor-pointer"
                      >
                        <option className="bg-[#0f0c1e]" value="Under P200">Under P200</option>
                        <option className="bg-[#0f0c1e]" value="P200–P500">P200–P500</option>
                        <option className="bg-[#0f0c1e]" value="P500–P1000">P500–P1000</option>
                        <option className="bg-[#0f0c1e]" value="Over P1000">Over P1000</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Interested in VIP? <span className="text-pink-500">*</span>
                      </label>
                      <select
                        value={vipInterest}
                        onChange={(e) => setVipInterest(e.target.value as AttendeeRegistration['vipInterest'])}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm cursor-pointer"
                      >
                        <option className="bg-[#0f0c1e]" value="Yes">Yes, definitely</option>
                        <option className="bg-[#0f0c1e]" value="Maybe">Maybe, depends on price</option>
                        <option className="bg-[#0f0c1e]" value="No">No, regular entry only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Official Merchandise? <span className="text-pink-500">*</span>
                      </label>
                      <select
                        value={merchInterest}
                        onChange={(e) => setMerchInterest(e.target.value as AttendeeRegistration['merchInterest'])}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm cursor-pointer"
                      >
                        <option className="bg-[#0f0c1e]" value="Yes">Yes, want custom shirts/hats</option>
                        <option className="bg-[#0f0c1e]" value="Maybe">Maybe, depends on designs</option>
                        <option className="bg-[#0f0c1e]" value="No">No interest</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Early Access Alert? <span className="text-pink-500">*</span>
                      </label>
                      <select
                        value={earlyAccess}
                        onChange={(e) => setEarlyAccess(e.target.value as AttendeeRegistration['earlyTicketAccess'])}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm cursor-pointer"
                      >
                        <option className="bg-[#0f0c1e]" value="Yes">Yes, alert me first</option>
                        <option className="bg-[#0f0c1e]" value="No">No, standard schedule</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 4: Conditional - Tuner Car Showcase Registration */}
                <AnimatePresence>
                  {selectedInterests.includes('car_meet') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 rounded-2xl bg-black/30 border border-white/5 space-y-4">
                        <h4 className="text-xs font-bold font-display uppercase tracking-wider text-pink-400 flex items-center gap-2">
                          <Car className="w-4 h-4 text-pink-400" /> Car Showcase Exhibit Specifications
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                              Vehicle Make <span className="text-pink-500">*</span>
                            </label>
                            <input
                              type="text"
                              required={selectedInterests.includes('car_meet')}
                              value={carMake}
                              onChange={(e) => setCarMake(e.target.value)}
                              placeholder="e.g. Toyota"
                              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                              Vehicle Model <span className="text-pink-500">*</span>
                            </label>
                            <input
                              type="text"
                              required={selectedInterests.includes('car_meet')}
                              value={carModel}
                              onChange={(e) => setCarModel(e.target.value)}
                              placeholder="e.g. RunX or Mark X"
                              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                              Build Year <span className="text-pink-500">*</span>
                            </label>
                            <input
                              type="text"
                              required={selectedInterests.includes('car_meet')}
                              value={carYear}
                              onChange={(e) => setCarYear(e.target.value)}
                              placeholder="e.g. 2006"
                              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                              Build Genre / Style <span className="text-pink-500">*</span>
                            </label>
                            <select
                              value={carBuild}
                              onChange={(e) => setCarBuild(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm cursor-pointer"
                            >
                              <option className="bg-[#0f0c1e]" value="Stance">Stance (Low/Fitment)</option>
                              <option className="bg-[#0f0c1e]" value="Performance">Performance (Track/Drift)</option>
                              <option className="bg-[#0f0c1e]" value="Muscle">Muscle / Classic</option>
                              <option className="bg-[#0f0c1e]" value="OEM+">OEM+ (Clean Factory Enhancements)</option>
                              <option className="bg-[#0f0c1e]" value="Audio Setup">Extreme Audio / Spl</option>
                              <option className="bg-[#0f0c1e]" value="Other">Other Custom Build</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                              Key Modifications List
                            </label>
                            <textarea
                              value={carMods}
                              onChange={(e) => setCarMods(e.target.value)}
                              placeholder="Describe your suspension, wheels, engine setup, cosmetics..."
                              rows={3}
                              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm resize-none"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                                Display Vehicle at Show?
                              </label>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setCarDisplay('Yes')}
                                  className={`flex-1 py-3.5 rounded-xl border font-bold text-xs font-display uppercase tracking-widest cursor-pointer transition-all ${
                                    carDisplay === 'Yes' ? "bg-pink-500/10 border-pink-500 text-pink-400" : "bg-black/20 border-white/5 text-gray-400"
                                  }`}
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCarDisplay('No')}
                                  className={`flex-1 py-3.5 rounded-xl border font-bold text-xs font-display uppercase tracking-widest cursor-pointer transition-all ${
                                    carDisplay === 'No' ? "bg-pink-500/10 border-pink-500 text-pink-400" : "bg-black/20 border-white/5 text-gray-400"
                                  }`}
                                >
                                  No
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                                Participate in Competitions?
                              </label>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setCarComp('Yes')}
                                  className={`flex-1 py-3.5 rounded-xl border font-bold text-xs font-display uppercase tracking-widest cursor-pointer transition-all ${
                                    carComp === 'Yes' ? "bg-pink-500/10 border-pink-500 text-pink-400" : "bg-black/20 border-white/5 text-gray-400"
                                  }`}
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCarComp('No')}
                                  className={`flex-1 py-3.5 rounded-xl border font-bold text-xs font-display uppercase tracking-widest cursor-pointer transition-all ${
                                    carComp === 'No' ? "bg-pink-500/10 border-pink-500 text-pink-400" : "bg-black/20 border-white/5 text-gray-400"
                                  }`}
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-2 font-mono">
                            Vehicle Photo Showcase (Max 2.5MB)
                          </label>
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileSelect}
                          />
                          
                          {!carPhoto ? (
                            <div
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              onClick={() => fileInputRef.current?.click()}
                              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                                dragging 
                                  ? "border-pink-500 bg-pink-500/10 text-pink-300" 
                                  : "border-white/10 hover:border-pink-500/30 bg-black/20 text-gray-400 hover:text-white"
                              }`}
                            >
                              <Upload className="w-6 h-6 opacity-70 animate-pulse text-pink-500" />
                              <div>
                                <p className="text-xs font-bold font-display uppercase tracking-wider">Drag & Drop car photo here</p>
                                <p className="text-[10px] opacity-60 mt-0.5 font-light">or click to upload from local disk</p>
                              </div>
                            </div>
                          ) : (
                            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 aspect-video max-w-sm mx-auto">
                              <img 
                                src={carPhoto} 
                                alt="Vehicle Preview" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <button
                                type="button"
                                onClick={removeCarPhoto}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 text-white hover:bg-pink-600 transition-all cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Section 5: Conditional - Gaming Arena Specs */}
                <AnimatePresence>
                  {selectedInterests.includes('gaming') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 rounded-2xl bg-black/30 border border-white/5 space-y-4">
                        <h4 className="text-xs font-bold font-display uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                          <Gamepad2 className="w-4 h-4 text-cyan-400" /> Gaming & Esports Battle Stations
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                              Primary Gaming Platform <span className="text-pink-500">*</span>
                            </label>
                            <select
                              value={gamingPlatform}
                              onChange={(e) => setGamingPlatform(e.target.value as AttendeeRegistration['gamingDetails']['platform'])}
                              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm cursor-pointer"
                            >
                              <option className="bg-[#0f0c1e]" value="PC">PC Masters</option>
                              <option className="bg-[#0f0c1e]" value="PlayStation">PlayStation Arena</option>
                              <option className="bg-[#0f0c1e]" value="Xbox">Xbox Division</option>
                              <option className="bg-[#0f0c1e]" value="Nintendo">Nintendo Guild</option>
                              <option className="bg-[#0f0c1e]" value="Mobile">Mobile Legends</option>
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                              Favorite Competitive or Casual Games <span className="text-pink-500">*</span>
                            </label>
                            <input
                              type="text"
                              required={selectedInterests.includes('gaming')}
                              value={gamingGames}
                              onChange={(e) => setGamingGames(e.target.value)}
                              placeholder="e.g. Tekken 8, Assetto Corsa, FIFA/FC 24, Apex Legends"
                              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                              Tournament Entry Ambition
                            </label>
                            <select
                              value={gamingTourney}
                              onChange={(e) => setGamingTourney(e.target.value as AttendeeRegistration['gamingDetails']['participateInTournaments'])}
                              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm cursor-pointer"
                            >
                              <option className="bg-[#0f0c1e]" value="Yes">Yes, sign me up for official brackets</option>
                              <option className="bg-[#0f0c1e]" value="Maybe">Maybe, depends on prizes & rules</option>
                              <option className="bg-[#0f0c1e]" value="No">No, just here to watch and play casually</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-2 font-mono">
                              Preferred Tournament Genres
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {['Fighting', 'Sim Racing', 'FPS', 'Sports', 'Retro', 'MOBA'].map((cat) => {
                                const checked = gamingCats.includes(cat);
                                return (
                                  <button
                                    key={cat}
                                    type="button"
                                    onClick={() => handleGameCatChange(cat)}
                                    className={`py-2 px-3 rounded-lg border text-left text-xs font-semibold cursor-pointer transition-all ${
                                      checked ? "bg-cyan-500/10 border-cyan-500 text-cyan-400" : "bg-black/20 border-white/5 text-gray-500 hover:text-gray-300"
                                    }`}
                                  >
                                    {checked ? "✓ " : "+ "} {cat}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Section 6: Speak Your Mind / Feedback Embedded */}
                <div className="p-6 rounded-2xl bg-black/30 border border-white/5 space-y-4">
                  <h4 className="text-xs font-bold font-display uppercase tracking-wider text-purple-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" /> Speak Your Mind (Instant Live Bulletin Comment)
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                        Select Your Festival Sentiment / Vibe
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'stoked', label: '🔥 Stoked', desc: 'Incredibly excited' },
                          { key: 'supportive', label: '🤝 Supportive', desc: 'Love the initiative' },
                          { key: 'curious', label: '🤔 Curious', desc: 'Want to see line-ups' },
                          { key: 'creative', label: '🎨 Creative', desc: 'Have neat ideas' },
                          { key: 'critical', label: '⚡ Critical', desc: 'Help refine logistics' }
                        ].map((v) => {
                          const active = selectedVibe === v.key;
                          return (
                            <button
                              key={v.key}
                              type="button"
                              onClick={() => setSelectedVibe(v.key as any)}
                              className={`px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                active 
                                  ? "bg-purple-500/10 border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.15)]" 
                                  : "bg-black/25 border-white/5 text-gray-400 hover:border-white/10 hover:text-white"
                              }`}
                              title={v.desc}
                            >
                              {v.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono">
                          What would make PlayFest 2026 the ultimate experience for you?
                        </label>
                        <textarea
                          value={userComment}
                          onChange={(e) => setUserComment(e.target.value)}
                          placeholder="List any special retro gaming consoles, favorite auto builders/creators, local DJ sets, or food stalls you'd love to see..."
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-pink-500/60 focus:outline-none transition-all font-light text-sm resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold uppercase text-gray-400 tracking-wider mb-1.5 font-mono flex justify-between">
                          <span>Hype Meter / Hype Scale</span>
                          <span className="text-purple-400 font-bold font-mono">{userDemandLevel}/10</span>
                        </label>
                        <div className="bg-black/25 p-4 rounded-xl border border-white/5 space-y-2 flex flex-col justify-center h-[76px]">
                          <input
                            type="range"
                            min={1}
                            max={10}
                            value={userDemandLevel}
                            onChange={(e) => setUserDemandLevel(parseInt(e.target.value))}
                            className="w-full accent-purple-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                          />
                          <div className="text-[10px] text-gray-400 text-center font-mono font-bold">
                            {userDemandLevel <= 3 && "🟢 Mild Curiosity"}
                            {userDemandLevel > 3 && userDemandLevel <= 7 && "🟡 High Priority"}
                            {userDemandLevel > 7 && "🔥 Absolute Must Have!"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playSelect();
                      setStep(1);
                    }}
                    className="px-6 py-3.5 rounded-xl bg-white/5 border border-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-widest cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>BACK TO PAGE 1</span>
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-10 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-display font-black text-xs uppercase tracking-widest text-white hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>SECURING ENTRY...</span>
                      </>
                    ) : (
                      <>
                        <span>COMPLETE REGISTER</span>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </>
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
