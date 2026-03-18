import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { ENV_VARS } from "./const/env.js";
import { adminAuth } from "./middlewares/admin-auth.js";
import type { AuthVariables } from "./middlewares/admin-auth.js";
import { staffAuth } from "./routes/staff-auth.js";
import { staffManagement } from "./routes/staff-management.js";
import { influencerManagement } from "./routes/influencer-management.js";
import { influencerFilter } from "./routes/influencer-filter.js";

const app = new Hono<{ Variables: AuthVariables }>();

app.use(
  "*",
  cors({
    origin: ENV_VARS.server.frontend_origins,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Public routes
app.route("/auth", staffAuth);

// Protect every other route
app.use("*", async (c, next) => {
  if (c.req.path.startsWith("/auth")) return next();
  return adminAuth(c, next);
});

app.get("/", (c) => c.text("Online!"));

app.route("/staff", staffManagement);
app.route("/influencers", influencerFilter);
app.route("/influencers", influencerManagement);

serve(
  {
    fetch: app.fetch,
    port: ENV_VARS.server.port,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
