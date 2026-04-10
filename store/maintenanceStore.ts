import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { MaintenanceRecord } from '@/types';

export type MaintenanceRecordInput = Omit<MaintenanceRecord, 'id'> & {
  id?: string;
};

type MaintenanceStore = {
  records: MaintenanceRecord[];
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;

  addRecord: (record: MaintenanceRecordInput) => void;
  deleteRecord: (id: string) => void;
  getRecordsForVehicle: (vehicleId: string) => MaintenanceRecord[];
};

export const useMaintenanceStore = create<MaintenanceStore>()(
  persist(
    (set, get) => ({
      records: [],
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),

      addRecord: (record) => {
        set((state) => ({
          records: [
            ...state.records,
            {
              ...record,
              id: record.id ?? `${Date.now()}`,
            },
          ],
        }));
      },

      deleteRecord: (id) => {
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        }));
      },

      getRecordsForVehicle: (vehicleId) => {
        const records = get().records.filter((r) => r.vehicleId === vehicleId);
        return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },
    }),
    {
      name: 'maintenance-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        } else {
          // No persisted data — still mark as hydrated so screens don't block.
          useMaintenanceStore.setState({ hydrated: true });
        }
      },
    },
  ),
);

