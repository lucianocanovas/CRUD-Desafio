import { useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type {
  RegisterRequest,
  SteampunkAvatarId,
} from '../../models/user.model';
import { SteampunkAvatarPicker } from '../ui/SteampunkAvatarPicker';

interface RegisterViewProps {
  isLoading: boolean;
  onRegister: (
    payload: RegisterRequest & { confirmPassword?: string }
  ) => Promise<{ ok: boolean; errors?: Record<string, string> }>;
  onNavigateLogin: () => void;
}

export function RegisterView({
  isLoading,
  onRegister,
  onNavigateLogin,
}: RegisterViewProps) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [direccion, setDireccion] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarId, setAvatarId] = useState<SteampunkAvatarId>('automaton');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleDniChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
    setDni(digitsOnly);
    if (errors.dni) {
      setErrors((prev) => ({ ...prev, dni: '' }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = await onRegister({
      nombre,
      apellido,
      dni,
      fechaNacimiento,
      direccion,
      email,
      password,
      confirmPassword,
      avatarId,
    });
    if (!result.ok && result.errors) {
      setErrors(result.errors);
    }
  };

  return (
    <section className="clean-panel register-panel">
      <header className="clean-header split">
        <h1 className="clean-title">Registro</h1>
        <button
          type="button"
          className="btn-ghost small"
          onClick={onNavigateLogin}
        >
          Ya tengo cuenta
        </button>
      </header>

      <form onSubmit={handleSubmit} className="clean-form" noValidate>
        <SteampunkAvatarPicker
          selectedId={avatarId}
          onSelect={setAvatarId}
          disabled={isLoading}
          compact
        />

        <div className="fields-grid">
          <div className="field-block">
            <label htmlFor="reg-nombre" className="field-label">
              Nombre
            </label>
            <div className={`field-input-wrap ${errors.nombre ? 'error' : ''}`}>
              <input
                id="reg-nombre"
                type="text"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  if (errors.nombre) setErrors((p) => ({ ...p, nombre: '' }));
                }}
                placeholder="Nombre"
                className="field-input"
              />
            </div>
            {errors.nombre && <span className="error-msg">{errors.nombre}</span>}
          </div>

          <div className="field-block">
            <label htmlFor="reg-apellido" className="field-label">
              Apellido
            </label>
            <div className={`field-input-wrap ${errors.apellido ? 'error' : ''}`}>
              <input
                id="reg-apellido"
                type="text"
                value={apellido}
                onChange={(e) => {
                  setApellido(e.target.value);
                  if (errors.apellido) setErrors((p) => ({ ...p, apellido: '' }));
                }}
                placeholder="Apellido"
                className="field-input"
              />
            </div>
            {errors.apellido && (
              <span className="error-msg">{errors.apellido}</span>
            )}
          </div>

          <div className="field-block">
            <label htmlFor="reg-dni" className="field-label">
              DNI
            </label>
            <div className={`field-input-wrap ${errors.dni ? 'error' : ''}`}>
              <input
                id="reg-dni"
                type="text"
                inputMode="numeric"
                value={dni}
                onChange={(e) => handleDniChange(e.target.value)}
                placeholder="Solo números"
                className="field-input mono"
              />
            </div>
            {errors.dni && <span className="error-msg">{errors.dni}</span>}
          </div>

          <div className="field-block">
            <label htmlFor="reg-fecha" className="field-label">
              Fecha de nacimiento
            </label>
            <div
              className={`field-input-wrap ${
                errors.fechaNacimiento ? 'error' : ''
              }`}
            >
              <input
                id="reg-fecha"
                type="date"
                value={fechaNacimiento}
                onChange={(e) => {
                  setFechaNacimiento(e.target.value);
                  if (errors.fechaNacimiento)
                    setErrors((p) => ({ ...p, fechaNacimiento: '' }));
                }}
                className="field-input"
              />
            </div>
            {errors.fechaNacimiento && (
              <span className="error-msg">{errors.fechaNacimiento}</span>
            )}
          </div>

          <div className="field-block">
            <label htmlFor="reg-direccion" className="field-label">
              Dirección
            </label>
            <div
              className={`field-input-wrap ${errors.direccion ? 'error' : ''}`}
            >
              <input
                id="reg-direccion"
                type="text"
                value={direccion}
                onChange={(e) => {
                  setDireccion(e.target.value);
                  if (errors.direccion)
                    setErrors((p) => ({ ...p, direccion: '' }));
                }}
                placeholder="Calle y número"
                className="field-input"
              />
            </div>
            {errors.direccion && (
              <span className="error-msg">{errors.direccion}</span>
            )}
          </div>

          <div className="field-block">
            <label htmlFor="reg-email" className="field-label">
              Email
            </label>
            <div className={`field-input-wrap ${errors.email ? 'error' : ''}`}>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: '' }));
                }}
                placeholder="nombre@correo.com"
                className="field-input"
              />
            </div>
            {errors.email && <span className="error-msg">{errors.email}</span>}
          </div>

          <div className="field-block">
            <label htmlFor="reg-password" className="field-label">
              Contraseña
            </label>
            <div
              className={`field-input-wrap ${errors.password ? 'error' : ''}`}
            >
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password)
                    setErrors((p) => ({ ...p, password: '' }));
                }}
                placeholder="Mínimo 6 caracteres"
                className="field-input"
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowPassword((p) => !p)}
                aria-label="Mostrar u ocultar contraseña"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <span className="error-msg">{errors.password}</span>
            )}
          </div>

          <div className="field-block">
            <label htmlFor="reg-confirm" className="field-label">
              Confirmar contraseña
            </label>
            <div
              className={`field-input-wrap ${
                errors.confirmPassword ? 'error' : ''
              }`}
            >
              <input
                id="reg-confirm"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword)
                    setErrors((p) => ({ ...p, confirmPassword: '' }));
                }}
                placeholder="Repetí la contraseña"
                className="field-input"
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowConfirm((p) => !p)}
                aria-label="Mostrar u ocultar confirmación"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="error-msg">{errors.confirmPassword}</span>
            )}
          </div>
        </div>

        <div className="form-footer">
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Registrando...' : 'Registrarse'}
          </button>
        </div>
      </form>
    </section>
  );
}
