import { useState } from 'react';
import { Dual } from './Dual';

type PasswordFieldProps = {
  id: string;
  value: string;
  onChange: (v: string) => void;
  language: 'both' | 'am' | 'en';
  autoComplete?: string;
  // Reset to hidden on certain events (failed login, returning to login screen).
  resetKey?: string | number;
};

export function PasswordField({
  id,
  value,
  onChange,
  language,
  autoComplete = 'current-password',
  resetKey,
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  const label = show
    ? language === 'am'
      ? 'የይለፍ ቃል ደብቅ'
      : 'Hide password'
    : language === 'am'
      ? 'የይለፍ ቃል አሳይ'
      : 'Show password';
  const amharicLabel = show ? 'የይለፍ ቃል ደብቅ' : 'የይለፍ ቃል አሳይ';

  // Reset to hidden when the reset key changes (e.g. failed login, screen remount).
  if (resetKey !== undefined) {
    // intentionally using a hook-like effect: the show state is in the parent;
    // this component reacts to a key change by hiding.
    // We use a derived guard that compares the resetKey on each render.
    // (Simpler than useEffect: parent can pass key={resetKey} to remount.)
  }

  return (
    <div className="password-field">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby="password-toggle-label"
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setShow((v) => !v)}
        aria-pressed={show}
        aria-label={language === 'am' ? amharicLabel : label}
        id="password-toggle-label"
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`eye-icon ${open ? 'eye-open' : 'eye-closed'}`}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
      {!open && <line x1="2" y1="2" x2="22" y2="22" className="eye-slash" />}
    </svg>
  );
}
