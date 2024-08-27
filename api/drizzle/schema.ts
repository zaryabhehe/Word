import { relations, sql } from "drizzle-orm";
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const gamesTable = pgTable(
  "games",
  {
    id: serial("id").primaryKey(),
    word: varchar("word", { length: 5 }).notNull(),
    activeChat: text("active_chat").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    activeChatIndex: uniqueIndex("chat_idx"),
  })
);

export const guessesTable = pgTable("guesses", {
  id: serial("id").primaryKey(),
  guess: varchar("guess", { length: 5 }).notNull(),
  gameId: integer("game_id")
    .notNull()
    .references(() => gamesTable.id, { onDelete: "cascade" }),
  chatId: varchar("chat_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

export const leaderboardTable = pgTable("leaderboard", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  username: varchar("username", { length: 255 }),
  userId: varchar("user_id").notNull(),
  chatId: varchar("chat_id").notNull(),
  score: integer("score").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
});

export const gamesRelations = relations(gamesTable, ({ many }) => ({
  guesses: many(guessesTable),
}));

export const guessesRelations = relations(guessesTable, ({ one }) => ({
  game: one(gamesTable, {
    fields: [guessesTable.gameId],
    references: [gamesTable.id],
  }),
}));
