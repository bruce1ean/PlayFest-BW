/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AttendeeRegistration, NewsletterSubscriber } from './types';

const BotswanaCities = [
  'Gaborone',
  'Francistown',
  'Maun',
  'Palapye',
  'Serowe',
  'Lobatse',
  'Selebi-Phikwe',
  'Jwaneng',
  'Mogoditshane',
  'Tlokweng',
  'Kanye',
  'Kasane'
];

const CarModels = [
  { make: 'Volkswagen', model: 'Golf VII R', build: 'Stance / OEM+', mods: 'Air suspension, Rotiform wheels, Stage 2 tune, Carbon front splitter' },
  { make: 'BMW', model: 'M3 (E92)', build: 'Performance / Track', mods: 'Supercharged, KW Clubsport coilovers, Stripped interior, Apex ARC-8 wheels' },
  { make: 'Nissan', model: 'Silvia S15', build: 'Drift Spec', mods: 'SR20DET built, widebody kit, Work Meister wheels, Bride bucket seats' },
  { make: 'Subaru', model: 'WRX STI', build: 'Slammed / Stance', mods: 'Cobb stage 3, airlift performance, custom wide arches, Tomei catback' },
  { make: 'Toyota', model: 'Supra (A90)', build: 'Track Day', mods: 'Pure800 turbo, custom downpipe, BBS LM wheels, lowered on H&R springs' },
  { make: 'Honda', model: 'Civic Type R', build: 'Slammed', mods: 'Mugen body kit, Volk TE37 wheels, custom exhaust, carbon fiber hood' },
  { make: 'Mercedes-Benz', model: 'C63 AMG S', build: 'Performance', mods: 'Downpipes, customized exhaust valves, lowered, Vorsteiner wheels' }
];

const GamerFavorites = [
  'FIFA 26 / EA FC 26',
  'Call of Duty: Warzone',
  'Gran Turismo 7',
  'Assetto Corsa',
  'Tekken 8',
  'Street Fighter 6',
  'Street Racing Syndicate',
  'Need for Speed Unbound',
  'Apex Legends',
  'Valorant',
  'PUBG Mobile',
  'Mobile Legends'
];

