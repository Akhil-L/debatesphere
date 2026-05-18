import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { argumentsTable } from "./arguments";

export const repliesTable = pgTable("replies", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  argumentId: integer("argument_id").notNull().references(() => argumentsTable.id),
  authorId: integer("author_id").notNull().references(() => usersTable.id),
  upvotes: integer("upvotes").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReplySchema = createInsertSchema(repliesTable).omit({ id: true, createdAt: true, upvotes: true });
export type InsertReply = z.infer<typeof insertReplySchema>;
export type Reply = typeof repliesTable.$inferSelect;
