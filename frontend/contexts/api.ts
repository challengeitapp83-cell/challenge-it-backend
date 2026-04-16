import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

class ApiClient {
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('session_token');
    } catch {
      return null;
    }
  }

  async fetch(path: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_URL}${path}`;
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include' as RequestCredentials,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`API ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  get(path: string) {
    return this.fetch(path, { method: 'GET' });
  }

  post(path: string, body?: any) {
    return this.fetch(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put(path: string, body?: any) {
    return this.fetch(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete(path: string) {
    return this.fetch(path, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
