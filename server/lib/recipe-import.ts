import type { PrismaClient } from "@prisma/client";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const docsDirectory = path.resolve(__dirname, "../../docs");

export type ImportedRecipe = {
  title: string;
  slug: string;
  summary: string | null;
  ingredients: string[];
  steps: string[];
  sourceMarkdown: string;
  sourceFile: string;
};

function cleanText(value: string): string {
  return value.replace(/\r/g, "").trim();
}

function normalizeForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slugifyValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createSlug(value: string): string {
  return slugifyValue(value) || "recette";
}

function findSummary(lines: string[]): string | null {
  for (const rawLine of lines) {
    const line = cleanText(rawLine).replace(/^>\s*/, "");
    if (
      !line ||
      line.startsWith("#") ||
      /^[-*+]\s+/.test(line) ||
      /^\d+[.)]\s+/.test(line)
    ) {
      continue;
    }
    return line;
  }
  return null;
}

export function parseMarkdownRecipe(
  filename: string,
  sourceMarkdown: string,
): ImportedRecipe {
  const lines = sourceMarkdown.split("\n");
  const titleMatch = sourceMarkdown.match(/^#\s+(.+)$/m);
  const title =
    titleMatch?.[1]?.trim() || path.basename(filename, path.extname(filename));
  const summary = findSummary(lines);
  const bodyLines = lines.slice(
    titleMatch ? lines.findIndex((line) => /^#\s+/.test(line)) + 1 : 0,
  );

  const ingredients: string[] = [];
  const steps: string[] = [];
  const fallbackLines: Array<{ kind: "text" | "bullet"; value: string }> = [];
  let section: "ingredients" | "steps" | "other" | null = null;
  let usesSections = false;

  for (const rawLine of bodyLines) {
    const line = cleanText(rawLine);

    if (!line) {
      continue;
    }

    if (/^##\s+/.test(line)) {
      const normalizedHeading = normalizeForMatch(line);

      if (/ingredients?/.test(normalizedHeading)) {
        section = "ingredients";
        usesSections = true;
        continue;
      }

      if (
        /(recette|preparation|preparations|etapes|instructions)/.test(
          normalizedHeading,
        )
      ) {
        section = "steps";
        usesSections = true;
        continue;
      }

      section = "other";
      continue;
    }

    const subsection = line.match(/^###\s+(.+)$/);
    if (subsection && (section === "ingredients" || section === "steps")) {
      const label = `${subsection[1].trim()} :`;
      if (section === "ingredients") {
        ingredients.push(label);
      } else {
        steps.push(label);
      }
      continue;
    }

    const bullet =
      line.match(/^[-*+]\s+(.+)$/) ?? line.match(/^\d+[.)]\s+(.+)$/);
    const value = bullet ? bullet[1].trim() : line;

    if (section === "ingredients") {
      ingredients.push(value);
      continue;
    }

    if (section === "steps") {
      steps.push(value);
      continue;
    }

    fallbackLines.push({ kind: bullet ? "bullet" : "text", value });
  }

  if (!usesSections) {
    let reachedPreparation = false;
    for (const line of fallbackLines) {
      if (line.kind === "bullet") {
        reachedPreparation = true;
        steps.push(line.value);
        continue;
      }

      if (reachedPreparation) {
        steps.push(line.value);
      } else {
        ingredients.push(line.value);
      }
    }
  }

  return {
    title,
    slug: createSlug(path.basename(filename, path.extname(filename))),
    summary,
    ingredients,
    steps,
    sourceMarkdown,
    sourceFile: filename,
  };
}

export async function readRecipesFromMarkdown(): Promise<ImportedRecipe[]> {
  const entries = await readdir(docsDirectory, { withFileTypes: true });
  const recipes: ImportedRecipe[] = [];

  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }

    if (entry.name === "README.md" || entry.name === "_sidebar.md") {
      continue;
    }

    const fullPath = path.join(docsDirectory, entry.name);
    const sourceMarkdown = await readFile(fullPath, "utf8");
    recipes.push(parseMarkdownRecipe(entry.name, sourceMarkdown));
  }

  return recipes;
}

export async function importRecipesFromMarkdown(
  prisma: PrismaClient,
): Promise<number> {
  const recipes = await readRecipesFromMarkdown();

  for (const recipe of recipes) {
    await prisma.recipe.upsert({
      where: { slug: recipe.slug },
      update: {
        title: recipe.title,
        summary: recipe.summary,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        sourceMarkdown: recipe.sourceMarkdown,
        sourceFile: recipe.sourceFile,
      },
      create: {
        title: recipe.title,
        slug: recipe.slug,
        summary: recipe.summary,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        sourceMarkdown: recipe.sourceMarkdown,
        sourceFile: recipe.sourceFile,
      },
    });
  }

  return recipes.length;
}

export async function seedRecipesIfEmpty(
  prisma: PrismaClient,
): Promise<number> {
  const existingRecipes = await prisma.recipe.count();

  if (existingRecipes > 0) {
    return 0;
  }

  return importRecipesFromMarkdown(prisma);
}
