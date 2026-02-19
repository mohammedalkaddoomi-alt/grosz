import { create } from 'zustand';
import { authService } from '../services/authService';
import { db } from '../services/database';
import { notificationService } from '../services/notificationService';
import type { User, Wallet, Transaction, WageSettings, WorkCalculation, Subscription, Goal, Category, WalletInvitation } from '../types';
import { useDemoStore } from './demoStore';
import { securityService } from '../services/securityService';

const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
const DEMO_LOGIN_EMAIL = 'demo@cennygrosz.app';
const DEMO_LOGIN_PASSWORD = 'demo123456';

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
  wageSettings: WageSettings | null;
  subscriptions: Subscription[];
  walletInvitations: WalletInvitation[];

  // Security
  isAppLocked: boolean;
  securitySettings: {
    isPinEnabled: boolean;
    isBiometricsEnabled: boolean;
  };

  // Actions
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, username: string) => Promise<void>;
  logout: () => Promise<void>;

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
  inviteToWallet: (walletId: string, username: string) => Promise<void>;
  removeFromWallet: (walletId: string, userId: string) => Promise<void>;
  leaveWallet: (walletId: string) => Promise<void>;
  loadWalletInvitations: () => Promise<void>;
  acceptWalletInvitation: (invitationId: string) => Promise<void>;
  rejectWalletInvitation: (invitationId: string) => Promise<void>;

  // Goals
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

