import AsyncStorage from "@react-native-async-storage/async-storage";

import type { AnalysisResult, InputType } from "./scamAnalyzer";

export interface CheckRecord {
  id: string;
  input: string;
  inputType: InputType;
  result: AnalysisResult;
  timestamp: number;
}

const HISTORY_KEY = "@scam_radar_history";
const ONBOARDING_KEY = "@scam_radar_onboarded";
const MAX_HISTORY = 50;

export async function loadHistory(): Promise<CheckRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CheckRecord[];
  } catch {
    return [];
  }
}

export async function saveRecord(record: CheckRecord): Promise<void> {
  try {
    const history = await loadHistory();
    const updated = [record, ...history.filter((h) => h.id !== record.id)].slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // silent
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch {
    // silent
  }
}

export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(ONBOARDING_KEY);
    return val === "true";
  } catch {
    return false;
  }
}

export async function markOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
  } catch {
    // silent
  }
}
