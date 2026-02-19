import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockUser, mockWallets, mockTransactions, mockGoals, mockCategories, mockStats, demoDelay } from '../services/mockData';
import type { User, Wallet, Transaction, WorkCalculation, Subscription, WageSettings, Goal, Category, WalletInvitation, WagePeriod } from '../types';

const WAGE_SETTINGS_KEY = 'demo_wage_settings';

interface WalletWithMembers extends Wallet {
  members?: string[];
  members_details?: { id: string; name: string; email: string }[];
  updated_at: string;
}

interface AppState {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  wallets: WalletWithMembers[];
  transactions: Transaction[];
  stats: any;
  activeWallet: WalletWithMembers | null;
  categories: Category[];
  goals: Goal[];
  wageSettings: WageSettings | null;
  subscriptions: Subscription[];
  walletInvitations: WalletInvitation[];

  // Security
  isAppLocked: boolean;
  securitySettings: {
    isPinEnabled: boolean;
    isBiometricsEnabled: boolean;
  };

  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, username: string) => Promise<void>;
  logout: () => void;

  loadData: () => Promise<void>;
  loadCategories: (type?: 'income' | 'expense') => Promise<Category[]>;
  addCategory: (data: { name: string; emoji: string; type: 'income' | 'expense' }) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  setActiveWallet: (wallet: WalletWithMembers) => void;
  addTransaction: (data: any) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  createWallet: (data: { name: string; emoji: string; is_shared: boolean }) => Promise<void>;
  updateWallet: (id: string, data: { name?: string; emoji?: string }) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  inviteToWallet: (walletId: string, username: string) => Promise<void>;
  removeFromWallet: (walletId: string, userId: string) => Promise<void>;
  leaveWallet: (walletId: string) => Promise<void>;
  loadWalletInvitations: () => Promise<void>;
  acceptWalletInvitation: (invitationId: string) => Promise<void>;
  rejectWalletInvitation: (invitationId: string) => Promise<void>;

  loadGoals: () => Promise<void>;
  addGoal: (data: { name: string; target_amount: number; emoji: string }) => Promise<void>;
  contributeToGoal: (id: string, amount: number) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Wage Settings
  loadWageSettings: () => Promise<void>;
  saveWageSettings: (settings: { wage_amount: number; wage_period: 'hourly' | 'daily' | 'weekly' | 'monthly'; currency?: string }) => Promise<void>;
  calculateWorkTime: (itemPrice: number) => WorkCalculation | null;

  // Subscriptions
  loadSubscriptions: () => Promise<void>;
  addSubscription: (subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateSubscription: (id: string, updates: Partial<Subscription>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;

  // Security Actions
  lockApp: () => void;
  unlockApp: () => void;
  loadSecuritySettings: () => Promise<void>;
  enablePin: (pin: string) => Promise<void>;
  disablePin: () => Promise<void>;
  toggleBiometrics: (enabled: boolean) => Promise<void>;
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
  wageSettings: null,
  subscriptions: [],
  walletInvitations: [],

  // Security State
  isAppLocked: false,
  securitySettings: {
    isPinEnabled: false,
    isBiometricsEnabled: false,
  },

  init: async () => {
    await demoDelay(800);
    const isLoggedIn = await AsyncStorage.getItem('demo_logged_in');
    if (isLoggedIn === 'true') {
      set({ user: { ...mockUser, username: null }, isLoggedIn: true });
      await get().loadData();
    }
    set({ isLoading: false });
  },

  login: async (email, password) => {
    await demoDelay(1000);
    await AsyncStorage.setItem('demo_logged_in', 'true');
    set({ user: { ...mockUser, username: null }, isLoggedIn: true });
    await get().loadData();
  },

  register: async (email, password, name, username) => {
    await demoDelay(1000);
    await AsyncStorage.setItem('demo_logged_in', 'true');
    set({ user: { ...mockUser, name, email, username }, isLoggedIn: true });
    await get().loadData();
  },

  logout: async () => {
    await AsyncStorage.removeItem('demo_logged_in');
    await AsyncStorage.removeItem(WAGE_SETTINGS_KEY);
    set({
      user: null,
      isLoggedIn: false,
      wallets: [],
      transactions: [],
      stats: null,
      activeWallet: null,
      categories: [],
      goals: [],
      wageSettings: null,
      subscriptions: [],
      walletInvitations: [],
    });
  },

  loadData: async () => {
    await demoDelay(600);
    const wallets = mockWallets.map(w => ({ ...w, balance: w.balance || 0, updated_at: new Date().toISOString() })) as WalletWithMembers[];
    const transactions = [...mockTransactions];
    const stats = { ...mockStats };
    const categories: Category[] = mockCategories.map(c => ({ ...c, type: c.type as 'income' | 'expense' }));
    const goals = mockGoals.map(g => ({ ...g, completed: g.current_amount >= g.target_amount })) as Goal[];
    const activeWallet = wallets[0] || null;
    let persistedWageSettings: WageSettings | null = null;
    const persistedRaw = await AsyncStorage.getItem(WAGE_SETTINGS_KEY);
    if (persistedRaw) {
      try {
        persistedWageSettings = JSON.parse(persistedRaw) as WageSettings;
      } catch {
        persistedWageSettings = null;
      }
    }

    set({ wallets, transactions, stats, activeWallet, categories, goals, wageSettings: persistedWageSettings });
  },

  loadCategories: async (type) => {
    await demoDelay(300);
    const allCategories: Category[] = mockCategories.map(c => ({ ...c, type: c.type as 'income' | 'expense' }));
    const categories = type ? allCategories.filter(c => c.type === type) : allCategories;
    set({ categories });
    return categories;
  },

  addCategory: async (data) => {
    await demoDelay(400);
    const newCategory: Category = {
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
        return { ...w, balance: (w.balance || 0) + change };
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
          return { ...w, balance: (w.balance || 0) + change };
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
    const newWallet: WalletWithMembers = {
      id: `wallet-${Date.now()}`,
      ...data,
      balance: 0,
      owner_id: mockUser.id,
      members: [],
      members_details: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      emoji: data.emoji || '💰',
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

  inviteToWallet: async (walletId, username) => {
    await demoDelay(600);
    const newMember = {
      id: `user-${Date.now()}`,
      name: username,
      email: `${username}@demo.local`,
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

  loadWalletInvitations: async () => {
    await demoDelay(200);
    set({ walletInvitations: [] });
  },

  acceptWalletInvitation: async () => {
    await demoDelay(300);
  },

  rejectWalletInvitation: async () => {
    await demoDelay(300);
  },

  loadGoals: async () => {
    await demoDelay(400);
    set({ goals: mockGoals.map(g => ({ ...g, completed: g.current_amount >= g.target_amount })) as Goal[] });
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
    } as Goal;
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

  // Wage Settings
  loadWageSettings: async () => {
    await demoDelay(400);
    const saved = await AsyncStorage.getItem(WAGE_SETTINGS_KEY);
    if (!saved) {
      set({ wageSettings: null });
      return;
    }
    try {
      set({ wageSettings: JSON.parse(saved) as WageSettings });
    } catch {
      set({ wageSettings: null });
    }
  },
  saveWageSettings: async (settings) => {
    await demoDelay(500);
    const wageSettings: WageSettings = {
      ...settings,
      user_id: 'mock-user',
      id: 'mock-wage',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      currency: settings.currency || 'PLN',
    };
    await AsyncStorage.setItem(WAGE_SETTINGS_KEY, JSON.stringify(wageSettings));
    set({ wageSettings });
  },
  calculateWorkTime: (itemPrice) => {
    const { wageSettings } = get();
    if (!wageSettings || !itemPrice) return null;

    const wageAmount = Number(wageSettings.wage_amount);
    const wagePeriod: WagePeriod = wageSettings.wage_period;
    if (!Number.isFinite(wageAmount) || wageAmount <= 0 || !Number.isFinite(itemPrice) || itemPrice <= 0) {
      return null;
    }

    let hourlyRate = wageAmount;
    switch (wagePeriod) {
      case 'daily':
        hourlyRate = wageAmount / 8;
        break;
      case 'weekly':
        hourlyRate = wageAmount / 40;
        break;
      case 'monthly':
        hourlyRate = wageAmount / 160;
        break;
    }

    if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) return null;

    const hoursNeeded = itemPrice / hourlyRate;
    return {
      itemPrice,
      wageAmount,
      wagePeriod,
      hoursNeeded,
      daysNeeded: hoursNeeded / 8,
      weeksNeeded: hoursNeeded / 40,
      monthsNeeded: hoursNeeded / 160,
    } as WorkCalculation;
  },

  // Subscriptions
  loadSubscriptions: async () => {
    await demoDelay(400);
    set({ subscriptions: [] });
  },
  addSubscription: async () => { await demoDelay(400); },
  updateSubscription: async () => { await demoDelay(400); },
  deleteSubscription: async () => { await demoDelay(400); },

  // Security
  lockApp: () => set({ isAppLocked: true }),
  unlockApp: () => set({ isAppLocked: false }),
  loadSecuritySettings: async () => { await demoDelay(400); },
  enablePin: async () => { await demoDelay(400); },
  disablePin: async () => { await demoDelay(400); },
  toggleBiometrics: async () => { await demoDelay(400); },
}));
