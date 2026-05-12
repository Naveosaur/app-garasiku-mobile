import { create } from 'zustand';

import type { MaintenanceRecord } from '@/types';
import { apiClient } from '@/utils/apiClient';

export type MaintenanceRecordInput = Omit<MaintenanceRecord, 'id'>;

type ApiRecord = Omit<MaintenanceRecord, 'date'> & { date: string };

function mapRecord(r: ApiRecord): MaintenanceRecord {
  return {
    id: r.id,
    vehicleId: r.vehicleId,
    type: r.type,
    serviceKM: r.serviceKM,
    date: r.date,
    notes: r.notes,
  };
}

type MaintenanceStore = {
  records: MaintenanceRecord[];
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;

  loadRecords: () => Promise<void>;
  loadRecordsForVehicle: (vehicleId: string) => Promise<void>;
  addRecord: (record: MaintenanceRecordInput) => Promise<void>;
  deleteRecord: (id: string, vehicleId: string) => Promise<void>;
  getRecordsForVehicle: (vehicleId: string) => MaintenanceRecord[];
};

export const useMaintenanceStore = create<MaintenanceStore>((set, get) => ({
  records: [],
  hydrated: false,
  setHydrated: (hydrated) => set({ hydrated }),

  // Load all records across all vehicles (called at boot)
  loadRecords: async () => {
    // Not a single /maintenance endpoint; we mark hydrated and let
    // individual vehicle screens lazy-load via loadRecordsForVehicle.
    set({ hydrated: true });
  },

  loadRecordsForVehicle: async (vehicleId) => {
    const { data } = await apiClient.get<{ success: boolean; data: ApiRecord[] }>(
      `/vehicles/${vehicleId}/maintenance`,
    );
    const fetched = data.data.map(mapRecord);
    set((state) => ({
      // Replace records for this vehicle, keep others intact
      records: [
        ...state.records.filter((r) => r.vehicleId !== vehicleId),
        ...fetched,
      ],
    }));
  },

  addRecord: async (record) => {
    const { data } = await apiClient.post<{ success: boolean; data: ApiRecord }>(
      `/vehicles/${record.vehicleId}/maintenance`,
      {
        type: record.type,
        serviceKM: record.serviceKM,
        date: record.date,
        notes: record.notes,
      },
    );
    const finalRecord = mapRecord(data.data);
    set((state) => ({ records: [finalRecord, ...state.records] }));
  },

  deleteRecord: async (id, vehicleId) => {
    await apiClient.delete(`/vehicles/${vehicleId}/maintenance/${id}`);
    set((state) => ({ records: state.records.filter((r) => r.id !== id) }));
  },

  getRecordsForVehicle: (vehicleId) => {
    const records = get().records.filter((r) => r.vehicleId === vehicleId);
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
}));
