import type { UpdateProfileRequest, User } from '../../models/user.model';
import { validateUserFields } from '../../utils/validators';
import {
  AbstractAccountOperationTemplate,
  TemplateValidationError,
} from './AbstractAccountOperationTemplate';

/**
 * IMPLEMENTACIÓN CONCRETA DEL PATRÓN PLANTILLA: ACTUALIZACIÓN DE PERFIL (Frontend)
 *
 * Sincronizada con `com.concurso.usuario.pattern.template.ProfileUpdateTemplate` del Backend:
 * 1. validateBusinessRules: Valida campos de la Persona (Nombre, Apellido, DNI, Fecha de Nacimiento, Dirección) y Email.
 * 2. prepare: Normaliza strings y email en minúsculas.
 * 3. processOperation: Envía `PUT /api/profile` con Token Bearer JWT hacia el Backend.
 * 4. postProcess: Sincroniza el avatar 3D y actualiza el usuario activo en sesión.
 */
export class ProfileUpdateTemplate extends AbstractAccountOperationTemplate<
  UpdateProfileRequest,
  User
> {
  private readonly operationExecutor: (
    userId: string,
    prepared: UpdateProfileRequest
  ) => Promise<User>;
  private readonly getExistingUsersForValidation?: () => Promise<User[]>;
  private readonly onPostProcess?: (
    request: UpdateProfileRequest,
    result: User
  ) => void;

  constructor(options: {
    operationExecutor: (
      userId: string,
      prepared: UpdateProfileRequest
    ) => Promise<User>;
    getExistingUsersForValidation?: () => Promise<User[]>;
    onPostProcess?: (request: UpdateProfileRequest, result: User) => void;
  }) {
    super();
    this.operationExecutor = options.operationExecutor;
    this.getExistingUsersForValidation = options.getExistingUsersForValidation;
    this.onPostProcess = options.onPostProcess;
  }

  protected override async validateBusinessRules(
    request: UpdateProfileRequest,
    userId?: string
  ): Promise<void> {
    if (!userId) {
      throw new Error('El identificador de usuario es obligatorio.');
    }

    const existingUsers = this.getExistingUsersForValidation
      ? await this.getExistingUsersForValidation()
      : [];

    const validation = validateUserFields(request, existingUsers, {
      requirePassword: false,
      excludeUserId: userId,
    });

    if (!validation.valid) {
      throw new TemplateValidationError(
        'Revisá los datos ingresados antes de guardar.',
        validation.errors
      );
    }
  }

  protected override prepare(
    request: UpdateProfileRequest
  ): UpdateProfileRequest {
    return {
      ...request,
      nombre: request.nombre.trim(),
      apellido: request.apellido.trim(),
      dni: request.dni.trim(),
      fechaNacimiento: request.fechaNacimiento,
      direccion: request.direccion.trim(),
      email: request.email.trim().toLowerCase(),
      avatarId: request.avatarId ?? 'automaton',
    };
  }

  protected override async processOperation(
    preparedRequest: UpdateProfileRequest,
    userId?: string
  ): Promise<User> {
    return this.operationExecutor(userId!, preparedRequest);
  }

  protected override postProcess(
    request: UpdateProfileRequest,
    result: User
  ): void {
    this.onPostProcess?.(request, result);
  }
}

