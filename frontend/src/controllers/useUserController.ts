import { useState, useEffect, useCallback } from 'react';
import { extractFieldErrorsFromApiError } from '../api/apiClient';
import {
  consumeOAuthCallbackIfPresent,
  startGoogleOAuthRedirect,
} from '../api/oauthClient';
import type {
  ChangePasswordRequest,
  LoginRequest,
  OAuthLoginRequest,
  RegisterRequest,
  SteampunkAvatarId,
  UpdateProfileRequest,
  User,
} from '../models/user.model';
import { TemplateValidationError } from '../patterns/template/AbstractAccountOperationTemplate';
import { userService } from '../services/userService';

export type AppSection = 'login' | 'register' | 'profile';

export interface NotificationBanner {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

/**
 * CAPA CONTROLADOR (MVC - Controller Layer)
 *
 * Orquesta la interacción entre la Vista (`LoginView`, `RegisterView`, `ProfileView`)
 * y la Capa de Servicios / Patrón Plantilla (`userService`, `*Template`),
 * gestionando el estado de sesión JWT, OAuth2 PKCE con Google, notificaciones y validaciones.
 */
export function useUserController() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState<AppSection>('login');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(true);
  const [steamBurst, setSteamBurst] = useState<number>(0);
  const [notification, setNotification] = useState<NotificationBanner | null>(
    null
  );

  const triggerSteamBurst = useCallback(() => {
    setSteamBurst((prev) => prev + 1);
  }, []);

