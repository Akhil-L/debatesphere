import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, signToken } from "../middlewares/auth";

const router = Router();

function getTier(reputation: number): string {
  if (reputation >= 1000) return "Diamond Debater";
  if (reputation >= 500) return "Gold Debater";
  if (reputation >= 100) return "Silver Debater";
  return "Bronze Debater";
}

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    reputation: user.reputation,
    tier: getTier(user.reputation),
    bio: user.bio,
    createdAt: user.createdAt,
  };
}

router.post("/auth/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    return res.status(400).json({ error: "Email already in use" });
  }

  const usernameCheck = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (usernameCheck.length > 0) {
    return res.status(400).json({ error: "Username already taken" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ username, email, passwordHash }).returning();
  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  return res.status(201).json({ token, user: formatUser(user) });
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  return res.json({ token, user: formatUser(user) });
});

router.get("/auth/me", authenticate, async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  if (!user) return res.status(401).json({ error: "User not found" });
  return res.json(formatUser(user));
});

export default router;
