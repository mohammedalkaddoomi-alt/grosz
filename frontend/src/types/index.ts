export interface User {
  id: string;
  email: string;
  name: string;
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
  members?: string[];
  members_details?: WalletMember[];
  created_at?: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  user_id?: string;
  user_name?: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  emoji: string;
  note?: string;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  completed: boolean;
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
