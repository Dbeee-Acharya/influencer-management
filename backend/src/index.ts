import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { ENV_VARS } from "./const/env.js";

const app = new Hono();

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
  },
);
