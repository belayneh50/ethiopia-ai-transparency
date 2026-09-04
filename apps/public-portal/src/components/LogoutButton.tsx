import { useAuth } from '../auth/AuthContext';
import { useFayda } from '../FaydaContext';
import { Dual } from './Dual';

export function LogoutButton() {
  const { logout } = useAuth();
  const { clearVerification } = useFayda();
  return (
    <button
      type="button"
      className="logout-button"
      onClick={() => {
        // A fresh login must not inherit the previous user's verified identity.
        clearVerification();
        logout();
      }}
      aria-label="Log out"
    >
      <Dual en="Log out" am="ውጣ" />
    </button>
  );
}
