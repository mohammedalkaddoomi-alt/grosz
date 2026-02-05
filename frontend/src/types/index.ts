// User types
export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Wallet types
export interface Wallet {
  id: string;
  name: string;
  emoji: string;
  balance: number;
  is_shared: boolean;
  owner_id: string;
  members: string[];
  created_at: string;
}

export interface WalletCreate {
  name: string;
  emoji: string;
  is_shared: boolean;
}

// Transaction types
export interface Transaction {
  id: string;
  wallet_id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  emoji: string;
  note?: string;
  created_at: string;
}

export interface TransactionCreate {
  wallet_id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  emoji: string;
  note?: string;
}

// Goal types
export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  emoji: string;
  deadline?: string;
  completed: boolean;
  created_at: string;
}

export interface GoalCreate {
  name: string;
  target_amount: number;
  emoji: string;
  deadline?: string;
}

// Dashboard types
export interface DashboardStats {
  total_balance: number;
  month_income: number;
  month_expenses: number;
  wallets_count: number;
  goals_progress: GoalProgress[];
  expense_categories: Record<string, number>;
}

export interface GoalProgress {
  id: string;
  name: string;
  emoji: string;
  progress: number;
  current: number;
  target: number;
}

// AI Chat types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatHistory {
  user_message: string;
  ai_response: string;
  timestamp: string;
}
