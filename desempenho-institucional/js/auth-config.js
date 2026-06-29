// auth-config.js — Identifiants professeur (modifier le hash pour changer le mot de passe)

const ProfessorAuthConfig = {
  // Mot de passe : 1234
  // Générer un nouveau hash : node -e "console.log(require('crypto').createHash('sha256').update('VOTRE_MDP').digest('hex'))"
  passwordHash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
  sessionKey: 'techIaProfessorAuth',
  sessionToken: 'authenticated'
};