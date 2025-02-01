import { Composer } from "grammy";

import {
  allowedChatSearchKeys,
  allowedChatTimeKeys,
} from "../config/constants";
import { getLeaderboardScores } from "../services/get-leaderboard-scores";
import { getUserScores } from "../services/get-user-scores";
import { AllowedChatSearchKey, AllowedChatTimeKey } from "../types";
import { formatLeaderboardMessage } from "../util/format-leaderboard-message";
import { formatUserScoreMessage } from "../util/format-user-score-message";
import { generateLeaderboardKeyboard } from "../util/generate-leaderboard-keyboard";

const composer = new Composer();

composer.on("callback_query:data", async (ctx) => {
  condition: if (ctx.callbackQuery.data.startsWith("leaderboard")) {
    const [, searchKey, timeKey] = ctx.callbackQuery.data.split(" ");
    if (!allowedChatSearchKeys.includes(searchKey as AllowedChatSearchKey))
      break condition;
    if (!allowedChatTimeKeys.includes(timeKey as AllowedChatTimeKey))
      break condition;
    if (!ctx.chat) break condition;

    const chatId = ctx.chat.id.toString();
    const memberScores = await getLeaderboardScores({
      chatId,
      searchKey: searchKey as AllowedChatSearchKey,
      timeKey: timeKey as AllowedChatTimeKey,
    });

    const keyboard = generateLeaderboardKeyboard(
      searchKey as AllowedChatSearchKey,
      timeKey as AllowedChatTimeKey,
    );

    await ctx
      .editMessageText(
        formatLeaderboardMessage(
          memberScores,
          searchKey as AllowedChatSearchKey,
          timeKey as AllowedChatTimeKey,
        ),
        {
          reply_markup: keyboard,
          link_preview_options: { is_disabled: true },
        },
      )
      .catch(() => {});
  } else if (ctx.callbackQuery.data.startsWith("myscore")) {
    const [, userId, searchKey, timeKey] = ctx.callbackQuery.data.split(" ");
    if (!allowedChatSearchKeys.includes(searchKey as AllowedChatSearchKey))
      break condition;
    if (!allowedChatTimeKeys.includes(timeKey as AllowedChatTimeKey))
      break condition;
    if (!ctx.chat) break condition;

    const chatId = ctx.chat.id.toString();
    const userScores = await getUserScores({
      chatId,
      userId,
      searchKey: searchKey as AllowedChatSearchKey,
      timeKey: timeKey as AllowedChatTimeKey,
    });

    if (!userScores)
      return ctx.answerCallbackQuery({
        text: "No one has scored yet.",
        show_alert: true,
      });

    const userScore = userScores[0];

    const keyboard = generateLeaderboardKeyboard(
      searchKey as AllowedChatSearchKey,
      timeKey as AllowedChatTimeKey,
      `myscore ${Number(userId)}`,
    );

    await ctx
      .editMessageText(
        formatUserScoreMessage(userScore, searchKey as AllowedChatSearchKey),
        {
          reply_markup: keyboard,
          link_preview_options: { is_disabled: true },
        },
      )
      .catch(() => {});
  }
  await ctx.answerCallbackQuery();
});

export const callbackQueryHandler = composer;
