CREATE TABLE IF NOT EXISTS "banned_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "banned_users" ADD CONSTRAINT "banned_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
