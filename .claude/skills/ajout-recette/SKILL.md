---
name: ajout-recette
description: Ajoute une recette de cuisine au dépôt recettes en créant sa page Markdown et en la reliant à la navigation de docs. À utiliser lorsqu'on demande d'ajouter ou d'enregistrer une recette dans ce projet.
---

# Ajouter une recette

## Procédure

1. Choisir un titre français clair et créer un slug ASCII en minuscules, sans accents, avec des mots séparés par des tirets (par exemple `endives-au-jambon`).
2. Créer `docs/<slug>.md` en reprenant le format des recettes existantes :

   ```markdown
   # Titre de la recette

   ## Ingrédients (pour N personnes)

   * Quantité et ingrédient

   ## Recette

   * Étape de préparation
   * Étape de cuisson
   ```

3. Donner des quantités cohérentes et préciser le nombre de personnes quand il est connu. Écrire les étapes dans l'ordre, avec températures et durées explicites lorsqu'elles sont utiles. Ne pas inventer de source ou d'attribution.
4. Ajouter un lien vers la nouvelle page dans `docs/_sidebar.md`, en respectant le format `* [Titre](slug.md)` et l'organisation existante.
5. Vérifier que le nom du fichier correspond au lien et que le Markdown possède bien un titre, une section ingrédients et une section recette. Les fichiers Markdown de `docs/` sont importés automatiquement par l'application : ne pas modifier la base de données ni lancer de seed pour une simple modification de fichier.
