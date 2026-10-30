import { useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { LoginRequest, OAuthLoginRequest } from '../../models/user.model';

interface LoginViewProps {
  isLoading: boolean;
  onLogin: (payload: LoginRequest) => Promise<boolean>;
  onOAuthLogin: (payload: OAuthLoginRequest) => Promise<boolean>;
  onRedirectAuth0Google: () => void;
  onNavigateRegister: () => void;
}

export function LoginView({
  isLoading,
  onLogin,
  onRedirectAuth0Google,
  onNavigateRegister,
}: LoginViewProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    await onLogin({ identifier, password });
  };

  return (
    <div className="minimal-auth-shell">
      <section className="clean-panel auth-card">
        <header className="clean-header">
          <h1 className="clean-title">Iniciar sesión</h1>
        </header>

        <form onSubmit={handleSubmit} className="clean-form" noValidate>
          <div className="field-block">
            <label htmlFor="login-identifier" className="field-label">
              Email o DNI
            </label>
            <div className="field-input-wrap">
              <input
                id="login-identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="nombre@correo.com o DNI"
                className="field-input"
                required
              />
            </div>
          </div>

          <div className="field-block">
            <label htmlFor="login-password" className="field-label">
              Contraseña
            </label>
            <div className="field-input-wrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="field-input"
                required
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label="Mostrar u ocultar contraseña"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-buttons">
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </button>

            <button
              type="button"
              className="btn-google-oauth"
              disabled={isLoading}
              onClick={onRedirectAuth0Google}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.8c-.2-.8-.4-1.8-.4-2.8s.2-2 .4-2.8L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.8z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3 0 5.5-1 7.3-2.7l-3.7-2.9c-1 .7-2.2 1.1-3.6 1.1-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 20.4 7.4 23 12 23z"
                />
              </svg>
              <span>Continuar con Google</span>
            </button>

            <button
              type="button"
              className="btn-ghost"
              onClick={onNavigateRegister}
            >
              Crear una cuenta
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
