import { create } from 'zustand';

import type { MaintenanceRecord } from '@/types';
import * as maintenanceQueries from '@/db/maintenanceQueries';

export type MaintenanceRecordInput = Omit<MaintenanceRecord, 'id'> & {
  id?: string;
};

type MaintenanceStore = {
  records: MaintenanceRecord[];
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;

  loadRecords: () => Promise<void>;
  addRecord: (record: MaintenanceRecordInput) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  getRecordsForVehicle: (vehicleId: string) => MaintenanceRecord[];
};

export const useMaintenanceStore = create<MaintenanceStore>((set, get) => ({
  records: [],
  hydrated: false,
  setHydrated: (hydrated) => set({ hydrated }),

  loadRecords: async () => {
    const records = await maintenanceQueries.getAllRecords();
    set({ records, hydrated: true });
  },

  addRecord: async (record) => {
    const finalRecord: MaintenanceRecord = {
      ...record,
      id: record.id ?? `${Date.now()}`,
    };
    await maintenanceQueries.insertRecord(finalRecord);
    set((state) => ({
      records: [finalRecord, ...state.records],
    }));
  },

  deleteRecord: async (id) => {
    await maintenanceQueries.deleteRecord(id);
    set((state) => ({
      records: state.records.filter((r) => r.id !== id),
    }));
  },

  getRecordsForVehicle: (vehicleId) => {
    const records = get().records.filter((r) => r.vehicleId === vehicleId);
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
}));

