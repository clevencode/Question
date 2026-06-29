// auth-config.js — Identifiants professeur (modifier le hash pour changer le mot de passe)

const ProfessorAuthConfig = {
  // Mot de passe par défaut : techno-ia
  // Générer un nouveau hash : node -e "console.log(require('crypto').createHash('sha256').update('VOTRE_MDP').digest('hex'))"
  passwordHash: '0e509de07ba3b5167acd4b97ff1cbd8a27ecd85525b04ff4537e4d1b50bc2e21',
  sessionKey: 'techIaProfessorAuth',
  sessionToken: 'authenticated'
};