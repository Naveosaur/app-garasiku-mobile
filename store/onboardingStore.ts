import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const ONBOARDING_KEY = 'onboarding_done';

type OnboardingStore = {
  onboardingDone: boolean | null;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

export const useOnboardingStore = create<OnboardingStore>()((set) => ({
  onboardingDone: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
      set({ onboardingDone: value === 'true', hydrated: true });
    } catch (error) {
      console.error('Failed to hydrate onboarding state:', error);
      set({ onboardingDone: false, hydrated: true });
    }
  },

  completeOnboarding: async () => {
    try {
      await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
      set({ onboardingDone: true });
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
      // Still set state even if storage fails
      set({ onboardingDone: true });
    }
  },
}));
