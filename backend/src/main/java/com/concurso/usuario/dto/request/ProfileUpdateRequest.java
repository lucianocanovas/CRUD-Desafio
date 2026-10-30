package com.concurso.usuario.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

@Schema(description = "Datos para modificar la información personal de la Persona asociada a la cuenta")
public class ProfileUpdateRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres")
    @Schema(description = "Nombre actualizado de la persona", example = "María Emilia")
    private String nombre;

    @NotBlank(message = "El apellido es obligatorio")
    @Size(min = 2, max = 100, message = "El apellido debe tener entre 2 y 100 caracteres")
    @Schema(description = "Apellido actualizado de la persona", example = "Becerra Modificada")
    private String apellido;

    @NotBlank(message = "El DNI es obligatorio")
    @Pattern(regexp = "^[0-9]{7,10}$", message = "El DNI debe contener entre 7 y 10 dígitos numéricos")
    @Schema(description = "DNI de la persona (se valida que no colisione con otra persona)", example = "41999888")
    private String dni;

    @NotNull(message = "La fecha de nacimiento es obligatoria")
    @Past(message = "La fecha de nacimiento debe ser una fecha pasada")
    @Schema(description = "Fecha de nacimiento en formato YYYY-MM-DD", example = "2000-02-12")
    private LocalDate fechaNacimiento;

    @NotBlank(message = "La dirección es obligatoria")
    @Size(min = 3, max = 255, message = "La dirección debe tener entre 3 y 255 caracteres")
    @Schema(description = "Dirección de residencia actualizada", example = "Nueva Dirección 999, La Plata")
    private String direccion;

    @Email(message = "El formato de email no es válido")
    @Schema(description = "Correo electrónico actualizado (opcional)", example = "usuario@concurso.com")
    private String email;

    @Schema(description = "Identificador del avatar 3D Steampunk (opcional)", example = "automaton")
    private String avatarId;

    public ProfileUpdateRequest() {
    }

    public ProfileUpdateRequest(String nombre, String apellido, String dni, LocalDate fechaNacimiento, String direccion) {
        this.nombre = nombre;
        this.apellido = apellido;
        this.dni = dni;
        this.fechaNacimiento = fechaNacimiento;
        this.direccion = direccion;
    }

    public ProfileUpdateRequest(String nombre, String apellido, String dni, LocalDate fechaNacimiento, String direccion, String email, String avatarId) {
        this(nombre, apellido, dni, fechaNacimiento, direccion);
        this.email = email;
        this.avatarId = avatarId;
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAvatarId() {
        return avatarId;
    }

    public void setAvatarId(String avatarId) {
        this.avatarId = avatarId;
    }
}
