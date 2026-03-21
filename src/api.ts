import type { Recipe, RecipeInput, User } from "./types";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(payload?.message || "La requête a échoué.");
  }

  return response.json() as Promise<T>;
}

export async function fetchMe(): Promise<User> {
  const response = await fetch("/api/auth/me");
  return handleResponse<User>(response);
}

export async function login(email: string, password: string): Promise<User> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<User>(response);
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function register(email: string, password: string): Promise<User> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<User>(response);
}

export async function fetchRecipes(search: string): Promise<Recipe[]> {
  const url = new URL("/api/recipes", window.location.origin);
  if (search.trim()) {
    url.searchParams.set("search", search.trim());
  }

  const response = await fetch(url);
  return handleResponse<Recipe[]>(response);
}

export async function fetchRecipe(id: string): Promise<Recipe> {
  const response = await fetch(`/api/recipes/${id}`);
  return handleResponse<Recipe>(response);
}

export async function fetchRecipeBySlug(slug: string): Promise<Recipe> {
  const response = await fetch(`/api/recipes/slug/${encodeURIComponent(slug)}`);
  return handleResponse<Recipe>(response);
}

export async function createRecipe(input: RecipeInput): Promise<Recipe> {
  const response = await fetch("/api/recipes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return handleResponse<Recipe>(response);
}

export async function updateRecipe(
  id: string,
  input: RecipeInput,
): Promise<Recipe> {
  const response = await fetch(`/api/recipes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return handleResponse<Recipe>(response);
}
