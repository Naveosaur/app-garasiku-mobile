import type { MaintenanceType } from '@/types';

// Default maintenance intervals (km) for MVP.
const maintenanceDefaults: Record<MaintenanceType, number> = {
  oil_change: 3000,
  brake_pads: 10000,
  battery: 15000,
  general_service: 6000,
};

export default maintenanceDefaults;