// Supabase store implementation
const createSupabaseStore = () => create<AppState>((set, get) => ({
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
    try {
      // Check for existing session
      const session = await authService.getCurrentSession();
      if (session?.user) {
        // Ensure user profile exists (important for OAuth users)
        await authService.ensureUserProfile(session.user);

        const userProfile = await authService.getUserProfile(session.user.id);
        set({
          user: {
            id: session.user.id,
            email: session.user.email || userProfile?.email || '',
            name: userProfile?.name || session.user.user_metadata?.name || session.user.email || 'User',
            username: userProfile?.username || null,
          } as User,
          isLoggedIn: true
        });
        await get().loadData();
        await get().loadSecuritySettings();
        get().lockApp();
      } else {
        set({
          user: null,
          isLoggedIn: false,
          isAppLocked: false,
        });
        await get().loadSecuritySettings();
      }
    } catch (e) {
      console.log('Init error:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === DEMO_LOGIN_EMAIL && password === DEMO_LOGIN_PASSWORD) {
      const now = new Date().toISOString();
      const demoUserId = 'demo-user';
      const demoWalletId = 'demo-wallet-1';
      const demoWallet: WalletWithMembers = {
        id: demoWalletId,
        name: 'Demo Wallet',
        emoji: '💰',
        balance: 2070,
        is_shared: false,
        owner_id: demoUserId,
        members: [],
        members_details: [],
        created_at: now,
      };
      const demoTransactions: Transaction[] = [
        {
          id: 'demo-tx-1',
          wallet_id: demoWalletId,
          user_id: demoUserId,
          amount: 3500,
          type: 'income',
          category: 'Salary',
          emoji: '💼',
          note: 'Demo income',
          created_at: now,
        },
        {
          id: 'demo-tx-2',
          wallet_id: demoWalletId,
          user_id: demoUserId,
          amount: 920,
          type: 'expense',
          category: 'Bills',
          emoji: '📄',
          note: 'Demo expenses',
          created_at: now,
        },
        {
          id: 'demo-tx-3',
          wallet_id: demoWalletId,
          user_id: demoUserId,
          amount: 510,
          type: 'expense',
          category: 'Food',
          emoji: '🍔',
          note: 'Demo groceries',
          created_at: now,
        },
      ];

      set({
        user: {
          id: demoUserId,
          email: DEMO_LOGIN_EMAIL,
          name: 'Demo User',
          username: 'demo_user',
          created_at: now,
        } as User,
        isLoggedIn: true,
        wallets: [demoWallet],
        activeWallet: demoWallet,
        transactions: demoTransactions,
        stats: {
          total_balance: demoWallet.balance,
          month_income: 3500,
          month_expenses: 1430,
          wallets_count: 1,
          goals_progress: [],
          expense_categories: { Bills: 920, Food: 510 },
        },
        categories: [
          { id: 'demo-cat-1', name: 'Salary', emoji: '💼', type: 'income' },
          { id: 'demo-cat-2', name: 'Food', emoji: '🍔', type: 'expense' },
          { id: 'demo-cat-3', name: 'Bills', emoji: '📄', type: 'expense' },
        ],
        goals: [],
        wageSettings: null,
        subscriptions: [],
        walletInvitations: [],
        isAppLocked: false,
        securitySettings: {
          isPinEnabled: false,
          isBiometricsEnabled: false,
        },
      });
      return;
    }

    const { user, error } = await authService.login(email, password);
    if (error) throw new Error(error.message);

    if (user) {
      const userProfile = await authService.getUserProfile(user.id);
      set({
        user: {
          id: user.id,
          email: user.email!,
          name: userProfile?.name || email,
          username: userProfile?.username,
        } as User,
        isLoggedIn: true
      });
      await get().loadData();
      await get().loadSecuritySettings();
    }
  },

  register: async (email, password, name, username) => {
    const { user, session, error } = await authService.register(email, password, name, username);
    if (error) throw new Error(error.message);

    if (user && session) {
      set({
        user: {
          id: user.id,
          email: user.email!,
          name: name,
          username: username,
        } as User,
        isLoggedIn: true
      });
      await get().loadData();
      await get().loadSecuritySettings();
    } else {
      set({
        user: null,
        isLoggedIn: false,
      });
    }
  },

  logout: async () => {
    await authService.logout();
    set({
      user: null,
      isLoggedIn: false,
      wallets: [],
      transactions: [],
      activeWallet: null,
      categories: [],
      goals: [],
      wageSettings: null,
      subscriptions: [],
      walletInvitations: [],
      securitySettings: {
        isPinEnabled: false,
        isBiometricsEnabled: false,
      },
      isAppLocked: false,
    });
  },

  loadData: async () => {
    const user = get().user;
    if (!user) return;

    try {
      const [walletsData, categories, wageSettings, subscriptions, walletInvitations] = await Promise.all([
        db.getWallets(user.id),
        db.getCategories(undefined, user.id) as Promise<Category[]>,
        db.getWageSettings(user.id),
        db.getSubscriptions(user.id),
        db.getWalletInvitations(user.id),
      ]);

      // Load transactions for all wallets
      const allTransactions = await db.getTransactions();

      // Calculate balances for each wallet
      const wallets: WalletWithMembers[] = walletsData.map((wallet: any) => {
        const walletTransactions = allTransactions.filter((t: any) => t.wallet_id === wallet.id);
        const balance = walletTransactions.reduce((acc: number, t: any) => {
          return t.type === 'income' ? acc + t.amount : acc - t.amount;
        }, 0);
        return { ...wallet, balance };
      });

      // Calculate stats
      const now = new Date();
      const stats = {
        total_balance: wallets.reduce((acc, w) => acc + (w.balance || 0), 0),
        month_income: allTransactions
          .filter(t => {
            const txDate = new Date(t.created_at);
            return t.type === 'income' && txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
          })
          .reduce((acc, t) => acc + t.amount, 0),
        month_expenses: allTransactions
          .filter(t => {
            const txDate = new Date(t.created_at);
            return t.type === 'expense' && txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
          })
          .reduce((acc, t) => acc + t.amount, 0),
        wallets_count: wallets.length,
        goals_progress: [],
        expense_categories: {},
      };

      const currentActiveWalletId = get().activeWallet?.id;
      const nextActiveWallet = wallets.find(w => w.id === currentActiveWalletId) || wallets[0] || null;

      set({
        wallets,
        categories,
        transactions: allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        stats,
        activeWallet: nextActiveWallet,
        wageSettings,
        subscriptions,
        walletInvitations,
      });

      // Load goals separately
      await get().loadGoals();

    } catch (error) {
      console.error('Error loading data:', error);
    }
  },

  loadCategories: async (type) => {
    const user = get().user;
    if (!user) return [];
    return await db.getCategories(type, user.id) as Category[];
  },

  addCategory: async (data) => {
    const user = get().user;
    if (!user) return;
    await db.createCategory({ ...data, user_id: user.id });
    const categories = await db.getCategories(undefined, user.id) as Category[];
    set({ categories });
  },

  deleteCategory: async (id) => {
    await db.deleteCategory(id);
    const user = get().user;
    if (user) {
      const categories = await db.getCategories(undefined, user.id) as Category[];
      set({ categories });
    }
  },

  setActiveWallet: (wallet: WalletWithMembers) => {
    set({ activeWallet: wallet });
  },

  addTransaction: async (data) => {
    const user = get().user;
    const activeWallet = get().activeWallet;
    if (!user?.id) return;

    // Use active wallet if no wallet_id is provided
    const wallet_id = data.wallet_id || activeWallet?.id;
    if (!wallet_id) {
      console.error('No wallet available for transaction');
      return;
    }

    if (!data.category_id) {
      throw new Error('Wybierz kategorię');
    }

    await db.createTransaction({
      wallet_id,
      category_id: data.category_id,
      user_id: user.id,
      amount: Math.abs(Number(data.amount || 0)),
      type: data.type,
      description: data.note || data.description || undefined,
      date: data.date,
    });
    await get().loadData();
  },

  deleteTransaction: async (id) => {
    await db.deleteTransaction(id);
    await get().loadData();
  },

  // Wallets
  createWallet: async (data) => {
    const user = get().user;
    if (!user) return;
    await db.createWallet(user.id, data);
    await get().loadData();
  },

  updateWallet: async (id, data) => {
    await db.updateWallet(id, data);
    await get().loadData();
  },

  deleteWallet: async (id) => {
    await db.deleteWallet(id);
    await get().loadData();
  },

  inviteToWallet: async (walletId, username) => {
    await db.sendWalletInvitation(walletId, username);
    await get().loadWalletInvitations();
    await get().loadData();
  },

  loadWalletInvitations: async () => {
    const user = get().user;
    if (!user) {
      set({ walletInvitations: [] });
      return;
    }
    const invitations = await db.getWalletInvitations(user.id);
    set({ walletInvitations: invitations });
  },

  acceptWalletInvitation: async (invitationId) => {
    await db.respondToWalletInvitation(invitationId, 'accept');
    await get().loadWalletInvitations();
    await get().loadData();
  },

  rejectWalletInvitation: async (invitationId) => {
    await db.respondToWalletInvitation(invitationId, 'reject');
    await get().loadWalletInvitations();
    await get().loadData();
  },

  removeFromWallet: async (walletId, userId) => {
    await db.removeWalletMember(walletId, userId);
    await get().loadData();
  },

  leaveWallet: async (walletId) => {
    const user = get().user;
    if (!user) return;
    await db.leaveWallet(walletId, user.id);
    await get().loadData();
  },

  // Goals
  loadGoals: async () => {
    const user = get().user;
    if (!user) return;
    const activeWallet = get().activeWallet;
    const goalsData = await db.getGoals(
      user.id,
      activeWallet?.id,
      activeWallet ? !activeWallet.is_shared : true
    );
    // Ensure compliance with central Goal type which has 'completed: boolean'
    const goals = goalsData.map(g => ({
      ...g,
      completed: g.current_amount >= g.target_amount
    })) as Goal[];
    set({ goals });
  },

  addGoal: async (data) => {
    const user = get().user;
    const activeWallet = get().activeWallet;
    if (!user) return;
    await db.createGoal({
      ...data,
      user_id: user.id,
      wallet_id: activeWallet?.id || null,
    });
    await get().loadGoals();
  },

  contributeToGoal: async (id, amount) => {
    const user = get().user;
    await db.contributeToGoal(id, amount, user?.id);
    await get().loadGoals();
  },

  deleteGoal: async (id) => {
    await db.deleteGoal(id);
    await get().loadGoals();
  },

  // Wage Settings
  loadWageSettings: async () => {
    const user = get().user;
    if (!user) return;
    const wageSettings = await db.getWageSettings(user.id);
    set({ wageSettings });
  },

  saveWageSettings: async (settings) => {
    const user = get().user;
    if (!user) return;

    const updatedSettings = await db.saveWageSettings({
      ...settings,
      user_id: user.id,
    });
    set({ wageSettings: updatedSettings });
  },

  calculateWorkTime: (itemPrice) => {
    const { wageSettings } = get();
    if (!wageSettings || !itemPrice) return null;

    return db.calculateWorkTime(
      wageSettings.wage_amount,
      wageSettings.wage_period,
      itemPrice
    );
  },

  // Subscriptions
  loadSubscriptions: async () => {
    const user = get().user;
    if (!user) return;
    const subscriptions = await db.getSubscriptions(user.id);
    set({ subscriptions });
  },

  addSubscription: async (subscription) => {
    const user = get().user;
    if (!user) return;
    const newSubscription = await db.createSubscription({
      ...subscription,
      user_id: user.id,
    } as any);

    if (newSubscription.reminder_enabled) {
      await notificationService.scheduleSubscriptionReminder(
        newSubscription.id,
        newSubscription.name,
        newSubscription.next_payment_date,
        newSubscription.reminder_days_before || 1
      );
    }

    await get().loadSubscriptions();
  },

  updateSubscription: async (id, updates) => {
    const updatedSubscription = await db.updateSubscription(id, updates);

    if (updatedSubscription) {
      if (updatedSubscription.reminder_enabled) {
        await notificationService.scheduleSubscriptionReminder(
          updatedSubscription.id,
          updatedSubscription.name,
          updatedSubscription.next_payment_date,
          updatedSubscription.reminder_days_before || 1
        );
      } else {
        await notificationService.cancelSubscriptionReminder(updatedSubscription.id);
      }
    }

    await get().loadSubscriptions();
  },

  deleteSubscription: async (id) => {
    await db.deleteSubscription(id);
    await notificationService.cancelSubscriptionReminder(id);
    await get().loadSubscriptions();
  },

  // Security Actions
  lockApp: () => {
    const { securitySettings, isLoggedIn } = get();
    if (isLoggedIn && securitySettings.isPinEnabled) {
      set({ isAppLocked: true });
    }
  },

  unlockApp: () => {
    set({ isAppLocked: false });
  },

  loadSecuritySettings: async () => {
    const userId = get().user?.id;
    const hasPin = await securityService.hasPin(userId);
    const isBiometricsEnabled = hasPin ? await securityService.isBiometricsEnabled(userId) : false;

    set({
      securitySettings: {
        isPinEnabled: hasPin,
        isBiometricsEnabled
      }
    });

    if (!hasPin || !get().isLoggedIn) {
      set({ isAppLocked: false });
    }
  },

  enablePin: async (pin) => {
    const userId = get().user?.id;
    if (!userId) throw new Error('Najpierw zaloguj się do konta');
    await securityService.setPin(pin, userId);
    await get().loadSecuritySettings();
  },

  disablePin: async () => {
    const userId = get().user?.id;
    await securityService.removePin(userId);
    await get().loadSecuritySettings();
    set({ isAppLocked: false });
  },

  toggleBiometrics: async (enabled) => {
    const userId = get().user?.id;
    await securityService.setBiometricsEnabled(enabled, userId);
    await get().loadSecuritySettings();
  },
}));

export const useStore = DEMO_MODE ? useDemoStore : createSupabaseStore();
