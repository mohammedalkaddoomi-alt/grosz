export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Wallet {
  id: string;
  name: string;
  emoji: string;
  balance: number;
  is_shared: boolean;
  owner_id: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  emoji: string;
  note?: string;
  created_at: string;
}
