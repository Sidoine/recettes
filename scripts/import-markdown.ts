import "dotenv/config";
import { prisma } from "../server/db.js";
import { importRecipesFromMarkdown } from "../server/lib/recipe-import.js";

async function main(): Promise<void> {
  await prisma.$connect();
  const count = await importRecipesFromMarkdown(prisma);
  console.log(`Imported ${count} recipes.`);
}

main()
  .catch((error) => {
    console.error("Import failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });