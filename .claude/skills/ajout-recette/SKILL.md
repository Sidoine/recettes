---
name: ajout-recette
description: Ajoute une recette dans l'application Recettes, dont les recettes sont stockées dans PostgreSQL. À utiliser lorsqu'on demande d'ajouter ou d'enregistrer une recette dans ce projet.
---

# Ajouter une recette

## Stockage et procédure

Les recettes sont des enregistrements PostgreSQL gérés par l'application. Ne pas créer de fichiers Markdown et ne pas utiliser de seed ou d'import de fichiers pour ajouter une recette.

1. Utiliser le formulaire « Ajouter une recette » de l'application avec une session administrateur. Le formulaire écrit dans la base via l'API protégée.
2. Fournir un titre français clair, un résumé facultatif, le nombre de personnes, les temps de préparation et de cuisson si connus, les ingrédients et les étapes.
3. Donner des quantités cohérentes et écrire les étapes dans l'ordre, avec températures et durées explicites lorsqu'elles sont utiles. Ne pas inventer de source ou d'attribution.
4. Vérifier que la recette apparaît dans l'application après enregistrement. Si l'accès administrateur n'est pas disponible, demander à l'utilisateur de l'ajouter via l'application plutôt que de contourner l'authentification.
