# VehiCare - Vehicle Maintenance Tracker

A modern React Native mobile app for tracking vehicle maintenance with KM-based service reminders.

## 🚀 Features

- 🚗 Multi-vehicle tracking (cars & motorcycles)
- 📊 Smart KM-based maintenance reminders (Safe/Soon/Overdue)
- 🔔 Push notifications for service alerts
- 📝 Maintenance history with notes
- 🔐 JWT authentication with refresh tokens
- 🌓 Beautiful dark mode with glassmorphism UI
- ⚡ Smooth 60fps animations
- 📱 Offline-first with SQLite + API sync

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator
- Backend API running (see Backend Setup below)

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
cd VehicleTracker
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure your API URL:

```env
# For iOS Simulator
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1

# For Android Emulator
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000/api/v1

# For Physical Device (replace with your machine's IP)
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3000/api/v1
```

**Finding your local IP:**
- Mac/Linux: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Windows: `ipconfig` (look for IPv4 Address)

### 3. Backend Setup

The backend must be running before starting the mobile app.

```bash
cd ../backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Run database migrations
npm run db:migrate

# Start the backend server
npm run dev
```

Backend will run on `http://localhost:3000`

### 4. Start the Mobile App

```bash
cd ../VehicleTracker

# Start Expo development server
npm start

# Or run directly on platform:
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web browser
```

## 📱 Running on Physical Device

### Option 1: Expo Go (Recommended for Testing)

1. Install Expo Go app from App Store/Play Store
2. Make sure your phone and computer are on the same WiFi
3. Update `.env` with your machine's local IP
4. Scan the QR code from `npm start`

**Note:** Some features like notifications may not work fully in Expo Go. For full functionality, use a development build.

### Option 2: Development Build (Full Features)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS
eas build --profile development --platform ios

# Build for Android
eas build --profile development --platform android
```

## 🏗️ Project Structure

```
VehicleTracker/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Main tab navigation
│   ├── (auth)/            # Auth screens (login/register)
│   ├── modals/            # Modal screens
│   └── vehicle/           # Vehicle detail screens
├── components/            # Reusable UI components
├── constants/             # Theme, colors, animations
├── db/                    # SQLite database layer
├── hooks/                 # Custom React hooks
├── store/                 # Zustand state management
├── types/                 # TypeScript type definitions
└── utils/                 # Utilities (API client, calculations)
```

## 🔧 Configuration

### App Configuration

Edit `app.json` to customize:
- App name and slug
- Bundle identifier
- App icons and splash screen
- Permissions

### Theme Customization

Edit `constants/theme.ts` to customize:
- Colors (light/dark mode)
- Typography
- Spacing
- Border radius
- Animations

## 🧪 Development

### Linting

```bash
npm run lint
```

### Clear Cache

```bash
npx expo start -c
```

### Reset Project

```bash
npm run reset-project
```

## 📦 Building for Production

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

## 🐛 Troubleshooting

### "Cannot connect to backend"

1. Check backend is running: `curl http://localhost:3000/api/v1/health`
2. Verify `.env` has correct API URL
3. For physical device, use your machine's local IP (not localhost)
4. Check firewall isn't blocking port 3000

### "AsyncStorage Native module is null"

This happens in Expo Go. Either:
- Restart the app
- Use a development build for full native module support

### "Reanimated Easing Error"

Make sure you're importing `Easing` from `react-native-reanimated`, not `react-native`.

### "Expo Notifications not supported in Expo Go"

Notifications have limited support in Expo Go. For full notification features, create a development build.

## 📚 Tech Stack

- **Framework:** React Native (Expo SDK 54)
- **Language:** TypeScript
- **Navigation:** Expo Router
- **State Management:** Zustand
- **Database:** SQLite (expo-sqlite)
- **Styling:** NativeWind (Tailwind CSS)
- **Animations:** React Native Reanimated 4
- **HTTP Client:** Axios
- **Storage:** Expo SecureStore, AsyncStorage

## 🔐 Security

- JWT tokens stored in Expo SecureStore (encrypted)
- Automatic token refresh on 401
- Password hashing with bcrypt
- HTTPS recommended for production

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues and questions, please open an issue on GitHub.
