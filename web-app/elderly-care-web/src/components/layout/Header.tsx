import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import "./Header.css";

export default function Header() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <h2 className="app-logo">Chăm Sóc Người Cao Tuổi</h2>
      </div>

      <div className="header-right">
        {user && <NotificationBell />}
        {user && (
          <Link to="/app/profile" className="user-info-link">
            <div className="user-info">
              <span className="user-name">{t('welcome', { name: user.name })}</span>
              <span className="user-email">{user.email}</span>
            </div>
          </Link>
        )}
        <button onClick={handleLogout} className="logout-button">
          {t('logout')}
        </button>
      </div>
    </header>
  );
}
