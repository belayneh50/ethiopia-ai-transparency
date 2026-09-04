import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SettingsProvider } from "./SettingsContext";
import { AuthProvider } from "./auth/AuthContext";
import { FaydaProvider } from "./FaydaContext";
import "./tailwind.css";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <SettingsProvider>
        <FaydaProvider>
          <App />
        </FaydaProvider>
      </SettingsProvider>
    </AuthProvider>
  </React.StrictMode>,
);
