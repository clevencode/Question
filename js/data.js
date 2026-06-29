// data.js — Contenu éducatif et questions Vrai/Faux

const SITE_CONFIG = {
  name: 'Technologie & IA',
  tagline: 'Données, Information, Connaissance',
  title: 'Technologie & IA • Quiz Vrai/Faux',
  description: 'Comprendre la technologie, les données, l\'information et l\'intelligence artificielle. Quiz de 8 questions avec corrigé explicatif.',
  themeColor: '#004BF3',
  questionCount: 8
};

let currentQuestionIndex = 0;
let answers = {};
let userName = '';

const INTRO_CONTENT = [
  {
    title: "Qu'est-ce que la technologie ?",
    body: "C'est l'application pratique de la science pour répondre aux besoins."
  },
  {
    title: 'Donnée',
    body: 'Un fait isolé et sans contexte, dépourvu de toute signification ou interprétation.'
  },
  {
    title: 'Information',
    body: 'Des données organisées et structurées qui possèdent une signification grâce au contexte.'
  },
  {
    title: 'Connaissance',
    body: "L'interprétation et la compréhension profonde de l'information."
  },
  {
    title: "Qu'est-ce que l'IA (Intelligence Artificielle) ?",
    body: "L'Intelligence Artificielle (IA) est la technologie qui permet aux machines d'imiter les capacités de l'intelligence humaine grâce aux mathématiques et aux sciences informatiques."
  },
  {
    title: 'Comment ça fonctionne ?',
    body: "Vous lui donnez tellement d'exemples de qualité sur comment faire le travail qu'elle finit par le faire sans votre intervention directe."
  },
  {
    title: "Comment l'utiliser à votre avantage ?",
    body: null,
    list: [
      { label: 'Recherche', text: "L'IA est excellente pour faire des recherches plus rapides, mais vérifiez toujours la fiabilité des réponses." },
      { label: 'Productivité', text: 'Créez des textes, des images, des vidéos, de la musique et des applications.' },
      { label: 'Créativité', text: 'Testez de nouvelles idées et expériences.' }
    ]
  },
  {
    title: "L'IA comme instrument de tromperie",
    body: null,
    list: [
      { label: 'Deepfakes', text: 'Informations fausses extrêmement réalistes qui peuvent être utilisées avec de mauvaises intentions.' }
    ]
  },
  {
    title: "L'être humain × IA",
    body: "Tout ce que l'IA fait est basé sur ce que l'être humain sait déjà. C'est pourquoi nous ne devons pas l'utiliser comme un substitut, mais comme un complément."
  }
];

const QUESTIONS = [
  {
    id: 1,
    text: "La technologie est l'application pratique de la science pour répondre aux besoins.",
    answer: true,
    explanation: "C'est l'application pratique de la science pour répondre aux besoins."
  },
  {
    id: 2,
    text: 'Les données sont des faits organisés avec un contexte qui leur donne du sens.',
    answer: false,
    explanation: "Donnée : un fait isolé et sans contexte, dépourvu de toute signification ou interprétation."
  },
  {
    id: 3,
    text: "L'information est une donnée isolée sans aucune signification.",
    answer: false,
    explanation: "Information : des données organisées et structurées qui possèdent une signification grâce au contexte."
  },
  {
    id: 4,
    text: "L'Intelligence Artificielle permet aux machines d'imiter l'intelligence humaine.",
    answer: true,
    explanation: "L'IA est la technologie qui permet aux machines d'imiter les capacités de l'intelligence humaine."
  },
  {
    id: 5,
    text: "L'IA fonctionne en recevant très peu d'exemples de qualité.",
    answer: false,
    explanation: "Il faut lui donner tellement d'exemples de qualité qu'elle finit par faire le travail sans intervention directe."
  },
  {
    id: 6,
    text: "L'IA est excellente pour la recherche, mais il faut toujours vérifier la fiabilité des réponses.",
    answer: true,
    explanation: "L'IA est excellente pour faire des recherches plus rapides, mais vérifiez toujours la fiabilité des réponses."
  },
  {
    id: 7,
    text: 'Les deepfakes sont des informations fausses extrêmement réalistes qui peuvent être utilisées avec de mauvaises intentions.',
    answer: true,
    explanation: "Deepfakes : informations fausses extrêmement réalistes qui peuvent être utilisées avec de mauvaises intentions."
  },
  {
    id: 8,
    text: "L'IA doit être utilisée comme un substitut complet à l'être humain.",
    answer: false,
    explanation: "Nous ne devons pas l'utiliser comme un substitut, mais comme un complément."
  }
];