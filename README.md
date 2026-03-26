# Recettes

Application full-stack pour enregistrer et consulter des recettes de cuisine.

## Stack

- Frontend: React + Vite + TypeScript
- Backend: Express + TypeScript
- Base de donnees: PostgreSQL via Prisma

## Demarrage

1. Copier `.env.example` vers `.env` et ajuster `DATABASE_URL`.
2. Installer les dependances avec `yarn install`.
3. Generer la migration initiale avec `yarn prisma:migrate --name init`.
4. Lancer l'application avec `yarn dev`.

L'API demarre sur `http://localhost:4000` et le frontend sur `http://localhost:5173`.

## Import du contenu existant

Au premier demarrage du serveur, si la table `Recipe` est vide, les fichiers Markdown du dossier `docs/` sont importes automatiquement.

Vous pouvez aussi relancer l'import manuellement avec `yarn db:seed`.

## Scripts utiles

- `yarn dev`: demarre le frontend et l'API en mode developpement
- `yarn build`: construit le serveur TypeScript et le frontend Vite
- `yarn prisma:generate`: regenere le client Prisma
- `yarn prisma:migrate --name init`: cree et applique une migration locale
- `yarn db:studio`: ouvre Prisma Studio
