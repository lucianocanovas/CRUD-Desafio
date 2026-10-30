package com.concurso.usuario.dto.request;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@JsonDeserialize(using = DireccionRequestDeserializer.class)
@Schema(description = "Solicitud para crear o modificar una Dirección")
public class DireccionRequest {

    @NotBlank(message = "La calle es obligatoria")
    @Size(max = 150, message = "La calle no puede superar los 150 caracteres")
    @Schema(description = "Nombre o denominación de la calle / avenida", example = "Av. San Martín")
    private String calle;

    @NotBlank(message = "El número es obligatorio")
    @Size(max = 20, message = "El número no puede superar los 20 caracteres")
    @Schema(description = "Número o altura de la calle", example = "742")
    private String numero;

    @Size(max = 20, message = "El piso no puede superar los 20 caracteres")
    @Schema(description = "Piso (opcional)", example = "4")
    private String piso;

    @Size(max = 20, message = "El número o letra de departamento no puede superar los 20 caracteres")
    @Schema(description = "Número o letra de departamento / oficina (opcional)", example = "B")
    private String departamento;

    @NotNull(message = "El ID de la localidad es obligatorio")
    @Schema(description = "ID de la localidad a la que pertenece", example = "1")
    private Long localidadId;

    public DireccionRequest() {
    }

    public DireccionRequest(String calle, String numero, String piso, String departamento, Long localidadId) {
        this.calle = calle;
        this.numero = numero;
        this.piso = piso;
        this.departamento = departamento;
        this.localidadId = localidadId;
    }

    public String getCalle() {
        return calle;
    }

    public void setCalle(String calle) {
        this.calle = calle;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public String getPiso() {
        return piso;
    }

    public void setPiso(String piso) {
        this.piso = piso;
    }

    public String getDepartamento() {
        return departamento;
    }

    public void setDepartamento(String departamento) {
        this.departamento = departamento;
    }

    public Long getLocalidadId() {
        return localidadId;
    }

    public void setLocalidadId(Long localidadId) {
        this.localidadId = localidadId;
    }
}
