package com.concurso.usuario.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

@Schema(description = "Datos para el registro de un nuevo usuario físico (Persona + Credenciales)")
public class RegisterRequest {

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato de email no es válido")
    @Schema(description = "Correo electrónico del usuario (identificador de login)", example = "maria.becerra@gmail.com")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    @Schema(description = "Contraseña de acceso (mínimo 6 caracteres)", example = "ClaveSegura123")
    private String password;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres")
    @Schema(description = "Nombre de la persona", example = "María")
    private String nombre;

    @NotBlank(message = "El apellido es obligatorio")
    @Size(min = 2, max = 100, message = "El apellido debe tener entre 2 y 100 caracteres")
    @Schema(description = "Apellido de la persona", example = "Becerra")
    private String apellido;

    @NotBlank(message = "El DNI es obligatorio")
    @Pattern(regexp = "^[0-9]{7,10}$", message = "El DNI debe contener entre 7 y 10 dígitos numéricos")
    @Schema(description = "Documento Nacional de Identidad (único, 7 a 10 dígitos numéricos)", example = "41999888")
    private String dni;

    @NotNull(message = "La fecha de nacimiento es obligatoria")
    @Past(message = "La fecha de nacimiento debe ser una fecha pasada")
    @Schema(description = "Fecha de nacimiento en formato YYYY-MM-DD", example = "2000-02-12")
    private LocalDate fechaNacimiento;

    @NotBlank(message = "La dirección es obligatoria")
    @Size(min = 3, max = 255, message = "La dirección debe tener entre 3 y 255 caracteres")
    @Schema(description = "Dirección de residencia", example = "Calle 13 Nro 500, Quilmes")
    private String direccion;

    @Schema(description = "Identificador del personaje 3D Steampunk", example = "automaton")
    private String avatarId = "automaton";

    public RegisterRequest() {
    }

    public RegisterRequest(String email, String password, String nombre, String apellido,
                           String dni, LocalDate fechaNacimiento, String direccion) {
        this(email, password, nombre, apellido, dni, fechaNacimiento, direccion, "automaton");
    }

    public RegisterRequest(String email, String password, String nombre, String apellido,
                           String dni, LocalDate fechaNacimiento, String direccion, String avatarId) {
        this.email = email;
        this.password = password;
        this.nombre = nombre;
        this.apellido = apellido;
        this.dni = dni;
        this.fechaNacimiento = fechaNacimiento;
        this.direccion = direccion;
        this.avatarId = (avatarId != null && !avatarId.isBlank()) ? avatarId : "automaton";
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
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

    public String getAvatarId() {
        return avatarId != null ? avatarId : "automaton";
    }

    public void setAvatarId(String avatarId) {
        this.avatarId = (avatarId != null && !avatarId.isBlank()) ? avatarId : "automaton";
    }
}
