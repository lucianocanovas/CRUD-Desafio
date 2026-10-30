package com.concurso.usuario.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Respuesta de autenticación con Token JWT y datos del usuario")
public class AuthResponse {

    @Schema(description = "Token JWT firmado para incluir en cabecera 'Authorization: Bearer <token>'", example = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c3VhcmlvQGNvbmN1cnNvLmNvbSIs...")
    private String token;

    @Schema(description = "Tipo de esquema de token", example = "Bearer")
    private String tokenType = "Bearer";

    @Schema(description = "ID del usuario en la base de datos", example = "1")
    private Long id;

    @Schema(description = "Correo electrónico del usuario", example = "usuario@concurso.com")
    private String email;

    @Schema(description = "Nombre de la persona asociada", example = "Juan")
    private String nombre;

    @Schema(description = "Apellido de la persona asociada", example = "Pérez")
    private String apellido;

    public AuthResponse() {
    }

    public AuthResponse(String token, Long id, String email, String nombre, String apellido) {
        this.token = token;
        this.id = id;
        this.email = email;
        this.nombre = nombre;
        this.apellido = apellido;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
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

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getApellido() {
        return apellido;
    }

    public void setApellido(String apellido) {
        this.apellido = apellido;
    }
}
