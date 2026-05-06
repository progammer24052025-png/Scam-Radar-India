import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Feather } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ScamProvider } from "@/context/ScamContext";
import { api } from "@/utils/api";
import { getOrCreateDeviceUid } from "@/utils/storage";

SplashScreen.preventAutoHideAsync();

// Show notifications even when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const queryClient = new QueryClient();

async function registerDevice() {
  try {
    const uid = await getOrCreateDeviceUid();
    const platform = Platform.OS;

    let pushToken: string | undefined;
    let fcmToken: string | undefined;

    if (platform !== "web") {
      // Request notification permissions
      const { status: existing } = await Notifications.getPermissionsAsync();
      const finalStatus =
        existing === "granted"
          ? existing
          : (await Notifications.requestPermissionsAsync()).status;

      if (finalStatus === "granted") {
        // Set up Android notification channel
        if (platform === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "Scam Radar Alerts",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#3B82F6",
            lockscreenVisibility:
              Notifications.AndroidNotificationVisibility.PUBLIC,
            showBadge: true,
          });
        }

        // Try raw FCM device token (works with Firebase Admin Messaging directly)
        try {
          const deviceTokenData = await Notifications.getDevicePushTokenAsync();
          if (
            deviceTokenData.data &&
            typeof deviceTokenData.data === "string" &&
            deviceTokenData.data.length > 20
          ) {
            fcmToken = deviceTokenData.data;
          }
        } catch {
          // Silent — getDevicePushTokenAsync may fail in Expo Go
        }

        // Also try Expo push token (works with Expo Push Service in dev builds)
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync();
          if (tokenData.data) {
            pushToken = tokenData.data;
          }
        } catch {
          // Silent — getExpoPushTokenAsync fails in Expo Go on Android SDK 53+
        }
      }
    }

    await api.registerUser(uid, platform, pushToken, fcmToken);
  } catch {
    // Registration is best-effort — never crash the app
  }
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0B0F1A" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="onboarding"
        options={{ headerShown: false, animation: "fade" }}
      />
      <Stack.Screen
        name="results"
        options={{
          headerShown: false,
          presentation: "card",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    // Feather icon font — must be loaded explicitly on Android native
    ...Feather.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      registerDevice();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <ScamProvider>
                <RootLayoutNav />
              </ScamProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
