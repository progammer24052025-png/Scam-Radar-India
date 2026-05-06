import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SymbolView } from "expo-symbols";

import { useColors } from "@/hooks/useColors";

const isIOS = Platform.OS === "ios";
const isWeb = Platform.OS === "web";

const TAB_SCREENS = [
  { name: "index", title: "Check", feather: "shield" as const, sf: "shield", sfFill: "shield.fill" },
  { name: "dashboard", title: "History", feather: "clock" as const, sf: "clock", sfFill: "clock.fill" },
  { name: "alerts", title: "Alerts", feather: "bell" as const, sf: "bell", sfFill: "bell.fill" },
  { name: "report", title: "Report", feather: "flag" as const, sf: "flag", sfFill: "flag.fill" },
];

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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
              tint={isDark ? "dark" : "light"}
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
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name={screen.sf} tintColor={color} size={22} />
              ) : (
                <Feather name={screen.feather} size={22} color={color} />
              ),
          }}
        />
      ))}
    </Tabs>
  );
}
