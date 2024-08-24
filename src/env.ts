import { z } from "zod";

export const env = z
  .object({
    BOT_TOKEN: z.string().min(1, { message: "BOT_TOKEN is required" }),
    DATABASE_URI: z.string().min(1, { message: "DATABASE_URI is required" }),
    NODE_ENV: z.enum(["development", "production"]).default("development"),
  })
  .parse(process.env);
