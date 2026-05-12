import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const PROFILE_PHOTO_KEY = 'profile_photo_uri';

type ProfileStore = {
  photoUri: string | null;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setPhoto: (uri: string | null) => Promise<void>;
};

/**
 * Local-only profile photo storage using SecureStore.
 * Can be extended later to sync with backend.
 */
export const useProfileStore = create<ProfileStore>()((set) => ({
  photoUri: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const uri = await SecureStore.getItemAsync(PROFILE_PHOTO_KEY);
      set({ photoUri: uri, hydrated: true });
    } catch {
      set({ photoUri: null, hydrated: true });
    }
  },

  setPhoto: async (uri) => {
    try {
      if (uri) {
        await SecureStore.setItemAsync(PROFILE_PHOTO_KEY, uri);
      } else {
        await SecureStore.deleteItemAsync(PROFILE_PHOTO_KEY);
      }
      set({ photoUri: uri });
    } catch (error) {
      console.error('Failed to save profile photo:', error);
      set({ photoUri: uri }); // Still update UI even if storage fails
    }
  },
}));
