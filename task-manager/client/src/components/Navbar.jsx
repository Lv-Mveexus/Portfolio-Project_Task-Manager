import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className={styles.nav}>
      <span className={styles.brand}>TaskFlow</span>
      <div className={styles.right}>
        <span className={styles.name}>{user?.name}</span>
        <button className={styles.logout} onClick={logout}>Sign out</button>
      </div>
    </header>
  );
}
