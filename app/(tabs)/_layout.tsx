import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { useAppTheme } from '@/constants/theme';

/**
 * Tesla-inspired tab bar with frosted glass
 */
function TabBarBackground({ isDark }: { isDark: boolean }) {
  return (
    <>
      <BlurView
        intensity={isDark ? 40 : 80}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFillObject}
      />
      <View 
        style={[
          StyleSheet.absoluteFillObject, 
          { 
            backgroundColor: isDark 
              ? 'rgba(0, 0, 0, 0.70)' 
              : 'rgba(255, 255, 255, 0.70)',
          }
        ]} 
      />
    </>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const t = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: t.text,
        tabBarInactiveTintColor: t.textSubtle,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopColor: t.tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
          height: 84,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
        tabBarBackground: () => <TabBarBackground isDark={isDark} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: 'Vehicles',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="directions-car" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              name={focused ? 'person' : 'person-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen name="reminders" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
