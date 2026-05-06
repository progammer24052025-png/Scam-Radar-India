import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
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
    console.log("[ScamRadar] registerDevice start, platform:", platform, "uid:", uid);

    let pushToken: string | undefined;

    // Push tokens only work on native (not web)
    if (platform !== "web") {
      const { status: existing } = await Notifications.getPermissionsAsync();
      console.log("[ScamRadar] notification permission status:", existing);
      const finalStatus =
        existing === "granted"
          ? existing
          : (await Notifications.requestPermissionsAsync()).status;

      console.log("[ScamRadar] final permission status:", finalStatus);

      if (finalStatus === "granted") {
        // Android needs a notification channel
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
          console.log("[ScamRadar] requesting push token...");
          const tokenData = await Notifications.getExpoPushTokenAsync();
          pushToken = tokenData.data;
          console.log("[ScamRadar] push token obtained:", pushToken ? pushToken.slice(0, 30) + "..." : "null");
        } catch (tokenErr) {
          console.warn("[ScamRadar] push token error:", tokenErr);
        }
      } else {
        console.warn("[ScamRadar] notification permission denied");
      }
    }

    const result = await api.registerUser(uid, platform, pushToken);
    console.log("[ScamRadar] registerUser result:", JSON.stringify(result));
  } catch (err) {
    console.error("[ScamRadar] registerDevice failed:", err);
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
