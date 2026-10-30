package com.concurso.usuario.pattern.template;

import com.concurso.usuario.dto.request.ProfileUpdateRequest;
import com.concurso.usuario.dto.response.PersonaDTO;
import com.concurso.usuario.dto.response.ProfileResponse;
import com.concurso.usuario.entity.Persona;
import com.concurso.usuario.entity.Usuario;
import com.concurso.usuario.exception.BadRequestException;
import com.concurso.usuario.exception.ResourceNotFoundException;
import com.concurso.usuario.repository.PersonaRepository;
import com.concurso.usuario.repository.UsuarioRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * IMPLEMENTACIÓN CONCRETA DEL PATRÓN PLANTILLA: ACTUALIZACIÓN DE PERFIL
 * 
 * Implementa el algoritmo de modificación de datos de perfil (Persona):
 * 1. Validaciones: verificar existencia de usuario, unicidad de DNI si cambia, fecha coherente.
 * 2. Preparación: normalización de strings.
 * 3. Proceso: actualización atómica de Persona y retorno del DTO.
 * 4. Post-proceso: auditoría de actualización.
 */
@Component
public class ProfileUpdateTemplate extends AbstractAccountOperationTemplate<ProfileUpdateRequest, ProfileResponse> {

    private final UsuarioRepository usuarioRepository;
    private final PersonaRepository personaRepository;

    public ProfileUpdateTemplate(UsuarioRepository usuarioRepository, PersonaRepository personaRepository) {
        this.usuarioRepository = usuarioRepository;
        this.personaRepository = personaRepository;
    }

    @Override
    protected void validateBusinessRules(ProfileUpdateRequest request, Long userId) {
        log.info("Patrón Plantilla - Paso 1: Validando actualización de perfil para usuario ID: {}", userId);

        if (userId == null) {
            throw new BadRequestException("El identificador de usuario es obligatorio.");
        }

        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + userId));

        Persona personaActual = usuario.getPersona();

        // Si se modifica el DNI, comprobar que no esté en uso por otra persona
        if (!personaActual.getDni().equalsIgnoreCase(request.getDni().trim())) {
            personaRepository.findByDni(request.getDni().trim()).ifPresent(otraPersona -> {
                if (!otraPersona.getId().equals(personaActual.getId())) {
                    throw new BadRequestException("El nuevo DNI '" + request.getDni() + "' ya pertenece a otro registro.");
                }
            });
        }

        // Si se modifica el email, comprobar que no esté en uso por otro usuario
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String nuevoEmail = request.getEmail().trim().toLowerCase();
            if (!usuario.getEmail().equalsIgnoreCase(nuevoEmail)) {
                usuarioRepository.findByEmail(nuevoEmail).ifPresent(otroUsuario -> {
                    if (!otroUsuario.getId().equals(usuario.getId())) {
                        throw new BadRequestException("El email '" + nuevoEmail + "' ya se encuentra registrado.");
                    }
                });
            }
        }

        if (request.getFechaNacimiento().isAfter(LocalDate.now())) {
            throw new BadRequestException("La fecha de nacimiento no puede ser una fecha futura.");
        }
    }

    @Override
    protected void prepare(ProfileUpdateRequest request, Long userId) {
        log.info("Patrón Plantilla - Paso 2: Normalizando datos de actualización");
        request.setNombre(request.getNombre().trim());
        request.setApellido(request.getApellido().trim());
        request.setDni(request.getDni().trim());
        request.setDireccion(request.getDireccion().trim());
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            request.setEmail(request.getEmail().trim().toLowerCase());
        }
        if (request.getAvatarId() != null && !request.getAvatarId().isBlank()) {
            request.setAvatarId(request.getAvatarId().trim());
        }
    }

    @Override
    @Transactional
    protected ProfileResponse processOperation(ProfileUpdateRequest request, Long userId) {
        log.info("Patrón Plantilla - Paso 3: Actualizando campos de Persona y persistiendo");

        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + userId));

        Persona persona = usuario.getPersona();
        persona.setNombre(request.getNombre());
        persona.setApellido(request.getApellido());
        persona.setDni(request.getDni());
        persona.setFechaNacimiento(request.getFechaNacimiento());
        persona.setDireccion(request.getDireccion());
        if (request.getAvatarId() != null && !request.getAvatarId().isBlank()) {
            persona.setAvatarId(request.getAvatarId());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            usuario.setEmail(request.getEmail());
        }

        personaRepository.save(persona);
        Usuario usuarioActualizado = usuarioRepository.save(usuario);

        PersonaDTO personaDTO = new PersonaDTO(
                persona.getId(),
                persona.getNombre(),
                persona.getApellido(),
                persona.getDni(),
                persona.getFechaNacimiento(),
                persona.getDireccion(),
                persona.getAvatarId()
        );

        return new ProfileResponse(
                usuarioActualizado.getId(),
                usuarioActualizado.getEmail(),
                usuarioActualizado.getRol().name(),
                usuarioActualizado.getAuthProvider().name(),
                usuarioActualizado.getActivo(),
                personaDTO,
                usuarioActualizado.getCreatedAt(),
                usuarioActualizado.getUpdatedAt()
        );
    }

    @Override
    protected void postProcess(ProfileUpdateRequest request, ProfileResponse result, Long userId) {
        log.info("Patrón Plantilla - Paso 4 (Auditoría): Perfil actualizado con éxito para usuario ID: {}", userId);
    }
}
