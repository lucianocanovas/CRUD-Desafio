package com.concurso.usuario.pattern.template;

import com.concurso.usuario.dto.request.ChangePasswordRequest;
import com.concurso.usuario.entity.AuthProvider;
import com.concurso.usuario.entity.Usuario;
import com.concurso.usuario.exception.BadRequestException;
import com.concurso.usuario.exception.ResourceNotFoundException;
import com.concurso.usuario.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * IMPLEMENTACIÓN CONCRETA DEL PATRÓN PLANTILLA: CAMBIO DE CONTRASEÑA
 * 
 * Implementa el algoritmo de cambio seguro de clave compatible tanto para cuentas locales
 * como para usuarios autenticados mediante Google u OAuth2:
 * 1. Validaciones:
 *    - Existencia del usuario.
 *    - Si es cuenta LOCAL: exige contraseña actual y verifica coincidencia con hash BCrypt.
 *    - Si es cuenta GOOGLE / OAUTH: permite establecer o cambiar la contraseña sin exigir
 *      la clave generada aleatoriamente en el auto-registro.
 *    - Coincidencia idéntica entre nueva contraseña y confirmación.
 *    - La nueva contraseña no puede ser igual a la anterior.
 * 2. Preparación/Saneamiento.
 * 3. Proceso: encriptación con BCrypt y persistencia.
 * 4. Post-proceso: auditoría de seguridad.
 */
@Component
public class PasswordChangeTemplate extends AbstractAccountOperationTemplate<ChangePasswordRequest, Void> {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public PasswordChangeTemplate(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    protected void validateBusinessRules(ChangePasswordRequest request, Long userId) {
        log.info("Patrón Plantilla - Paso 1: Validando reglas de cambio de contraseña para usuario ID: {}", userId);

        if (userId == null) {
            throw new BadRequestException("El identificador de usuario es obligatorio para cambiar la contraseña.");
        }

        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + userId));

        // 1. Validar que la nueva contraseña y su confirmación sean idénticas
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("La nueva contraseña y su confirmación no coinciden.");
        }

        boolean isOAuthUser = usuario.getAuthProvider() != null && usuario.getAuthProvider() != AuthProvider.LOCAL;
        boolean hasCurrentPassword = request.getCurrentPassword() != null && !request.getCurrentPassword().isBlank();

        // 2. Validación de contraseña actual según el tipo de cuenta
        if (!isOAuthUser) {
            // Usuario con cuenta local tradicional: la clave actual es estrictamente obligatoria
            if (!hasCurrentPassword) {
                throw new BadRequestException("Debe ingresar la contraseña actual para poder modificarla.");
            }
            if (!passwordEncoder.matches(request.getCurrentPassword(), usuario.getPassword())) {
                throw new BadRequestException("La contraseña actual ingresada es incorrecta.");
            }
        } else {
            // Usuario que inició sesión con Google o Auth0
            if (hasCurrentPassword && !passwordEncoder.matches(request.getCurrentPassword(), usuario.getPassword())) {
                throw new BadRequestException("La contraseña actual ingresada no coincide.");
            }
            log.info("Usuario con autenticación externa ({}) configurando contraseña propia.", usuario.getAuthProvider());
        }

        // 3. Validar que la nueva contraseña no sea igual a la actual
        if (passwordEncoder.matches(request.getNewPassword(), usuario.getPassword())) {
            throw new BadRequestException("La nueva contraseña no puede ser igual a la contraseña actual.");
        }
    }

    @Override
    protected void prepare(ChangePasswordRequest request, Long userId) {
        log.info("Patrón Plantilla - Paso 2: Preparando solicitud de cambio de clave");
    }

    @Override
    @Transactional
    protected Void processOperation(ChangePasswordRequest request, Long userId) {
        log.info("Patrón Plantilla - Paso 3: Hasheando nueva clave con BCrypt y actualizando entidad");

        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + userId));

        usuario.setPassword(passwordEncoder.encode(request.getNewPassword()));
        usuarioRepository.save(usuario);

        return null;
    }

    @Override
    protected void postProcess(ChangePasswordRequest request, Void result, Long userId) {
        log.info("Patrón Plantilla - Paso 4 (Auditoría): Contraseña modificada exitosamente para usuario ID: {}", userId);
    }
}
