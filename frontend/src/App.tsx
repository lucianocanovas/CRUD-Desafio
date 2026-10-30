import { X } from 'lucide-react';
import { SteampunkAvatar3D } from './components/three/SteampunkAvatar3D';
import { SteampunkBackground } from './components/three/SteampunkBackground';
import { LoginView } from './components/views/LoginView';
import { ProfileView } from './components/views/ProfileView';
import { RegisterView } from './components/views/RegisterView';
import { useUserController } from './controllers/useUserController';
import './App.css';

export function App() {
  const {
    currentUser,
    activeSection,
    setActiveSection,
    isLoading,
    steamBurst,
    triggerSteamBurst,
    notification,
    clearNotification,
    handleLogin,
    handleOAuthLogin,
    handleRedirectAuth0Google,
    handleLogout,
    handleRegister,
    handleUpdateProfile,
    handleUpdateAvatar,
    handleChangePassword,
    handleDeleteUser,
  } = useUserController();

  return (
    <div className="app-shell">
      <SteampunkBackground
        activeSection={currentUser ? 'profile' : activeSection}
        steamBurst={steamBurst}
        onTriggerBoost={triggerSteamBurst}
      />

      <div className="vignette-layer" aria-hidden="true" />

      <header className="minimal-topbar">
        <div className="topbar-inner">
          <div className="topbar-left">
            <nav className="minimal-nav" aria-label="Navegación principal">
              {!currentUser ? (
                <>
                  <button
                    type="button"
                    className={`nav-link ${
                      activeSection === 'login' ? 'active' : ''
                    }`}
                    onClick={() => setActiveSection('login')}
                  >
                    Iniciar sesión
                  </button>

                  <button
                    type="button"
                    className={`nav-link ${
                      activeSection === 'register' ? 'active' : ''
                    }`}
                    onClick={() => setActiveSection('register')}
                  >
                    Registro
                  </button>
                </>
              ) : (
                <span className="nav-link active nav-user-chip">
                  <SteampunkAvatar3D
                    avatarId={currentUser.avatarId}
                    size="xs"
                    interactive={false}
                  />
                  <span>
                    Mi perfil ({currentUser.nombre} {currentUser.apellido})
                  </span>
                </span>
              )}
            </nav>
          </div>

          <div className="topbar-right">
            {currentUser && (
              <button
                type="button"
                className="topbar-logout"
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            )}
          </div>
        </div>
      </header>

      {notification && (
        <div className={`toast-notice ${notification.type}`} role="status">
          <span>{notification.message}</span>
          <button
            type="button"
            className="toast-close"
            onClick={clearNotification}
            aria-label="Cerrar notificación"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <main className="main-stage">
        {currentUser ? (
          <ProfileView
            key={currentUser.id}
            user={currentUser}
            isLoading={isLoading}
            onUpdateProfile={handleUpdateProfile}
            onUpdateAvatar={handleUpdateAvatar}
            onChangePassword={handleChangePassword}
            onDeleteAccount={handleDeleteUser}
            onLogout={handleLogout}
          />
        ) : activeSection === 'register' ? (
          <RegisterView
            isLoading={isLoading}
            onRegister={handleRegister}
            onNavigateLogin={() => setActiveSection('login')}
          />
        ) : (
          <LoginView
            isLoading={isLoading}
            onLogin={handleLogin}
            onOAuthLogin={handleOAuthLogin}
            onRedirectAuth0Google={handleRedirectAuth0Google}
            onNavigateRegister={() => setActiveSection('register')}
          />
        )}
      </main>
    </div>
  );
}

export default App;
