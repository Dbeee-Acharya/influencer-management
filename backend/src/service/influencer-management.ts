import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { influencers, influencerSocials, influencerReviews } from "../db/schema.js";

type InfluencerInsert = typeof influencers.$inferInsert;
type SocialInsert = Omit<typeof influencerSocials.$inferInsert, "influencerId">;

export async function listInfluencers() {
  return db.query.influencers.findMany({ with: { socials: true } });
}

export async function getInfluencer(id: string) {
  return db.query.influencers.findFirst({
    where: eq(influencers.id, id),
    with: { socials: true, reviews: true },
  });
}

export async function createInfluencer(
  data: InfluencerInsert,
  socials?: SocialInsert[]
) {
  const [created] = await db.insert(influencers).values(data).returning();

  if (socials?.length) {
    await db
      .insert(influencerSocials)
      .values(socials.map((s) => ({ ...s, influencerId: created.id })));
  }

  return created;
}

export async function updateInfluencer(
  id: string,
  data: Partial<InfluencerInsert>
) {
  const [updated] = await db
    .update(influencers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(influencers.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteInfluencer(id: string) {
  const [deleted] = await db
    .delete(influencers)
    .where(eq(influencers.id, id))
    .returning({ id: influencers.id });

  return deleted ?? null;
}

// --- Socials ---

export async function addSocial(influencerId: string, data: SocialInsert) {
  const [social] = await db
    .insert(influencerSocials)
    .values({ ...data, influencerId })
    .returning();

  return social;
}

export async function updateSocial(
  socialId: number,
  data: Partial<SocialInsert>
) {
  const [updated] = await db
    .update(influencerSocials)
    .set(data)
    .where(eq(influencerSocials.id, socialId))
    .returning();

  return updated ?? null;
}

export async function deleteSocial(socialId: number) {
  const [deleted] = await db
    .delete(influencerSocials)
    .where(eq(influencerSocials.id, socialId))
    .returning({ id: influencerSocials.id });

  return deleted ?? null;
}

// --- Reviews ---

export async function getReviews(influencerId: string) {
  return db.query.influencerReviews.findMany({
    where: eq(influencerReviews.influencerId, influencerId),
    with: { staff: { columns: { id: true, name: true } } },
    orderBy: [desc(influencerReviews.createdAt)],
  });
}

export async function addReview(
  influencerId: string,
  staffId: number,
  rating: number | null,
  review: string | null
) {
  const [created] = await db
    .insert(influencerReviews)
    .values({ influencerId, staffId, rating, review })
    .returning();
  return created;
}
