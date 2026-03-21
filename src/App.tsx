import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchRecipeBySlug, fetchRecipes } from "./api";
import { useAuth } from "./AuthContext";
import type { Recipe } from "./types";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function App() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [displayedServings, setDisplayedServings] = useState<number | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const deferredSearch = useDeferredValue(search);

  // Fonction pour adapter les quantités d'ingrédients en fonction des portions
  function scaleIngredient(ingredient: string, ratio: number): string {
    if (ratio === 1) return ingredient;

    // Cherche un nombre au début (entier ou décimal)
    const match = ingredient.match(/^([\d.,]+)\s*(.*)$/);
    if (!match) return ingredient;

    const [, quantityStr, rest] = match;
    const quantity = parseFloat(quantityStr.replace(",", "."));

    if (isNaN(quantity)) return ingredient;

    const scaledQuantity = quantity * ratio;
    const formatted =
      scaledQuantity % 1 === 0
        ? Math.round(scaledQuantity).toString()
        : scaledQuantity.toFixed(1).replace(".", ",");

    return `${formatted} ${rest}`;
  }

  useEffect(() => {
    let cancelled = false;

    async function loadRecipes() {
      setLoadingList(true);
      setErrorMessage(null);

      try {
        const nextRecipes = await fetchRecipes(deferredSearch);
        if (cancelled) {
          return;
        }

        setRecipes(nextRecipes);

        if (!nextRecipes.length) {
          setSelectedRecipe(null);
          if (slug) {
            startTransition(() => {
              navigate("/", { replace: true });
            });
          }
          return;
        }

        const matchingRecipe = slug
          ? nextRecipes.find((recipe) => recipe.slug === slug)
          : null;

        if (!matchingRecipe) {
          startTransition(() => {
            navigate(`/recettes/${nextRecipes[0].slug}`, { replace: true });
          });
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "Chargement impossible.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingList(false);
        }
      }
    }

    void loadRecipes();

    return () => {
      cancelled = true;
    };
  }, [deferredSearch, navigate, slug]);

  useEffect(() => {
    if (!slug) {
      setSelectedRecipe(null);
      setDisplayedServings(null);
      return;
    }

    let cancelled = false;

    async function loadRecipe() {
      setLoadingRecipe(true);
      setErrorMessage(null);

      try {
        const recipe = await fetchRecipeBySlug(slug);
        if (!cancelled) {
          setSelectedRecipe(recipe);
          setDisplayedServings(recipe.servings ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "Chargement impossible.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingRecipe(false);
        }
      }
    }

    void loadRecipe();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <>
      <button
        className={`drawer-toggle-fixed ${drawerOpen ? "open" : ""}`}
        onClick={() => setDrawerOpen(!drawerOpen)}
        aria-label="Ouvrir le menu"
      >
        ☰
      </button>
      <div className="shell">
        <header className="hero">
          <div>
            <p className="eyebrow">Cuisine familiale</p>
          </div>
        </header>

        {errorMessage && (
          <div className="notice notice-error">{errorMessage}</div>
        )}

        <div
          className={`drawer-overlay ${drawerOpen ? "open" : ""}`}
          onClick={() => setDrawerOpen(false)}
        />

        <main className="layout">
          <section
            className={`panel list-panel drawer ${drawerOpen ? "open" : ""}`}
          >
            <div className="panel-header">
              <div className="drawer-header">
                <h2>Consulter</h2>
                <button
                  className="drawer-close"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Fermer le menu"
                >
                  ✕
                </button>
              </div>
              {isAdmin && (
                <Link
                  className="action-link action-link-compact"
                  to="/ajouter-recette"
                >
                  + Ajouter une recette
                </Link>
              )}
              <Link className="account-link" to="/connexion">
                {user ? `👤 ${user.email}` : "Se connecter"}
              </Link>
              <input
                className="search-input"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Chercher une recette"
              />
            </div>

            <div className="recipe-list" aria-busy={loadingList}>
              {loadingList && <p className="muted">Chargement de la liste…</p>}
              {!loadingList && !recipes.length && (
                <p className="muted">Aucune recette trouvée.</p>
              )}
              {recipes.map((recipe) => (
                <Link
                  key={recipe.id}
                  className={`recipe-list-item ${recipe.slug === slug ? "active" : ""}`}
                  to={`/recettes/${recipe.slug}`}
                >
                  <strong>{recipe.title}</strong>
                  <span>
                    {recipe.summary ||
                      `${recipe.ingredients.length} ingrédients`}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="panel detail-panel">
            <div className="panel-header">
              <h2>Détail</h2>
              {isAdmin && selectedRecipe && (
                <Link
                  className="action-link action-link-compact"
                  to={`/recettes/${selectedRecipe.slug}/modifier`}
                >
                  Modifier
                </Link>
              )}
            </div>
            {selectedRecipe && (
              <p className="timestamp" style={{ marginBottom: "16px" }}>
                Mis à jour le {formatDate(selectedRecipe.updatedAt)}
              </p>
            )}

            {loadingRecipe && (
              <p className="muted">Chargement de la recette…</p>
            )}

            {!loadingRecipe && !selectedRecipe && (
              <p className="muted">
                Sélectionnez une recette pour la consulter.
              </p>
            )}

            {!loadingRecipe && selectedRecipe && (
              <article className="recipe-card">
                <div className="recipe-heading">
                  <div>
                    <p className="eyebrow">{selectedRecipe.slug}</p>
                    <h3>{selectedRecipe.title}</h3>
                    {selectedRecipe.summary && (
                      <p className="summary">{selectedRecipe.summary}</p>
                    )}
                  </div>
                  <div className="meta-grid">
                    <div>
                      <span>Portions</span>
                      {selectedRecipe.servings ? (
                        <div className="portions-control">
                          <input
                            type="number"
                            min="1"
                            value={displayedServings ?? selectedRecipe.servings}
                            onChange={(event) =>
                              setDisplayedServings(
                                event.target.value
                                  ? Number(event.target.value)
                                  : null,
                              )
                            }
                          />
                          {displayedServings !== selectedRecipe.servings && (
                            <button
                              className="reset-portions"
                              onClick={() =>
                                setDisplayedServings(selectedRecipe.servings)
                              }
                              title="Réinitialiser aux portions originales"
                            >
                              ↺
                            </button>
                          )}
                        </div>
                      ) : (
                        <strong>-</strong>
                      )}
                    </div>
                    <div>
                      <span>Préparation</span>
                      <strong>
                        {selectedRecipe.prepTimeMinutes
                          ? `${selectedRecipe.prepTimeMinutes} min`
                          : "-"}
                      </strong>
                    </div>
                    <div>
                      <span>Cuisson</span>
                      <strong>
                        {selectedRecipe.cookTimeMinutes
                          ? `${selectedRecipe.cookTimeMinutes} min`
                          : "-"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="recipe-columns">
                  <section>
                    <h4>Ingrédients</h4>
                    <ul>
                      {selectedRecipe.ingredients.map((ingredient, index) => {
                        const ratio =
                          displayedServings && selectedRecipe.servings
                            ? displayedServings / selectedRecipe.servings
                            : 1;
                        return (
                          <li key={`${selectedRecipe.id}-ingredient-${index}`}>
                            {scaleIngredient(ingredient, ratio)}
                          </li>
                        );
                      })}
                    </ul>
                  </section>

                  <section>
                    <h4>Étapes</h4>
                    <ol>
                      {selectedRecipe.steps.map((step, index) => (
                        <li key={`${selectedRecipe.id}-step-${index}`}>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </section>
                </div>
              </article>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
