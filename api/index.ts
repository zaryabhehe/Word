import { Bot, InlineKeyboard, webhookCallback } from "grammy";
import express from "express";
import type { Request, Response } from "express";
import { env } from "./env";
import allWords from "./allWords.json";
import commonWords from "./commonWords.json";
import { db } from "./drizzle/db";
import {
  gamesTable,
  guessesTable,
  leaderboardTable,
  usersTable,
} from "./drizzle/schema";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { NeonDbError } from "@neondatabase/serverless";

const bot = new Bot(env.BOT_TOKEN);

bot.command("start", (ctx) =>
  ctx.reply(
    `<blockquote>How to Play:</blockquote>
1. Use /new to start a game. Add me to a group with admin permission to play with your friends.
2. Use /help to get help on how to play and commands list.
  <blockquote>Proudly built with ❤️ by Binamra Lamsal @BinamraBots.</blockquote>`,
    {
      parse_mode: "HTML",
    }
  )
);

bot.command("help", (ctx) =>
  ctx.reply(
    `<blockquote>How to Play:</blockquote>
1. You have to guess a random 5-letter word.
2. After each guess, you'll get hints:
   - 🟩 - Correct letter in the right spot.
   - 🟨 - Correct letter in the wrong spot.
   - 🟥 - Letter not in the word.
3. The game will run until the word is found or a maximum of 30 guesses are reached.
4. The first person to guess the word correctly wins.

Commands:
- /new - Start a new game.
- /end - End the current game. Available for only admins in groups.
- /help - Get help on how to play and commands list.
- /leaderboard - Get leaderboard from current group.
- /leaderboard global - Get global leaderboard.

<blockquote>Proudly built with ❤️ by Binamra Lamsal @BinamraBots.</blockquote>`,
    {
      parse_mode: "HTML",
    }
  )
);

bot.command("new", async (ctx) => {
  try {
    const chatId = ctx.chat.id;
    const randomWord =
      commonWords[Math.floor(Math.random() * commonWords.length)].toLowerCase();

    await db.insert(gamesTable).values({
      word: randomWord,
      activeChat: String(chatId),
    });
    ctx.reply("Game started! Guess the 5 letter word!");
  } catch (error) {
    if (error instanceof NeonDbError && error.code === "23505") {
      return ctx.reply(
        "There is already a game in progress in this chat. Use /end to end the current game."
      );
    }

    console.error(error);
    ctx.reply("Something went wrong. Please try again.");
  }
});

bot.command("end", async (ctx) => {
  try {
    if (!ctx.message) return;

    if (ctx.chat.type === "group" || ctx.chat.type === "supergroup") {
      const chatMember = await ctx.api.getChatMember(
        ctx.chat.id,
        ctx.message.from.id
      );

      chatMember.status;

      const allowedStatus = ["administrator", "creator"];
      if (!allowedStatus.includes(chatMember.status)) {
        return ctx.reply("Only admins can end the game.");
      }
    }

    const currentGame = await db.query.gamesTable.findFirst({
      where: eq(gamesTable.activeChat, String(ctx.chat.id)),
    });

    if (!currentGame) return ctx.reply("There is no game in progress.");

    await db
      .delete(gamesTable)
      .where(eq(gamesTable.activeChat, String(ctx.chat.id)));

    ctx.reply(
      "Game Ended!\nCorrect word was " + currentGame.word + "\nStart with /new"
    );
  } catch (err) {
    console.error(err);
    return ctx.reply("Something went wrong. Please try again.");
  }
});

type LeaderboardEntry = {
  userId: string;
  name: string;
  username: string | null;
  totalScore: number;
};

function formatLeaderboardMessage(
  data: LeaderboardEntry[],
  searchKey: AllowedChatSearchKey,
  timeKey: AllowedChatTimeKey
) {
  const blocks = data.reduce((acc, entry, index) => {
    const rank = index < 3 ? ["🥇", "🥈", "🥉"][index] : "🔅";

    let usernameLink = escapeHtmlEntities(entry.name);
    if (entry.username) {
      usernameLink = `<a href="t.me/${entry.username}">${escapeHtmlEntities(
        entry.name
      )}</a>`;
    }

    const line = `${rank}${usernameLink} - ${entry.totalScore} pts`;

    if (index === 0 || index === 3 || (index > 3 && (index - 3) % 10 === 0)) {
      acc.push([]);
    }
    acc[acc.length - 1].push(line);

    return acc;
  }, [] as string[][]);

  const formattedEntries = blocks
    .map((block) => `<blockquote>${block.join("\n")}</blockquote>`)
    .join("\n");

  return `<blockquote>🏆 ${
    searchKey === "global" ? "Global" : "Group"
  } Leaderboard 🏆</blockquote>\n\n${formattedEntries}\n\n<blockquote>Proudly built with ❤️ by Binamra Lamsal @BinamraBots.</blockquote>`;
}

const allowedChatSearchKeys = ["global", "group"] as const;
type AllowedChatSearchKey = (typeof allowedChatSearchKeys)[number];
const allowedChatTimeKeys = ["today", "week", "month", "year", "all"] as const;
type AllowedChatTimeKey = (typeof allowedChatTimeKeys)[number];

