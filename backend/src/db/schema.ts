import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  decimal,
  integer,
  timestamp,
  smallint,
  index,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

export const statusEnum = pgEnum("status", ["active", "inactive", "archived"]);
export const tierEnum = pgEnum("tier", ["nano", "micro", "macro", "mega"]);
export const genderEnum = pgEnum("gender", [
  "male",
  "female",
  "non_binary",
  "prefer_not_to_say",
]);
export const platformEnum = pgEnum("platform", [
  "instagram",
  "tiktok",
  "facebook",
  "youtube",
]);
export const roleEnum = pgEnum("role", ["admin", "editor", "viewer"]);
export const qualityEnum = pgEnum("content_quality", ["low", "medium", "high"]);
export const responsivenessEnum = pgEnum("responsiveness", [
  "very_responsive",
  "responsive",
  "slow",
  "unresponsive",
]);
export const frequencyEnum = pgEnum("content_frequency", [
  "daily",
  "few_times_week",
  "weekly",
  "biweekly",
  "monthly",
]);

export const influencers = pgTable(
  "influencers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    tier: tierEnum("tier"),
    netCost: decimal("net_cost", { precision: 12, scale: 2 }),
    grossCost: decimal("gross_cost", { precision: 12, scale: 2 }),
    brandCost: decimal("brand_cost", { precision: 12, scale: 2 }),
    description: text("description"),
    contactNo: varchar("contact_no", { length: 50 }),
    status: statusEnum("status").default("active"),
    gender: genderEnum("gender"),
    familyStatus: varchar("family_status", { length: 100 }),
    primaryNiche: varchar("primary_niche", { length: 100 }),
    secondaryNiche: varchar("secondary_niche", { length: 100 }),
    bio: text("bio"),
    mainAgeGroup: varchar("main_age_group", { length: 50 }),
    videoStyle: varchar("video_style", { length: 100 }),
    personality: varchar("personality", { length: 255 }),
    contentFrequency: frequencyEnum("content_frequency"),
    contentQuality: qualityEnum("content_quality"),
    availability: varchar("availability", { length: 255 }),
    responsiveness: responsivenessEnum("responsiveness"),
    lifestyleTraits: text("lifestyle_traits"),
    primaryLocation: varchar("primary_location", { length: 255 }).notNull(),
    secondaryLocation: varchar("secondary_location", { length: 255 }),
    tertiaryLocation: varchar("tertiary_location", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_influencers_status").on(table.status),
    index("idx_influencers_tier").on(table.tier),
    index("idx_influencers_brand_cost").on(table.brandCost),
    index("idx_influencers_primary_niche").on(table.primaryNiche),
    index("idx_influencers_content_frequency").on(table.contentFrequency),
    index("idx_influencers_primary_location").on(table.primaryLocation),
  ],
);

export const influencerSocials = pgTable(
  "influencer_socials",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    influencerId: uuid("influencer_id")
      .references(() => influencers.id, { onDelete: "cascade" })
      .notNull(),
    platform: platformEnum("platform").notNull(),
    profileUrl: varchar("profile_url", { length: 500 }),
    followers: integer("followers"),
    avgViews: integer("avg_views"),
  },
  (table) => [index("idx_socials_influencer_id").on(table.influencerId)],
);

export const staff = pgTable("staff", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: roleEnum("role").default("viewer"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const influencerReviews = pgTable(
  "influencer_reviews",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    influencerId: uuid("influencer_id")
      .references(() => influencers.id, { onDelete: "cascade" })
      .notNull(),
    staffId: integer("staff_id")
      .references(() => staff.id)
      .notNull(),
    rating: smallint("rating"),
    review: text("review"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_reviews_influencer_id").on(table.influencerId),
    index("idx_reviews_staff_id").on(table.staffId),
  ],
);

export const influencerRelations = relations(influencers, ({ many }) => ({
  socials: many(influencerSocials),
  reviews: many(influencerReviews),
}));

export const influencerSocialsRelations = relations(
  influencerSocials,
  ({ one }) => ({
    influencer: one(influencers, {
      fields: [influencerSocials.influencerId],
      references: [influencers.id],
    }),
  }),
);

export const influencerReviewsRelations = relations(
  influencerReviews,
  ({ one }) => ({
    influencer: one(influencers, {
      fields: [influencerReviews.influencerId],
      references: [influencers.id],
    }),
    staff: one(staff, {
      fields: [influencerReviews.staffId],
      references: [staff.id],
    }),
  }),
);

export const staffRelations = relations(staff, ({ many }) => ({
  reviews: many(influencerReviews),
}));
