import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createRecipe } from "./api";
import { useAuth } from "./AuthContext";

type RecipeFormState = {
  title: string;
  summary: string;
  servings: string;
  prepTimeMinutes: string;
  cookTimeMinutes: string;
  ingredients: string;
  steps: string;
};

const initialFormState: RecipeFormState = {
  title: "",
  summary: "",
  servings: "",
  prepTimeMinutes: "",
  cookTimeMinutes: "",
  ingredients: "",
  steps: "",
};

function toLineArray(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function NewRecipePage() {
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState<RecipeFormState>(initialFormState);

  useEffect(() => {
    if (!authLoading && user?.role !== "ADMIN") {
      navigate("/connexion", { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (authLoading || user?.role !== "ADMIN") return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const createdRecipe = await createRecipe({
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

      navigate(`/recettes/${createdRecipe.slug}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Enregistrement impossible.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="shell single-column-shell">
      <header className="hero hero-compact">
        <div>
          <p className="eyebrow">Nouvelle recette</p>
          <h1>Ajouter une recette</h1>
          <p className="hero-copy">
            Créez une nouvelle recette puis consultez-la sur son URL dédiée.
          </p>
          <Link className="action-link action-link-secondary" to="/">
            Retour aux recettes
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
            {submitting ? "Enregistrement…" : "Ajouter la recette"}
          </button>
        </form>
      </section>
    </div>
  );
}
