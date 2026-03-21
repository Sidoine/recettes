import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, logout, register } from "./api";
import { useAuth } from "./AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasUsers, setHasUsers] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((data: { hasUsers: boolean }) => setHasUsers(data.hasUsers))
      .catch(() => setHasUsers(true));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const loggedUser = hasUsers
        ? await login(email, password)
        : await register(email, password);
      setUser(loggedUser);
      navigate("/");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erreur de connexion.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await logout();
    setUser(null);
  }

  if (hasUsers === null) return null;

  // Already logged in — show account info
  if (user) {
    return (
      <div className="shell single-column-shell">
        <header className="hero hero-compact">
          <div>
            <p className="eyebrow">Mon compte</p>
            <h1>Connecté</h1>
            <Link className="action-link action-link-secondary" to="/">
              Retour aux recettes
            </Link>
          </div>
        </header>

        <section className="panel form-page-panel">
          <p>
            Connecté en tant que <strong>{user.email}</strong> (
            {user.role === "ADMIN" ? "administrateur" : "utilisateur"})
          </p>
          <button
            className="submit-button"
            style={{ marginTop: "16px" }}
            onClick={handleLogout}
          >
            Se déconnecter
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="shell single-column-shell">
      <header className="hero hero-compact">
        <div>
          <p className="eyebrow">Cuisine familiale</p>
          <h1>{hasUsers ? "Connexion" : "Créer le compte admin"}</h1>
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
            <span>Adresse e-mail</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            <span>Mot de passe</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete={hasUsers ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="submit-button" type="submit" disabled={submitting}>
            {submitting
              ? "Chargement…"
              : hasUsers
                ? "Se connecter"
                : "Créer le compte admin"}
          </button>
        </form>
      </section>
    </div>
  );
}
