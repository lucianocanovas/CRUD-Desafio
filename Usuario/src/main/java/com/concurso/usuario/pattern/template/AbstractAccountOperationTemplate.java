package com.concurso.usuario.pattern.template;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * PATRÓN DE DISEÑO COMPORTAMENTAL: TEMPLATE METHOD (Patrón Plantilla)
 * 
 * Define el esqueleto del algoritmo de procesamiento para operaciones de cuenta/usuario,
 * delegando los pasos específicos a las subclases concretas sin modificar la estructura del proceso.
 *
 * @param <T> Tipo del Request de entrada
 * @param <R> Tipo del Resultado de salida
 */
public abstract class AbstractAccountOperationTemplate<T, R> {

    protected static final Logger log = LoggerFactory.getLogger(AbstractAccountOperationTemplate.class);

    /**
     * El Template Method principal. Define el flujo estructurado:
     *
     * Pasos del algoritmo:
     * 1. Validaciones de negocio (validateBusinessRules)
     * 2. Preparación o normalización de datos (prepare)
     * 3. Ejecución principal de la transacción (processOperation)
     * 4. Hook de post-procesamiento o auditoría (postProcess)
     */
    public R execute(T request, Long userId) {
        log.info("Iniciando ejecución de plantilla para operación: {}", getClass().getSimpleName());

        // 1. Validar reglas de negocio específicas
        validateBusinessRules(request, userId);

        // 2. Preparar/normalizar datos
        prepare(request, userId);

        // 3. Procesar la operación principal
        R result = processOperation(request, userId);

        // 4. Hook post-operación (auditoría, logs, etc.)
        postProcess(request, result, userId);

        log.info("Operación completada exitosamente por la plantilla: {}", getClass().getSimpleName());
        return result;
    }

    /**
     * Sobrecarga para operaciones donde el userId aún no existe (ej: registración).
     */
    public R execute(T request) {
        return execute(request, null);
    }

    /**
     * Paso abstracto obligatorio: Validaciones de reglas de negocio.
     */
    protected abstract void validateBusinessRules(T request, Long userId);

    /**
     * Paso de hook opcional: Normalización y saneamiento de datos previo a la ejecución.
     */
    protected void prepare(T request, Long userId) {
        // Implementación por defecto vacía (Hook)
    }

    /**
     * Paso abstracto obligatorio: Lógica nuclear de persistencia o modificación.
     */
    protected abstract R processOperation(T request, Long userId);

    /**
     * Paso de hook opcional: Acciones posteriores a la ejecución (ej: logging o métricas).
     */
    protected void postProcess(T request, R result, Long userId) {
        // Hook de auditoría
        log.info("Post-proceso ejecutado para usuario ID: {}", userId);
    }
}
