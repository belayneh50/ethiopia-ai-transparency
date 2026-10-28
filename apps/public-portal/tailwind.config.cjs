/** @type {import('tailwindcss').Config} */
module.exports = {
  // Preflight is disabled on purpose: this app's existing hand-rolled
  // styles.css (fonts, resets, Amharic stack) must keep winning. Tailwind is
  // used only for NEW components, so content is pinned to those files rather
  // than scanning legacy UI that could collide with utility class names.
  darkMode: "class",
  content: [
    "./src/components/AuditDashboard.tsx",
    "./src/components/AuditResultView.tsx",
    "./src/components/FaydaVerificationModal.tsx",
    "./src/components/ModalShell.tsx",
    "./src/components/ThresholdSettingsModal.tsx",
    "./src/components/VendorRegistrationModal.tsx",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      // Semantic theme tokens backed by CSS variables defined in styles.css;
      // they flip automatically when <html class="dark"> is set, so components
      // write `bg-surface text-main` once and work in both themes.
      colors: {
        page: "var(--bg-page)",
        surface: "var(--surface)",
        "surface-alt": "var(--surface-alt)",
        "surface-warm": "var(--surface-warm)",
        main: "var(--text-main)",
        soft: "var(--text-soft)",
        faint: "var(--text-faint)",
        "line-soft": "var(--border-soft)",
        "line-strong": "var(--border-strong)",
        brand: "var(--green)",
        "brand-text": "var(--green-text)",
        accent: "var(--orange)",
        rust: "var(--c-rust)",
        purple: "var(--c-purple)",
        gold: "var(--c-gold)",
        "gold-border": "var(--gold-border)",
        "gold-text": "var(--gold-text)",
        success: "var(--c-success)",
        "success-soft": "var(--success-soft)",
        "success-line": "var(--success-line)",
        warning: "var(--c-warning)",
        "warning-soft": "var(--warning-soft)",
        "warning-line": "var(--warning-line)",
        danger: "var(--c-danger)",
        "danger-soft": "var(--danger-soft)",
        "danger-line": "var(--danger-line)",
      },
    },
  },
  plugins: [],
};
