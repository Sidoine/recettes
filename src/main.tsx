import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./AuthContext";
import EditRecipePage from "./EditRecipePage";
import LoginPage from "./LoginPage";
import NewRecipePage from "./NewRecipePage";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/ajouter-recette" element={<NewRecipePage />} />
          <Route path="/recettes/:slug" element={<App />} />
          <Route path="/recettes/:slug/modifier" element={<EditRecipePage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
