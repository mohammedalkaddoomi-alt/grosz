export interface User {
  id: string;
  email: string;
  name: string;
  username: string | null;
  created_at: string;
}

export interface WalletMember {
  id: string;
  name: string;
  email: string;
  joined_at?: string;
}

export interface Wallet {
  id: string;
  name: string;
  emoji: string;
  balance: number;
  is_shared: boolean;
  owner_id: string;
  owner_details?: WalletMember;
  members?: string[];
  members_details?: WalletMember[];
  created_at?: string;
}

export interface WalletInvitation {
  id: string;
  wallet_id: string;
  inviter_id: string;
  invitee_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  responded_at?: string | null;
  wallet?: Pick<Wallet, 'id' | 'name' | 'emoji' | 'is_shared' | 'owner_id'>;
  inviter?: {
    id: string;
    name: string;
    email: string;
    username: string | null;
  };
}

export interface Transaction {
  id: string;
  wallet_id: string;
  user_id?: string;
  user_name?: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  emoji?: string;
  note?: string;
  created_at: string;
  categories?: {
    name: string;
    emoji: string;
  };
}

export interface Goal {
  id: string;
  user_id: string;
  wallet_id?: string | null;
  user_name?: string;
  name: string;
  emoji: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  completed: boolean;
  created_at: string;
}

export interface GoalActivity {
  id: string;
  goal_id: string;
  user_id: string;
  user_name?: string;
  action: 'created' | 'contributed';
  amount?: number | null;
  note?: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  emoji: string;
  type: 'income' | 'expense';
  is_default?: boolean;
}

export interface DashboardStats {
  total_balance: number;
  month_income: number;
  month_expenses: number;
  wallets_count: number;
  goals_progress: {
    id: string;
    name: string;
    emoji: string;
    progress: number;
    current: number;
    target: number;
  }[];
  expense_categories: Record<string, number>;
}

export type WagePeriod = 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface WageSettings {
  id?: string;
  user_id: string;
  wage_amount: number;
  wage_period: WagePeriod;
  currency: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkCalculation {
  itemPrice: number;
  wageAmount: number;
  wagePeriod: WagePeriod;
  hoursNeeded: number;
  daysNeeded: number;
  weeksNeeded: number;
  monthsNeeded: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  price: number;
  currency: string;
  billing_cycle: 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  next_payment_date: string;
  reminder_enabled: boolean;
  reminder_days_before: number;
  icon: string | null;
  created_at: string;
  updated_at: string;
}
