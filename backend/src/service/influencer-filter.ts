import {
  and,
  or,
  gte,
  lte,
  ilike,
  inArray,
  count,
  asc,
  desc,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "../db/index.js";
import {
  influencers,
  influencerSocials,
  influencerReviews,
} from "../db/schema.js";
import { redis, FILTER_CACHE_TTL, buildFilterCacheKey, getCacheVersion } from "../db/redis.js";

export type RangeFilter = { min?: number; max?: number };

export type InfluencerFilters = {
  // Full-text search across name, bio, description, niches, personality, lifestyle
  search?: string;

  // Enum multi-select (OR within the same filter, AND across filters)
  status?: ("active" | "inactive" | "archived")[];
  tier?: ("nano" | "micro" | "macro" | "mega")[];
  gender?: ("male" | "female" | "non_binary" | "prefer_not_to_say")[];
  contentFrequency?: (
    | "daily"
    | "few_times_week"
    | "weekly"
    | "biweekly"
    | "monthly"
  )[];
  contentQuality?: ("low" | "medium" | "high")[];
  responsiveness?: (
    | "very_responsive"
    | "responsive"
    | "slow"
    | "unresponsive"
  )[];

  // Cost ranges
  brandCost?: RangeFilter;
  netCost?: RangeFilter;
  grossCost?: RangeFilter;

  // Social filters — all applied to the same social account
  // (e.g. TikTok with followers > 100k)
  platform?: ("instagram" | "tiktok" | "facebook" | "youtube")[];
  followers?: RangeFilter;
  avgViews?: RangeFilter;

  // Review rating range (influencer must have at least one review in range)
  rating?: RangeFilter;

  // Location — partial match against primary / secondary / tertiary
  location?: string[];

  // Partial-match multi-value string fields
  primaryNiche?: string[];
  secondaryNiche?: string[];
  mainAgeGroup?: string[];
  videoStyle?: string[];
  familyStatus?: string[];

  // Pagination
  page?: number;
  pageSize?: number;

  // Sorting
  sortBy?: "name" | "brandCost" | "netCost" | "grossCost" | "createdAt" | "followers";
  sortOrder?: "asc" | "desc";
};

export async function filterInfluencers(filters: InfluencerFilters) {
  // Version is null when Redis is unreachable — skip cache entirely
  const version = await getCacheVersion();
  const cacheKey = version ? buildFilterCacheKey(version, filters) : null;
  if (cacheKey) {
    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) return JSON.parse(cached);
  }

  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = Math.min(filters.pageSize ?? 20, 100);
  const conditions: SQL[] = [];

  // ── Full-text search ──────────────────────────────────────────────────────
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(influencers.name, term),
        ilike(influencers.bio, term),
        ilike(influencers.description, term),
        ilike(influencers.primaryNiche, term),
        ilike(influencers.secondaryNiche, term),
        ilike(influencers.personality, term),
        ilike(influencers.lifestyleTraits, term),
        ilike(influencers.availability, term)
      )!
    );
  }

  // ── Enum filters ──────────────────────────────────────────────────────────
  if (filters.status?.length)
    conditions.push(inArray(influencers.status, filters.status));

  if (filters.tier?.length)
    conditions.push(inArray(influencers.tier, filters.tier));

  if (filters.gender?.length)
    conditions.push(inArray(influencers.gender, filters.gender));

  if (filters.contentFrequency?.length)
    conditions.push(
      inArray(influencers.contentFrequency, filters.contentFrequency)
    );

  if (filters.contentQuality?.length)
    conditions.push(inArray(influencers.contentQuality, filters.contentQuality));

  if (filters.responsiveness?.length)
    conditions.push(inArray(influencers.responsiveness, filters.responsiveness));

  // ── Cost ranges (cast to numeric for correct decimal comparison) ──────────
  if (filters.brandCost?.min !== undefined)
    conditions.push(
      sql`${influencers.brandCost}::numeric >= ${filters.brandCost.min}`
    );
  if (filters.brandCost?.max !== undefined)
    conditions.push(
      sql`${influencers.brandCost}::numeric <= ${filters.brandCost.max}`
    );

  if (filters.netCost?.min !== undefined)
    conditions.push(
      sql`${influencers.netCost}::numeric >= ${filters.netCost.min}`
    );
  if (filters.netCost?.max !== undefined)
    conditions.push(
      sql`${influencers.netCost}::numeric <= ${filters.netCost.max}`
    );

  if (filters.grossCost?.min !== undefined)
    conditions.push(
      sql`${influencers.grossCost}::numeric >= ${filters.grossCost.min}`
    );
  if (filters.grossCost?.max !== undefined)
    conditions.push(
      sql`${influencers.grossCost}::numeric <= ${filters.grossCost.max}`
    );

  // ── Location (partial match across all three location fields) ────────────
  if (filters.location?.length) {
    conditions.push(
      or(
        ...filters.location.flatMap((loc) => [
          ilike(influencers.primaryLocation, `%${loc}%`),
          ilike(influencers.secondaryLocation, `%${loc}%`),
          ilike(influencers.tertiaryLocation, `%${loc}%`),
        ])
      )!
    );
  }

  // ── Partial-match string fields (multi-value OR) ──────────────────────────
  if (filters.primaryNiche?.length)
    conditions.push(
      or(...filters.primaryNiche.map((n) => ilike(influencers.primaryNiche, `%${n}%`)))!
    );

  if (filters.secondaryNiche?.length)
    conditions.push(
      or(...filters.secondaryNiche.map((n) => ilike(influencers.secondaryNiche, `%${n}%`)))!
    );

  if (filters.mainAgeGroup?.length)
    conditions.push(
      or(...filters.mainAgeGroup.map((v) => ilike(influencers.mainAgeGroup, `%${v}%`)))!
    );

  if (filters.videoStyle?.length)
    conditions.push(
      or(...filters.videoStyle.map((v) => ilike(influencers.videoStyle, `%${v}%`)))!
    );

  if (filters.familyStatus?.length)
    conditions.push(inArray(influencers.familyStatus, filters.familyStatus));

  // ── Socials filter — all conditions apply to the SAME social account ──────
  const socialConditions: SQL[] = [];

  if (filters.platform?.length)
    socialConditions.push(inArray(influencerSocials.platform, filters.platform));

  if (filters.followers?.min !== undefined)
    socialConditions.push(gte(influencerSocials.followers, filters.followers.min));
  if (filters.followers?.max !== undefined)
    socialConditions.push(lte(influencerSocials.followers, filters.followers.max));

  if (filters.avgViews?.min !== undefined)
    socialConditions.push(gte(influencerSocials.avgViews, filters.avgViews.min));
  if (filters.avgViews?.max !== undefined)
    socialConditions.push(lte(influencerSocials.avgViews, filters.avgViews.max));

  if (socialConditions.length > 0) {
    conditions.push(
      inArray(
        influencers.id,
        db
          .select({ id: influencerSocials.influencerId })
          .from(influencerSocials)
          .where(and(...socialConditions))
      )
    );
  }

  // ── Rating filter — must have at least one review in range ────────────────
  const reviewConditions: SQL[] = [];

  if (filters.rating?.min !== undefined)
    reviewConditions.push(gte(influencerReviews.rating, filters.rating.min));
  if (filters.rating?.max !== undefined)
    reviewConditions.push(lte(influencerReviews.rating, filters.rating.max));

  if (reviewConditions.length > 0) {
    conditions.push(
      inArray(
        influencers.id,
        db
          .select({ id: influencerReviews.influencerId })
          .from(influencerReviews)
          .where(and(...reviewConditions))
      )
    );
  }

  // ── Build final WHERE ───────────────────��─────────────────────────────────
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // ── Sort ──────────────────────────────────────────────────────────────────
  const orderFn = filters.sortOrder === "asc" ? asc : desc;

  const followersSubquery = sql`(
    SELECT MAX(${influencerSocials.followers})
    FROM ${influencerSocials}
    WHERE ${influencerSocials.influencerId} = ${influencers.id}
  )`;

  const sortExpr =
    filters.sortBy === "followers"
      ? orderFn(followersSubquery)
      : orderFn(
          {
            name: influencers.name,
            brandCost: influencers.brandCost,
            netCost: influencers.netCost,
            grossCost: influencers.grossCost,
            createdAt: influencers.createdAt,
          }[filters.sortBy ?? "createdAt"],
        );

  // ── Run count + data in parallel ─────────────────────────────────────────
  const [countResult, data] = await Promise.all([
    db.select({ total: count() }).from(influencers).where(where),
    db.query.influencers.findMany({
      where,
      with: { socials: true, reviews: true },
      limit: pageSize,
      offset: (page - 1) * pageSize,
      orderBy: [sortExpr],
    }),
  ]);

  const total = countResult[0].total;

  const result = {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };

  if (cacheKey) {
    await redis.set(cacheKey, JSON.stringify(result), "EX", FILTER_CACHE_TTL).catch(() => null);
  }

  return result;
}
