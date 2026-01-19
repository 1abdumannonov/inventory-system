(function () {
  const form = document.getElementById('login-form');
  const langSelect = document.getElementById('lang-select-login');
  const errorEl = document.getElementById('login-error');

  // Redirect if already authenticated
  const existingToken = localStorage.getItem('token');
  if (existingToken) {
    window.location.href = '/app.html';
  }

  // Initialize language
  langSelect.value = localStorage.getItem('lang') || 'EN';
  i18n.setLanguage(langSelect.value);
  i18n.translateDom();

  langSelect.addEventListener('change', (e) => {
    i18n.setLanguage(e.target.value);
    i18n.translateDom();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    const username = form.username.value.trim();
    const password = form.password.value;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        errorEl.textContent = err.message || i18n.t('toast_error');
        return;
      }
      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/app.html';
    } catch (err) {
      console.error(err);
      errorEl.textContent = i18n.t('network_error');
    }
  });
})();
