package com.concurso.usuario.service.impl;

import com.concurso.usuario.dto.request.DireccionRequest;
import com.concurso.usuario.dto.request.LoginRequest;
import com.concurso.usuario.dto.request.OAuthLoginRequest;
import com.concurso.usuario.dto.request.RegisterRequest;
import com.concurso.usuario.dto.response.AuthResponse;
import com.concurso.usuario.entity.AuthProvider;
import com.concurso.usuario.entity.Direccion;
import com.concurso.usuario.entity.Persona;
import com.concurso.usuario.entity.Usuario;
import com.concurso.usuario.exception.UnauthorizedException;
import com.concurso.usuario.pattern.template.UserRegistrationTemplate;
import com.concurso.usuario.repository.UsuarioRepository;
import com.concurso.usuario.security.jwt.JwtTokenProvider;
import com.concurso.usuario.service.AuthService;
import com.concurso.usuario.service.DireccionService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final UserRegistrationTemplate userRegistrationTemplate;
    private final DireccionService direccionService;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           UsuarioRepository usuarioRepository,
                           JwtTokenProvider tokenProvider,
                           PasswordEncoder passwordEncoder,
                           UserRegistrationTemplate userRegistrationTemplate,
                           DireccionService direccionService) {
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
        this.tokenProvider = tokenProvider;
        this.passwordEncoder = passwordEncoder;
        this.userRegistrationTemplate = userRegistrationTemplate;
        this.direccionService = direccionService;
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        // Ejecución a través del PATRÓN PLANTILLA (Template Method Pattern)
        return userRegistrationTemplate.execute(request);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        // Autenticar credenciales con Spring Security AuthenticationManager
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        normalizedEmail,
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        Usuario usuario = usuarioRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UnauthorizedException("Usuario o contraseña incorrectos"));

        if (!usuario.getActivo()) {
            throw new UnauthorizedException("La cuenta de usuario está desactivada.");
        }

        String token = tokenProvider.generateToken(usuario.getEmail(), usuario.getId());

        return new AuthResponse(
                token,
                usuario.getId(),
                usuario.getEmail(),
                usuario.getPersona() != null ? usuario.getPersona().getNombre() : "",
                usuario.getPersona() != null ? usuario.getPersona().getApellido() : ""
        );
    }

    @Override
    @Transactional
    public AuthResponse oauthLogin(OAuthLoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        Usuario usuario = usuarioRepository.findByEmail(email).orElseGet(() -> {
            // Si el usuario no existe, se auto-registra con los datos provistos por OAuth (Google)
            String nombre = request.getNombre() != null ? request.getNombre().trim() : "Usuario";
            String apellido = request.getApellido() != null && !request.getApellido().isBlank()
                    ? request.getApellido().trim() : "Google";
            String dni = request.getDni() != null && !request.getDni().isBlank()
                    ? request.getDni().trim() : String.valueOf(System.currentTimeMillis()).substring(3, 11);
            LocalDate fechaNac = request.getFechaNacimiento() != null
                    ? request.getFechaNacimiento() : LocalDate.of(2000, 1, 1);
            String direccionTexto = request.getDireccion() != null && !request.getDireccion().isBlank()
                    ? request.getDireccion().trim() : "Sin especificar";

            Direccion direccion = direccionService.getOrCreateFromRequest(
                    new DireccionRequest(direccionTexto, "S/N", null, null, null),
                    null
            );

            Persona persona = Persona.builder()
                    .nombre(nombre)
                    .apellido(apellido)
                    .dni(dni)
                    .fechaNacimiento(fechaNac)
                    .direccion(direccion)
                    .build();

            Usuario nuevoUsuario = Usuario.builder()
                    .email(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .authProvider(AuthProvider.GOOGLE)
                    .activo(true)
                    .persona(persona)
                    .build();

            return usuarioRepository.save(nuevoUsuario);
        });

        if (!usuario.getActivo()) {
            throw new UnauthorizedException("La cuenta de usuario se encuentra inactiva.");
        }

        String token = tokenProvider.generateToken(usuario.getEmail(), usuario.getId());

        return new AuthResponse(
                token,
                usuario.getId(),
                usuario.getEmail(),
                usuario.getPersona() != null ? usuario.getPersona().getNombre() : "",
                usuario.getPersona() != null ? usuario.getPersona().getApellido() : ""
        );
    }
}
