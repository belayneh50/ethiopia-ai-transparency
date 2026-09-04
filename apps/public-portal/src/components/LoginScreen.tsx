import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { DEMO_ACCOUNTS } from '../auth/demoAccounts';
import type { Language } from '../types';
import { Dual } from './Dual';
import { PasswordField } from './PasswordField';

type LoginScreenProps = {
  language: Language;
  onLanguageChange: (lang: Language) => void;
};

export function LoginScreen({ language, onLanguageChange }: LoginScreenProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // On mount: focus the heading and reset the password visibility.
  useEffect(() => {
    headingRef.current?.focus();
    setResetKey((k) => k + 1);
  }, []);

  const showEn = language !== 'am';
  const showAm = language !== 'en';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }
    setSubmitting(true);
    const result = await login(email.trim(), password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      // Clear password on failed login; reset visibility to hidden.
      setPassword('');
      setResetKey((k) => k + 1);
    }
  };

  return (
    <main className={`login-screen lang-${language}`} id="login-top">
      <div className="login-card" role="region" aria-labelledby="login-heading">
        <p className="login-notice" role="note">
          <strong>
            <Dual
              en="Demonstration access only — not production authentication."
              am="የማሳያ መግቢያ ብቻ — የምርት ደረጃ ማረጋገጫ አይደለም።"
            />
          </strong>
          <br />
          <span className="login-notice-sub">
            <Dual
              en="This local demo does not protect real or confidential data. Anyone can open browser tools to change the role."
              am="ይህ የአካባቢ ማሳያ የእውነተኛ ወይም ሚስጥራዊ መረጃ አይጠብቅም። ማንኛውም ሰው የአሳሽ መሳሪያዎችን በመክፈት ሚናውን ሊቀይር ይችላል።"
            />
          </span>
        </p>

        <h1 id="login-heading" tabIndex={-1} ref={headingRef}>
          <span className="en-only">ግልጽ ግዥ · Ethiopia AI Transparency</span>
          <span className="am-only">ግልጽ ግዥ · Ethiopia AI Transparency</span>
        </h1>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="login-email">
            <Dual en="Email" am="ኢሜይል" />
          </label>
          <input
            id="login-email"
            type="text"
            autoComplete="username"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="e.g. admin.demo"
          />

          <label htmlFor="login-password">
            <Dual en="Password" am="የይለፍ ቃል" />
          </label>
          <PasswordField
            key={resetKey}
            id="login-password"
            value={password}
            onChange={(v) => {
              setPassword(v);
              setError('');
            }}
            language={language}
          />

          {error && (
            <p className="form-error" role="alert">
              <Dual en={error} am={errorAmharic(error)} />
            </p>
          )}

          <button type="submit" className="login-submit" disabled={submitting}>
            <Dual en={submitting ? 'Signing in…' : 'Sign in'} am={submitting ? 'በመግቢያ ላይ…' : 'ግባ'} />
          </button>
        </form>

        <details className="demo-accounts-help">
          <summary>
            <Dual en="Demo accounts (synthetic, not secret)" am="የማሳያ መለያዎች (ሰው ሰራሽ፣ ሚስጥር አይደሉም)" />
          </summary>
          <p className="demo-accounts-notice">
            <Dual
              en="Browser code can be inspected. Passwords are documented only to keep raw strings out of screenshots — this is not a security boundary."
              am="የአሳሽ ኮድ ሊመለከት ይችላል። የይለፍ ቃሎች ያለ ምንም ጥበቃ ከስክሪንሾች ለማስወገድ ብቻ ይዟሉ።"
            />
          </p>
          <ul>
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.username}>
                <code>{a.username}</code> — {a.displayName.en} ({a.backendUserRole}) — <code>{a.password}</code>
              </li>
            ))}
          </ul>
        </details>

        <div className="login-language" aria-label="Language selector">
          {(['both', 'am', 'en'] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={language === option ? 'active' : ''}
              onClick={() => onLanguageChange(option)}
            >
              {option === 'both' ? 'አማ + EN' : option.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

function errorAmharic(error: string): string {
  if (error === 'Invalid credentials') return 'ልክ ያልሆነ መለያ ወይም የይለፍ ቃል';
  if (error === 'Network error') return 'የአውታረ መረብ ስህተት';
  if (error === 'Login failed') return 'መግቢያ አልተሳካም';
  if (error === 'Email and password are required') return 'ኢሜይል እና የይለፍ ቃል ያስፈልጋሉ';
  return error;
}
