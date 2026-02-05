import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockUser, mockWallets, mockTransactions, mockGoals, mockCategories, mockStats, demoDelay } from '../services/mockData';
import type { User, Wallet, Transaction } from '../types';

interface Category {
  id: string;
  name: string;
  emoji: string;
  type: 'income' | 'expense';
  is_default: boolean;
}

interface Goal {
  id: string;
  name: string;
  emoji: string;
  target_amount: number;
  current_amount: number;
  completed: boolean;
  created_at: string;
}

interface AppState {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  wallets: Wallet[];
  transactions: Transaction[];
  stats: any;
  activeWallet: Wallet | null;
  categories: Category[];
  goals: Goal[];
  
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  
  loadData: () => Promise<void>;
  loadCategories: (type?: 'income' | 'expense') => Promise<Category[]>;
  addCategory: (data: { name: string; emoji: string; type: 'income' | 'expense' }) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  setActiveWallet: (wallet: Wallet) => void;
  addTransaction: (data: any) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  createWallet: (data: { name: string; emoji: string; is_shared: boolean }) => Promise<void>;
  updateWallet: (id: string, data: { name?: string; emoji?: string }) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  inviteToWallet: (walletId: string, email: string) => Promise<void>;
  removeFromWallet: (walletId: string, userId: string) => Promise<void>;
  leaveWallet: (walletId: string) => Promise<void>;
  
  loadGoals: () => Promise<void>;
  addGoal: (data: { name: string; target_amount: number; emoji: string }) => Promise<void>;
  contributeToGoal: (id: string, amount: number) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export const useDemoStore = create<AppState>((set, get) => ({
  user: null,
  isLoading: true,
  isLoggedIn: false,
  wallets: [],
  transactions: [],
  stats: null,
  activeWallet: null,
  categories: [],
  goals: [],

  init: async () => {
    await demoDelay(800);
    const isLoggedIn = await AsyncStorage.getItem('demo_logged_in');
    if (isLoggedIn === 'true') {
      set({ user: mockUser, isLoggedIn: true });
      await get().loadData();
    }
    set({ isLoading: false });
  },

  login: async (email, password) => {
    await demoDelay(1000);
    await AsyncStorage.setItem('demo_logged_in', 'true');
    set({ user: mockUser, isLoggedIn: true });
    await get().loadData();
  },

  register: async (email, password, name) => {
    await demoDelay(1000);
    await AsyncStorage.setItem('demo_logged_in', 'true');
    set({ user: { ...mockUser, name, email }, isLoggedIn: true });
    await get().loadData();
  },

  logout: async () => {
    await AsyncStorage.removeItem('demo_logged_in');
    set({ 
      user: null, 
      isLoggedIn: false, 
      wallets: [], 
      transactions: [], 
      stats: null, 
      activeWallet: null, 
      categories: [], 
      goals: [] 
    });
  },

  loadData: async () => {
    await demoDelay(600);
    const wallets = [...mockWallets];
    const transactions = [...mockTransactions];
    const stats = { ...mockStats };
    const categories = [...mockCategories];
    const goals = [...mockGoals];
    const activeWallet = wallets[0] || null;
    set({ wallets, transactions, stats, activeWallet, categories, goals });
  },

  loadCategories: async (type) => {
    await demoDelay(300);
    const categories = type ? mockCategories.filter(c => c.type === type) : [...mockCategories];
    set({ categories });
    return categories;
  },

  addCategory: async (data) => {
    await demoDelay(400);
    const newCategory = {
      id: `cat-custom-${Date.now()}`,
      ...data,
      is_default: false,
    };
    set({ categories: [...get().categories, newCategory] });
  },

  deleteCategory: async (id) => {
    await demoDelay(300);
    set({ categories: get().categories.filter(c => c.id !== id) });
  },

  setActiveWallet: (wallet) => set({ activeWallet: wallet }),

  addTransaction: async (data) => {
    await demoDelay(500);
    const newTx = {
      id: `tx-${Date.now()}`,
      user_id: mockUser.id,
      user_name: mockUser.name,
      ...data,
      created_at: new Date().toISOString(),
    };
    
    const wallets = get().wallets.map(w => {
      if (w.id === data.wallet_id) {
        const change = data.type === 'income' ? data.amount : -data.amount;
        return { ...w, balance: w.balance + change };
      }
      return w;
    });
    
    set({ 
      transactions: [newTx, ...get().transactions],
      wallets,
    });
    await get().loadData();
  },

  deleteTransaction: async (id) => {
    await demoDelay(400);
    const tx = get().transactions.find(t => t.id === id);
    if (tx) {
      const wallets = get().wallets.map(w => {
        if (w.id === tx.wallet_id) {
          const change = tx.type === 'income' ? -tx.amount : tx.amount;
          return { ...w, balance: w.balance + change };
        }
        return w;
      });
      set({ 
        transactions: get().transactions.filter(t => t.id !== id),
        wallets,
      });
    }
  },

  createWallet: async (data) => {
    await demoDelay(500);
    const newWallet: Wallet = {
      id: `wallet-${Date.now()}`,
      ...data,
      balance: 0,
      owner_id: mockUser.id,
      members: [],
      members_details: [],
      created_at: new Date().toISOString(),
    };
    set({ wallets: [...get().wallets, newWallet] });
  },

  updateWallet: async (id, data) => {
    await demoDelay(400);
    set({
      wallets: get().wallets.map(w => w.id === id ? { ...w, ...data } : w),
    });
  },

  deleteWallet: async (id) => {
    await demoDelay(400);
    set({
      wallets: get().wallets.filter(w => w.id !== id),
      transactions: get().transactions.filter(t => t.wallet_id !== id),
    });
  },

  inviteToWallet: async (walletId, email) => {
    await demoDelay(600);
    const newMember = {
      id: `user-${Date.now()}`,
      name: email.split('@')[0],
      email,
      joined_at: new Date().toISOString(),
    };
    set({
      wallets: get().wallets.map(w => {
        if (w.id === walletId) {
          return {
            ...w,
            members: [...(w.members || []), newMember.id],
            members_details: [...(w.members_details || []), newMember],
          };
        }
        return w;
      }),
    });
  },

  removeFromWallet: async (walletId, userId) => {
    await demoDelay(400);
    set({
      wallets: get().wallets.map(w => {
        if (w.id === walletId) {
          return {
            ...w,
            members: (w.members || []).filter(m => m !== userId),
            members_details: (w.members_details || []).filter(m => m.id !== userId),
          };
        }
        return w;
      }),
    });
  },

  leaveWallet: async (walletId) => {
    await demoDelay(400);
    set({
      wallets: get().wallets.filter(w => w.id !== walletId),
    });
  },

  loadGoals: async () => {
    await demoDelay(400);
    set({ goals: [...mockGoals] });
  },

  addGoal: async (data) => {
    await demoDelay(500);
    const newGoal = {
      id: `goal-${Date.now()}`,
      user_id: mockUser.id,
      ...data,
      current_amount: 0,
      completed: false,
      created_at: new Date().toISOString(),
    };
    set({ goals: [...get().goals, newGoal] });
  },

  contributeToGoal: async (id, amount) => {
    await demoDelay(400);
    set({
      goals: get().goals.map(g => {
        if (g.id === id) {
          const newAmount = g.current_amount + amount;
          return {
            ...g,
            current_amount: newAmount,
            completed: newAmount >= g.target_amount,
          };
        }
        return g;
      }),
    });
  },

  deleteGoal: async (id) => {
    await demoDelay(300);
    set({ goals: get().goals.filter(g => g.id !== id) });
  },
}));
