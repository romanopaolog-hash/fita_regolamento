'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Flag, Trash2 } from 'lucide-react';
import type { ArticleReport } from '../../lib/article-report';
import { formatPersonName } from '../../lib/format-person-name';

export default function ArticleReports() {
  const [reports, setReports] = useState<ArticleReport[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadReports = useCallback(async (cursor?: string) => {
    setLoading(true);
    setError('');
    try {
      const url = '/api/article-reports' + (cursor ? '?cursor=' + encodeURIComponent(cursor) : '');
      const response = await fetch(url, { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Impossibile caricare le segnalazioni.');
      const incoming = result.reports as ArticleReport[];
      setReports(current => cursor ? [...current, ...incoming.filter(item => !current.some(report => report.id === item.id))] : incoming);
      setNextCursor(result.nextCursor ?? null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Impossibile caricare le segnalazioni.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadReports(); }, [loadReports]);

  const remove = async (report: ArticleReport) => {
    if (deleting || !window.confirm('Cancellare questa segnalazione?')) return;
    setDeleting(report.id);
    setError('');
    try {
      const response = await fetch('/api/article-reports?id=' + encodeURIComponent(report.id), { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Impossibile cancellare la segnalazione.');
      setReports(current => current.filter(item => item.id !== report.id));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Impossibile cancellare la segnalazione.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <section aria-labelledby="article-reports-title" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="article-reports-title" className="inline-flex items-center gap-2 text-lg font-bold text-[#0B1B3D]">
          <Flag className="h-5 w-5" aria-hidden="true" /> Segnalazioni articoli
        </h2>
        <button type="button" onClick={() => void loadReports()} disabled={loading || Boolean(deleting)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          Aggiorna
        </button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {loading && !reports.length && <p role="status" className="mt-3 text-sm text-slate-600">Caricamento segnalazioni…</p>}
      {!loading && !error && !reports.length && <p className="mt-3 text-sm text-slate-600">Nessuna segnalazione.</p>}
      {reports.length > 0 && (
        <ul className="mt-3 space-y-3">
          {reports.map(report => (
            <li key={report.id} className="min-w-0 rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 break-words">
                  <span className={`mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${report.kind === 'errore' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-800'}`}>
                    {report.kind === 'errore' ? 'Errore' : 'Suggerimento'}
                  </span>
                  <h3 className="font-bold text-[#0B1B3D]">
                    <Link href={'/?articolo=' + encodeURIComponent(report.articleId)} className="underline-offset-2 hover:underline">{report.articleTitle}</Link>
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">{[report.sectionTitle, formatPersonName(report.authorName), new Date(report.createdAt).toLocaleString('it-IT')].filter(Boolean).join(' · ')}</p>
                </div>
                <button type="button" onClick={() => void remove(report)} disabled={loading || Boolean(deleting)} aria-label={`Cancella la segnalazione su ${report.articleTitle}`} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
                  <Trash2 className="h-4 w-4" aria-hidden="true" /> {deleting === report.id ? 'Cancellazione…' : 'Cancella'}
                </button>
              </div>
              <p className="mt-3 whitespace-pre-wrap [overflow-wrap:anywhere] text-sm text-slate-800">{report.message}</p>
            </li>
          ))}
        </ul>
      )}
      {nextCursor && <button type="button" onClick={() => void loadReports(nextCursor)} disabled={loading || Boolean(deleting)} className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">{loading ? 'Caricamento…' : 'Carica altre segnalazioni'}</button>}
    </section>
  );
}
