import {
  ApiError,
  SPRING_BOOT_API_URL,
  apiClient,
  tokenStorage,
} from '../api/apiClient';
import initialMockUsers from '../data/mockUsers.json';
import type {
  AuthResponseDTO,
  ChangePasswordRequest,
  LoginRequest,
  OAuthLoginRequest,
  ProfileResponseDTO,
  SteampunkAvatarId,
  UpdateProfileRequest,
  User,
} from '../models/user.model';
import { PasswordChangeTemplate } from '../patterns/template/PasswordChangeTemplate';
import { ProfileUpdateTemplate } from '../patterns/template/ProfileUpdateTemplate';
import {
  type RegisterInput,
  UserRegistrationTemplate,
} from '../patterns/template/UserRegistrationTemplate';

export { SPRING_BOOT_API_URL };
export const USE_MOCK_BACKEND = import.meta.env.VITE_USE_MOCK === 'true';

const STORAGE_USERS_KEY = 'crud_desafio_users_v3';
const STORAGE_SESSION_KEY = 'crud_desafio_active_user_v3';
const STORAGE_AVATAR_MAP_KEY = 'crud_desafio_avatars_v3';
const STORAGE_SESSION_PWD_KEY = 'crud_desafio_session_pwd_v3';

const FALLBACK_AVATARS: SteampunkAvatarId[] = [
  'automaton',
  'aviator',
  'baron',
  'engineer',
  'alchemist',
  'diver',
];

let backendOnlineState = !USE_MOCK_BACKEND;

function delay(ms = 180): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadAvatarMap(): Record<string, SteampunkAvatarId> {
  try {
    const raw = localStorage.getItem(STORAGE_AVATAR_MAP_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SteampunkAvatarId>) : {};
  } catch {
    return {};
  }
}

function saveAvatarPreference(
  userIdOrEmail: string | number,
  avatarId: SteampunkAvatarId
): void {
  const map = loadAvatarMap();
  map[String(userIdOrEmail).toLowerCase()] = avatarId;
  localStorage.setItem(STORAGE_AVATAR_MAP_KEY, JSON.stringify(map));
}

function getSavedAvatar(
  id?: string | number,
  email?: string,
  dtoAvatar?: SteampunkAvatarId
): SteampunkAvatarId {
  if (dtoAvatar && FALLBACK_AVATARS.includes(dtoAvatar)) {
    return dtoAvatar;
  }
  const map = loadAvatarMap();
  if (email && map[email.toLowerCase()]) {
    return map[email.toLowerCase()];
  }
  if (id !== undefined && map[String(id)]) {
    return map[String(id)];
  }
  const numId = Number(id);
  if (!Number.isNaN(numId) && numId > 0) {
    return FALLBACK_AVATARS[(numId - 1) % FALLBACK_AVATARS.length];
  }
  return 'automaton';
}

/**
 * Adaptador de Dominio (Mapper):
 * Transforma el DTO `ProfileResponseDTO` (con entidades separadas `Usuario` + `PersonaDTO`)
 * proveniente del Backend Spring Boot al modelo `User` consumido por la Vista MVC.
 */
export function mapProfileResponseToUser(
  profile: ProfileResponseDTO,
  sessionPassword?: string
): User {
  const persona = profile.persona ?? {
    id: profile.id,
    nombre: '',
    apellido: '',
    dni: '',
    fechaNacimiento: '',
    direccion: '',
  };

  const resolvedAvatar = getSavedAvatar(
    profile.id,
    profile.email,
    persona.avatarId
  );

  const storedSessionPwd =
    sessionPassword ??
    sessionStorage.getItem(STORAGE_SESSION_PWD_KEY) ??
    '•••••••• (BCrypt)';

  return {
    id: String(profile.id),
    nombre: persona.nombre,
    apellido: persona.apellido,
    dni: persona.dni,
    fechaNacimiento: persona.fechaNacimiento,
    direccion: persona.direccion,
    email: profile.email,
    password: storedSessionPwd,
    avatarId: resolvedAvatar,
    rol: profile.rol,
    authProvider: profile.authProvider,
    activo: profile.activo,
    persona: {
      id: persona.id,
      nombre: persona.nombre,
      apellido: persona.apellido,
      dni: persona.dni,
      fechaNacimiento: persona.fechaNacimiento,
      direccion: persona.direccion,
      avatarId: resolvedAvatar,
    },
    createdAt: profile.createdAt || new Date().toISOString(),
    updatedAt:
      profile.updatedAt || profile.createdAt || new Date().toISOString(),
  };
}

