import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.pawlo.os',
  appName: 'PAWLO',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor'
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#03060C'
    }
  }
};

export default config;
