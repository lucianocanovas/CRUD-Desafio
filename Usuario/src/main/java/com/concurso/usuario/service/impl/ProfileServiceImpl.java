package com.concurso.usuario.service.impl;

import com.concurso.usuario.dto.request.ChangePasswordRequest;
import com.concurso.usuario.dto.request.ProfileUpdateRequest;
import com.concurso.usuario.dto.response.DireccionResponse;
import com.concurso.usuario.dto.response.PersonaDTO;
import com.concurso.usuario.dto.response.ProfileResponse;
import com.concurso.usuario.entity.Persona;
import com.concurso.usuario.entity.Usuario;
import com.concurso.usuario.exception.ResourceNotFoundException;
import com.concurso.usuario.pattern.template.PasswordChangeTemplate;
import com.concurso.usuario.pattern.template.ProfileUpdateTemplate;
import com.concurso.usuario.repository.UsuarioRepository;
import com.concurso.usuario.service.DireccionService;
import com.concurso.usuario.service.ProfileService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileServiceImpl implements ProfileService {

    private final UsuarioRepository usuarioRepository;
    private final ProfileUpdateTemplate profileUpdateTemplate;
    private final PasswordChangeTemplate passwordChangeTemplate;
    private final DireccionService direccionService;

    public ProfileServiceImpl(UsuarioRepository usuarioRepository,
                              ProfileUpdateTemplate profileUpdateTemplate,
                              PasswordChangeTemplate passwordChangeTemplate,
                              DireccionService direccionService) {
        this.usuarioRepository = usuarioRepository;
        this.profileUpdateTemplate = profileUpdateTemplate;
        this.passwordChangeTemplate = passwordChangeTemplate;
        this.direccionService = direccionService;
    }

    @Override
    @Transactional(readOnly = true)
    public ProfileResponse getProfileByEmail(String email) {
        Usuario usuario = findByEmail(email);
        return mapToProfileResponse(usuario);
    }

    @Override
    public ProfileResponse updateProfile(Long userId, ProfileUpdateRequest request) {
        // Ejecución a través del PATRÓN PLANTILLA (Template Method Pattern)
        return profileUpdateTemplate.execute(request, userId);
    }

    @Override
    public void changePassword(Long userId, ChangePasswordRequest request) {
        // Ejecución a través del PATRÓN PLANTILLA (Template Method Pattern)
        passwordChangeTemplate.execute(request, userId);
    }

    @Override
    @Transactional
    public void deleteAccount(Long userId) {
        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + userId));
        usuarioRepository.delete(usuario);
    }

    @Override
    @Transactional(readOnly = true)
    public Usuario findByEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con email: " + email));
    }

    private ProfileResponse mapToProfileResponse(Usuario usuario) {
        Persona persona = usuario.getPersona();
        PersonaDTO personaDTO = null;
        if (persona != null) {
            DireccionResponse direccionResponse = null;
            if (persona.getDireccion() != null) {
                direccionResponse = direccionService.getById(persona.getDireccion().getId());
            }
            personaDTO = new PersonaDTO(
                    persona.getId(),
                    persona.getNombre(),
                    persona.getApellido(),
                    persona.getDni(),
                    persona.getFechaNacimiento(),
                    direccionResponse
            );
        }

        return new ProfileResponse(
                usuario.getId(),
                usuario.getEmail(),
                usuario.getAuthProvider().name(),
                usuario.getActivo(),
                personaDTO,
                usuario.getCreatedAt(),
                usuario.getUpdatedAt()
        );
    }
}
