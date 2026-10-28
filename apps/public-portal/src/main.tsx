import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SettingsProvider } from "./SettingsContext";
import { AuthProvider } from "./auth/AuthContext";
import { FaydaProvider } from "./FaydaContext";
import { ThemeProvider } from "./theme";
import "./tailwind.css";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <FaydaProvider>
            <App />
          </FaydaProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
