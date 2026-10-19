import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_SETTINGS, type ThresholdSettings } from "./settings";
import { apiFetch, useAuth } from "./auth/AuthContext";

const SettingsContext = createContext<{
  settings: ThresholdSettings;
  updateSettings: (newSettings: ThresholdSettings) => Promise<void>;
} | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<ThresholdSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    apiFetch('/api/settings/thresholds').then(async response => {
      if (!response.ok) throw new Error('Unable to load thresholds');
      const data = await response.json() as ThresholdSettings;
      if (active) setSettings({ price: data.price, repeatSupplier: data.repeatSupplier, delay: data.delay });
    }).catch(() => { /* Defaults remain available if the local API is offline. */ });
    return () => { active = false; };
  }, [isAuthenticated]);

  const updateSettings = useCallback(async (newSettings: ThresholdSettings) => {
    const response = await apiFetch('/api/settings/thresholds', { method: 'PATCH', body: JSON.stringify(newSettings) });
    if (!response.ok) throw new Error(response.status === 403 ? 'Only Admin can change thresholds' : 'Unable to save thresholds');
    const data = await response.json() as ThresholdSettings;
    setSettings({ price: data.price, repeatSupplier: data.repeatSupplier, delay: data.delay });
  }, []);

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
