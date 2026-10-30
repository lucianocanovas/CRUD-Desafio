package com.concurso.usuario.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

@Schema(description = "Datos provenientes de autenticación OAuth2 / Auth0 desde React")
public class OAuthLoginRequest {

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato de email no es válido")
    @Schema(description = "Email autenticado mediante Auth0 / Google", example = "juan.cruz@gmail.com")
    private String email;

    @NotBlank(message = "El nombre es obligatorio")
    @Schema(description = "Nombre provisto por el proveedor OAuth / Auth0", example = "Juan")
    private String nombre;

    @Schema(description = "Apellido provisto por el proveedor OAuth / Auth0 (opcional)", example = "Cruz")
    private String apellido;

    @Schema(description = "DNI de la persona (si no se envía, se genera uno temporal)", example = "42345678")
    private String dni;

    @Schema(description = "Fecha de nacimiento (opcional)", example = "2001-07-15")
    private LocalDate fechaNacimiento;

    @Schema(description = "Dirección de residencia (opcional)", example = "Calle San Martín 123")
    private String direccion;

    @Schema(description = "Proveedor OAuth (AUTH0, GOOGLE, etc.)", example = "AUTH0")
    private String provider = "AUTH0";

    @Schema(description = "Identificador único otorgado por Auth0 o Google (sub)", example = "auth0|64f123abc456")
    private String providerId;

    public OAuthLoginRequest() {
    }

    public OAuthLoginRequest(String email, String nombre, String apellido, String dni,
                             LocalDate fechaNacimiento, String direccion, String provider, String providerId) {
        this.email = email;
        this.nombre = nombre;
        this.apellido = apellido;
        this.dni = dni;
        this.fechaNacimiento = fechaNacimiento;
        this.direccion = direccion;
        this.provider = provider != null ? provider : "AUTH0";
        this.providerId = providerId;
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

    public String getDni() {
        return dni;
    }

    public void setDni(String dni) {
        this.dni = dni;
    }

    public LocalDate getFechaNacimiento() {
        return fechaNacimiento;
    }

    public void setFechaNacimiento(LocalDate fechaNacimiento) {
        this.fechaNacimiento = fechaNacimiento;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getProviderId() {
        return providerId;
    }

    public void setProviderId(String providerId) {
        this.providerId = providerId;
    }
}
