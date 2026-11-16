import { useEffect, useId, useRef, useState } from 'react';
import { Play, RotateCcw, X } from 'lucide-react';

export function getInstagramEmbedUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    if (url.hostname !== 'instagram.com' && !url.hostname.endsWith('.instagram.com')) return null;
    const post = url.pathname.match(/^\/(reel|p|tv)\/([A-Za-z0-9_-]+)(?:\/|$)/);
    return post ? `https://www.instagram.com/${post[1]}/${post[2]}/embed/` : null;
  } catch {
    return null;
  }
}

export function VideoDialog({
  title, embedUrl, instagram, url, onClose,
}: {
  title: string;
  embedUrl: string | null;
  instagram: boolean;
  url: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [replayCount, setReplayCount] = useState(0);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); onClose(); }}
      className="fixed inset-0 m-auto max-h-[95dvh] w-[calc(100%-2rem)] max-w-2xl overscroll-contain rounded-xl bg-white text-slate-800 shadow-2xl backdrop:bg-slate-950/80"
    >
      <header className="flex items-center justify-between gap-2 bg-[#0B1B3D] px-3 py-1 text-white">
        <h3 id={titleId} className="min-w-0 break-words text-sm font-bold">{title}</h3>
        <button type="button" autoFocus onClick={onClose} aria-label="Chiudi video" className="grid min-h-11 min-w-11 shrink-0 place-items-center">
          <X className="h-5 w-5" />
        </button>
      </header>
      {instagram && (
        <div className="flex justify-center p-2">
          <button type="button" onClick={() => setReplayCount(count => count + 1)} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-blue-700">
            <RotateCcw className="h-4 w-4" /> Rivedi dall’inizio
          </button>
        </div>
      )}
      <div className={instagram ? 'mx-auto h-[min(65dvh,640px)] w-full max-w-[450px] bg-slate-950' : 'aspect-video bg-black'}>
        {embedUrl ? (
          <iframe
            key={replayCount}
            src={embedUrl}
            title={title}
            sandbox={instagram ? 'allow-scripts allow-same-origin allow-presentation' : undefined}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="h-full w-full border-0"
          />
        ) : (
          <video src={url} controls autoPlay playsInline className="h-full w-full object-contain" />
        )}
      </div>
    </dialog>
  );
}

export function PlayVideoButton({ title, onClick }: { title: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={`Riproduci ${title}`} className="flex aspect-video w-full touch-pan-y items-center justify-center gap-2 bg-slate-900 px-3 text-sm font-bold text-white hover:bg-slate-800">
      <Play className="h-4 w-4 fill-current" /> Riproduci video
    </button>
  );
}
