-- CreateTable
CREATE TABLE "versions" (
    "id" SERIAL NOT NULL,
    "versionNumber" TEXT NOT NULL,
    "releaseDate" TEXT,
    "status" TEXT,
    "description" TEXT,

    CONSTRAINT "versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scripts" (
    "id" SERIAL NOT NULL,
    "version_id" INTEGER NOT NULL,
    "name" TEXT,
    "type" TEXT,
    "content" TEXT,
    "folder" TEXT,

    CONSTRAINT "scripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "build_docs" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "system" TEXT,
    "content" TEXT,
    "lastUpdated" TEXT,

    CONSTRAINT "build_docs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "useful_docs" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "lastUpdated" TEXT,

    CONSTRAINT "useful_docs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manuals" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "originalName" TEXT,
    "path" TEXT,
    "type" TEXT,
    "size" INTEGER,
    "uploadDate" TEXT,
    "parentId" TEXT,
    "isFolder" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "manuals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_plans" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "progress" INTEGER,

    CONSTRAINT "test_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cases" (
    "id" SERIAL NOT NULL,
    "test_plan_id" INTEGER NOT NULL,
    "title" TEXT,
    "preconditions" TEXT,
    "steps" TEXT,
    "expectedResult" TEXT,
    "status" TEXT,
    "estimatedTime" TEXT,
    "priority" TEXT,
    "assignedTo" TEXT,

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "profilePicture" TEXT,
    "role" TEXT DEFAULT 'Tester',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "changelog_systems" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "changelog_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "changelog_entries" (
    "id" SERIAL NOT NULL,
    "system_id" INTEGER NOT NULL,
    "version" TEXT NOT NULL,
    "date" TEXT,
    "type" TEXT,

    CONSTRAINT "changelog_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "changelog_items" (
    "id" SERIAL NOT NULL,
    "entry_id" INTEGER NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "type" TEXT,
    "category" TEXT,
    "image" TEXT,

    CONSTRAINT "changelog_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "username" TEXT,
    "action" TEXT,
    "module" TEXT,
    "resourceId" TEXT,
    "details" TEXT,
    "timestamp" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "url" TEXT NOT NULL,
    "status" TEXT DEFAULT 'PENDING',
    "last_checked" TEXT,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs" (
    "id" SERIAL NOT NULL,
    "site_id" INTEGER NOT NULL,
    "status" INTEGER,
    "response_time" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "scripts" ADD CONSTRAINT "scripts_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_test_plan_id_fkey" FOREIGN KEY ("test_plan_id") REFERENCES "test_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "changelog_entries" ADD CONSTRAINT "changelog_entries_system_id_fkey" FOREIGN KEY ("system_id") REFERENCES "changelog_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "changelog_items" ADD CONSTRAINT "changelog_items_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "changelog_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
