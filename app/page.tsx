'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SignIn, SignUp, useClerk, useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  User,
  LogOut,
  Star,
  ChevronDown,
  Video,
  Plus,
  Trash2,
  Edit3,
  X,
  Play,
  Users,
  BookOpen,
  Sparkles,
  Upload,
  Link as LinkIcon,
  Bell,
  BellOff,
  FileText,
  Download,
  Calendar,
  MapPin,
  Home as HomeIcon,
  Megaphone,
  Settings,
  Key,
  CheckCircle,
  CheckSquare,
  Square,
  ShieldCheck,
  Pin
} from 'lucide-react';

const BULK_ARTICLE_TEMPLATE = `=== ARTICOLO ===
Titolo: Titolo dell'articolo
Tag: tag1, tag2
Testo:
Testo completo dell'articolo.
=== FINE ARTICOLO ===`;

const BULK_ARTICLE_PROMPT = `Estrai dal materiale fornito gli articoli del regolamento. Usa solo informazioni presenti nel materiale, conserva numeri, condizioni ed eccezioni, non inventare contenuti. Dividi il testo in articoli autonomi e restituisci SOLO i blocchi nel formato seguente. Ripeti il blocco per ogni articolo. I tag sono facoltativi. Non usare i marcatori di inizio o fine articolo dentro il testo.

${BULK_ARTICLE_TEMPLATE}`;

function parseBulkArticles(source: string) {
  const blocks = source.split(/^=== ARTICOLO ===\s*$/im).slice(1);
  const articles: { title: string; tags: string[]; content: string }[] = [];
  const errors: string[] = [];

  if (blocks.length === 0 && source.trim()) {
    return { articles, errors: ['Non trovo blocchi. Usa il marcatore === ARTICOLO === per ogni articolo.'] };
  }

  blocks.forEach((block, index) => {
    const title = block.match(/^Titolo:\s*(.+)$/im)?.[1]?.trim();
    const tagLine = block.match(/^Tag:\s*(.*)$/im)?.[1] ?? '';
    const contentMatch = block.match(/^Testo:\s*\r?\n([\s\S]*?)\s*=== FINE ARTICOLO ===\s*$/im);
    const content = contentMatch?.[1]?.trim();

    if (!title || !content) {
      errors.push(`Articolo ${index + 1}: manca il Titolo, il Testo o il marcatore === FINE ARTICOLO ===.`);
      return;
    }

    articles.push({
      title,
      tags: tagLine.split(',').map(tag => tag.trim()).filter(Boolean),
      content
    });
  });

  return { articles, errors };
}

// --- DATI DI DEFAULT ---
const DEFAULT_NEWS = [
  {
    id: 'news-1',
    title: 'Campionato Regionale Kyorugi Campania 2026 - Iscrizioni e Orari',
    category: 'Regionale',
    date: '15 Novembre 2026',
    location: 'PalaVesuvio - Napoli',
    content: 'Pubblicati gli orari delle operazioni di peso e il sorteggio dei tabelloni per tutte le categorie Cadetti, Junior e Senior. Si ricorda a tutti i convocati arbitrali di presentarsi entro le ore 08:00.',
    image: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=800',
    isPinned: true
  },
  {
    id: 'news-2',
    title: 'Aggiornamento Direttive Video Replay (VR) World Taekwondo 2026',
    category: 'Regolamento',
    date: '02 Novembre 2026',
    location: 'Nazionale',
    content: 'Emanata la circolare con i nuovi chiarimenti riguardanti la tempistica di alzata del cartellino da parte del coach ed il protocollo di revisione per calci impattanti al corpetto.',
    image: null,
    isPinned: false
  }
];

