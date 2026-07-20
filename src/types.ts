/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AttendeeRegistration {
  id: string;
  createdAt: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  country?: string;
  ageGroup: string;
  gender?: 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say';
  city: string;
  attendanceLikelihood: 'Definitely' | 'Probably' | 'Maybe';
  groupSize: 'Just Me' | '2-3 People' | '4-6 People' | 'More than 6';
  travelDistance: 'Within my city' | 'Less than 100 km' | 'More than 100 km' | 'From another country';
  referralSource: 'TikTok' | 'Instagram' | 'Facebook' | 'WhatsApp' | 'Friend' | 'Other';
  interests: string[]; // ['gaming', 'car_meet', 'live_music', etc.]
  approximateSpend: 'Under P200' | 'P200–P500' | 'P500–P1000' | 'Over P1000';
  vipInterest: 'Yes' | 'Maybe' | 'No';
  merchInterest: 'Yes' | 'Maybe' | 'No';
  earlyTicketAccess: 'Yes' | 'No';
  
  // Conditionally added if "gaming" selected
  gamingDetails?: {
    platform: 'PC' | 'PlayStation' | 'Xbox' | 'Nintendo' | 'Mobile';
    favoriteGames: string;
    participateInTournaments: 'Yes' | 'No' | 'Maybe';
    preferredCategories: string[]; // ['fighting', 'racing', etc.]
  };

  // Conditionally added if "car_meet" selected
  carDetails?: {
    vehicleMake: string;
    vehicleModel: string;
    year: string;
    buildType: string; // e.g. Stance, Performance, Muscle, Classic, OEM+
    modifications: string;
    displayVehicle: 'Yes' | 'No';
    enterCompetitions: 'Yes' | 'No';
    photoUrl?: string; // Base64 or uploaded URL
  };
}


export interface NewsletterSubscriber {
  id: string;
  email: string;
  createdAt: string;
}

export interface AppAnalytics {
  visitors: number;
  clicks: { [buttonId: string]: number };
  deviceTypes: { mobile: number; desktop: number; tablet: number };
  trafficSources: { [source: string]: number };
}

export interface ConceptComment {
  id: string;
  name: string;
  email: string;
  comment: string;
  vibe: 'stoked' | 'supportive' | 'curious' | 'critical' | 'creative';
  demandLevel: number; // Scale of 1 to 10
  createdAt: string;
}
