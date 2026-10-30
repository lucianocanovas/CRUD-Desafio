package com.concurso.usuario.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "Solicitud para crear o modificar una Localidad")
public class LocalidadRequest {

    @NotBlank(message = "El nombre de la localidad es obligatorio")
    @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
    @Schema(description = "Nombre de la localidad", example = "Ciudad de Mendoza")
    private String nombre;

    @Size(max = 20, message = "El código postal no puede superar los 20 caracteres")
    @Schema(description = "Código postal", example = "5500")
    private String codigoPostal;

    @NotNull(message = "El ID del departamento es obligatorio")
    @Schema(description = "ID del departamento al que pertenece", example = "1")
    private Long departamentoId;

    public LocalidadRequest() {
    }

    public LocalidadRequest(String nombre, String codigoPostal, Long departamentoId) {
        this.nombre = nombre;
        this.codigoPostal = codigoPostal;
        this.departamentoId = departamentoId;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getCodigoPostal() {
        return codigoPostal;
    }

    public void setCodigoPostal(String codigoPostal) {
        this.codigoPostal = codigoPostal;
    }

    public Long getDepartamentoId() {
        return departamentoId;
    }

    public void setDepartamentoId(Long departamentoId) {
        this.departamentoId = departamentoId;
    }
}
