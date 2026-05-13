export type VehicleType = 'motorcycle' | 'car';

export type MaintenanceType =
  | 'oil_change'
  | 'brake_pads'
  | 'battery'
  | 'general_service';

export type ServiceStatus = 'safe' | 'soon' | 'overdue';

// Dynamic service type from backend
export interface ServiceType {
  id: string;
  name: string;
  intervalKM: number;
  vehicleType: VehicleType;
  icon: string;
  isDefault: boolean;
  userId: string | null;
}

export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  plate: string;
  type: VehicleType;
  year: number;
  currentKM: number;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  serviceTypeId?: string;
  serviceKM: number;
  date: string;
  notes?: string;
}

// Updated to support both legacy and dynamic service types
export interface MaintenanceStatus {
  type: MaintenanceType;
  serviceTypeId?: string;
  serviceTypeName: string;
  serviceTypeIcon?: string;
  lastServiceKM: number;
  nextServiceKM: number;
  remainingKM: number;
  intervalKM: number;
  status: ServiceStatus;
  lastRecord?: MaintenanceRecord;
}

export interface LocalUser {
  name: string;
  email: string;
}

