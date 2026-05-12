import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import type { Vehicle } from '@/types';
import { apiClient } from '@/utils/apiClient';

export type VehicleInput = Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>;

type ApiVehicle = Omit<Vehicle, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

function mapVehicle(v: ApiVehicle): Vehicle {
  return {
    id: v.id,
    name: v.name,
    brand: v.brand,
    model: v.model,
    plate: v.plate,
    type: v.type,
    year: v.year,
    currentKM: v.currentKM,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}

const RECENT_VEHICLE_KEY = 'recent_vehicle_id';

type VehicleStore = {
  vehicles: Vehicle[];
  recentVehicleId: string | null;
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;

  loadVehicles: () => Promise<void>;
  addVehicle: (vehicle: VehicleInput) => Promise<void>;
  updateVehicle: (id: string, updates: Partial<VehicleInput>) => Promise<void>;
  updateKM: (id: string, km: number) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;

  setRecentVehicle: (id: string | null) => void;
};

export const useVehicleStore = create<VehicleStore>((set, get) => ({
  vehicles: [],
  recentVehicleId: null,
  hydrated: false,
  setHydrated: (hydrated) => set({ hydrated }),

  loadVehicles: async () => {
    const [recentId, { data }] = await Promise.all([
      SecureStore.getItemAsync(RECENT_VEHICLE_KEY).catch(() => null),
      apiClient.get<{ success: boolean; data: ApiVehicle[] }>('/vehicles'),
    ]);
    set({ vehicles: data.data.map(mapVehicle), recentVehicleId: recentId, hydrated: true });
  },

  addVehicle: async (vehicle) => {
    const { data } = await apiClient.post<{ success: boolean; data: ApiVehicle }>('/vehicles', vehicle);
    set((state) => ({ vehicles: [...state.vehicles, mapVehicle(data.data)] }));
  },

  updateVehicle: async (id, updates) => {
    const { data } = await apiClient.patch<{ success: boolean; data: ApiVehicle }>(`/vehicles/${id}`, updates);
    set((state) => ({
      vehicles: state.vehicles.map((v) => (v.id === id ? mapVehicle(data.data) : v)),
    }));
  },

  updateKM: async (id, km) => {
    console.log('[updateKM] called with id:', id, 'km:', km);
    // Optimistic update - update local state immediately
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === id ? { ...v, currentKM: km, updatedAt: new Date().toISOString() } : v,
      ),
    }));
    console.log('[updateKM] optimistic update done, store km:', km);

    try {
      // Sync to backend
      const response = await apiClient.patch<{ success: boolean; data: ApiVehicle }>(
        `/vehicles/${id}`,
        { currentKM: km },
      );
      console.log('[updateKM] API response km:', response.data?.data?.currentKM);
      // Don't overwrite with server response - keep optimistic value
    } catch (error) {
      console.warn('[updateKM] Failed to sync KM to backend:', error);
    }
  },

  deleteVehicle: async (id) => {
    await apiClient.delete(`/vehicles/${id}`);
    const { recentVehicleId } = get();
    set((state) => ({
      vehicles: state.vehicles.filter((v) => v.id !== id),
      recentVehicleId: recentVehicleId === id ? null : state.recentVehicleId,
    }));
  },

  setRecentVehicle: (id) => {
    if (id) {
      SecureStore.setItemAsync(RECENT_VEHICLE_KEY, id).catch(() => undefined);
    } else {
      SecureStore.deleteItemAsync(RECENT_VEHICLE_KEY).catch(() => undefined);
    }
    set({ recentVehicleId: id });
  },
}));
