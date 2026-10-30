package com.concurso.usuario.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "Perfil completo del Usuario y los datos de su Persona física asociada")
public class ProfileResponse {

    @Schema(description = "ID del usuario", example = "1")
    private Long id;

    @Schema(description = "Correo electrónico del usuario", example = "usuario@concurso.com")
    private String email;

    @Schema(description = "Rol del usuario", example = "ROLE_USER")
    private String rol;

    @Schema(description = "Proveedor de autenticación (LOCAL o GOOGLE/AUTH0)", example = "LOCAL")
    private String authProvider;

    @Schema(description = "Estado activo de la cuenta", example = "true")
    private Boolean activo;

    @Schema(description = "Datos personales de la Persona asociada")
    private PersonaDTO persona;

    @Schema(description = "Fecha y hora de creación de la cuenta", example = "2026-10-30T14:38:13")
    private LocalDateTime createdAt;

    @Schema(description = "Fecha y hora de última modificación", example = "2026-10-30T14:38:53")
    private LocalDateTime updatedAt;

    public ProfileResponse() {
    }

    public ProfileResponse(Long id, String email, String rol, String authProvider,
                           Boolean activo, PersonaDTO persona, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.email = email;
        this.rol = rol;
        this.authProvider = authProvider;
        this.activo = activo;
        this.persona = persona;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }

    public String getAuthProvider() {
        return authProvider;
    }

    public void setAuthProvider(String authProvider) {
        this.authProvider = authProvider;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public PersonaDTO getPersona() {
        return persona;
    }

    public void setPersona(PersonaDTO persona) {
        this.persona = persona;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
