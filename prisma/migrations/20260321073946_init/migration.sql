-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "servings" INTEGER,
    "prepTimeMinutes" INTEGER,
    "cookTimeMinutes" INTEGER,
    "ingredients" JSONB NOT NULL,
    "steps" JSONB NOT NULL,
    "sourceMarkdown" TEXT,
    "sourceFile" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_slug_key" ON "Recipe"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_sourceFile_key" ON "Recipe"("sourceFile");

-- CreateIndex
CREATE INDEX "Recipe_title_idx" ON "Recipe"("title");

-- CreateIndex
CREATE INDEX "Recipe_updatedAt_idx" ON "Recipe"("updatedAt");
