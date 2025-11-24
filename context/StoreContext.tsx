
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Artwork, Book, AdminLog, CartItem, JournalPost, Language, Notification, ChatMessage } from '../types';
import { MOCK_ARTWORKS, MOCK_BOOKS, MOCK_JOURNAL } from '../constants';

interface StoreContextType {
  artworks: Artwork[];
  books: Book[];
  journal: JournalPost[];
  logs: AdminLog[];
  language: Language;
  cart: CartItem[];
  isCartOpen: boolean;
  notifications: Notification[];
  chatHistory: ChatMessage[];
  
  // Actions
  addArtwork: (art: Artwork) => void;
  removeArtwork: (id: string) => void;
  addBook: (book: Book) => void;
  removeBook: (id: string) => void;
  addJournal: (post: JournalPost) => void;
  removeJournal: (id: string) => void;
  
  addLog: (action: string) => void;
  setLanguage: (lang: Language) => void;
  addToCart: (book: Book) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  cartTotal: number;
  
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeNotification: (id: string) => void;
  
  addChatMessage: (role: 'user' | 'ai', content: string) => void;
  clearChat: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// API URL - assuming the node server runs on port 3001
const API_URL = 'http://localhost:3001/api';

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [artworks, setArtworks] = useState<Artwork[]>(MOCK_ARTWORKS);
  const [books, setBooks] = useState<Book[]>(MOCK_BOOKS);
  const [journal, setJournal] = useState<JournalPost[]>(MOCK_JOURNAL);
  const [logs, setLogs] = useState<AdminLog[]>([
    { id: '1', action: 'System Initialized', timestamp: new Date().toISOString() }
  ]);
  const [language, setLanguage] = useState<Language>('en');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'ai',
      content: 'سلام دکتر. من مشاور استراتژیک هوشمند شما هستم. می‌توانم با تحلیل داده‌های سایت، وضعیت بازار هنر و مباحث فلسفی، به شما در تدوین استراتژی‌های جدید کمک کنم. چه دستوری دارید؟',
      timestamp: new Date().toISOString()
    }
  ]);

  // --- Data Synchronization (DB Connection) ---
  useEffect(() => {
    const syncWithDatabase = async () => {
      try {
        const [artRes, bookRes, journalRes] = await Promise.all([
          fetch(`${API_URL}/artworks`),
          fetch(`${API_URL}/books`),
          fetch(`${API_URL}/journal`)
        ]);

        if (artRes.ok) {
          const data = await artRes.json();
          if (Array.isArray(data) && data.length > 0) {
            setArtworks(data);
          }
        }
        
        if (bookRes.ok) {
          const data = await bookRes.json();
          if (Array.isArray(data) && data.length > 0) {
            setBooks(data);
          }
        }

        if (journalRes.ok) {
          const data = await journalRes.json();
          if (Array.isArray(data) && data.length > 0) {
            setJournal(data);
          }
        }

        addLog('Connected to Arvand Database successfully');
      } catch (error) {
        console.warn('Backend server not reachable. Using local mock data.', error);
        addLog('Running in Offline/Mock Mode');
      }
    };

    syncWithDatabase();
  }, []);

  // --- Notification Logic ---
  const notify = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    // Auto remove after 5 seconds
    setTimeout(() => removeNotification(id), 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // --- Artwork Logic ---
  const addArtwork = (art: Artwork) => {
    // Optimistic UI update
    setArtworks(prev => [art, ...prev]);
    addLog(`Added new artwork: ${art.title}`);
    
    // Sync with DB
    fetch(`${API_URL}/artworks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(art)
    })
    .then(res => res.json())
    .then(savedArt => {
       // Update with real ID from DB if necessary
       setArtworks(prev => prev.map(a => a.id === art.id ? savedArt : a));
    })
    .catch(err => {
      console.warn('DB Sync Failed', err);
      notify('خطا در ذخیره در دیتابیس', 'error');
    });
  };

  const removeArtwork = (id: string) => {
    const art = artworks.find(a => a.id === id);
    setArtworks(artworks.filter(a => a.id !== id));
    if (art) addLog(`Removed artwork: ${art.title}`);

    // Sync
    fetch(`${API_URL}/artworks/${id}`, { method: 'DELETE' })
      .catch(err => console.warn('DB Sync Failed', err));
  };

  // --- Book Logic ---
  const addBook = (book: Book) => {
    setBooks(prev => [book, ...prev]);
    addLog(`Added new book: ${book.title}`);

    // Sync
    fetch(`${API_URL}/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book)
    })
    .then(res => res.json())
    .then(savedBook => {
       setBooks(prev => prev.map(b => b.id === book.id ? savedBook : b));
    })
    .catch(err => console.warn('DB Sync Failed', err));
  }

  const removeBook = (id: string) => {
    const item = books.find(b => b.id === id);
    setBooks(books.filter(b => b.id !== id));
    if (item) addLog(`Removed book: ${item.title}`);

    // Sync
    fetch(`${API_URL}/books/${id}`, { method: 'DELETE' })
      .catch(err => console.warn('DB Sync Failed', err));
  }

  // --- Journal Logic ---
  const addJournal = (post: JournalPost) => {
    setJournal(prev => [post, ...prev]);
    addLog(`Published journal post: ${post.title}`);

    // Sync
    fetch(`${API_URL}/journal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post)
    })
    .then(res => res.json())
    .then(savedPost => {
       setJournal(prev => prev.map(p => p.id === post.id ? savedPost : p));
    })
    .catch(err => console.warn('DB Sync Failed', err));
  }

  const removeJournal = (id: string) => {
    const item = journal.find(j => j.id === id);
    setJournal(journal.filter(j => j.id !== id));
    if (item) addLog(`Removed journal post: ${item.title}`);

    // Sync
    fetch(`${API_URL}/journal/${id}`, { method: 'DELETE' })
      .catch(err => console.warn('DB Sync Failed', err));
  }

  // --- System Logic ---
  const addLog = (action: string) => {
    setLogs(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      action,
      timestamp: new Date().toISOString()
    }, ...prev]);
  };

  const addToCart = (book: Book) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === book.id);
      if (existing) {
        notify(`${book.title} quantity updated`, 'success');
        return prev.map(item => item.id === book.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      notify(`${book.title} added to cart`, 'success');
      return [...prev, { ...book, quantity: 1 }];
    });
    setIsCartOpen(true);
    addLog(`Added to cart: ${book.title}`);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleCart = () => setIsCartOpen(!isCartOpen);

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  // --- Chat Logic ---
  const addChatMessage = (role: 'user' | 'ai', content: string) => {
    setChatHistory(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      role,
      content,
      timestamp: new Date().toISOString()
    }]);
  };

  const clearChat = () => {
    setChatHistory([]);
  };

  return (
    <StoreContext.Provider value={{ 
      artworks, books, journal, logs, language, cart, isCartOpen, notifications, chatHistory,
      setLanguage, 
      addArtwork, removeArtwork, 
      addBook, removeBook,
      addJournal, removeJournal,
      addLog,
      addToCart, removeFromCart, clearCart, toggleCart, cartTotal,
      notify, removeNotification,
      addChatMessage, clearChat
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
