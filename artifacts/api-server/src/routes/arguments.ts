import { Router } from "express";
import { db, usersTable, argumentsTable, repliesTable, votesTable, participantsTable } from "@workspace/db";
import { eq, desc, count, sql } from "drizzle-orm";
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

async function enrichArgument(arg: typeof argumentsTable.$inferSelect, userId?: number) {
  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, arg.authorId)).limit(1);
  const [{ replyCount }] = await db.select({ replyCount: count() }).from(repliesTable).where(eq(repliesTable.argumentId, arg.id));

  let userVote: string | null = null;
  if (userId) {
    const [vote] = await db.select().from(votesTable).where(
      eq(votesTable.argumentId, arg.id)
    ).limit(1);
    if (vote && vote.userId === userId) userVote = vote.vote;
  }

  return {
    ...arg,
    author: author ? formatUser(author) : null,
    replyCount: Number(replyCount),
    userVote,
  };
}

router.get("/debates/:id/arguments", optionalAuth, async (req, res) => {
  const debateId = Number(req.params.id);
  const args = await db.select().from(argumentsTable)
    .where(eq(argumentsTable.debateId, debateId))
    .orderBy(desc(argumentsTable.createdAt));

  const enriched = await Promise.all(args.map(a => enrichArgument(a, req.user?.userId)));
  return res.json(enriched);
});

router.post("/debates/:id/arguments", authenticate, async (req, res) => {
  const debateId = Number(req.params.id);
  const { content, stance = "neutral" } = req.body;
  if (!content) return res.status(400).json({ error: "Content is required" });

  const [arg] = await db.insert(argumentsTable).values({
    content,
    debateId,
    authorId: req.user!.userId,
    stance,
  }).returning();

  await db.insert(participantsTable).values({ userId: req.user!.userId, debateId }).onConflictDoNothing();
  const enriched = await enrichArgument(arg, req.user!.userId);
  return res.status(201).json(enriched);
});

router.patch("/arguments/:id", authenticate, async (req, res) => {
  const id = Number(req.params.id);
  const [arg] = await db.select().from(argumentsTable).where(eq(argumentsTable.id, id)).limit(1);
  if (!arg) return res.status(404).json({ error: "Argument not found" });
  if (arg.authorId !== req.user!.userId) return res.status(403).json({ error: "Forbidden" });

  const { content } = req.body;
  const [updated] = await db.update(argumentsTable).set({ content }).where(eq(argumentsTable.id, id)).returning();
  const enriched = await enrichArgument(updated, req.user!.userId);
  return res.json(enriched);
});

router.delete("/arguments/:id", authenticate, async (req, res) => {
  const id = Number(req.params.id);
  const [arg] = await db.select().from(argumentsTable).where(eq(argumentsTable.id, id)).limit(1);
  if (!arg) return res.status(404).json({ error: "Argument not found" });
  if (arg.authorId !== req.user!.userId && req.user!.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }
  await db.delete(argumentsTable).where(eq(argumentsTable.id, id));
  return res.status(204).send();
});

router.get("/arguments/:id/replies", async (req, res) => {
  const argumentId = Number(req.params.id);
  const replies = await db.select().from(repliesTable)
    .where(eq(repliesTable.argumentId, argumentId))
    .orderBy(desc(repliesTable.createdAt));

  const enriched = await Promise.all(replies.map(async (r) => {
    const [author] = await db.select().from(usersTable).where(eq(usersTable.id, r.authorId)).limit(1);
    return { ...r, author: author ? formatUser(author) : null };
  }));
  return res.json(enriched);
});

router.post("/arguments/:id/replies", authenticate, async (req, res) => {
  const argumentId = Number(req.params.id);
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "Content is required" });

  const [reply] = await db.insert(repliesTable).values({
    content,
    argumentId,
    authorId: req.user!.userId,
  }).returning();

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  return res.status(201).json({ ...reply, author: author ? formatUser(author) : null });
});

router.post("/votes/argument/:id", authenticate, async (req, res) => {
  const argumentId = Number(req.params.id);
  const { vote } = req.body;

  if (!["up", "down", "none"].includes(vote)) {
    return res.status(400).json({ error: "Vote must be up, down, or none" });
  }

  const [arg] = await db.select().from(argumentsTable).where(eq(argumentsTable.id, argumentId)).limit(1);
  if (!arg) return res.status(404).json({ error: "Argument not found" });

  const [existing] = await db.select().from(votesTable)
    .where(eq(votesTable.argumentId, argumentId))
    .limit(1);

  const userExisting = existing?.userId === req.user!.userId ? existing : null;

  if (vote === "none") {
    if (userExisting) {
      await db.delete(votesTable).where(eq(votesTable.id, userExisting.id));
      const delta = userExisting.vote === "up" ? -1 : 1;
      if (userExisting.vote === "up") {
        await db.update(argumentsTable).set({ upvotes: sql`${argumentsTable.upvotes} - 1` }).where(eq(argumentsTable.id, argumentId));
      } else {
        await db.update(argumentsTable).set({ downvotes: sql`${argumentsTable.downvotes} - 1` }).where(eq(argumentsTable.id, argumentId));
      }
      await db.update(usersTable).set({ reputation: sql`${usersTable.reputation} + ${delta}` }).where(eq(usersTable.id, arg.authorId));
    }
  } else if (!userExisting) {
    await db.insert(votesTable).values({ userId: req.user!.userId, argumentId, vote });
    if (vote === "up") {
      await db.update(argumentsTable).set({ upvotes: sql`${argumentsTable.upvotes} + 1` }).where(eq(argumentsTable.id, argumentId));
      await db.update(usersTable).set({ reputation: sql`${usersTable.reputation} + 1` }).where(eq(usersTable.id, arg.authorId));
    } else {
      await db.update(argumentsTable).set({ downvotes: sql`${argumentsTable.downvotes} + 1` }).where(eq(argumentsTable.id, argumentId));
      await db.update(usersTable).set({ reputation: sql`${usersTable.reputation} - 1` }).where(eq(usersTable.id, arg.authorId));
    }
  } else if (userExisting.vote !== vote) {
    await db.update(votesTable).set({ vote }).where(eq(votesTable.id, userExisting.id));
    if (vote === "up") {
      await db.update(argumentsTable).set({
        upvotes: sql`${argumentsTable.upvotes} + 1`,
        downvotes: sql`${argumentsTable.downvotes} - 1`,
      }).where(eq(argumentsTable.id, argumentId));
      await db.update(usersTable).set({ reputation: sql`${usersTable.reputation} + 2` }).where(eq(usersTable.id, arg.authorId));
    } else {
      await db.update(argumentsTable).set({
        upvotes: sql`${argumentsTable.upvotes} - 1`,
        downvotes: sql`${argumentsTable.downvotes} + 1`,
      }).where(eq(argumentsTable.id, argumentId));
      await db.update(usersTable).set({ reputation: sql`${usersTable.reputation} - 2` }).where(eq(usersTable.id, arg.authorId));
    }
  }

  const [refreshed] = await db.select().from(argumentsTable).where(eq(argumentsTable.id, argumentId)).limit(1);
  const [userVoteRow] = await db.select().from(votesTable)
    .where(eq(votesTable.argumentId, argumentId))
    .limit(1);

  return res.json({
    upvotes: refreshed.upvotes,
    downvotes: refreshed.downvotes,
    userVote: userVoteRow?.userId === req.user!.userId ? userVoteRow.vote : null,
  });
});

export default router;
