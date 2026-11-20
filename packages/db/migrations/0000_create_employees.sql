CREATE TABLE "employees" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "employees_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"full_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"country" char(2) NOT NULL,
	"currency" char(3) NOT NULL,
	"department" varchar(50) NOT NULL,
	"job_title" varchar(80) NOT NULL,
	"annual_salary" integer NOT NULL,
	"hire_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employees_email_unique" UNIQUE("email"),
	CONSTRAINT "employees_annual_salary_positive" CHECK ("employees"."annual_salary" > 0)
);
--> statement-breakpoint
CREATE INDEX "employees_country_job_title_idx" ON "employees" USING btree ("country","job_title");--> statement-breakpoint
CREATE INDEX "employees_country_department_idx" ON "employees" USING btree ("country","department");--> statement-breakpoint
CREATE INDEX "employees_department_idx" ON "employees" USING btree ("department");--> statement-breakpoint
CREATE INDEX "employees_job_title_idx" ON "employees" USING btree ("job_title");