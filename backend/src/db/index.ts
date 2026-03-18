import { drizzle } from "drizzle-orm/node-postgres";
import { ENV_VARS } from "../const/env.js";
import * as schema from "./schema.js";

export const db = drizzle(ENV_VARS.database.database_url, { schema });
