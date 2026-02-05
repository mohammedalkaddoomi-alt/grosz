import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

class Api {
  private token: string | null = null;

  async init() {
    this.token = await AsyncStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      AsyncStorage.setItem('token', token);
    } else {
      AsyncStorage.removeItem('token');
    }
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('token');
    }

    const res = await fetch(`${API_URL}/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Error');
    return data;
  }

  // Auth
  async register(email: string, password: string, name: string) {
    const res = await this.fetch<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async login(email: string, password: string) {
    const res = await this.fetch<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async getMe() {
    return this.fetch<any>('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Wallets
  async getWallets() {
    return this.fetch<any[]>('/wallets');
  }

  async createWallet(data: { name: string; emoji: string; is_shared: boolean }) {
    return this.fetch<any>('/wallets', { method: 'POST', body: JSON.stringify(data) });
  }

  // Transactions
  async getTransactions(walletId?: string) {
    const params = walletId ? `?wallet_id=${walletId}` : '';
    return this.fetch<any[]>(`/transactions${params}`);
  }

  async createTransaction(data: any) {
    return this.fetch<any>('/transactions', { method: 'POST', body: JSON.stringify(data) });
  }

  async deleteTransaction(id: string) {
    return this.fetch<any>(`/transactions/${id}`, { method: 'DELETE' });
  }

  // Dashboard
  async getStats() {
    return this.fetch<any>('/dashboard/stats');
  }

  // Categories
  async getCategories(type?: 'income' | 'expense') {
    const params = type ? `?type=${type}` : '';
    return this.fetch<any[]>(`/categories${params}`);
  }

  async createCategory(data: { name: string; emoji: string; type: 'income' | 'expense' }) {
    return this.fetch<any>('/categories', { method: 'POST', body: JSON.stringify(data) });
  }

  async deleteCategory(id: string) {
    return this.fetch<any>(`/categories/${id}`, { method: 'DELETE' });
  }

  // AI
  async chat(message: string) {
    return this.fetch<any>('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) });
  }
}

export const api = new Api();
