/** @type {import('tailwindcss').Config} */
module.exports = {
  // Preflight is disabled on purpose: this app's existing hand-rolled
  // styles.css (fonts, resets, Amharic stack) must keep winning. Tailwind is
  // used only for NEW components, so content is pinned to those files rather
  // than scanning legacy UI that could collide with utility class names.
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
    extend: {},
  },
  plugins: [],
};