const DEFAULT_SECTIONS = [
  {
    id: 'kyorugi',
    title: 'Combattimento',
    shortTitle: 'Kyorugi',
    subtitle: 'Kyorugi (World Taekwondo / FITA)',
    code: 'KY-2026',
    subsections: [
      {
        id: 'k1',
        title: 'Punteggi e Aree Bersaglio (PSS)',
        content: `I punti vengono validati dal sistema elettronico PSS (Protector & Scoring System) o dai giudici d'angolo quando una tecnica consentita viene eseguita con impatto efficace.\n\n• 1 Punto: Pugno valido sul corpetto protettivo.\n• 2 Punti: Calcio valido sul corpetto.\n• 3 Punti: Calcio alla testa o pugno/calcio con conteggio di protezione (RSC).\n• 4 Punti: Calcio in rotazione (spin) al corpetto.\n• 5 Punti: Calcio in rotazione (spin) alla testa.`,
        tags: ['Punteggi', 'Corpetto', 'Testa', 'PSS'],
        media: [
          { type: 'image', url: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=800', caption: 'Area di gara ottagonale e sistema PSS approvato FITA' }
        ]
      },
      {
        id: 'k2',
        title: 'Falli e Penalità (Gam-jeom)',
        content: `L'arbitro centrale assegna un "Gam-jeom" (1 punto all'avversario) per le seguenti infrazioni:\n\n1. Uscita dalla linea di delimitazione del campo di gara con entrambi i piedi.\n2. Caduta intenzionale o per evitare un attacco.\n3. Evitare il combattimento o indietreggiare passivamente.\n4. Trattenere, spingere o afferrare la gamba o il corpo dell'avversario.\n5. Colpire sotto la cintola o a terra.`,
        tags: ['Gam-jeom', 'Penalità', 'Arbitraggio'],
        media: []
      }
    ],
    documents: [
      { id: 'doc-k1', title: 'Guida Ufficiale Arbitraggio Kyorugi 2026.pdf', format: 'PDF', size: '2.4 MB', date: '10/01/2026', description: 'Manuale illustrato completo per arbitri di combattimento.', url: '#' },
      { id: 'doc-k2', title: 'Slide_Corso_Aggiornamento_FITA_Combattimento.pptx', format: 'PPTX', size: '14.2 MB', date: '05/02/2026', description: 'Presentazione PowerPoint utilizzata durante il raduno arbitrale.', url: '#' }
    ]
  },
  {
    id: 'video-replay',
    title: 'Video Replay',
    shortTitle: 'VR',
    subtitle: 'Protocollo Ufficiale di Revisione Video',
    code: 'VR-2026',
    subsections: [
      {
        id: 'vr1',
        title: 'Procedura di Richiesta e Cartellino Coach',
        content: `Ogni coach riceve 1 quota (cartellino VR) all'inizio dell'incontro.\n\n- Se il ricorso viene ACCOLTO dalla giuria di revisione, la quota viene restituita.\n- Se il ricorso viene RESPINTO, la quota viene persa per la durata dell'incontro.\n- La richiesta deve essere effettuata entro 5 secondi dalla conclusione dell'azione.`,
        tags: ['VR', 'Cartellino', 'Tempistiche'],
        media: [
          { type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', caption: 'Esempio di richiesta VR per assegnazione punti alla testa' }
        ]
      }
    ],
    documents: [
      { id: 'doc-vr1', title: 'Modulo_Richiesta_VR_Coach_FITA.pdf', format: 'PDF', size: '520 KB', date: '12/01/2026', description: 'Modulo per la registrazione delle richieste VR al tavolo di giuria.', url: '#' }
    ]
  },
  {
    id: 'poomsae',
    title: 'Forme',
    shortTitle: 'Poomsae',
    subtitle: 'Poomsae Ufficiali & Riconosciute',
    code: 'PO-2026',
    subsections: [
      {
        id: 'p1',
        title: 'Criteri di Valutazione (4.0 / 6.0)',
        content: `Il punteggio complessivo per l'esecuzione di una Forma è di 10.0 Punti:\n\n• Precisione (4.0 Punti): Correttezza delle posizioni (Sogi), parate (Makgi) e attacchi (Jirugi/Chagi).\n• Presentazione (6.0 Punti): Forza, velocità, equilibrio, controllo della respirazione ed espressività (Kihap).`,
        tags: ['Precisione', 'Presentazione', 'Valutazione'],
        media: []
      }
    ],
    documents: [
      { id: 'doc-p1', title: 'Scheda_Valutazione_Giudici_Poomsae.pdf', format: 'PDF', size: '890 KB', date: '18/01/2026', description: 'Griglia cartacea per il calcolo delle detrazioni Precisione/Presentazione.', url: '#' }
    ]
  },
  {
    id: 'freestyle',
    title: 'Freestyle',
    shortTitle: 'Freestyle',
    subtitle: 'Poomsae Freestyle e Acrobatica',
    code: 'FR-2026',
    subsections: [
      {
        id: 'f1',
        title: 'Elementi Obbligatori e Coreografia',
        content: `Il Poomsae Freestyle integra tecniche tradizionali di Taekwondo con elementi acrobatici su base musicale. Deve contenere salti acrobatici, calci multipli in volo e combinazioni in coordinazione col ritmo.`,
        tags: ['Musica', 'Acrobazie', 'Salti'],
        media: []
      }
    ],
    documents: [
      { id: 'doc-f1', title: 'Regolamento_Musicale_Freestyle.pdf', format: 'PDF', size: '1.5 MB', date: '04/02/2026', description: 'Specifiche sull invio dei brani musicali e tempi d esecuzione.', url: '#' }
    ]
  }
];

function mergeArticleSections(cloudSections: any[], deviceSections: any[]) {
  const cloudById = new Map(cloudSections.map(section => [section.id, section]));
  const deviceById = new Map(deviceSections.map(section => [section.id, section]));
  const sectionIds = [...new Set([...cloudSections.map(section => section.id), ...deviceSections.map(section => section.id)])];

  return sectionIds.map(id => {
    const cloudSection = cloudById.get(id);
    const deviceSection = deviceById.get(id);
    const articleMap = new Map<string, any>();
    for (const article of [...(deviceSection?.subsections || []), ...(cloudSection?.subsections || [])]) {
      articleMap.set(article.id, article);
    }

    return {
      ...(deviceSection || {}),
      ...(cloudSection || {}),
      subsections: [...articleMap.values()],
      documents: cloudSection?.documents ?? deviceSection?.documents ?? []
    };
  });
}

function reconcileArticleSections(cloudSections: any[], deviceSections: any[], lastSyncedSections: any[]) {
  const cloudById = new Map(cloudSections.map(section => [section.id, section]));
  const deviceById = new Map(deviceSections.map(section => [section.id, section]));
  const snapshotById = new Map(lastSyncedSections.map(section => [section.id, section]));
  const sectionIds = [...new Set([...cloudSections.map(section => section.id), ...deviceSections.map(section => section.id)])];

  return sectionIds.map(id => {
    const cloudSection = cloudById.get(id);
    const deviceSection = deviceById.get(id);
    const snapshotSection = snapshotById.get(id);
    if (!cloudSection || !deviceSection || !snapshotSection) {
      return mergeArticleSections(cloudSection ? [cloudSection] : [], deviceSection ? [deviceSection] : [])[0];
    }

    const cloudArticles = new Map<string, any>((cloudSection.subsections || []).map((article: any) => [article.id, article]));
    const deviceArticles = new Map<string, any>((deviceSection.subsections || []).map((article: any) => [article.id, article]));
    const snapshotArticles = new Map<string, any>((snapshotSection.subsections || []).map((article: any) => [article.id, article]));

    for (const [articleId, priorArticle] of snapshotArticles) {
      const deviceArticle = deviceArticles.get(articleId);
      const cloudArticle = cloudArticles.get(articleId);
      if (!deviceArticle && cloudArticle && JSON.stringify(cloudArticle) === JSON.stringify(priorArticle)) {
        cloudArticles.delete(articleId);
      } else if (deviceArticle && JSON.stringify(deviceArticle) !== JSON.stringify(priorArticle)) {
        cloudArticles.set(articleId, deviceArticle);
      }
    }
    for (const [articleId, deviceArticle] of deviceArticles) {
      if (!snapshotArticles.has(articleId)) cloudArticles.set(articleId, deviceArticle);
    }

    const documents = new Map<string, any>();
    for (const document of [...(deviceSection.documents || []), ...(cloudSection.documents || [])]) documents.set(document.id, document);

    return {
      ...deviceSection,
      ...cloudSection,
      subsections: [...cloudArticles.values()],
      documents: [...documents.values()]
    };
  });
}

export default function FitaTaekwondoApp() {
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [isSectionsLoaded, setIsSectionsLoaded] = useState(false);
  const articleSyncEtagRef = useRef<string | null>(null);
  const lastSyncedSectionsRef = useRef<string | null>(null);
  const articleSyncAvailableRef = useRef(false);
  const [newsList, setNewsList] = useState(DEFAULT_NEWS);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<string>('Tutti');

  const [activeSectionId, setActiveSectionId] = useState('home');
  const [activeTabMode, setActiveTabMode] = useState<'rules' | 'materials'>('rules');

  const [searchQuery, setSearchQuery] = useState('');
  const [isArticleSearchFocused, setIsArticleSearchFocused] = useState(false);
  const [isSelectingArticles, setIsSelectingArticles] = useState(false);
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([]);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [user, setUser] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'user' | 'admin';
    region: string;
  } | null>(null);

  const { isLoaded: clerkLoaded, user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');


  const [activeVideoModal, setActiveVideoModal] = useState<{ url: string; caption: string; title: string } | null>(null);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // Form Articoli / News / Documenti
  const [editingSubsection, setEditingSubsection] = useState<any | null>(null);
  const [formSectionId, setFormSectionId] = useState('kyorugi');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');
  const [mediaSourceType, setMediaSourceType] = useState<'url' | 'file'>('file');
  const [formMediaUrl, setFormMediaUrl] = useState('');
  const [formMediaType, setFormMediaType] = useState<'image' | 'video'>('image');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isQuickImportModalOpen, setIsQuickImportModalOpen] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [bulkImportSectionId, setBulkImportSectionId] = useState('kyorugi');

  const [newsTitle, setNewsTitle] = useState('');
  const [newsCategory, setNewsCategory] = useState('Regionale');
  const [newsLocation, setNewsLocation] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsImage, setNewsImage] = useState('');
  const [newsIsPinned, setNewsIsPinned] = useState(false);

  const [docTitle, setDocTitle] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [docFormat, setDocFormat] = useState('PDF');
  const [docFileName, setDocFileName] = useState('');
  const [docUrl, setDocUrl] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let deviceSections = DEFAULT_SECTIONS;
    const savedSecs = localStorage.getItem('tkd_sections');
    if (savedSecs) {
      try {
        const parsed = JSON.parse(savedSecs);
        if (Array.isArray(parsed)) deviceSections = parsed;
      } catch {}
    }
    setSections(deviceSections);

    // Remove the old per-device secret; admin access is checked by Clerk on the server.
    localStorage.removeItem('tkd_article_sync_key');

    const savedNews = localStorage.getItem('tkd_news');
    if (savedNews) { try { setNewsList(JSON.parse(savedNews)); } catch (e) {} }
    const savedFavs = localStorage.getItem('tkd_favorites');
    if (savedFavs) { try { setFavorites(JSON.parse(savedFavs)); } catch (e) {} }
    // Remove the legacy browser-only accounts and plaintext passwords during the Clerk migration.
    localStorage.removeItem('tkd_users_list');
    localStorage.removeItem('tkd_remember_me');
    localStorage.removeItem('tkd_current_user');

    let lastSyncedSnapshot: any[] | null = null;
    const savedSnapshot = localStorage.getItem('tkd_articles_last_synced_v1');
    if (savedSnapshot) {
      try {
        const parsedSnapshot = JSON.parse(savedSnapshot);
        if (Array.isArray(parsedSnapshot)) lastSyncedSnapshot = parsedSnapshot;
      } catch {}
    }
    fetch('/api/articles', { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Shared articles unavailable');
        return response.json();
      })
      .then((result: { sections?: any[] | null; etag?: string | null }) => {
        if (!active) return;
        articleSyncAvailableRef.current = true;
        articleSyncEtagRef.current = result.etag ?? null;
        const cloudSections = Array.isArray(result.sections) ? result.sections : null;
        lastSyncedSectionsRef.current = cloudSections ? JSON.stringify(cloudSections) : null;

        const resolvedSections = cloudSections
          ? (lastSyncedSnapshot
            ? reconcileArticleSections(cloudSections, deviceSections, lastSyncedSnapshot)
            : mergeArticleSections(cloudSections, deviceSections))
          : deviceSections;

        setSections(resolvedSections);
        setIsSectionsLoaded(true);
        if (cloudSections && JSON.stringify(resolvedSections) === JSON.stringify(cloudSections)) {
          localStorage.setItem('tkd_articles_synced_v1', 'true');
          localStorage.setItem('tkd_articles_last_synced_v1', JSON.stringify(cloudSections));
        }
      })
      .catch(() => {
        if (!active) return;
        articleSyncAvailableRef.current = false;
        setSections(deviceSections);
        setIsSectionsLoaded(true);
        showToast('Archivio condiviso non raggiungibile: gli articoli restano salvati su questo dispositivo.');
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isSectionsLoaded) return;
    const serializedSections = JSON.stringify(sections);
    localStorage.setItem('tkd_sections', serializedSections);

    if (!articleSyncAvailableRef.current || user?.role !== 'admin') return;
    if (serializedSections === lastSyncedSectionsRef.current) {
      localStorage.setItem('tkd_articles_synced_v1', 'true');
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/articles', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sections, etag: articleSyncEtagRef.current })
        });

        if (response.status === 409) {
          const latest = await response.json();
          articleSyncEtagRef.current = latest.etag ?? null;
          lastSyncedSectionsRef.current = Array.isArray(latest.sections) ? JSON.stringify(latest.sections) : null;
          if (Array.isArray(latest.sections)) {
            const savedSnapshot = localStorage.getItem('tkd_articles_last_synced_v1');
            let priorSnapshot: any[] = [];
            if (savedSnapshot) { try { priorSnapshot = JSON.parse(savedSnapshot); } catch {} }
            setSections(priorSnapshot.length
              ? reconcileArticleSections(latest.sections, sections, priorSnapshot)
              : mergeArticleSections(latest.sections, sections));
          }
          showToast('Ho unito gli aggiornamenti recenti. Attendi un istante per completare la sincronizzazione.');
          return;
        }
        if (!response.ok) throw new Error('Shared article save failed');

        const result = await response.json();
        articleSyncEtagRef.current = result.etag ?? null;
        lastSyncedSectionsRef.current = serializedSections;
        localStorage.setItem('tkd_articles_synced_v1', 'true');
        localStorage.setItem('tkd_articles_last_synced_v1', serializedSections);
        showToast('Articoli salvati nell’archivio condiviso.');
      } catch {
        showToast('Sincronizzazione non riuscita. Riprova; se continua, aggiorna la pagina.');
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [sections, isSectionsLoaded, user?.role]);
  useEffect(() => { localStorage.setItem('tkd_news', JSON.stringify(newsList)); }, [newsList]);
  useEffect(() => { localStorage.setItem('tkd_favorites', JSON.stringify(favorites)); }, [favorites]);
  const isAccountAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!clerkLoaded) return;
    if (!clerkUser) {
      setUser(null);
      setAuthModalOpen(false);
      return;
    }

    const email = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || '';
    const region = typeof clerkUser.unsafeMetadata?.region === 'string' ? clerkUser.unsafeMetadata.region : 'Campania';
    setUser({
      id: clerkUser.id,
      firstName: clerkUser.firstName || '',
      lastName: clerkUser.lastName || '',
      email,
      role: clerkUser.publicMetadata.role === 'admin' ? 'admin' : 'user',
      region,
    });
    setAuthModalOpen(false);
  }, [clerkLoaded, clerkUser]);

  useEffect(() => {
    if (!clerkLoaded || !clerkUser || clerkUser.publicMetadata.role === 'admin') return;

    let active = true;
    fetch('/api/admin/bootstrap', { method: 'POST', credentials: 'same-origin' })
      .then(async response => {
        if (response.ok && active) {
          await clerkUser.reload();
        }
      })
      .catch(() => {});

    return () => { active = false; };
  }, [clerkLoaded, clerkUser]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleNotifications = () => {
    const nextState = !notificationsEnabled;
    setNotificationsEnabled(nextState);
    showToast(nextState ? '🔔 Notifiche Attivate' : '🔕 Notifiche Disattivate');
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
    showToast(favorites.includes(id) ? 'Rimosso dai preferiti' : 'Salvato nei preferiti');
  };

  const toggleAccordion = (id: string) => {
    setOpenAccordions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const togglePinNews = (newsId: string) => {
    setNewsList(prev => prev.map(n => n.id === newsId ? { ...n, isPinned: !n.isPinned } : n));
    showToast('Stato evidenza notizia aggiornato!');
  };

  const openProfilePage = () => {
    if (!user) return;
    window.location.assign('/profilo');
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    showToast('Logout effettuato');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      setFormMediaUrl(URL.createObjectURL(file));
      setFormMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    }
  };

  const handleDocFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocFileName(file.name);
      setDocUrl(URL.createObjectURL(file));
      setDocFormat(file.name.split('.').pop()?.toUpperCase() || 'PDF');
    }
  };

  const handleSaveNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsContent.trim()) return;
    const newItem = {
      id: 'news-' + Date.now(),
      title: newsTitle,
      category: newsCategory,
      date: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }),
      location: newsLocation || 'Nazionale',
      content: newsContent,
      image: newsImage || null,
      isPinned: newsIsPinned
    };
    setNewsList([newItem, ...newsList]);
    setIsNewsModalOpen(false);
    setNewsTitle(''); setNewsContent(''); setNewsLocation(''); setNewsImage(''); setNewsIsPinned(false);
    showToast('Notizia pubblicata!');
  };

  const handleDeleteNews = (id: string) => {
    if (!confirm('Eliminare questa notizia?')) return;
    setNewsList(prev => prev.filter(n => n.id !== id));
    showToast('Notizia eliminata.');
  };

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;
    const newDoc = {
      id: 'doc-' + Date.now(),
      title: docTitle + (docFormat ? `.${docFormat.toLowerCase()}` : ''),
      format: docFormat,
      size: docFileName ? 'Locale (~2.5 MB)' : 'Esterno',
      date: new Date().toLocaleDateString('it-IT'),
      description: docDescription,
      url: docUrl || '#'
    };
    setSections(prev =>
      prev.map(sec => sec.id === activeSectionId ? { ...sec, documents: [newDoc, ...(sec.documents || [])] } : sec)
    );
    setIsDocModalOpen(false);
    setDocTitle(''); setDocDescription(''); setDocFileName(''); setDocUrl('');
    showToast('Documento salvato!');
  };

  const handleDeleteDocument = (secId: string, docId: string) => {
    if (!confirm('Eliminare questo documento?')) return;
    setSections(prev =>
      prev.map(sec => sec.id === secId ? { ...sec, documents: sec.documents.filter(d => d.id !== docId) } : sec)
    );
    showToast('Documento rimosso.');
  };

  const handleSaveSubsection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;
    const newSub = {
      id: editingSubsection ? editingSubsection.id : 'sub_' + Date.now(),
      title: formTitle,
      content: formContent,
      tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
      media: formMediaUrl ? [{ type: formMediaType, url: formMediaUrl, caption: selectedFileName ? `File: ${selectedFileName}` : 'Allegato' }] : []
    };
    setSections(prev =>
      prev.map(sec => {
        if (sec.id === formSectionId) {
          if (editingSubsection) {
            return { ...sec, subsections: sec.subsections.map(sub => sub.id === editingSubsection.id ? newSub : sub) };
          } else {
            return { ...sec, subsections: [...sec.subsections, newSub] };
          }
        }
        return sec;
      })
    );
    setIsEditingModalOpen(false);
    showToast(editingSubsection ? 'Articolo aggiornato!' : 'Nuovo articolo salvato!');
  };

  const handleBulkImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'admin') return;

    const { articles, errors } = parseBulkArticles(bulkImportText);
    if (errors.length > 0) {
      showToast(errors[0]);
      return;
    }
    if (articles.length === 0) {
      showToast('Incolla almeno un articolo valido prima di importarli.');
      return;
    }

    const targetSection = sections.find(section => section.id === bulkImportSectionId);
    if (!targetSection) {
      showToast('Seleziona una sezione del regolamento valida.');
      return;
    }

    const importedSubsections = articles.map((article, index) => ({
      id: `sub_bulk_${Date.now()}_${index}`,
      title: article.title,
      content: article.content,
      tags: article.tags,
      media: []
    }));

    setSections(prev => prev.map(section =>
      section.id === bulkImportSectionId
        ? { ...section, subsections: [...section.subsections, ...importedSubsections] }
        : section
    ));
    setActiveSectionId(bulkImportSectionId);
    setActiveTabMode('rules');
    setIsQuickImportModalOpen(false);
    setBulkImportText('');
    showToast(`Importati ${importedSubsections.length} articoli in "${targetSection.title}".`);
  };

  const handleEditClick = (sub: any, sectionId: string) => {
    setEditingSubsection(sub);
    setFormSectionId(sectionId);
    setFormTitle(sub.title);
    setFormContent(sub.content);
    setFormTags(sub.tags ? sub.tags.join(', ') : '');
    setFormMediaUrl(sub.media && sub.media[0] ? sub.media[0].url : '');
    setFormMediaType(sub.media && sub.media[0] ? sub.media[0].type : 'image');
    setSelectedFileName(null);
    setIsEditingModalOpen(true);
  };

  const toggleArticleSelection = (subId: string) => {
    setSelectedArticleIds(prev => prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]);
  };

  const handleDeleteSelectedArticles = () => {
    if (!user || user.role !== 'admin' || selectedArticleIds.length === 0) return;
    if (!confirm(`Eliminare definitivamente ${selectedArticleIds.length} articoli selezionati?`)) return;

    const deletedIds = new Set(selectedArticleIds);
    setSections(prev => prev.map(section => ({
      ...section,
      subsections: section.subsections.filter(sub => !deletedIds.has(sub.id))
    })));
    setFavorites(prev => prev.filter(id => !deletedIds.has(id)));
    setSelectedArticleIds([]);
    setIsSelectingArticles(false);
    showToast(`Eliminati ${deletedIds.size} articoli.`);
  };

  const handleDeleteSubsection = (secId: string, subId: string) => {
    if (!confirm('Eliminare questo articolo?')) return;
    setSections(prev =>
      prev.map(sec => sec.id === secId ? { ...sec, subsections: sec.subsections.filter(s => s.id !== subId) } : sec)
    );
    showToast('Articolo eliminato.');
  };

  const currentSection = sections.find(s => s.id === activeSectionId);

  const articleSearchSuggestions = searchQuery.trim().length >= 2
    ? sections.flatMap(section => section.subsections.map(sub => ({ section, sub })))
        .filter(({ section, sub }) => {
          const query = searchQuery.trim().toLowerCase();
          return sub.title.toLowerCase().includes(query)
            || sub.content.toLowerCase().includes(query)
            || (sub.tags && sub.tags.some(tag => tag.toLowerCase().includes(query)))
            || section.title.toLowerCase().includes(query);
        })
        .slice(0, 6)
    : [];

  const filteredSubsections = currentSection ? currentSection.subsections.filter(sub => {
    const matchesSearch =
      sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.tags && sub.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesFav = showOnlyFavorites ? favorites.includes(sub.id) : true;
    return matchesSearch && matchesFav;
  }) : [];

  // NOTIZIE FILTRATE E ORDINATE (IN EVIDENZA PER PRIME)
  const filteredNews = newsList
    .filter(n => selectedNewsCategory === 'Tutti' || n.category === selectedNewsCategory)
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 font-sans flex flex-col justify-between pb-20 md:pb-0">
      
      {/* Toast Notifiche */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 sm:top-24 sm:right-6 z-50 bg-[#0B1B3D] text-white px-4 py-2.5 rounded-lg shadow-2xl text-xs font-semibold flex items-center gap-2 border-l-4 border-[#A60F2D]"
          >
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        {/* --- TOPBAR DESKTOP --- */}
        <div className="hidden md:block bg-[#0B1B3D] text-white text-xs border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-6 h-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-bold tracking-wider text-slate-300">FEDERAZIONE ITALIANA TAEKWONDO</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300">Commissione Nazionale Arbitrale</span>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <button onClick={openProfilePage} className="flex items-center gap-1 text-slate-200 hover:text-amber-400 font-semibold text-xs">
                    <Settings className="w-3.5 h-3.5 text-amber-400" />
                    <span>{user.firstName} {user.lastName}</span>
                  </button>

                  {user.role === 'admin' && (
                    <a
                      href="https://dashboard.clerk.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#A60F2D] hover:bg-red-800 text-white text-[11px] font-bold shadow"
                    >
                      <Users className="w-3.5 h-3.5" /> Gestione account
                    </a>
                  )}

                  <button onClick={handleLogout} className="text-slate-400 hover:text-white p-1" title="Logout">
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button onClick={() => { setAuthMode('login'); setAuthModalOpen(true); }} className="flex items-center gap-1.5 text-slate-200 hover:text-white font-semibold text-xs">
                  <User className="w-3.5 h-3.5" />
                  <span>Accedi</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* --- HEADER --- */}
        <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveSectionId('home')}>
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-[#0B1B3D] rounded-lg flex items-center justify-center text-white font-black text-base sm:text-xl shadow-md border-b-2 sm:border-b-4 border-[#A60F2D] shrink-0">
                FITA
              </div>
              <div>
                <h1 className="text-sm sm:text-xl font-black tracking-tight text-[#0B1B3D] leading-tight">PORTALE ARBITRALE</h1>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium hidden sm:block">Regolamenti & Materiali Didattici</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-xs sm:max-w-md ml-auto">
              <div className="w-full relative flex items-center h-8 sm:h-9">
                <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cerca norme..."
                  value={searchQuery}
                  onFocus={() => setIsArticleSearchFocused(true)}
                  onBlur={() => window.setTimeout(() => setIsArticleSearchFocused(false), 120)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 sm:h-9 bg-slate-100 border border-slate-300 rounded-lg pl-8 pr-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#0B1B3D]"
                  aria-label="Cerca articoli e norme"
                  aria-autocomplete="list"
                  aria-expanded={isArticleSearchFocused && articleSearchSuggestions.length > 0}
                />
                {isArticleSearchFocused && articleSearchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl" role="listbox" aria-label="Suggerimenti articoli">
                    {articleSearchSuggestions.map(({ section, sub }) => (
                      <button
                        key={sub.id}
                        type="button"
                        role="option"
                        aria-selected="false"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setActiveSectionId(section.id);
                          setActiveTabMode('rules');
                          setSearchQuery(sub.title);
                          setOpenAccordions(prev => ({ ...prev, [sub.id]: true }));
                          setIsArticleSearchFocused(false);
                        }}
                        className="block w-full border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-slate-50"
                      >
                        <span className="block truncate text-xs font-bold text-[#0B1B3D]">{sub.title}</span>
                        <span className="mt-0.5 block truncate text-[10px] text-slate-500">{section.shortTitle || section.title}{sub.tags?.length ? ` · ${sub.tags.slice(0, 3).join(', ')}` : ''}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {activeSectionId !== 'home' && (
                <button
                  type="button"
                  onClick={() => setShowOnlyFavorites(prev => !prev)}
                  aria-pressed={showOnlyFavorites}
                  title={showOnlyFavorites ? 'Mostra tutti gli articoli' : 'Mostra solo i preferiti'}
                  className={`flex h-8 sm:h-9 shrink-0 items-center gap-1.5 rounded-lg border px-2 sm:px-3 text-xs font-bold transition-colors ${showOnlyFavorites ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  <Star className={`h-4 w-4 ${showOnlyFavorites ? 'fill-amber-500 text-amber-500' : 'text-amber-500'}`} />
                  <span className="hidden sm:inline">{showOnlyFavorites ? 'Preferiti' : 'Preferiti'}</span>
                </button>
              )}

              <button
                onClick={toggleNotifications}
                className={`hidden md:flex h-9 px-3 rounded-lg border text-xs font-bold items-center gap-1.5 shadow-sm transition-all whitespace-nowrap ${
                  notificationsEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                {notificationsEnabled ? <Bell className="w-4 h-4 text-emerald-600 fill-emerald-600/20" /> : <BellOff className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          </div>
        </header>

        {/* --- NAVIGAZIONE DESKTOP --- */}
        <nav className="hidden md:block bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-2">
            <div className="grid grid-cols-5 gap-2">
              <button
                onClick={() => setActiveSectionId('home')}
                className={`py-2.5 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                  activeSectionId === 'home' ? 'bg-[#0B1B3D] text-white border-[#0B1B3D] shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <HomeIcon className="w-4 h-4 text-amber-400" />
                <span>Home / News</span>
              </button>

              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => { setActiveSectionId(sec.id); setActiveTabMode('rules'); }}
                  className={`py-2.5 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    activeSectionId === sec.id ? 'bg-[#0B1B3D] text-white border-[#0B1B3D] shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className={`w-4 h-4 ${activeSectionId === sec.id ? 'text-red-400' : 'text-slate-400'}`} />
                  <span>{sec.title}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* --- CONTENUTO PRINCIPALE --- */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 w-full">
          
          {/* HOME / NEWS */}
          {activeSectionId === 'home' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#A60F2D] uppercase tracking-wider mb-0.5">
                    <Megaphone className="w-3.5 h-3.5" /> Comunicati Ufficiali
                  </div>
                  <h2 className="text-lg sm:text-2xl font-black text-[#0B1B3D]">Notizie & Gare Regionali</h2>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* FILTRI RIPRISTINATI: TUTTI, REGIONALE, NAZIONALE, REGOLAMENTO */}
                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold overflow-x-auto w-full sm:w-auto">
                    {['Tutti', 'Regionale', 'Nazionale', 'Regolamento'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedNewsCategory(cat)}
                        className={`flex-1 sm:flex-none px-2.5 py-1 rounded-md transition-colors text-[11px] whitespace-nowrap ${
                          selectedNewsCategory === cat ? 'bg-[#0B1B3D] text-white shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {user && user.role === 'admin' && (
                    <button
                      onClick={() => setIsNewsModalOpen(true)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-[#0B1B3D] text-white font-bold text-xs"
                    >
                      <Plus className="w-4 h-4" /> Pubblica Notizia
                    </button>
                  )}
                </div>
              </div>

              {filteredNews.length === 0 ? (
                <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-500 font-semibold text-xs">
                  Nessuna notizia disponibile.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredNews.map((item) => (
                    <div key={item.id} className={`bg-white rounded-xl border overflow-hidden shadow-sm flex flex-col justify-between relative ${item.isPinned ? 'border-amber-400 ring-1 ring-amber-400/50' : 'border-slate-200'}`}>
                      <div>
                        {item.image && (
                          <div className="h-36 sm:h-44 bg-slate-100 overflow-hidden relative">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                              <span className="bg-[#0B1B3D] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                                {item.category}
                              </span>
                              {item.isPinned && (
                                <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1">
                                  <Pin className="w-3 h-3 fill-white" /> In Evidenza
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="p-4 space-y-2.5">
                          {!item.image && (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-block bg-[#0B1B3D] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                                {item.category}
                              </span>
                              {item.isPinned && (
                                <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow inline-flex items-center gap-1">
                                  <Pin className="w-3 h-3 fill-white" /> In Evidenza
                                </span>
                              )}
                            </div>
                          )}
                          <h3 className="text-sm sm:text-base font-bold text-[#0B1B3D] leading-snug">{item.title}</h3>
                          <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500 border-y border-slate-100 py-1.5">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-red-600" /> {item.date}</span>
                            {item.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-600" /> {item.location}</span>}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{item.content}</p>
                        </div>
                      </div>

                      {user && user.role === 'admin' && (
                        <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                          <button
                            onClick={() => togglePinNews(item.id)}
                            className={`text-xs font-bold flex items-center gap-1 ${item.isPinned ? 'text-amber-600' : 'text-slate-500 hover:text-amber-600'}`}
                          >
                            <Pin className={`w-3.5 h-3.5 ${item.isPinned ? 'fill-amber-600' : ''}`} />
                            {item.isPinned ? 'Sblocca' : 'Fissa in Alto'}
                          </button>

                          <button onClick={() => handleDeleteNews(item.id)} className="text-red-600 text-xs font-semibold flex items-center gap-1">
                            <Trash2 className="w-3.5 h-3.5" /> Elimina
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SEZIONE SELEZIONATA */}
          {currentSection && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-[#A60F2D] uppercase tracking-wider mb-0.5">
                    <span>{currentSection.code}</span>
                  </div>
                  <h2 className="text-lg sm:text-2xl font-black text-[#0B1B3D]">{currentSection.title}</h2>
                  <p className="text-xs text-slate-500">{currentSection.subtitle}</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTabMode('rules')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeTabMode === 'rules' ? 'bg-[#0B1B3D] text-white shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Articoli
                  </button>
                  <button
                    onClick={() => setActiveTabMode('materials')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeTabMode === 'materials' ? 'bg-[#0B1B3D] text-white shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" /> Documenti ({currentSection.documents?.length || 0})
                  </button>
                </div>
              </div>

              {activeTabMode === 'rules' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{showOnlyFavorites ? 'Articoli preferiti' : 'Tutti gli articoli'}</span>
                      {isSelectingArticles && <span className="font-semibold text-[#0B1B3D]">{selectedArticleIds.length} selezionati</span>}
                    </div>

                    {user && user.role === 'admin' && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingSubsection(null);
                            setFormSectionId(currentSection.id);
                            setFormTitle(''); setFormContent(''); setFormTags(''); setFormMediaUrl('');
                            setSelectedFileName(null);
                            setIsEditingModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0B1B3D] text-white font-bold text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" /> Articolo
                        </button>
                        <button
                          onClick={() => {
                            setBulkImportSectionId(currentSection.id);
                            setIsQuickImportModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800"
                        >
                          <Upload className="w-3.5 h-3.5" /> Importa più articoli
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (isSelectingArticles) setSelectedArticleIds([]);
                            setIsSelectingArticles(prev => !prev);
                          }}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border font-bold text-xs ${isSelectingArticles ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-[#0B1B3D] text-[#0B1B3D] hover:bg-slate-50'}`}
                        >
                          {isSelectingArticles ? <X className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
                          {isSelectingArticles ? 'Annulla selezione' : 'Seleziona'}
                        </button>
                        {isSelectingArticles && selectedArticleIds.length > 0 && (
                          <button
                            type="button"
                            onClick={handleDeleteSelectedArticles}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-700 text-white font-bold text-xs hover:bg-red-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Elimina selezionati
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {filteredSubsections.length === 0 ? (
                    <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-xs text-slate-500 font-semibold">
                      Nessun articolo trovato.
                    </div>
                  ) : (
                    filteredSubsections.map((sub) => {
                      const isOpen = openAccordions[sub.id] ?? false;
                      const isFav = favorites.includes(sub.id);

                      return (
                        <div key={sub.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${selectedArticleIds.includes(sub.id) ? 'border-red-300 ring-1 ring-red-200' : 'border-slate-200'}`}>
                          <div
                            onClick={() => toggleAccordion(sub.id)}
                            className="p-3.5 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 select-none"
                          >
                            <div className="flex items-center gap-2.5">
                              {user && user.role === 'admin' && isSelectingArticles && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); toggleArticleSelection(sub.id); }}
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${selectedArticleIds.includes(sub.id) ? 'border-red-700 bg-red-50 text-red-700' : 'border-slate-300 bg-white text-slate-400 hover:border-slate-500 hover:text-slate-700'}`}
                                  aria-label={selectedArticleIds.includes(sub.id) ? `Deseleziona ${sub.title}` : `Seleziona ${sub.title}`}
                                  aria-pressed={selectedArticleIds.includes(sub.id)}
                                >
                                  {selectedArticleIds.includes(sub.id) ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                                </button>
                              )}
                              <div className={`p-2 rounded-lg shrink-0 ${isOpen ? 'bg-[#0B1B3D] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                <BookOpen className="w-4 h-4" />
                              </div>
                              <div>
                                <h3 className="text-xs sm:text-base font-bold text-[#0B1B3D]">{sub.title}</h3>
                                {sub.tags && (
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {sub.tags.map((tag, idx) => (
                                      <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(sub.id); }}
                                className={`p-1.5 rounded ${isFav ? 'text-amber-500 bg-amber-50' : 'text-slate-400'}`}
                              >
                                <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500' : ''}`} />
                              </button>


                              {user && user.role === 'admin' && (
                                <div className="flex items-center gap-1 border-l border-slate-200 pl-1" onClick={(e) => e.stopPropagation()}>
                                  <button onClick={() => handleEditClick(sub, currentSection.id)} className="p-1 text-blue-600">
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleDeleteSubsection(currentSection.id, sub.id)} className="p-1 text-red-600">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}

                              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-[#0B1B3D]' : ''}`} />
                            </div>
                          </div>

                          {isOpen && (
                            <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-700 leading-relaxed">
                              <div className="whitespace-pre-line text-xs sm:text-sm text-slate-800">
                                {sub.content}
                              </div>

                              {sub.media && sub.media.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-slate-200">
                                  <h4 className="text-[11px] font-bold uppercase text-[#0B1B3D] mb-2 flex items-center gap-1">
                                    <Video className="w-3.5 h-3.5 text-[#A60F2D]" /> Media ed Esempi
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {sub.media.map((item, mIdx) => (
                                      <div key={mIdx} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                        {item.type === 'image' ? (
                                          <img src={item.url} alt={item.caption || 'Media'} className="w-full aspect-video object-cover" />
                                        ) : (
                                          <div
                                            onClick={() => setActiveVideoModal({ url: item.url, caption: item.caption || '', title: sub.title })}
                                            className="aspect-video bg-slate-900 flex items-center justify-center cursor-pointer relative"
                                          >
                                            <div className="w-10 h-10 rounded-full bg-[#A60F2D] text-white flex items-center justify-center shadow-lg">
                                              <Play className="w-4 h-4 fill-white ml-0.5" />
                                            </div>
                                            <span className="absolute bottom-2 right-2 text-[9px] bg-black/80 text-white px-1.5 py-0.5 rounded font-bold">
                                              Video VR
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTabMode === 'materials' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#0B1B3D] uppercase">Documenti Didattici</h3>
                    {user && user.role === 'admin' && (
                      <button onClick={() => setIsDocModalOpen(true)} className="px-3 py-1 rounded-lg bg-[#0B1B3D] text-white font-bold text-xs">
                        + Carica File
                      </button>
                    )}
                  </div>

                  {(!currentSection.documents || currentSection.documents.length === 0) ? (
                    <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-xs text-slate-500">
                      Nessun documento caricato.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentSection.documents.map((doc) => (
                        <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <div className="p-2.5 rounded-lg bg-red-700 text-white font-black text-xs shrink-0">
                              {doc.format}
                            </div>
                            <div>
                              <h4 className="font-bold text-xs sm:text-sm text-[#0B1B3D]">{doc.title}</h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">{doc.description}</p>
                            </div>
                          </div>

                          <a
                            href={doc.url}
                            download={doc.title}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 shrink-0"
                            onClick={(e) => {
                              if (doc.url === '#') { e.preventDefault(); showToast(`Download avviato!`); }
                            }}
                          >
                            <Download className="w-3.5 h-3.5" /> Scarica
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* --- MODALE IMPORTAZIONE RAPIDA ARTICOLI (SOLO ADMIN) --- */}
      <AnimatePresence>
        {isQuickImportModalOpen && user && user.role === 'admin' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-sm">
            <div className="w-full max-w-4xl bg-white rounded-xl border border-slate-200 shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="sticky top-0 z-10 bg-white flex items-center justify-between p-4 sm:p-5 border-b border-slate-200">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0B1B3D]">Importazione rapida articoli</h3>
                  <p className="text-xs text-slate-500 mt-1">Incolla il testo generato dall’AI, controlla un’anteprima e importa gli articoli.</p>
                </div>
                <button type="button" onClick={() => setIsQuickImportModalOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="Chiudi">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 sm:p-5">
                <div className="space-y-3">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h4 className="font-bold text-[#0B1B3D]">Istruzioni da dare all’AI</h4>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(BULK_ARTICLE_PROMPT);
                            showToast('Istruzioni copiate. Incollale nella chat AI insieme al materiale.');
                          } catch {
                            showToast('Copia non disponibile: seleziona e copia le istruzioni qui sotto.');
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-white border border-blue-200 text-blue-800 font-bold hover:bg-blue-100"
                      >
                        Copia istruzioni
                      </button>
                    </div>
                    <p className="text-slate-600 mb-2">Copia queste istruzioni nella chat AI insieme al PDF o al PowerPoint, poi incolla la risposta nel campo accanto.</p>
                    <textarea
                      readOnly
                      value={BULK_ARTICLE_PROMPT}
                      rows={8}
                      onFocus={(e) => e.currentTarget.select()}
                      className="w-full resize-y rounded border border-blue-200 bg-white p-2 font-mono text-[10px] leading-relaxed text-slate-700"
                      aria-label="Formato e istruzioni per l’AI"
                    />
                  </div>

                  <label htmlFor="bulk-import-section" className="block font-bold text-slate-600">Inserisci gli articoli in</label>
                  <select
                    id="bulk-import-section"
                    value={bulkImportSectionId}
                    onChange={(e) => setBulkImportSectionId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-slate-800"
                  >
                    {sections.map(section => <option key={section.id} value={section.id}>{section.title}</option>)}
                  </select>

                  <label htmlFor="bulk-import-text" className="block font-bold text-slate-600">Risposta dell’AI</label>
                  <textarea
                    id="bulk-import-text"
                    value={bulkImportText}
                    onChange={(e) => setBulkImportText(e.target.value)}
                    placeholder={BULK_ARTICLE_TEMPLATE}
                    rows={14}
                    className="w-full bg-slate-50 border border-slate-300 p-3 rounded-lg font-mono text-xs text-slate-800 focus:outline-none focus:border-[#0B1B3D]"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[#0B1B3D]">Anteprima</h4>
                    <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 font-semibold">
                      {parseBulkArticles(bulkImportText).articles.length} articoli validi
                    </span>
                  </div>

                  {parseBulkArticles(bulkImportText).errors.length > 0 && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900 space-y-1" role="status">
                      {parseBulkArticles(bulkImportText).errors.map((error, index) => <p key={index}>{error}</p>)}
                      <p className="font-semibold">Correggi il testo: l’importazione avviene solo se tutti i blocchi sono validi.</p>
                    </div>
                  )}

                  {parseBulkArticles(bulkImportText).articles.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
                      L’anteprima degli articoli apparirà qui dopo aver incollato il testo.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
                      {parseBulkArticles(bulkImportText).articles.map((article, index) => (
                        <div key={index} className="rounded-lg border border-slate-200 p-3">
                          <div className="flex items-start gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold">{index + 1}</span>
                            <div className="min-w-0">
                              <h5 className="font-bold text-slate-800">{article.title}</h5>
                              {article.tags.length > 0 && <p className="mt-1 text-[10px] text-slate-500">Tag: {article.tags.join(', ')}</p>}
                              <p className="mt-2 whitespace-pre-line text-slate-600">{article.content.length > 280 ? `${article.content.slice(0, 280)}…` : article.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleBulkImport} className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white p-4 sm:px-5">
                <button type="button" onClick={() => setIsQuickImportModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-bold">Annulla</button>
                <button
                  type="submit"
                  disabled={!bulkImportText.trim() || parseBulkArticles(bulkImportText).articles.length === 0 || parseBulkArticles(bulkImportText).errors.length > 0}
                  className="px-4 py-2 rounded-lg bg-emerald-700 text-white font-bold hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Importa {parseBulkArticles(bulkImportText).articles.length} articoli
                </button>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODALE CREAZIONE / MODIFICA ARTICOLO --- */}
      <AnimatePresence>
        {isEditingModalOpen && user && user.role === 'admin' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-[#0B1B3D]">
                    {editingSubsection ? 'Modifica Articolo' : 'Nuovo Articolo'}
                  </h3>
                  <p className="text-slate-500 mt-0.5">Inserisci o aggiorna il contenuto del regolamento.</p>
                </div>
                <button type="button" onClick={() => setIsEditingModalOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="Chiudi">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSubsection} className="space-y-3">
                <div>
                  <label htmlFor="article-title" className="block text-slate-600 font-bold mb-1">Titolo *</label>
                  <input id="article-title" type="text" required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-slate-800 focus:outline-none focus:border-[#0B1B3D]" />
                </div>

                <div>
                  <label htmlFor="article-content" className="block text-slate-600 font-bold mb-1">Contenuto *</label>
                  <textarea id="article-content" required rows={9} value={formContent} onChange={(e) => setFormContent(e.target.value)} className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-slate-800 resize-y focus:outline-none focus:border-[#0B1B3D]" />
                </div>

                <div>
                  <label htmlFor="article-tags" className="block text-slate-600 font-bold mb-1">Tag <span className="font-normal text-slate-400">(separati da virgola)</span></label>
                  <input id="article-tags" type="text" value={formTags} onChange={(e) => setFormTags(e.target.value)} placeholder="es. Arbitraggio, Punteggi" className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-slate-800 focus:outline-none focus:border-[#0B1B3D]" />
                </div>

                <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                  <label className="block text-slate-600 font-bold">Media allegato <span className="font-normal text-slate-400">(facoltativo)</span></label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setMediaSourceType('file')} className={`px-3 py-1.5 rounded-md font-bold ${mediaSourceType === 'file' ? 'bg-[#0B1B3D] text-white' : 'bg-slate-100 text-slate-600'}`}>
                      Carica file
                    </button>
                    <button type="button" onClick={() => setMediaSourceType('url')} className={`px-3 py-1.5 rounded-md font-bold ${mediaSourceType === 'url' ? 'bg-[#0B1B3D] text-white' : 'bg-slate-100 text-slate-600'}`}>
                      Inserisci URL
                    </button>
                  </div>
                  {mediaSourceType === 'file' ? (
                    <input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="block w-full text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-semibold" />
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input type="url" value={formMediaUrl} onChange={(e) => setFormMediaUrl(e.target.value)} placeholder="https://..." className="flex-1 bg-slate-50 border border-slate-300 p-2 rounded-lg text-slate-800" />
                      <select value={formMediaType} onChange={(e) => setFormMediaType(e.target.value as 'image' | 'video')} className="bg-slate-50 border border-slate-300 p-2 rounded-lg text-slate-800">
                        <option value="image">Immagine</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                  )}
                  {selectedFileName && <p className="text-slate-500">File selezionato: {selectedFileName}</p>}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button type="button" onClick={() => setIsEditingModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-bold">Annulla</button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-[#0B1B3D] text-white font-bold hover:bg-slate-800">
                    {editingSubsection ? 'Salva modifiche' : 'Salva articolo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="hidden md:block bg-[#0B1B3D] text-slate-400 text-xs py-6 border-t border-slate-800 w-full mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <p className="text-white font-bold">Federazione Italiana Taekwondo © 2026</p>
          <p className="text-[11px] text-slate-400">Regolamento Kyorugi • VR • Poomsae • Freestyle</p>
        </div>
      </footer>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0B1B3D] text-slate-300 border-t border-slate-800 z-40 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveSectionId('home')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors ${
            activeSectionId === 'home' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <HomeIcon className="w-5 h-5" />
          <span className="text-[10px]">News</span>
        </button>

        {sections.map((sec) => (
          <button
            key={sec.id}
            onClick={() => { setActiveSectionId(sec.id); setActiveTabMode('rules'); }}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors ${
              activeSectionId === sec.id ? 'text-amber-400 font-bold' : 'text-slate-400'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px]">{sec.shortTitle}</span>
          </button>
        ))}

        <button
          onClick={() => {
            if (user) {
              openProfilePage();
            } else {
              setAuthMode('login');
              setAuthModalOpen(true);
            }
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors ${
            user ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">{user ? user.firstName : 'Accedi'}</span>
        </button>
      </div>

      {/* --- MODALE PUBBLICAZIONE NUOVA NOTIZIA CON OPTION IN EVIDENZA --- */}
      <AnimatePresence>
        {isNewsModalOpen && user && user.role === 'admin' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-5 shadow-2xl space-y-4 text-xs max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-sm font-bold text-[#0B1B3D]">Pubblica Nuova Notizia</h3>
                <button onClick={() => setIsNewsModalOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSaveNews} className="space-y-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Titolo Notizia *</label>
                  <input type="text" required placeholder="Es. Comunicato Gare" value={newsTitle} onChange={(e) => setNewsTitle(e.target.value)} className="w-full bg-slate-50 border p-2 rounded text-slate-800" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Categoria</label>
                    <select value={newsCategory} onChange={(e) => setNewsCategory(e.target.value)} className="w-full bg-slate-50 border p-2 rounded text-slate-800">
                      <option value="Regionale">Regionale</option>
                      <option value="Nazionale">Nazionale</option>
                      <option value="Regolamento">Regolamento</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Luogo / Sede</label>
                    <input type="text" placeholder="Es. PalaVesuvio" value={newsLocation} onChange={(e) => setNewsLocation(e.target.value)} className="w-full bg-slate-50 border p-2 rounded text-slate-800" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Contenuto *</label>
                  <textarea required rows={4} placeholder="Inserisci il testo completo..." value={newsContent} onChange={(e) => setNewsContent(e.target.value)} className="w-full bg-slate-50 border p-2 rounded text-slate-800" />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">URL Immagine (Opzionale)</label>
                  <input type="text" placeholder="https://..." value={newsImage} onChange={(e) => setNewsImage(e.target.value)} className="w-full bg-slate-50 border p-2 rounded text-slate-800" />
                </div>

                <div className="pt-1">
                  <label onClick={() => setNewsIsPinned(!newsIsPinned)} className="flex items-center gap-2 cursor-pointer font-bold text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 select-none">
                    {newsIsPinned ? <CheckSquare className="w-4 h-4 text-amber-600" /> : <Square className="w-4 h-4 text-amber-400" />}
                    <span className="flex items-center gap-1">
                      <Pin className="w-3.5 h-3.5 text-amber-600" /> Fissa la notizia al primo posto (In Evidenza)
                    </span>
                  </label>
                </div>

                <div className="flex justify-end pt-3 border-t">
                  <button type="submit" className="px-4 py-2 rounded bg-[#0B1B3D] text-white font-bold">Pubblica</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODALE LOGIN / REGISTRAZIONE --- */}
      <AnimatePresence>
        {authModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-xl border border-slate-200 p-5 shadow-2xl relative text-xs max-h-[90vh] overflow-y-auto">
              <button type="button" onClick={() => setAuthModalOpen(false)} className="absolute top-4 right-4 z-10 text-slate-500" aria-label="Chiudi"><X className="w-5 h-5" /></button>
              <div className="flex gap-2 mb-4 pr-8">
                <button type="button" onClick={() => setAuthMode('login')} className={`flex-1 rounded-lg px-3 py-2 font-bold ${authMode === 'login' ? 'bg-[#0B1B3D] text-white' : 'bg-slate-100 text-slate-600'}`}>Accedi</button>
                <button type="button" onClick={() => setAuthMode('register')} className={`flex-1 rounded-lg px-3 py-2 font-bold ${authMode === 'register' ? 'bg-[#0B1B3D] text-white' : 'bg-slate-100 text-slate-600'}`}>Registrati</button>
              </div>
              {authMode === 'login' ? (
                <SignIn routing="hash" signUpUrl="/sign-up" />
              ) : (
                <SignUp routing="hash" signInUrl="/sign-in" />
              )}
              <p className="mt-3 text-center text-[10px] text-slate-500">Il recupero password invia un codice all’email verificata.</p>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* VIDEO PLAYER MODAL */}
      <AnimatePresence>
        {activeVideoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-white rounded-xl overflow-hidden shadow-2xl">
              <div className="p-3 bg-[#0B1B3D] text-white flex items-center justify-between">
                <h3 className="text-xs font-bold flex items-center gap-2"><Video className="w-4 h-4 text-red-400" /> VR Replay</h3>
                <button onClick={() => setActiveVideoModal(null)} className="text-slate-300"><X className="w-5 h-5" /></button>
              </div>
              <div className="aspect-video bg-black">
                <video src={activeVideoModal.url} controls autoPlay className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}