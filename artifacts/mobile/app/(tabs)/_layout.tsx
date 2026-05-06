import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";

const isIOS = Platform.OS === "ios";
const isWeb = Platform.OS === "web";

const TAB_SCREENS = [
  { name: "index", title: "Check", feather: "shield" as const },
  { name: "alerts", title: "Alerts", feather: "bell" as const },
  { name: "verified", title: "Verified", feather: "check-circle" as const },
  { name: "leaderboard", title: "Leaders", feather: "award" as const },
  { name: "tips", title: "Tips", feather: "book-open" as const },
  { name: "news", title: "News", feather: "radio" as const },
  { name: "report", title: "Report", feather: "flag" as const },
  { name: "dashboard", title: "History", feather: "clock" as const },
  { name: "profile", title: "Profile", feather: "user" as const },
];

export default function TabLayout() {
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 10,
          marginBottom: isWeb ? 8 : 0,
        },
      }}
    >
      {TAB_SCREENS.map((screen) => (
        <Tabs.Screen
          key={screen.name}
          name={screen.name}
          options={{
            title: screen.title,
            tabBarIcon: ({ color }) => (
              <Feather name={screen.feather} size={22} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
