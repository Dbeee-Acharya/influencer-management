import { Hono } from "hono";
import { sign } from "hono/jwt";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { staff } from "../db/schema.js";
import { ENV_VARS } from "../const/env.js";

const staffAuth = new Hono();

staffAuth.post("/login", async (c) => {
  const body = await c.req.json<{ email: string; password: string }>();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ error: "Email and password are required" }, 400);
  }

  const [user] = await db
    .select()
    .from(staff)
    .where(eq(staff.email, email))
    .limit(1);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const token = await sign(
    {
      sub: String(user.id),
      email: user.email,
      name: user.name,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    },
    ENV_VARS.auth.jwt_secret,
    "HS256"
  );

  return c.json({ token });
});

// Exported for use when creating staff members
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(derived), Buffer.from(hash));
}

export { staffAuth };
