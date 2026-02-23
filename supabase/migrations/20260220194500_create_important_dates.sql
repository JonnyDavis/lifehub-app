CREATE TABLE IF NOT EXISTS "public"."important_dates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "date" "date" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."important_dates" OWNER TO "postgres";

ALTER TABLE ONLY "public"."important_dates"
    ADD CONSTRAINT "important_dates_pkey" PRIMARY KEY ("id");

GRANT ALL ON TABLE "public"."important_dates" TO "anon";
GRANT ALL ON TABLE "public"."important_dates" TO "authenticated";
GRANT ALL ON TABLE "public"."important_dates" TO "service_role";
