import { useAuth } from '../auth/AuthContext';
import { ROLE_LABELS } from '../auth/roles';
import { Dual } from './Dual';
import type { Language } from '../types';

type RoleBadgeProps = {
  language: Language;
};

export function RoleBadge({ language }: RoleBadgeProps) {
  const { role, user } = useAuth();
  if (!role || !user) return null;
  const labels = ROLE_LABELS[role];
  return (
    <span
      className="role-badge"
      aria-label={`Signed in as ${user.name} (${labels.en})`}
      title={user.email}
    >
      <Dual en={labels.en} am={labels.am} />
    </span>
  );
}
