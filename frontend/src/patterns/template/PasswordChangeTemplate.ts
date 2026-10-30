import type { ChangePasswordRequest, User } from '../../models/user.model';
import {
  AbstractAccountOperationTemplate,
  TemplateValidationError,
} from './AbstractAccountOperationTemplate';

/**
 * IMPLEMENTACIÓN CONCRETA DEL PATRÓN PLANTILLA: CAMBIO DE CONTRASEÑA (Frontend)
 *
 * Sincronizada con `com.concurso.usuario.pattern.template.PasswordChangeTemplate` del Backend:
 * 1. validateBusinessRules:
 *    - Verifica longitud mínima (6 caracteres) de la nueva contraseña.
 *    - Verifica coincidencia exacta entre `newPassword` y `confirmPassword`.
 *    - Verifica que la nueva contraseña no sea idéntica a la actual (si se ingresó clave actual).
 * 2. prepare: Prepara el DTO `ChangePasswordRequest`.
 * 3. processOperation: Envía `PUT /api/profile/change-password` con JWT Bearer al Backend.
 * 4. postProcess: Actualiza metadatos de sesión del usuario.
 */
export class PasswordChangeTemplate extends AbstractAccountOperationTemplate<
  ChangePasswordRequest,
  User
> {
  private readonly operationExecutor: (
    userId: string,
    prepared: ChangePasswordRequest
  ) => Promise<User>;
  private readonly onPostProcess?: (
    request: ChangePasswordRequest,
    result: User
  ) => void;

  constructor(options: {
    operationExecutor: (
      userId: string,
      prepared: ChangePasswordRequest
    ) => Promise<User>;
    onPostProcess?: (request: ChangePasswordRequest, result: User) => void;
  }) {
    super();
    this.operationExecutor = options.operationExecutor;
    this.onPostProcess = options.onPostProcess;
  }

  protected override validateBusinessRules(
    request: ChangePasswordRequest,
    userId?: string
  ): void {
    if (!userId) {
      throw new Error(
        'El identificador de usuario es obligatorio para cambiar la contraseña.'
      );
    }

    const errors: Record<string, string> = {};

    if (!request.newPassword || request.newPassword.length < 6) {
      errors.newPassword =
        'La nueva contraseña debe tener al menos 6 caracteres.';
    }

    if (request.newPassword !== request.confirmPassword) {
      errors.confirmPassword =
        'La nueva contraseña y su confirmación no coinciden.';
    }

    if (
      request.currentPassword &&
      request.newPassword &&
      request.currentPassword === request.newPassword
    ) {
      errors.newPassword =
        'La nueva contraseña no puede ser igual a la contraseña actual.';
    }

    if (Object.keys(errors).length > 0) {
      const firstMessage = Object.values(errors)[0];
      throw new TemplateValidationError(firstMessage, errors);
    }
  }

  protected override prepare(
    request: ChangePasswordRequest
  ): ChangePasswordRequest {
    return {
      currentPassword: request.currentPassword ?? '',
      newPassword: request.newPassword,
      confirmPassword: request.confirmPassword,
    };
  }

  protected override async processOperation(
    preparedRequest: ChangePasswordRequest,
    userId?: string
  ): Promise<User> {
    return this.operationExecutor(userId!, preparedRequest);
  }

  protected override postProcess(
    request: ChangePasswordRequest,
    result: User
  ): void {
    this.onPostProcess?.(request, result);
  }
}

