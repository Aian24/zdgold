import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.danicagold.app',
  appName: 'Danica Gold',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0C0E14",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0C0E14",
    },
  },
};

export default config;
