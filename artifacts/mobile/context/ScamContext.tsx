import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { analyzeInput, type AnalysisResult } from "@/utils/scamAnalyzer";
import { type CheckRecord, clearHistory, loadHistory, saveRecord } from "@/utils/storage";

interface ScamContextType {
  currentAnalysis: AnalysisResult | null;
  currentInput: string;
  history: CheckRecord[];
  isAnalyzing: boolean;
  analyzeText: (input: string) => Promise<void>;
  clearCurrentAnalysis: () => void;
  clearAllHistory: () => Promise<void>;
}

const ScamContext = createContext<ScamContextType | null>(null);

export function ScamProvider({ children }: { children: React.ReactNode }) {
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [currentInput, setCurrentInput] = useState("");
  const [history, setHistory] = useState<CheckRecord[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  const analyzeText = useCallback(async (input: string) => {
    setIsAnalyzing(true);
    setCurrentInput(input);

    await new Promise((resolve) => setTimeout(resolve, 2200));

    const result = analyzeInput(input);
    setCurrentAnalysis(result);

    const record: CheckRecord = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 8),
      input,
      inputType: result.inputType,
      result,
      timestamp: Date.now(),
    };

    await saveRecord(record);
    setHistory((prev) => [record, ...prev.slice(0, 49)]);
    setIsAnalyzing(false);
  }, []);

  const clearCurrentAnalysis = useCallback(() => {
    setCurrentAnalysis(null);
    setCurrentInput("");
  }, []);

  const clearAllHistory = useCallback(async () => {
    await clearHistory();
    setHistory([]);
  }, []);

  return (
    <ScamContext.Provider
      value={{
        currentAnalysis,
        currentInput,
        history,
        isAnalyzing,
        analyzeText,
        clearCurrentAnalysis,
        clearAllHistory,
      }}
    >
      {children}
    </ScamContext.Provider>
  );
}

export function useScam(): ScamContextType {
  const ctx = useContext(ScamContext);
  if (!ctx) throw new Error("useScam must be used within ScamProvider");
  return ctx;
}
