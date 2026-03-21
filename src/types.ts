export type User = {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
};

export type Recipe = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  servings: number | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  ingredients: string[];
  steps: string[];
  sourceMarkdown: string | null;
  sourceFile: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RecipeInput = {
  title: string;
  summary: string | null;
  servings: number | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  ingredients: string[];
  steps: string[];
};
