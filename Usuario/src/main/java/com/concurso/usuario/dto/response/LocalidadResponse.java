package com.concurso.usuario.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Respuesta con datos de una Localidad")
public class LocalidadResponse {

    @Schema(description = "Identificador único de la localidad", example = "1")
    private Long id;

    @Schema(description = "Nombre de la localidad", example = "Ciudad de Mendoza")
    private String nombre;

    @Schema(description = "Código postal", example = "5500")
    private String codigoPostal;

    @Schema(description = "Departamento al que pertenece")
    private DepartamentoResponse departamento;

    public LocalidadResponse() {
    }

    public LocalidadResponse(Long id, String nombre, String codigoPostal, DepartamentoResponse departamento) {
        this.id = id;
        this.nombre = nombre;
        this.codigoPostal = codigoPostal;
        this.departamento = departamento;
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

    public String getCodigoPostal() {
        return codigoPostal;
    }

    public void setCodigoPostal(String codigoPostal) {
        this.codigoPostal = codigoPostal;
    }

    public DepartamentoResponse getDepartamento() {
        return departamento;
    }

    public void setDepartamento(DepartamentoResponse departamento) {
        this.departamento = departamento;
    }
}
