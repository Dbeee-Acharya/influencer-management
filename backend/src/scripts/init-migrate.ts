/**
 * init-migrate.ts — Parse influencer_data.csv and insert into DB via Drizzle.
 *
 * Usage:
 *   npx tsx src/scripts/init-migrate.ts
 *
 * Expects influencer_data.csv in the project root.
 * Skips seeding if the influencers table already has rows.
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";
import { count } from "drizzle-orm";
import { db } from "../db/index.js";
import { influencers, influencerSocials } from "../db/schema.js";

// ── CSV Parsing ──────────────────────────────────────────────────────────────

// Resolve relative to this file (src/scripts/) → backend root (../../)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.resolve(__dirname, "../../influencer_data.csv");
const raw = fs.readFileSync(csvPath, "utf-8");
const rows: string[][] = parse(raw, {
  skip_empty_lines: false,
  relax_column_count: true,
});

// Row 0 is blank, Row 1 is the header, data starts at Row 2
const dataRows = rows.slice(2);

// ── Normalizers ──────────────────────────────────────────────────────────────

function clean(val: string | undefined): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (
    trimmed === "" ||
    trimmed === "-" ||
    trimmed === "NA" ||
    trimmed === "N/A"
  )
    return null;
  return trimmed;
}

function cleanNumber(val: string | undefined): number | null {
  const c = clean(val);
  if (!c) return null;
  const num = Number(c.replace(/,/g, ""));
  return isNaN(num) ? null : num;
}

type Tier = "nano" | "micro" | "macro" | "mega";
function normalizeTier(val: string | undefined): Tier | null {
  const c = clean(val)?.toLowerCase();
  if (!c) return null;
  if (c.includes("mega")) return "mega";
  if (c.includes("macro")) return "macro";
  if (c.includes("micro")) return "micro";
  if (c.includes("nano")) return "nano";
  return null;
}

type Status = "active" | "inactive" | "archived";
function normalizeStatus(val: string | undefined): Status {
  const c = clean(val)?.toLowerCase();
  if (c?.includes("inactive")) return "inactive";
  if (c?.includes("archived")) return "archived";
  return "active";
}

type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";
function normalizeGender(val: string | undefined): Gender | null {
  const c = clean(val)?.toLowerCase();
  if (!c) return null;
  if (c.includes("female")) return "female";
  if (c.includes("male")) return "male";
  if (c.includes("non")) return "non_binary";
  return "prefer_not_to_say";
}

type Frequency =
  | "daily"
  | "few_times_week"
  | "weekly"
  | "biweekly"
  | "monthly";
function normalizeFrequency(val: string | undefined): Frequency | null {
  const c = clean(val)?.toLowerCase();
  if (!c) return null;
  if (c.includes("daily") || c.includes("everyday")) return "daily";
  if (c.includes("month")) return "monthly";
  if (c.includes("biweek") || c.includes("bi-week")) return "biweekly";
  if (c.includes("week")) {
    const numMatch = c.match(/(\d+)/);
    if (numMatch && parseInt(numMatch[1]) >= 2) return "few_times_week";
    return "weekly";
  }
  return null;
}

type Quality = "low" | "medium" | "high";
function normalizeQuality(val: string | undefined): Quality | null {
  const c = clean(val)?.toLowerCase();
  if (!c) return null;
  if (
    c.includes("hd") ||
    c.includes("high") ||
    c.includes("cinematic") ||
    c.includes("aesthetic") ||
    c.includes("professional")
  )
    return "high";
  if (c.includes("medium") || c.includes("decent") || c.includes("average"))
    return "medium";
  if (c.includes("low") || c.includes("poor")) return "low";
  return "medium";
}

type Responsiveness =
  | "very_responsive"
  | "responsive"
  | "slow"
  | "unresponsive";
function normalizeResponsiveness(
  val: string | undefined
): Responsiveness | null {
  const c = clean(val)?.toLowerCase();
  if (!c) return null;
  if (c.includes("very") || c.includes("fast") || c.includes("quick"))
    return "very_responsive";
  if (
    c.includes("responsive") ||
    c.includes("medium") ||
    c.includes("moderate")
  )
    return "responsive";
  if (c.includes("slow")) return "slow";
  if (
    c.includes("unresponsive") ||
    c.includes("none") ||
    c.includes("no response")
  )
    return "unresponsive";
  return null;
}

type Platform = "instagram" | "tiktok" | "facebook" | "youtube";

// ── Transform Rows ───────────────────────────────────────────────────────────

interface InfluencerInsert {
  name: string;
  tier: Tier | null;
  netCost: string | null;
  grossCost: string | null;
  brandCost: string | null;
  description: string | null;
  contactNo: string | null;
  status: Status;
  gender: Gender | null;
  familyStatus: string | null;
  primaryNiche: string | null;
  secondaryNiche: string | null;
  bio: string | null;
  mainAgeGroup: string | null;
  videoStyle: string | null;
  personality: string | null;
  contentFrequency: Frequency | null;
  contentQuality: Quality | null;
  availability: string | null;
  responsiveness: Responsiveness | null;
  lifestyleTraits: string | null;
  primaryLocation: string;
  secondaryLocation: string | null;
  tertiaryLocation: string | null;
}

interface SocialInsert {
  platform: Platform;
  profileUrl: string | null;
  followers: number | null;
  avgViews: number | null;
}

interface ParsedRow {
  influencer: InfluencerInsert;
  socials: SocialInsert[];
}

const parsed: ParsedRow[] = [];

for (const row of dataRows) {
  const name = clean(row[1]);
  if (!name) continue;

  const primaryLocation = clean(row[14]) || "Unknown";

  const influencer: InfluencerInsert = {
    name,
    tier: normalizeTier(row[2]),
    netCost: cleanNumber(row[3])?.toString() ?? null,
    grossCost: cleanNumber(row[4])?.toString() ?? null,
    brandCost: cleanNumber(row[5])?.toString() ?? null,
    description: clean(row[6]),
    contactNo: clean(row[7]),
    status: normalizeStatus(row[8]),
    gender: normalizeGender(row[9]),
    familyStatus: clean(row[10]),
    primaryNiche: clean(row[11]),
    secondaryNiche: clean(row[12]),
    bio: clean(row[13]),
    primaryLocation,
    secondaryLocation: clean(row[15]),
    tertiaryLocation: clean(row[16]),
    mainAgeGroup: clean(row[17]),
    videoStyle: clean(row[18]),
    personality: clean(row[19]),
    contentFrequency: normalizeFrequency(row[20]),
    contentQuality: normalizeQuality(row[21]),
    availability: clean(row[22]),
    responsiveness: normalizeResponsiveness(row[23]),
    lifestyleTraits: clean(row[24]),
  };

  const socials: SocialInsert[] = [];

  // Instagram: columns 25 (url), 26 (followers)
  const igUrl = clean(row[25]);
  const igFollowers = cleanNumber(row[26]);
  if (igUrl || igFollowers) {
    socials.push({ platform: "instagram", profileUrl: igUrl, followers: igFollowers, avgViews: null });
  }

  // TikTok: columns 27 (url), 28 (followers)
  const ttUrl = clean(row[27]);
  const ttFollowers = cleanNumber(row[28]);
  if (ttUrl || ttFollowers) {
    socials.push({ platform: "tiktok", profileUrl: ttUrl, followers: ttFollowers, avgViews: null });
  }

  // Facebook: columns 29 (url), 30 (followers), 31 (avg views)
  const fbUrl = clean(row[29]);
  const fbFollowers = cleanNumber(row[30]);
  const fbAvgViews = cleanNumber(row[31]);
  if (fbUrl || fbFollowers) {
    socials.push({ platform: "facebook", profileUrl: fbUrl, followers: fbFollowers, avgViews: fbAvgViews });
  }

  // YouTube: columns 32 (url), 33 (subscribers), 34 (avg views)
  const ytUrl = clean(row[32]);
  const ytSubs = cleanNumber(row[33]);
  const ytViews = cleanNumber(row[34]);
  if (ytUrl || ytSubs) {
    socials.push({ platform: "youtube", profileUrl: ytUrl, followers: ytSubs, avgViews: ytViews });
  }

  parsed.push({ influencer, socials });
}

console.log(`Parsed ${parsed.length} influencers from CSV.`);

// ── Insert into DB ───────────────────────────────────────────────────────────

const BATCH_SIZE = 50;

async function seed() {
  // Guard: skip if table already has data
  const [{ total }] = await db.select({ total: count() }).from(influencers);
  if (total > 0) {
    console.log(`Influencers table already has ${total} rows — skipping seed.`);
    process.exit(0);
  }

  let inserted = 0;

  for (let i = 0; i < parsed.length; i += BATCH_SIZE) {
    const batch = parsed.slice(i, i + BATCH_SIZE);

    // Insert influencers and get back their generated UUIDs
    const insertedInfluencers = await db
      .insert(influencers)
      .values(batch.map((r) => r.influencer))
      .returning({ id: influencers.id });

    // Collect socials for this batch, mapped to the correct influencer UUID
    const socialsToInsert = insertedInfluencers.flatMap(({ id }, idx) =>
      batch[idx].socials.map((s) => ({ ...s, influencerId: id }))
    );

    if (socialsToInsert.length > 0) {
      await db.insert(influencerSocials).values(socialsToInsert);
    }

    inserted += batch.length;
    console.log(`  Inserted ${inserted} / ${parsed.length}...`);
  }

  console.log(`\nSeeding complete — ${inserted} influencers inserted.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