function parseInput(
  input: string,
  defaultSearchKey: AllowedChatSearchKey = "group",
  defaultTimeKey: AllowedChatTimeKey = "month"
) {
  const parts = input.toLowerCase().trim().split(" ");

  const searchKey = (parts.find((part) =>
    allowedChatSearchKeys.includes(part as AllowedChatSearchKey)
  ) || defaultSearchKey) as AllowedChatSearchKey;

  const timeKey = (parts.find((part) =>
    allowedChatTimeKeys.includes(part as AllowedChatTimeKey)
  ) || defaultTimeKey) as AllowedChatTimeKey;

  return { searchKey, timeKey };
}

function generateButtonText<T>(key: T, currentKey: T, label: string) {
  return `${key === currentKey ? "✅ " : ""}${label}`;
}

function generateKeyboard(
  searchKey: AllowedChatSearchKey,
  timeKey: AllowedChatTimeKey
) {
  const keyboard = new InlineKeyboard();

  allowedChatSearchKeys.forEach((key) => {
    keyboard.text(
      generateButtonText(
        searchKey,
        key,
        key === "group" ? "This group" : "Global"
      ),
      `leaderboard ${key} ${timeKey}`
    );
  });
  keyboard.row();

  allowedChatTimeKeys.forEach((key, index) => {
    keyboard.text(
      generateButtonText(
        timeKey,
        key,
        key === "all" ? "All time" : key === "today" ? "Today" : `This ${key}`
      ),
      `leaderboard ${searchKey} ${key}`
    );
    if ((index + 1) % 3 === 0) {
      keyboard.row();
    }
  });

  return keyboard;
}

async function getLeaderboardScores(
  chatId: string,
  searchKey: AllowedChatSearchKey,
  timeKey: AllowedChatTimeKey
) {
  let timeFilter: any = undefined;
  switch (timeKey) {
    case "today":
      timeFilter = sql`date_trunc('day', ${leaderboardTable.createdAt}) = date_trunc('day', now())`;
      break;
    case "week":
      timeFilter = sql`date_trunc('week', ${leaderboardTable.createdAt}) = date_trunc('week', now())`;
      break;
    case "month":
      timeFilter = sql`date_trunc('month', ${leaderboardTable.createdAt}) = date_trunc('month', now())`;
      break;
    case "year":
      timeFilter = sql`date_trunc('year', ${leaderboardTable.createdAt}) = date_trunc('year', now())`;
      break;
    case "all":
      timeFilter = undefined;
      break;
  }

  const conditions = [
    searchKey === "group" ? eq(leaderboardTable.chatId, chatId) : undefined,
    timeFilter,
  ].filter(Boolean);

  return db
    .select({
      userId: usersTable.telegramUserId,
      name: usersTable.name,
      username: usersTable.username,
      totalScore: sql<number>`cast(sum(${leaderboardTable.score}) as integer)`,
    })
    .from(leaderboardTable)
    .where(and(...conditions))
    .groupBy(usersTable.telegramUserId, usersTable.name, usersTable.username)
    .innerJoin(usersTable, eq(usersTable.id, leaderboardTable.userId))
    .orderBy(desc(sql`sum(${leaderboardTable.score})`))
    .limit(20)
    .execute();
}

