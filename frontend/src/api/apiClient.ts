import type { ApiResponse, ErrorResponseDTO } from '../models/user.model';

export const SPRING_BOOT_API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const TOKEN_STORAGE_KEY = 'token';

/**
 * Error estructurado que transporta los detalles devueltos por GlobalExceptionHandler
 * del Backend Spring Boot (status HTTP, mensaje de negocio y errores por campo).
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly validationErrors?: Record<string, string>;
  public readonly isNetworkError: boolean;

  constructor(
    message: string,
    status = 500,
    validationErrors?: Record<string, string>,
    isNetworkError = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.validationErrors = validationErrors;
    this.isNetworkError = isNetworkError;
  }
}

/**
 * Infiere errores por campo a partir de mensajes de negocio de BadRequestException del Backend
 * (por ejemplo, colisión de Email o DNI en UserRegistrationTemplate / ProfileUpdateTemplate).
 */
export function extractFieldErrorsFromApiError(
  err: unknown
): Record<string, string> | undefined {
  if (!(err instanceof ApiError)) return undefined;

  const fieldErrors: Record<string, string> = {
    ...(err.validationErrors ?? {}),
  };

  const lowerMsg = err.message.toLowerCase();
  if (lowerMsg.includes('dni') && !fieldErrors.dni) {
    fieldErrors.dni = err.message;
  }
  if (lowerMsg.includes('email') && !fieldErrors.email) {
    fieldErrors.email = err.message;
  }
  if (lowerMsg.includes('fecha de nacimiento') && !fieldErrors.fechaNacimiento) {
    fieldErrors.fechaNacimiento = err.message;
  }
  if (lowerMsg.includes('contraseña') && !fieldErrors.password) {
    fieldErrors.password = err.message;
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
}

export const tokenStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  },
  setToken(token: string): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  },
  clearToken(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  },
};

/**
 * Cliente HTTP centralizado con interceptor automático de JWT Bearer Token
 * para comunicación con el Backend Spring Boot.
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = tokenStorage.getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${SPRING_BOOT_API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor Backend (http://localhost:8080).',
      0,
      undefined,
      true
    );
  }

  const rawBody = await response.json().catch(() => null);

  if (!response.ok) {
    const errDto = rawBody as Partial<ErrorResponseDTO> | null;
    const message =
      errDto?.message ||
      errDto?.error ||
      `Error HTTP ${response.status} al comunicarse con el servidor.`;
    throw new ApiError(
      message,
      response.status,
      errDto?.validationErrors,
      false
    );
  }

  return rawBody as ApiResponse<T>;
}

export const apiClient = {
  get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return request<T>(endpoint, { method: 'GET' });
  },

  post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return request<T>(endpoint, { method: 'DELETE' });
  },
};

