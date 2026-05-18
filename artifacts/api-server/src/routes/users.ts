import { Router } from "express";
import { db, usersTable, debatesTable, argumentsTable, votesTable } from "@workspace/db";
import { eq, count, sql, desc } from "drizzle-orm";

const router = Router();

function getTier(reputation: number): string {
  if (reputation >= 1000) return "Diamond Debater";
  if (reputation >= 500) return "Gold Debater";
  if (reputation >= 100) return "Silver Debater";
  return "Bronze Debater";
}

router.get("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });

  const [{ debateCount }] = await db.select({ debateCount: count() }).from(debatesTable).where(eq(debatesTable.authorId, id));
  const [{ argumentCount }] = await db.select({ argumentCount: count() }).from(argumentsTable).where(eq(argumentsTable.authorId, id));

  const userArgs = await db.select({ id: argumentsTable.id }).from(argumentsTable).where(eq(argumentsTable.authorId, id));
  const argIds = userArgs.map(a => a.id);

  let totalVotesReceived = 0;
  if (argIds.length > 0) {
    const [{ upvotes, downvotes }] = await db
      .select({
        upvotes: sql<number>`coalesce(sum(${argumentsTable.upvotes}), 0)`,
        downvotes: sql<number>`coalesce(sum(${argumentsTable.downvotes}), 0)`,
      })
      .from(argumentsTable)
      .where(eq(argumentsTable.authorId, id));
    totalVotesReceived = Number(upvotes) + Number(downvotes);
  }

  return res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    reputation: user.reputation,
    tier: getTier(user.reputation),
    bio: user.bio,
    debateCount: Number(debateCount),
    argumentCount: Number(argumentCount),
    totalVotesReceived,
    createdAt: user.createdAt,
  });
});

router.get("/users/:id/debates", async (req, res) => {
  const id = Number(req.params.id);
  const debates = await db.select().from(debatesTable)
    .where(eq(debatesTable.authorId, id))
    .orderBy(desc(debatesTable.createdAt))
    .limit(20);

  const enriched = await Promise.all(debates.map(async (debate) => {
    const [author] = await db.select().from(usersTable).where(eq(usersTable.id, debate.authorId)).limit(1);
    const [{ argCount }] = await db.select({ argCount: count() }).from(argumentsTable).where(eq(argumentsTable.debateId, debate.id));
    return {
      ...debate,
      author: author ? {
        id: author.id,
        username: author.username,
        email: author.email,
        role: author.role,
        reputation: author.reputation,
        tier: getTier(author.reputation),
        bio: author.bio,
        createdAt: author.createdAt,
      } : null,
      argumentCount: Number(argCount),
      participantCount: 0,
    };
  }));
  return res.json(enriched);
});

export default router;
