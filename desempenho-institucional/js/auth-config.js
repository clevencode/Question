// auth-config.js — Hash SHA-256 da senha do professor (não armazenar a senha em texto)
// Gerar novo hash: node -e "console.log(require('crypto').createHash('sha256').update('SUA_SENHA').digest('hex'))"

const ProfessorAuthConfig = {
  passwordHash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
  sessionKey: 'techIaProfessorAuth',
  sessionToken: 'authenticated'
};