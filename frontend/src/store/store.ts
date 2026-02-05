import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import type { User, Wallet, Transaction } from '../types';

const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

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

interface WalletWithMembers extends Wallet {
  members?: string[];
  members_details?: { id: string; name: string; email: string }[];
}

interface AppState {
  // Auth
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  
  // Data
  wallets: WalletWithMembers[];
  transactions: Transaction[];
  stats: any;
  activeWallet: WalletWithMembers | null;
  categories: Category[];
  goals: Goal[];
  
  // Actions
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  
  loadData: () => Promise<void>;
  loadCategories: (type?: 'income' | 'expense') => Promise<Category[]>;
  addCategory: (data: { name: string; emoji: string; type: 'income' | 'expense' }) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  setActiveWallet: (wallet: WalletWithMembers) => void;
  addTransaction: (data: any) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Wallets
  createWallet: (data: { name: string; emoji: string; is_shared: boolean }) => Promise<void>;
  updateWallet: (id: string, data: { name?: string; emoji?: string }) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  inviteToWallet: (walletId: string, email: string) => Promise<void>;
  removeFromWallet: (walletId: string, userId: string) => Promise<void>;
  leaveWallet: (walletId: string) => Promise<void>;
  
  // Goals
  loadGoals: () => Promise<void>;
  addGoal: (data: { name: string; target_amount: number; emoji: string }) => Promise<void>;
  contributeToGoal: (id: string, amount: number) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

// Demo mode implementation
if (DEMO_MODE) {
  console.log('🎭 Running in DEMO MODE - using mock data');
  const { useDemoStore } = require('./demoStore');
  export const useStore = useDemoStore;
} else {
  // Real store implementation
  export const useStore = create<AppState>((set, get) => ({
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
      try {
        await api.init();
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const user = await api.getMe();
          set({ user, isLoggedIn: true });
          await get().loadData();
        }
      } catch (e) {
        console.log('Init error:', e);
      } finally {
        set({ isLoading: false });
      }
    },

    login: async (email, password) => {
      const res = await api.login(email, password);
      set({ user: res.user, isLoggedIn: true });
      await get().loadData();
    },

    register: async (email, password, name) => {
      const res = await api.register(email, password, name);
      set({ user: res.user, isLoggedIn: true });
      await get().loadData();
    },

    logout: () => {
      api.logout();
      set({ user: null, isLoggedIn: false, wallets: [], transactions: [], stats: null, activeWallet: null, categories: [], goals: [] });
    },

    loadData: async () => {
      try {
        const [wallets, transactions, stats, categories, goals] = await Promise.all([
          api.getWallets(),
          api.getTransactions(),
          api.getStats(),
          api.getCategories(),
          api.getGoals(),
        ]);
        const activeWallet = wallets[0] || null;
        set({ wallets, transactions, stats, activeWallet, categories, goals });
      } catch (e) {
        console.log('Load data error:', e);
      }
    },

    loadCategories: async (type) => {
      const categories = await api.getCategories(type);
      set({ categories });
      return categories;
    },

    addCategory: async (data) => {
      await api.createCategory(data);
      await get().loadCategories();
    },

    deleteCategory: async (id) => {
      await api.deleteCategory(id);
      await get().loadCategories();
    },

    setActiveWallet: (wallet) => set({ activeWallet: wallet }),

    addTransaction: async (data) => {
      await api.createTransaction(data);
      await get().loadData();
    },

    deleteTransaction: async (id) => {
      await api.deleteTransaction(id);
      await get().loadData();
    },

    // Wallet actions
    createWallet: async (data) => {
      await api.createWallet(data);
      await get().loadData();
    },

    updateWallet: async (id, data) => {
      await api.updateWallet(id, data);
      await get().loadData();
    },

    deleteWallet: async (id) => {
      await api.deleteWallet(id);
      await get().loadData();
    },

    inviteToWallet: async (walletId, email) => {
      await api.inviteToWallet(walletId, email);
      await get().loadData();
    },

    removeFromWallet: async (walletId, userId) => {
      await api.removeFromWallet(walletId, userId);
      await get().loadData();
    },

    leaveWallet: async (walletId) => {
      await api.leaveWallet(walletId);
      await get().loadData();
    },

    // Goals
    loadGoals: async () => {
      const goals = await api.getGoals();
      set({ goals });
    },

    addGoal: async (data) => {
      await api.createGoal(data);
      await get().loadGoals();
    },

    contributeToGoal: async (id, amount) => {
      await api.contributeToGoal(id, amount);
      await get().loadGoals();
    },

    deleteGoal: async (id) => {
      await api.deleteGoal(id);
      await get().loadGoals();
    },
  }));
}
