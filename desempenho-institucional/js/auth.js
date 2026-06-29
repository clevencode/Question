// auth.js — Authentification basique (session navigateur)

const ProfessorAuth = {
  async hashPassword(password) {
    const data = new TextEncoder().encode(password);
    const buffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buffer))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  },

  isAuthenticated() {
    try {
      return sessionStorage.getItem(ProfessorAuthConfig.sessionKey) === ProfessorAuthConfig.sessionToken
        && !!sessionStorage.getItem(ProfessorAuthConfig.passwordKey);
    } catch {
      return false;
    }
  },

  login(password) {
    sessionStorage.setItem(ProfessorAuthConfig.sessionKey, ProfessorAuthConfig.sessionToken);
    if (password) {
      sessionStorage.setItem(ProfessorAuthConfig.passwordKey, password);
    }
  },

  logout() {
    sessionStorage.removeItem(ProfessorAuthConfig.sessionKey);
    sessionStorage.removeItem(ProfessorAuthConfig.passwordKey);
  },

  showApp() {
    document.getElementById('auth-gate')?.classList.add('hidden');
    document.getElementById('app')?.classList.remove('hidden');
    window.initProfessorDashboard?.();
  },

  showLogin() {
    document.getElementById('auth-gate')?.classList.remove('hidden');
    document.getElementById('app')?.classList.add('hidden');
  },

  async verifyPassword(password) {
    const hash = await this.hashPassword(password);
    return hash === ProfessorAuthConfig.passwordHash;
  },

  init() {
    const form = document.getElementById('auth-form');
    const input = document.getElementById('auth-password');
    const error = document.getElementById('auth-error');
    const logoutBtn = document.getElementById('btn-logout');

    if (this.isAuthenticated()) {
      this.showApp();
    } else {
      this.showLogin();
      input?.focus();
    }

    form?.addEventListener('submit', async e => {
      e.preventDefault();
      error?.classList.add('hidden');

      const password = input?.value.trim() ?? '';
      if (!password) return;

      const valid = await this.verifyPassword(password);
      if (!valid) {
        error?.classList.remove('hidden');
        input?.select();
        return;
      }

      this.login(password);
      if (input) input.value = '';
      this.showApp();
    });

    logoutBtn?.addEventListener('click', () => {
      this.logout();
      this.showLogin();
      input?.focus();
    });
  }
};

document.addEventListener('DOMContentLoaded', () => ProfessorAuth.init());