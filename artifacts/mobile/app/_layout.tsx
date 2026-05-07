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
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ScamProvider } from "@/context/ScamContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { api } from "@/utils/api";
import { getOrCreateDeviceUid, isOnboardingComplete } from "@/utils/storage";

SplashScreen.preventAutoHideAsync();

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // expo-notifications not fully supported in Expo Go SDK 53+; ignored
}

const queryClient = new QueryClient();

async function registerDevice() {
  try {
    const uid = await getOrCreateDeviceUid();
    const platform = Platform.OS;
    let fcmToken: string | undefined;

    if (platform !== "web") {
      const { status: existing } = await Notifications.getPermissionsAsync();
      const finalStatus =
        existing === "granted"
          ? existing
          : (await Notifications.requestPermissionsAsync()).status;

      if (finalStatus === "granted") {
        if (platform === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "Scam Radar Alerts",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#3B82F6",
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            showBadge: true,
          });
        }
        try {
          const tokenData = await Notifications.getDevicePushTokenAsync();
          if (tokenData.data && typeof tokenData.data === "string" && tokenData.data.length > 20) {
            fcmToken = tokenData.data;
          }
        } catch {
          // Silent — fails in Expo Go SDK 53+
        }
      }
    }

    await api.registerUser(uid, platform, fcmToken);
  } catch {
    // Best-effort
  }
}

function useNotificationDeepLink() {
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string> | null;
      if (!data) return;
      const type = data["type"];
      if (type === "verified_report") {
        router.push("/(tabs)/verified");
      } else if (type === "admin_broadcast") {
        router.push("/(tabs)/alerts");
      } else {
        router.push("/(tabs)/alerts");
      }
    });
    return () => { responseListener.current?.remove(); };
  }, []);
}

function RootLayoutNav() {
  useNotificationDeepLink();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0B0F1A" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, animation: "fade" }} />
      <Stack.Screen
        name="results"
        options={{ headerShown: false, presentation: "card", animation: "slide_from_bottom" }}
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
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <ThemeProvider>
                <AuthProvider>
                  <ScamProvider>
                    <RootLayoutNav />
                  </ScamProvider>
                </AuthProvider>
              </ThemeProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
