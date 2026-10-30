package com.concurso.usuario.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "personas")
public class Persona {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, length = 100)
    private String apellido;

    @Column(nullable = false, unique = true, length = 20)
    private String dni;

    @Column(name = "fecha_nacimiento", nullable = false)
    private LocalDate fechaNacimiento;

    @Column(nullable = false, length = 255)
    private String direccion;

    @Column(name = "avatar_id", length = 50)
    private String avatarId = "automaton";

    public Persona() {
    }

    public Persona(Long id, String nombre, String apellido, String dni, LocalDate fechaNacimiento, String direccion) {
        this(id, nombre, apellido, dni, fechaNacimiento, direccion, "automaton");
    }

    public Persona(Long id, String nombre, String apellido, String dni, LocalDate fechaNacimiento, String direccion, String avatarId) {
        this.id = id;
        this.nombre = nombre;
        this.apellido = apellido;
        this.dni = dni;
        this.fechaNacimiento = fechaNacimiento;
        this.direccion = direccion;
        this.avatarId = (avatarId != null && !avatarId.isBlank()) ? avatarId : "automaton";
    }

    // Builder Pattern manual para evitar dependencias de plugins externos
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String nombre;
        private String apellido;
        private String dni;
        private LocalDate fechaNacimiento;
        private String direccion;
        private String avatarId = "automaton";

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder nombre(String nombre) {
            this.nombre = nombre;
            return this;
        }

        public Builder apellido(String apellido) {
            this.apellido = apellido;
            return this;
        }

        public Builder dni(String dni) {
            this.dni = dni;
            return this;
        }

        public Builder fechaNacimiento(LocalDate fechaNacimiento) {
            this.fechaNacimiento = fechaNacimiento;
            return this;
        }

        public Builder direccion(String direccion) {
            this.direccion = direccion;
            return this;
        }

        public Builder avatarId(String avatarId) {
            if (avatarId != null && !avatarId.isBlank()) {
                this.avatarId = avatarId;
            }
            return this;
        }

        public Persona build() {
            return new Persona(id, nombre, apellido, dni, fechaNacimiento, direccion, avatarId);
        }
    }

    // Getters y Setters
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
