import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '../constants/theme';
import { SharedValuesProvider } from '../contexts/SharedValuesContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SharedValuesProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.surfaceAlt },
          }}
        />
      </SharedValuesProvider>
    </GestureHandlerRootView>
  );
}
