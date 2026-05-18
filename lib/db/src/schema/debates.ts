import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const debatesTable = pgTable("debates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  tags: text("tags").array().notNull().default([]),
  status: text("status").notNull().default("active"),
  authorId: integer("author_id").notNull().references(() => usersTable.id),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDebateSchema = createInsertSchema(debatesTable).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true });
export type InsertDebate = z.infer<typeof insertDebateSchema>;
export type Debate = typeof debatesTable.$inferSelect;
