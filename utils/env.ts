import Constants from 'expo-constants';

// Get API URL from environment variables with fallback
// For local dev with Expo Go on a physical device, use your machine's LAN IP.
// For Android emulator: http://10.0.2.2:3000/api/v1
// For iOS simulator: http://localhost:3000/api/v1
export const API_BASE_URL = 
  Constants.expoConfig?.extra?.apiBaseUrl || 
  process.env.EXPO_PUBLIC_API_BASE_URL || 
  'http://localhost:3000/api/v1';
