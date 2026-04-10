import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View, useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useVehicleStore } from '@/store/vehicleStore';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const recentVehicleId = useVehicleStore((s) => s.recentVehicleId);

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
          tabBarStyle: {
            backgroundColor: Colors[colorScheme ?? 'light'].tabBar,
            borderTopColor: Colors[colorScheme ?? 'light'].tabBarBorder,
            borderTopWidth: 1,
            elevation: 0,
          },
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
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <MaterialIcons name="person" size={24} color={color} />,
          }}
        />

        {/* Hide reminders and explore from tab bar, but keep them as navigable screens */}
        <Tabs.Screen name="reminders" options={{ href: null }} />
        <Tabs.Screen name="explore" options={{ href: null }} />
      </Tabs>

      {/* Floating Add Button */}
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
          backgroundColor: Colors[colorScheme ?? 'light'].tint,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 3,
          borderColor: Colors[colorScheme ?? 'light'].tabBar,
        }}>
        <MaterialIcons name="add" size={28} color="white" />
      </Pressable>
    </View>
  );
}
