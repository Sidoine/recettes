---
name: ajout-recette
description: Ajoute une recette dans l'application Recettes, dont les recettes sont stockées dans PostgreSQL. À utiliser lorsqu'on demande d'ajouter ou d'enregistrer une recette dans ce projet.
---

# Ajouter une recette

## Source de vérité

Les recettes sont stockées dans PostgreSQL. Ne pas créer de fichiers Markdown et ne pas utiliser de seed ou d'import de fichiers.

## Ajouter une recette

1. Vérifier si une recette équivalente existe déjà dans l'application ou dans la base avant toute écriture. Éviter les doublons par slug.
2. Préparer un titre français clair, un slug unique en minuscules sans accents, un résumé facultatif, le nombre de portions, les temps de préparation et de cuisson si connus, les ingrédients et les étapes.
3. Donner des quantités cohérentes et écrire les étapes dans l'ordre, avec températures et durées explicites lorsqu'elles sont utiles. Ne pas inventer de source ou d'attribution.
4. Si une session administrateur est disponible, privilégier le formulaire « Ajouter une recette » de l'application, qui écrit dans PostgreSQL via l'API.
5. Pour une intervention directe sur la base, utiliser SSH vers `ubuntu@sidoine.net`, puis la connexion Dokku `dokku postgres:connect recettes`. Cette méthode est autorisée pour ce projet. Ne jamais afficher, copier ou demander les variables de connexion ou les mots de passe.
6. La table s'appelle `Recipe`. Les champs requis sont `id`, `title`, `slug`, `ingredients` et `steps`; les ingrédients et étapes sont des tableaux JSONB. `createdAt` a une valeur par défaut, mais `updatedAt` doit être fourni. Générer un identifiant unique et renseigner les temps et portions connus. Ne pas modifier les colonnes historiques `sourceMarkdown` et `sourceFile` pour une nouvelle recette.
7. Faire une insertion ponctuelle et ciblée, puis relire la recette par son slug via l'API de l'application. Confirmer le titre et le nombre total de recettes. Ne pas lancer de seed ni écraser une recette existante.
