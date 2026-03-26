import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Vehicle } from '@/types';

export type VehicleInput = Omit<Vehicle, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
  updatedAt?: string;
};

type VehicleStore = {
  vehicles: Vehicle[];
  recentVehicleId: string | null;
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;

  addVehicle: (vehicle: VehicleInput) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  updateKM: (id: string, km: number) => void;
  deleteVehicle: (id: string) => void;

  setRecentVehicle: (id: string | null) => void;
};

export const useVehicleStore = create<VehicleStore>()(
  persist(
    (set, get) => ({
      vehicles: [],
      recentVehicleId: null,
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),

      addVehicle: (vehicle) => {
        const now = new Date().toISOString();
        set((state) => ({
          vehicles: [
            ...state.vehicles,
            {
              ...vehicle,
              createdAt: vehicle.createdAt ?? now,
              updatedAt: vehicle.updatedAt ?? now,
            },
          ],
        }));
      },

      updateVehicle: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          vehicles: state.vehicles.map((v) =>
            v.id === id
              ? {
                  ...v,
                  ...updates,
                  updatedAt: now,
                }
              : v,
          ),
        }));
      },

      updateKM: (id, km) => {
        const now = new Date().toISOString();
        set((state) => ({
          vehicles: state.vehicles.map((v) =>
            v.id === id
              ? {
                  ...v,
                  currentKM: km,
                  updatedAt: now,
                }
              : v,
          ),
        }));
      },

      deleteVehicle: (id) => {
        const { recentVehicleId } = get();
        set((state) => ({
          vehicles: state.vehicles.filter((v) => v.id !== id),
          recentVehicleId: recentVehicleId === id ? null : state.recentVehicleId,
        }));
      },

      setRecentVehicle: (id) => set({ recentVehicleId: id }),
    }),
    {
      name: 'vehicle-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

