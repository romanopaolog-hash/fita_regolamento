'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

type InstallPrompt = Event & {
  prompt: () => Promise<unknown>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function InstallAppButton() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isAppleMobile, setIsAppleMobile] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)');
    const appleNavigator = navigator as Navigator & { standalone?: boolean };
    const updateMode = () => setInstalled(standalone.matches || appleNavigator.standalone === true);
    updateMode();
    setIsAppleMobile(/iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
      setShowHelp(false);
    };
    standalone.addEventListener('change', updateMode);
    window.addEventListener('beforeinstallprompt', capturePrompt);
    window.addEventListener('appinstalled', onInstalled);
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/news-push-sw.js').catch(() => {});
    }
    return () => {
      standalone.removeEventListener('change', updateMode);
      window.removeEventListener('beforeinstallprompt', capturePrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!prompt) {
      setShowHelp(true);
      return;
    }
    setPrompt(null);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') setShowHelp(false);
    } catch {
      setShowHelp(true);
    }
  };

  if (installed) return null;
  return (
    <>
      <button type="button" onClick={() => void install()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-blue-950 hover:bg-blue-100">
        <Download className="h-4 w-4" aria-hidden="true" /> Installa l’app
      </button>
      {showHelp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4">
          <section role="dialog" aria-modal="true" aria-label="Come installare FITA Regolamento" onKeyDown={event => { if (event.key === 'Escape') setShowHelp(false); }} className="w-full max-w-sm rounded-2xl bg-white p-5 text-left shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[#0B1B3D]">Installa FITA Regolamento</h2>
              <button autoFocus type="button" onClick={() => setShowHelp(false)} aria-label="Chiudi le istruzioni" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            {isAppleMobile ? (
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
                <li>Apri il sito in Safari e tocca <strong>Condividi</strong>.</li>
                <li>Tocca <strong>Aggiungi alla schermata Home</strong>.</li>
                <li>Attiva <strong>Apri come app web</strong> se compare e tocca <strong>Aggiungi</strong>.</li>
              </ol>
            ) : (
              <p className="mt-3 text-sm text-slate-700">Su Android, apri questo sito in Chrome, apri il menu ⋮ e scegli <strong>Installa app</strong> oppure <strong>Aggiungi a schermata Home</strong>.</p>
            )}
            <p className="mt-3 text-sm text-slate-600">Apri FITA dalla nuova icona e accedi con il tuo account.</p>
          </section>
        </div>
      )}
    </>
  );
}
