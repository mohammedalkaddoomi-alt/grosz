import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import type { User, Wallet, Transaction } from '../types';

interface AppState {
  // Auth
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  
  // Data
  wallets: Wallet[];
  transactions: Transaction[];
  stats: any;
  activeWallet: Wallet | null;
  
  // Actions
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  
  loadData: () => Promise<void>;
  setActiveWallet: (wallet: Wallet) => void;
  addTransaction: (data: any) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  isLoading: true,
  isLoggedIn: false,
  wallets: [],
  transactions: [],
  stats: null,
  activeWallet: null,

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
    set({ user: null, isLoggedIn: false, wallets: [], transactions: [], stats: null, activeWallet: null });
  },

  loadData: async () => {
    try {
      const [wallets, transactions, stats] = await Promise.all([
        api.getWallets(),
        api.getTransactions(),
        api.getStats(),
      ]);
      const activeWallet = wallets[0] || null;
      set({ wallets, transactions, stats, activeWallet });
    } catch (e) {
      console.log('Load data error:', e);
    }
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
}));
