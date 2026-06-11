import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '../constants/theme';
import CustomSplash from '../components/CustomSplash';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [splashVisible, setSplashVisible] = useState(Platform.OS === 'android');

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.surfaceAlt },
        }}
      />
      {splashVisible && (
        <CustomSplash onFinish={() => setSplashVisible(false)} />
      )}
    </GestureHandlerRootView>
  );
}
