package com.concurso.usuario.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "Solicitud para crear o modificar un Departamento / Provincia")
public class DepartamentoRequest {

    @NotBlank(message = "El nombre del departamento es obligatorio")
    @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
    @Schema(description = "Nombre del departamento", example = "Capital")
    private String nombre;

    @NotNull(message = "El ID del país es obligatorio")
    @Schema(description = "ID del país al que pertenece", example = "1")
    private Long paisId;

    public DepartamentoRequest() {
    }

    public DepartamentoRequest(String nombre, Long paisId) {
        this.nombre = nombre;
        this.paisId = paisId;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Long getPaisId() {
        return paisId;
    }

    public void setPaisId(Long paisId) {
        this.paisId = paisId;
    }
}
