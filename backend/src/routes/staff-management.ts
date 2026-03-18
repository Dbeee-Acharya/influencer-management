import { Hono } from "hono";
import type { AuthVariables } from "../middlewares/admin-auth.js";
import { canCreate } from "../middlewares/admin-auth.js";
import { listStaff, updateStaff, deleteStaff } from "../service/staff-management.js";

const staffManagement = new Hono<{ Variables: AuthVariables }>();

// All staff management endpoints are admin-only
staffManagement.use("*", async (c, next) => {
  if (!canCreate(c)) return c.json({ error: "Forbidden" }, 403);
  return next();
});

staffManagement.get("/", async (c) => {
  const members = await listStaff();
  return c.json(members);
});

staffManagement.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

  const body = await c.req.json<{
    name?: string;
    email?: string;
    role?: "admin" | "editor" | "viewer";
    password?: string;
  }>();

  const updated = await updateStaff(id, body);
  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json(updated);
});

staffManagement.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

  const me = c.get("staff");
  if (String(id) === me.sub) {
    return c.json({ error: "Cannot delete your own account" }, 400);
  }

  const deleted = await deleteStaff(id);
  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true });
});

export { staffManagement };
