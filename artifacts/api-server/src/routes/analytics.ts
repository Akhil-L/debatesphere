import { Router } from "express";
import { db, usersTable, debatesTable, argumentsTable, votesTable, participantsTable } from "@workspace/db";
import { eq, desc, count, sql } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";

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
  const [{ argCount }] = await db.select({ argCount: count() }).from(argumentsTable).where(eq(argumentsTable.debateId, debate.id));
  const [{ partCount }] = await db.select({ partCount: count() }).from(participantsTable).where(eq(participantsTable.debateId, debate.id));
  return {
    ...debate,
    author: author ? formatUser(author) : null,
    argumentCount: Number(argCount),
    participantCount: Number(partCount),
  };
}

router.get("/analytics/dashboard", authenticate, async (_req, res) => {
  const [{ totalDebates }] = await db.select({ totalDebates: count() }).from(debatesTable);
  const [{ activeDebates }] = await db.select({ activeDebates: count() }).from(debatesTable).where(eq(debatesTable.status, "active"));
  const [{ totalArguments }] = await db.select({ totalArguments: count() }).from(argumentsTable);
  const [{ totalUsers }] = await db.select({ totalUsers: count() }).from(usersTable);
  const [{ totalVotes }] = await db.select({ totalVotes: count() }).from(votesTable);

  const mostActiveRaw = await db.select().from(debatesTable).orderBy(desc(debatesTable.viewCount)).limit(5);
  const mostActiveDebates = await Promise.all(mostActiveRaw.map(enrichDebate));

  const controversialRaw = await db
    .select({
      debate: debatesTable,
      argCount: count(argumentsTable.id),
    })
    .from(debatesTable)
    .leftJoin(argumentsTable, eq(argumentsTable.debateId, debatesTable.id))
    .groupBy(debatesTable.id)
    .orderBy(desc(count(argumentsTable.id)))
    .limit(5);

  const controversialTopics = await Promise.all(
    controversialRaw.map(r => enrichDebate(r.debate))
  );

  return res.json({
    totalDebates: Number(totalDebates),
    activeDebates: Number(activeDebates),
    totalArguments: Number(totalArguments),
    totalUsers: Number(totalUsers),
    totalVotes: Number(totalVotes),
    mostActiveDebates,
    controversialTopics,
  });
});

router.get("/analytics/trending-categories", async (_req, res) => {
  const categories = await db
    .select({ name: debatesTable.category, debateCount: count() })
    .from(debatesTable)
    .groupBy(debatesTable.category)
    .orderBy(desc(count()))
    .limit(10);

  const enriched = await Promise.all(categories.map(async (cat) => {
    const debates = await db.select({ id: debatesTable.id }).from(debatesTable).where(eq(debatesTable.category, cat.name));
    let argCount = 0;
    for (const d of debates) {
      const [{ c }] = await db.select({ c: count() }).from(argumentsTable).where(eq(argumentsTable.debateId, d.id));
      argCount += Number(c);
    }
    return {
      name: cat.name,
      debateCount: Number(cat.debateCount),
      argumentCount: argCount,
      engagementScore: Number(cat.debateCount) * 2 + argCount,
    };
  }));
  return res.json(enriched);
});

router.get("/analytics/leaderboard", async (req, res) => {
  const limit = Number(req.query.limit ?? 10);
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.reputation)).limit(limit);

  const enriched = await Promise.all(users.map(async (user, idx) => {
    const [{ debateCount }] = await db.select({ debateCount: count() }).from(debatesTable).where(eq(debatesTable.authorId, user.id));
    const [{ argumentCount }] = await db.select({ argumentCount: count() }).from(argumentsTable).where(eq(argumentsTable.authorId, user.id));
    return {
      rank: idx + 1,
      user: formatUser(user),
      reputation: user.reputation,
      tier: getTier(user.reputation),
      debateCount: Number(debateCount),
      argumentCount: Number(argumentCount),
    };
  }));
  return res.json(enriched);
});

router.get("/analytics/activity", async (_req, res) => {
  const days = 14;
  const points = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const [{ debates }] = await db.select({ debates: count() }).from(debatesTable).where(
      sql`${debatesTable.createdAt} >= ${date.toISOString()} AND ${debatesTable.createdAt} < ${nextDate.toISOString()}`
    );
    const [{ args }] = await db.select({ args: count() }).from(argumentsTable).where(
      sql`${argumentsTable.createdAt} >= ${date.toISOString()} AND ${argumentsTable.createdAt} < ${nextDate.toISOString()}`
    );
    const [{ votes }] = await db.select({ votes: count() }).from(votesTable).where(
      sql`${votesTable.createdAt} >= ${date.toISOString()} AND ${votesTable.createdAt} < ${nextDate.toISOString()}`
    );

    points.push({
      date: dateStr,
      debates: Number(debates),
      arguments: Number(args),
      votes: Number(votes),
    });
  }
  return res.json(points);
});

export default router;
