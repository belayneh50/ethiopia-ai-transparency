import { useAuth } from '../auth/AuthContext';
import { Dual } from './Dual';

export function LogoutButton() {
  const { logout } = useAuth();
  return (
    <button
      type="button"
      className="logout-button"
      onClick={logout}
      aria-label="Log out"
    >
      <Dual en="Log out" am="ውጣ" />
    </button>
  );
}
