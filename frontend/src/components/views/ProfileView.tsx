import { useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type {
  ChangePasswordRequest,
  SteampunkAvatarId,
  UpdateProfileRequest,
  User,
} from '../../models/user.model';
import { SteampunkAvatar3D } from '../three/SteampunkAvatar3D';
import { SteampunkAvatarPicker } from '../ui/SteampunkAvatarPicker';

interface ProfileViewProps {
  user: User;
  isLoading: boolean;
  onUpdateProfile: (
    userId: string,
    payload: UpdateProfileRequest
  ) => Promise<{ ok: boolean; errors?: Record<string, string> }>;
  onUpdateAvatar: (
    userId: string,
    avatarId: SteampunkAvatarId
  ) => Promise<boolean>;
  onChangePassword: (
    userId: string,
    payload: ChangePasswordRequest
  ) => Promise<boolean>;
  onDeleteAccount: (userId: string) => Promise<void>;
  onLogout: () => Promise<void>;
}

export function ProfileView({
  user,
  isLoading,
  onUpdateProfile,
  onUpdateAvatar,
  onChangePassword,
  onDeleteAccount,
  onLogout,
}: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPickingAvatar, setIsPickingAvatar] = useState(false);
  const [showCurrentPasswordReadout, setShowCurrentPasswordReadout] =
    useState(false);

  const [nombre, setNombre] = useState(user.nombre);
  const [apellido, setApellido] = useState(user.apellido);
  const [dni, setDni] = useState(user.dni);
  const [fechaNacimiento, setFechaNacimiento] = useState(user.fechaNacimiento);
  const [direccion, setDireccion] = useState(user.direccion);
  const [email, setEmail] = useState(user.email);
  const [avatarId, setAvatarId] = useState<SteampunkAvatarId>(user.avatarId);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleStartEdit = () => {
    setNombre(user.nombre);
    setApellido(user.apellido);
    setDni(user.dni);
    setFechaNacimiento(user.fechaNacimiento);
    setDireccion(user.direccion);
    setEmail(user.email);
    setAvatarId(user.avatarId);
    setProfileErrors({});
    setIsPickingAvatar(false);
    setIsEditing(true);
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileErrors({});
    const res = await onUpdateProfile(user.id, {
      nombre,
      apellido,
      dni,
      fechaNacimiento,
      direccion,
      email,
      avatarId,
    });
    if (res.ok) {
      setIsEditing(false);
    } else if (res.errors) {
      setProfileErrors(res.errors);
    }
  };

  const handleQuickAvatarSelect = async (newAvatarId: SteampunkAvatarId) => {
    setAvatarId(newAvatarId);
    if (newAvatarId !== user.avatarId) {
      await onUpdateAvatar(user.id, newAvatarId);
    }
  };

  const handleCancelEdit = () => {
    setProfileErrors({});
    setIsEditing(false);
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await onChangePassword(user.id, {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (ok) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const isOAuthUser = Boolean(
    user.authProvider && user.authProvider !== 'LOCAL'
  );

  return (
    <div className="profile-grid">
      {/* Datos del usuario */}
      <section className="clean-panel">
        <header className="clean-header split">
          <div className="user-identity-header">
            <button
              type="button"
              className="user-avatar-trigger"
              onClick={() => {
                if (!isEditing) setIsPickingAvatar((prev) => !prev);
              }}
              title="Cambiar avatar"
              aria-label="Cambiar avatar"
            >
              <SteampunkAvatar3D
                avatarId={isEditing ? avatarId : user.avatarId}
                size="md"
                interactive
              />
            </button>

            <div className="user-identity-text">
              <div className="user-title-row">
                <h1 className="clean-title">
                  {user.nombre} {user.apellido}
                </h1>
              </div>
            </div>
          </div>

          <div className="header-actions">
            {!isEditing && (
              <button
                type="button"
                className={`btn-ghost small ${isPickingAvatar ? 'active-btn' : ''}`}
                onClick={() => setIsPickingAvatar((prev) => !prev)}
              >
                {isPickingAvatar ? 'Cerrar' : 'Avatar'}
              </button>
            )}

            {!isEditing ? (
              <button
                type="button"
                className="btn-ghost small"
                onClick={handleStartEdit}
              >
                Editar datos
              </button>
            ) : (
              <button
                type="button"
                className="btn-ghost small"
                onClick={handleCancelEdit}
              >
                Cancelar
              </button>
            )}
          </div>
        </header>

        {!isEditing && isPickingAvatar && (
          <div className="profile-avatar-drawer">
            <SteampunkAvatarPicker
              selectedId={user.avatarId}
              onSelect={handleQuickAvatarSelect}
              disabled={isLoading}
            />
          </div>
        )}

        {!isEditing ? (
          <div className="data-list">
            <div className="data-row">
              <span className="data-key">Nombre</span>
              <span className="data-val">{user.nombre}</span>
            </div>
            <div className="data-row">
              <span className="data-key">Apellido</span>
              <span className="data-val">{user.apellido}</span>
            </div>
            <div className="data-row">
              <span className="data-key">DNI</span>
              <span className="data-val mono">{user.dni}</span>
            </div>
            <div className="data-row">
              <span className="data-key">Fecha de nacimiento</span>
              <span className="data-val">{user.fechaNacimiento}</span>
            </div>
            <div className="data-row">
              <span className="data-key">Dirección</span>
              <span className="data-val">{user.direccion}</span>
            </div>
            <div className="data-row">
              <span className="data-key">Email</span>
              <span className="data-val">{user.email}</span>
            </div>
            <div className="data-row">
              <span className="data-key">Contraseña</span>
              <div className="data-val-inline">
                <span className="mono">
                  {showCurrentPasswordReadout
                    ? user.password || '••••••••'
                    : '•'.repeat(Math.max((user.password || '').length, 8))}
                </span>
                <button
                  type="button"
                  className="eye-toggle-inline"
                  onClick={() => setShowCurrentPasswordReadout((p) => !p)}
                  aria-label="Mostrar u ocultar contraseña"
                >
                  {showCurrentPasswordReadout ? (
                    <EyeOff size={15} />
                  ) : (
                    <Eye size={15} />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="clean-form" noValidate>
            <SteampunkAvatarPicker
              selectedId={avatarId}
              onSelect={setAvatarId}
              disabled={isLoading}
              compact
            />

            <div className="fields-grid">
              <div className="field-block">
                <label htmlFor="edit-nombre" className="field-label">
                  Nombre
                </label>
                <div
                  className={`field-input-wrap ${
                    profileErrors.nombre ? 'error' : ''
                  }`}
                >
                  <input
                    id="edit-nombre"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="field-input"
                  />
                </div>
                {profileErrors.nombre && (
                  <span className="error-msg">{profileErrors.nombre}</span>
                )}
              </div>

              <div className="field-block">
                <label htmlFor="edit-apellido" className="field-label">
                  Apellido
                </label>
                <div
                  className={`field-input-wrap ${
                    profileErrors.apellido ? 'error' : ''
                  }`}
                >
                  <input
                    id="edit-apellido"
                    type="text"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    className="field-input"
                  />
                </div>
                {profileErrors.apellido && (
                  <span className="error-msg">{profileErrors.apellido}</span>
                )}
              </div>

              <div className="field-block">
                <label htmlFor="edit-dni" className="field-label">
                  DNI
                </label>
                <div
                  className={`field-input-wrap ${
                    profileErrors.dni ? 'error' : ''
                  }`}
                >
                  <input
                    id="edit-dni"
                    type="text"
                    inputMode="numeric"
                    value={dni}
                    onChange={(e) =>
                      setDni(e.target.value.replace(/\D/g, '').slice(0, 10))
                    }
                    className="field-input mono"
                  />
                </div>
                {profileErrors.dni && (
                  <span className="error-msg">{profileErrors.dni}</span>
                )}
              </div>

              <div className="field-block">
                <label htmlFor="edit-fecha" className="field-label">
                  Fecha de nacimiento
                </label>
                <div
                  className={`field-input-wrap ${
                    profileErrors.fechaNacimiento ? 'error' : ''
                  }`}
                >
                  <input
                    id="edit-fecha"
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="field-input"
                  />
                </div>
                {profileErrors.fechaNacimiento && (
                  <span className="error-msg">
                    {profileErrors.fechaNacimiento}
                  </span>
                )}
              </div>

              <div className="field-block">
                <label htmlFor="edit-direccion" className="field-label">
                  Dirección
                </label>
                <div
                  className={`field-input-wrap ${
                    profileErrors.direccion ? 'error' : ''
                  }`}
                >
                  <input
                    id="edit-direccion"
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="field-input"
                  />
                </div>
                {profileErrors.direccion && (
                  <span className="error-msg">{profileErrors.direccion}</span>
                )}
              </div>

              <div className="field-block">
                <label htmlFor="edit-email" className="field-label">
                  Email
                </label>
                <div
                  className={`field-input-wrap ${
                    profileErrors.email ? 'error' : ''
                  }`}
                >
                  <input
                    id="edit-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field-input"
                  />
                </div>
                {profileErrors.email && (
                  <span className="error-msg">{profileErrors.email}</span>
                )}
              </div>
            </div>

            <div className="form-row-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={handleCancelEdit}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <footer className="panel-bottom-bar">
          <button type="button" className="btn-ghost small" onClick={onLogout}>
            Cerrar sesión
          </button>

          {!confirmDelete ? (
            <button
              type="button"
              className="btn-danger-text"
              onClick={() => setConfirmDelete(true)}
            >
              Eliminar cuenta
            </button>
          ) : (
            <div className="confirm-delete-box">
              <span>¿Confirmar eliminación?</span>
              <button
                type="button"
                className="btn-danger-confirm"
                onClick={() => onDeleteAccount(user.id)}
              >
                Sí, eliminar
              </button>
              <button
                type="button"
                className="btn-ghost small"
                onClick={() => setConfirmDelete(false)}
              >
                No
              </button>
            </div>
          )}
        </footer>
      </section>

      {/* Cambiar contraseña */}
      <aside className="clean-panel">
        <header className="clean-header">
          <h2 className="clean-section-title">Cambiar contraseña</h2>
        </header>

        <form onSubmit={handlePasswordSubmit} className="clean-form">
          {!isOAuthUser && (
            <div className="field-block">
              <label htmlFor="pwd-current" className="field-label">
                Contraseña actual
              </label>
              <div className="field-input-wrap">
                <input
                  id="pwd-current"
                  type={showCurrentPwd ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="field-input"
                  required
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowCurrentPwd((p) => !p)}
                  aria-label="Mostrar u ocultar contraseña actual"
                >
                  {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          <div className="field-block">
            <label htmlFor="pwd-new" className="field-label">
              Nueva contraseña
            </label>
            <div className="field-input-wrap">
              <input
                id="pwd-new"
                type={showNewPwd ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="field-input"
                required
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowNewPwd((p) => !p)}
                aria-label="Mostrar u ocultar nueva contraseña"
              >
                {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="field-block">
            <label htmlFor="pwd-confirm" className="field-label">
              Confirmar nueva contraseña
            </label>
            <div className="field-input-wrap">
              <input
                id="pwd-confirm"
                type={showConfirmPwd ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetí la nueva contraseña"
                className="field-input"
                required
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowConfirmPwd((p) => !p)}
                aria-label="Mostrar u ocultar confirmación"
              >
                {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={
              isLoading || (!isOAuthUser && !currentPassword) || !newPassword
            }
          >
            Actualizar contraseña
          </button>
        </form>
      </aside>
    </div>
  );
}
