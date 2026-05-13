import { create } from 'zustand';
import { apiClient } from '@/utils/apiClient';
import type { ServiceType, VehicleType } from '@/types';

type ServiceTypeStore = {
  // Cache by vehicleType
  catalogue: Record<string, ServiceType[]>;
  loading: boolean;
  error: string | null;

  fetchCatalogue: (vehicleType: VehicleType) => Promise<ServiceType[]>;
  createServiceType: (data: {
    name: string;
    intervalKM: number;
    vehicleType: VehicleType;
    icon?: string;
  }) => Promise<ServiceType>;
  updateServiceType: (
    id: string,
    data: { name?: string; intervalKM?: number; icon?: string },
  ) => Promise<ServiceType>;
  deleteServiceType: (id: string, vehicleType: VehicleType) => Promise<void>;
};

export const useServiceTypeStore = create<ServiceTypeStore>((set, get) => ({
  catalogue: {},
  loading: false,
  error: null,

  fetchCatalogue: async (vehicleType) => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.get<{ success: boolean; data: ServiceType[] }>(
        `/service-types?vehicleType=${vehicleType}`,
      );
      set((state) => ({
        catalogue: { ...state.catalogue, [vehicleType]: data.data },
        loading: false,
      }));
      return data.data;
    } catch (err) {
      set({ loading: false, error: 'Failed to load service types' });
      throw err;
    }
  },

  createServiceType: async (body) => {
    const { data } = await apiClient.post<{ success: boolean; data: ServiceType }>(
      '/service-types',
      body,
    );    const newType = data.data;
    // Update cache
    set((state) => {
      const existing = state.catalogue[body.vehicleType] ?? [];
      return {
        catalogue: {
          ...state.catalogue,
          [body.vehicleType]: [...existing, newType],
        },
      };
    });
    return newType;
  },

  updateServiceType: async (id, body) => {
    const { data } = await apiClient.patch<{ success: boolean; data: ServiceType }>(
      `/service-types/${id}`,
      body,
    );
    const updated = data.data;
    // Update cache for all vehicle types
    set((state) => {
      const newCatalogue = { ...state.catalogue };
      for (const vt of Object.keys(newCatalogue)) {
        newCatalogue[vt] = newCatalogue[vt].map((st) =>
          st.id === id ? updated : st,
        );
      }
      return { catalogue: newCatalogue };
    });
    return updated;
  },

  deleteServiceType: async (id, vehicleType) => {
    await apiClient.delete(`/service-types/${id}`);
    set((state) => ({
      catalogue: {
        ...state.catalogue,
        [vehicleType]: (state.catalogue[vehicleType] ?? []).filter((st) => st.id !== id),
      },
    }));
  },
}));
