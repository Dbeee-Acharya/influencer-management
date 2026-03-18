import { Hono } from "hono";
import type { AuthVariables } from "../middlewares/admin-auth.js";
import { filterInfluencers, type InfluencerFilters } from "../service/influencer-filter.js";

const influencerFilter = new Hono<{ Variables: AuthVariables }>();

/**
 * POST /influencers/filter
 *
 * All fields are optional — omit any you don't need.
 *
 * {
 *   search?: string                   // searches name, bio, description, niches, personality, lifestyle
 *   status?: string[]                 // "active" | "inactive" | "archived"
 *   tier?: string[]                   // "nano" | "micro" | "macro" | "mega"
 *   gender?: string[]
 *   contentFrequency?: string[]       // "daily" | "few_times_week" | "weekly" | "biweekly" | "monthly"
 *   contentQuality?: string[]         // "low" | "medium" | "high"
 *   responsiveness?: string[]         // "very_responsive" | "responsive" | "slow" | "unresponsive"
 *   platform?: string[]               // "instagram" | "tiktok" | "facebook" | "youtube"
 *   brandCost?: { min?: number, max?: number }
 *   netCost?: { min?: number, max?: number }
 *   grossCost?: { min?: number, max?: number }
 *   followers?: { min?: number, max?: number }   // must be on same account as platform filter
 *   avgViews?: { min?: number, max?: number }
 *   rating?: { min?: number, max?: number }      // review rating 1-5
 *   location?: string[]                          // partial match on primary/secondary/tertiary
 *   primaryNiche?: string[]                      // partial match, OR across values
 *   secondaryNiche?: string[]
 *   mainAgeGroup?: string[]
 *   videoStyle?: string[]
 *   familyStatus?: string[]
 *   page?: number                     // default 1
 *   pageSize?: number                 // default 20, max 100
 *   sortBy?: "name"|"brandCost"|"netCost"|"grossCost"|"createdAt"  // default "createdAt"
 *   sortOrder?: "asc" | "desc"        // default "desc"
 * }
 */
influencerFilter.post("/filter", async (c) => {
  const body = await c.req.json<InfluencerFilters>().catch(() => ({}));
  const result = await filterInfluencers(body as InfluencerFilters);
  return c.json(result);
});

export { influencerFilter };
