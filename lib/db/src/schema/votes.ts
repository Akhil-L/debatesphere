import { pgTable, text, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { argumentsTable } from "./arguments";

export const votesTable = pgTable("votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id),
  argumentId: integer("argument_id").notNull().references(() => argumentsTable.id),
  vote: text("vote").notNull(),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.userId, t.argumentId),
  unique().on(t.ipAddress, t.argumentId),
]);

export type Vote = typeof votesTable.$inferSelect;