import { Router } from "express";
import { db, usersTable, debatesTable, argumentsTable, participantsTable } from "@workspace/db";
import { eq, desc, sql, ilike, and, count } from "drizzle-orm";
import { authenticate, optionalAuth } from "../middlewares/auth";

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

async function enrichDebate(debate: typeof debatesTable.$inferSelect) {
  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, debate.authorId)).limit(1);
  const [{ argCount }] = await db
    .select({ argCount: count() })
    .from(argumentsTable)
    .where(eq(argumentsTable.debateId, debate.id));
  const [{ partCount }] = await db
    .select({ partCount: count() })
    .from(participantsTable)
    .where(eq(participantsTable.debateId, debate.id));

  return {
    ...debate,
    author: author ? formatUser(author) : null,
    argumentCount: Number(argCount),
    participantCount: Number(partCount),
  };
}

router.get("/debates", optionalAuth, async (req, res) => {
  const { category, search, sort, limit = "20", offset = "0" } = req.query as Record<string, string>;

  let query = db.select().from(debatesTable).$dynamic();

  const conditions = [];
  if (category) conditions.push(eq(debatesTable.category, category));
  if (search) conditions.push(ilike(debatesTable.title, `%${search}%`));
  if (conditions.length > 0) query = query.where(and(...conditions));

  if (sort === "trending") {
    query = query.orderBy(desc(debatesTable.viewCount));
  } else if (sort === "most_active") {
    query = query.orderBy(desc(debatesTable.updatedAt));
  } else {
    query = query.orderBy(desc(debatesTable.createdAt));
  }

  const debates = await query.limit(Number(limit)).offset(Number(offset));
  const enriched = await Promise.all(debates.map(enrichDebate));

  const [{ total }] = await db.select({ total: count() }).from(debatesTable);
  return res.json({ debates: enriched, total: Number(total) });
});

router.get("/debates/trending", async (_req, res) => {
  const limit = Number(_req.query.limit ?? 5);
  const debates = await db.select().from(debatesTable)
    .where(eq(debatesTable.status, "active"))
    .orderBy(desc(debatesTable.viewCount))
    .limit(limit);
  const enriched = await Promise.all(debates.map(enrichDebate));
  return res.json(enriched);
});

router.get("/debates/categories", async (_req, res) => {
  const result = await db
    .select({ name: debatesTable.category, count: count() })
    .from(debatesTable)
    .groupBy(debatesTable.category)
    .orderBy(desc(count()));
  return res.json(result);
});

router.get("/debates/:id", optionalAuth, async (req, res) => {
  const id = Number(req.params.id);
  const [debate] = await db.select().from(debatesTable).where(eq(debatesTable.id, id)).limit(1);
  if (!debate) return res.status(404).json({ error: "Debate not found" });

  await db.update(debatesTable).set({ viewCount: sql`${debatesTable.viewCount} + 1` }).where(eq(debatesTable.id, id));

  const enriched = await enrichDebate(debate);
  return res.json(enriched);
});

router.post("/debates", authenticate, async (req, res) => {
  const { title, description, category, tags = [] } = req.body;
  if (!title || !description || !category) {
    return res.status(400).json({ error: "Title, description, and category are required" });
  }

  const [debate] = await db.insert(debatesTable).values({
    title,
    description,
    category,
    tags,
    authorId: req.user!.userId,
    status: "active",
  }).returning();

  await db.insert(participantsTable).values({ userId: req.user!.userId, debateId: debate.id }).onConflictDoNothing();
  const enriched = await enrichDebate(debate);
  return res.status(201).json(enriched);
});

router.patch("/debates/:id", authenticate, async (req, res) => {
  const id = Number(req.params.id);
  const [debate] = await db.select().from(debatesTable).where(eq(debatesTable.id, id)).limit(1);
  if (!debate) return res.status(404).json({ error: "Debate not found" });
  if (debate.authorId !== req.user!.userId && req.user!.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { title, description, category, tags, status } = req.body;
  const updates: Partial<typeof debate> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (category !== undefined) updates.category = category;
  if (tags !== undefined) updates.tags = tags;
  if (status !== undefined) updates.status = status;

  const [updated] = await db.update(debatesTable).set(updates).where(eq(debatesTable.id, id)).returning();
  const enriched = await enrichDebate(updated);
  return res.json(enriched);
});

router.delete("/debates/:id", authenticate, async (req, res) => {
  const id = Number(req.params.id);
  const [debate] = await db.select().from(debatesTable).where(eq(debatesTable.id, id)).limit(1);
  if (!debate) return res.status(404).json({ error: "Debate not found" });
  if (debate.authorId !== req.user!.userId && req.user!.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }
  await db.delete(debatesTable).where(eq(debatesTable.id, id));
  return res.status(204).send();
});

router.post("/debates/:id/join", authenticate, async (req, res) => {
  const id = Number(req.params.id);
  const [debate] = await db.select().from(debatesTable).where(eq(debatesTable.id, id)).limit(1);
  if (!debate) return res.status(404).json({ error: "Debate not found" });

  await db.insert(participantsTable).values({ userId: req.user!.userId, debateId: id }).onConflictDoNothing();

  const [{ partCount }] = await db.select({ partCount: count() }).from(participantsTable).where(eq(participantsTable.debateId, id));
  return res.json({ debateId: id, participantCount: Number(partCount) });
});

export default router;
