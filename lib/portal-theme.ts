export const themeStorageKey = 'fita-portal-theme';

export const themeBootstrap = `(() => {
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const apply = () => {
    let preference;
    try { preference = localStorage.getItem('${themeStorageKey}'); } catch {}
    const dark = preference === 'night' || (preference === 'auto' && system.matches);
    document.documentElement.dataset.portalTheme = dark ? 'night' : 'day';
  };
  apply();
  system.addEventListener('change', apply);
  window.addEventListener('storage', apply);
  window.addEventListener('fita-theme-change', apply);
})();`;
