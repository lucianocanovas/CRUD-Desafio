/**
 * PATRÓN DE DISEÑO COMPORTAMENTAL: TEMPLATE METHOD (Patrón Plantilla) - Capa Frontend
 *
 * Espeja la arquitectura del Backend (`com.concurso.usuario.pattern.template.AbstractAccountOperationTemplate`),
 * definiendo el esqueleto invariable del algoritmo para operaciones de cuenta en 4 pasos:
 *   1. validateBusinessRules(request, userId) -> Validaciones previas de dominio/UI
 *   2. prepare(request, userId)               -> Saneamiento y normalización de datos
 *   3. processOperation(prepared, userId)     -> Invocación a la capa de Servicios / API REST
 *   4. postProcess(prepared, result, userId)  -> Hook de sincronización de sesión y auditoría
 */

export class TemplateValidationError extends Error {
  public readonly errors: Record<string, string>;

  constructor(message: string, errors: Record<string, string>) {
    super(message);
    this.name = 'TemplateValidationError';
    this.errors = errors;
  }
}

export abstract class AbstractAccountOperationTemplate<TRequest, TResult> {
  /**
   * Método Plantilla (Template Method):
   * Orquesta los 4 pasos invariables del algoritmo sin permitir alterar el orden del flujo.
   */
  public async execute(request: TRequest, userId?: string): Promise<TResult> {
    // Paso 1: Validar reglas de negocio
    await this.validateBusinessRules(request, userId);

    // Paso 2: Preparar y normalizar el payload de entrada
    const preparedRequest = this.prepare(request, userId);

    // Paso 3: Ejecutar la operación principal contra el Servicio / API Backend
    const result = await this.processOperation(preparedRequest, userId);

    // Paso 4: Hook de post-procesamiento (almacenamiento de sesión, caché de avatar, etc.)
    await this.postProcess(preparedRequest, result, userId);

    return result;
  }

  /**
   * Paso 1 (Abstracto): Validación de reglas de negocio previas al envío.
   */
  protected abstract validateBusinessRules(
    request: TRequest,
    userId?: string
  ): Promise<void> | void;

  /**
   * Paso 2 (Hook con implementación base): Normalización y saneamiento de datos.
   */
  protected prepare(request: TRequest, userId?: string): TRequest {
    void userId;
    return request;
  }

  /**
   * Paso 3 (Abstracto): Lógica central de comunicación con el Backend o persistencia.
   */
  protected abstract processOperation(
    request: TRequest,
    userId?: string
  ): Promise<TResult>;

  /**
   * Paso 4 (Hook opcional): Acciones posteriores a la operación exitosa.
   */
  protected postProcess(
    request: TRequest,
    result: TResult,
    userId?: string
  ): Promise<void> | void {
    void request;
    void result;
    void userId;
  }
}
