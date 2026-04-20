import type { MaintenanceRecord } from '@/types';
import { getDatabase } from './database';

function rowToRecord(row: any): MaintenanceRecord {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    type: row.type,
    serviceKM: row.service_km,
    date: row.date,
    notes: row.notes || undefined,
  };
}

export async function getAllRecords(): Promise<MaintenanceRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    'SELECT * FROM maintenance_records ORDER BY date DESC'
  );
  return rows.map(rowToRecord);
}

export async function getRecordsForVehicle(vehicleId: string): Promise<MaintenanceRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    'SELECT * FROM maintenance_records WHERE vehicle_id = ? ORDER BY date DESC',
    [vehicleId]
  );
  return rows.map(rowToRecord);
}

export async function insertRecord(record: MaintenanceRecord): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO maintenance_records (id, vehicle_id, type, service_km, date, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [record.id, record.vehicleId, record.type, record.serviceKM, record.date, record.notes || null]
  );
}

export async function deleteRecord(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM maintenance_records WHERE id = ?', [id]);
}
