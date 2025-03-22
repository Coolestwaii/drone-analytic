-- CreateTable
CREATE TABLE "shared_project" (
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "shared_project_pkey" PRIMARY KEY ("project_id","user_id")
);

-- AddForeignKey
ALTER TABLE "shared_project" ADD CONSTRAINT "shared_project_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_project" ADD CONSTRAINT "shared_project_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
