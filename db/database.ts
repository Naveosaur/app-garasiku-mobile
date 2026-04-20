import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

let database: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!database) {
    database = await SQLite.openDatabaseAsync('vehicare.db');
    await database.execAsync('PRAGMA foreign_keys = ON;');
  }
  return database;
}

export async function initializeDatabase() {
  const db = await getDatabase();

  const schema = `
    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      plate TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('motorcycle', 'car')),
      year INTEGER NOT NULL,
      current_km INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS maintenance_records (
      id TEXT PRIMARY KEY NOT NULL,
      vehicle_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('oil_change', 'brake_pads', 'battery', 'general_service')),
      service_km INTEGER NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS db_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `;

  // Execute schema
  await db.execAsync(schema);

  // Check migration status
  try {
    const result = await db.getFirstAsync('SELECT value FROM db_meta WHERE key = ?', ['async_migrated']);
    if (result) {
      return; // Already migrated
    }
  } catch {
    // Table exists but no rows — continue to migration
  }

  // Migrate from AsyncStorage
  try {
    const vehicleStoreJson = await AsyncStorage.getItem('vehicle-store');
    const maintenanceStoreJson = await AsyncStorage.getItem('maintenance-store');

    if (vehicleStoreJson) {
      const vehicleStore = JSON.parse(vehicleStoreJson);
      const vehicles = vehicleStore.state?.vehicles || [];

      for (const vehicle of vehicles) {
        try {
          await db.runAsync(
            `INSERT OR IGNORE INTO vehicles (id, name, brand, model, plate, type, year, current_km, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [vehicle.id, vehicle.name, vehicle.brand, vehicle.model, vehicle.plate, vehicle.type, vehicle.year, vehicle.currentKM, vehicle.createdAt, vehicle.updatedAt]
          );
        } catch (e) {
          console.warn('Failed to migrate vehicle:', vehicle.id, e);
        }
      }
    }

    if (maintenanceStoreJson) {
      const maintenanceStore = JSON.parse(maintenanceStoreJson);
      const records = maintenanceStore.state?.records || [];

      for (const record of records) {
        try {
          await db.runAsync(
            `INSERT OR IGNORE INTO maintenance_records (id, vehicle_id, type, service_km, date, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [record.id, record.vehicleId, record.type, record.serviceKM, record.date, record.notes || null]
          );
        } catch (e) {
          console.warn('Failed to migrate record:', record.id, e);
        }
      }
    }

    // Mark migration complete
    await db.runAsync('INSERT INTO db_meta (key, value) VALUES (?, ?)', ['async_migrated', 'true']);
  } catch (e) {
    console.error('AsyncStorage migration failed:', e);
    // Still mark as migrated to avoid infinite retry loop
    try {
      await db.runAsync('INSERT INTO db_meta (key, value) VALUES (?, ?)', ['async_migrated', 'true']);
    } catch {
      // db_meta insert also failed — give up gracefully
    }
  }
}
