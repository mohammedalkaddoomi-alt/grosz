import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from './supabase';

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

  async getWallet(id: string) {
    return this.fetch<any>(`/wallets/${id}`);
  }

  async createWallet(data: { name: string; emoji: string; is_shared: boolean }) {
    return this.fetch<any>('/wallets', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateWallet(id: string, data: { name?: string; emoji?: string }) {
    return this.fetch<any>(`/wallets/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteWallet(id: string) {
    return this.fetch<any>(`/wallets/${id}`, { method: 'DELETE' });
  }

  // Joint Account / Shared Wallet Management
  async inviteToWallet(walletId: string, email: string) {
    return this.fetch<any>(`/wallets/${walletId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async removeFromWallet(walletId: string, userId: string) {
    return this.fetch<any>(`/wallets/${walletId}/members/${userId}`, {
      method: 'DELETE'
    });
  }

  async leaveWallet(walletId: string) {
    return this.fetch<any>(`/wallets/${walletId}/leave`, {
      method: 'POST'
    });
  }

  async getWalletMembers(walletId: string) {
    return this.fetch<any[]>(`/wallets/${walletId}/members`);
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

  // Goals
  async getGoals() {
    return this.fetch<any[]>('/goals');
  }

  async createGoal(data: { name: string; target_amount: number; emoji: string }) {
    return this.fetch<any>('/goals', { method: 'POST', body: JSON.stringify(data) });
  }

  async contributeToGoal(id: string, amount: number) {
    return this.fetch<any>(`/goals/${id}/contribute`, { method: 'POST', body: JSON.stringify({ amount }) });
  }

  async deleteGoal(id: string) {
    return this.fetch<any>(`/goals/${id}`, { method: 'DELETE' });
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
  async chat(message: string, timeoutMs: number = 25000) {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      const invokePromise = supabase.functions.invoke('analyze-finances', {
        body: { message },
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
      });

      const { data, error } = await Promise.race([invokePromise, timeoutPromise]);

      if (error) {
        console.error('Edge Function Error:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Chat API Error:', error);
      // Fallback for demo/offline is better handled in the UI or here
      throw error;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  async getChatHistory(limit: number = 20) {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  async saveChatHistory(message: string, response: string) {
    const normalizedMessage = message.trim();
    const normalizedResponse = response.trim();

    if (!normalizedMessage || !normalizedResponse) {
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { error } = await (supabase as any)
      .from('chat_history')
      .insert({
        user_id: user.id,
        message: normalizedMessage,
        response: normalizedResponse,
      });

    if (error) throw error;
  }

  // User search (for inviting to wallets)
  async searchUsers(query: string) {
    return this.fetch<any[]>(`/users/search?q=${encodeURIComponent(query)}`);
  }
}

export const api = new Api();
