import { Hono } from "hono";
import { adminAuth, canEdit } from "../middlewares/admin-auth.js";
import type { AuthVariables } from "../middlewares/admin-auth.js";
import * as svc from "../service/influencer-management.js";
import { influencers, influencerSocials } from "../db/schema.js";

const influencerManagement = new Hono<{ Variables: AuthVariables }>();

// Protect all routes
influencerManagement.use("*", adminAuth);

// --- Influencers ---

influencerManagement.get("/", async (c) => {
  return c.json(await svc.listInfluencers());
});

influencerManagement.get("/:id", async (c) => {
  const result = await svc.getInfluencer(c.req.param("id"));
  if (!result) return c.json({ error: "Not found" }, 404);
  return c.json(result);
});

influencerManagement.post("/", async (c) => {
  if (!canEdit(c)) return c.json({ error: "Forbidden" }, 403);

  const body = await c.req.json<{
    name: string;
    primaryLocation: string;
    socials?: Array<Omit<typeof influencerSocials.$inferInsert, "influencerId">>;
    [key: string]: unknown;
  }>();

  const { socials, ...influencerData } = body;

  if (!influencerData.name || !influencerData.primaryLocation) {
    return c.json({ error: "name and primaryLocation are required" }, 400);
  }

  const created = await svc.createInfluencer(
    influencerData as typeof influencers.$inferInsert,
    socials
  );

  return c.json(created, 201);
});

influencerManagement.patch("/:id", async (c) => {
  if (!canEdit(c)) return c.json({ error: "Forbidden" }, 403);

  const updated = await svc.updateInfluencer(
    c.req.param("id"),
    await c.req.json()
  );

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

influencerManagement.delete("/:id", async (c) => {
  if (!canEdit(c)) return c.json({ error: "Forbidden" }, 403);

  const deleted = await svc.deleteInfluencer(c.req.param("id"));
  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true });
});

// --- Socials ---

influencerManagement.post("/:id/socials", async (c) => {
  if (!canEdit(c)) return c.json({ error: "Forbidden" }, 403);

  const social = await svc.addSocial(c.req.param("id"), await c.req.json());
  return c.json(social, 201);
});

influencerManagement.patch("/:id/socials/:socialId", async (c) => {
  if (!canEdit(c)) return c.json({ error: "Forbidden" }, 403);

  const updated = await svc.updateSocial(
    Number(c.req.param("socialId")),
    await c.req.json()
  );

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

influencerManagement.delete("/:id/socials/:socialId", async (c) => {
  if (!canEdit(c)) return c.json({ error: "Forbidden" }, 403);

  const deleted = await svc.deleteSocial(Number(c.req.param("socialId")));
  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true });
});

export { influencerManagement };
