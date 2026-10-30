package com.concurso.usuario.controller;

import com.concurso.usuario.dto.request.LoginRequest;
import com.concurso.usuario.dto.request.OAuthLoginRequest;
import com.concurso.usuario.dto.request.RegisterRequest;
import com.concurso.usuario.dto.response.AuthResponse;
import com.concurso.usuario.entity.Usuario;
import com.concurso.usuario.exception.ErrorResponse;
import com.concurso.usuario.service.AuthService;
import com.concurso.usuario.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "1. Autenticación y Registro", description = "Endpoints públicos de inicio de sesión y registro de usuarios")
public class AuthController {

    private final AuthService authService;
    private final ProfileService profileService;

    public AuthController(AuthService authService, ProfileService profileService) {
        this.authService = authService;
        this.profileService = profileService;
    }

    @PostMapping("/register")
    @Operation(
            summary = "Alta de Usuario (Registración Persona + Usuario)",
            description = "Ejecuta el **Patrón Plantilla (Template Method)** en 4 pasos: validaciones de unicidad de email/DNI, normalización de datos, persistencia en BD con clave encriptada (BCrypt) y hook de auditoría. Retorna el token JWT."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Usuario y Persona creados exitosamente. Devuelve JWT y datos básicos.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Error de validación (campos vacíos, formato inválido, email o DNI ya existente)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<com.concurso.usuario.dto.response.ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return new ResponseEntity<>(
                com.concurso.usuario.dto.response.ApiResponse.ok("Usuario registrado correctamente.", response),
                HttpStatus.CREATED
        );
    }

    @PostMapping("/login")
    @Operation(
            summary = "1ro: Iniciar sesión con email y contraseña",
            description = "Autentica las credenciales con Spring Security AuthenticationManager y BCrypt. Devuelve el token JWT Bearer necesario para acceder a las opciones de Perfil y Cambio de Contraseña."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Autenticación exitosa. Devuelve el JWT Bearer.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "401", description = "Credenciales incorrectas (email o contraseña inválidos)",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<com.concurso.usuario.dto.response.ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(com.concurso.usuario.dto.response.ApiResponse.ok("Inicio de sesión exitoso.", response));
    }

    @PostMapping("/oauth-login")
    @Operation(
            summary = "Login / Sincronización OAuth2 (Auth0 / Google)",
            description = "Recibe los datos del usuario autenticado en React mediante Auth0 (`@auth0/auth0-react`) o Google. Si el usuario no existe en la base de datos, se auto-registra al instante y genera el token JWT del backend."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Autenticación OAuth exitosa y token JWT generado.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = AuthResponse.class))),
            @ApiResponse(responseCode = "400", description = "Petición inválida o cuenta inactiva",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<com.concurso.usuario.dto.response.ApiResponse<AuthResponse>> oauthLogin(@Valid @RequestBody OAuthLoginRequest request) {
        AuthResponse response = authService.oauthLogin(request);
        return ResponseEntity.ok(com.concurso.usuario.dto.response.ApiResponse.ok("Autenticación OAuth exitosa.", response));
    }

    @GetMapping("/check-token")
    @Operation(
            summary = "Verificar validez del token JWT",
            description = "Permite al frontend de React verificar si el token almacenado en localStorage sigue siendo válido al recargar la página."
    )
    @SecurityRequirement(name = "bearerAuth")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Token válido y sesión activa"),
            @ApiResponse(responseCode = "401", description = "Token expirado o inválido")
    })
    public ResponseEntity<com.concurso.usuario.dto.response.ApiResponse<AuthResponse>> checkToken(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(com.concurso.usuario.dto.response.ApiResponse.error("Token no válido o sesión no activa"));
        }
        Usuario usuario = profileService.findByEmail(authentication.getName());
        AuthResponse auth = new AuthResponse(
                null,
                usuario.getId(),
                usuario.getEmail(),
                usuario.getPersona() != null ? usuario.getPersona().getNombre() : "",
                usuario.getPersona() != null ? usuario.getPersona().getApellido() : ""
        );
        return ResponseEntity.ok(com.concurso.usuario.dto.response.ApiResponse.ok("Token válido", auth));
    }
}
