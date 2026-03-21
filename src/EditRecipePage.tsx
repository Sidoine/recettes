import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchRecipeBySlug, updateRecipe } from "./api";
import { useAuth } from "./AuthContext";
import type { Recipe } from "./types";

type RecipeFormState = {
  title: string;
  summary: string;
  servings: string;
  prepTimeMinutes: string;
  cookTimeMinutes: string;
  ingredients: string;
  steps: string;
};

function toLineArray(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toTextArea(items: string[]): string {
  return items.join("\n");
}

function recipeToFormState(recipe: Recipe): RecipeFormState {
  return {
    title: recipe.title,
    summary: recipe.summary || "",
    servings: recipe.servings ? String(recipe.servings) : "",
    prepTimeMinutes: recipe.prepTimeMinutes
      ? String(recipe.prepTimeMinutes)
      : "",
    cookTimeMinutes: recipe.cookTimeMinutes
      ? String(recipe.cookTimeMinutes)
      : "",
    ingredients: toTextArea(recipe.ingredients),
    steps: toTextArea(recipe.steps),
  };
}

export default function EditRecipePage() {
  const navigate = useNavigate();
  const { slug = "" } = useParams<{ slug: string }>();
  const { user, authLoading } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState<RecipeFormState>({
    title: "",
    summary: "",
    servings: "",
    prepTimeMinutes: "",
    cookTimeMinutes: "",
    ingredients: "",
    steps: "",
  });

  useEffect(() => {
    if (!authLoading && user?.role !== "ADMIN") {
      navigate("/connexion", { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (authLoading || user?.role !== "ADMIN") return null;

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    async function loadRecipe() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const loadedRecipe = await fetchRecipeBySlug(slug);
        if (!cancelled) {
          setRecipe(loadedRecipe);
          setFormState(recipeToFormState(loadedRecipe));
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "Chargement impossible.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRecipe();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!recipe) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await updateRecipe(recipe.id, {
        title: formState.title.trim(),
        summary: formState.summary.trim() || null,
        servings: formState.servings ? Number(formState.servings) : null,
        prepTimeMinutes: formState.prepTimeMinutes
          ? Number(formState.prepTimeMinutes)
          : null,
        cookTimeMinutes: formState.cookTimeMinutes
          ? Number(formState.cookTimeMinutes)
          : null,
        ingredients: toLineArray(formState.ingredients),
        steps: toLineArray(formState.steps),
      });

      navigate(`/recettes/${slug}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Enregistrement impossible.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="shell single-column-shell">
        <header className="hero hero-compact">
          <div>
            <p className="eyebrow">Chargement…</p>
            <h1>Modification de recette</h1>
          </div>
        </header>
        <p className="muted" style={{ textAlign: "center", marginTop: "40px" }}>
          Chargement en cours…
        </p>
      </div>
    );
  }

  return (
    <div className="shell single-column-shell">
      <header className="hero hero-compact">
        <div>
          <p className="eyebrow">Modifier</p>
          <h1>{recipe?.title}</h1>
          <p className="hero-copy">
            Mettez à jour les informations de cette recette.
          </p>
          <Link
            className="action-link action-link-secondary"
            to={`/recettes/${slug}`}
          >
            Retour à la recette
          </Link>
        </div>
      </header>

      {errorMessage && (
        <div className="notice notice-error">{errorMessage}</div>
      )}

      <section className="panel form-page-panel">
        <form className="recipe-form" onSubmit={handleSubmit}>
          <label>
            <span>Titre</span>
            <input
              required
              value={formState.title}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>Résumé</span>
            <textarea
              rows={3}
              value={formState.summary}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  summary: event.target.value,
                }))
              }
            />
          </label>

          <div className="inline-fields">
            <label>
              <span>Portions</span>
              <input
                type="number"
                min="1"
                value={formState.servings}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    servings: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              <span>Préparation</span>
              <input
                type="number"
                min="0"
                value={formState.prepTimeMinutes}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    prepTimeMinutes: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              <span>Cuisson</span>
              <input
                type="number"
                min="0"
                value={formState.cookTimeMinutes}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    cookTimeMinutes: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <label>
            <span>Ingrédients, une ligne par élément</span>
            <textarea
              required
              rows={8}
              value={formState.ingredients}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  ingredients: event.target.value,
                }))
              }
            />
          </label>

          <label>
            <span>Étapes, une ligne par élément</span>
            <textarea
              required
              rows={8}
              value={formState.steps}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  steps: event.target.value,
                }))
              }
            />
          </label>

          <button className="submit-button" type="submit" disabled={submitting}>
            {submitting ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
        </form>
      </section>
    </div>
  );
}
