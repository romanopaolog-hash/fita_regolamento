'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { themeStorageKey } from '../../lib/portal-theme';

const themes = [
  { value: 'day', label: 'Giorno', Icon: Sun },
  { value: 'night', label: 'Notte', Icon: Moon },
  { value: 'auto', label: 'Automatica', Icon: Monitor },
] as const;
type Theme = (typeof themes)[number]['value'];

export default function ThemeSettings() {
  const [theme, setTheme] = useState<Theme>('day');

  useEffect(() => {
    const sync = () => {
      try {
        const saved = localStorage.getItem(themeStorageKey);
        setTheme(saved === 'night' || saved === 'auto' ? saved : 'day');
      } catch {}
    };
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const selectTheme = (value: Theme) => {
    setTheme(value);
    try {
      localStorage.setItem(themeStorageKey, value);
      window.dispatchEvent(new Event('fita-theme-change'));
    } catch {
      const dark = value === 'night' || (value === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.dataset.portalTheme = dark ? 'night' : 'day';
    }
  };

  return (
    <section aria-labelledby="theme-title" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 id="theme-title" className="text-lg font-bold text-[#0B1B3D]">Aspetto</h2>
      <p className="mt-1 text-sm text-slate-600">Scegli il tema su questo dispositivo. Automatica segue le impostazioni del sistema.</p>
      <fieldset className="mt-3 grid max-w-md grid-cols-3 gap-2">
        <legend className="sr-only">Tema del portale</legend>
        {themes.map(({ value, label, Icon }) => (
          <label key={value} className={`flex min-h-12 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border p-1 text-center text-xs font-bold sm:flex-row sm:gap-2 ${theme === value ? 'border-blue-400 bg-blue-100 text-blue-950' : 'border-slate-300 bg-slate-50 text-slate-700'} focus-within:outline-2 focus-within:outline-blue-500`}>
            <input type="radio" name="portal-theme" className="sr-only" value={value} checked={theme === value} onChange={() => selectTheme(value)} />
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </label>
        ))}
      </fieldset>
    </section>
  );
}
