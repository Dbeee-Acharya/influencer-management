import { drizzle } from "drizzle-orm/node-postgres";
import { ENV_VARS } from "../const/env.js";

export const db = drizzle(ENV_VARS.database.database_url);
