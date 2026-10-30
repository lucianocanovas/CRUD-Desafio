package com.concurso.usuario.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Credenciales para inicio de sesión tradicional (soporta Email o DNI)")
public class LoginRequest {

    @Schema(description = "Correo electrónico o DNI registrado", example = "usuario@concurso.com")
    private String email;

    @Schema(description = "Identificador alternativo (Email o DNI) enviado por el Frontend", example = "38123456")
    private String identifier;

    @NotBlank(message = "La contraseña es obligatoria")
    @Schema(description = "Contraseña de acceso", example = "usuario123")
    private String password;

    public LoginRequest() {
    }

    public LoginRequest(String email, String password) {
        this.email = email;
        this.identifier = email;
        this.password = password;
    }

    public String getEmail() {
        if (email != null && !email.isBlank()) {
            return email;
        }
        return identifier;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getIdentifier() {
        if (identifier != null && !identifier.isBlank()) {
            return identifier;
        }
        return email;
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
