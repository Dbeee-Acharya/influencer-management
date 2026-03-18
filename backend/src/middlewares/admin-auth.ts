import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import type { Context } from "hono";
import { ENV_VARS } from "../const/env.js";

export type StaffPayload = {
  sub: string;
  email: string;
  name: string;
  role: "admin" | "editor" | "viewer";
  exp: number;
};

export type AuthVariables = {
  staff: StaffPayload;
};

export const adminAuth = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.slice(7);

    try {
      const payload = (await verify(
        token,
        ENV_VARS.auth.jwt_secret,
        "HS256"
      )) as StaffPayload;
      c.set("staff", payload);
      await next();
    } catch {
      return c.json({ error: "Unauthorized" }, 401);
    }
  }
);

export function canView(_c: Context): boolean {
  return true; // all authenticated staff can view
}

export function canEdit(c: Context): boolean {
  const role = (c as Context<{ Variables: AuthVariables }>).get("staff")?.role;
  return role === "admin" || role === "editor";
}

export function canCreate(c: Context): boolean {
  const role = (c as Context<{ Variables: AuthVariables }>).get("staff")?.role;
  return role === "admin";
}
