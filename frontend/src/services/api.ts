import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from './supabase';
import { useStore, isDemoUser } from '../store/store';

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
    // Check for Demo User
    const user = useStore.getState().user;
    if (user && isDemoUser(user.id)) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        response: "To jest wersja demo, więc nie mam dostępu do prawdziwego AI. W pełnej wersji pomogę Ci analizować wydatki i planować budżet! 💰"
      };
    }

    // Call chatStream but accumulate result (fallback for non-streaming usage)
    let fullResponse = '';
    await this.chatStream(message, (text) => { fullResponse += text; });
    return { response: fullResponse };
  }

  async chatStream(message: string, onChunk: (text: string) => void): Promise<string> {
    const user = useStore.getState().user;
    if (user && isDemoUser(user.id)) {
      const mock = "To jest wersja demo, więc nie mam dostępu do prawdziwego AI. W pełnej wersji pomogę Ci analizować wydatki i planować budżet! 💰";
      const chunks = mock.match(/.{1,5}/g) || [];
      for (const chunk of chunks) {
        await new Promise(r => setTimeout(r, 50));
        onChunk(chunk);
      }
      return mock;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/analyze-finances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) throw new Error('API Error');

      // @ts-ignore - React Native / Expo fetch often supports .body.getReader() or we need a polyfill context
      // If .body is undefined, this will throw and we'll catch it.
      const reader = (response as any).body?.getReader();
      if (!reader) throw new Error('Streaming not supported');

      const decoder = new TextDecoder();
      let buffer = '';
      let cursor = 0;
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Simple regex to extract "text" fields from Gemini JSON stream
        // We start searching from the last known safe position to improve perf
        const regex = /"text":\s*"((?:[^"\\]|\\.)*)"/g;
        regex.lastIndex = cursor;

        let match;
        while ((match = regex.exec(buffer)) !== null) {
          try {
            const text = JSON.parse('"' + match[1] + '"');
            if (text) {
              onChunk(text);
              fullText += text;
            }
            cursor = match.index + match[0].length;
          } catch (e) {
            // Partial JSON string, wait for more data
          }
        }
        // Move cursor back a bit to handle potential split matches? 
        // No, regex.exec finds complete matches. If it's partial, it won't match quotes.
        // But what if the closing quote hasn't arrived?
        // match[1] depends on closing quote. So it won't match unless we have the closing quote.
        // So we are safe.
      }

      // Automatically save history after stream completes
      if (fullText.trim()) {
        await this.saveChatHistory(message, fullText).catch(e => console.error('Save history error', e));
      }

      return fullText;

    } catch (error) {
      console.error('Chat Stream Error:', error);
      throw error;
    }
  }

  async getChatHistory(limit: number = 20) {
    // Check for Demo User
    const user = useStore.getState().user;
    if (user && isDemoUser(user.id)) {
      return []; // Return empty history for demo
    }

    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  async saveChatHistory(message: string, response: string) {
    // Check for Demo User
    const user = useStore.getState().user;
    if (user && isDemoUser(user.id)) {
      return; // Do nothing for demo
    }

    const normalizedMessage = message.trim();
    const normalizedResponse = response.trim();

    if (!normalizedMessage || !normalizedResponse) {
      return;
    }

    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !currentUser) {
      // Try to get from store if auth.getUser fails (rate limit?)
      const storeUser = useStore.getState().user;
      if (!storeUser) throw new Error('User not authenticated');
      // Proceed with storeUser.id? No, let's just fail safely.
      // Actually, silently fail is better than crashing streaming.
      return;
    }

    const { error } = await (supabase as any)
      .from('chat_history')
      .insert({
        user_id: currentUser.id,
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
