/*
  Warnings:

  - You are about to alter the column `slug` on the `Recipe` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "Recipe" ALTER COLUMN "slug" SET DATA TYPE VARCHAR(255);

-- CreateIndex
CREATE INDEX "Recipe_slug_idx" ON "Recipe"("slug");
