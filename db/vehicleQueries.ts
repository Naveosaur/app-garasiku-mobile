import type { Vehicle } from '@/types';
import { getDatabase } from './database';

function rowToVehicle(row: any): Vehicle {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    model: row.model,
    plate: row.plate,
    type: row.type,
    year: row.year,
    currentKM: row.current_km,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllVehicles(): Promise<Vehicle[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync('SELECT * FROM vehicles ORDER BY updated_at DESC');
  return rows.map(rowToVehicle);
}

export async function insertVehicle(vehicle: Vehicle): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO vehicles (id, name, brand, model, plate, type, year, current_km, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [vehicle.id, vehicle.name, vehicle.brand, vehicle.model, vehicle.plate, vehicle.type, vehicle.year, vehicle.currentKM, vehicle.createdAt, vehicle.updatedAt]
  );
}

export async function updateVehicle(id: string, updates: Partial<Vehicle>): Promise<void> {
  const db = await getDatabase();
  const setClauses: string[] = [];
  const values: any[] = [];

  const fields: (keyof Vehicle)[] = ['name', 'brand', 'model', 'plate', 'type', 'year', 'currentKM'];

  for (const field of fields) {
    if (field in updates) {
      const dbField = field === 'currentKM' ? 'current_km' : field;
      setClauses.push(`${dbField} = ?`);
      values.push(updates[field]);
    }
  }

  // Always update updated_at
  setClauses.push('updated_at = ?');
  values.push(new Date().toISOString());

  values.push(id);

  const query = `UPDATE vehicles SET ${setClauses.join(', ')} WHERE id = ?`;
  await db.runAsync(query, values);
}

export async function updateVehicleKM(id: string, km: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE vehicles SET current_km = ?, updated_at = ? WHERE id = ?',
    [km, new Date().toISOString(), id]
  );
}

export async function deleteVehicle(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM vehicles WHERE id = ?', [id]);
}
