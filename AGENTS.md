<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Pubblicazione del sito e ripristino

Prima di ogni modifica destinata alla produzione, verifica in Vercel quale deployment serve davvero `fita-regolamento.vercel.app`. Registra il suo ID e il relativo commit. Crea su GitHub un branch `checkpoint/AAAA-MM-GG-ID_DEPLOYMENT` che punti esattamente a quel commit. Se esiste già, verifica che punti allo stesso commit. Conserva questi branch.

Lavora su un branch dedicato. Verifica l’anteprima Vercel prima dell’unione in `main`. Dopo la pubblicazione, verifica che il dominio di produzione punti al nuovo deployment. Nel resoconto includi il punto di ripristino.

Per ripristinare il codice in produzione usa **Instant Rollback** sul deployment registrato, se disponibile. Il branch checkpoint permette di ricostruire il codice precedente. Articoli, file e altre informazioni in Vercel Blob o Clerk sono dati separati e richiedono un backup specifico prima di eventuali migrazioni o operazioni sui dati.