function escapeHtmlEntities(text: string) {
  const entityMap = {
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&#39;", // Single quotes
    "/": "&#x2F;", // Slash
  };

  return text.replace(/[<>&"'\/]/g, (char) => entityMap[char]);
}

bot.command("leaderboard", async (ctx) => {
  if (ctx.chat.type === "private")
    return ctx.reply(
      "This command is not available in private chats. Please add me in a group and use it."
    );

  const { searchKey, timeKey } = parseInput(ctx.match);

  const keyboard = generateKeyboard(searchKey, timeKey);

  const chatId = ctx.chat.id.toString();
  const memberScores = await getLeaderboardScores(chatId, searchKey, timeKey);

  const message = formatLeaderboardMessage(memberScores, searchKey, timeKey);
  console.log(message);

  ctx.reply(formatLeaderboardMessage(memberScores, searchKey, timeKey), {
    parse_mode: "HTML",
    disable_notification: true,
    reply_markup: keyboard,
    link_preview_options: {
      is_disabled: true,
    },
  });
});

bot.on("callback_query:data", async (ctx) => {
  condition: if (ctx.callbackQuery.data.startsWith("leaderboard")) {
    const [, searchKey, timeKey] = ctx.callbackQuery.data.split(" ");
    if (!allowedChatSearchKeys.includes(searchKey as AllowedChatSearchKey))
      break condition;
    if (!allowedChatTimeKeys.includes(timeKey as AllowedChatTimeKey))
      break condition;
    if (!ctx.chat) break condition;

    const chatId = ctx.chat.id.toString();
    const memberScores = await getLeaderboardScores(
      chatId,
      searchKey as AllowedChatSearchKey,
      timeKey as AllowedChatTimeKey
    );

    const keyboard = generateKeyboard(
      searchKey as AllowedChatSearchKey,
      timeKey as AllowedChatTimeKey
    );

    await ctx
      .editMessageText(
        formatLeaderboardMessage(
          memberScores,
          searchKey as AllowedChatSearchKey,
          timeKey as AllowedChatTimeKey
        ),
        {
          reply_markup: keyboard,
          link_preview_options: { is_disabled: true },
          parse_mode: "HTML",
        }
      )
      .catch(() => {});
  }
  await ctx.answerCallbackQuery();
});

bot.on("message", async (ctx) => {
  const currentGuess = ctx.message.text?.toLowerCase();
  if (!currentGuess || currentGuess.length !== 5) return;

  const currentGame = await db.query.gamesTable.findFirst({
    where: eq(gamesTable.activeChat, String(ctx.chat.id)),
  });

  if (!currentGame) return;

  if (!allWords.includes(currentGuess) && !commonWords.includes(currentGuess))
    return ctx.reply(`${currentGuess} is not a valid word.`);

  const guessExists = await db.query.guessesTable.findFirst({
    where: and(
      eq(guessesTable.guess, currentGuess),
      eq(guessesTable.chatId, ctx.chat.id.toString())
    ),
  });

  if (guessExists)
    return ctx.reply(
      "Someone has already guessed your word. Please try another one!"
    );

  if (currentGuess === currentGame.word) {
    const allGuesses = await db.query.guessesTable.findMany({
      where: eq(guessesTable.gameId, currentGame.id),
    });

    const name = `${ctx.from.first_name}${
      ctx.from.last_name ? " " + ctx.from.last_name : ""
    }`;
    const username = ctx.from.username;
    const userId = ctx.from.id.toString();
    const chatId = ctx.chat.id.toString();

    let additionalMessage = "";
    if (ctx.chat.type === "group" || ctx.chat.type === "supergroup") {
      const score = 30 - allGuesses.length;
      additionalMessage = `Added ${30 - allGuesses.length} to the leaderboard.`;

      const [dbUser] = await db
        .insert(usersTable)
        .values({
          name,
          telegramUserId: userId,
          username,
        })
        .onConflictDoUpdate({
          target: [usersTable.telegramUserId],
          set: {
            name,
            username,
          },
        })
        .returning({ userId: usersTable.id });
      await db.insert(leaderboardTable).values({
        score,
        chatId,
        userId: dbUser.userId,
      });
    }
    ctx.reply(
      `Congrats! You guessed it correctly.\n${additionalMessage}\nStart with /new`,
      {
        reply_parameters: { message_id: ctx.message.message_id },
      }
    );
    ctx.react("🎉");
    await db.delete(gamesTable).where(eq(gamesTable.id, currentGame.id));
    return;
  }

  await db.insert(guessesTable).values({
    gameId: currentGame.id,
    guess: currentGuess,
    chatId: ctx.chat.id.toString(),
  });

  const allGuesses = await db.query.guessesTable.findMany({
    where: eq(guessesTable.gameId, currentGame.id),
    orderBy: asc(guessesTable.createdAt),
  });

  if (allGuesses.length === 30) {
    await db.delete(gamesTable).where(eq(gamesTable.id, currentGame.id));
    return ctx.reply(
      "Game Over! The word was " +
        currentGame.word +
        "\nYou can start a new game with /new"
    );
  }

  ctx.reply(getFeedback(allGuesses, currentGame.word));
});

async function init() {
  await bot.api.setMyCommands([
    { command: "new", description: "Start a new game." },
    {
      command: "end",
      description: "End the current game. Available for only admins in groups.",
    },
    {
      command: "help",
      description: "Get help on how to play and commands list.",
    },
    {
      command: "leaderboard",
      description: "Get leaderboard of the game in this chat.",
    },
  ]);
}

init();

const app = express();
app.use(express.json());

if (env.NODE_ENV === "development") {
  bot.start({
    onStart: () => console.log("Bot started"),
    drop_pending_updates: true,
  });
} else {
  app.use(webhookCallback(bot, "express"));
}

app.get("/", (req: Request, res: Response) => {
  res.send("Bot is running!");
});

export default app;

interface GuessEntry {
  id: number;
  guess: string;
  gameId: number;
  createdAt: Date;
  updatedAt: Date;
}

function getFeedback(data: GuessEntry[], solution: string) {
  return data
    .map((entry) => {
      let feedback = "";
      const guess = entry.guess.toUpperCase();
      const solutionCount: Record<string, number> = {};

      for (const char of solution.toUpperCase()) {
        solutionCount[char] = (solutionCount[char] || 0) + 1;
      }

      const result = Array(guess.length).fill("🟥");
      for (let i = 0; i < guess.length; i++) {
        if (guess[i] === solution[i].toUpperCase()) {
          result[i] = "🟩";
          solutionCount[guess[i]]--;
        }
      }

      for (let i = 0; i < guess.length; i++) {
        if (result[i] === "🟥" && solutionCount[guess[i]] > 0) {
          result[i] = "🟨";
          solutionCount[guess[i]]--;
        }
      }

      feedback = result.join(" ");
      return `${feedback} ${guess}`;
    })
    .join("\n");
}
