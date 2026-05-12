import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { apiClient, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/utils/apiClient';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

type AuthStore = {
  user: AuthUser | null;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  _forceLogout: () => void;
};

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      if (token) {
        const { data } = await apiClient.get<{ success: boolean; data: AuthUser }>('/users/me');
        set({ user: data.data });
      }
    } catch {
      // token invalid — interceptor handles clearing on 401
    } finally {
      set({ hydrated: true });
    }
  },

  login: async (email, password) => {
    const { data } = await apiClient.post<{
      success: boolean;
      data: { user: AuthUser; accessToken: string; refreshToken: string };
    }>('/auth/login', { email, password });

    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.data.accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.data.refreshToken);
    set({ user: data.data.user });
  },

  register: async (name, email, password) => {
    const { data } = await apiClient.post<{
      success: boolean;
      data: { user: AuthUser; accessToken: string; refreshToken: string };
    }>('/auth/register', { name, email, password });

    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.data.accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.data.refreshToken);
    
    // Import and set hydrated for vehicle/maintenance stores
    const { useVehicleStore } = await import('./vehicleStore');
    const { useMaintenanceStore } = await import('./maintenanceStore');
    useVehicleStore.setState({ hydrated: true, vehicles: [] });
    useMaintenanceStore.setState({ hydrated: true, records: [] });
    
    set({ user: data.data.user });
  },

  logout: async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch {
      // proceed even if server call fails
    } finally {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      set({ user: null });
    }
  },

  _forceLogout: () => {
    set({ user: null });
  },
}));
