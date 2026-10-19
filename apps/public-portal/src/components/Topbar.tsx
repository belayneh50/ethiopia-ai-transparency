import { useEffect, useRef, useState } from "react";
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
  const { can, role } = useAuth();
  const { verification } = useFayda();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  const closeMobileMenu = (returnFocus = true) => {
    setMobileMenuOpen(false);
    if (returnFocus) window.setTimeout(() => menuButtonRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileMenu();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) closeMobileMenu();
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [mobileMenuOpen]);

  const runMobileAction = (action: () => void) => {
    setMobileMenuOpen(false);
    action();
  };

  const firstName = verification?.fullName.split(" ")[0];
  return (
    <header className="topbar" ref={headerRef}>
      <a className="brand" href="#top">
        <span className="brand-mark">ግ</span>
        <span>
          <b>ግልጽ ግዥ</b>
          <small>Clear procurement</small>
        </span>
      </a>

      <span className="mobile-session-status" aria-label={`${role || "user"}; ${verification ? `eKYC verified as ${verification.fullName}` : "eKYC unverified"}`}>
        <b>{role?.toUpperCase()}</b>
        <span>{verification ? `eKYC ✓ ${firstName}` : "eKYC: Unverified"}</span>
      </span>

      <button
        ref={menuButtonRef}
        type="button"
        className="mobile-menu-toggle"
        aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={mobileMenuOpen}
        aria-controls="mobile-navigation-panel"
        onClick={() => setMobileMenuOpen((open) => !open)}
      >
        <span aria-hidden="true">{mobileMenuOpen ? "×" : "☰"}</span>
      </button>

      <nav>
        <a href="#records">
          <Dual en="Records" am="መዝገቦች" separator="" />
        </a>
        <a href="#method">
          <Dual en="Method" am="ዘዴ" separator="" />
        </a>
      </nav>

      <div className="topbar-actions">
        <span className="synthetic-badge no-print" aria-label="Synthetic data only">
          <Dual en="SYNTHETIC DATA ONLY" am="ሰው ሰራሽ መረጃ ብቻ" separator="" />
        </span>

        {/* Compact admin toolbar: grouped secondary actions */}
        <div className="admin-toolbar" aria-label="Administrative actions">
          <button className="admin-btn" onClick={onOpenExportModal} title="Session data" aria-label="Session data export or import">
            <span aria-hidden="true">⚙</span><span>Session</span>
          </button>
          <button className="admin-btn" disabled={!can('changeThresholds')} onClick={onOpenSettingsModal} title="Threshold settings" aria-label="Open threshold settings">
            <span aria-hidden="true">◈</span><span>Thresholds</span>
          </button>
          <button className="admin-btn" onClick={onOpenFaydaModal} title={verification ? `Verified: ${verification.fullName}` : "Fayda demo verification"} aria-label="Fayda eKYC verification">
            <span aria-hidden="true">✓</span><span>eKYC</span>
          </button>
          <button className="admin-btn" onClick={onOpenVendorModal} title="Register a vendor" aria-label="Register vendor">
            <span aria-hidden="true">◆</span><span>Vendor</span>
          </button>
        </div>

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

      <div id="mobile-navigation-panel" className={`mobile-navigation-panel ${mobileMenuOpen ? "open" : ""}`} hidden={!mobileMenuOpen}>
        <nav className="mobile-nav-row" aria-label="Page sections">
          <a href="#records" onClick={() => closeMobileMenu(false)}><Dual en="Records" am="መዝገቦች" /></a>
          <a href="#method" onClick={() => closeMobileMenu(false)}><Dual en="Method" am="ዘዴ" /></a>
        </nav>
        <div className="mobile-action-grid" aria-label="Administrative actions">
          <button onClick={() => runMobileAction(onOpenExportModal)}><span aria-hidden="true">⚙</span><Dual en="Session" am="ክፍለ ጊዜ" /></button>
          <button disabled={!can('changeThresholds')} onClick={() => runMobileAction(onOpenSettingsModal)}><span aria-hidden="true">◈</span><Dual en="Thresholds" am="ገደቦች" /></button>
          <button onClick={() => runMobileAction(onOpenFaydaModal)}><span aria-hidden="true">✓</span><Dual en="eKYC" am="ማረጋገጫ" /></button>
          <button onClick={() => runMobileAction(onOpenVendorModal)}><span aria-hidden="true">◆</span><Dual en="Vendor reg" am="አቅራቢ ምዝገባ" /></button>
        </div>
        <div className="mobile-menu-footer">
          <div className="language" aria-label="Language selector">
            {(["both", "am", "en"] as const).map((option) => (
              <button key={option} className={language === option ? "active" : ""} onClick={() => onLanguageChange(option)}>
                {option === "both" ? "አማ + EN" : option.toUpperCase()}
              </button>
            ))}
          </div>
          <RoleBadge language={language} />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
