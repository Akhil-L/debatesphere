import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { debatesTable } from "./debates";

export const argumentsTable = pgTable("arguments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  debateId: integer("debate_id").notNull().references(() => debatesTable.id),
  authorId: integer("author_id").notNull().references(() => usersTable.id),
  upvotes: integer("upvotes").notNull().default(0),
  downvotes: integer("downvotes").notNull().default(0),
  stance: text("stance").notNull().default("neutral"),
  isFlagged: boolean("is_flagged").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertArgumentSchema = createInsertSchema(argumentsTable).omit({ id: true, createdAt: true, updatedAt: true, upvotes: true, downvotes: true, isFlagged: true });
export type InsertArgument = z.infer<typeof insertArgumentSchema>;
export type Argument = typeof argumentsTable.$inferSelect;
