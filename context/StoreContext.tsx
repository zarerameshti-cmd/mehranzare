
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

// Helper to load from LocalStorage or fallback to Mock Data
const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (e) {
    console.warn(`Failed to load ${key} from storage`, e);
    return fallback;
  }
};

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state from LocalStorage to persist data across refreshes without a server
  const [artworks, setArtworks] = useState<Artwork[]>(() => loadFromStorage('artworks', MOCK_ARTWORKS));
  const [books, setBooks] = useState<Book[]>(() => loadFromStorage('books', MOCK_BOOKS));
  const [journal, setJournal] = useState<JournalPost[]>(() => loadFromStorage('journal', MOCK_JOURNAL));
  const [logs, setLogs] = useState<AdminLog[]>(() => loadFromStorage('admin_logs', [
    { id: '1', action: 'System Initialized (Local Mode)', timestamp: new Date().toISOString() }
  ]));
  
  const [language, setLanguage] = useState<Language>('en');
  const [cart, setCart] = useState<CartItem[]>(() => loadFromStorage('cart', []));
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => loadFromStorage('chat_history', [
    {
      id: 'init',
      role: 'ai',
      content: 'سلام دکتر. من مشاور استراتژیک هوشمند شما هستم. می‌توانم با تحلیل داده‌های سایت، وضعیت بازار هنر و مباحث فلسفی، به شما در تدوین استراتژی‌های جدید کمک کنم. چه دستوری دارید؟',
      timestamp: new Date().toISOString()
    }
  ]));

  // --- Persistence Effects ---
  // Whenever state changes, save it to LocalStorage automatically
  useEffect(() => { localStorage.setItem('artworks', JSON.stringify(artworks)); }, [artworks]);
  useEffect(() => { localStorage.setItem('books', JSON.stringify(books)); }, [books]);
  useEffect(() => { localStorage.setItem('journal', JSON.stringify(journal)); }, [journal]);
  useEffect(() => { localStorage.setItem('admin_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('chat_history', JSON.stringify(chatHistory)); }, [chatHistory]);

  // --- Notification Logic ---
  const notify = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeNotification(id), 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // --- Artwork Logic ---
  const addArtwork = (art: Artwork) => {
    setArtworks(prev => [art, ...prev]);
    addLog(`Added new artwork: ${art.title}`);
  };

  const removeArtwork = (id: string) => {
    const art = artworks.find(a => a.id === id);
    setArtworks(artworks.filter(a => a.id !== id));
    if (art) addLog(`Removed artwork: ${art.title}`);
  };

  // --- Book Logic ---
  const addBook = (book: Book) => {
    setBooks(prev => [book, ...prev]);
    addLog(`Added new book: ${book.title}`);
  }

  const removeBook = (id: string) => {
    const item = books.find(b => b.id === id);
    setBooks(books.filter(b => b.id !== id));
    if (item) addLog(`Removed book: ${item.title}`);
  }

  // --- Journal Logic ---
  const addJournal = (post: JournalPost) => {
    setJournal(prev => [post, ...prev]);
    addLog(`Published journal post: ${post.title}`);
  }

  const removeJournal = (id: string) => {
    const item = journal.find(j => j.id === id);
    setJournal(journal.filter(j => j.id !== id));
    if (item) addLog(`Removed journal post: ${item.title}`);
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
