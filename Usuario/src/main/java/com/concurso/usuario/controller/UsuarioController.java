package com.concurso.usuario.controller;

import com.concurso.usuario.dto.response.ApiResponse;
import com.concurso.usuario.dto.response.ProfileResponse;
import com.concurso.usuario.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@Tag(name = "4. Gestión ABM de Usuarios (Admin / Grilla React)", description = "Endpoints para listar y gestionar usuarios en la grilla del frontend")
@SecurityRequirement(name = "bearerAuth")
public class UsuarioController {

    private final ProfileService profileService;

    public UsuarioController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    @Operation(summary = "Listar todos los usuarios y personas (Grilla ABM)", description = "Devuelve la lista completa de usuarios registrados junto con los datos de sus personas físicas para renderizar en tablas de React.")
    public ResponseEntity<ApiResponse<List<ProfileResponse>>> getAllUsers() {
        List<ProfileResponse> users = profileService.getAllProfiles();
        return ResponseEntity.ok(ApiResponse.ok("Listado de usuarios obtenido con éxito.", users));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Baja de usuario por ID (Grilla ABM)", description = "Elimina un usuario y su persona asociada por su identificador único.")
    public ResponseEntity<ApiResponse<Void>> deleteUserById(@PathVariable Long id) {
        profileService.deleteUserById(id);
        return ResponseEntity.ok(ApiResponse.ok("Usuario eliminado exitosamente."));
    }
}
