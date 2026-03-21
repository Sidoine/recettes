import "dotenv/config";
import type { Recipe } from "@prisma/client";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  clearAuthCookie,
  createToken,
  requireAdmin,
  setAuthCookie,
  verifyToken,
} from "./auth.js";
import { prisma } from "./db.js";
import { seedRecipesIfEmpty } from "./lib/recipe-import.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistDirectory = path.resolve(__dirname, "../../dist");
const clientIndexFile = path.join(clientDistDirectory, "index.html");

const app = express();
const port = Number(process.env.PORT || 4000);

const recipePayload = z.object({
  title: z.string().trim().min(1).max(140),
  summary: z.string().trim().max(500).nullable().optional(),
  servings: z.number().int().positive().max(50).nullable().optional(),
  prepTimeMinutes: z.number().int().min(0).max(1440).nullable().optional(),
  cookTimeMinutes: z.number().int().min(0).max(1440).nullable().optional(),
  ingredients: z.array(z.string().trim().min(1).max(300)).min(1),
  steps: z.array(z.string().trim().min(1).max(1000)).min(1),
});

type RecipeDto = Omit<Recipe, "ingredients" | "steps"> & {
  ingredients: string[];
  steps: string[];
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function toRecipeDto(recipe: Recipe): RecipeDto {
  return {
    ...recipe,
    ingredients: asStringArray(recipe.ingredients),
    steps: asStringArray(recipe.steps),
  };
}

function slugifyValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function buildUniqueSlug(
  title: string,
  recipeId?: string,
): Promise<string> {
  const baseSlug = slugifyValue(title) || "recette";
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const existingRecipe = await prisma.recipe.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existingRecipe || existingRecipe.id === recipeId) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// ─── Auth routes ────────────────────────────────────────────────────────────

const authCredentials = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

// Whether any user exists (used by frontend to show login vs. register)
app.get("/api/auth/status", async (_request, response, next) => {
  try {
    const count = await prisma.user.count();
    response.json({ hasUsers: count > 0 });
  } catch (error) {
    next(error);
  }
});

// Register — only allowed when no user exists yet; that user becomes ADMIN
app.post("/api/auth/register", async (request, response, next) => {
  try {
    const { email, password } = authCredentials.parse(request.body);

    const existingCount = await prisma.user.count();
    if (existingCount > 0) {
      response.status(403).json({ message: "L'inscription est fermée." });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      response.status(409).json({ message: "Cet e-mail est déjà utilisé." });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashed, role: "ADMIN" },
      select: { id: true, email: true, role: true },
    });

    setAuthCookie(response, createToken({ userId: user.id, role: user.role }));
    response.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

// Login
app.post("/api/auth/login", async (request, response, next) => {
  try {
    const { email, password } = authCredentials.parse(request.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      response
        .status(401)
        .json({ message: "E-mail ou mot de passe incorrect." });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      response
        .status(401)
        .json({ message: "E-mail ou mot de passe incorrect." });
      return;
    }

    setAuthCookie(response, createToken({ userId: user.id, role: user.role }));
    response.json({ id: user.id, email: user.email, role: user.role });
  } catch (error) {
    next(error);
  }
});

// Logout
app.post("/api/auth/logout", (request, response) => {
  clearAuthCookie(response);
  response.json({ ok: true });
});

// Me — returns current user from cookie
app.get("/api/auth/me", async (request, response, next) => {
  try {
    const token = (request.cookies as Record<string, string | undefined>)?.[
      "recettes_token"
    ];
    if (!token) {
      response.status(401).json({ message: "Non connecté." });
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      response.status(401).json({ message: "Session invalide." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true },
    });
    if (!user) {
      response.status(401).json({ message: "Utilisateur introuvable." });
      return;
    }

    response.json(user);
  } catch (error) {
    next(error);
  }
});

// ─── Recipe routes ───────────────────────────────────────────────────────────

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/api/recipes", async (request, response, next) => {
  try {
    const startTime = Date.now();
    const search =
      typeof request.query.search === "string"
        ? request.query.search.trim()
        : "";
    const recipes = await prisma.recipe.findMany({
      where: search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { summary: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { title: "asc" },
    });
    const duration = Date.now() - startTime;

    if (duration > 100) {
      console.log(
        `[PERF] GET /api/recipes took ${duration}ms (search: "${search}", results: ${recipes.length})`,
      );
    }

    response.json(recipes.map(toRecipeDto));
  } catch (error) {
    next(error);
  }
});

app.get("/api/recipes/:id", async (request, response, next) => {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: request.params.id },
    });

    if (!recipe) {
      response.status(404).json({ message: "Recette introuvable." });
      return;
    }

    response.json(toRecipeDto(recipe));
  } catch (error) {
    next(error);
  }
});

app.get("/api/recipes/slug/:slug", async (request, response, next) => {
  try {
    const startTime = Date.now();
    const recipe = await prisma.recipe.findUnique({
      where: { slug: request.params.slug },
    });
    const duration = Date.now() - startTime;

    if (duration > 100) {
      console.log(
        `[PERF] GET /api/recipes/slug/:slug took ${duration}ms (slug: ${request.params.slug})`,
      );
    }

    if (!recipe) {
      response.status(404).json({ message: "Recette introuvable." });
      return;
    }

    response.json(toRecipeDto(recipe));
  } catch (error) {
    next(error);
  }
});

app.post("/api/recipes", requireAdmin, async (request, response, next) => {
  try {
    const payload = recipePayload.parse(request.body);
    const recipe = await prisma.recipe.create({
      data: {
        ...payload,
        slug: await buildUniqueSlug(payload.title),
        summary: payload.summary || null,
      },
    });

    response.status(201).json(toRecipeDto(recipe));
  } catch (error) {
    next(error);
  }
});

app.put("/api/recipes/:id", requireAdmin, async (request, response, next) => {
  try {
    const payload = recipePayload.parse(request.body);
    const recipeId = request.params.id as string;
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!existingRecipe) {
      response.status(404).json({ message: "Recette introuvable." });
      return;
    }

    const recipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        ...payload,
        slug: await buildUniqueSlug(payload.title, existingRecipe.id),
        summary: payload.summary || null,
      },
    });

    response.json(toRecipeDto(recipe));
  } catch (error) {
    next(error);
  }
});

if (existsSync(clientIndexFile)) {
  app.use(express.static(clientDistDirectory));

  app.get(/^\/(?!api).*/, (_request, response) => {
    response.sendFile(clientIndexFile);
  });
}

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    if (error instanceof z.ZodError) {
      response.status(400).json({
        message: "Le formulaire contient des valeurs invalides.",
        issues: error.issues,
      });
      return;
    }

    console.error(error);
    response.status(500).json({ message: "Erreur interne du serveur." });
  },
);

async function startServer(): Promise<void> {
  await prisma.$connect();
  const importedCount = await seedRecipesIfEmpty(prisma);

  if (importedCount > 0) {
    console.log(`Imported ${importedCount} recipes from Markdown.`);
  }

  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

startServer().catch(async (error) => {
  console.error("Unable to start the API.", error);
  await prisma.$disconnect();
  process.exit(1);
});
