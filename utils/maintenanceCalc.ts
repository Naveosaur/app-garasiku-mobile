import type { MaintenanceRecord, MaintenanceStatus, MaintenanceType, ServiceStatus, Vehicle } from '@/types';

import maintenanceDefaults from '@/constants/maintenanceDefaults';

const MAINTENANCE_TYPES: MaintenanceType[] = [
  'oil_change',
  'brake_pads',
  'battery',
  'general_service',
];

function remainingToStatus(remainingKM: number): ServiceStatus {
  if (remainingKM <= 0) return 'overdue';
  if (remainingKM <= 500) return 'soon';
  return 'safe';
}

export function getVehicleWorstStatus(statuses: MaintenanceStatus[]): ServiceStatus {
  // Overdue is the worst, then Soon, then Safe.
  if (statuses.some((s) => s.status === 'overdue')) return 'overdue';
  if (statuses.some((s) => s.status === 'soon')) return 'soon';
  return 'safe';
}

export function getMaintenanceStatuses(vehicle: Vehicle, records: MaintenanceRecord[]): MaintenanceStatus[] {
  const vehicleRecords = records.filter((r) => r.vehicleId === vehicle.id);

  return MAINTENANCE_TYPES.map((type) => {
    const latestRecord = vehicleRecords
      .filter((r) => r.type === type)
      .sort((a, b) => {
        const aTime = new Date(a.date).getTime();
        const bTime = new Date(b.date).getTime();
        return bTime - aTime;
      })[0];

    // If there is no record yet, treat the current KM as the last service KM.
    const lastServiceKM = latestRecord?.serviceKM ?? vehicle.currentKM;
    const intervalKM = maintenanceDefaults[type];
    const nextServiceKM = lastServiceKM + intervalKM;
    const remainingKM = nextServiceKM - vehicle.currentKM;
    const status = remainingToStatus(remainingKM);

    return {
      type,
      lastServiceKM,
      nextServiceKM,
      remainingKM,
      intervalKM,
      status,
      lastRecord: latestRecord,
    };
  });
}

