import type { RegisterRequest, User } from '../../models/user.model';
import { validateUserFields } from '../../utils/validators';
import {
  AbstractAccountOperationTemplate,
  TemplateValidationError,
} from './AbstractAccountOperationTemplate';

export type RegisterInput = RegisterRequest & { confirmPassword?: string };

/**
 * IMPLEMENTACIÓN CONCRETA DEL PATRÓN PLANTILLA: REGISTRACIÓN DE USUARIO (Frontend)
 *
 * Sincronizada con `com.concurso.usuario.pattern.template.UserRegistrationTemplate` del Backend:
 * 1. validateBusinessRules: Valida formato de email, DNI (7 a 10 dígitos), fecha pasada y contraseña >= 6 caracteres.
 * 2. prepare: Normaliza strings (trim), email en minúsculas y avatarId por defecto ('automaton').
 * 3. processOperation: Envía `POST /api/auth/register` al Backend y obtiene el perfil completo (`Persona` + `Usuario`).
 * 4. postProcess: Registra auditoría en consola y persiste preferencias de sesión.
 */
export class UserRegistrationTemplate extends AbstractAccountOperationTemplate<
  RegisterInput,
  User
> {
  private readonly operationExecutor: (
    prepared: RegisterInput
  ) => Promise<User>;
  private readonly getExistingUsersForValidation?: () => Promise<User[]>;
  private readonly onPostProcess?: (
    request: RegisterInput,
    result: User
  ) => void;

  constructor(options: {
    operationExecutor: (prepared: RegisterInput) => Promise<User>;
    getExistingUsersForValidation?: () => Promise<User[]>;
    onPostProcess?: (request: RegisterInput, result: User) => void;
  }) {
    super();
    this.operationExecutor = options.operationExecutor;
    this.getExistingUsersForValidation = options.getExistingUsersForValidation;
    this.onPostProcess = options.onPostProcess;
  }

  protected override async validateBusinessRules(
    request: RegisterInput
  ): Promise<void> {
    const existingUsers = this.getExistingUsersForValidation
      ? await this.getExistingUsersForValidation()
      : [];

    const validation = validateUserFields(request, existingUsers, {
      requirePassword: true,
    });

    if (!validation.valid) {
      throw new TemplateValidationError(
        'Por favor corregí los errores en el formulario de registro.',
        validation.errors
      );
    }
  }

  protected override prepare(request: RegisterInput): RegisterInput {
    return {
      ...request,
      nombre: request.nombre.trim(),
      apellido: request.apellido.trim(),
      dni: request.dni.trim(),
      fechaNacimiento: request.fechaNacimiento,
      direccion: request.direccion.trim(),
      email: request.email.trim().toLowerCase(),
      password: request.password,
      avatarId: request.avatarId ?? 'automaton',
    };
  }

  protected override async processOperation(
    preparedRequest: RegisterInput
  ): Promise<User> {
    return this.operationExecutor(preparedRequest);
  }

  protected override postProcess(request: RegisterInput, result: User): void {
    this.onPostProcess?.(request, result);
  }
}

