'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SignIn, useClerk, useUser } from '@clerk/nextjs';
import { getAccountApprovalStatus } from '../lib/account-approval';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  User,
  LogOut,
  Star,
  ChevronDown,
  Video,
  Swords,
  PersonStanding,
  Plus,
  Trash2,
  Edit3,
  X,
  Play,
  BookOpen,
  Sparkles,
  Upload,
  Link as LinkIcon,
  Bell,
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
  Eye,
  EyeOff,
  ArrowRightLeft,
  Pin,
  AlertTriangle
} from 'lucide-react';

import { RegistrationForm, authAppearance } from './registration-form';
import { formatPersonName } from '../lib/format-person-name';

import { isDemoArticle } from '../lib/demo-articles';

const MAX_ARTICLE_SUBTITLE_LENGTH = 100;

function getArticleSubtitle(article: { description?: string }) {
  return typeof article.description === 'string' ? article.description.trim() : '';
}

import InstallAppButton from './install-app-button';

type PortalNotice = { id: string; title: string; kind: 'News' | 'Articolo'; at: number };

type AdminApprovalRequest = {
  id: string;
  name: string;
  email: string;
  createdAt: number;
  status: 'pending' | 'rejected';
};

const BULK_ARTICLE_TEMPLATE = `=== ARTICOLO ===
Titolo: Argomento dell'articolo, senza numerazione
Tag: tag1, tag2
Fonte: regolamento, documento o articolo di riferimento (facoltativo)
Testo:
Testo completo dell'articolo.
=== FINE ARTICOLO ===`;

const BULK_ARTICLE_PROMPT = `Estrai dal materiale fornito gli articoli del regolamento. Le descrizioni devono essere ampie e dettagliate, ma ogni informazione deve essere esplicitamente supportata dal materiale: non inventare, non dedurre, non completare con conoscenze esterne. Questa regola è fondamentale. Se un dato, un requisito o un'eccezione non è presente o non è leggibile con certezza, omettilo; non indovinare. Mantieni fedelmente numeri, condizioni, eccezioni, unità di misura, termini e ambito di applicazione. Non sintetizzare al punto da perdere dettagli rilevanti.

Dividi il testo in articoli autonomi e restituisci SOLO i blocchi nel formato seguente. Ripeti il blocco per ogni articolo. Nel testo dell'articolo, usa # Titolo per un titolo interno, ## Sottotitolo per un sottotitolo e ### Sezione per una sotto-sezione del sottotitolo, ciascuno da solo su una riga; il sito li mostrerà con gerarchia visiva distinta. Il campo Titolo deve contenere solo l'argomento specifico: non inserire numeri o diciture come “Articolo 1”, “Articolo 2” o “Articolo 1 - ...”. Se la fonte è un regolamento ufficiale, nel campo Fonte cita il numero o riferimento dell'articolo originale solo quando è chiaramente presente nel materiale. Non inventare numeri o riferimenti; se non sono presenti, lascia Fonte vuota oppure indica soltanto il nome della fonte fornita.

Quando il contenuto richiede un elenco, usa il formato riconosciuto dal sito: per i punti elenco scrivi ESATTAMENTE “- ” all'inizio di ogni elemento; per un elenco numerato scrivi “1. ”, “2. ”, “3. ” e continua la numerazione in ordine. Metti ogni elemento su una riga separata e lascia una riga vuota prima e dopo l'elenco. Il sito mostrerà questi elementi come un vero elenco puntato o numerato. Non usare simboli, numerazioni, rientri o formati alternativi, e non mettere più elementi sulla stessa riga. Usa un elenco solo se la fonte lo giustifica. Se una linea separatrice aiuta la lettura, scrivi esattamente --- da solo su una riga: il sito lo mostra come una linea sottile. I tag sono facoltativi. Non usare i marcatori di inizio o fine articolo dentro il testo.

${BULK_ARTICLE_TEMPLATE}`;

function parseBulkArticles(source: string) {
  const blocks = source.split(/^=== ARTICOLO ===\s*$/im).slice(1);
  const articles: { title: string; tags: string[]; source: string; content: string }[] = [];
  const errors: string[] = [];

  if (blocks.length === 0 && source.trim()) {
    return { articles, errors: ['Non trovo blocchi. Usa il marcatore === ARTICOLO === per ogni articolo.'] };
  }

  blocks.forEach((block, index) => {
    const title = block.match(/^Titolo:\s*(.+)$/im)?.[1]?.trim();
    const tagLine = block.match(/^Tag:\s*(.*)$/im)?.[1] ?? '';
    const articleSource = block.match(/^Fonte:\s*(.*)$/im)?.[1]?.trim() ?? '';
    const contentMatch = block.match(/^Testo:\s*\r?\n([\s\S]*?)\s*=== FINE ARTICOLO ===\s*$/im);
    const content = contentMatch?.[1]?.trim();

    if (!title || !content) {
      errors.push(`Articolo ${index + 1}: manca il Titolo, il Testo o il marcatore === FINE ARTICOLO ===.`);
      return;
    }

    articles.push({
      title,
      tags: tagLine.split(',').map(tag => tag.trim()).filter(Boolean),
      source: articleSource,
      content
    });
  });

  return { articles, errors };
}

const DEMO_DOCUMENT_IDS = new Set(['doc-k1', 'doc-k2', 'doc-vr1', 'doc-p1', 'doc-f1']);

function removeDemoContent(sections: any[]) {
  return sections.map(section => ({
    ...section,
    subsections: (section.subsections || []).filter((article: { id: string }) => !isDemoArticle(article.id)),
    documents: (section.documents || []).filter((document: any) => !DEMO_DOCUMENT_IDS.has(document.id))
  }));
}

const LEGACY_ARTICLE_ADDED_AT = '2026-09-01T12:00:00.000Z';

function withLegacyArticleDates(sections: any[]) {
  return sections.map(section => ({
    ...section,
    subsections: (section.subsections || []).map((article: any) =>
      article.addedAt ? article : { ...article, addedAt: LEGACY_ARTICLE_ADDED_AT }
    )
  }));
}

function findSimilarArticles(article: { title: string; tags?: string[] }, existing: any[]) {
  const stopWords = new Set(['del', 'della', 'delle', 'dello', 'degli', 'dei', 'che', 'con', 'per', 'una', 'uno', 'gli', 'tra', 'dal', 'alla', 'alle', 'nel', 'nella', 'sul', 'sulla', 'articolo', 'regola']);
  const terms = (value: string) => new Set(value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('it').split(/[^a-z0-9]+/).filter(word => word.length > 2 && !stopWords.has(word)));
  const incoming = terms([article.title, ...(article.tags || [])].join(' '));
  if (incoming.size === 0) return [];
  return existing.map(item => {
    const candidate = terms([item.title, ...(item.tags || [])].join(' '));
    const intersection = [...incoming].filter(word => candidate.has(word)).length;
    const union = new Set([...incoming, ...candidate]).size;
    return { item, score: union ? intersection / union : 0 };
  }).filter(({ item, score }) =>
    score >= 0.4 || (article.title.toLocaleLowerCase('it').includes(item.title.toLocaleLowerCase('it')) && item.title.length > 5)
  ).sort((a, b) => b.score - a.score).slice(0, 4);
}

function getShowcaseEmbedUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const videoId = url.searchParams.get('v') || url.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1];
      return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
    }
    if (host === 'vimeo.com') {
      const videoId = url.pathname.match(/\/(\d+)/)?.[1];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
    if (host === 'instagram.com' || host.endsWith('.instagram.com')) {
      const post = url.pathname.match(/^\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/);
      return post ? `https://www.instagram.com/${url.pathname.split('/')[1]}/${post[1]}/embed` : null;
    }
    if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) {
      const videoId = url.pathname.match(/\/video\/(\d+)/)?.[1];
      return videoId ? `https://www.tiktok.com/player/v1/${videoId}?description=1&music_info=1` : null;
    }
  } catch {}
  return null;
}
function renderFormattedText(content: string, onArticleLink?: (id: string) => void): React.ReactNode[] {
  const formattedToken = /(\[[^\]]+\]\([^\s)]+\)|https?:\/\/[^\s<]+|\*\*[\s\S]+?\*\*|\*[^*\n]+\*|<u>[\s\S]+?<\/u>)/gi;
  return content.split(formattedToken).map((part, index) => {
    const markdownLink = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (markdownLink) {
      const [, label, href] = markdownLink;
      if (href.startsWith('#article:')) {
        const articleId = decodeURIComponent(href.slice('#article:'.length));
        return <a key={index} href={href} onClick={event => { event.preventDefault(); onArticleLink?.(articleId); }} className="font-semibold text-blue-700 underline decoration-blue-400 underline-offset-2 hover:text-blue-900">{label}</a>;
      }
      if (/^https?:\/\//i.test(href)) {
        return <a key={index} href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 underline decoration-blue-400 underline-offset-2 hover:text-blue-900">{label}</a>;
      }
    }
    if (/^https?:\/\//i.test(part)) {
      const url = part.replace(/[.,!?;:]+$/, '');
      const trailing = part.slice(url.length);
      return <React.Fragment key={index}><a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline decoration-blue-400 underline-offset-2 hover:text-blue-900">{url}</a>{trailing}</React.Fragment>;
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={index}>{renderFormattedText(part.slice(2, -2), onArticleLink)}</strong>;
    }
    if (part.startsWith('<u>') && part.endsWith('</u>') && part.length > 7) {
      return <u key={index}>{renderFormattedText(part.slice(3, -4), onArticleLink)}</u>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={index}>{renderFormattedText(part.slice(1, -1), onArticleLink)}</em>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function renderRichContent(content: string, onArticleLink?: (id: string) => void): React.ReactNode[] {
  type ListItem = { text: string; children: ListBlock[] };
  type ListBlock = { type: 'unordered' | 'ordered'; indent: number; start: number; items: ListItem[] };
  type RenderBlock = { type: 'paragraph'; lines: string[] } | { type: 'list'; list: ListBlock } | { type: 'divider' } | { type: 'heading'; level: 1 | 2 | 3; text: string };
  const blocks: RenderBlock[] = [];
  const listStack: Array<{ indent: number; list: ListBlock; container: ListBlock[] }> = [];
  let paragraph: string[] | null = null;

  for (const line of content.split(/\r?\n/)) {
    const heading = line.match(/^\s*(#{1,3})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      if (paragraph) {
        blocks.push({ type: 'paragraph', lines: paragraph });
        paragraph = null;
      }
      listStack.length = 0;
      blocks.push({ type: 'heading', level: heading[1].length as 1 | 2 | 3, text: heading[2] });
      continue;
    }
    if (/^---{1,}$/.test(line.trim())) {
      if (paragraph) {
        blocks.push({ type: 'paragraph', lines: paragraph });
        paragraph = null;
      }
      listStack.length = 0;
      blocks.push({ type: 'divider' });
      continue;
    }
    const match = line.match(/^(\s*)([-*+•–—]|\d+[.)]|[a-zA-Z][.)])\s+(.+)$/);
    if (match) {
      if (paragraph) {
        blocks.push({ type: 'paragraph', lines: paragraph });
        paragraph = null;
      }
      const indent = match[1].replace(/\t/g, '    ').length;
      const marker = match[2];
      const listType = /^\d/.test(marker) || /^[a-zA-Z][.)]$/.test(marker) ? 'ordered' : 'unordered';
      const numberStart = /^\d+/.test(marker) ? Number.parseInt(marker, 10) : 1;

      while (listStack.length > 0 && indent < listStack[listStack.length - 1].indent) listStack.pop();
      let stackEntry = listStack[listStack.length - 1];
      if (!stackEntry || indent > stackEntry.indent) {
        const parentItem = stackEntry?.list.items[stackEntry.list.items.length - 1];
        const container = parentItem ? parentItem.children : [];
        const list: ListBlock = { type: listType, indent, start: numberStart, items: [] };
        if (parentItem) container.push(list);
        else blocks.push({ type: 'list', list });
        stackEntry = { indent, list, container };
        listStack.push(stackEntry);
      } else if (stackEntry.list.type !== listType) {
        const list: ListBlock = { type: listType, indent, start: numberStart, items: [] };
        if (listStack.length === 1) blocks.push({ type: 'list', list });
        else stackEntry.container.push(list);
        stackEntry = { indent, list, container: stackEntry.container };
        listStack[listStack.length - 1] = stackEntry;
      }
      stackEntry.list.items.push({ text: match[3], children: [] });
      continue;
    }

    if (!line.trim()) {
      if (!listStack.length && paragraph) {
        blocks.push({ type: 'paragraph', lines: paragraph });
        paragraph = null;
      }
      continue;
    }

    if (listStack.length) listStack.length = 0;
    if (!paragraph) paragraph = [];
    paragraph.push(line);
  }

  if (paragraph) blocks.push({ type: 'paragraph', lines: paragraph });

  const renderList = (list: ListBlock, key: string): React.ReactNode => {
    const items = list.items.map((item, index) => (
      <li key={index} className="pl-1">
        {renderFormattedText(item.text, onArticleLink)}
        {item.children.map((child, childIndex) => renderList(child, `${key}-${index}-${childIndex}`))}
      </li>
    ));
    return list.type === 'ordered'
      ? <ol key={key} start={list.start} className="my-1 list-decimal space-y-1 pl-6 marker:font-semibold marker:text-slate-500">{items}</ol>
      : <ul key={key} className="my-1 list-disc space-y-1 pl-6 marker:text-slate-500">{items}</ul>;
  };

  return blocks.map((block, index) => block.type === 'divider'
    ? <hr key={index} aria-hidden="true" className="my-4 border-0 border-t border-slate-300" />
    : block.type === 'heading'
      ? block.level === 1
        ? <h3 key={index} className="mb-2 mt-4 text-base font-bold text-[#0B1B3D]">{renderFormattedText(block.text, onArticleLink)}</h3>
        : block.level === 2
          ? <h4 key={index} className="mb-1 mt-3 text-sm font-semibold text-slate-800">{renderFormattedText(block.text, onArticleLink)}</h4>
          : <h5 key={index} className="mb-1 mt-2 text-sm font-medium text-slate-600">{renderFormattedText(block.text, onArticleLink)}</h5>
      : block.type === 'list'
        ? renderList(block.list, `list-${index}`)
        : <p key={index} className="my-1">{block.lines.map((line, lineIndex) => <React.Fragment key={lineIndex}>{lineIndex > 0 && <br />}{renderFormattedText(line, onArticleLink)}</React.Fragment>)}</p>
  );
}

