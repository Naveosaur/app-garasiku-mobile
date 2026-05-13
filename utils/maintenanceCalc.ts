import type {
  MaintenanceRecord,
  MaintenanceStatus,
  MaintenanceType,
  ServiceStatus,
  ServiceType,
  Vehicle,
} from '@/types';

import maintenanceDefaults from '@/constants/maintenanceDefaults';

// Legacy hardcoded types (kept for backward compat)
const LEGACY_MAINTENANCE_TYPES: MaintenanceType[] = [
  'oil_change',
  'brake_pads',
  'battery',
  'general_service',
];

const LEGACY_TYPE_NAMES: Record<MaintenanceType, string> = {
  oil_change: 'Oil Change',
  brake_pads: 'Brake Pads',
  battery: 'Battery',
  general_service: 'General Service',
};

function remainingToStatus(remainingKM: number): ServiceStatus {
  if (remainingKM <= 0) return 'overdue';
  if (remainingKM <= 500) return 'soon';
  return 'safe';
}

export function getVehicleWorstStatus(statuses: MaintenanceStatus[]): ServiceStatus {
  if (statuses.some((s) => s.status === 'overdue')) return 'overdue';
  if (statuses.some((s) => s.status === 'soon')) return 'soon';
  return 'safe';
}

/**
 * Compute maintenance statuses using DYNAMIC service types from backend.
 * Falls back to legacy hardcoded types if no serviceTypes provided.
 */
export function getMaintenanceStatuses(
  vehicle: Vehicle,
  records: MaintenanceRecord[],
  serviceTypes?: ServiceType[],
): MaintenanceStatus[] {
  const vehicleRecords = records.filter((r) => r.vehicleId === vehicle.id);

  // If dynamic service types are provided, use them
  if (serviceTypes && serviceTypes.length > 0) {
    return serviceTypes.map((st) => {
      // Find latest record matching this service type
      const latestRecord = vehicleRecords
        .filter((r) => r.serviceTypeId === st.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      const lastServiceKM = latestRecord?.serviceKM ?? 0;
      const nextServiceKM = lastServiceKM + st.intervalKM;
      const remainingKM = nextServiceKM - vehicle.currentKM;
      const status = remainingToStatus(remainingKM);

      return {
        type: 'general_service' as MaintenanceType,
        serviceTypeId: st.id,
        serviceTypeName: st.name,
        serviceTypeIcon: st.icon,
        lastServiceKM,
        nextServiceKM,
        remainingKM,
        intervalKM: st.intervalKM,
        status,
        lastRecord: latestRecord,
      };
    });
  }

  // Fallback: legacy hardcoded types
  return LEGACY_MAINTENANCE_TYPES.map((type) => {
    const latestRecord = vehicleRecords
      .filter((r) => r.type === type)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    const lastServiceKM = latestRecord?.serviceKM ?? 0;
    const intervalKM = maintenanceDefaults[type];
    const nextServiceKM = lastServiceKM + intervalKM;
    const remainingKM = nextServiceKM - vehicle.currentKM;
    const status = remainingToStatus(remainingKM);

    return {
      type,
      serviceTypeName: LEGACY_TYPE_NAMES[type],
      lastServiceKM,
      nextServiceKM,
      remainingKM,
      intervalKM,
      status,
      lastRecord: latestRecord,
    };
  });
}
