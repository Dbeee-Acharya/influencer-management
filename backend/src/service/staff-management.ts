import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { staff } from "../db/schema.js";
import { hashPassword } from "../routes/staff-auth.js";

const safeColumns = {
  id: staff.id,
  name: staff.name,
  email: staff.email,
  role: staff.role,
  createdAt: staff.createdAt,
};

export async function listStaff() {
  return db.select(safeColumns).from(staff).orderBy(staff.createdAt);
}

export async function updateStaff(
  id: number,
  data: { name?: string; email?: string; role?: "admin" | "editor" | "viewer"; password?: string }
) {
  const { password, ...rest } = data;
  const update: Partial<typeof staff.$inferInsert> = { ...rest };
  if (password) update.passwordHash = hashPassword(password);

  const [updated] = await db
    .update(staff)
    .set(update)
    .where(eq(staff.id, id))
    .returning(safeColumns);

  return updated ?? null;
}

export async function deleteStaff(id: number) {
  const [deleted] = await db
    .delete(staff)
    .where(eq(staff.id, id))
    .returning({ id: staff.id });

  return deleted ?? null;
}