function reconcileNewsLists(cloudNews: any[], deviceNews: any[], lastSyncedNews: any[]) {
  const cloudById = new Map<string, any>(cloudNews.map(item => [item.id, item]));
  const deviceById = new Map<string, any>(deviceNews.map(item => [item.id, item]));
  const snapshotById = new Map<string, any>(lastSyncedNews.map(item => [item.id, item]));

  for (const [id, priorItem] of snapshotById) {
    const deviceItem = deviceById.get(id);
    const cloudItem = cloudById.get(id);
    if (!deviceItem && cloudItem && JSON.stringify(cloudItem) === JSON.stringify(priorItem)) {
      cloudById.delete(id);
    } else if (deviceItem && JSON.stringify(deviceItem) !== JSON.stringify(priorItem)) {
      cloudById.set(id, deviceItem);
    }
  }
  for (const [id, deviceItem] of deviceById) {
    if (!snapshotById.has(id)) cloudById.set(id, deviceItem);
  }

  return [...cloudById.values()];
}

// --- DATI DI DEFAULT ---
const DEFAULT_SECTIONS: Array<{
  id: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  code: string;
  subsections: Array<{ id: string; title: string; content: string; description?: string; tags: string[]; media: Array<{ type: string; url: string; caption: string }> }>;
  documents: Array<{ id: string; title: string; format: string; size: string; date: string; description: string; url: string }>;
}> = [
  {
    id: 'kyorugi',
    title: 'Combattimento',
    shortTitle: 'Kyorugi',
    subtitle: 'Kyorugi (World Taekwondo / FITA)',
    code: 'KY-2026',
    subsections: [],
    documents: []
  },
  {
    id: 'video-replay',
    title: 'Video Replay',
    shortTitle: 'VR',
    subtitle: 'Protocollo Ufficiale di Revisione Video',
    code: 'VR-2026',
    subsections: [],
    documents: []
  },
  {
    id: 'poomsae',
    title: 'Forme',
    shortTitle: 'Poomsae',
    subtitle: 'Poomsae Ufficiali & Riconosciute',
    code: 'PO-2026',
    subsections: [],
    documents: []
  },
  {
    id: 'freestyle',
    title: 'Freestyle',
    shortTitle: 'Freestyle',
    subtitle: 'Poomsae Freestyle e Acrobatica',
    code: 'FR-2026',
    subsections: [],
    documents: []
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
      documents: cloudSection?.documents ?? deviceSection?.documents ?? [],
      showcaseVideos: cloudSection?.showcaseVideos ?? deviceSection?.showcaseVideos ?? [],
      showcaseGroupOrder: cloudSection?.showcaseGroupOrder ?? deviceSection?.showcaseGroupOrder ?? []
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
      documents: [...documents.values()],
      showcaseVideos: cloudSection.showcaseVideos ?? deviceSection.showcaseVideos ?? [],
      showcaseGroupOrder: cloudSection.showcaseGroupOrder ?? deviceSection.showcaseGroupOrder ?? []
    };
  });
}

