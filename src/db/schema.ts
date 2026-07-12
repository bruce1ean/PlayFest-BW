import { pgTable, serial, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define the 'users' table.
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'registrations' table.
export const registrations = pgTable('registrations', {
  id: text('id').primaryKey(),
  userId: integer('user_id').references(() => users.id), // Nullable for non-logged in or guest registrations
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  phoneNumber: text('phone_number').notNull(),
  country: text('country'),
  ageGroup: text('age_group').notNull(),
  gender: text('gender'),
  city: text('city').notNull(),
  attendanceLikelihood: text('attendance_likelihood').notNull(),
  groupSize: text('group_size').notNull(),
  travelDistance: text('travel_distance').notNull(),
  referralSource: text('referral_source').notNull(),
  interests: jsonb('interests').notNull(), // string array stored as JSONB
  approximateSpend: text('approximate_spend').notNull(),
  vipInterest: text('vip_interest').notNull(),
  merchInterest: text('merch_interest').notNull(),
  earlyTicketAccess: text('early_ticket_access').notNull(),
  
  // Gaming details (nested in JSON or individual columns; individual columns are more relational)
  gamingPlatform: text('gaming_platform'),
  gamingFavoriteGames: text('gaming_favorite_games'),
  gamingParticipateInTournaments: text('gaming_participate_in_tournaments'),
  gamingPreferredCategories: jsonb('gaming_preferred_categories'), // string array

  // Car details
  carVehicleMake: text('car_vehicle_make'),
  carVehicleModel: text('car_vehicle_model'),
  carYear: text('car_year'),
  carBuildType: text('car_build_type'),
  carModifications: text('car_modifications'),
  carDisplayVehicle: text('car_display_vehicle'),
  carEnterCompetitions: text('car_enter_competitions'),
  carPhotoUrl: text('car_photo_url'),

  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'vendors' table.
export const vendors = pgTable('vendors', {
  id: text('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  businessName: text('business_name').notNull(),
  contactPerson: text('contact_person').notNull(),
  contactNumber: text('contact_number').notNull(),
  email: text('email').notNull(),
  country: text('country'),
  category: text('category').notNull(),
  productsOrServices: text('products_or_services').notNull(),
  socialMediaLinks: text('social_media_links').notNull(),
  stallSize: text('stall_size').notNull(),
  electricityRequired: text('electricity_required').notNull(),
  additionalRequests: text('additional_requests').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'subscribers' table.
export const subscribers = pgTable('subscribers', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'comments' table.
export const comments = pgTable('comments', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  comment: text('comment').notNull(),
  vibe: text('vibe').notNull(),
  demandLevel: integer('demand_level').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations definitions
export const usersRelations = relations(users, ({ many }) => ({
  registrations: many(registrations),
  vendors: many(vendors),
}));

export const registrationsRelations = relations(registrations, ({ one }) => ({
  user: one(users, {
    fields: [registrations.userId],
    references: [users.id],
  }),
}));

export const vendorsRelations = relations(vendors, ({ one }) => ({
  user: one(users, {
    fields: [vendors.userId],
    references: [users.id],
  }),
}));
