package com.concurso.usuario.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDate;

@Schema(description = "Datos de la Persona física")
public class PersonaDTO {

    @Schema(description = "ID único de la Persona", example = "1")
    private Long id;

    @Schema(description = "Nombre de la Persona", example = "Juan")
    private String nombre;

    @Schema(description = "Apellido de la Persona", example = "Pérez")
    private String apellido;

    @Schema(description = "DNI de la Persona", example = "38123456")
    private String dni;

    @Schema(description = "Fecha de nacimiento", example = "1995-05-20")
    private LocalDate fechaNacimiento;

    @Schema(description = "Dirección estructurada de residencia")
    private DireccionResponse direccion;

    @Schema(description = "Texto legible de la dirección", example = "Av. San Martín 742, Piso 4 Dpto B, Ciudad de Mendoza, Capital, Argentina")
    private String direccionTexto;

    public PersonaDTO() {
    }

    public PersonaDTO(Long id, String nombre, String apellido, String dni, LocalDate fechaNacimiento, DireccionResponse direccion) {
        this.id = id;
        this.nombre = nombre;
        this.apellido = apellido;
        this.dni = dni;
        this.fechaNacimiento = fechaNacimiento;
        this.direccion = direccion;
        this.direccionTexto = (direccion != null) ? direccion.getTextoCompleto() : "";
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public DireccionResponse getDireccion() {
        return direccion;
    }

    public void setDireccion(DireccionResponse direccion) {
        this.direccion = direccion;
        this.direccionTexto = (direccion != null) ? direccion.getTextoCompleto() : "";
    }

    public String getDireccionTexto() {
        return direccionTexto;
    }

    public void setDireccionTexto(String direccionTexto) {
        this.direccionTexto = direccionTexto;
    }
}