export default function FitaTaekwondoApp() {
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [isSectionsLoaded, setIsSectionsLoaded] = useState(false);
  const articleSyncEtagRef = useRef<string | null>(null);
  const lastSyncedSectionsRef = useRef<string | null>(null);
  const articleSyncAvailableRef = useRef(false);
  const [newsList, setNewsList] = useState<any[]>([]);
  const [isNewsLoaded, setIsNewsLoaded] = useState(false);
  const newsSyncEtagRef = useRef<string | null>(null);
  const lastSyncedNewsRef = useRef<string | null>(null);
  const newsSyncAvailableRef = useRef(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [articleSort, setArticleSort] = useState<'custom' | 'title-asc' | 'title-desc' | 'date-asc' | 'date-desc' | 'favorites-first'>('custom');
  const [prioritizeSuggested, setPrioritizeSuggested] = useState(true);
  const [bulkImportReviewItems, setBulkImportReviewItems] = useState<Array<{ article: any; matches: Array<{ title: string; section: string; score: number }>; include: boolean }> | null>(null);
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<string>('Tutti');

  const [activeSectionId, setActiveSectionId] = useState('home');
  const [activeTabMode, setActiveTabMode] = useState<'rules' | 'materials' | 'showcase'>('rules');

  const [searchQuery, setSearchQuery] = useState('');
  const articleSearchInputRef = useRef<HTMLInputElement>(null);
  const [articleTextSize, setArticleTextSize] = useState(16);

  useEffect(() => {
    try {
      const size = Number(window.localStorage.getItem('tkd_article_text_size'));
      if ([14, 16, 18, 20, 22, 24].includes(size)) setArticleTextSize(size);
    } catch {}
  }, []);

  const changeArticleTextSize = (step: -2 | 2) => {
    const size = Math.max(14, Math.min(24, articleTextSize + step));
    setArticleTextSize(size);
    try { window.localStorage.setItem('tkd_article_text_size', String(size)); } catch {}
  };
  const [isArticleSearchFocused, setIsArticleSearchFocused] = useState(false);
  const [isSelectingArticles, setIsSelectingArticles] = useState(false);
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([]);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationSeenAt, setNotificationSeenAt] = useState(0);
  const [dismissedNoticeIds, setDismissedNoticeIds] = useState<string[]>([]);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushStatus, setPushStatus] = useState('');
  const [notificationItems, setNotificationItems] = useState<PortalNotice[]>([]);
  const [devicePushEnabled, setDevicePushEnabled] = useState(false);

  const [adminMode, setAdminMode] = useState(true);

  const [user, setUser] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'user' | 'admin';
    region: string;
  } | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isApprovalPanelOpen, setIsApprovalPanelOpen] = useState(false);
  const [approvalFilter, setApprovalFilter] = useState<'pending' | 'rejected'>('pending');
  const [approvalRequests, setApprovalRequests] = useState<AdminApprovalRequest[]>([]);
  const [approvalRequestsLoading, setApprovalRequestsLoading] = useState(false);
  const [approvalRequestsError, setApprovalRequestsError] = useState<string | null>(null);
  const [approvalRequestBusyId, setApprovalRequestBusyId] = useState<string | null>(null);


  const [activeVideoModal, setActiveVideoModal] = useState<{ url: string; caption: string; title: string } | null>(null);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [showcaseFormOpen, setShowcaseFormOpen] = useState(false);
  const [editingShowcaseVideoId, setEditingShowcaseVideoId] = useState<string | null>(null);
  const [showcaseTitle, setShowcaseTitle] = useState('');
  const [showcaseUrl, setShowcaseUrl] = useState('');
  const [showcaseComment, setShowcaseComment] = useState('');
  const [showcaseGroup, setShowcaseGroup] = useState('');
  const [movingArticle, setMovingArticle] = useState<{ id: string; title: string; sourceSectionId: string } | null>(null);
  const [moveTargetSectionId, setMoveTargetSectionId] = useState('');

  // Form Articoli / News / Documenti
  const [editingSubsection, setEditingSubsection] = useState<any | null>(null);
  const [formSectionId, setFormSectionId] = useState('kyorugi');
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formSuggested, setFormSuggested] = useState(false);
  const articleContentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const newsContentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [formTags, setFormTags] = useState('');
  const [formSource, setFormSource] = useState('');
  const [mediaSourceType, setMediaSourceType] = useState<'url' | 'file'>('file');
  const [formMediaUrl, setFormMediaUrl] = useState('');
  const [formMediaType, setFormMediaType] = useState<'image' | 'video'>('image');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const articleMediaInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingArticleMedia, setIsUploadingArticleMedia] = useState(false);
  const [isQuickImportModalOpen, setIsQuickImportModalOpen] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [bulkImportSectionId, setBulkImportSectionId] = useState('kyorugi');

  const [newsTitle, setNewsTitle] = useState('');
  const [newsCategory, setNewsCategory] = useState('Regionale');
  const [newsLocation, setNewsLocation] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsImage, setNewsImage] = useState('');
  const [newsImageFile, setNewsImageFile] = useState<File | null>(null);
  const [newsPublishing, setNewsPublishing] = useState(false);
  const [newsIsPinned, setNewsIsPinned] = useState(false);

  const [docTitle, setDocTitle] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [docFormat, setDocFormat] = useState('PDF');
  const [docFileName, setDocFileName] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const docFileInputRef = useRef<HTMLInputElement | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { isLoaded: clerkLoaded, user: clerkUser } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    if (!clerkLoaded || !clerkUser || getAccountApprovalStatus(clerkUser) !== 'approved') return;
    let active = true;
    let deviceSections = DEFAULT_SECTIONS;
    const savedSecs = localStorage.getItem('tkd_sections');
    if (savedSecs) {
      try {
        const parsed = JSON.parse(savedSecs);
        if (Array.isArray(parsed)) deviceSections = parsed;
      } catch {}
    }
    deviceSections = removeDemoContent(withLegacyArticleDates(deviceSections));
    setSections(deviceSections);

    // Remove the old per-device secret; admin access is checked by Clerk on the server.
    localStorage.removeItem('tkd_article_sync_key');

    localStorage.removeItem('tkd_news');
    fetch('/api/news', { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Shared news unavailable');
        return response.json();
      })
      .then((result: { news?: any[] | null; etag?: string | null }) => {
        if (!active) return;
        newsSyncAvailableRef.current = true;
        newsSyncEtagRef.current = result.etag ?? null;
        const sharedNews = Array.isArray(result.news) ? result.news : null;
        const resolvedNews = sharedNews ?? [];
        lastSyncedNewsRef.current = sharedNews ? JSON.stringify(sharedNews) : null;
        setNewsList(resolvedNews);
        setIsNewsLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        newsSyncAvailableRef.current = false;
        setNewsList([]);
        setIsNewsLoaded(true);
        showToast('Archivio news condiviso non raggiungibile. Riprova tra poco.');
      });
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
        const rawCloudSections = Array.isArray(result.sections) ? result.sections : null;
        lastSyncedSectionsRef.current = rawCloudSections ? JSON.stringify(rawCloudSections) : null;
        const cloudSections = rawCloudSections ? removeDemoContent(withLegacyArticleDates(rawCloudSections)) : null;

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
  }, [clerkLoaded, clerkUser?.id, clerkUser?.publicMetadata.role, clerkUser?.publicMetadata.approvalStatus]);

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
              ? reconcileArticleSections(removeDemoContent(latest.sections), sections, priorSnapshot)
              : mergeArticleSections(removeDemoContent(latest.sections), sections));
          }
          showToast('Ho unito gli aggiornamenti recenti. Attendi un istante per completare la sincronizzazione.');
          return;
        }
        if (!response.ok) {
          const failure = await response.json().catch(() => null);
          const details = failure?.stage ? ` (${failure.stage})` : '';
          throw new Error(`${failure?.error || 'Non è stato possibile sincronizzare gli articoli.'}${details}`);
        }

        const result = await response.json();
        articleSyncEtagRef.current = result.etag ?? null;
        lastSyncedSectionsRef.current = serializedSections;
        localStorage.setItem('tkd_articles_synced_v1', 'true');
        localStorage.setItem('tkd_articles_last_synced_v1', serializedSections);
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Sincronizzazione non riuscita. Riprova; se continua, aggiorna la pagina.');
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [sections, isSectionsLoaded, user?.role]);
  useEffect(() => {
    if (!isNewsLoaded) return;
    const serializedNews = JSON.stringify(newsList);
    localStorage.setItem('tkd_news', serializedNews);
    if (!newsSyncAvailableRef.current || user?.role !== 'admin' || serializedNews === lastSyncedNewsRef.current) return;

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/news', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ news: newsList, etag: newsSyncEtagRef.current })
        });
        if (response.status === 409) {
          const latest = await response.json();
          newsSyncEtagRef.current = latest.etag ?? null;
          const cloudNews = Array.isArray(latest.news) ? latest.news : [];
          const snapshot = lastSyncedNewsRef.current ? JSON.parse(lastSyncedNewsRef.current) : [];
          const mergedNews = reconcileNewsLists(cloudNews, newsList, snapshot);
          lastSyncedNewsRef.current = JSON.stringify(cloudNews);
          if (JSON.stringify(mergedNews) !== JSON.stringify(cloudNews)) setNewsList(mergedNews);
          return;
        }
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.error || 'Impossibile salvare le news condivise.');
        newsSyncEtagRef.current = result.etag ?? null;
        lastSyncedNewsRef.current = serializedNews;
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Impossibile salvare le news condivise.');
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [newsList, isNewsLoaded, user?.role]);
  useEffect(() => { localStorage.setItem('tkd_favorites', JSON.stringify(favorites)); }, [favorites]);
  const isAccountAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAccountAdmin) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('richieste') !== '1') return;
    url.searchParams.delete('richieste');
    window.history.replaceState(window.history.state, '', url);
    setAdminMode(true);
    setApprovalFilter('pending');
    setIsApprovalPanelOpen(true);
  }, [isAccountAdmin]);

  useEffect(() => {
    if (!isAccountAdmin) return;
    let active = true;
    setApprovalRequestsLoading(true);
    setApprovalRequestsError(null);
    fetch('/api/admin/approvals', { cache: 'no-store', credentials: 'same-origin' })
      .then(async response => {
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.error || 'Impossibile caricare le richieste.');
        return result;
      })
      .then(result => {
        if (active) setApprovalRequests(Array.isArray(result.requests) ? result.requests : []);
      })
      .catch(error => {
        if (active) setApprovalRequestsError(error instanceof Error ? error.message : 'Impossibile caricare le richieste.');
      })
      .finally(() => { if (active) setApprovalRequestsLoading(false); });
    return () => { active = false; };
  }, [isAccountAdmin]);

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

  const canReadNotifications = Boolean(clerkUser && getAccountApprovalStatus(clerkUser) === 'approved');
  const noticeStorageKey = clerkUser ? `tkd_notice_seen_${clerkUser.id}` : '';

  useEffect(() => {
    setNotificationSeenAt(0);
    setNotificationItems([]);
    setDismissedNoticeIds([]);
    setPushStatus('');
    try {
      const dismissed: unknown = JSON.parse(localStorage.getItem(noticeStorageKey + '_dismissed') || '[]');
      if (Array.isArray(dismissed)) setDismissedNoticeIds(dismissed.filter(id => typeof id === 'string'));
      if (noticeStorageKey) setNotificationSeenAt(Number(localStorage.getItem(noticeStorageKey)) || 0);
    } catch {}
  }, [noticeStorageKey]);

  useEffect(() => {
    if (!noticeStorageKey || !canReadNotifications) return;
    let active = true;
    const refresh = async () => {
      if (document.visibilityState === 'hidden') return;
      const read = async (path: string) => {
        const response = await fetch(path, { cache: 'no-store' });
        if (!response.ok) throw new Error('Notifiche non disponibili');
        return response.json();
      };
      try {
        const [articles, news] = await Promise.all([
          read('/api/articles'),
          read('/api/news')
        ]);
        const notices: PortalNotice[] = [];
        for (const section of articles.sections ?? []) {
          if (section.hidden) continue;
          for (const article of section.subsections) {
            const at = Date.parse(article.notifiedAt);
            if (!article.hidden && Number.isFinite(at)) {
              notices.push({ id: `article-${article.id}`, kind: 'Articolo', title: article.title, at });
            }
          }
        }
        for (const item of news?.news ?? []) {
          const at = Date.parse(item.publishedAt);
          if (Number.isFinite(at)) notices.push({ id: `news-${item.id}`, kind: 'News', title: item.title, at });
        }
        if (active) setNotificationItems(notices.sort((a, b) => b.at - a.at).slice(0, 30));
      } catch {}
    };
    void refresh();
    const timer = window.setInterval(refresh, 90_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [noticeStorageKey, canReadNotifications, notificationsOpen]);

  const visibleNotices = notificationItems.filter(item => !dismissedNoticeIds.includes(item.id));
  const unreadNotices = visibleNotices.filter(item => item.at > notificationSeenAt).length;

  const dismissNotices = (ids: string[]) => {
    const next = [...new Set([...dismissedNoticeIds, ...ids])].slice(-500);
    setDismissedNoticeIds(next);
    try { localStorage.setItem(noticeStorageKey + '_dismissed', JSON.stringify(next)); } catch {}
  };

  useEffect(() => {
    if (!canReadNotifications || !noticeStorageKey || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
    let active = true;
    void navigator.serviceWorker.getRegistration('/')
      .then(async registration => {
        const subscription = await registration?.pushManager.getSubscription();
        if (!active) return;
        setDevicePushEnabled(Boolean(subscription));
        if (!subscription) return;
        const migrationKey = noticeStorageKey + '_push_payload_v1';
        try { if (localStorage.getItem(migrationKey) === subscription.endpoint) return; } catch {}
        const response = await fetch('/api/news-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription.toJSON()),
        });
        if (response.ok && active) {
          try { localStorage.setItem(migrationKey, subscription.endpoint); } catch {}
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [canReadNotifications, noticeStorageKey, notificationsOpen]);

  const toggleDevicePush = async () => {
    if (pushBusy) return;
    if (!('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window)) {
      setPushStatus('Se usi iPhone o iPad, aggiungi il sito alla schermata Home e aprilo dall’icona. Sugli altri dispositivi usa un browser con supporto Web Push.');
      return;
    }
    setPushBusy(true);
    setPushStatus('');
    try {
      if (devicePushEnabled) {
        const registration = await navigator.serviceWorker.getRegistration('/');
        const subscription = await registration?.pushManager.getSubscription();
        if (subscription && !(await subscription.unsubscribe())) throw new Error('Impossibile disattivare le notifiche su questo dispositivo.');
        setDevicePushEnabled(false);
        setPushStatus('Notifiche di sistema disattivate su questo dispositivo.');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushStatus('Consenti le notifiche nelle impostazioni del browser per attivarle.');
        return;
      }
      const keyResponse = await fetch('/api/news-push', { cache: 'no-store' });
      const keyData = await keyResponse.json();
      if (!keyResponse.ok || typeof keyData.publicKey !== 'string') throw new Error(keyData.error || 'Chiave push non disponibile.');
      await navigator.serviceWorker.register('/news-push-sw.js');
      const registration = await navigator.serviceWorker.ready;
      const base64 = keyData.publicKey.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const applicationServerKey = Uint8Array.from(atob(padded), character => character.charCodeAt(0));
      const subscription = await registration.pushManager.getSubscription()
        ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
      const result = await fetch('/api/news-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!result.ok) {
        const failure = await result.json().catch(() => null);
        throw new Error(failure?.error || 'Registrazione del dispositivo non riuscita.');
      }
      setDevicePushEnabled(true);
      setPushStatus('Notifiche di sistema attive su questo dispositivo.');
    } catch (error) {
      setPushStatus(error instanceof Error ? error.message : 'Impossibile attivare le notifiche su questo dispositivo.');
    } finally {
      setPushBusy(false);
    }
  };

  const markNoticesRead = () => {
    const latest = Math.max(notificationSeenAt, ...visibleNotices.map(item => item.at));
    setNotificationSeenAt(latest);
    try { localStorage.setItem(noticeStorageKey, String(latest)); } catch {}
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

  const handleApprovalAction = async (request: AdminApprovalRequest, action: 'approve' | 'reject') => {
    setApprovalRequestBusyId(request.id);
    try {
      const response = await fetch('/api/admin/approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ userId: request.id, action }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || 'Impossibile aggiornare la richiesta.');
      setApprovalRequests(previous => action === 'approve'
        ? previous.filter(item => item.id !== request.id)
        : previous.map(item => item.id === request.id ? { ...item, status: 'rejected' } : item));
      showToast(action === 'approve' ? `Account approvato: ${request.email}` : `Richiesta rifiutata: ${request.email}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Impossibile aggiornare la richiesta.');
    } finally {
      setApprovalRequestBusyId(null);
    }
  };

  const handleArticleMediaFile = async (file: File) => {
    if (!(file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      showToast('Seleziona un’immagine o un video.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      showToast('Il file supera il limite di 4 MB.');
      return;
    }
    setIsUploadingArticleMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', file, file.name || (file.type.startsWith('video/') ? 'video-caricato' : 'immagine-incollata.png'));
      const response = await fetch('/api/articles/media', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || typeof result?.url !== 'string') {
        throw new Error(result?.error || 'Impossibile caricare il file.');
      }
      setSelectedFileName(file.name || (file.type.startsWith('video/') ? 'Video caricato' : 'Immagine incollata'));
      setFormMediaUrl(result.url);
      setFormMediaType(file.type.startsWith('video/') ? 'video' : 'image');
      setMediaSourceType('file');
      showToast('File caricato. Salva l’articolo per condividerlo.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Impossibile caricare il file.');
    } finally {
      setIsUploadingArticleMedia(false);
    }
  };

  const handlePasteImage = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const clipboardItem = Array.from(e.clipboardData.items).find(item => item.type.startsWith('image/'));
    const file = clipboardItem?.getAsFile() ?? Array.from(e.clipboardData.files).find(item => item.type.startsWith('image/'));
    if (!file) {
      showToast('Negli appunti non è presente un’immagine. Copia un’immagine e riprova.');
      return;
    }
    e.preventDefault();
    void handleArticleMediaFile(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    void handleArticleMediaFile(file);
    e.currentTarget.value = '';
  };

  const handleRemoveArticleMedia = () => {
    setFormMediaUrl('');
    setFormMediaType('image');
    setSelectedFileName(null);
    if (articleMediaInputRef.current) articleMediaInputRef.current.value = '';
  };

  const handleDocFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      showToast('Il file supera il limite di 4 MB.');
      return;
    }
    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/documents/media', { method: 'POST', body: formData, credentials: 'same-origin' });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || 'Impossibile caricare il documento.');
      setDocFileName(result.fileName || file.name);
      setDocUrl(result.url);
      setDocFormat(result.format || file.name.split('.').pop()?.toUpperCase() || 'PDF');
      setDocTitle(current => current.trim() || file.name.replace(/\\.[^.]+$/, ''));
      showToast('Documento caricato.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Impossibile caricare il documento.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAccountAdmin || !adminMode || newsPublishing || !newsTitle.trim() || !newsContent.trim()) return;

    let image = newsImage.trim();
    if (newsImageFile) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(newsImageFile.type) || newsImageFile.size > 4 * 1024 * 1024) {
        showToast('Scegli un’immagine JPG, PNG, WebP o GIF fino a 4 MB.');
        return;
      }
      setNewsPublishing(true);
      try {
        const data = new FormData();
        data.append('file', newsImageFile);
        const response = await fetch('/api/articles/media', { method: 'POST', body: data });
        const result = await response.json().catch(() => null);
        if (!response.ok || typeof result?.url !== 'string') throw new Error(result?.error || 'Impossibile caricare l’immagine.');
        image = result.url;
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Impossibile caricare l’immagine.');
        return;
      } finally {
        setNewsPublishing(false);
      }
    }
    const newItem = {
      id: 'news-' + Date.now(),
      title: newsTitle,
      category: newsCategory,
      publishedAt: new Date().toISOString(),
      date: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }),
      location: newsLocation || 'Nazionale',
      content: newsContent,
      image: image || null,
      isPinned: newsIsPinned
    };
    setNewsList(previous => [newItem, ...previous]);
    setIsNewsModalOpen(false);
    setNewsTitle(''); setNewsContent(''); setNewsLocation(''); setNewsImage(''); setNewsImageFile(null); setNewsIsPinned(false);
    showToast('Notizia pubblicata!');
  };

  const handleDeleteNews = (id: string) => {
    if (!confirm('Eliminare questa notizia?')) return;
    setNewsList(prev => prev.filter(n => n.id !== id));
    showToast('Notizia eliminata.');
  };

  const handleSaveShowcaseVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'admin' || !adminMode) return;
    const title = showcaseTitle.trim();
    const url = showcaseUrl.trim();
    if (!title || !url) return;
    let parsedUrl: URL;
    try { parsedUrl = new URL(url); } catch { showToast('Inserisci un link video valido.'); return; }
    if (!['https:', 'http:'].includes(parsedUrl.protocol)) { showToast('Inserisci un link video valido.'); return; }
    const editingId = editingShowcaseVideoId;
    const video = {
      id: editingId || 'showcase-' + Date.now(),
      title,
      url: parsedUrl.toString(),
      comment: showcaseComment.trim(),
      group: showcaseGroup.trim(),
      addedAt: new Date().toISOString()
    };
    setSections(prev => prev.map(section => {
      if (section.id !== activeSectionId) return section;
      const videos = (section as any).showcaseVideos || [];
      return {
        ...section,
        showcaseVideos: editingId
          ? videos.map((item: any) => item.id === editingId ? { ...item, ...video, addedAt: item.addedAt } : item)
          : [video, ...videos]
      };
    }));
    setShowcaseTitle('');
    setShowcaseUrl('');
    setShowcaseComment('');
    setShowcaseGroup('');
    setEditingShowcaseVideoId(null);
    setShowcaseFormOpen(false);
    showToast(editingId ? 'Modifiche salvate.' : 'Video aggiunto.');
  };

  const moveShowcaseVideo = (videoId: string, direction: -1 | 1, groupName: string) => {
    if (!user || user.role !== 'admin' || !adminMode) return;
    setSections(prev => prev.map(section => {
      if (section.id !== activeSectionId) return section;
      const videos = [...((section as any).showcaseVideos || [])];
      const groupIndices = videos.flatMap((video: any, index: number) =>
        ((String(video.group || '').trim() || 'Generale') === groupName) ? [index] : []
      );
      const groupPosition = groupIndices.findIndex(index => videos[index].id === videoId);
      const nextIndex = groupIndices[groupPosition + direction];
      if (groupPosition < 0 || nextIndex === undefined) return section;
      const currentIndex = groupIndices[groupPosition];
      [videos[currentIndex], videos[nextIndex]] = [videos[nextIndex], videos[currentIndex]];
      return { ...section, showcaseVideos: videos };
    }));
  };

  const moveShowcaseGroup = (groupName: string, direction: -1 | 1) => {
    if (!user || user.role !== 'admin' || !adminMode) return;
    setSections(prev => prev.map(section => {
      if (section.id !== activeSectionId) return section;
      const videos = (section as any).showcaseVideos || [];
      const available = Array.from(new Set<string>(videos.map((video: any) => String(video.group || '').trim() || 'Generale')));
      const saved: string[] = (section as any).showcaseGroupOrder || [];
      const ordered = [
        ...saved.filter(name => available.includes(name)),
        ...available.filter(name => !saved.includes(name))
      ];
      const index = ordered.indexOf(groupName);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) return section;
      [ordered[index], ordered[nextIndex]] = [ordered[nextIndex], ordered[index]];
      return { ...section, showcaseGroupOrder: ordered };
    }));
  };

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;
    if (!docUrl.trim() || docUrl === '#') {
      showToast('Carica un file o inserisci un collegamento web prima di salvare.');
      return;
    }
    const extension = docFormat ? `.${docFormat.toLowerCase()}` : '';
    const documentTitle = docTitle.trim().toLowerCase().endsWith(extension) ? docTitle.trim() : `${docTitle.trim()}${extension}`;
    const newDoc = {
      id: 'doc-' + Date.now(),
      title: documentTitle,
      format: docFormat,
      size: docFileName ? 'Caricato online' : 'Esterno',
      date: new Date().toLocaleDateString('it-IT'),
      description: docDescription,
      url: docUrl.trim()
    };
    setSections(prev =>
      prev.map(sec => sec.id === activeSectionId ? { ...sec, documents: [newDoc, ...(sec.documents || [])] } : sec)
    );
    setIsDocModalOpen(false);
    setDocTitle(''); setDocDescription(''); setDocFileName(''); setDocUrl(''); setDocFormat('PDF');
    showToast('Documento salvato!');
  };

  const handleDeleteDocument = async (secId: string, document: any) => {
    if (!user || user.role !== 'admin' || !adminMode) return;
    if (!confirm(`Eliminare “${document.title}” dal sito?`)) return;

    try {
      if (typeof document.url === 'string' && document.url.startsWith('/api/documents/media?')) {
        const fileUrl = new URL(document.url, window.location.origin);
        const pathname = fileUrl.searchParams.get('pathname');
        if (pathname) {
          const response = await fetch('/api/documents/media', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ pathname }),
          });
          const result = await response.json().catch(() => null);
          if (!response.ok) throw new Error(result?.error || 'Impossibile eliminare il file online.');
        }
      }
      setSections(prev =>
        prev.map(sec => sec.id === secId ? { ...sec, documents: sec.documents.filter(d => d.id !== document.id) } : sec)
      );
      showToast('Documento e file rimossi dal sito.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Impossibile eliminare il documento.');
    }
  };

  const handleArticleContentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    if (start !== textarea.selectionEnd) return;

    const lineStart = formContent.lastIndexOf('\n', start - 1) + 1;
    const lineBreak = formContent.indexOf('\n', start);
    const lineEnd = lineBreak === -1 ? formContent.length : lineBreak;
    const line = formContent.slice(lineStart, lineEnd);
    const marker = line.match(/^(\s*)(•\s+|[-*]\s+|(\d+)([.)])\s+)/);
    if (!marker) return;

    e.preventDefault();
    const currentText = line.slice(marker[0].length);
    let updated: string;
    let caret: number;

    if (!currentText.trim()) {
      const followingText = lineBreak === -1 ? '\n' : formContent.slice(lineBreak);
      updated = formContent.slice(0, lineStart) + followingText;
      caret = lineStart + 1;
    } else {
      const nextMarker = marker[3]
        ? marker[1] + (Number(marker[3]) + 1) + marker[4] + ' '
        : marker[0];
      updated = formContent.slice(0, start) + '\n' + nextMarker + formContent.slice(start);
      caret = start + 1 + nextMarker.length;
    }

    setFormContent(updated);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(caret, caret);
    });
  };

  const applyContentFormat = (format: 'bold' | 'italic' | 'underline') => {
    const textarea = articleContentInputRef.current;
    if (!textarea) return;

    const formats = {
      bold: ['**', '**'],
      italic: ['*', '*'],
      underline: ['<u>', '</u>'],
    } as const;
    const [opening, closing] = formats[format];
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = formContent.slice(start, end) || 'testo';
    const updated = `${formContent.slice(0, start)}${opening}${selected}${closing}${formContent.slice(end)}`;
    setFormContent(updated);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + opening.length, start + opening.length + selected.length);
    });
  };

  const insertBulletAtCursor = () => {
    const textarea = articleContentInputRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = formContent.slice(0, start);
    const after = formContent.slice(end);
    const prefix = !before || before.endsWith('\n') ? '' : '\n';
    const insertion = `${prefix}• `;
    const updated = `${before}${insertion}${after}`;
    const caret = start + insertion.length;
    const scrollTop = textarea.scrollTop;
    setFormContent(updated);
    requestAnimationFrame(() => {
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(caret, caret);
      textarea.scrollTop = scrollTop;
    });
  };

  const insertDividerAtCursor = () => {
    const textarea = articleContentInputRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = formContent.slice(0, start);
    const after = formContent.slice(end);
    const prefix = !before ? '' : before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n';
    const suffix = !after ? '' : after.startsWith('\n\n') ? '' : after.startsWith('\n') ? '\n' : '\n\n';
    const insertion = `${prefix}---${suffix}`;
    setFormContent(`${before}${insertion}${after}`);
    const caret = start + prefix.length + 3;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(caret, caret);
    });
  };

  const applyNewsContentFormat = (format: 'bold' | 'italic' | 'underline') => {
    const textarea = newsContentInputRef.current;
    if (!textarea) return;

    const formats = {
      bold: ['**', '**'],
      italic: ['*', '*'],
      underline: ['<u>', '</u>'],
    } as const;
    const [opening, closing] = formats[format];
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = newsContent.slice(start, end) || 'testo';
    const updated = `${newsContent.slice(0, start)}${opening}${selected}${closing}${newsContent.slice(end)}`;
    setNewsContent(updated);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + opening.length, start + opening.length + selected.length);
    });
  };

  const insertContentLink = (kind: 'article' | 'news') => {
    const textarea = kind === 'article' ? articleContentInputRef.current : newsContentInputRef.current;
    if (!textarea) return;
    const currentText = kind === 'article' ? formContent : newsContent;
    const setText = kind === 'article' ? setFormContent : setNewsContent;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = currentText.slice(start, end).trim();
    const linkType = window.prompt('Collegamento a un sito web o a un articolo?\n1 = Sito web\n2 = Articolo del regolamento', '1');
    if (!linkType) return;

    let destination = '';
    let defaultLabel = selectedText;
    if (linkType.trim() === '2') {
      const availableArticles = sections.flatMap(section =>
        section.subsections.map((article: any) => ({ id: article.id, title: article.title, section: section.title }))
      );
      if (availableArticles.length === 0) return;
      const choices = availableArticles.map((article, index) => `${index + 1}. ${article.title} — ${article.section}`).join('\n');
      const choice = Number(window.prompt(`Inserisci il numero dell'articolo da collegare:\n${choices}`, '1'));
      if (!Number.isInteger(choice) || choice < 1 || choice > availableArticles.length) return;
      const article = availableArticles[choice - 1];
      destination = `#article:${encodeURIComponent(article.id)}`;
      defaultLabel ||= article.title;
    } else {
      const rawUrl = window.prompt('Inserisci l’indirizzo del sito web (https://...)');
      if (!rawUrl?.trim()) return;
      const withProtocol = /^https?:\/\//i.test(rawUrl.trim()) ? rawUrl.trim() : `https://${rawUrl.trim()}`;
      try {
        const parsedUrl = new URL(withProtocol);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) return;
        destination = parsedUrl.toString();
        defaultLabel ||= parsedUrl.hostname;
      } catch {
        showToast('Indirizzo del sito non valido.');
        return;
      }
    }
    const label = window.prompt('Testo da mostrare per il collegamento:', defaultLabel) || defaultLabel;
    const token = `[${label}](${destination})`;
    const updated = `${currentText.slice(0, start)}${token}${currentText.slice(end)}`;
    setText(updated);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const openLinkedArticle = (articleId: string) => {
    const target = sections.find(section => section.subsections.some((article: any) => article.id === articleId));
    if (!target) return;
    setActiveSectionId(target.id);
    setActiveTabMode('rules');
    setOpenAccordions(previous => ({ ...previous, [articleId]: true }));
    window.setTimeout(() => document.getElementById(`article-${articleId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  };

  const handleSaveSubsection = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingArticleMedia || !formTitle.trim() || !formContent.trim()) return;
    const notify = new FormData(e.currentTarget as HTMLFormElement).has('notifyArticle');
    const newSub = {
      notifiedAt: editingSubsection?.notifiedAt ?? (!editingSubsection && notify ? new Date().toISOString() : undefined),
      id: editingSubsection ? editingSubsection.id : 'sub_' + Date.now(),
      addedAt: (editingSubsection as any)?.addedAt ?? new Date().toISOString(),
      hidden: (editingSubsection as any)?.hidden ?? false,
      suggested: formSuggested,
      title: formTitle,
      description: formSubtitle.trim(),
      content: formContent,
      source: formSource.trim(),
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
    if (!user || user.role !== 'admin' || !adminMode) return;

    const { articles, errors } = parseBulkArticles(bulkImportText);
    if (errors.length > 0) { showToast(errors[0]); return; }
    if (articles.length === 0) { showToast('Incolla almeno un articolo valido prima di importarli.'); return; }

    const targetSection = sections.find(section => section.id === bulkImportSectionId);
    if (!targetSection) { showToast('Seleziona una sezione del regolamento valida.'); return; }

    if (!bulkImportReviewItems) {
      const existing = sections.flatMap(section => section.subsections.map((item: any) => ({ ...item, sectionTitle: section.title })));
      const reviewItems = articles.map((article, index) => {
        const fromThisImport = articles.slice(0, index).map(item => ({ ...item, sectionTitle: 'Questo stesso import' }));
        const matches = findSimilarArticles(article, [...existing, ...fromThisImport])
          .map(({ item, score }) => ({ title: item.title, section: item.sectionTitle, score }));
        return { article, matches, include: true };
      });
      if (reviewItems.some(item => item.matches.length > 0)) {
        setBulkImportReviewItems(reviewItems);
        showToast('Controlla gli articoli simili prima di completare l’importazione.');
        return;
      }
    }

    const articlesToImport = bulkImportReviewItems
      ? bulkImportReviewItems.filter(item => item.include).map(item => item.article)
      : articles;
    const importedSubsections = articlesToImport.map((article, index) => ({
      id: `sub_bulk_${Date.now()}_${index}`,
      addedAt: new Date().toISOString(),
      title: article.title,
      content: article.content,
      tags: article.tags,
      source: article.source,
      media: []
    }));

    setSections(prev => prev.map(section =>
      section.id === bulkImportSectionId ? { ...section, subsections: [...section.subsections, ...importedSubsections] } : section
    ));
    setActiveSectionId(bulkImportSectionId);
    setActiveTabMode('rules');
    setIsQuickImportModalOpen(false);
    setBulkImportText('');
    setBulkImportReviewItems(null);
    showToast(`Importati ${importedSubsections.length} articoli in "${targetSection.title}".`);
  };

  const toggleBulkReviewItem = (index: number) => {
    setBulkImportReviewItems(previous => previous?.map((item, itemIndex) =>
      itemIndex === index ? { ...item, include: !item.include } : item
    ) ?? null);
  };

  const handleEditClick = (sub: any, sectionId: string) => {
    setEditingSubsection(sub);
    setFormSectionId(sectionId);
    setFormTitle(sub.title);
    setFormSubtitle(getArticleSubtitle(sub).slice(0, MAX_ARTICLE_SUBTITLE_LENGTH));
    setFormSuggested(sub.suggested === true);
    setFormContent(sub.content);
    setFormTags(sub.tags ? sub.tags.join(', ') : '');
    setFormSource((sub as any).source ?? '');
    setFormMediaUrl(sub.media && sub.media[0] ? sub.media[0].url : '');
    setFormMediaType(sub.media && sub.media[0] ? sub.media[0].type : 'image');
    const mediaCaption = sub.media?.[0]?.caption || '';
    setSelectedFileName(mediaCaption.startsWith('File:') ? mediaCaption.slice(5).trim() : mediaCaption || null);
    setIsEditingModalOpen(true);
  };

  const toggleArticleSelection = (subId: string) => {
    setSelectedArticleIds(prev => prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]);
  };

  const handleDeleteSelectedArticles = () => {
    if (!user || user.role !== 'admin' || !adminMode || selectedArticleIds.length === 0) return;
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

  const toggleSectionVisibility = (sectionId: string) => {
    setSections(prev => prev.map(section => section.id === sectionId
      ? { ...section, hidden: !(section as any).hidden }
      : section));
  };

  const toggleArticleVisibility = (sectionId: string, articleId: string) => {
    setSections(prev => prev.map(section => section.id !== sectionId ? section : {
      ...section,
      subsections: section.subsections.map(article => article.id === articleId
        ? { ...article, hidden: !(article as any).hidden }
        : article)
    }));
  };

  const handleMoveArticleToSection = () => {
    if (!movingArticle || !moveTargetSectionId || moveTargetSectionId === movingArticle.sourceSectionId) return;
    const sourceSection = sections.find(section => section.id === movingArticle.sourceSectionId);
    const targetSection = sections.find(section => section.id === moveTargetSectionId);
    const article = sourceSection?.subsections.find(sub => sub.id === movingArticle.id);
    if (!sourceSection || !targetSection || !article) {
      showToast('Impossibile spostare l’articolo. Aggiorna la pagina e riprova.');
      return;
    }

    setSections(prev => prev.map(section => {
      if (section.id === movingArticle.sourceSectionId) {
        return { ...section, subsections: section.subsections.filter(sub => sub.id !== movingArticle.id) };
      }
      if (section.id === moveTargetSectionId) {
        return { ...section, subsections: [...section.subsections, article] };
      }
      return section;
    }));
    setSelectedArticleIds(prev => prev.filter(id => id !== movingArticle.id));
    setActiveSectionId(moveTargetSectionId);
    setActiveTabMode('rules');
    setOpenAccordions(prev => ({ ...prev, [movingArticle.id]: true }));
    setMovingArticle(null);
    showToast(`Articolo spostato in “${targetSection.title}”.`);
  };

  const handleMoveSubsection = (sectionId: string, articleId: string, direction: -1 | 1) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      const subsections = [...section.subsections];
      const index = subsections.findIndex(article => article.id === articleId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= subsections.length) return section;
      [subsections[index], subsections[nextIndex]] = [subsections[nextIndex], subsections[index]];
      return { ...section, subsections };
    }));
    setArticleSort('custom');
  };

  const moveSubsectionToEdge = (sectionId: string, articleId: string, edge: 'top' | 'bottom') => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      const subsections = [...section.subsections];
      const index = subsections.findIndex(article => article.id === articleId);
      if (index < 0 || (edge === 'top' && index === 0) || (edge === 'bottom' && index === subsections.length - 1)) return section;
      const [article] = subsections.splice(index, 1);
      if (edge === 'top') subsections.unshift(article);
      else subsections.push(article);
      return { ...section, subsections };
    }));
    setArticleSort('custom');
  };

  const displayedSections = user?.role === 'admin' && adminMode
    ? sections
    : sections.map(section => ({
      ...section,
      subsections: (section as any).hidden ? [] : section.subsections.filter(sub => !(sub as any).hidden)
    }));

  const currentSection = displayedSections.find(s => s.id === activeSectionId);
  const isCurrentSectionUnavailable = Boolean((currentSection as any)?.hidden) && !(user?.role === 'admin' && adminMode);
  const currentShowcaseVideos = (currentSection as any)?.showcaseVideos || [];
  const availableShowcaseGroups = Array.from(new Set<string>(currentShowcaseVideos.map((video: any) => String(video.group || '').trim() || 'Generale')));
  const savedShowcaseGroupOrder: string[] = (currentSection as any)?.showcaseGroupOrder || [];
  const orderedShowcaseGroupNames = [
    ...savedShowcaseGroupOrder.filter(groupName => availableShowcaseGroups.includes(groupName)),
    ...availableShowcaseGroups.filter(groupName => !savedShowcaseGroupOrder.includes(groupName))
  ];

  const articleSearchSuggestions = searchQuery.trim().length >= 2
    ? displayedSections.flatMap(section => section.subsections.map(sub => ({ section, sub })))
        .filter(({ section, sub }) => {
          const query = searchQuery.trim().toLowerCase();
          return sub.title.toLowerCase().includes(query)
            || sub.content.toLowerCase().includes(query)
            || (typeof (sub as any).description === 'string' && (sub as any).description.toLowerCase().includes(query))
            || (sub.tags && sub.tags.some(tag => tag.toLowerCase().includes(query)))
            || section.title.toLowerCase().includes(query);
        })
        .slice(0, 6)
    : [];

  const filteredSubsections = currentSection ? currentSection.subsections.filter(sub => {
    const query = searchQuery.trim().toLocaleLowerCase('it');
    const matchesSearch =
      sub.title.toLocaleLowerCase('it').includes(query) ||
      sub.content.toLocaleLowerCase('it').includes(query) ||
      (typeof (sub as any).description === 'string' && (sub as any).description.toLocaleLowerCase('it').includes(query)) ||
      (sub.tags && sub.tags.some(t => t.toLocaleLowerCase('it').includes(query)));
    const matchesFav = showOnlyFavorites ? favorites.includes(sub.id) : true;
    return matchesSearch && matchesFav;
  }).sort((a, b) => {
    const hiddenOrder = Number((a as any).hidden === true) - Number((b as any).hidden === true);
    if (hiddenOrder !== 0) return hiddenOrder;
    if (prioritizeSuggested) {
      const rank = (item: any) => favorites.includes(item.id) ? 0 : item.suggested === true ? 1 : 2;
      const priorityOrder = rank(a) - rank(b);
      if (priorityOrder !== 0) return priorityOrder;
    }
    if (articleSort === 'title-asc') return a.title.localeCompare(b.title, 'it', { sensitivity: 'base' });
    if (articleSort === 'title-desc') return b.title.localeCompare(a.title, 'it', { sensitivity: 'base' });
    if (articleSort === 'date-asc' || articleSort === 'date-desc') {
      const aDate = Date.parse((a as any).addedAt || '') || 0;
      const bDate = Date.parse((b as any).addedAt || '') || 0;
      return articleSort === 'date-asc' ? aDate - bDate : bDate - aDate;
    }
    if (articleSort === 'favorites-first') return Number(favorites.includes(b.id)) - Number(favorites.includes(a.id)) || a.title.localeCompare(b.title, 'it', { sensitivity: 'base' });
    return 0;
  }) : [];

  // NOTIZIE FILTRATE E ORDINATE (IN EVIDENZA PER PRIME)
  const filteredNews = newsList
    .filter(n => selectedNewsCategory === 'Tutti' || n.category === selectedNewsCategory)
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  if (!clerkLoaded) {
    return <main className="flex min-h-screen items-center justify-center bg-[#F4F6F9] text-sm font-semibold text-slate-600">Caricamento accesso…</main>;
  }

  if (!clerkUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4F6F9] p-4">
        <section className="w-full min-w-0 max-w-md rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:p-6">
          <h1 className="mb-1 text-xl font-black text-[#0B1B3D]">FITA Regolamento</h1>
          <p className="mb-5 text-sm text-slate-600">Accedi o crea un account per consultare il sito.</p>
          <div className="mb-4"><InstallAppButton /></div>
          <div className="mb-4 flex gap-2">
            <button type="button" onClick={() => setAuthMode('login')} className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold ${authMode === 'login' ? 'bg-[#0B1B3D] text-white' : 'bg-slate-100 text-slate-600'}`}>Accedi</button>
            <button type="button" onClick={() => setAuthMode('register')} className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold ${authMode === 'register' ? 'bg-[#0B1B3D] text-white' : 'bg-slate-100 text-slate-600'}`}>Registrati</button>
          </div>
          {authMode === 'login' ? <SignIn routing="hash" signUpUrl="/sign-up" appearance={authAppearance} /> : <RegistrationForm embedded />}
          <p className="mt-3 text-center text-xs text-slate-500">Il recupero password invia un codice all’email verificata.</p>
        </section>
      </main>
    );
  }

  if (getAccountApprovalStatus(clerkUser) !== 'approved') {
    const isRejected = getAccountApprovalStatus(clerkUser) === 'rejected';
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4F6F9] p-4">
        <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl">
          <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-amber-600" />
          <h1 className="text-xl font-black text-[#0B1B3D]">{isRejected ? 'Richiesta non approvata' : 'Accesso in attesa di approvazione'}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {isRejected
              ? 'Un amministratore non ha approvato questa richiesta. Se pensi si tratti di un errore, contatta un amministratore.'
              : 'La registrazione è completata. Un amministratore deve approvare il tuo account prima che tu possa consultare il sito.'}
          </p>
          <p className="mt-3 text-xs text-slate-500">{clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress}</p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            {!isRejected && (
              <button type="button" onClick={() => clerkUser.reload()} className="rounded-lg bg-[#0B1B3D] px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
                Verifica approvazione
              </button>
            )}
            <button type="button" onClick={() => signOut()} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Esci
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 font-sans flex flex-col justify-between pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      
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
                  {user.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => setAdminMode(mode => !mode)}
                      aria-pressed={adminMode}
                      className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${adminMode ? 'border-amber-400/60 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20' : 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
                    >
                      Modalità {adminMode ? 'admin' : 'utente'}
                    </button>
                  )}
                  <button onClick={openProfilePage} className="inline-flex items-center gap-2 rounded-full border border-slate-500 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/20">
                    <Settings className="w-3.5 h-3.5 text-amber-400" />
                    <span>Area riservata · {formatPersonName([user.firstName, user.lastName].filter(Boolean).join(' ')) || 'Profilo'}</span>
                  </button>


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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-4 flex flex-wrap items-center justify-between gap-2 sm:flex-nowrap sm:gap-3">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveSectionId('home')}>
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-[#0B1B3D] rounded-lg flex items-center justify-center text-white font-black text-base sm:text-xl shadow-md border-b-2 sm:border-b-4 border-[#A60F2D] shrink-0">
                FITA
              </div>
              <div>
                <h1 className="text-sm sm:text-xl font-black tracking-tight text-[#0B1B3D] leading-tight">PORTALE ARBITRALE</h1>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium hidden sm:block">Regolamenti & Materiali Didattici</p>
              </div>
            </div>

            {isAccountAdmin && (
              <button type="button" onClick={() => setAdminMode(mode => !mode)} aria-label={adminMode ? 'Passa alla modalità utente' : 'Torna alla modalità admin'} className={`min-h-11 rounded-lg border px-2.5 text-xs font-bold md:hidden ${adminMode ? 'border-amber-300 bg-amber-100 text-amber-950' : 'border-blue-300 bg-blue-100 text-blue-950'}`}>
                Modalità {adminMode ? 'admin' : 'utente'} <span aria-hidden="true">⇄</span>
              </button>
            )}

            <div className="flex w-full min-w-0 items-center gap-2 sm:ml-auto sm:max-w-md sm:flex-1">
              <div className="relative flex h-11 min-w-0 flex-1 items-center sm:h-9">
                <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  ref={articleSearchInputRef}
                  placeholder="Cerca norme..."
                  value={searchQuery}
                  onFocus={() => setIsArticleSearchFocused(true)}
                  onBlur={() => window.setTimeout(() => setIsArticleSearchFocused(false), 120)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-full w-full bg-slate-100 border border-slate-300 rounded-lg pl-8 pr-11 text-base sm:text-sm text-slate-800 focus:outline-none focus:border-[#0B1B3D]"
                  aria-label="Cerca articoli e norme"
                  aria-autocomplete="list"
                  aria-expanded={isArticleSearchFocused && articleSearchSuggestions.length > 0}
                />
                {searchQuery.length > 0 && (
                  <button type="button" aria-label="Svuota ricerca" onClick={() => { setSearchQuery(''); articleSearchInputRef.current?.focus(); }} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-600 hover:bg-slate-200">
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
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
                        className="block w-full border-b border-slate-100 px-3 py-2.5 text-left last:border-b-0 hover:bg-slate-50"
                      >
                        <span className="block break-words text-sm font-bold text-[#0B1B3D]">{sub.title}</span>
                        <span className="mt-0.5 block truncate text-[10px] text-slate-500">{section.shortTitle || section.title}</span>
                        {(() => {
                          const query = searchQuery.trim();
                          const content = sub.content.replace(/\s+/g, ' ');
                          const match = content.toLowerCase().indexOf(query.toLowerCase());
                          if (match < 0) return null;
                          return <span className="mt-1 block break-words text-xs text-slate-600">{match > 36 ? '…' : ''}{content.slice(Math.max(0, match - 36), match)}<mark className="bg-amber-100 text-inherit">{content.slice(match, match + query.length)}</mark>{content.slice(match + query.length, match + query.length + 60)}{content.length > match + query.length + 60 ? '…' : ''}</span>;
                        })()}
                      </button>
                    ))}
                  </div>
                )}
              </div>


              <div className="relative shrink-0">
                <button type="button" onClick={() => setNotificationsOpen(open => !open)} aria-label={`Notifiche${unreadNotices ? `, ${unreadNotices} da leggere` : ''}`} aria-expanded={notificationsOpen} className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-[#0B1B3D] hover:bg-slate-100">
                  <Bell className="h-5 w-5" aria-hidden="true" />
                  {unreadNotices > 0 && <span aria-hidden="true" className="absolute right-0 top-0 rounded-full bg-[#A60F2D] px-1.5 text-[10px] font-bold text-white">{unreadNotices}</span>}
                </button>
                {notificationsOpen && (
                  <section aria-label="Centro notifiche" className="fixed inset-x-3 top-28 z-50 max-h-[65dvh] overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:w-80">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-bold text-[#0B1B3D]">Notifiche</h2>
                      <button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Chiudi notifiche" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-4 w-4" /></button>
                    </div>
                    <button type="button" disabled={pushBusy} onClick={() => void toggleDevicePush()} className="my-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900 disabled:opacity-50">
                      {pushBusy ? 'Aggiornamento…' : devicePushEnabled ? 'Disattiva notifiche su questo dispositivo' : 'Attiva notifiche su questo dispositivo'}
                    </button>
                    {pushStatus && <p role="status" className="my-2 text-xs text-slate-700">{pushStatus}</p>}
                    {visibleNotices.length > 0 && (
                      <div className="flex flex-wrap gap-x-3">
                        {unreadNotices > 0 && <button type="button" onClick={markNoticesRead} className="py-2 text-xs font-semibold text-blue-800">Segna tutte come lette</button>}
                        <button type="button" onClick={() => dismissNotices(visibleNotices.map(item => item.id))} className="py-2 text-xs font-semibold text-slate-700">Svuota elenco</button>
                      </div>
                    )}
                    {visibleNotices.length ? <ul className="divide-y divide-slate-200">
                      {visibleNotices.map(item => <li key={item.id} className="flex items-start justify-between gap-2 break-words py-2 text-sm">
                        <div className="min-w-0">
                          <p className="text-xs text-slate-600">{item.kind} · {new Date(item.at).toLocaleDateString('it-IT')}</p>
                          <p className={item.at > notificationSeenAt ? 'font-bold text-[#0B1B3D]' : 'text-slate-700'}>{item.title}</p>
                        </div>
                        <button type="button" onClick={() => dismissNotices([item.id])} aria-label={`Rimuovi notifica: ${item.title}`} className="shrink-0 rounded p-2 text-slate-600 hover:bg-slate-100"><X className="h-4 w-4" aria-hidden="true" /></button>
                      </li>)}
                    </ul> : <p className="py-3 text-sm text-slate-600">Non ci sono notifiche.</p>}
                  </section>
                )}
              </div>
              <InstallAppButton />
            </div>
          </div>
        </header>

        <aside aria-label="Nota sull’accuratezza dei contenuti" className="border-b border-slate-200 bg-slate-50 text-slate-600">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-1.5 sm:px-6 lg:px-8">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
            <p className="text-[10px] leading-relaxed sm:text-xs">
              I contenuti sono stati elaborati con AI e revisionati da una persona, ma possono contenere errori: verifica le informazioni sul <a href="https://www.taekwondoitalia.it/" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-700 underline underline-offset-2 hover:text-slate-900">sito ufficiale FITA</a> e nei regolamenti aggiornati.
            </p>
          </div>
        </aside>

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

              {displayedSections.map((sec) => (
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
        <main className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 w-full ${activeSectionId === 'home' ? '[(display-mode:standalone)]:min-h-[75dvh] [(display-mode:standalone)]:bg-[#111e38] [(display-mode:standalone)]:bg-[url(/fita-app-home-background.png)] [(display-mode:standalone)]:bg-[length:auto_clamp(12rem,65vw,22rem)] [(display-mode:standalone)]:bg-top [(display-mode:standalone)]:bg-no-repeat [(display-mode:standalone)]:pt-[calc(clamp(12rem,65vw,22rem)+0.75rem)]' : ''}`}>
          
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

                  {user && user.role === 'admin' && adminMode && (
                    <button
                      onClick={() => setIsNewsModalOpen(true)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-[#0B1B3D] text-white font-bold text-xs"
                    >
                      <Plus className="w-4 h-4" /> Pubblica Notizia
                    </button>
                  )}
                </div>
              </div>

              {!isNewsLoaded ? (
                <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-500 font-semibold text-xs">
                  Caricamento notizie…
                </div>
              ) : filteredNews.length === 0 ? (
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
                          <div className="whitespace-pre-line text-xs text-slate-600 leading-relaxed">{renderRichContent(item.content, openLinkedArticle)}</div>
                        </div>
                      </div>

                      {user && user.role === 'admin' && adminMode && (
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
                  {isAccountAdmin && adminMode && (
                    <button type="button" onClick={() => toggleSectionVisibility(currentSection.id)} className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100">
                      {(currentSection as any).hidden ? 'Riattiva sezione per gli utenti' : 'Nascondi temporaneamente la sezione agli utenti'}
                    </button>
                  )}
                </div>

                <div className={`grid w-full gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 ${['kyorugi', 'poomsae', 'freestyle'].includes(currentSection.id) ? 'grid-cols-3' : 'grid-cols-2'} sm:flex sm:w-auto`}>
                  <button
                    onClick={() => setActiveTabMode('rules')}
                    className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 text-center text-xs font-bold leading-tight transition-all sm:min-h-0 sm:flex-row sm:gap-1.5 sm:px-3 ${
                      activeTabMode === 'rules' ? 'bg-[#0B1B3D] text-white shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Articoli
                  </button>
                  {['kyorugi', 'poomsae', 'freestyle'].includes(currentSection.id) && (
                    <button
                      onClick={() => setActiveTabMode('showcase')}
                      className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 text-center text-xs font-bold leading-tight transition-all sm:min-h-0 sm:flex-row sm:gap-1.5 sm:px-3 ${
                        activeTabMode === 'showcase' ? 'bg-[#0B1B3D] text-white shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" /> {currentSection.id === 'kyorugi' ? 'Gestualità' : currentSection.id === 'poomsae' ? 'Esecuzioni' : 'Tecniche in evidenza'}
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTabMode('materials')}
                    className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 text-center text-xs font-bold leading-tight transition-all sm:min-h-0 sm:flex-row sm:gap-1.5 sm:px-3 ${
                      activeTabMode === 'materials' ? 'bg-[#0B1B3D] text-white shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" /> <span>Documenti <span className="hidden sm:inline">({currentSection.documents?.length || 0})</span></span>
                  </button>
                </div>
              </div>

              {isCurrentSectionUnavailable ? (
                <div role="status" className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-10 text-center shadow-sm">
                  <EyeOff className="mb-3 h-7 w-7 text-slate-400" aria-hidden="true" />
                  <h3 className="text-base font-bold text-[#0B1B3D]">Sezione temporaneamente non disponibile</h3>
                  <p className="mt-1 max-w-md text-sm text-slate-500">I contenuti di “{currentSection.title}” sono temporaneamente nascosti. Riprova più tardi.</p>
                </div>
              ) : (
                <>
              {activeTabMode === 'rules' && (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:flex-wrap md:items-center md:justify-between">
                    <button type="button" onClick={() => setMobileFiltersOpen(true)} aria-expanded={mobileFiltersOpen} className="min-h-10 self-start rounded-lg border border-slate-300 bg-slate-50 px-4 text-sm font-bold text-slate-700 md:hidden">Filtri{showOnlyFavorites ? ' · Preferiti' : ''}</button>
                    {mobileFiltersOpen && <button type="button" aria-label="Chiudi filtri" onClick={() => setMobileFiltersOpen(false)} className="fixed inset-0 z-40 bg-slate-950/40 md:hidden" />}
                    <div className={mobileFiltersOpen ? 'fixed inset-x-0 bottom-0 z-50 flex max-h-[75dvh] flex-col gap-4 overflow-auto rounded-t-2xl bg-white px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl md:static md:flex-row md:flex-wrap md:items-center md:gap-2 md:overflow-visible md:rounded-none md:p-0 md:shadow-none' : 'hidden flex-wrap items-center gap-2 md:flex'}>
                      <div className="flex items-center justify-between md:hidden"><strong>Filtri e ordinamento</strong><button type="button" onClick={() => setMobileFiltersOpen(false)} className="min-h-11 rounded-lg px-3 font-semibold text-blue-800">Chiudi</button></div>
                      <button type="button" onClick={() => setShowOnlyFavorites(prev => !prev)} aria-pressed={showOnlyFavorites} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold ${showOnlyFavorites ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                        <Star className={`h-4 w-4 ${showOnlyFavorites ? 'fill-amber-500 text-amber-500' : 'text-amber-500'}`} />
                        {showOnlyFavorites ? 'Preferiti' : 'Tutti'}
                      </button>
                      <label className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Ordina</span>
                        <select value={articleSort} onChange={e => setArticleSort(e.target.value as typeof articleSort)} className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700">
                          <option value="custom">Ordine personalizzato</option>
                          <option value="title-asc">Titolo A–Z</option>
                          <option value="title-desc">Titolo Z–A</option>
                          <option value="date-asc">Dal meno recente</option>
                          <option value="date-desc">Dal più recente</option>
                          <option value="favorites-first">Preferiti per primi</option>
                        </select>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={prioritizeSuggested} onChange={e => setPrioritizeSuggested(e.target.checked)} className="accent-amber-600" /> Preferiti e suggeriti in cima</label>
                    </div>

                    {user && user.role === 'admin' && adminMode && (
                      <div className="grid grid-cols-3 items-stretch gap-1.5 border-t border-slate-200 pt-2 md:flex md:flex-wrap md:items-center md:gap-2 md:border-t-0 md:pt-0">
                        <button
                          onClick={() => {
                            setEditingSubsection(null);
                            setFormSectionId(currentSection.id);
                            setFormTitle(''); setFormSubtitle(''); setFormSuggested(false); setFormContent(''); setFormTags(''); setFormSource(''); setFormMediaUrl('');
                            setSelectedFileName(null);
                            setIsEditingModalOpen(true);
                          }}
                          className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg bg-[#0B1B3D] px-2 text-center text-xs font-bold text-white md:min-h-0 md:px-3 md:py-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Articolo
                        </button>
                        <button
                          onClick={() => {
                            setBulkImportSectionId(currentSection.id);
                            setIsQuickImportModalOpen(true);
                          }}
                          className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border border-slate-300 px-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50 md:min-h-0 md:px-3 md:py-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" /> Importa<span className="hidden md:inline"> più articoli</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (isSelectingArticles) setSelectedArticleIds([]);
                            setIsSelectingArticles(prev => !prev);
                          }}
                          className={`inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border px-1 text-center text-xs font-bold md:min-h-0 md:px-3 md:py-1.5 ${isSelectingArticles ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-[#0B1B3D] text-[#0B1B3D] hover:bg-slate-50'}`}
                        >
                          {isSelectingArticles ? <X className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
                          {isSelectingArticles ? 'Annulla' : 'Seleziona'}
                        </button>
                        {isSelectingArticles && selectedArticleIds.length > 0 && (
                          <button
                            type="button"
                            onClick={handleDeleteSelectedArticles}
                            className="col-span-3 inline-flex min-h-10 items-center justify-center gap-1 rounded-lg bg-red-700 px-3 text-xs font-bold text-white hover:bg-red-800 md:min-h-0 md:py-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Elimina selezionati ({selectedArticleIds.length})
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
                      const subtitle = getArticleSubtitle(sub);
                      const isFav = favorites.includes(sub.id);
                      const isHiddenForUsers = (sub as any).hidden === true;
                      const storedArticleIndex = currentSection.subsections.findIndex(article => article.id === sub.id);

                      return (
                        <div id={`article-${sub.id}`} key={sub.id} className={`rounded-xl border shadow-sm overflow-hidden ${isHiddenForUsers ? 'border-slate-300 bg-slate-100' : 'border-slate-200 bg-white'} ${selectedArticleIds.includes(sub.id) ? 'border-red-300 ring-1 ring-red-200' : ''}`}>
                          <div
                            onClick={() => toggleAccordion(sub.id)}
                            className="p-3 sm:p-5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 cursor-pointer hover:bg-slate-50 select-none"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-2.5">
                              {user && user.role === 'admin' && adminMode && isSelectingArticles && (
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
                              <div className={`hidden p-2 rounded-lg shrink-0 sm:block ${isOpen ? 'bg-[#0B1B3D] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                <BookOpen className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex flex-col items-start gap-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className={`break-words text-base leading-snug font-bold ${isHiddenForUsers ? 'text-slate-500' : 'text-[#0B1B3D]'}`}>{sub.title}</h3>
                                    {isHiddenForUsers && <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500">Nascosto</span>}
                                    {(sub as any).suggested && <span className="hidden rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-violet-800 md:inline-block">Suggerito</span>}
                                  </div>
                                  {subtitle && <p className="break-words text-xs leading-tight text-slate-600 sm:text-sm">{subtitle}</p>}
                                  {(sub as any).suggested && <span className="mt-1 rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-violet-800 md:hidden">Suggerito</span>}
                                </div>
                              </div>
                            </div>

                            <div className={`flex items-center justify-end gap-1 ${user?.role === 'admin' && adminMode ? 'w-full flex-wrap sm:w-auto' : 'shrink-0'}`}>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(sub.id); }}
                                aria-label={isFav ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"} aria-pressed={isFav}
                                className={`flex h-11 w-11 items-center justify-center rounded ${isFav ? 'text-amber-500 bg-amber-50' : 'text-slate-400'}`}
                              >
                                <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500' : ''}`} />
                              </button>


                              {user && user.role === 'admin' && adminMode && (
                                <div className="flex flex-wrap items-center gap-1 border-l border-slate-200 pl-1" onClick={(e) => e.stopPropagation()}>
                                  <button type="button" disabled={storedArticleIndex === 0} onClick={() => handleMoveSubsection(currentSection.id, sub.id, -1)} className="rounded px-1.5 py-0.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30" title="Sposta articolo in alto" aria-label={`Sposta ${sub.title} in alto`}>↑</button>
                                  <button type="button" disabled={storedArticleIndex === currentSection.subsections.length - 1} onClick={() => handleMoveSubsection(currentSection.id, sub.id, 1)} className="rounded px-1.5 py-0.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30" title="Sposta articolo in basso" aria-label={`Sposta ${sub.title} in basso`}>↓</button>
                                  <button type="button" disabled={storedArticleIndex === 0} onClick={() => moveSubsectionToEdge(currentSection.id, sub.id, 'top')} className="rounded px-1.5 py-0.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30" title="Sposta all’inizio della sezione" aria-label={`Sposta ${sub.title} all’inizio della sezione`}>⇈</button>
                                  <button type="button" disabled={storedArticleIndex === currentSection.subsections.length - 1} onClick={() => moveSubsectionToEdge(currentSection.id, sub.id, 'bottom')} className="rounded px-1.5 py-0.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30" title="Sposta alla fine della sezione" aria-label={`Sposta ${sub.title} alla fine della sezione`}>⇊</button>
                                  <button type="button" onClick={() => toggleArticleVisibility(currentSection.id, sub.id)} className={`rounded p-1.5 ${isHiddenForUsers ? 'text-slate-500 hover:bg-slate-200' : 'text-slate-600 hover:bg-slate-100'}`} title={isHiddenForUsers ? 'Mostra agli utenti' : 'Nascondi agli utenti'} aria-label={isHiddenForUsers ? `Mostra ${sub.title} agli utenti` : `Nascondi ${sub.title} agli utenti`}>
                                    {isHiddenForUsers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                  {sections.length > 1 && (
                                    <button type="button" onClick={() => {
                                      setMovingArticle({ id: sub.id, title: sub.title, sourceSectionId: currentSection.id });
                                      setMoveTargetSectionId(sections.find(section => section.id !== currentSection.id)?.id || '');
                                    }} className="rounded p-1.5 text-slate-600 hover:bg-slate-100" title="Sposta in un’altra sezione" aria-label={`Sposta ${sub.title} in un’altra sezione`}>
                                      <ArrowRightLeft className="h-4 w-4" />
                                    </button>
                                  )}
                                  <button onClick={() => handleEditClick(sub, currentSection.id)} className="p-1 text-blue-600" aria-label={`Modifica ${sub.title}`}>
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleDeleteSubsection(currentSection.id, sub.id)} className="p-1 text-red-600" aria-label={`Elimina ${sub.title}`}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}

                              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-[#0B1B3D]' : ''}`} />
                            </div>
                          </div>

                          {isOpen && (
                            <div className="p-3 sm:p-5 bg-slate-50 border-t border-slate-100 text-slate-700">
                              <div role="group" aria-label="Dimensione testo dell’articolo" className="mb-1 flex w-fit items-center divide-x divide-slate-200 rounded-md border border-slate-200 bg-white">
                                <button type="button" onClick={() => changeArticleTextSize(-2)} disabled={articleTextSize <= 14} aria-label="Riduci il testo" className="h-8 min-w-9 px-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40">A−</button>
                                <span aria-live="polite" className="px-1.5 text-center text-[11px] tabular-nums text-slate-600">{articleTextSize} px</span>
                                <button type="button" onClick={() => changeArticleTextSize(2)} disabled={articleTextSize >= 24} aria-label="Ingrandisci il testo" className="h-8 min-w-9 px-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40">A+</button>
                              </div>
                              <div style={{ fontSize: articleTextSize }} className={`whitespace-pre-line [overflow-wrap:anywhere] leading-relaxed [&_p]:my-3 [&_h3]:text-[1.2em] [&_h4]:text-[1.1em] [&_h5]:text-[1em] ${isHiddenForUsers ? 'text-slate-500' : 'text-slate-800'}`}>
                                {renderRichContent(sub.content, openLinkedArticle)}
                              </div>

                              {sub.tags?.length > 0 && (
                                <div className="mb-3 flex flex-wrap gap-1.5">
                                  {sub.tags.map((tag, idx) => (
                                    <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {((sub as any).source?.trim() || (sub as any).addedAt) && (
                                <div className="mt-3 border-t border-slate-200 pt-3 break-words text-xs leading-relaxed text-slate-600">
                                  {(sub as any).addedAt && <p><span className="font-semibold text-slate-600">Aggiunto il:</span> {new Date((sub as any).addedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
                                  {(sub as any).source?.trim() && <p className="mt-1"><span className="font-semibold text-slate-600">Fonte / riferimento:</span> {(sub as any).source}</p>}
                                </div>
                              )}

                              {sub.media && sub.media.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-slate-200">
                                  <h4 className="text-[11px] font-bold uppercase text-[#0B1B3D] mb-2 flex items-center gap-1">
                                    <Video className="w-3.5 h-3.5 text-[#A60F2D]" /> Media ed Esempi
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {sub.media.map((item, mIdx) => (
                                      <div key={mIdx} className="flex justify-center bg-white border border-slate-200 rounded-lg p-2 shadow-sm">
                                        {item.type === 'image' ? (
                                          <img src={item.url} alt={item.caption || 'Media'} className="block h-auto max-h-[70vh] w-auto max-w-full object-contain" />
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

              {activeTabMode === 'showcase' && ['kyorugi', 'poomsae', 'freestyle'].includes(currentSection.id) && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#0B1B3D]">{currentSection.id === 'kyorugi' ? 'Gestualità' : currentSection.id === 'poomsae' ? 'Esecuzioni' : 'Tecniche in evidenza'}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">Video con commenti e dimostrazioni.</p>
                    </div>
                    {user?.role === 'admin' && adminMode && (
                      <button type="button" onClick={() => {
                        if (showcaseFormOpen) {
                          setShowcaseFormOpen(false);
                          setEditingShowcaseVideoId(null);
                          setShowcaseTitle('');
                          setShowcaseUrl('');
                          setShowcaseComment('');
                          setShowcaseGroup('');
                        } else {
                          setEditingShowcaseVideoId(null);
                          setShowcaseTitle('');
                          setShowcaseUrl('');
                          setShowcaseComment('');
                          setShowcaseGroup('');
                          setShowcaseFormOpen(true);
                        }
                      }} className="rounded-lg bg-[#0B1B3D] px-3 py-2 text-xs font-bold text-white">
                        {showcaseFormOpen ? 'Annulla' : '+ Aggiungi video'}
                      </button>
                    )}
                  </div>

                  {showcaseFormOpen && user?.role === 'admin' && adminMode && (
                    <form onSubmit={handleSaveShowcaseVideo} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                      <label className="block text-xs font-bold text-slate-600">Titolo video
                        <input required value={showcaseTitle} onChange={event => setShowcaseTitle(event.target.value)} placeholder="Es. Calcio girato in salto" className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 font-normal text-slate-800" />
                      </label>
                      <label className="block text-xs font-bold text-slate-600">Link video (YouTube, Vimeo, Instagram, TikTok o file MP4)
                        <input required type="url" value={showcaseUrl} onChange={event => setShowcaseUrl(event.target.value)} placeholder="https://…" className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 font-normal text-slate-800" />
                      </label>
                      <label className="block text-xs font-bold text-slate-600">Commento
                        <textarea value={showcaseComment} onChange={event => setShowcaseComment(event.target.value)} rows={3} placeholder="Descrivi cosa mostra il video…" className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 font-normal text-slate-800" />
                      </label>
                      <label className="block text-xs font-bold text-slate-600">Sezione <span className="font-normal text-slate-400">(facoltativa)</span>
                        <input value={showcaseGroup} onChange={event => setShowcaseGroup(event.target.value)} placeholder="Es. Calci girati, Equilibrio…" className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 font-normal text-slate-800" />
                        <span className="mt-1 block font-normal text-slate-500">I video con la stessa sezione appariranno raggruppati insieme.</span>
                      </label>
                      <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white">{editingShowcaseVideoId ? 'Salva modifiche' : 'Salva video'}</button>
                    </form>
                  )}

                  {((currentSection as any).showcaseVideos || []).length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">Non ci sono ancora video in questa sezione.</div>
                  ) : (
                    <div className="space-y-6">
                      {orderedShowcaseGroupNames.map((groupName, groupIndex) => {
                        const groupVideos = currentShowcaseVideos.filter((video: any) => (String(video.group || '').trim() || 'Generale') === groupName);
                        return (
                          <section key={groupName} className="space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">{groupName}</h4>
                              {user?.role === 'admin' && adminMode && <div className="flex items-center">
                                <button type="button" disabled={groupIndex === 0} onClick={() => moveShowcaseGroup(groupName, -1)} title="Sposta sezione in alto" aria-label={`Sposta la sezione ${groupName} in alto`} className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5 rotate-180" /></button>
                                <button type="button" disabled={groupIndex === orderedShowcaseGroupNames.length - 1} onClick={() => moveShowcaseGroup(groupName, 1)} title="Sposta sezione in basso" aria-label={`Sposta la sezione ${groupName} in basso`} className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
                              </div>}
                            </div>
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                              {groupVideos.map((video: any, videoIndex: number) => {
                        const embedUrl = getShowcaseEmbedUrl(video.url);
                        let isPortraitEmbed = false;
                        try {
                          const host = new URL(video.url).hostname.replace(/^www\./, '');
                          isPortraitEmbed = host === 'instagram.com' || host.endsWith('.instagram.com') || host === 'tiktok.com' || host.endsWith('.tiktok.com');
                        } catch {}
                        return (
                          <article key={video.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div
                              className={isPortraitEmbed ? "mx-auto overflow-hidden bg-slate-950" : "aspect-video bg-slate-950"}
                              style={isPortraitEmbed ? { width: 'min(100%, 380px, 42.1875vh)', aspectRatio: '9 / 16' } : undefined}
                            >
                              {embedUrl ? (
                                <iframe src={embedUrl} title={video.title} className="h-full w-full border-0" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowFullScreen />
                              ) : (
                                <video src={video.url} controls preload="metadata" className="h-full w-full object-contain" />
                              )}
                            </div>
                            <div className="flex items-start justify-between gap-3 p-4">
                              <div>
                                <h4 className="text-sm font-bold text-[#0B1B3D]">{video.title}</h4>
                                {video.comment && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{video.comment}</p>}
                                <a href={video.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-xs font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900">Apri video originale</a>
                              </div>
                              {user?.role === 'admin' && adminMode && (
                                <div className="flex shrink-0 items-center gap-1">
                                  <button type="button" disabled={videoIndex === 0} onClick={() => moveShowcaseVideo(video.id, -1, groupName)} aria-label={`Sposta ${video.title} in alto`} title="Sposta in alto" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ChevronDown className="h-4 w-4 rotate-180" /></button>
                                  <button type="button" disabled={videoIndex === groupVideos.length - 1} onClick={() => moveShowcaseVideo(video.id, 1, groupName)} aria-label={`Sposta ${video.title} in basso`} title="Sposta in basso" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
                                  <button type="button" onClick={() => {
                                    setEditingShowcaseVideoId(video.id);
                                    setShowcaseTitle(video.title || '');
                                    setShowcaseUrl(video.url || '');
                                    setShowcaseComment(video.comment || '');
                                    setShowcaseGroup(video.group || '');
                                    setShowcaseFormOpen(true);
                                  }} aria-label={`Modifica ${video.title}`} title="Modifica video" className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"><Edit3 className="h-4 w-4" /></button>
                                  <button type="button" onClick={() => {
                                    if (!confirm('Rimuovere questo video?')) return;
                                    setSections(prev => prev.map(section => section.id === activeSectionId
                                      ? { ...section, showcaseVideos: ((section as any).showcaseVideos || []).filter((item: any) => item.id !== video.id) }
                                      : section
                                    ));
                                    if (editingShowcaseVideoId === video.id) {
                                      setEditingShowcaseVideoId(null);
                                      setShowcaseFormOpen(false);
                                    }
                                    showToast('Video rimosso.');
                                  }} aria-label="Rimuovi video" title="Rimuovi video" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                                </div>
                              )}
                            </div>
                          </article>
                              );
                              })}
                            </div>
                          </section>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              {activeTabMode === 'materials' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#0B1B3D] uppercase">Documenti Didattici</h3>
                    {user && user.role === 'admin' && adminMode && (
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
                        <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-start gap-3">
                          <div className="flex min-w-0 flex-1 basis-full items-start gap-2.5 sm:basis-auto">
                            <div className="p-2.5 rounded-lg bg-red-700 text-white font-black text-xs shrink-0">
                              {doc.format}
                            </div>
                            <h4 className="min-w-0 [overflow-wrap:anywhere] font-bold text-sm text-[#0B1B3D]">{doc.title}</h4>
                          </div>

                          <a
                            href={doc.url}
                            download={doc.title}
                            className="min-h-11 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 shrink-0"
                            onClick={(e) => {
                              if (!doc.url || doc.url === '#') {
                                e.preventDefault();
                                showToast('Questo documento non ha un file o un collegamento valido.');
                              }
                            }}
                          >
                            <Download className="w-3.5 h-3.5" /> Scarica
                          </a>
                          {user?.role === 'admin' && adminMode && (
                            <button type="button" onClick={() => handleDeleteDocument(currentSection.id, doc)} aria-label={`Elimina ${doc.title}`} title="Elimina documento" className="ml-1 rounded-lg p-1.5 text-red-600 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* --- MODALE IMPORTAZIONE RAPIDA ARTICOLI (SOLO ADMIN) --- */}
      <AnimatePresence>
        {isQuickImportModalOpen && user && user.role === 'admin' && adminMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-sm">
            <div className="w-full max-w-4xl bg-white rounded-xl border border-slate-200 shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="sticky top-0 z-10 bg-white flex items-center justify-between p-4 sm:p-5 border-b border-slate-200">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0B1B3D]">Importazione rapida articoli</h3>
                  <p className="text-xs text-slate-500 mt-1">Incolla il testo generato dall’AI, controlla un’anteprima e importa gli articoli.</p>
                </div>
                <button type="button" onClick={() => { setIsQuickImportModalOpen(false); setBulkImportReviewItems(null); }} className="text-slate-400 hover:text-slate-600" aria-label="Chiudi">
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
                    onChange={(e) => { setBulkImportText(e.target.value); setBulkImportReviewItems(null); }}
                    disabled={!!bulkImportReviewItems}
                    placeholder={BULK_ARTICLE_TEMPLATE}
                    rows={14}
                    className="w-full bg-slate-50 border border-slate-300 p-3 rounded-lg font-mono text-xs text-slate-800 focus:outline-none focus:border-[#0B1B3D]"
                  />
                </div>

                {bulkImportReviewItems && (
                  <section className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-3" aria-label="Revisione possibili duplicati">
                    <div>
                      <h4 className="font-bold text-amber-950">Possibili articoli duplicati</h4>
                      <p className="mt-1 text-[11px] text-amber-900">Confronta i titoli simili e deseleziona quelli che non vuoi importare. Gli altri articoli restano selezionati.</p>
                    </div>
                    {bulkImportReviewItems.map((item, index) => (
                      <label key={index} className="block rounded-lg border border-amber-200 bg-white p-3">
                        <span className="flex items-start gap-2">
                          <input type="checkbox" checked={item.include} onChange={() => toggleBulkReviewItem(index)} className="mt-0.5 h-4 w-4 accent-emerald-700" />
                          <span className="min-w-0">
                            <span className="block font-bold text-slate-800">{item.article.title}</span>
                            {item.matches.length > 0 ? item.matches.map((match, matchIndex) => (
                              <span key={matchIndex} className="mt-1 block text-[11px] text-amber-900">
                                Somiglia a “{match.title}” in {match.section} ({Math.round(match.score * 100)}% di corrispondenza)
                              </span>
                            )) : <span className="mt-1 block text-[11px] text-emerald-700">Nessun articolo simile trovato</span>}
                          </span>
                        </span>
                      </label>
                    ))}
                    <button type="button" onClick={() => setBulkImportReviewItems(null)} className="text-xs font-bold text-slate-700 underline">Torna alla modifica del testo</button>
                  </section>
                )}

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
                  disabled={!bulkImportText.trim() || parseBulkArticles(bulkImportText).articles.length === 0 || parseBulkArticles(bulkImportText).errors.length > 0 || (!!bulkImportReviewItems && !bulkImportReviewItems.some(item => item.include))}
                  className="px-4 py-2 rounded-lg bg-emerald-700 text-white font-bold hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bulkImportReviewItems ? `Importa ${bulkImportReviewItems.filter(item => item.include).length} selezionati` : `Verifica e importa ${parseBulkArticles(bulkImportText).articles.length} articoli`}
                </button>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SPOSTA ARTICOLO IN UN’ALTRA SEZIONE --- */}
      <AnimatePresence>
        {movingArticle && user && user.role === 'admin' && adminMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
            <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-base font-black text-[#0B1B3D]">Sposta articolo</h2>
                  <p className="mt-1 text-xs text-slate-500">{movingArticle.title}</p>
                </div>
                <button type="button" onClick={() => setMovingArticle(null)} className="rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="Chiudi">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={e => { e.preventDefault(); handleMoveArticleToSection(); }} className="space-y-4">
                <div>
                  <label htmlFor="article-move-target" className="mb-1 block text-xs font-bold text-slate-600">Sezione di destinazione</label>
                  <select id="article-move-target" required value={moveTargetSectionId} onChange={e => setMoveTargetSectionId(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-800">
                    {sections.filter(section => section.id !== movingArticle.sourceSectionId).map(section => (
                      <option key={section.id} value={section.id}>{section.title}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
                  <button type="button" onClick={() => setMovingArticle(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600">Annulla</button>
                  <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1B3D] px-3 py-2 text-xs font-bold text-white hover:bg-slate-800">
                    <ArrowRightLeft className="h-3.5 w-3.5" /> Sposta articolo
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODALE CREAZIONE / MODIFICA ARTICOLO --- */}
      <AnimatePresence>
        {isEditingModalOpen && user && user.role === 'admin' && adminMode && (
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
                {!editingSubsection && (
                  <label className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">
                    <input type="checkbox" name="notifyArticle" /> Avvisa tutti gli utenti nel portale
                  </label>
                )}
                <div>
                  <label htmlFor="article-title" className="block text-slate-600 font-bold mb-1">Titolo *</label>
                  <input id="article-title" type="text" required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-slate-800 focus:outline-none focus:border-[#0B1B3D]" />
                </div>

                <div>
                  <label htmlFor="article-subtitle" className="mb-1 block font-bold text-slate-600">Sottotitolo <span className="font-normal text-slate-500">(facoltativo)</span></label>
                  <input id="article-subtitle" value={formSubtitle} onChange={event => setFormSubtitle(event.target.value)} maxLength={MAX_ARTICLE_SUBTITLE_LENGTH} placeholder="Una breve descrizione dell’articolo" className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-slate-800" />
                </div>

                <label className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs font-semibold text-amber-900"><input type="checkbox" checked={formSuggested} onChange={e => setFormSuggested(e.target.checked)} /> Articolo suggerito</label>
                <div>
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor="article-content" className="block text-slate-600 font-bold">Contenuto *</label>
                    <div className="flex flex-wrap items-center gap-1">
                      <button type="button" onClick={() => applyContentFormat('bold')} title="Grassetto" aria-label="Applica grassetto" className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-sm font-black text-slate-700 hover:bg-slate-50">B</button>
                      <button type="button" onClick={() => applyContentFormat('italic')} title="Corsivo" aria-label="Applica corsivo" className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-sm italic text-slate-700 hover:bg-slate-50">I</button>
                      <button type="button" onClick={() => applyContentFormat('underline')} title="Sottolineato" aria-label="Applica sottolineato" className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-sm underline text-slate-700 hover:bg-slate-50">U</button>
                      <button type="button" onClick={() => insertContentLink('article')} title="Inserisci collegamento a un articolo o sito web" className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"><LinkIcon className="inline h-3.5 w-3.5" /> Link</button>
                      <button type="button" onClick={insertBulletAtCursor} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">+ Inserisci punto elenco</button>
                      <button type="button" onClick={insertDividerAtCursor} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">+ Separatore</button>
                    </div>
                  </div>
                  <textarea ref={articleContentInputRef} id="article-content" required rows={9} value={formContent} onKeyDown={handleArticleContentKeyDown} onChange={(e) => setFormContent(e.target.value)} className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-slate-800 resize-y focus:outline-none focus:border-[#0B1B3D]" />
                  <p className="mt-1 text-[10px] text-slate-500">Invio continua l’elenco; Invio su un punto vuoto lo chiude. Shift+Invio inserisce un normale a capo.</p>
                </div>

                <div>
                  <label htmlFor="article-source" className="block text-slate-600 font-bold mb-1">Fonte originale / riferimento <span className="font-normal text-slate-400">(facoltativo)</span></label>
                  <input id="article-source" type="text" value={formSource} onChange={(e) => setFormSource(e.target.value)} placeholder="es. WT Competition Rules 2026, art. 12" className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-slate-800 focus:outline-none focus:border-[#0B1B3D]" />
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
                    <div className="space-y-3">
                      <div
                        role="region"
                        tabIndex={0}
                        onPaste={handlePasteImage}
                        aria-label="Area per incollare un’immagine"
                        className="rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 p-4 text-center outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      >
                        <p className="text-xs font-bold text-blue-900">Incolla qui un’immagine dagli appunti</p>
                        <p className="mt-1 text-[10px] text-blue-800">Clicca nell’area e premi Ctrl+V (⌘+V su Mac).</p>
                      </div>
                      <p className="text-[11px] text-slate-500">Limite: 4 MB per immagine o video.</p>
                      <input ref={articleMediaInputRef} type="file" accept="image/*,video/*" onChange={handleFileUpload} className="sr-only" aria-label="Seleziona immagine o video" />
                      <button type="button" disabled={isUploadingArticleMedia} onClick={() => articleMediaInputRef.current?.click()} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                        Scegli immagine o video
                      </button>
                      {isUploadingArticleMedia && <p role="status" className="text-xs font-semibold text-blue-700">Caricamento file…</p>}
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input type="url" value={formMediaUrl} onChange={(e) => setFormMediaUrl(e.target.value)} placeholder="https://..." className="flex-1 bg-slate-50 border border-slate-300 p-2 rounded-lg text-slate-800" />
                      <select value={formMediaType} onChange={(e) => setFormMediaType(e.target.value as 'image' | 'video')} className="bg-slate-50 border border-slate-300 p-2 rounded-lg text-slate-800">
                        <option value="image">Immagine</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                  )}
                  {formMediaUrl && (
                    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2">
                      {formMediaType === 'image' ? (
                        <img src={formMediaUrl} alt="Anteprima del file caricato" className="h-16 w-20 shrink-0 rounded object-cover" />
                      ) : (
                        <video src={formMediaUrl} className="h-16 w-20 shrink-0 rounded bg-black object-contain" muted playsInline />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-700">{selectedFileName || 'File allegato'}</p>
                        <p className="text-[10px] text-slate-500">{formMediaType === 'image' ? 'Immagine' : 'Video'}</p>
                      </div>
                      <button type="button" disabled={isUploadingArticleMedia} onClick={handleRemoveArticleMedia} className="shrink-0 rounded-md border border-red-200 px-2.5 py-1.5 text-[11px] font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">Rimuovi file</button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button type="button" onClick={() => setIsEditingModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-bold">Annulla</button>
                  <button type="submit" disabled={isUploadingArticleMedia} className="px-4 py-2 rounded-lg bg-[#0B1B3D] text-white font-bold hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                    {isUploadingArticleMedia ? 'Caricamento immagine…' : editingSubsection ? 'Salva modifiche' : 'Salva articolo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDocModalOpen && user?.role === 'admin' && adminMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
            <section className="w-full max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
              <header className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-base font-bold text-[#0B1B3D]">Carica documento</h2>
                <button type="button" onClick={() => setIsDocModalOpen(false)} aria-label="Chiudi" className="rounded p-1 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </header>
              <form onSubmit={handleSaveDocument} className="space-y-3">
                <div>
                  <label htmlFor="document-title" className="mb-1 block font-bold text-slate-600">Titolo *</label>
                  <input id="document-title" required value={docTitle} onChange={e => setDocTitle(e.target.value)} placeholder="Es. Regolamento di gara" className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-slate-800" />
                </div>
                <div>
                  <label htmlFor="document-description" className="mb-1 block font-bold text-slate-600">Descrizione</label>
                  <textarea id="document-description" rows={2} value={docDescription} onChange={e => setDocDescription(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-slate-800" />
                </div>
                <div className="space-y-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
                  <input ref={docFileInputRef} type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt" onChange={handleDocFileUpload} className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-[#0B1B3D] file:px-3 file:py-2 file:font-bold file:text-white" />
                  <p className="text-[10px] text-slate-500">PDF, PowerPoint, Word, Excel o TXT · massimo 4 MB. Il file viene salvato online e resta disponibile dopo il refresh.</p>
                  {isUploadingDoc && <p role="status" className="text-xs font-semibold text-blue-700">Caricamento in corso…</p>}
                  {docFileName && <div className="flex items-center justify-between gap-2 rounded border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs text-emerald-800"><span className="truncate">{docFileName}</span><button type="button" onClick={() => { setDocFileName(''); setDocUrl(''); if (docFileInputRef.current) docFileInputRef.current.value = ''; }} className="shrink-0 font-bold underline">Rimuovi file</button></div>}
                </div>
                <div>
                  <label htmlFor="document-url" className="mb-1 block font-bold text-slate-600">Oppure collegamento web</label>
                  <input id="document-url" type="url" value={docFileName ? '' : docUrl} onChange={e => setDocUrl(e.target.value)} disabled={!!docFileName} placeholder="https://..." className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-slate-800 disabled:opacity-50" />
                </div>
                <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
                  <button type="button" onClick={() => setIsDocModalOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 font-bold text-slate-600">Annulla</button>
                  <button type="submit" disabled={isUploadingDoc || !docUrl.trim()} className="rounded-lg bg-[#0B1B3D] px-4 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{isUploadingDoc ? 'Caricamento…' : 'Salva documento'}</button>
                </div>
              </form>
            </section>
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
      <nav aria-label="Navigazione principale" className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0B1B3D] text-slate-300 border-t border-slate-800 z-40 px-1 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-stretch shadow-2xl">
        <button
          type="button"
          aria-label="Home"
          onClick={() => setActiveSectionId('home')}
          className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg min-h-12 py-1 transition-colors ${
            activeSectionId === 'home' ? 'text-amber-400 font-bold' : 'text-slate-300'
          }`}
        >
          <HomeIcon className="h-5 w-5" />
          <span className="max-w-full break-words text-center text-[10px] leading-tight font-semibold">Home</span>
        </button>

        {displayedSections.map((sec) => {
          const mobileNav = {
            kyorugi: { label: 'Combatt.', Icon: Swords },
            'video-replay': { label: 'VR', Icon: Video },
            poomsae: { label: 'Forme', Icon: PersonStanding },
            freestyle: { label: 'Freestyle', Icon: Sparkles },
          }[sec.id] || { label: sec.shortTitle || sec.title, Icon: BookOpen };
          const Icon = mobileNav.Icon;

          return (
            <button
              key={sec.id}
              type="button"
              aria-label={sec.title}
              title={sec.title}
              onClick={() => { setActiveSectionId(sec.id); setActiveTabMode('rules'); }}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg min-h-12 py-1 transition-colors ${
                activeSectionId === sec.id ? 'text-amber-400 font-bold' : 'text-slate-300'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="max-w-full break-words text-center text-[10px] leading-tight font-semibold">{mobileNav.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          aria-label={user ? 'Area personale' : 'Accedi'}
          onClick={() => user ? openProfilePage() : (setAuthMode('login'), setAuthModalOpen(true))}
          className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg min-h-12 py-1 transition-colors ${
            user ? 'text-sky-200 font-bold' : 'text-slate-300'
          }`}
        >
          <User className="h-5 w-5" />
          <span className="max-w-full break-words text-center text-[10px] leading-tight font-semibold">{user ? 'Profilo' : 'Accedi'}</span>
        </button>
      </nav>

      {/* --- MODALE PUBBLICAZIONE NUOVA NOTIZIA CON OPTION IN EVIDENZA --- */}
      <AnimatePresence>
        {isNewsModalOpen && user && user.role === 'admin' && adminMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-5 shadow-2xl space-y-4 text-xs max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-sm font-bold text-[#0B1B3D]">Pubblica Nuova Notizia</h3>
                <button type="button" aria-label="Chiudi" disabled={newsPublishing} onClick={() => setIsNewsModalOpen(false)} className="text-slate-400 disabled:opacity-50"><X className="w-5 h-5" /></button>
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
                  <div className="mb-1 flex flex-wrap items-center gap-1">
                    <button type="button" onClick={() => applyNewsContentFormat('bold')} title="Grassetto" aria-label="Applica grassetto" className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-sm font-black text-slate-700 hover:bg-slate-50">B</button>
                    <button type="button" onClick={() => applyNewsContentFormat('italic')} title="Corsivo" aria-label="Applica corsivo" className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-sm italic text-slate-700 hover:bg-slate-50">I</button>
                    <button type="button" onClick={() => applyNewsContentFormat('underline')} title="Sottolineato" aria-label="Applica sottolineato" className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-sm underline text-slate-700 hover:bg-slate-50">U</button>
                    <button type="button" onClick={() => insertContentLink('news')} title="Inserisci collegamento a un articolo o sito web" className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"><LinkIcon className="inline h-3.5 w-3.5" /> Link</button>
                  </div>
                  <textarea ref={newsContentInputRef} required rows={4} placeholder="Inserisci il testo completo..." value={newsContent} onChange={(e) => setNewsContent(e.target.value)} className="w-full bg-slate-50 border p-2 rounded text-slate-800" />
                </div>

                <fieldset disabled={newsPublishing} className="min-w-0 space-y-2">
                  <legend className="mb-1 font-bold text-slate-600">Immagine <span className="font-normal">(facoltativa)</span></legend>
                  <label htmlFor="news-image-file" className="block text-slate-700">Carica dal dispositivo</label>
                  <input id="news-image-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={event => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = '';
                    if (!file) return;
                    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 4 * 1024 * 1024) {
                      showToast('Scegli un’immagine JPG, PNG, WebP o GIF fino a 4 MB.');
                      return;
                    }
                    setNewsImageFile(file);
                    setNewsImage('');
                  }} className="w-full min-w-0 rounded border border-slate-300 bg-slate-50 p-2 text-slate-800" />
                  <p className="text-xs text-slate-500">JPG, PNG, WebP o GIF, massimo 4 MB.</p>
                  {newsImageFile && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="break-all text-slate-700">{newsImageFile.name}</span>
                      <button type="button" onClick={() => setNewsImageFile(null)} className="font-semibold text-red-700 underline">Rimuovi file</button>
                    </div>
                  )}
                  <label htmlFor="news-image-url" className="block text-slate-700">Oppure incolla un URL</label>
                  <input id="news-image-url" type="url" placeholder="https://..." value={newsImage} onChange={event => {
                    setNewsImage(event.target.value);
                    if (event.target.value) setNewsImageFile(null);
                  }} className="w-full rounded border bg-slate-50 p-2 text-slate-800" />
                </fieldset>

                <div className="pt-1">
                  <label onClick={() => setNewsIsPinned(!newsIsPinned)} className="flex items-center gap-2 cursor-pointer font-bold text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 select-none">
                    {newsIsPinned ? <CheckSquare className="w-4 h-4 text-amber-600" /> : <Square className="w-4 h-4 text-amber-400" />}
                    <span className="flex items-center gap-1">
                      <Pin className="w-3.5 h-3.5 text-amber-600" /> Fissa la notizia al primo posto (In Evidenza)
                    </span>
                  </label>
                </div>

                <div className="flex justify-end pt-3 border-t">
                  <button type="submit" disabled={newsPublishing} className="rounded bg-[#0B1B3D] px-4 py-2 font-bold text-white disabled:opacity-50">{newsPublishing ? 'Caricamento immagine…' : 'Pubblica'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SEZIONE ADMIN: APPROVAZIONE ACCOUNT --- */}
      <AnimatePresence>
        {isApprovalPanelOpen && isAccountAdmin && adminMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-3 backdrop-blur-sm sm:p-5">
            <section className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
              <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 sm:p-5">
                <div>
                  <h2 className="text-lg font-black text-[#0B1B3D]">Richieste di accesso</h2>
                  <p className="mt-1 text-xs text-slate-500">I nuovi account possono accedere al regolamento solo dopo l’approvazione di un admin.</p>
                </div>
                <button type="button" onClick={() => setIsApprovalPanelOpen(false)} className="rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="Chiudi">
                  <X className="h-5 w-5" />
                </button>
              </header>

              <div className="flex gap-2 border-b border-slate-200 px-4 py-3 sm:px-5">
                <button type="button" onClick={() => setApprovalFilter('pending')} className={`rounded-lg px-3 py-2 text-xs font-bold ${approvalFilter === 'pending' ? 'bg-[#0B1B3D] text-white' : 'bg-slate-100 text-slate-600'}`}>
                  In attesa ({approvalRequests.filter(request => request.status === 'pending').length})
                </button>
                <button type="button" onClick={() => setApprovalFilter('rejected')} className={`rounded-lg px-3 py-2 text-xs font-bold ${approvalFilter === 'rejected' ? 'bg-[#0B1B3D] text-white' : 'bg-slate-100 text-slate-600'}`}>
                  Rifiutate ({approvalRequests.filter(request => request.status === 'rejected').length})
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
                {approvalRequestsLoading ? (
                  <p className="py-8 text-center text-sm font-semibold text-slate-500">Caricamento richieste…</p>
                ) : approvalRequestsError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{approvalRequestsError}<p className="mt-1 text-xs text-red-600">Chiudi e riapri la sezione per riprovare.</p></div>
                ) : approvalRequests.filter(request => request.status === approvalFilter).length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                    {approvalFilter === 'pending' ? 'Non ci sono richieste in attesa.' : 'Non ci sono richieste rifiutate.'}
                  </div>
                ) : (
                  approvalRequests.filter(request => request.status === approvalFilter).map(request => (
                    <article key={request.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-[#0B1B3D]">{formatPersonName(request.name)}</h3>
                        <p className="truncate text-xs text-slate-600">{request.email}</p>
                        <p className="mt-1 text-[10px] text-slate-400">Registrato il {new Date(request.createdAt).toLocaleDateString('it-IT')}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button type="button" disabled={approvalRequestBusyId === request.id} onClick={() => handleApprovalAction(request, 'approve')} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
                          {approvalRequestBusyId === request.id ? 'Aggiornamento…' : 'Approva accesso'}
                        </button>
                        {approvalFilter === 'pending' && (
                          <button type="button" disabled={approvalRequestBusyId === request.id} onClick={() => handleApprovalAction(request, 'reject')} className="rounded-lg border border-red-300 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">
                            Rifiuta
                          </button>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </div>

              <footer className="flex justify-end border-t border-slate-200 bg-slate-50 p-3">
                <button type="button" onClick={() => setIsApprovalPanelOpen(false)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700">Chiudi</button>
              </footer>
            </section>
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
                <SignIn routing="hash" signUpUrl="/sign-up" appearance={authAppearance} />
              ) : (
                <RegistrationForm embedded />
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