  const notify = useCallback(
    (type: NotificationBanner['type'], message: string) => {
      setNotification({
        id: Date.now().toString(),
        type,
        message,
      });
    },
    []
  );

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);

        // 1. Verificar si venimos del callback de Google OAuth 2.0 (Authorization Code + PKCE)
        const oauthPayload = await consumeOAuthCallbackIfPresent();
        if (oauthPayload) {
          const oauthUser = await userService.oauthLogin(oauthPayload);
          if (!mounted) return;
          setIsBackendOnline(userService.isBackendOnline());
          setCurrentUser(oauthUser);
          setActiveSection('profile');
          notify(
            'success',
            `Sesión iniciada con Google (${oauthUser.email}).`
          );
          return;
        }

        // 2. Verificar sesión JWT existente
        const [, sessionUser] = await Promise.all([
          userService.checkBackendHealth(),
          userService.getSessionUser(),
        ]);
        if (!mounted) return;
        setIsBackendOnline(userService.isBackendOnline());
        if (sessionUser) {
          setCurrentUser(sessionUser);
          setActiveSection('profile');
        } else {
          setActiveSection('login');
        }
      } catch (err) {
        if (mounted) {
          notify(
            'error',
            err instanceof Error
              ? err.message
              : 'Error al verificar la sesión activa.'
          );
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [notify]);

  const handleLogin = useCallback(
    async (payload: LoginRequest): Promise<boolean> => {
      try {
        setIsLoading(true);
        triggerSteamBurst();
        const loggedUser = await userService.login(payload);
        setIsBackendOnline(userService.isBackendOnline());
        setCurrentUser(loggedUser);
        setActiveSection('profile');
        notify(
          'success',
          `Sesión iniciada como ${loggedUser.nombre} ${loggedUser.apellido}.`
        );
        return true;
      } catch (err) {
        setIsBackendOnline(userService.isBackendOnline());
        notify(
          'error',
          err instanceof Error ? err.message : 'Error al iniciar sesión.'
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [notify, triggerSteamBurst]
  );

  const handleOAuthLogin = useCallback(
    async (payload: OAuthLoginRequest): Promise<boolean> => {
      try {
        setIsLoading(true);
        triggerSteamBurst();
        const loggedUser = await userService.oauthLogin(payload);
        setIsBackendOnline(userService.isBackendOnline());
        setCurrentUser(loggedUser);
        setActiveSection('profile');
        notify(
          'success',
          `Sesión iniciada con Google (${loggedUser.email}).`
        );
        return true;
      } catch (err) {
        setIsBackendOnline(userService.isBackendOnline());
        notify(
          'error',
          err instanceof Error
            ? err.message
            : 'Error al iniciar sesión con Google.'
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [notify, triggerSteamBurst]
  );

  const handleRedirectAuth0Google = useCallback(() => {
    try {
      triggerSteamBurst();
      startGoogleOAuthRedirect(
        (payload) => {
          void handleOAuthLogin(payload);
        },
        (errorMsg) => {
          setIsLoading(false);
          notify('error', errorMsg);
        }
      );
    } catch (err) {
      setIsLoading(false);
      notify(
        'error',
        err instanceof Error
          ? err.message
          : 'No se pudo iniciar la redirección a Google OAuth.'
      );
    }
  }, [handleOAuthLogin, notify, triggerSteamBurst]);

  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    triggerSteamBurst();
    await userService.logout();
    setCurrentUser(null);
    setActiveSection('login');
    setIsLoading(false);
    notify('info', 'Sesión cerrada.');
  }, [notify, triggerSteamBurst]);

  const handleRegister = useCallback(
    async (
      payload: RegisterRequest & { confirmPassword?: string }
    ): Promise<{ ok: boolean; errors?: Record<string, string> }> => {
      try {
        setIsLoading(true);
        triggerSteamBurst();
        // Ejecuta el Patrón Plantilla (UserRegistrationTemplate) en Frontend + Backend
        const created = await userService.register(payload);
        setIsBackendOnline(userService.isBackendOnline());
        setCurrentUser(created);
        setActiveSection('profile');
        notify('success', 'Cuenta creada correctamente.');
        return { ok: true };
      } catch (err) {
        setIsBackendOnline(userService.isBackendOnline());
        if (err instanceof TemplateValidationError) {
          return { ok: false, errors: err.errors };
        }
        const backendFieldErrors = extractFieldErrorsFromApiError(err);
        notify(
          'error',
          err instanceof Error ? err.message : 'Error al registrar usuario.'
        );
        return { ok: false, errors: backendFieldErrors };
      } finally {
        setIsLoading(false);
      }
    },
    [notify, triggerSteamBurst]
  );

  const handleUpdateProfile = useCallback(
    async (
      userId: string,
      payload: UpdateProfileRequest
    ): Promise<{ ok: boolean; errors?: Record<string, string> }> => {
      try {
        setIsLoading(true);
        triggerSteamBurst();
        // Ejecuta el Patrón Plantilla (ProfileUpdateTemplate) en Frontend + Backend
        const updated = await userService.updateProfile(userId, payload);
        setIsBackendOnline(userService.isBackendOnline());
        setCurrentUser(updated);
        notify('success', 'Datos del perfil actualizados exitosamente.');
        return { ok: true };
      } catch (err) {
        setIsBackendOnline(userService.isBackendOnline());
        if (err instanceof TemplateValidationError) {
          return { ok: false, errors: err.errors };
        }
        const backendFieldErrors = extractFieldErrorsFromApiError(err);
        notify(
          'error',
          err instanceof Error ? err.message : 'Error al guardar cambios.'
        );
        return { ok: false, errors: backendFieldErrors };
      } finally {
        setIsLoading(false);
      }
    },
    [notify, triggerSteamBurst]
  );

  const handleUpdateAvatar = useCallback(
    async (userId: string, avatarId: SteampunkAvatarId): Promise<boolean> => {
      try {
        setIsLoading(true);
        triggerSteamBurst();
        const updated = await userService.updateAvatar(
          userId,
          avatarId,
          currentUser
        );
        setIsBackendOnline(userService.isBackendOnline());
        setCurrentUser(updated);
        notify('success', 'Avatar actualizado.');
        return true;
      } catch (err) {
        setIsBackendOnline(userService.isBackendOnline());
        notify(
          'error',
          err instanceof Error ? err.message : 'Error al actualizar el avatar.'
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser, notify, triggerSteamBurst]
  );

  const handleChangePassword = useCallback(
    async (
      userId: string,
      payload: ChangePasswordRequest
    ): Promise<boolean> => {
      try {
        setIsLoading(true);
        triggerSteamBurst();
        // Ejecuta el Patrón Plantilla (PasswordChangeTemplate) en Frontend + Backend
        const updated = await userService.changePassword(userId, payload);
        setIsBackendOnline(userService.isBackendOnline());
        setCurrentUser(updated);
        notify('success', 'Contraseña actualizada exitosamente.');
        return true;
      } catch (err) {
        setIsBackendOnline(userService.isBackendOnline());
        notify(
          'error',
          err instanceof Error
            ? err.message
            : 'Error al actualizar la contraseña.'
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [notify, triggerSteamBurst]
  );

  const handleDeleteUser = useCallback(
    async (userId: string) => {
      try {
        setIsLoading(true);
        triggerSteamBurst();
        await userService.deleteUser(userId);
        setIsBackendOnline(userService.isBackendOnline());
        setCurrentUser(null);
        setActiveSection('login');
        notify('info', 'Cuenta eliminada exitosamente.');
      } catch (err) {
        setIsBackendOnline(userService.isBackendOnline());
        notify(
          'error',
          err instanceof Error ? err.message : 'Error al eliminar la cuenta.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [notify, triggerSteamBurst]
  );

  return {
    currentUser,
    activeSection,
    setActiveSection,
    isLoading,
    isBackendOnline,
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
  };
}
