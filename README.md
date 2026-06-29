# Technologie & IA — Quiz Vrai/Faux

Quiz éducatif sur la technologie, les données, l'information et l'intelligence artificielle.

## Structure

```
quiz-technologie-ia/
├── css/style.css
├── js/
│   ├── data.js      — contenu et questions
│   ├── quiz.js      — logique du quiz
│   ├── results.js   — note et corrigé
│   └── main.js      — navigation
├── desempenho-institucional/   — dashboard prof (même site)
│   ├── index.html
│   ├── css/style.css
│   └── js/
├── imagem/
├── index.html
├── manifest.json
└── robots.txt
```

## Dashboard institutionnel

- **Quiz (élève):** `/`
- **Desempenho (professeur):** `/desempenho-institucional/`

Les deux partagent les résultats via `localStorage` sur le même appareil/navigateur.

## Lancer localement

```bash
npx serve .
```

Ou ouvrir `index.html` directement dans le navigateur.

## Fonctionnalités

- Écran d'accueil avec le contenu éducatif
- Saisie du nom de l'étudiant
- 8 questions Vrai/Faux
- Note finale avec corrigé explicatif