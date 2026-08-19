import { Dual } from "./Dual";
import type { Language } from "../types";

type TopbarProps = {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenExportModal: () => void;
  onOpenSettingsModal: () => void;
};

export function Topbar({ language, onLanguageChange, onOpenExportModal, onOpenSettingsModal }: TopbarProps) {
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
      </div>
    </header>
  );
}
