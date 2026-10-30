package com.concurso.usuario.pattern.template;

import com.concurso.usuario.dto.request.RegisterRequest;
import com.concurso.usuario.dto.response.AuthResponse;
import com.concurso.usuario.entity.AuthProvider;
import com.concurso.usuario.entity.Persona;
import com.concurso.usuario.entity.Rol;
import com.concurso.usuario.entity.Usuario;
import com.concurso.usuario.exception.BadRequestException;
import com.concurso.usuario.repository.PersonaRepository;
import com.concurso.usuario.repository.UsuarioRepository;
import com.concurso.usuario.security.jwt.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * IMPLEMENTACIÓN CONCRETA DEL PATRÓN PLANTILLA: REGISTRACIÓN DE USUARIO
 * 
 * Implementa los pasos específicos del algoritmo para registrar una Persona y su Usuario correspondiente:
 * 1. Validaciones de negocio: unicidad de Email y DNI, coherencia de fecha de nacimiento.
 * 2. Preparación/Saneamiento: normalización de strings y formato de email.
 * 3. Proceso: construcción con Patrón Builder, hashing BCrypt, persistencia transaccional y generación de JWT.
 * 4. Post-proceso: auditoría de alta de cuenta.
 */
@Component
public class UserRegistrationTemplate extends AbstractAccountOperationTemplate<RegisterRequest, AuthResponse> {

    private final UsuarioRepository usuarioRepository;
    private final PersonaRepository personaRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public UserRegistrationTemplate(UsuarioRepository usuarioRepository,
                                  PersonaRepository personaRepository,
                                  PasswordEncoder passwordEncoder,
                                  JwtTokenProvider jwtTokenProvider) {
        this.usuarioRepository = usuarioRepository;
        this.personaRepository = personaRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    protected void validateBusinessRules(RegisterRequest request, Long userId) {
        log.info("Patrón Plantilla - Paso 1: Validando reglas de negocio para registración de: {}", request.getEmail());

        if (usuarioRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new BadRequestException("El email '" + request.getEmail() + "' ya se encuentra registrado.");
        }

        if (personaRepository.existsByDni(request.getDni().trim())) {
            throw new BadRequestException("El DNI '" + request.getDni() + "' ya se encuentra registrado en el sistema.");
        }

        if (request.getFechaNacimiento().isAfter(LocalDate.now())) {
            throw new BadRequestException("La fecha de nacimiento no puede ser una fecha futura.");
        }
    }

    @Override
    protected void prepare(RegisterRequest request, Long userId) {
        log.info("Patrón Plantilla - Paso 2: Normalizando datos de entrada");
        request.setEmail(request.getEmail().trim().toLowerCase());
        request.setNombre(request.getNombre().trim());
        request.setApellido(request.getApellido().trim());
        request.setDni(request.getDni().trim());
        request.setDireccion(request.getDireccion().trim());
    }

    @Override
    @Transactional
    protected AuthResponse processOperation(RegisterRequest request, Long userId) {
        log.info("Patrón Plantilla - Paso 3: Ejecutando persistencia y creación de entidades Persona y Usuario");

        // Separación explícita de Persona y Usuario requerida
        // Uso del patrón creacional Builder
        Persona persona = Persona.builder()
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .dni(request.getDni())
                .fechaNacimiento(request.getFechaNacimiento())
                .direccion(request.getDireccion())
                .build();

        Usuario usuario = Usuario.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .rol(Rol.ROLE_USER)
                .authProvider(AuthProvider.LOCAL)
                .activo(true)
                .persona(persona)
                .build();

        Usuario usuarioGuardado = usuarioRepository.save(usuario);

        String token = jwtTokenProvider.generateToken(
                usuarioGuardado.getEmail(),
                usuarioGuardado.getId(),
                usuarioGuardado.getRol().name()
        );

        return new AuthResponse(
                token,
                usuarioGuardado.getId(),
                usuarioGuardado.getEmail(),
                usuarioGuardado.getRol().name(),
                usuarioGuardado.getPersona().getNombre(),
                usuarioGuardado.getPersona().getApellido()
        );
    }

    @Override
    protected void postProcess(RegisterRequest request, AuthResponse result, Long userId) {
        log.info("Patrón Plantilla - Paso 4 (Auditoría): Usuario registrado exitosamente con ID: {} y Email: {}",
                result.getId(), result.getEmail());
    }
}
