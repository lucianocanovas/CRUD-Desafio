package com.concurso.usuario.service.impl;

import com.concurso.usuario.dto.request.ChangePasswordRequest;
import com.concurso.usuario.dto.request.ProfileUpdateRequest;
import com.concurso.usuario.dto.response.PersonaDTO;
import com.concurso.usuario.dto.response.ProfileResponse;
import com.concurso.usuario.entity.Persona;
import com.concurso.usuario.entity.Usuario;
import com.concurso.usuario.exception.ResourceNotFoundException;
import com.concurso.usuario.pattern.template.PasswordChangeTemplate;
import com.concurso.usuario.pattern.template.ProfileUpdateTemplate;
import com.concurso.usuario.repository.UsuarioRepository;
import com.concurso.usuario.service.ProfileService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProfileServiceImpl implements ProfileService {

    private final UsuarioRepository usuarioRepository;
    private final ProfileUpdateTemplate profileUpdateTemplate;
    private final PasswordChangeTemplate passwordChangeTemplate;

    public ProfileServiceImpl(UsuarioRepository usuarioRepository,
                              ProfileUpdateTemplate profileUpdateTemplate,
                              PasswordChangeTemplate passwordChangeTemplate) {
        this.usuarioRepository = usuarioRepository;
        this.profileUpdateTemplate = profileUpdateTemplate;
        this.passwordChangeTemplate = passwordChangeTemplate;
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
    public List<ProfileResponse> getAllProfiles() {
        return usuarioRepository.findAll().stream()
                .map(this::mapToProfileResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteUserById(Long id) {
        if (!usuarioRepository.existsById(id)) {
            throw new ResourceNotFoundException("Usuario no encontrado con ID: " + id);
        }
        usuarioRepository.deleteById(id);
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
            personaDTO = new PersonaDTO(
                    persona.getId(),
                    persona.getNombre(),
                    persona.getApellido(),
                    persona.getDni(),
                    persona.getFechaNacimiento(),
                    persona.getDireccion()
            );
        }

        return new ProfileResponse(
                usuario.getId(),
                usuario.getEmail(),
                usuario.getRol().name(),
                usuario.getAuthProvider().name(),
                usuario.getActivo(),
                personaDTO,
                usuario.getCreatedAt(),
                usuario.getUpdatedAt()
        );
    }
}
