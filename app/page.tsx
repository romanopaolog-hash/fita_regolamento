'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
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
  Filter
} from 'lucide-react';

// --- DATI DI DEFAULT (USATI SOLO AL PRIMO AVVIO ASSOLUTO) ---
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
  { id: 'u1', firstName: 'Paolo', lastName: 'Romano', email: 'admin@taekwondo.it', role: 'admin', region: 'Campania', badgeId: 'FITA-ARB-001' },
  { id: 'u2', firstName: 'Marco', lastName: 'Rossi', email: 'marco.arbitro@fita.it', role: 'user', region: 'Lazio', badgeId: 'FITA-ARB-104' },
  { id: 'u3', firstName: 'Laura', lastName: 'Bianchi', email: 'laura.coach@tkd.com', role: 'user', region: 'Lombardia', badgeId: 'FITA-ARB-212' }
];

export default function FitaTaekwondoApp() {
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [newsList, setNewsList] = useState(DEFAULT_NEWS);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<string>('Tutti');

  // 'home' o id sezione
  const [activeSectionId, setActiveSectionId] = useState('home');
  const [activeTabMode, setActiveTabMode] = useState<'rules' | 'materials'>('rules');

  const [searchQuery, setSearchQuery] = useState('');
  
  // STATO FISARMONICHE: Inizializzato vuoto (articoli tutti chiusi all'ingresso)
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Utente Corrente & Autenticazione
  const [user, setUser] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'user' | 'admin';
    region: string;
    badgeId: string;
  } | null>({
    id: 'u1',
    firstName: 'Paolo',
    lastName: 'Romano',
    email: 'admin@taekwondo.it',
    role: 'admin',
    region: 'Campania',
    badgeId: 'FITA-ARB-001'
  });

  const [usersList, setUsersList] = useState(DEFAULT_USERS);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Campi Form Login / Registrazione
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFirstName, setAuthFirstName] = useState('');
  const [authLastName, setAuthLastName] = useState('');
  const [authRegion, setAuthRegion] = useState('Campania');
  const [authRoleChoice, setAuthRoleChoice] = useState<'user' | 'admin'>('user');

  // Area Privata & Impostazioni Profilo Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileTabMode, setProfileTabMode] = useState<'dati' | 'sicurezza'>('dati');
  
  // Campi Edizione Profilo
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Modali Altri
  const [activeVideoModal, setActiveVideoModal] = useState<{ url: string; caption: string; title: string } | null>(null);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [isAdminUsersModalOpen, setIsAdminUsersModalOpen] = useState(false);
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // Form Modifica Articolo
  const [editingSubsection, setEditingSubsection] = useState<any | null>(null);
  const [formSectionId, setFormSectionId] = useState('kyorugi');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');
  const [mediaSourceType, setMediaSourceType] = useState<'url' | 'file'>('file');
  const [formMediaUrl, setFormMediaUrl] = useState('');
  const [formMediaType, setFormMediaType] = useState<'image' | 'video'>('image');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  // Form Nuova Notizia (Home)
  const [newsTitle, setNewsTitle] = useState('');
  const [newsCategory, setNewsCategory] = useState('Regionale');
  const [newsLocation, setNewsLocation] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsImage, setNewsImage] = useState('');

  // Form Nuovo Documento / Materiale
  const [docTitle, setDocTitle] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [docFormat, setDocFormat] = useState('PDF');
  const [docFileName, setDocFileName] = useState('');
  const [docUrl, setDocUrl] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- PERSISTENZA LOCALSTORAGE ---
  useEffect(() => {
    const savedSecs = localStorage.getItem('tkd_sections');
    if (savedSecs) {
      try { setSections(JSON.parse(savedSecs)); } catch (e) {}
    }
    const savedNews = localStorage.getItem('tkd_news');
    if (savedNews) {
      try { setNewsList(JSON.parse(savedNews)); } catch (e) {}
    }
    const savedFavs = localStorage.getItem('tkd_favorites');
    if (savedFavs) {
      try { setFavorites(JSON.parse(savedFavs)); } catch (e) {}
    }
    const savedUser = localStorage.getItem('tkd_current_user');
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch (e) {}
    }
    const savedUsersList = localStorage.getItem('tkd_users_list');
    if (savedUsersList) {
      try { setUsersList(JSON.parse(savedUsersList)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tkd_sections', JSON.stringify(sections));
  }, [sections]);

  useEffect(() => {
    localStorage.setItem('tkd_news', JSON.stringify(newsList));
  }, [newsList]);

  useEffect(() => {
    localStorage.setItem('tkd_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('tkd_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('tkd_current_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('tkd_users_list', JSON.stringify(usersList));
  }, [usersList]);

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
    if (!user) return;
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const updatedUser = { ...user, role: newRole as 'user' | 'admin' };
    setUser(updatedUser);
    setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    showToast(`Ruolo attivo: ${newRole.toUpperCase()}`);
  };

  // --- GESTIONE LOGIN & REGISTRAZIONE ---
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = usersList.find(u => u.email.toLowerCase() === authEmail.trim().toLowerCase());
    
    if (existing) {
      setUser(existing as any);
      showToast(`Bentornato/a, ${existing.firstName} ${existing.lastName}!`);
    } else {
      // Accesso simulato per test se l'email non esiste
      const newUserObj = {
        id: 'u_' + Date.now(),
        firstName: authEmail.split('@')[0] || 'Arbitro',
        lastName: 'FITA',
        email: authEmail,
        role: 'user' as const,
        region: 'Campania',
        badgeId: 'FITA-ARB-' + Math.floor(100 + Math.random() * 900)
      };
      setUser(newUserObj);
      setUsersList([...usersList, newUserObj]);
      showToast(`Accesso effettuato come ${newUserObj.firstName}`);
    }

    setAuthModalOpen(false);
    setAuthEmail('');
    setAuthPassword('');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authFirstName.trim() || !authLastName.trim() || !authEmail.trim()) {
      alert('Compilare tutti i campi obbligatori');
      return;
    }

    const newUserObj = {
      id: 'u_' + Date.now(),
      firstName: authFirstName.trim(),
      lastName: authLastName.trim(),
      email: authEmail.trim(),
      role: authRoleChoice,
      region: authRegion,
      badgeId: 'FITA-ARB-' + Math.floor(100 + Math.random() * 900)
    };

    setUser(newUserObj);
    setUsersList([newUserObj, ...usersList]);
    setAuthModalOpen(false);
    showToast(`Registrazione completata! Benvenuto/a ${authFirstName} ${authLastName}`);

    // Reset Form
    setAuthFirstName('');
    setAuthLastName('');
    setAuthEmail('');
    setAuthPassword('');
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim()) return;
    showToast(`📧 Link di ripristino inviato all'indirizzo ${authEmail}`);
    setAuthModalOpen(false);
    setAuthEmail('');
  };

  // --- APERTURA MODAL PROFILO ---
  const openProfileModal = () => {
    if (!user) return;
    setEditFirstName(user.firstName || '');
    setEditLastName(user.lastName || '');
    setEditEmail(user.email || '');
    setEditRegion(user.region || 'Campania');
    setOldPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
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
    showToast('Profilo aggiornato con successo!');
  };

  const handleSavePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      alert('La nuova password e la conferma non coincidono.');
      return;
    }
    if (newPassword.length < 6) {
      alert('La nuova password deve contenere almeno 6 caratteri.');
      return;
    }
    showToast('🔒 Password modificata con successo!');
    setOldPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      const localUrl = URL.createObjectURL(file);
      setFormMediaUrl(localUrl);
      if (file.type.startsWith('video/')) {
        setFormMediaType('video');
      } else {
        setFormMediaType('image');
      }
    }
  };

  const handleDocFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocFileName(file.name);
      const localUrl = URL.createObjectURL(file);
      setDocUrl(localUrl);
      const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
      setDocFormat(ext);
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
    setNewsTitle('');
    setNewsContent('');
    setNewsLocation('');
    setNewsImage('');
    showToast('Nuova notizia pubblicata!');
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
    setDocTitle('');
    setDocDescription('');
    setDocFileName('');
    setDocUrl('');
    showToast('Documento salvato con successo!');
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
      media: formMediaUrl ? [{ type: formMediaType, url: formMediaUrl, caption: selectedFileName ? `File: ${selectedFileName}` : 'Allegato multimediale' }] : []
    };

    setSections(prev =>
      prev.map(sec => {
        if (sec.id === formSectionId) {
          if (editingSubsection) {
            return {
              ...sec,
              subsections: sec.subsections.map(sub => sub.id === editingSubsection.id ? newSub : sub)
            };
          } else {
            return {
              ...sec,
              subsections: [...sec.subsections, newSub]
            };
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

  // Filtro ricerca + Preferiti
  const filteredSubsections = currentSection ? currentSection.subsections.filter(sub => {
    const matchesSearch =
      sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.tags && sub.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesFav = showOnlyFavorites ? favorites.includes(sub.id) : true;

    return matchesSearch && matchesFav;
  }) : [];

  // Filtro News Home
  const filteredNews = newsList.filter(n => {
    if (selectedNewsCategory === 'Tutti') return true;
    return n.category === selectedNewsCategory;
  });

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 font-sans flex flex-col justify-between">
      
      {/* Toast Notifiche */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-6 z-50 bg-[#0B1B3D] text-white px-5 py-3 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border-l-4 border-[#A60F2D]"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        {/* --- TOPBAR UTILITIES (FITA Navy) --- */}
        <div className="bg-[#0B1B3D] text-white text-xs border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-bold tracking-wider text-slate-300">FEDERAZIONE ITALIANA TAEKWONDO</span>
              <span className="hidden sm:inline text-slate-500">|</span>
              <span className="hidden sm:inline text-slate-300">Commissione Nazionale Arbitrale</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Switch Ruolo Admin/User per test */}
              {user && (
                <button
                  onClick={toggleUserRole}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 border border-slate-700 transition-colors"
                  title="Cambia tra Utente Arbitro e Amministratore"
                >
                  <RefreshCw className="w-3 h-3 text-amber-400" />
                  <span>Ruolo: <strong className={user.role === 'admin' ? 'text-red-400' : 'text-blue-400'}>{user.role.toUpperCase()}</strong></span>
                </button>
              )}

              {/* User Profile / Login */}
              {user ? (
                <div className="flex items-center gap-3">
                  {/* Pulsante Apri Area Privata */}
                  <button
                    onClick={openProfileModal}
                    className="flex items-center gap-1.5 text-slate-200 hover:text-amber-400 font-semibold transition-colors"
                    title="Apri Area Privata e Impostazioni Profilo"
                  >
                    <Settings className="w-3.5 h-3.5 text-amber-400" />
                    <span>{user.firstName} {user.lastName}</span>
                  </button>

                  {user.role === 'admin' && (
                    <button
                      onClick={() => setIsAdminUsersModalOpen(true)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#A60F2D] text-white text-[10px] font-bold"
                    >
                      <Users className="w-3 h-3" /> Utenti Admin
                    </button>
                  )}
                  
                  <button onClick={() => setUser(null)} className="text-slate-400 hover:text-white" title="Logout">
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setAuthMode('login'); setAuthModalOpen(true); }}
                  className="flex items-center gap-1.5 text-slate-200 hover:text-white font-semibold"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Area Riservata / Accedi</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* --- HEADER ISTITUZIONALE FITA --- */}
        <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveSectionId('home')}>
              <div className="w-12 h-12 bg-[#0B1B3D] rounded-lg flex items-center justify-center text-white font-black text-xl shadow-md border-b-4 border-[#A60F2D]">
                FITA
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black tracking-tight text-[#0B1B3D]">PORTALE ARBITRALE</h1>
                  <span className="bg-slate-100 text-[#0B1B3D] text-[10px] font-bold px-2 py-0.5 rounded border border-slate-300">
                    FITA / WT
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Regolamenti, Materiali Didattici & Eventi Ufficiali</p>
              </div>
            </div>

            {/* PULSANTI NOTIFICHE & RICERCA (DIMENSIONE IDENTICA) */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleNotifications}
                className={`h-9 px-3.5 rounded-lg border text-xs font-bold flex items-center gap-2 shadow-sm transition-all whitespace-nowrap ${
                  notificationsEnabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                }`}
                title="Attiva/Disattiva notifiche per nuove comunicazioni"
              >
                {notificationsEnabled ? (
                  <>
                    <Bell className="w-4 h-4 text-emerald-600 fill-emerald-600/20 shrink-0" />
                    <span className="hidden sm:inline">Notifiche Attive</span>
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="hidden sm:inline">Notifiche Disattivate</span>
                  </>
                )}
              </button>

              <div className="w-full max-w-xs relative hidden sm:flex items-center h-9">
                <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cerca norme o documenti..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 bg-slate-100 border border-slate-300 rounded-lg pl-9 pr-3 text-xs text-slate-800 focus:outline-none focus:border-[#0B1B3D]"
                />
              </div>
            </div>
          </div>
        </header>

        {/* --- NAVIGAZIONE FISSA A 5 COLONNE --- */}
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              
              {/* Tab HOME */}
              <button
                onClick={() => setActiveSectionId('home')}
                className={`py-2.5 px-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                  activeSectionId === 'home'
                    ? 'bg-[#0B1B3D] text-white border-[#0B1B3D] shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <HomeIcon className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">Home / News</span>
              </button>

              {/* Tab SEZIONI REGOLAMENTO */}
              {sections.map((sec) => {
                const isActive = activeSectionId === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => { setActiveSectionId(sec.id); setActiveTabMode('rules'); }}
                    className={`py-2.5 px-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      isActive
                        ? 'bg-[#0B1B3D] text-white border-[#0B1B3D] shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <BookOpen className={`w-4 h-4 shrink-0 ${isActive ? 'text-red-400' : 'text-slate-400'}`} />
                    <span className="truncate">{sec.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* --- CONTENUTO PRINCIPALE --- */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          
          {/* ==================== VISTA 1: HOME / NEWS & EVENTI ==================== */}
          {activeSectionId === 'home' && (
            <div className="space-y-6">
              
              {/* Header Home con Filtri Categoria */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#A60F2D] uppercase tracking-wider mb-1">
                    <Megaphone className="w-4 h-4" /> Comunicati Ufficiali
                  </div>
                  <h2 className="text-2xl font-black text-[#0B1B3D]">Notizie & Gare Regionali / Interregionali</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Aggiornamenti sulle prossime competizioni, convocazioni arbitrali e novità regolamentari.</p>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto">
                  {/* Filtro Categoria Notizie */}
                  <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200 text-xs font-bold">
                    {['Tutti', 'Regionale', 'Interregionale', 'Nazionale'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedNewsCategory(cat)}
                        className={`px-2.5 py-1 rounded transition-colors ${
                          selectedNewsCategory === cat ? 'bg-[#0B1B3D] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Tasto Pubblica Notizia per Admin */}
                  {user && user.role === 'admin' && (
                    <button
                      onClick={() => setIsNewsModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0B1B3D] hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Pubblica Notizia</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Griglia Notizie */}
              {filteredNews.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-lg border border-slate-200">
                  <p className="text-slate-500 font-semibold text-sm">Nessuna notizia disponibile per la categoria selezionata.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredNews.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
                      <div>
                        {item.image && (
                          <div className="h-44 bg-slate-100 overflow-hidden relative">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                            <span className="absolute top-3 left-3 bg-[#0B1B3D] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                              {item.category}
                            </span>
                          </div>
                        )}
                        <div className="p-5 space-y-3">
                          {!item.image && (
                            <span className="inline-block bg-[#0B1B3D] text-white text-[10px] font-bold px-2 py-0.5 rounded mb-1">
                              {item.category}
                            </span>
                          )}
                          <h3 className="text-base font-bold text-[#0B1B3D] leading-snug">{item.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 border-y border-slate-100 py-2">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-red-600" /> {item.date}</span>
                            {item.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-600" /> {item.location}</span>}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{item.content}</p>
                        </div>
                      </div>

                      {user && user.role === 'admin' && (
                        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                          <button
                            onClick={() => handleDeleteNews(item.id)}
                            className="text-red-600 hover:text-red-800 text-xs font-semibold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Elimina Notizia
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== VISTA 2: SEZIONE REGOLAMENTO & MATERIALI ==================== */}
          {currentSection && (
            <div className="space-y-6">
              
              {/* Header Sezione */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#A60F2D] uppercase tracking-wider mb-1">
                    <span>Commissione Arbitrale FITA</span>
                    <span>/</span>
                    <span>{currentSection.code}</span>
                  </div>
                  <h2 className="text-2xl font-black text-[#0B1B3D]">{currentSection.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{currentSection.subtitle}</p>
                </div>

                {/* Sub-Tab Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
                  <button
                    onClick={() => setActiveTabMode('rules')}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTabMode === 'rules' ? 'bg-[#0B1B3D] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Articoli Regolamento
                  </button>
                  <button
                    onClick={() => setActiveTabMode('materials')}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTabMode === 'materials' ? 'bg-[#0B1B3D] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" /> Materiali Scaricabili ({currentSection.documents?.length || 0})
                  </button>
                </div>
              </div>

              {/* TAB 1: ARTICOLI REGOLAMENTO */}
              {activeTabMode === 'rules' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-[#0B1B3D] uppercase tracking-wider">Norme & Articoli</h3>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowOnlyFavorites(prev => !prev)}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1.5 border ${
                          showOnlyFavorites
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-white' : 'text-amber-500'}`} />
                        <span>{showOnlyFavorites ? 'Mostrando solo Preferiti' : 'Filtra per Preferiti'}</span>
                      </button>

                      {user && user.role === 'admin' && (
                        <button
                          onClick={() => {
                            setEditingSubsection(null);
                            setFormSectionId(currentSection.id);
                            setFormTitle('');
                            setFormContent('');
                            setFormTags('');
                            setFormMediaUrl('');
                            setSelectedFileName(null);
                            setIsEditingModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#0B1B3D] text-white font-bold text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" /> Aggiungi Articolo
                        </button>
                      )}
                    </div>
                  </div>

                  {filteredSubsections.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-lg border border-slate-200">
                      <p className="text-slate-500 text-sm font-semibold">
                        {showOnlyFavorites ? 'Nessun articolo salvato tra i preferiti in questa sezione.' : 'Nessun articolo trovato.'}
                      </p>
                    </div>
                  ) : (
                    filteredSubsections.map((sub) => {
                      const isOpen = openAccordions[sub.id] ?? false;
                      const isFav = favorites.includes(sub.id);

                      return (
                        <div key={sub.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                          <div
                            onClick={() => toggleAccordion(sub.id)}
                            className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 select-none border-b border-slate-100"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded ${isOpen ? 'bg-[#0B1B3D] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                <BookOpen className="w-4 h-4" />
                              </div>
                              <div>
                                <h3 className="text-base font-bold text-[#0B1B3D]">{sub.title}</h3>
                                {sub.tags && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {sub.tags.map((tag, idx) => (
                                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(sub.id); }}
                                className={`p-2 rounded transition-colors ${isFav ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500' : ''}`} />
                              </button>

                              {user && user.role === 'admin' && (
                                <div className="flex items-center gap-1 border-l border-slate-200 pl-2 ml-1" onClick={(e) => e.stopPropagation()}>
                                  <button onClick={() => handleEditClick(sub, currentSection.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleDeleteSubsection(currentSection.id, sub.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}

                              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-[#0B1B3D]' : ''}`} />
                            </div>
                          </div>

                          {isOpen && (
                            <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-700 leading-relaxed">
                              <div className="whitespace-pre-line text-sm text-slate-800 font-normal max-w-none">
                                {sub.content}
                              </div>

                              {sub.media && sub.media.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-slate-200">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B1B3D] mb-3 flex items-center gap-1.5">
                                    <Video className="w-4 h-4 text-[#A60F2D]" /> Media ed Esempi Arbitrali
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {sub.media.map((item, mIdx) => (
                                      <div key={mIdx} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                        {item.type === 'image' ? (
                                          <img src={item.url} alt={item.caption || 'Media'} className="w-full aspect-video object-cover" />
                                        ) : (
                                          <div
                                            onClick={() => setActiveVideoModal({ url: item.url, caption: item.caption || '', title: sub.title })}
                                            className="aspect-video bg-slate-900 flex items-center justify-center cursor-pointer relative group"
                                          >
                                            <div className="w-12 h-12 rounded-full bg-[#A60F2D] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                              <Play className="w-5 h-5 fill-white ml-0.5" />
                                            </div>
                                            <span className="absolute bottom-2 right-2 text-[10px] bg-black/80 text-white px-2 py-0.5 rounded font-bold">
                                              Riproduci VR
                                            </span>
                                          </div>
                                        )}
                                        {item.caption && (
                                          <div className="p-2.5 bg-slate-50 text-[11px] text-slate-600 border-t border-slate-100">
                                            {item.caption}
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

              {/* TAB 2: MATERIALI & DOCUMENTI SCARICABILI */}
              {activeTabMode === 'materials' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-[#0B1B3D] uppercase tracking-wider">Documenti & Slide Didattiche</h3>
                      <p className="text-xs text-slate-500">Materiale scaricabile per la sezione {currentSection.title}.</p>
                    </div>

                    {user && user.role === 'admin' && (
                      <button
                        onClick={() => setIsDocModalOpen(true)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#0B1B3D] text-white font-bold text-xs shadow"
                      >
                        <Upload className="w-3.5 h-3.5" /> Carica Nuovo Documento
                      </button>
                    )}
                  </div>

                  {(!currentSection.documents || currentSection.documents.length === 0) ? (
                    <div className="bg-white p-12 text-center rounded-lg border border-slate-200">
                      <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-600 font-bold text-sm">Nessun documento caricato per questa sezione.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentSection.documents.map((doc) => (
                        <div key={doc.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-3 rounded-lg flex items-center justify-center text-white font-black text-xs ${
                              doc.format === 'PPTX' ? 'bg-orange-600' : 'bg-red-700'
                            }`}>
                              {doc.format}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-[#0B1B3D] leading-snug">{doc.title}</h4>
                              <p className="text-xs text-slate-500 mt-1">{doc.description}</p>
                              <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-2 font-medium">
                                <span>Dimensione: {doc.size}</span>
                                <span>•</span>
                                <span>Caricato: {doc.date}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <a
                              href={doc.url}
                              download={doc.title}
                              className="px-3 py-1.5 rounded bg-slate-100 hover:bg-[#0B1B3D] hover:text-white text-slate-700 font-bold text-xs transition-colors flex items-center gap-1 border border-slate-300"
                              onClick={(e) => {
                                if (doc.url === '#') {
                                  e.preventDefault();
                                  showToast(`Download di "${doc.title}" avviato!`);
                                }
                              }}
                            >
                              <Download className="w-3.5 h-3.5" /> Scarica
                            </a>
                            {user && user.role === 'admin' && (
                              <button
                                onClick={() => handleDeleteDocument(currentSection.id, doc.id)}
                                className="text-red-600 hover:underline text-[11px]"
                              >
                                Elimina
                              </button>
                            )}
                          </div>
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

      {/* --- FOOTER ISTITUZIONALE --- */}
      <footer className="bg-[#0B1B3D] text-slate-400 text-xs py-6 border-t border-slate-800 w-full mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#A60F2D] text-white font-black rounded flex items-center justify-center text-xs">
              FITA
            </div>
            <div>
              <p className="text-white font-bold">Federazione Italiana Taekwondo</p>
              <p className="text-[10px] text-slate-400">Tutti i diritti riservati © 2026 - Documentazione Arbitrale Ufficiale</p>
            </div>
          </div>
          <div className="text-[11px] text-slate-400">
            Regolamento Kyorugi • Video Replay • Poomsae • Freestyle • Materiali Didattici
          </div>
        </div>
      </footer>

      {/* --- MODAL AREA PRIVATA & IMPOSTAZIONI PROFILO (2 SCHEDE) --- */}
      <AnimatePresence>
        {isProfileModalOpen && user && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white rounded-lg border border-slate-200 p-6 shadow-2xl relative space-y-4 text-xs">
              <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                <div className="w-10 h-10 rounded-full bg-[#0B1B3D] text-white font-bold flex items-center justify-center text-sm">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0B1B3D]">{user.firstName} {user.lastName}</h3>
                  <p className="text-[11px] text-slate-500">{user.email} • <strong className="text-amber-600">{user.region}</strong></p>
                </div>
              </div>

              {/* Sub-Tabs: Dati Personali vs Sicurezza */}
              <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200 font-bold">
                <button
                  onClick={() => setProfileTabMode('dati')}
                  className={`flex-1 py-1.5 rounded transition-all text-center flex items-center justify-center gap-1.5 ${
                    profileTabMode === 'dati' ? 'bg-[#0B1B3D] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5" /> Dati Personali
                </button>
                <button
                  onClick={() => setProfileTabMode('sicurezza')}
                  className={`flex-1 py-1.5 rounded transition-all text-center flex items-center justify-center gap-1.5 ${
                    profileTabMode === 'sicurezza' ? 'bg-[#0B1B3D] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" /> Sicurezza & Password
                </button>
              </div>

              {/* TAB 1: MODIFICA DATI PERSONALI */}
              {profileTabMode === 'dati' && (
                <form onSubmit={handleSaveProfileData} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Nome</label>
                      <input
                        type="text"
                        required
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Cognome</label>
                      <input
                        type="text"
                        required
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Regione / Comitato Ufficiale</label>
                    <select
                      value={editRegion}
                      onChange={(e) => setEditRegion(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                    >
                      {['Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna', 'Friuli Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche', 'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana', 'Trentino-Alto Adige', 'Umbria', 'Valle d\'Aosta', 'Veneto'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                    <button type="button" onClick={() => setIsProfileModalOpen(false)} className="px-4 py-2 rounded bg-slate-200 text-slate-700 font-semibold">
                      Annulla
                    </button>
                    <button type="submit" className="px-4 py-2 rounded bg-[#0B1B3D] text-white font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Salva Modifiche
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: SICUREZZA & PASSWORD */}
              {profileTabMode === 'sicurezza' && (
                <form onSubmit={handleSavePasswordChange} className="space-y-3">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Password Attuale</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Nuova Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Minimo 6 caratteri"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Conferma Nuova Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                    <button type="button" onClick={() => setIsProfileModalOpen(false)} className="px-4 py-2 rounded bg-slate-200 text-slate-700 font-semibold">
                      Annulla
                    </button>
                    <button type="submit" className="px-4 py-2 rounded bg-[#0B1B3D] text-white font-bold">
                      Aggiorna Password
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL LOGIN / REGISTRAZIONE / RECUPERO PASSWORD --- */}
      <AnimatePresence>
        {authModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white rounded-lg border border-slate-200 p-6 shadow-2xl relative text-xs">
              <button onClick={() => setAuthModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-10 h-10 bg-[#0B1B3D] rounded-lg text-white font-black flex items-center justify-center mx-auto mb-2 shadow-md border-b-2 border-[#A60F2D]">
                  FITA
                </div>
                <h3 className="text-base font-bold text-[#0B1B3D]">
                  {authMode === 'login' && 'Accesso Portale Arbitri'}
                  {authMode === 'register' && 'Registrazione Nuovo Utente'}
                  {authMode === 'forgot' && 'Recupero Password'}
                </h3>
              </div>

              {/* MODALITA' LOGIN */}
              {authMode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="arbitro@fita.it"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-slate-600 font-bold">Password</label>
                      <button
                        type="button"
                        onClick={() => setAuthMode('forgot')}
                        className="text-[10px] text-blue-600 hover:underline"
                      >
                        Password dimenticata?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                    />
                  </div>

                  <button type="submit" className="w-full py-2.5 rounded bg-[#0B1B3D] hover:bg-slate-800 text-white font-bold transition-colors shadow">
                    Accedi
                  </button>

                  {/* Pulsante di scelta rapida Admin per facilità di test */}
                  <div className="pt-2 border-t border-slate-100 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setUser({
                          id: 'u1',
                          firstName: 'Paolo',
                          lastName: 'Romano',
                          email: 'admin@taekwondo.it',
                          role: 'admin',
                          region: 'Campania',
                          badgeId: 'FITA-ARB-001'
                        });
                        setAuthModalOpen(false);
                        showToast('Accesso rapido esguito come Admin (Paolo Romano)');
                      }}
                      className="text-[11px] text-[#A60F2D] font-bold hover:underline"
                    >
                      ⚡ Accesso Rapido Admin Predefinito
                    </button>
                  </div>

                  <div className="text-center pt-3 border-t border-slate-200">
                    <span className="text-slate-500">Non hai ancora un account? </span>
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

              {/* MODALITA' REGISTRAZIONE */}
              {authMode === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Nome *</label>
                      <input
                        type="text"
                        required
                        placeholder="Marco"
                        value={authFirstName}
                        onChange={(e) => setAuthFirstName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Cognome *</label>
                      <input
                        type="text"
                        required
                        placeholder="Rossi"
                        value={authLastName}
                        onChange={(e) => setAuthLastName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="marco.rossi@fita.it"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Regione</label>
                      <select
                        value={authRegion}
                        onChange={(e) => setAuthRegion(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                      >
                        {['Campania', 'Lazio', 'Lombardia', 'Piemonte', 'Sicilia', 'Veneto', 'Emilia-Romagna', 'Puglia', 'Toscana'].map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Ruolo Iniziale</label>
                      <select
                        value={authRoleChoice}
                        onChange={(e) => setAuthRoleChoice(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800 font-bold"
                      >
                        <option value="user">Arbitro Utente</option>
                        <option value="admin">Amministratore</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="w-full py-2.5 rounded bg-[#0B1B3D] hover:bg-slate-800 text-white font-bold transition-colors shadow">
                    Crea Account
                  </button>

                  <div className="text-center pt-2 border-t border-slate-200">
                    <span className="text-slate-500">Hai già un account? </span>
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="text-[#0B1B3D] font-bold hover:underline"
                    >
                      Accedi
                    </button>
                  </div>
                </form>
              )}

              {/* MODALITA' PASSWORD DIMENTICATA */}
              {authMode === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Inserisci l'indirizzo email associato al tuo profilo per ricevere le istruzioni di ripristino password.
                  </p>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="arbitro@fita.it"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                    />
                  </div>

                  <button type="submit" className="w-full py-2.5 rounded bg-[#0B1B3D] hover:bg-slate-800 text-white font-bold transition-colors shadow">
                    Invia Link di Recupero
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="text-[#0B1B3D] font-bold hover:underline"
                    >
                      ← Torna al Login
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL CARICAMENTO DOCUMENTO --- */}
      <AnimatePresence>
        {isDocModalOpen && currentSection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-lg border border-slate-200 p-6 shadow-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-[#0B1B3D]">Carica Documento ({currentSection.title})</h3>
                <button onClick={() => setIsDocModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDocument} className="space-y-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Titolo Documento</label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Manuale Arbitrale Kyorugi 2026"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Descrizione breve</label>
                  <input
                    type="text"
                    placeholder="Es. Slide PowerPoint mostrate al corso d'aggiornamento"
                    value={docDescription}
                    onChange={(e) => setDocDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Seleziona File (PDF, PPTX, DOCX)</label>
                  <input
                    type="file"
                    accept=".pdf,.pptx,.ppt,.docx,.doc"
                    onChange={handleDocFileUpload}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-700 text-xs file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-[#0B1B3D] file:text-white"
                  />
                  {docFileName && (
                    <p className="mt-1 text-[11px] text-emerald-600 font-semibold">
                      ✓ File selezionato: {docFileName} ({docFormat})
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button type="button" onClick={() => setIsDocModalOpen(false)} className="px-4 py-2 rounded bg-slate-200 text-slate-700 font-semibold">
                    Annulla
                  </button>
                  <button type="submit" className="px-4 py-2 rounded bg-[#0B1B3D] text-white font-bold">
                    Carica Documento
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL NUOVA NOTIZIA HOME --- */}
      <AnimatePresence>
        {isNewsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white rounded-lg border border-slate-200 p-6 shadow-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-[#0B1B3D]">Pubblica Notizia in Home</h3>
                <button onClick={() => setIsNewsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveNews} className="space-y-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Titolo Notizia / Evento</label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Campionato Regionale Campania 2026"
                    value={newsTitle}
                    onChange={(e) => setNewsTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Categoria</label>
                    <select
                      value={newsCategory}
                      onChange={(e) => setNewsCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                    >
                      <option value="Regionale">Regionale</option>
                      <option value="Interregionale">Interregionale</option>
                      <option value="Nazionale">Nazionale</option>
                      <option value="Regolamento">Aggiornamento Regolamento</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Luogo / Sede</label>
                    <input
                      type="text"
                      placeholder="Es. PalaVesuvio - Napoli"
                      value={newsLocation}
                      onChange={(e) => setNewsLocation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Contenuto Comunicato</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Scrivi qui i dettagli della notizia o dell'evento..."
                    value={newsContent}
                    onChange={(e) => setNewsContent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">URL Locandina / Immagine (Opzionale)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newsImage}
                    onChange={(e) => setNewsImage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button type="button" onClick={() => setIsNewsModalOpen(false)} className="px-4 py-2 rounded bg-slate-200 text-slate-700 font-semibold">
                    Annulla
                  </button>
                  <button type="submit" className="px-4 py-2 rounded bg-[#0B1B3D] text-white font-bold">
                    Pubblica Notizia
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL PLAYER VIDEO REPLAY --- */}
      <AnimatePresence>
        {activeVideoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xl">
              <div className="p-4 bg-[#0B1B3D] text-white flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Video className="w-4 h-4 text-red-400" />
                    <span>Simulatore Revisione Video Replay</span>
                  </h3>
                  <p className="text-[11px] text-slate-300">{activeVideoModal.title}</p>
                </div>
                <button onClick={() => setActiveVideoModal(null)} className="text-slate-300 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="aspect-video bg-black">
                <video src={activeVideoModal.url} controls autoPlay className="w-full h-full object-contain" />
              </div>

              <div className="p-3 bg-slate-100 text-xs text-slate-600 border-t border-slate-200">
                {activeVideoModal.caption}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL EDITING ARTICOLO --- */}
      <AnimatePresence>
        {isEditingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white rounded-lg border border-slate-200 p-6 shadow-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-[#0B1B3D]">
                  {editingSubsection ? 'Modifica Articolo' : 'Nuovo Articolo di Regolamento'}
                </h3>
                <button onClick={() => setIsEditingModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSubsection} className="space-y-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Sezione</label>
                  <select
                    value={formSectionId}
                    onChange={(e) => setFormSectionId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                  >
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Titolo dell'Articolo</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Testo del Regolamento</label>
                  <textarea
                    rows={4}
                    required
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Tag (separati da virgola)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-bold">Allegato Immagine o Video</label>
                    <div className="flex gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setMediaSourceType('file')}
                        className={`px-2 py-1 rounded text-[10px] font-bold ${
                          mediaSourceType === 'file' ? 'bg-[#0B1B3D] text-white' : 'text-slate-600'
                        }`}
                      >
                        <Upload className="w-3 h-3" /> Dal Dispositivo
                      </button>
                      <button
                        type="button"
                        onClick={() => setMediaSourceType('url')}
                        className={`px-2 py-1 rounded text-[10px] font-bold ${
                          mediaSourceType === 'url' ? 'bg-[#0B1B3D] text-white' : 'text-slate-600'
                        }`}
                      >
                        <LinkIcon className="w-3 h-3" /> Link Web
                      </button>
                    </div>
                  </div>

                  {mediaSourceType === 'file' ? (
                    <div>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileUpload}
                        className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-700 text-xs file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-[#0B1B3D] file:text-white"
                      />
                      {selectedFileName && (
                        <p className="mt-1 text-[11px] text-emerald-600 font-semibold">
                          ✓ File selezionato: {selectedFileName}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <input
                          type="url"
                          placeholder="https://..."
                          value={formMediaUrl}
                          onChange={(e) => setFormMediaUrl(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                        />
                      </div>
                      <div>
                        <select
                          value={formMediaType}
                          onChange={(e) => setFormMediaType(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800"
                        >
                          <option value="image">Immagine</option>
                          <option value="video">Video</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button type="button" onClick={() => setIsEditingModalOpen(false)} className="px-4 py-2 rounded bg-slate-200 text-slate-700 font-semibold">
                    Annulla
                  </button>
                  <button type="submit" className="px-4 py-2 rounded bg-[#0B1B3D] text-white font-bold">
                    Salva Articolo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL GESTIONE UTENTI ADMIN --- */}
      <AnimatePresence>
        {isAdminUsersModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-lg border border-slate-200 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-[#0B1B3D] flex items-center gap-2">
                  <Users className="w-4 h-4 text-red-600" />
                  <span>Gestione Utenti Registrati</span>
                </h3>
                <button onClick={() => setIsAdminUsersModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {usersList.map(u => (
                  <div key={u.id} className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{u.firstName} {u.lastName}</p>
                      <p className="text-[10px] text-slate-500">{u.email} • {u.region}</p>
                    </div>
                    <button
                      onClick={() => {
                        const newRole = u.role === 'admin' ? 'user' : 'admin';
                        setUsersList(prev => prev.map(item => item.id === u.id ? { ...item, role: newRole } : item));
                        if (user && user.id === u.id) {
                          setUser({ ...user, role: newRole });
                        }
                        showToast(`Ruolo di ${u.firstName} cambiato a ${newRole.toUpperCase()}`);
                      }}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                        u.role === 'admin' ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {u.role.toUpperCase()}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}