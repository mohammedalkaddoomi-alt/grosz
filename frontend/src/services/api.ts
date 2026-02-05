import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

class ApiService {
  private token: string | null = null;

  async init() {
    this.token = await AsyncStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      AsyncStorage.setItem('auth_token', token);
    } else {
      AsyncStorage.removeItem('auth_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}/api${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Błąd sieci' }));
      throw new Error(error.detail || 'Wystąpił błąd');
    }

    return response.json();
  }

  // Auth
  async register(email: string, password: string, name: string) {
    const response = await this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.setToken(response.access_token);
    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.access_token);
    return response;
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Wallets
  async getWallets() {
    return this.request<any[]>('/wallets');
  }

  async createWallet(data: { name: string; emoji: string; is_shared: boolean }) {
    return this.request<any>('/wallets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteWallet(id: string) {
    return this.request<any>(`/wallets/${id}`, { method: 'DELETE' });
  }

  // Transactions
  async getTransactions(walletId?: string, limit = 50) {
    const params = new URLSearchParams();
    if (walletId) params.append('wallet_id', walletId);
    params.append('limit', limit.toString());
    return this.request<any[]>(`/transactions?${params}`);
  }

  async createTransaction(data: {
    wallet_id: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    emoji: string;
    note?: string;
  }) {
    return this.request<any>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteTransaction(id: string) {
    return this.request<any>(`/transactions/${id}`, { method: 'DELETE' });
  }

  // Goals
  async getGoals() {
    return this.request<any[]>('/goals');
  }

  async createGoal(data: { name: string; target_amount: number; emoji: string; deadline?: string }) {
    return this.request<any>('/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async contributeToGoal(id: string, amount: number) {
    return this.request<any>(`/goals/${id}/contribute`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async deleteGoal(id: string) {
    return this.request<any>(`/goals/${id}`, { method: 'DELETE' });
  }

  // Dashboard
  async getDashboardStats() {
    return this.request<any>('/dashboard/stats');
  }

  // AI Chat
  async sendMessage(message: string) {
    return this.request<{ response: string; timestamp: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async getChatHistory() {
    return this.request<any[]>('/ai/history');
  }
}

export const api = new ApiService();
