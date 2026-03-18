import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { staff } from "../db/schema.js";
import { hashPassword } from "../routes/staff-auth.js";

const role = process.argv[2] as "editor" | "viewer";
const email = process.argv[3];
const password = process.argv[4];

if (!["editor", "viewer"].includes(role) || !email || !password) {
  console.error("Usage: npx tsx src/scripts/seed-staff.ts <editor|viewer> <email> <password>");
  process.exit(1);
}

const [existing] = await db
  .select({ id: staff.id })
  .from(staff)
  .where(eq(staff.email, email))
  .limit(1);

if (existing) {
  console.error(`Staff with email "${email}" already exists.`);
  process.exit(1);
}

const [created] = await db
  .insert(staff)
  .values({
    email,
    name: email.split("@")[0],
    passwordHash: hashPassword(password),
    role,
  })
  .returning({ id: staff.id, email: staff.email, role: staff.role });

console.log(`${role.charAt(0).toUpperCase() + role.slice(1)} created:`, created);
process.exit(0);
