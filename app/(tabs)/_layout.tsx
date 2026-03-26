import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { Colors, brand } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMaintenanceStore } from '@/store/maintenanceStore';
import { useVehicleStore } from '@/store/vehicleStore';
import { getMaintenanceStatuses } from '@/utils/maintenanceCalc';
import { getUnreadRemindersMap } from '@/utils/notifications';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const vehicles = useVehicleStore((s) => s.vehicles);
  const recentVehicleId = useVehicleStore((s) => s.recentVehicleId);
  const records = useMaintenanceStore((s) => s.records);

  const soonOverdueCount = React.useMemo(() => {
    let count = 0;
    for (const v of vehicles) {
      const statuses = getMaintenanceStatuses(v, records);
      for (const s of statuses) {
        if (s.status === 'soon' || s.status === 'overdue') count += 1;
      }
    }
    return count;
  }, [records, vehicles]);

  const [unreadDueCount, setUnreadDueCount] = React.useState(0);
  const updateUnreadDueCount = React.useCallback(async () => {
    const unreadMap = await getUnreadRemindersMap();

    const dueKeys = new Set<string>();
    for (const v of vehicles) {
      const statuses = getMaintenanceStatuses(v, records);
      for (const s of statuses) {
        if (s.status === 'soon' || s.status === 'overdue') {
          dueKeys.add(`${v.id}:${s.type}`);
        }
      }
    }

    const unreadDue = Object.keys(unreadMap).filter((k) => dueKeys.has(k)).length;
    setUnreadDueCount(unreadDue);
  }, [records, vehicles]);

  React.useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!mounted) return;
      await updateUnreadDueCount().catch(() => undefined);
    };

    run();
    const intervalId = setInterval(run, 5000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [updateUnreadDueCount]);

  const openAdd = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);

    if (recentVehicleId) {
      router.push(`/modals/add-maintenance?vehicleId=${encodeURIComponent(recentVehicleId)}`);
    } else {
      router.push('/modals/add-vehicle');
    }
  }, [recentVehicleId, router]);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <MaterialIcons name="home" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="vehicles"
          options={{
            title: 'Vehicles',
            tabBarIcon: ({ color }) => <MaterialIcons name="directions-bike" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="reminders"
          options={{
            title: 'Reminders',
            tabBarIcon: ({ color }) => (
              <View>
                <MaterialIcons name="notifications" size={24} color={color} />
                {unreadDueCount > 0 ? (
                  <View
                    style={{
                      position: 'absolute',
                      right: -4,
                      top: 0,
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      backgroundColor: '#10B981',
                    }}
                  />
                ) : null}
                {soonOverdueCount > 0 ? (
                  <View
                    style={{
                      position: 'absolute',
                      right: -6,
                      top: -8,
                      minWidth: 18,
                      height: 18,
                      paddingHorizontal: 5,
                      borderRadius: 9,
                      backgroundColor: 'red',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>
                      {Math.min(99, soonOverdueCount)}
                    </Text>
                  </View>
                ) : null}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <MaterialIcons name="person" size={24} color={color} />,
          }}
        />
      </Tabs>

      <Pressable
        onPress={openAdd}
        accessibilityRole="button"
        style={{
          position: 'absolute',
          alignSelf: 'center',
          bottom: (insets.bottom ?? 0) + 18,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: brand,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 3,
          borderColor: Colors[colorScheme ?? 'light'].background,
        }}>
        <MaterialIcons name="add" size={28} color="white" />
      </Pressable>
    </View>
  );
}
