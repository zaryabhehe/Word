ALTER TABLE "leaderboard" RENAME COLUMN "temp_user_id" TO "user_id";--> statement-breakpoint
ALTER TABLE "leaderboard" DROP CONSTRAINT "leaderboard_temp_user_id_users_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leaderboard" ADD CONSTRAINT "leaderboard_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
