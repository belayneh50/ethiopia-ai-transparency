import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_SETTINGS, type ThresholdSettings } from "./settings";

const SettingsContext = createContext<{
  settings: ThresholdSettings;
  updateSettings: (newSettings: Partial<ThresholdSettings>) => void;
} | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ThresholdSettings>(() => {
    const saved = localStorage.getItem("thresholdSettings");
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem("thresholdSettings", JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<ThresholdSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within a SettingsProvider");
  return context;
}