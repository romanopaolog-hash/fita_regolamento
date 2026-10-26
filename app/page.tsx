'use client';

import React, { useState, useEffect } from 'react';
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
  RefreshCw,
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
  UserCheck,
  UserX
} from 'lucide-react';

// --- DATI DI DEFAULT ---
const DEFAULT_NEWS = [
  {
    id: 'news-1',
    title: 'Campionato Regionale Kyorugi Campania 2026 - Iscrizioni e Orari',
    category: 'Regionale',
    date: '15 Novembre 2026',
    location: 'PalaVesuvio - Napoli',
    content: 'Pubblicati gli orari delle operazioni di peso e il sorteggio dei tabelloni per tutte le categorie Cadetti, Junior e Senior. Si ricorda a tutti i convocati arbitrali di presentarsi entro le ore 08:00.',
    image: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'news-2',
    title: 'Aggiornamento Direttive Video Replay (VR) World Taekwondo 2026',
    category: 'Regolamento',
    date: '02 Novembre 2026',
    location: 'Nazionale',
    content: 'Emanata la circolare con i nuovi chiarimenti riguardanti la tempistica di alzata del cartellino da parte del coach ed il protocollo di revisione per calci impattanti al corpetto.',
    image: null
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

const DEFAULT_USERS = [
  { id: 'u1', firstName: 'Paolo', lastName: 'Romano', email: 'admin@taekwondo.it', password: 'admin', role: 'admin' as const, region: 'Campania', badgeId: 'FITA-ARB-001' },
  { id: 'u2', firstName: 'Marco', lastName: 'Rossi', email: 'marco.arbitro@fita.it', password: 'user', role: 'user' as const, region: 'Lazio', badgeId: 'FITA-ARB-104' }
];

export default function FitaTaekwondoApp() {
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [newsList, setNewsList] = useState(DEFAULT_NEWS);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<string>('Tutti');

  const [activeSectionId, setActiveSectionId] = useState('home');
  const [activeTabMode, setActiveTabMode] = useState<'rules' | 'materials'>('rules');

  const [searchQuery, setSearchQuery] = useState('');
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [user, setUser] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'user' | 'admin';
    region: string;
    badgeId: string;
  } | null>(null);

  const [rememberMe, setRememberMe] = useState(false);
  const [usersList, setUsersList] = useState(DEFAULT_USERS);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFirstName, setAuthFirstName] = useState('');
  const [authLastName, setAuthLastName] = useState('');
  const [authRegion, setAuthRegion] = useState('Campania');

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileTabMode, setProfileTabMode] = useState<'dati' | 'sicurezza'>('dati');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [activeVideoModal, setActiveVideoModal] = useState<{ url: string; caption: string; title: string } | null>(null);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [isAdminUsersModalOpen, setIsAdminUsersModalOpen] = useState(false);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const [editingSubsection, setEditingSubsection] = useState<any | null>(null);
  const [formSectionId, setFormSectionId] = useState('kyorugi');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');
  const [mediaSourceType, setMediaSourceType] = useState<'url' | 'file'>('file');
  const [formMediaUrl, setFormMediaUrl] = useState('');
  const [formMediaType, setFormMediaType] = useState<'image' | 'video'>('image');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const [newsTitle, setNewsTitle] = useState('');
  const [newsCategory, setNewsCategory] = useState('Regionale');
  const [newsLocation, setNewsLocation] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsImage, setNewsImage] = useState('');

  const [docTitle, setDocTitle] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [docFormat, setDocFormat] = useState('PDF');
  const [docFileName, setDocFileName] = useState('');
  const [docUrl, setDocUrl] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const savedSecs = localStorage.getItem('tkd_sections');
    if (savedSecs) { try { setSections(JSON.parse(savedSecs)); } catch (e) {} }
    const savedNews = localStorage.getItem('tkd_news');
    if (savedNews) { try { setNewsList(JSON.parse(savedNews)); } catch (e) {} }
    const savedFavs = localStorage.getItem('tkd_favorites');
    if (savedFavs) { try { setFavorites(JSON.parse(savedFavs)); } catch (e) {} }
    const savedUsersList = localStorage.getItem('tkd_users_list');
    if (savedUsersList) { try { setUsersList(JSON.parse(savedUsersList)); } catch (e) {} }

    const isRemembered = localStorage.getItem('tkd_remember_me') === 'true';
    if (isRemembered) {
      const savedUser = localStorage.getItem('tkd_current_user');
      if (savedUser) { try { setUser(JSON.parse(savedUser)); } catch (e) {} }
    }
  }, []);

  useEffect(() => { localStorage.setItem('tkd_sections', JSON.stringify(sections)); }, [sections]);
  useEffect(() => { localStorage.setItem('tkd_news', JSON.stringify(newsList)); }, [newsList]);
  useEffect(() => { localStorage.setItem('tkd_favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('tkd_users_list', JSON.stringify(usersList)); }, [usersList]);

  // CONTROLLO SICURO SENZA ERRORI DI UNDEFINED
  const accountRecord = user ? usersList.find(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()) : null;
  const isAccountAdmin = accountRecord?.role === 'admin' || user?.role === 'admin';

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

  const toggleUserRole = () => {
    if (!user || !isAccountAdmin) return;
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const updatedUser = { ...user, role: newRole as 'user' | 'admin' };
    setUser(updatedUser);
    
    if (rememberMe) {
      localStorage.setItem('tkd_current_user', JSON.stringify(updatedUser));
    }
    showToast(`Vista cambiata in: ${newRole.toUpperCase()}`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('tkd_remember_me');
    localStorage.removeItem('tkd_current_user');
    showToast('Logout effettuato');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = authEmail.trim().toLowerCase();
    const existing = usersList.find(u => u.email.toLowerCase() === cleanEmail);

    if (existing) {
      if (existing.password && existing.password !== authPassword) {
        alert('Password errata. Riprova.');
        return;
      }
      setUser(existing);
      if (rememberMe) {
        localStorage.setItem('tkd_remember_me', 'true');
        localStorage.setItem('tkd_current_user', JSON.stringify(existing));
      } else {
        localStorage.removeItem('tkd_remember_me');
        localStorage.removeItem('tkd_current_user');
      }
      setAuthModalOpen(false);
      setAuthEmail('');
      setAuthPassword('');
      showToast(`Bentornato/a ${existing.firstName}!`);
    } else {
      alert('Utente non trovato. Effettua la registrazione.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authFirstName.trim() || !authLastName.trim() || !authEmail.trim() || !authPassword.trim()) {
      alert('Compilare tutti i campi obbligatori.');
      return;
    }

    const newUserObj = {
      id: 'u_' + Date.now(),
      firstName: authFirstName.trim(),
      lastName: authLastName.trim(),
      email: authEmail.trim(),
      password: authPassword,
      role: 'user' as const,
      region: authRegion,
      badgeId: 'FITA-ARB-' + Math.floor(100 + Math.random() * 900)
    };

    setUser(newUserObj);
    setUsersList([newUserObj, ...usersList]);
    if (rememberMe) {
      localStorage.setItem('tkd_remember_me', 'true');
      localStorage.setItem('tkd_current_user', JSON.stringify(newUserObj));
    }
    setAuthModalOpen(false);
    showToast(`Registrazione completata! Benvenuto/a ${authFirstName}`);
    setAuthFirstName(''); setAuthLastName(''); setAuthEmail(''); setAuthPassword('');
  };

  const handlePromoteToAdmin = (targetId: string) => {
    setUsersList(prev => prev.map(u => u.id === targetId ? { ...u, role: 'admin' } : u));
    if (user && user.id === targetId) {
      setUser({ ...user, role: 'admin' });
    }
    showToast('Utente promosso ad Amministratore');
  };

  const handleDemoteToUser = (targetId: string) => {
    setUsersList(prev => prev.map(u => u.id === targetId ? { ...u, role: 'user' } : u));
    if (user && user.id === targetId) {
      setUser({ ...user, role: 'user' });
    }
    showToast('Utente convertito in Utente Arbitro');
  };

  const handleDeleteUser = (targetId: string) => {
    if (!confirm('Sei sicuro di voler eliminare definitivamente questo utente dal sistema?')) return;
    setUsersList(prev => prev.filter(u => u.id !== targetId));
    if (user && user.id === targetId) {
      handleLogout();
    }
    showToast('Utente eliminato.');
  };

  const openProfileModal = () => {
    if (!user) return;
    setEditFirstName(user.firstName || '');
    setEditLastName(user.lastName || '');
    setEditEmail(user.email || '');
    setEditRegion(user.region || 'Campania');
    setOldPassword(''); setNewPassword(''); setConfirmNewPassword('');
    setProfileTabMode('dati');
    setIsProfileModalOpen(true);
  };

  const handleSaveProfileData = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const updatedUser = {
      ...user,
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      email: editEmail.trim(),
      region: editRegion
    };
    setUser(updatedUser);
    setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, ...updatedUser } : u));
    if (localStorage.getItem('tkd_remember_me') === 'true') {
      localStorage.setItem('tkd_current_user', JSON.stringify(updatedUser));
    }
    showToast('Profilo aggiornato!');
  };

  const handleSavePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      alert('La nuova password e la conferma non coincidono.');
      return;
    }
    showToast('🔒 Password modificata!');
    setOldPassword(''); setNewPassword(''); setConfirmNewPassword('');
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
      image: newsImage || null
    };
    setNewsList([newItem, ...newsList]);
    setIsNewsModalOpen(false);
    setNewsTitle(''); setNewsContent(''); setNewsLocation(''); setNewsImage('');
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

  const handleDeleteSubsection = (secId: string, subId: string) => {
    if (!confirm('Eliminare questo articolo?')) return;
    setSections(prev =>
      prev.map(sec => sec.id === secId ? { ...sec, subsections: sec.subsections.filter(s => s.id !== subId) } : sec)
    );
    showToast('Articolo eliminato.');
  };

  const currentSection = sections.find(s => s.id === activeSectionId);

  const filteredSubsections = currentSection ? currentSection.subsections.filter(sub => {
    const matchesSearch =
      sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.tags && sub.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesFav = showOnlyFavorites ? favorites.includes(sub.id) : true;
    return matchesSearch && matchesFav;
  }) : [];

  const filteredNews = newsList.filter(n => {
    if (selectedNewsCategory === 'Tutti') return true;
    return n.category === selectedNewsCategory;
  });

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
              {user && isAccountAdmin && (
                <button
                  onClick={toggleUserRole}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors"
                  title="Cambia la vista tra Admin e Utente Arbitro"
                >
                  <RefreshCw className="w-3 h-3 text-amber-400" />
                  <span>Vista: <strong className={user.role === 'admin' ? 'text-red-400' : 'text-blue-400'}>{user.role.toUpperCase()}</strong></span>
                </button>
              )}

              {user ? (
                <div className="flex items-center gap-3">
                  <button onClick={openProfileModal} className="flex items-center gap-1 text-slate-200 hover:text-amber-400 font-semibold text-xs">
                    <Settings className="w-3.5 h-3.5 text-amber-400" />
                    <span>{user.firstName} {user.lastName}</span>
                  </button>

                  {user.role === 'admin' && (
                    <button
                      onClick={() => setIsAdminUsersModalOpen(true)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#A60F2D] hover:bg-red-800 text-white text-[11px] font-bold shadow"
                    >
                      <Users className="w-3.5 h-3.5" /> Gestione Utenti
                    </button>
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 sm:h-9 bg-slate-100 border border-slate-300 rounded-lg pl-8 pr-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#0B1B3D]"
                />
              </div>

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
                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold overflow-x-auto w-full sm:w-auto">
                    {['Tutti', 'Regionale', 'Interregionale', 'Nazionale'].map((cat) => (
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
                    <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
                      <div>
                        {item.image && (
                          <div className="h-36 sm:h-44 bg-slate-100 overflow-hidden relative">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                            <span className="absolute top-2.5 left-2.5 bg-[#0B1B3D] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                              {item.category}
                            </span>
                          </div>
                        )}
                        <div className="p-4 space-y-2.5">
                          {!item.image && (
                            <span className="inline-block bg-[#0B1B3D] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                              {item.category}
                            </span>
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
                        <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex justify-end">
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
                  <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <button
                      onClick={() => setShowOnlyFavorites(prev => !prev)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 border ${
                        showOnlyFavorites ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-white' : 'text-amber-500'}`} />
                      <span>{showOnlyFavorites ? 'Preferiti' : 'Tutti'}</span>
                    </button>

                    {user && user.role === 'admin' && (
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
                        <div key={sub.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                          <div
                            onClick={() => toggleAccordion(sub.id)}
                            className="p-3.5 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 select-none"
                          >
                            <div className="flex items-center gap-2.5">
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
              openProfileModal();
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

      {/* --- MODALE LOGIN / REGISTRAZIONE --- */}
      <AnimatePresence>
        {authModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white rounded-t-2xl sm:rounded-xl border border-slate-200 p-5 shadow-2xl relative text-xs max-h-[85vh] overflow-y-auto">
              <button onClick={() => setAuthModalOpen(false)} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5" /></button>

              <div className="text-center mb-4">
                <div className="w-10 h-10 bg-[#0B1B3D] rounded-lg text-white font-black flex items-center justify-center mx-auto mb-2 shadow border-b-2 border-[#A60F2D]">
                  FITA
                </div>
                <h3 className="text-base font-bold text-[#0B1B3D]">
                  {authMode === 'login' ? 'Accesso Portale Arbitri' : 'Nuova Registrazione'}
                </h3>
              </div>

              {authMode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Email</label>
                    <input type="email" required placeholder="arbitro@fita.it" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full bg-slate-50 border p-2 rounded text-slate-800" />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Password</label>
                    <input type="password" required placeholder="••••••••" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-slate-50 border p-2 rounded text-slate-800" />
                  </div>

                  <div className="py-1">
                    <label onClick={() => setRememberMe(!rememberMe)} className="flex items-center gap-2 cursor-pointer text-slate-600 font-semibold select-none">
                      {rememberMe ? <CheckSquare className="w-4 h-4 text-[#0B1B3D]" /> : <Square className="w-4 h-4 text-slate-400" />}
                      <span>Ricordami su questo dispositivo</span>
                    </label>
                  </div>

                  <button type="submit" className="w-full py-2.5 rounded bg-[#0B1B3D] text-white font-bold shadow hover:bg-slate-800 transition-colors">
                    Accedi
                  </button>

                  <div className="text-center pt-3 border-t border-slate-200">
                    <span className="text-slate-500">Non hai un account? </span>
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className="text-[#0B1B3D] font-bold hover:underline"
                    >
                      Registrati
                    </button>
                  </div>
                </form>
              )}

              {authMode === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Nome *</label>
                      <input type="text" required placeholder="Marco" value={authFirstName} onChange={(e) => setAuthFirstName(e.target.value)} className="w-full bg-slate-50 border p-2 rounded text-slate-800" />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Cognome *</label>
                      <input type="text" required placeholder="Rossi" value={authLastName} onChange={(e) => setAuthLastName(e.target.value)} className="w-full bg-slate-50 border p-2 rounded text-slate-800" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Email *</label>
                    <input type="email" required placeholder="marco.rossi@fita.it" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full bg-slate-50 border p-2 rounded text-slate-800" />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Password *</label>
                    <input type="password" required placeholder="••••••••" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-slate-50 border p-2 rounded text-slate-800" />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Regione / Comitato</label>
                    <select value={authRegion} onChange={(e) => setAuthRegion(e.target.value)} className="w-full bg-slate-50 border p-2 rounded text-slate-800">
                      {['Campania', 'Lazio', 'Lombardia', 'Piemonte', 'Sicilia', 'Veneto', 'Emilia-Romagna', 'Puglia', 'Toscana'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div className="py-1">
                    <label onClick={() => setRememberMe(!rememberMe)} className="flex items-center gap-2 cursor-pointer text-slate-600 font-semibold select-none">
                      {rememberMe ? <CheckSquare className="w-4 h-4 text-[#0B1B3D]" /> : <Square className="w-4 h-4 text-slate-400" />}
                      <span>Ricordami su questo dispositivo</span>
                    </label>
                  </div>

                  <button type="submit" className="w-full py-2.5 rounded bg-[#0B1B3D] text-white font-bold shadow hover:bg-slate-800 transition-colors">
                    Crea Account
                  </button>

                  <div className="text-center pt-2 border-t border-slate-200">
                    <span className="text-slate-500">Hai già un account? </span>
                    <button type="button" onClick={() => setAuthMode('login')} className="text-[#0B1B3D] font-bold hover:underline">
                      Accedi
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODALE GESTIONE UTENTI ADMIN --- */}
      <AnimatePresence>
        {isAdminUsersModalOpen && user && user.role === 'admin' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-[#0B1B3D] flex items-center gap-2">
                  <Users className="w-5 h-5 text-red-600" />
                  <span>Pannello Gestione Utenti & Admin</span>
                </h3>
                <button onClick={() => setIsAdminUsersModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {usersList.map((u) => {
                  const isSelf = u.id === user.id;
                  const uIsAdmin = u.role === 'admin';

                  return (
                    <div key={u.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-800">{u.firstName} {u.lastName}</span>
                          {uIsAdmin ? (
                            <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold text-[10px] border border-red-200 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-red-600" /> Admin
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px] border border-blue-200">
                              Utente Arbitro
                            </span>
                          )}
                          {isSelf && <span className="text-[10px] text-slate-400 font-semibold">(Tu)</span>}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{u.email} • {u.region} • Badge: {u.badgeId || 'N/A'}</p>
                      </div>

                      <div className="flex items-center gap-1.5 justify-end">
                        {uIsAdmin ? (
                          <button
                            onClick={() => handleDemoteToUser(u.id)}
                            disabled={isSelf}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
                              isSelf ? 'opacity-40 cursor-not-allowed bg-slate-200 text-slate-500' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                            }`}
                            title="Rendi un Utente Arbitro semplice"
                          >
                            <UserX className="w-3.5 h-3.5" /> Declassa
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePromoteToAdmin(u.id)}
                            className="px-2.5 py-1 rounded text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition-colors shadow-sm"
                            title="Rendi Amministratore del sistema"
                          >
                            <UserCheck className="w-3.5 h-3.5" /> Promuovi Admin
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 rounded text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                          title="Elimina utente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* PROFILO MODAL */}
      <AnimatePresence>
        {isProfileModalOpen && user && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-xl border border-slate-200 p-5 shadow-2xl space-y-4 text-xs max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#0B1B3D] text-white font-bold flex items-center justify-center text-xs">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0B1B3D]">{user.firstName} {user.lastName}</h3>
                    <p className="text-[10px] text-slate-500">{user.email} • {user.region}</p>
                  </div>
                </div>
                <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-lg font-bold">
                <button onClick={() => setProfileTabMode('dati')} className={`flex-1 py-1.5 rounded-md text-center text-xs ${profileTabMode === 'dati' ? 'bg-[#0B1B3D] text-white' : 'text-slate-600'}`}>
                  Dati Personali
                </button>
                <button onClick={() => setProfileTabMode('sicurezza')} className={`flex-1 py-1.5 rounded-md text-center text-xs ${profileTabMode === 'sicurezza' ? 'bg-[#0B1B3D] text-white' : 'text-slate-600'}`}>
                  Password
                </button>
              </div>

              {profileTabMode === 'dati' && (
                <form onSubmit={handleSaveProfileData} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Nome</label>
                      <input type="text" required value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} className="w-full bg-slate-50 border p-2 rounded text-slate-800" />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Cognome</label>
                      <input type="text" required value={editLastName} onChange={(e) => setEditLastName(e.target.value)} className="w-full bg-slate-50 border p-2 rounded text-slate-800" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Email</label>
                    <input type="email" required value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full bg-slate-50 border p-2 rounded text-slate-800" />
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t">
                    <button type="button" onClick={handleLogout} className="text-red-600 font-bold text-xs flex items-center gap-1">
                      <LogOut className="w-4 h-4" /> Esci dall'account
                    </button>
                    <button type="submit" className="px-4 py-2 rounded bg-[#0B1B3D] text-white font-bold">Salva</button>
                  </div>
                </form>
              )}

              {profileTabMode === 'sicurezza' && (
                <form onSubmit={handleSavePasswordChange} className="space-y-3">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Nuova Password</label>
                    <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-slate-50 border p-2 rounded text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Conferma Password</label>
                    <input type="password" required value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="w-full bg-slate-50 border p-2 rounded text-slate-800" />
                  </div>
                  <div className="flex justify-end pt-3 border-t">
                    <button type="submit" className="px-4 py-2 rounded bg-[#0B1B3D] text-white font-bold">Aggiorna Password</button>
                  </div>
                </form>
              )}
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