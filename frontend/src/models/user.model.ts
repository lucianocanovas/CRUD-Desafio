export type SteampunkAvatarId =
  | 'automaton'
  | 'aviator'
  | 'alchemist'
  | 'baron'
  | 'engineer'
  | 'diver';

export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN' | string;
export type AuthProviderType = 'LOCAL' | 'GOOGLE' | 'AUTH0' | string;

/**
 * Entidad de Dominio: Persona Física
 * Refleja la separación explícita Persona vs Usuario del Backend (relación @OneToOne).
 */
export interface Persona {
  id?: number | string;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string; // YYYY-MM-DD
  direccion: string;
  avatarId?: SteampunkAvatarId;
}

/**
 * Modelo de Dominio Unificado para las Vistas MVC del Frontend.
 * Contiene tanto la estructura anidada `persona` del Backend como los accesores directos.
 */
export interface User {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string; // YYYY-MM-DD
  direccion: string;
  email: string;
  password: string;
  avatarId: SteampunkAvatarId;
  rol?: UserRole;
  authProvider?: AuthProviderType;
  activo?: boolean;
  persona?: Persona;
  createdAt: string;
  updatedAt: string;
}

export type SafeUser = Omit<User, 'password'>;

/* ==========================================================================
   DTOs de Entrada (Requests hacia el Backend Spring Boot)
   ========================================================================== */

export interface LoginRequest {
  identifier: string; // Email o DNI
  email?: string;
  password: string;
}

export interface OAuthLoginRequest {
  email: string;
  nombre: string;
  apellido: string;
  dni?: string;
  fechaNacimiento?: string;
  direccion?: string;
  provider: 'GOOGLE' | 'AUTH0';
  providerId?: string;
}

export interface RegisterRequest {
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  direccion: string;
  email: string;
  password: string;
  avatarId?: SteampunkAvatarId;
}

export interface UpdateProfileRequest {
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  direccion: string;
  email: string;
  avatarId?: SteampunkAvatarId;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/* ==========================================================================
   DTOs de Salida (Responses desde el Backend Spring Boot)
   ========================================================================== */

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface ErrorResponseDTO {
  success: boolean;
  status: number;
  error: string;
  message: string;
  timestamp: string;
  validationErrors?: Record<string, string>;
}

export interface AuthResponseDTO {
  token: string | null;
  tokenType: string;
  id: number;
  email: string;
  rol: UserRole;
  nombre: string;
  apellido: string;
}

export interface PersonaDTO {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  direccion: string;
  avatarId?: SteampunkAvatarId;
}

export interface ProfileResponseDTO {
  id: number;
  email: string;
  rol: UserRole;
  authProvider: AuthProviderType;
  activo: boolean;
  persona: PersonaDTO;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}
