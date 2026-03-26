import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { MaintenanceStatus, Vehicle } from '@/types';

const IDENTIFIERS_KEY = 'reminder-identifiers_v1';
const UNREAD_REMINDERS_KEY = 'unread-reminders_v1';

function reminderIdentifierKey(vehicleId: string, maintenanceType: MaintenanceStatus['type']) {
  return `${vehicleId}:${maintenanceType}`;
}

function maintenanceTypePretty(type: MaintenanceStatus['type']) {
  return type.replace(/_/g, ' ');
}

let hasSetNotificationHandler = false;
async function ensureNotificationSetup() {
  if (!hasSetNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    hasSetNotificationHandler = true;
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
}

async function readIdentifierMap(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(IDENTIFIERS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

async function writeIdentifierMap(map: Record<string, string>) {
  await AsyncStorage.setItem(IDENTIFIERS_KEY, JSON.stringify(map));
}

async function readUnreadRemindersMap(): Promise<Record<string, number>> {
  try {
    const raw = await AsyncStorage.getItem(UNREAD_REMINDERS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

async function writeUnreadRemindersMap(map: Record<string, number>) {
  await AsyncStorage.setItem(UNREAD_REMINDERS_KEY, JSON.stringify(map));
}

export async function cancelAllRemindersForVehicle(vehicleId: string) {
  const map = await readIdentifierMap();
  const keys = Object.keys(map).filter((k) => k.startsWith(`${vehicleId}:`));

  await Promise.all(
    keys.map(async (k) => {
      const identifier = map[k];
      if (identifier) await Notifications.cancelScheduledNotificationAsync(identifier);
    }),
  );

  for (const k of keys) delete map[k];
  await writeIdentifierMap(map);
}

// Schedule a LOCAL reminder for a single maintenance status (soon or overdue).
export async function scheduleMaintenanceReminder(vehicle: Vehicle, maintenanceStatus: MaintenanceStatus) {
  if (maintenanceStatus.status !== 'soon' && maintenanceStatus.status !== 'overdue') return;

  await ensureNotificationSetup();

  const identifierKey = reminderIdentifierKey(vehicle.id, maintenanceStatus.type);
  const map = await readIdentifierMap();

  // Avoid duplicates for the same vehicle+maintenance type.
  if (map[identifierKey]) {
    await Notifications.cancelScheduledNotificationAsync(map[identifierKey]).catch(() => undefined);
  }

  const title = `⚠️ Service Due Soon — ${vehicle.name}`;
  const body = `${maintenanceTypePretty(maintenanceStatus.type)} in ${Math.max(
    0,
    maintenanceStatus.remainingKM,
  )} km. Next service at ${maintenanceStatus.nextServiceKM} km.`;

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
      repeats: false,
    },
  });

  map[identifierKey] = identifier;
  await writeIdentifierMap(map);

  const unreadMap = await readUnreadRemindersMap();
  unreadMap[identifierKey] = Date.now();
  await writeUnreadRemindersMap(unreadMap);
}

export async function getUnreadRemindersMap(): Promise<Record<string, number>> {
  return readUnreadRemindersMap();
}

export async function clearAllUnreadReminders() {
  await AsyncStorage.removeItem(UNREAD_REMINDERS_KEY).catch(() => undefined);
}

