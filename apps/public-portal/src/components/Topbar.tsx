import { Dual } from "./Dual";
import { LogoutButton } from "./LogoutButton";
import { RoleBadge } from "./RoleBadge";
import { useAuth } from "../auth/AuthContext";
import { maskFin, useFayda } from "../FaydaContext";
import type { Language } from "../types";

type TopbarProps = {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenExportModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenFaydaModal: () => void;
  onOpenVendorModal: () => void;
};

export function Topbar({ language, onLanguageChange, onOpenExportModal, onOpenSettingsModal, onOpenFaydaModal, onOpenVendorModal }: TopbarProps) {
  const { verification } = useFayda();
  return (
    <header className="topbar">
      <a className="brand" href="#top">
        <span className="brand-mark">ግ</span>
        <span>
          <b>ግልጽ ግዥ</b>
          <small>Clear procurement</small>
        </span>
      </a>

      <nav>
        <a href="#records">
          <Dual en="Records" am="መዝገቦች" separator="" />
        </a>
        <a href="#method">
          <Dual en="Method" am="ዘዴ" separator="" />
        </a>
      </nav>

      <div className="topbar-actions">
        <span className="synthetic-badge no-print">
          <Dual en="SYNTHETIC DATA ONLY" am="ሰው ሰራሽ መረጃ ብቻ" separator="" />
        </span>

        <button
          className="topbar-session-btn"
          onClick={onOpenExportModal}
          title="Export, import, or manage local audit session data"
          aria-label="Export or import session data"
        >
          <span className="session-icon">⚙</span>
          <Dual en="Session Data" am="የግምገማ ውሂብ" separator="" />
        </button>

        <button
          className="topbar-session-btn"
          onClick={onOpenSettingsModal}
          title="Adjust review signal thresholds"
          aria-label="Open threshold settings"
        >
          <Dual en="Thresholds" am="መገደቦች" />
        </button>

        <button
          className="topbar-session-btn"
          onClick={onOpenFaydaModal}
          title={
            verification
              ? `Fayda eKYC verified as ${verification.fullName} (FIN ${maskFin(verification.subjectId)})`
              : "Open the simulated Fayda eKYC verification demo"
          }
          aria-label="Fayda eKYC status — click to verify or view"
        >
          {verification ? (
            <span className="ekyc-chip ekyc-verified">
              <Dual
                en={`eKYC ✓ ${verification.fullName.split(" ")[0]}`}
                am={`eKYC ✓ ${verification.fullName.split(" ")[0]}`}
                separator=""
              />
            </span>
          ) : (
            <span className="ekyc-chip">
              <Dual en="eKYC: Unverified" am="eKYC: ያልተረጋገጠ" separator="" />
            </span>
          )}
        </button>

        <button
          className="topbar-session-btn"
          onClick={onOpenVendorModal}
          title="Register a supplier with Fayda eKYC (simulated)"
          aria-label="Register vendor with Fayda eKYC"
        >
          <Dual en="Vendor reg" am="አቅራቢ ምዝገባ" separator="" />
        </button>

        <div className="language" aria-label="Language selector">
          {(["both", "am", "en"] as const).map((option) => (
            <button
              key={option}
              className={language === option ? "active" : ""}
              onClick={() => onLanguageChange(option)}
            >
              {option === "both" ? "አማ + EN" : option.toUpperCase()}
            </button>
          ))}
        </div>

        <RoleBadge language={language} />
        <LogoutButton />
      </div>
    </header>
  );
}
