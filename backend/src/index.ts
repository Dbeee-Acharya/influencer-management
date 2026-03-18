import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { ENV_VARS } from "./const/env.js";
import { adminAuth } from "./middlewares/admin-auth.js";
import { staffAuth } from "./routes/staff-auth.js";

const app = new Hono();

// Public routes
app.route("/auth", staffAuth);

// Protect every other route
app.use("*", async (c, next) => {
  if (c.req.path.startsWith("/auth")) return next();
  return adminAuth(c, next);
});

app.get("/", (c) => {
  return c.text("Online!");
});

serve(
  {
    fetch: app.fetch,
    port: ENV_VARS.server.port,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
