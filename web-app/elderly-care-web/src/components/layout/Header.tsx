import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import { UserCheck, X } from "lucide-react";
import "./Header.css";

export default function Header() {
  const { user, logout, managedElderly, setManagedElderly } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleExitManaging = () => {
    setManagedElderly(null);
    navigate("/app/elderly");
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <img src="/CareLink.png" alt="CareLink" className="app-logo-img" />
        <h2 className="app-logo">CareLink</h2>
      </div>

      {managedElderly && (
        <div className="managing-banner">
          <UserCheck size={18} />
          <span>Đang thực hiện quản lý với <strong>{managedElderly.name}</strong></span>
          <button className="exit-managing-btn" onClick={handleExitManaging} title="Thoát quản lý">
            <X size={16} />
            Thoát
          </button>
        </div>
      )}

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
