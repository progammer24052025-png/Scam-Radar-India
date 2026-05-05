import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { markOnboardingComplete } from "@/utils/storage";

const { width } = Dimensions.get("window");

interface Slide {
  id: string;
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
  bullets: { icon: string; text: string; honest?: boolean }[];
}

const SLIDES: Slide[] = [
  {
    id: "welcome",
    icon: "shield",
    iconColor: "#3B82F6",
    title: "Welcome to Scam Radar",
    subtitle: "India's community-powered scam detection platform. Before you use the app, read this carefully.",
    bullets: [
      { icon: "check-circle", text: "Detect suspicious phone numbers, UPI IDs, and messages" },
      { icon: "check-circle", text: "Stay updated on active scam threats across India" },
      { icon: "check-circle", text: "Report scams to protect others in your community" },
      { icon: "alert-circle", text: "This app is a safety tool — not a legal authority", honest: true },
    ],
  },
  {
    id: "analysis",
    icon: "cpu",
    iconColor: "#8B5CF6",
    title: "How Analysis Works",
    subtitle: "Be aware of what our analysis engine can and cannot do.",
    bullets: [
      { icon: "check-circle", text: "Detects known scam patterns in messages (keywords, tactics)" },
      { icon: "check-circle", text: "Cross-references community reports submitted by users like you" },
      { icon: "alert-circle", text: "Risk scores are estimates — not guaranteed to be accurate", honest: true },
      { icon: "alert-circle", text: "A LOW score does not confirm a number is safe", honest: true },
      { icon: "alert-circle", text: "Unverified reports are labeled clearly and weighted less", honest: true },
    ],
  },
  {
    id: "reports",
    icon: "flag",
    iconColor: "#F59E0B",
    title: "Community Reports",
    subtitle: "Reports from users power the risk scores. Here is how verification works.",
    bullets: [
      { icon: "check-circle", text: "Anyone can submit a report for a suspicious number or UPI" },
      { icon: "check-circle", text: "Reports go through duplicate detection and pattern checks" },
      { icon: "check-circle", text: "Our admin team reviews every report before verifying it" },
      { icon: "alert-circle", text: "Only admin-verified reports affect risk scores", honest: true },
      { icon: "alert-circle", text: "False or malicious reports are rejected and do not count", honest: true },
    ],
  },
  {
    id: "alerts",
    icon: "bell",
    iconColor: "#EF4444",
    title: "Alerts and Notifications",
    subtitle: "The Threat Intelligence feed and push notifications keep you informed in real time.",
    bullets: [
      { icon: "check-circle", text: "Alerts show active scam threats documented in India" },
      { icon: "check-circle", text: "New threat alerts are broadcast to all app users" },
      { icon: "check-circle", text: "When a scam report is verified, affected users are notified" },
      { icon: "alert-circle", text: "Enable notifications to receive alerts even when the app is closed", honest: true },
      { icon: "alert-circle", text: "You can disable notifications at any time in your device settings", honest: true },
    ],
  },
  {
    id: "privacy",
    icon: "lock",
    iconColor: "#22C55E",
    title: "Your Privacy",
    subtitle: "We built Scam Radar to protect you, not to collect your data.",
    bullets: [
      { icon: "check-circle", text: "Your search history stays on your device only" },
      { icon: "check-circle", text: "We do not store what you check in the app" },
      { icon: "check-circle", text: "Reports you submit contain only the info you provide" },
      { icon: "check-circle", text: "If in doubt, call the official Cybercrime Helpline: 1930" },
    ],
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const isLast = currentIndex === SLIDES.length - 1;

  const goNext = async () => {
    await Haptics.selectionAsync();
    if (isLast) {
      await markOnboardingComplete();
      router.replace("/(tabs)");
    } else {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
    }
  };

  const goBack = async () => {
    if (currentIndex === 0) return;
    await Haptics.selectionAsync();
    const prev = currentIndex - 1;
    setCurrentIndex(prev);
    flatListRef.current?.scrollToIndex({ index: prev, animated: true });
  };

  const skip = async () => {
    await markOnboardingComplete();
    router.replace("/(tabs)");
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.iconWrap, { backgroundColor: item.iconColor + "18", borderColor: item.iconColor + "40" }]}>
        <Feather name={item.icon as any} size={40} color={item.iconColor} />
      </View>
      <Text style={[styles.slideTitle, { color: colors.foreground }]}>{item.title}</Text>
      <Text style={[styles.slideSubtitle, { color: colors.mutedForeground }]}>{item.subtitle}</Text>
      <View style={[styles.bulletsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {item.bullets.map((b, i) => (
          <View key={i} style={styles.bulletRow}>
            <Feather
              name={b.icon as any}
              size={14}
              color={b.honest ? colors.warning : colors.riskLow}
            />
            <Text style={[styles.bulletText, { color: b.honest ? colors.mutedForeground : colors.foreground }]}>
              {b.text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 12,
          },
        ]}
      >
        <View style={styles.brandRow}>
          <View style={[styles.shieldSmall, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
            <Feather name="shield" size={14} color={colors.primary} />
          </View>
          <Text style={[styles.brandName, { color: colors.foreground }]}>SCAM RADAR</Text>
        </View>
        <TouchableOpacity onPress={skip} activeOpacity={0.7}>
          <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        renderItem={renderSlide}
        style={styles.flatList}
        contentContainerStyle={styles.flatListContent}
      />

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 16,
          },
        ]}
      >
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => {
            const isActive = i === currentIndex;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive ? colors.primary : colors.border,
                    width: isActive ? 20 : 6,
                  },
                ]}
              />
            );
          })}
        </View>

        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={goBack}
            activeOpacity={0.7}
            style={[
              styles.backBtn,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
                opacity: currentIndex === 0 ? 0 : 1,
              },
            ]}
            disabled={currentIndex === 0}
          >
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goNext}
            activeOpacity={0.8}
            style={[styles.nextBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.nextBtnText, { color: colors.primaryForeground }]}>
              {isLast ? "Get Started" : "Continue"}
            </Text>
            <Feather
              name={isLast ? "check" : "arrow-right"}
              size={16}
              color={colors.primaryForeground}
            />
          </TouchableOpacity>
        </View>

        <View style={[styles.disclaimer, { borderColor: colors.border }]}>
          <Feather name="info" size={11} color={colors.mutedForeground} />
          <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
            For emergencies, call Cybercrime Helpline 1930 or visit cybercrime.gov.in
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shieldSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    letterSpacing: 2,
  },
  skipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {},
  slide: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 16,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  slideTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    lineHeight: 32,
  },
  slideSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
    marginTop: -4,
  },
  bulletsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bulletText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  nextBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  disclaimerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
});
