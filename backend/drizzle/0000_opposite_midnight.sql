CREATE TYPE "public"."content_frequency" AS ENUM('daily', 'few_times_week', 'weekly', 'biweekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'non_binary', 'prefer_not_to_say');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('instagram', 'tiktok', 'facebook', 'youtube');--> statement-breakpoint
CREATE TYPE "public"."content_quality" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."responsiveness" AS ENUM('very_responsive', 'responsive', 'slow', 'unresponsive');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'editor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('active', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "public"."tier" AS ENUM('nano', 'micro', 'macro', 'mega');--> statement-breakpoint
CREATE TABLE "influencer_reviews" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "influencer_reviews_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"influencer_id" uuid NOT NULL,
	"staff_id" integer NOT NULL,
	"rating" smallint,
	"review" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "influencer_socials" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "influencer_socials_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"influencer_id" uuid NOT NULL,
	"platform" "platform" NOT NULL,
	"profile_url" varchar(500),
	"followers" integer,
	"avg_views" integer
);
--> statement-breakpoint
CREATE TABLE "influencers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"tier" "tier",
	"net_cost" numeric(12, 2),
	"gross_cost" numeric(12, 2),
	"brand_cost" numeric(12, 2),
	"description" text,
	"contact_no" varchar(50),
	"status" "status" DEFAULT 'active',
	"gender" "gender",
	"family_status" varchar(100),
	"primary_niche" varchar(100),
	"secondary_niche" varchar(100),
	"bio" text,
	"main_age_group" varchar(50),
	"video_style" varchar(100),
	"personality" varchar(255),
	"content_frequency" "content_frequency",
	"content_quality" "content_quality",
	"availability" varchar(255),
	"responsiveness" "responsiveness",
	"lifestyle_traits" text,
	"primary_location" varchar(255) NOT NULL,
	"secondary_location" varchar(255),
	"tertiary_location" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "staff_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'viewer',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "staff_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "influencer_reviews" ADD CONSTRAINT "influencer_reviews_influencer_id_influencers_id_fk" FOREIGN KEY ("influencer_id") REFERENCES "public"."influencers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "influencer_reviews" ADD CONSTRAINT "influencer_reviews_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "influencer_socials" ADD CONSTRAINT "influencer_socials_influencer_id_influencers_id_fk" FOREIGN KEY ("influencer_id") REFERENCES "public"."influencers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_reviews_influencer_id" ON "influencer_reviews" USING btree ("influencer_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_staff_id" ON "influencer_reviews" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "idx_socials_influencer_id" ON "influencer_socials" USING btree ("influencer_id");--> statement-breakpoint
CREATE INDEX "idx_influencers_status" ON "influencers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_influencers_tier" ON "influencers" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "idx_influencers_brand_cost" ON "influencers" USING btree ("brand_cost");--> statement-breakpoint
CREATE INDEX "idx_influencers_primary_niche" ON "influencers" USING btree ("primary_niche");--> statement-breakpoint
CREATE INDEX "idx_influencers_content_frequency" ON "influencers" USING btree ("content_frequency");--> statement-breakpoint
CREATE INDEX "idx_influencers_primary_location" ON "influencers" USING btree ("primary_location");