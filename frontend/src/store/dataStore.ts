import { create } from 'zustand';
import { api } from '../services/api';
import type { Wallet, Transaction, Goal, DashboardStats } from '../types';

interface DataState {
  wallets: Wallet[];
  transactions: Transaction[];
  goals: Goal[];
  dashboardStats: DashboardStats | null;
  selectedWallet: Wallet | null;
  isLoading: boolean;
  
  // Wallet actions
  fetchWallets: () => Promise<void>;
  createWallet: (data: { name: string; emoji: string; is_shared: boolean }) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  selectWallet: (wallet: Wallet | null) => void;
  
  // Transaction actions
  fetchTransactions: (walletId?: string) => Promise<void>;
  createTransaction: (data: any) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Goal actions
  fetchGoals: () => Promise<void>;
  createGoal: (data: any) => Promise<void>;
  contributeToGoal: (id: string, amount: number) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  
  // Dashboard
  fetchDashboardStats: () => Promise<void>;
  
  // Refresh all
  refreshAll: () => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  wallets: [],
  transactions: [],
  goals: [],
  dashboardStats: null,
  selectedWallet: null,
  isLoading: false,

  fetchWallets: async () => {
    try {
      const wallets = await api.getWallets();
      set({ wallets });
    } catch (error) {
      console.error('Error fetching wallets:', error);
    }
  },

  createWallet: async (data) => {
    try {
      const wallet = await api.createWallet(data);
      set((state) => ({ wallets: [...state.wallets, wallet] }));
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  },

  deleteWallet: async (id) => {
    try {
      await api.deleteWallet(id);
      set((state) => ({
        wallets: state.wallets.filter((w) => w.id !== id),
        selectedWallet: state.selectedWallet?.id === id ? null : state.selectedWallet,
      }));
    } catch (error) {
      console.error('Error deleting wallet:', error);
      throw error;
    }
  },

  selectWallet: (wallet) => set({ selectedWallet: wallet }),

  fetchTransactions: async (walletId) => {
    try {
      const transactions = await api.getTransactions(walletId);
      set({ transactions });
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  },

  createTransaction: async (data) => {
    try {
      const transaction = await api.createTransaction(data);
      set((state) => ({ transactions: [transaction, ...state.transactions] }));
      // Refresh wallets to update balance
      get().fetchWallets();
      get().fetchDashboardStats();
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  },

  deleteTransaction: async (id) => {
    try {
      await api.deleteTransaction(id);
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      }));
      // Refresh wallets to update balance
      get().fetchWallets();
      get().fetchDashboardStats();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  },

  fetchGoals: async () => {
    try {
      const goals = await api.getGoals();
      set({ goals });
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  },

  createGoal: async (data) => {
    try {
      const goal = await api.createGoal(data);
      set((state) => ({ goals: [...state.goals, goal] }));
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  },

  contributeToGoal: async (id, amount) => {
    try {
      const updatedGoal = await api.contributeToGoal(id, amount);
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? updatedGoal : g)),
      }));
    } catch (error) {
      console.error('Error contributing to goal:', error);
      throw error;
    }
  },

  deleteGoal: async (id) => {
    try {
      await api.deleteGoal(id);
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  },

  fetchDashboardStats: async () => {
    try {
      const stats = await api.getDashboardStats();
      set({ dashboardStats: stats });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  },

  refreshAll: async () => {
    set({ isLoading: true });
    await Promise.all([
      get().fetchWallets(),
      get().fetchTransactions(),
      get().fetchGoals(),
      get().fetchDashboardStats(),
    ]);
    set({ isLoading: false });
  },
}));
