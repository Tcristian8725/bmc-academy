CREATE TABLE "answers" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"text" text NOT NULL,
	"correct" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"region" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"training_id" text NOT NULL,
	"exam_attempt_id" text,
	"code" text NOT NULL,
	"workload_hours" double precision,
	"score_percent" double precision,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"pdf_path" text,
	CONSTRAINT "certificates_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "equipment_families" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_models" (
	"id" text PRIMARY KEY NOT NULL,
	"family_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"user_id" text NOT NULL,
	"attempt_number" integer NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"score_percent" double precision,
	"passed" boolean,
	"answers_json" text
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" text PRIMARY KEY NOT NULL,
	"training_id" text NOT NULL,
	"title" text NOT NULL,
	"min_score_percent" double precision DEFAULT 70 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"time_limit_minutes" integer,
	"shuffle_questions" boolean DEFAULT true NOT NULL,
	"shuffle_answers" boolean DEFAULT true NOT NULL,
	"show_answers_after" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_path_courses" (
	"id" text PRIMARY KEY NOT NULL,
	"learning_path_id" text NOT NULL,
	"training_id" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"requires_previous_completed" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_paths" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" text PRIMARY KEY NOT NULL,
	"training_id" text NOT NULL,
	"title" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"type" text NOT NULL,
	"url" text,
	"content" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"to_email" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"status" text NOT NULL,
	"error" text,
	"related_training_id" text,
	"related_user_id" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"training_id" text NOT NULL,
	"status" text DEFAULT 'NAO_INICIADO' NOT NULL,
	"started_at" timestamp with time zone,
	"last_access_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"percent_complete" double precision DEFAULT 0 NOT NULL,
	"last_lesson_id" text,
	"time_spent_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"type" text NOT NULL,
	"statement" text NOT NULL,
	"image_url" text,
	"explanation" text,
	"points" double precision DEFAULT 1 NOT NULL,
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"training_id" text NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_by" text
);
--> statement-breakpoint
CREATE TABLE "trainings" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"target_audience" text,
	"equipment_model_id" text,
	"workload_hours" double precision,
	"instructor" text,
	"published_at" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trainings_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"registration_number" text,
	"phone" text,
	"whatsapp" text,
	"position" text,
	"department" text,
	"branch_id" text,
	"manager_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_training_id_trainings_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_exam_attempt_id_exam_attempts_id_fk" FOREIGN KEY ("exam_attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_models" ADD CONSTRAINT "equipment_models_family_id_equipment_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."equipment_families"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_training_id_trainings_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_courses" ADD CONSTRAINT "learning_path_courses_learning_path_id_learning_paths_id_fk" FOREIGN KEY ("learning_path_id") REFERENCES "public"."learning_paths"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_courses" ADD CONSTRAINT "learning_path_courses_training_id_trainings_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_training_id_trainings_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress" ADD CONSTRAINT "progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress" ADD CONSTRAINT "progress_training_id_trainings_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress" ADD CONSTRAINT "progress_last_lesson_id_lessons_id_fk" FOREIGN KEY ("last_lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_assignments" ADD CONSTRAINT "training_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_assignments" ADD CONSTRAINT "training_assignments_training_id_trainings_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_assignments" ADD CONSTRAINT "training_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_equipment_model_id_equipment_models_id_fk" FOREIGN KEY ("equipment_model_id") REFERENCES "public"."equipment_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;