function normalizeUsers(users: User[]): User[] {
  return users.map((u, idx) => {
    const avatarId =
      u.avatarId || FALLBACK_AVATARS[idx % FALLBACK_AVATARS.length];
    return {
      ...u,
      avatarId,
      rol: u.rol || 'ROLE_USER',
      authProvider: u.authProvider || 'LOCAL',
      activo: u.activo ?? true,
      persona: u.persona ?? {
        id: u.id,
        nombre: u.nombre,
        apellido: u.apellido,
        dni: u.dni,
        fechaNacimiento: u.fechaNacimiento,
        direccion: u.direccion,
        avatarId,
      },
    };
  });
}

function loadUsersFromStorage(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) {
      const normalized = normalizeUsers(initialMockUsers as User[]);
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(normalized));
      return [...normalized];
    }
    const parsed = JSON.parse(raw) as User[];
    return normalizeUsers(parsed);
  } catch {
    return normalizeUsers([...(initialMockUsers as User[])]);
  }
}

function saveUsersToStorage(users: User[]): void {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

/* ==========================================================================
   INSTANCIAS DEL PATRÓN PLANTILLA (Template Method Pattern) EN CAPA SERVICIO
   ========================================================================== */

const registrationTemplate = new UserRegistrationTemplate({
  getExistingUsersForValidation: async () => {
    if (USE_MOCK_BACKEND || !backendOnlineState) {
      return loadUsersFromStorage();
    }
    // En modo Backend real, la unicidad de Email y DNI es validada en SQLite
    // por `com.concurso.usuario.pattern.template.UserRegistrationTemplate`
    return [];
  },
  operationExecutor: async (payload: RegisterInput): Promise<User> => {
    if (!USE_MOCK_BACKEND) {
      try {
        const regRes = await apiClient.post<AuthResponseDTO>('/auth/register', {
          email: payload.email,
          password: payload.password,
          nombre: payload.nombre,
          apellido: payload.apellido,
          dni: payload.dni,
          fechaNacimiento: payload.fechaNacimiento,
          direccion: payload.direccion,
          avatarId: payload.avatarId ?? 'automaton',
        });

        backendOnlineState = true;
        if (regRes.data?.token) {
          tokenStorage.setToken(regRes.data.token);
        }
        sessionStorage.setItem(STORAGE_SESSION_PWD_KEY, payload.password);
        if (payload.avatarId) {
          saveAvatarPreference(payload.email, payload.avatarId);
          if (regRes.data?.id) {
            saveAvatarPreference(regRes.data.id, payload.avatarId);
          }
        }

        const profileRes = await apiClient.get<ProfileResponseDTO>('/profile');
        const createdUser = mapProfileResponseToUser(
          profileRes.data,
          payload.password
        );
        localStorage.setItem(STORAGE_SESSION_KEY, createdUser.id);
        return createdUser;
      } catch (err) {
        if (!(err instanceof ApiError && err.isNetworkError)) {
          throw err;
        }
        backendOnlineState = false;
      }
    }

    // Fallback local si el servidor Backend no está levantado
    await delay(240);
    const users = loadUsersFromStorage();
    if (users.some((u) => u.email.toLowerCase() === payload.email)) {
      throw new ApiError(
        `El email '${payload.email}' ya se encuentra registrado.`,
        400,
        { email: 'Este email ya está registrado.' }
      );
    }
    if (users.some((u) => u.dni === payload.dni)) {
      throw new ApiError(
        `El DNI '${payload.dni}' ya se encuentra registrado en el sistema.`,
        400,
        { dni: 'Este DNI ya está registrado.' }
      );
    }

    const now = new Date().toISOString();
    const avatarId = payload.avatarId ?? 'automaton';
    const newUser: User = {
      id: `usr-${Date.now().toString(36)}`,
      nombre: payload.nombre,
      apellido: payload.apellido,
      dni: payload.dni,
      fechaNacimiento: payload.fechaNacimiento,
      direccion: payload.direccion,
      email: payload.email,
      password: payload.password,
      avatarId,
      rol: 'ROLE_USER',
      authProvider: 'LOCAL',
      activo: true,
      persona: {
        nombre: payload.nombre,
        apellido: payload.apellido,
        dni: payload.dni,
        fechaNacimiento: payload.fechaNacimiento,
        direccion: payload.direccion,
        avatarId,
      },
      createdAt: now,
      updatedAt: now,
    };

    saveUsersToStorage([newUser, ...users]);
    localStorage.setItem(STORAGE_SESSION_KEY, newUser.id);
    return newUser;
  },
  onPostProcess: (request, result) => {
    if (request.avatarId) {
      saveAvatarPreference(result.id, request.avatarId);
      saveAvatarPreference(result.email, request.avatarId);
    }
  },
});

const profileUpdateTemplate = new ProfileUpdateTemplate({
  getExistingUsersForValidation: async () => {
    if (USE_MOCK_BACKEND || !backendOnlineState) {
      return loadUsersFromStorage();
    }
    return [];
  },
  operationExecutor: async (
    userId: string,
    payload: UpdateProfileRequest
  ): Promise<User> => {
    if (!USE_MOCK_BACKEND) {
      try {
        if (payload.avatarId) {
          saveAvatarPreference(userId, payload.avatarId);
          saveAvatarPreference(payload.email, payload.avatarId);
        }

        const res = await apiClient.put<ProfileResponseDTO>('/profile', {
          nombre: payload.nombre,
          apellido: payload.apellido,
          dni: payload.dni,
          fechaNacimiento: payload.fechaNacimiento,
          direccion: payload.direccion,
          email: payload.email,
          avatarId: payload.avatarId,
        });

        backendOnlineState = true;
        return mapProfileResponseToUser(res.data);
      } catch (err) {
        if (!(err instanceof ApiError && err.isNetworkError)) {
          throw err;
        }
        backendOnlineState = false;
      }
    }

    await delay(200);
    const users = loadUsersFromStorage();
    const index = users.findIndex((u) => String(u.id) === String(userId));
    if (index === -1) {
      throw new Error('Usuario no encontrado.');
    }

    const avatarId = payload.avatarId ?? users[index].avatarId ?? 'automaton';
    const updatedUser: User = {
      ...users[index],
      nombre: payload.nombre,
      apellido: payload.apellido,
      dni: payload.dni,
      fechaNacimiento: payload.fechaNacimiento,
      direccion: payload.direccion,
      email: payload.email,
      avatarId,
      persona: {
        ...users[index].persona,
        nombre: payload.nombre,
        apellido: payload.apellido,
        dni: payload.dni,
        fechaNacimiento: payload.fechaNacimiento,
        direccion: payload.direccion,
        avatarId,
      },
      updatedAt: new Date().toISOString(),
    };

    users[index] = updatedUser;
    saveUsersToStorage(users);
    return updatedUser;
  },
  onPostProcess: (request, result) => {
    if (request.avatarId) {
      saveAvatarPreference(result.id, request.avatarId);
      saveAvatarPreference(result.email, request.avatarId);
    }
  },
});

const passwordChangeTemplate = new PasswordChangeTemplate({
  operationExecutor: async (
    userId: string,
    payload: ChangePasswordRequest
  ): Promise<User> => {
    if (!USE_MOCK_BACKEND) {
      try {
        await apiClient.put<void>('/profile/change-password', {
          currentPassword: payload.currentPassword,
          newPassword: payload.newPassword,
          confirmPassword: payload.confirmPassword,
        });

        backendOnlineState = true;
        sessionStorage.setItem(STORAGE_SESSION_PWD_KEY, payload.newPassword);
        const profileRes = await apiClient.get<ProfileResponseDTO>('/profile');
        return mapProfileResponseToUser(profileRes.data, payload.newPassword);
      } catch (err) {
        if (!(err instanceof ApiError && err.isNetworkError)) {
          throw err;
        }
        backendOnlineState = false;
      }
    }

    await delay(220);
    const users = loadUsersFromStorage();
    const index = users.findIndex((u) => String(u.id) === String(userId));
    if (index === -1) {
      throw new Error('Usuario no encontrado.');
    }

    const isOAuthUser =
      users[index].authProvider && users[index].authProvider !== 'LOCAL';
    if (!isOAuthUser && users[index].password !== payload.currentPassword) {
      throw new Error('La contraseña actual ingresada es incorrecta.');
    }

    const updatedUser: User = {
      ...users[index],
      password: payload.newPassword,
      updatedAt: new Date().toISOString(),
    };

    users[index] = updatedUser;
    saveUsersToStorage(users);
    return updatedUser;
  },
});

/* ==========================================================================
   SERVICIO PRINCIPAL DE USUARIOS, PERFIL Y AUTENTICACIÓN
   ========================================================================== */

export const userService = {
  isBackendOnline(): boolean {
    return backendOnlineState;
  },

  async checkBackendHealth(): Promise<boolean> {
    if (USE_MOCK_BACKEND) {
      backendOnlineState = false;
      return false;
    }
    try {
      const response = await fetch(`${SPRING_BOOT_API_URL}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      backendOnlineState = response.ok;
      return response.ok;
    } catch {
      backendOnlineState = false;
      return false;
    }
  },

  async getAllUsers(): Promise<User[]> {
    if (!USE_MOCK_BACKEND) {
      try {
        const res = await apiClient.get<ProfileResponseDTO[]>('/users');
        backendOnlineState = true;
        return (res.data ?? []).map((p) => mapProfileResponseToUser(p));
      } catch (err) {
        if (!(err instanceof ApiError && err.isNetworkError)) {
          throw err;
        }
        backendOnlineState = false;
      }
    }
    await delay(140);
    return loadUsersFromStorage();
  },

  async getSessionUser(): Promise<User | null> {
    if (!USE_MOCK_BACKEND) {
      const token = tokenStorage.getToken();
      if (token) {
        try {
          await apiClient.get<AuthResponseDTO>('/auth/check-token');
          const profileRes =
            await apiClient.get<ProfileResponseDTO>('/profile');
          backendOnlineState = true;
          const user = mapProfileResponseToUser(profileRes.data);
          localStorage.setItem(STORAGE_SESSION_KEY, user.id);
          return user;
        } catch (err) {
          if (err instanceof ApiError && !err.isNetworkError) {
            // Token expirado o inválido en el Backend
            tokenStorage.clearToken();
            localStorage.removeItem(STORAGE_SESSION_KEY);
            sessionStorage.removeItem(STORAGE_SESSION_PWD_KEY);
            return null;
          }
          backendOnlineState = false;
        }
      }
    }

    const activeId = localStorage.getItem(STORAGE_SESSION_KEY);
    if (!activeId) return null;
    const users = loadUsersFromStorage();
    return users.find((u) => String(u.id) === String(activeId)) ?? null;
  },

  async login(payload: LoginRequest): Promise<User> {
    const cleanIdentifier = (payload.identifier || payload.email || '').trim();

    if (!USE_MOCK_BACKEND) {
      try {
        const loginRes = await apiClient.post<AuthResponseDTO>('/auth/login', {
          email: cleanIdentifier,
          identifier: cleanIdentifier,
          password: payload.password,
        });

        backendOnlineState = true;
        if (loginRes.data?.token) {
          tokenStorage.setToken(loginRes.data.token);
        }
        sessionStorage.setItem(STORAGE_SESSION_PWD_KEY, payload.password);

        const profileRes = await apiClient.get<ProfileResponseDTO>('/profile');
        const loggedUser = mapProfileResponseToUser(
          profileRes.data,
          payload.password
        );
        localStorage.setItem(STORAGE_SESSION_KEY, loggedUser.id);
        return loggedUser;
      } catch (err) {
        if (!(err instanceof ApiError && err.isNetworkError)) {
          throw err;
        }
        backendOnlineState = false;
      }
    }

    await delay(220);
    const users = loadUsersFromStorage();
    const cleanId = cleanIdentifier.toLowerCase();
    const found = users.find(
      (u) => u.email.toLowerCase() === cleanId || u.dni.trim() === cleanId
    );

    if (!found || found.password !== payload.password) {
      throw new Error('Email/DNI o contraseña incorrectos.');
    }

    localStorage.setItem(STORAGE_SESSION_KEY, found.id);
    sessionStorage.setItem(STORAGE_SESSION_PWD_KEY, payload.password);
    return found;
  },

  async oauthLogin(payload: OAuthLoginRequest): Promise<User> {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const cleanPayload: OAuthLoginRequest = {
      ...payload,
      email: normalizedEmail,
      nombre: payload.nombre.trim() || 'Usuario',
      apellido: payload.apellido.trim() || 'Google',
      provider: payload.provider || 'GOOGLE',
      providerId: payload.providerId || `google-${Date.now()}`,
    };

    if (!USE_MOCK_BACKEND) {
      try {
        const res = await apiClient.post<AuthResponseDTO>(
          '/auth/oauth-login',
          cleanPayload
        );
        backendOnlineState = true;
        if (res.data?.token) {
          tokenStorage.setToken(res.data.token);
        }
        sessionStorage.removeItem(STORAGE_SESSION_PWD_KEY);
        const profileRes = await apiClient.get<ProfileResponseDTO>('/profile');
        const loggedUser = mapProfileResponseToUser(profileRes.data, '');
        localStorage.setItem(STORAGE_SESSION_KEY, loggedUser.id);
        return loggedUser;
      } catch (err) {
        if (!(err instanceof ApiError && err.isNetworkError)) {
          throw err;
        }
        backendOnlineState = false;
      }
    }

    await delay(220);
    const users = loadUsersFromStorage();
    let found = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!found) {
      const now = new Date().toISOString();
      const generatedDni =
        cleanPayload.dni?.trim() ||
        String(Date.now()).slice(-8);
      const fechaNacimiento = cleanPayload.fechaNacimiento || '2000-01-01';
      const direccion = cleanPayload.direccion?.trim() || 'Cuenta Google OAuth';

      found = {
        id: `usr-google-${Date.now().toString(36)}`,
        nombre: cleanPayload.nombre,
        apellido: cleanPayload.apellido,
        dni: generatedDni,
        fechaNacimiento,
        direccion,
        email: normalizedEmail,
        password: '',
        avatarId: 'aviator',
        rol: 'ROLE_USER',
        authProvider: 'GOOGLE',
        activo: true,
        persona: {
          nombre: cleanPayload.nombre,
          apellido: cleanPayload.apellido,
          dni: generatedDni,
          fechaNacimiento,
          direccion,
          avatarId: 'aviator',
        },
        createdAt: now,
        updatedAt: now,
      };
      saveUsersToStorage([found, ...users]);
    }

    localStorage.setItem(STORAGE_SESSION_KEY, found.id);
    sessionStorage.removeItem(STORAGE_SESSION_PWD_KEY);
    return found;
  },

  getAuth0GoogleRedirectUrl(): string {
    const domain = 'dev-1x6qm5adx348o8vd.us.auth0.com';
    const clientId = '7oT83TwUIejo9yjQtEoRjhYUhni4VhXq';
    const redirectUri = encodeURIComponent(window.location.origin);
    const audience = encodeURIComponent('https://block/');
    return `https://${domain}/authorize?response_type=token&client_id=${clientId}&connection=google-oauth2&redirect_uri=${redirectUri}&audience=${audience}&scope=openid%20profile%20email`;
  },

  async logout(): Promise<void> {
    await delay(100);
    tokenStorage.clearToken();
    localStorage.removeItem(STORAGE_SESSION_KEY);
    sessionStorage.removeItem(STORAGE_SESSION_PWD_KEY);
  },

  /**
   * Alta de Persona + Usuario ejecutando el Patrón Plantilla (UserRegistrationTemplate).
   */
  async register(payload: RegisterInput): Promise<User> {
    return registrationTemplate.execute(payload);
  },

  /**
   * Opción 1: Modificar datos de la Persona ejecutando el Patrón Plantilla (ProfileUpdateTemplate).
   */
  async updateProfile(
    userId: string,
    payload: UpdateProfileRequest
  ): Promise<User> {
    return profileUpdateTemplate.execute(payload, userId);
  },

  /**
   * Actualización rápida del personaje 3D Steampunk sincronizada con el Perfil.
   */
  async updateAvatar(
    userId: string,
    avatarId: SteampunkAvatarId,
    currentUser?: User | null
  ): Promise<User> {
    saveAvatarPreference(userId, avatarId);
    if (currentUser?.email) {
      saveAvatarPreference(currentUser.email, avatarId);
    }

    if (!USE_MOCK_BACKEND && currentUser) {
      try {
        const res = await apiClient.put<ProfileResponseDTO>('/profile', {
          nombre: currentUser.nombre,
          apellido: currentUser.apellido,
          dni: currentUser.dni,
          fechaNacimiento: currentUser.fechaNacimiento,
          direccion: currentUser.direccion,
          email: currentUser.email,
          avatarId,
        });
        backendOnlineState = true;
        return mapProfileResponseToUser(res.data);
      } catch (err) {
        if (!(err instanceof ApiError && err.isNetworkError)) {
          throw err;
        }
        backendOnlineState = false;
      }
    }

    await delay(150);
    const users = loadUsersFromStorage();
    const index = users.findIndex((u) => String(u.id) === String(userId));
    if (index === -1) {
      if (currentUser) {
        return {
          ...currentUser,
          avatarId,
          updatedAt: new Date().toISOString(),
        };
      }
      throw new Error('Usuario no encontrado.');
    }

    const updatedUser: User = {
      ...users[index],
      avatarId,
      persona: {
        ...users[index].persona,
        nombre: users[index].nombre,
        apellido: users[index].apellido,
        dni: users[index].dni,
        fechaNacimiento: users[index].fechaNacimiento,
        direccion: users[index].direccion,
        avatarId,
      },
      updatedAt: new Date().toISOString(),
    };

    users[index] = updatedUser;
    saveUsersToStorage(users);
    return updatedUser;
  },

  /**
   * Opción 2: Cambiar la contraseña ejecutando el Patrón Plantilla (PasswordChangeTemplate).
   */
  async changePassword(
    userId: string,
    payload: ChangePasswordRequest
  ): Promise<User> {
    return passwordChangeTemplate.execute(payload, userId);
  },

  /**
   * Baja de cuenta propia (`DELETE /api/profile`) o por ID (`DELETE /api/users/{id}`).
   */
  async deleteUser(userId: string): Promise<void> {
    if (!USE_MOCK_BACKEND) {
      try {
        await apiClient.delete<void>('/profile');
        backendOnlineState = true;
        tokenStorage.clearToken();
        localStorage.removeItem(STORAGE_SESSION_KEY);
        sessionStorage.removeItem(STORAGE_SESSION_PWD_KEY);
        return;
      } catch (err) {
        if (!(err instanceof ApiError && err.isNetworkError)) {
          throw err;
        }
        backendOnlineState = false;
      }
    }

    await delay(180);
    const users = loadUsersFromStorage().filter(
      (u) => String(u.id) !== String(userId)
    );
    saveUsersToStorage(users);
    const activeId = localStorage.getItem(STORAGE_SESSION_KEY);
    if (String(activeId) === String(userId)) {
      localStorage.removeItem(STORAGE_SESSION_KEY);
      tokenStorage.clearToken();
      sessionStorage.removeItem(STORAGE_SESSION_PWD_KEY);
    }
  },

  async resetMockData(): Promise<User[]> {
    await delay(150);
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(initialMockUsers));
    return [...(initialMockUsers as User[])];
  },
};
