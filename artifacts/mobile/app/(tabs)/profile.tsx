import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Linking } from "react-native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import {
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  const colors = useColors();
  const countAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(countAnim, { toValue: value, duration: 800, useNativeDriver: false }).start();
  }, [value]);

  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Animated.Text
        style={[styles.statNum, { color }]}
      >
        {value}
      </Animated.Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signInWithGoogle, signOut, refreshProfile, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    if (user) refreshProfile();
  }, []);

  const handleSignIn = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signInWithGoogle();
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await signOut();
        },
      },
    ]);
  };

  const dialHelpline = () => Linking.openURL("tel:1930");
  const openCybercrime = () => Linking.openURL("https://cybercrime.gov.in");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 16,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>

        {user ? (
          <>
            <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {(user.displayName || "?")[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.displayName, { color: colors.foreground }]}>{user.displayName}</Text>
                <Text style={[styles.email, { color: colors.mutedForeground }]}>{user.email}</Text>
                <View style={[styles.pointsBadge, { backgroundColor: colors.primary + "18" }]}>
                  <Feather name="award" size={12} color={colors.primary} />
                  <Text style={[styles.pointsText, { color: colors.primary }]}>{user.points} reputation points</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <StatCard value={user.reportsSubmitted ?? 0} label="Submitted" color={colors.primary} />
              <StatCard value={user.reportsVerified ?? 0} label="Verified" color={colors.riskLow} />
              <StatCard value={user.reportsRejected ?? 0} label="Rejected" color={colors.riskHigh} />
            </View>

            {user.rank && (
              <View style={[styles.rankCard, { backgroundColor: "#FFD700" + "12", borderColor: "#FFD700" + "33" }]}>
                <Text style={{ fontSize: 24 }}>🏆</Text>
                <View>
                  <Text style={[styles.rankTitle, { color: "#FFD700" }]}>Leaderboard Rank #{user.rank}</Text>
                  <Text style={[styles.rankSub, { color: colors.mutedForeground }]}>
                    Keep reporting to climb higher!
                  </Text>
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={[styles.signInCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.signInIcon, { backgroundColor: colors.primary + "18" }]}>
              <Feather name="user" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.signInTitle, { color: colors.foreground }]}>Join the Community</Text>
            <Text style={[styles.signInDesc, { color: colors.mutedForeground }]}>
              Sign in to track your reports, earn reputation points, and appear on the community leaderboard.
            </Text>
            <TouchableOpacity
              style={[styles.googleBtn, { backgroundColor: colors.primary }]}
              onPress={handleSignIn}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              <Feather name="user" size={16} color={colors.primaryForeground} />
              <Text style={[styles.googleBtnText, { color: colors.primaryForeground }]}>
                {isLoading ? "Signing in…" : "Sign in with Google"}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.signInNote, { color: colors.mutedForeground }]}>
              Your check history stays local. Only your report profile is stored.
            </Text>
          </View>
        )}

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>PREFERENCES</Text>
          <View style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name={theme === "dark" ? "moon" : "sun"} size={16} color={colors.primary} />
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Dark Mode</Text>
            <Switch
              value={theme === "dark"}
              onValueChange={async () => {
                await Haptics.selectionAsync();
                toggleTheme();
              }}
              trackColor={{ false: colors.border, true: colors.primary + "88" }}
              thumbColor={theme === "dark" ? colors.primary : colors.mutedForeground}
            />
          </View>
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>EMERGENCY</Text>
          <TouchableOpacity
            style={[styles.emergencyBtn, { backgroundColor: "#1F0A0A", borderColor: colors.riskHigh + "55" }]}
            onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); dialHelpline(); }}
            activeOpacity={0.8}
          >
            <View style={[styles.emergencyIcon, { backgroundColor: colors.riskHigh + "22" }]}>
              <Feather name="phone-call" size={20} color={colors.riskHigh} />
            </View>
            <View style={styles.emergencyText}>
              <Text style={[styles.emergencyTitle, { color: colors.riskHigh }]}>Call 1930 Now</Text>
              <Text style={[styles.emergencyDesc, { color: colors.mutedForeground }]}>National Cybercrime Helpline · 24/7</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.riskHigh} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={openCybercrime}
            activeOpacity={0.8}
          >
            <Feather name="external-link" size={15} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.primary }]}>cybercrime.gov.in — File Official Report</Text>
          </TouchableOpacity>
        </View>

        {user && (
          <TouchableOpacity
            style={[styles.signOutBtn, { borderColor: colors.border }]}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <Feather name="log-out" size={14} color={colors.riskHigh} />
            <Text style={[styles.signOutText, { color: colors.riskHigh }]}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 18 },
  title: { fontFamily: "Inter_700Bold", fontSize: 22 },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, borderWidth: 1 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 24 },
  profileInfo: { flex: 1, gap: 4 },
  displayName: { fontFamily: "Inter_700Bold", fontSize: 16 },
  email: { fontFamily: "Inter_400Regular", fontSize: 12 },
  pointsBadge: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 2 },
  pointsText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 14, alignItems: "center", gap: 4 },
  statNum: { fontFamily: "Inter_700Bold", fontSize: 22 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 10, textAlign: "center" },
  rankCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  rankTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  rankSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  signInCard: { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: "center", gap: 14 },
  signInIcon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  signInTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  signInDesc: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 },
  googleBtn: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, width: "100%", justifyContent: "center" },
  googleBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  signInNote: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "center", lineHeight: 16 },
  section: { gap: 10, borderTopWidth: 0 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 0.8 },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  settingLabel: { fontFamily: "Inter_400Regular", fontSize: 14, flex: 1 },
  emergencyBtn: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  emergencyIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  emergencyText: { flex: 1, gap: 2 },
  emergencyTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  emergencyDesc: { fontFamily: "Inter_400Regular", fontSize: 11 },
  linkBtn: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  linkText: { fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 },
  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12, borderWidth: 1 },
  signOutText: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
