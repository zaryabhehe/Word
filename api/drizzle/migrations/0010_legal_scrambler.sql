ALTER TABLE "leaderboard" ADD COLUMN "temp_user_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leaderboard" ADD CONSTRAINT "leaderboard_temp_user_id_users_id_fk" FOREIGN KEY ("temp_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
