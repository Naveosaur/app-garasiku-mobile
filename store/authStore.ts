import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { LocalUser } from '@/types';

const AUTH_STORAGE_KEY = 'auth_user';

type AuthStore = {
  user: LocalUser | null;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  login: (user: LocalUser) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LocalUser;
        set({ user: parsed });
      }
    } catch {
      // ignore
    } finally {
      set({ hydrated: true });
    }
  },

  login: async (user) => {
    // MVP: if AsyncStorage fails for any reason, still set in-memory auth
    // so the app remains usable.
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
    set({ user });
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
    set({ user: null, hydrated: true });
  },
}));

