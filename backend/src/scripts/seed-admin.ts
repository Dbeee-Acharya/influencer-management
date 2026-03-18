import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { staff } from "../db/schema.js";
import { hashPassword } from "../routes/staff-auth.js";

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: npx tsx src/scripts/seed-admin.ts <email> <password>");
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
    role: "admin",
  })
  .returning({ id: staff.id, email: staff.email, role: staff.role });

console.log("Admin created:", created);
process.exit(0);
