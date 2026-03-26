export type VehicleType = 'motorcycle' | 'car';

export type MaintenanceType =
  | 'oil_change'
  | 'brake_pads'
  | 'battery'
  | 'general_service';

export type ServiceStatus = 'safe' | 'soon' | 'overdue';

export interface Vehicle {
  id: string;
  name: string; // e.g. "Honda Beat"
  plate: string; // e.g. "B 1234 ABC"
  type: VehicleType;
  year: number;
  currentKM: number;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  serviceKM: number;
  date: string; // ISO date
  notes?: string;
}

export interface MaintenanceStatus {
  type: MaintenanceType;
  lastServiceKM: number;
  nextServiceKM: number;
  remainingKM: number;
  intervalKM: number;
  status: ServiceStatus;
  lastRecord?: MaintenanceRecord;
}

// Local (MVP) auth payload only. No backend is used.
export interface LocalUser {
  name: string;
  email: string;
}

