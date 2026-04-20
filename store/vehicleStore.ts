import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Vehicle } from '@/types';
import * as vehicleQueries from '@/db/vehicleQueries';

export type VehicleInput = Omit<Vehicle, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
  updatedAt?: string;
};

type VehicleStore = {
  vehicles: Vehicle[];
  recentVehicleId: string | null;
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;

  loadVehicles: () => Promise<void>;
  addVehicle: (vehicle: VehicleInput) => Promise<void>;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<void>;
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
    const recentId = await AsyncStorage.getItem('recent_vehicle_id');
    const vehicles = await vehicleQueries.getAllVehicles();
    set({ vehicles, recentVehicleId: recentId, hydrated: true });
  },

  addVehicle: async (vehicle) => {
    const finalVehicle: Vehicle = {
      id: vehicle.id,
      name: vehicle.name,
      brand: vehicle.brand,
      model: vehicle.model,
      plate: vehicle.plate,
      type: vehicle.type,
      year: vehicle.year,
      currentKM: vehicle.currentKM,
      createdAt: vehicle.createdAt || new Date().toISOString(),
      updatedAt: vehicle.updatedAt || new Date().toISOString(),
    };
    await vehicleQueries.insertVehicle(finalVehicle);
    set((state) => ({
      vehicles: [...state.vehicles, finalVehicle],
    }));
  },

  updateVehicle: async (id, updates) => {
    const now = new Date().toISOString();
    const updatePayload = { ...updates, updatedAt: now };
    await vehicleQueries.updateVehicle(id, updatePayload);
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === id ? { ...v, ...updatePayload } : v
      ),
    }));
  },

  updateKM: async (id, km) => {
    const now = new Date().toISOString();
    await vehicleQueries.updateVehicleKM(id, km);
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === id ? { ...v, currentKM: km, updatedAt: now } : v
      ),
    }));
  },

  deleteVehicle: async (id) => {
    await vehicleQueries.deleteVehicle(id);
    const { recentVehicleId } = get();
    set((state) => ({
      vehicles: state.vehicles.filter((v) => v.id !== id),
      recentVehicleId: recentVehicleId === id ? null : state.recentVehicleId,
    }));
  },

  setRecentVehicle: (id) => {
    if (id) {
      AsyncStorage.setItem('recent_vehicle_id', id);
    } else {
      AsyncStorage.removeItem('recent_vehicle_id');
    }
    set({ recentVehicleId: id });
  },
}));

