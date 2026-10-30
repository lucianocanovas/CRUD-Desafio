package com.concurso.usuario.controller;

import com.concurso.usuario.dto.request.ChangePasswordRequest;
import com.concurso.usuario.dto.request.ProfileUpdateRequest;
import com.concurso.usuario.dto.response.ProfileResponse;
import com.concurso.usuario.entity.Usuario;
import com.concurso.usuario.exception.ErrorResponse;
import com.concurso.usuario.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@Tag(name = "2. Perfil de Usuario", description = "Endpoints de usuario autenticado: Opción 1 (Ver y Modificar Datos) y Opción 2 (Cambio de Clave)")
@SecurityRequirement(name = "bearerAuth")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    @Operation(
            summary = "Opción 1: Ver datos del usuario y persona",
            description = "Devuelve el perfil completo del usuario autenticado (datos de la cuenta Usuario y datos físicos de la Persona vinculada)."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Datos del perfil obtenidos con éxito.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ProfileResponse.class))),
            @ApiResponse(responseCode = "401", description = "Token JWT ausente o inválido.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Usuario no encontrado.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<com.concurso.usuario.dto.response.ApiResponse<ProfileResponse>> getProfile(Authentication authentication) {
        String email = authentication.getName();
        ProfileResponse profile = profileService.getProfileByEmail(email);
        return ResponseEntity.ok(com.concurso.usuario.dto.response.ApiResponse.ok("Perfil obtenido con éxito.", profile));
    }

    @PutMapping
    @Operation(
            summary = "Opción 1: Modificar datos personales del usuario",
            description = "Actualiza los datos personales (Nombre, Apellido, DNI, Fecha de Nacimiento, Dirección) del usuario autenticado ejecutando el **Patrón Plantilla (Template Method)** con validación de colisión de DNI."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Datos actualizados exitosamente.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ProfileResponse.class))),
            @ApiResponse(responseCode = "400", description = "Error de validación (campos requeridos, formato o nuevo DNI en uso por otra persona).",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Token JWT no provisto o inválido.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<com.concurso.usuario.dto.response.ApiResponse<ProfileResponse>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody ProfileUpdateRequest request) {
        String email = authentication.getName();
        Usuario usuario = profileService.findByEmail(email);
        ProfileResponse updatedProfile = profileService.updateProfile(usuario.getId(), request);
        return ResponseEntity.ok(com.concurso.usuario.dto.response.ApiResponse.ok("Datos del perfil actualizados exitosamente.", updatedProfile));
    }

    @PutMapping("/change-password")
    @Operation(
            summary = "Opción 2: Cambiar la contraseña (y que funcione)",
            description = "Modifica la contraseña del usuario autenticado ejecutando el **Patrón Plantilla**. Valida que la contraseña actual coincida con el hash BCrypt, que la nueva clave coincida con la confirmación, que tenga mínimo 6 caracteres y que sea diferente a la actual."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Contraseña modificada exitosamente."),
            @ApiResponse(responseCode = "400", description = "Contraseña actual incorrecta, contraseñas nuevas no coinciden, o nueva clave igual a la anterior.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Token JWT no provisto o expirado.",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<com.concurso.usuario.dto.response.ApiResponse<Void>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        String email = authentication.getName();
        Usuario usuario = profileService.findByEmail(email);
        profileService.changePassword(usuario.getId(), request);
        return ResponseEntity.ok(com.concurso.usuario.dto.response.ApiResponse.ok("Contraseña cambiada exitosamente."));
    }

    @DeleteMapping
    @Operation(
            summary = "Baja de la cuenta propia",
            description = "Elimina la cuenta del usuario autenticado y su persona asociada del sistema."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cuenta eliminada exitosamente."),
            @ApiResponse(responseCode = "401", description = "Token JWT no provisto o expirado.")
    })
    public ResponseEntity<com.concurso.usuario.dto.response.ApiResponse<Void>> deleteAccount(Authentication authentication) {
        String email = authentication.getName();
        Usuario usuario = profileService.findByEmail(email);
        profileService.deleteAccount(usuario.getId());
        return ResponseEntity.ok(com.concurso.usuario.dto.response.ApiResponse.ok("Cuenta eliminada exitosamente."));
    }
}