// Helper to generate seed registrations
export function generateSeedData(): {
  registrations: AttendeeRegistration[];
  
  subscribers: NewsletterSubscriber[];
} {
  const registrations: AttendeeRegistration[] = [];
  
  // Base Date around 15 days ago to present
  const baseTime = new Date('2026-06-01T08:00:00');
  
  // Generate 168 realistic registrations
  for (let i = 0; i < 168; i++) {
    const regDate = new Date(baseTime.getTime() + i * 2.1 * 60 * 60 * 1000 + Math.random() * 3000000);
    const id = `reg_${Math.random().toString(36).substring(2, 9)}`;
    // Generate specific individual ages (between 16 and 48)
    const randomAge = Math.floor(Math.random() * (48 - 16 + 1)) + 16;
    const ageGroup = String(randomAge);
    
    const likelihoodOptions: AttendeeRegistration['attendanceLikelihood'][] = ['Definitely', 'Definitely', 'Probably', 'Maybe'];
    const attendanceLikelihood = likelihoodOptions[Math.floor(Math.random() * likelihoodOptions.length)];
    
    const sizeOptions: AttendeeRegistration['groupSize'][] = ['Just Me', '2-3 People', '2-3 People', '4-6 People', 'More than 6'];
    const groupSize = sizeOptions[Math.floor(Math.random() * sizeOptions.length)];
    
    // Weighted city selection - Gaborone is highest, then Francistown, etc.
    const cityWeights = [45, 15, 10, 8, 5, 4, 3, 3, 3, 2, 1, 1];
    let city = 'Gaborone';
    const randWeight = Math.random() * 100;
    let runningSum = 0;
    for (let c = 0; c < BotswanaCities.length; c++) {
      runningSum += cityWeights[c];
      if (randWeight <= runningSum) {
        city = BotswanaCities[c];
        break;
      }
    }

    const travelOptions: AttendeeRegistration['travelDistance'][] = 
      city === 'Gaborone' 
        ? ['Within my city', 'Within my city', 'Less than 100 km', 'More than 100 km'] 
        : ['Within my city', 'Less than 100 km', 'More than 100 km', 'From another country'];
    const travelDistance = travelOptions[Math.floor(Math.random() * travelOptions.length)];

    const referralOptions: AttendeeRegistration['referralSource'][] = ['TikTok', 'Instagram', 'Facebook', 'WhatsApp', 'Friend', 'Other'];
    const referralSource = referralOptions[Math.floor(Math.random() * referralOptions.length)];
    
    // Choose list of interests
    const interestPool = ['gaming', 'car_meet', 'live_music', 'food_drinks', 'vendors', 'photography', 'content_creation', 'networking', 'competitions', 'family_activities'];
    const interestCount = 1 + Math.floor(Math.random() * 4); // 1 to 5 interests
    const interestsSet = new Set<string>();
    while (interestsSet.size < interestCount) {
      interestsSet.add(interestPool[Math.floor(Math.random() * interestPool.length)]);
    }
    const interests = Array.from(interestsSet);

    // Make sure some have specific categories set based on random chance also
    if (Math.random() < 0.45 && !interests.includes('gaming')) {
      interests.push('gaming');
    }
    if (Math.random() < 0.40 && !interests.includes('car_meet')) {
      interests.push('car_meet');
    }

    const spends: AttendeeRegistration['approximateSpend'][] = ['Under P200', 'P200–P500', 'P200–P500', 'P500–P1000', 'Over P1000'];
    const approximateSpend = spends[Math.floor(Math.random() * spends.length)];

    const vipInt: AttendeeRegistration['vipInterest'][] = ['Yes', 'Maybe', 'No'];
    const vipInterest = vipInt[Math.floor(Math.random() * vipInt.length)];

    const merchInt: AttendeeRegistration['merchInterest'][] = ['Yes', 'Maybe', 'No'];
    const merchInterest = merchInt[Math.floor(Math.random() * merchInt.length)];

    const earlyAccess: AttendeeRegistration['earlyTicketAccess'][] = ['Yes', 'Yes', 'No'];
    const earlyTicketAccess = earlyAccess[Math.floor(Math.random() * earlyAccess.length)];

    const genderOptions: AttendeeRegistration['gender'][] = ['Male', 'Male', 'Female', 'Female', 'Non-binary', 'Prefer not to say'];
    const gender = genderOptions[Math.floor(Math.random() * genderOptions.length)];

    // Names
    const firstNames = ['Thabo', 'Kago', 'Lesedi', 'Kelebogile', 'Tumelo', 'Onkabetse', 'Laone', 'Tshepo', 'Neo', 'Gofaone', 'Refilwe', 'Katlego', 'Kabelo', 'Botho', 'Amogelang', 'Mpho', 'Tebogo', 'Bakang'];
    const lastNames = ['Molefe', 'Motsamai', 'Letsholo', 'Phiri', 'Segaetsho', 'Tau', 'Mosimanegape', 'Sebabole', 'Mogorosi', 'Modise', 'Kgosi', 'Lekoko', 'Sebego', 'Morapedi', 'Kebalepile'];
    const fullName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    
    const email = `${fullName.toLowerCase().replace(' ', '.')}@example.com`;
    const phoneNumber = `+267 7${Math.floor(Math.random() * 8) + 1}${Math.floor(Math.random() * 900000 + 100000)}`;

    // Gaming Details
    let gamingDetails: AttendeeRegistration['gamingDetails'] | undefined;
    if (interests.includes('gaming')) {
      const platforms: AttendeeRegistration['gamingDetails']['platform'][] = ['PC', 'PlayStation', 'Xbox', 'Mobile', 'Nintendo'];
      const tournamentChoices: AttendeeRegistration['gamingDetails']['participateInTournaments'][] = ['Yes', 'Maybe', 'No'];
      
      const categoryOptions = ['Fighting Games', 'Racing', 'Battle Royale', 'Sports', 'FPS'];
      const categories: string[] = [];
      const catCount = 1 + Math.floor(Math.random() * 3);
      while (categories.length < catCount) {
        const cat = categoryOptions[Math.floor(Math.random() * categoryOptions.length)];
        if (!categories.includes(cat)) categories.push(cat);
      }

      gamingDetails = {
        platform: platforms[Math.floor(Math.random() * platforms.length)],
        favoriteGames: Array.from({ length: 1 + Math.floor(Math.random() * 2) }, () => GamerFavorites[Math.floor(Math.random() * GamerFavorites.length)]).join(', '),
        participateInTournaments: tournamentChoices[Math.floor(Math.random() * tournamentChoices.length)],
        preferredCategories: categories
      };
    }

    // Car Details
    let carDetails: AttendeeRegistration['carDetails'] | undefined;
    if (interests.includes('car_meet')) {
      const carSeed = CarModels[Math.floor(Math.random() * CarModels.length)];
      const displayOpt: AttendeeRegistration['carDetails']['displayVehicle'][] = ['Yes', 'No'];
      const compOpt: AttendeeRegistration['carDetails']['enterCompetitions'][] = ['Yes', 'No'];

      carDetails = {
        vehicleMake: carSeed.make,
        vehicleModel: carSeed.model,
        year: String(1990 + Math.floor(Math.random() * 36)),
        buildType: carSeed.build,
        modifications: carSeed.mods,
        displayVehicle: displayOpt[Math.floor(Math.random() * displayOpt.length)],
        enterCompetitions: compOpt[Math.floor(Math.random() * compOpt.length)],
        photoUrl: ''
      };
    }

    registrations.push({
      id,
      createdAt: regDate.toISOString(),
      fullName,
      email,
      phoneNumber,
      ageGroup,
      gender,
      city,
      attendanceLikelihood,
      groupSize,
      travelDistance,
      referralSource,
      interests,
      approximateSpend,
      vipInterest,
      merchInterest,
      earlyTicketAccess,
      gamingDetails,
      carDetails
    });
  }

  // News subbers
  const subscribers: NewsletterSubscriber[] = Array.from({ length: 42 }, (_, index) => {
    return {
      id: `sub_${index}`,
      email: `subscriber_${index + 1}@playfest2026.bw`,
      createdAt: new Date(baseTime.getTime() + index * 12 * 60 * 60 * 1000).toISOString()
    };
  });

  return { registrations, subscribers };
}
