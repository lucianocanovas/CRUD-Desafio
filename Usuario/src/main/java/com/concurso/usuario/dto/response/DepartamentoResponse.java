package com.concurso.usuario.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Respuesta con datos de un Departamento")
public class DepartamentoResponse {

    @Schema(description = "Identificador único del departamento", example = "1")
    private Long id;

    @Schema(description = "Nombre del departamento", example = "Capital")
    private String nombre;

    @Schema(description = "País al que pertenece")
    private PaisResponse pais;

    public DepartamentoResponse() {
    }

    public DepartamentoResponse(Long id, String nombre, PaisResponse pais) {
        this.id = id;
        this.nombre = nombre;
        this.pais = pais;
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

    public PaisResponse getPais() {
        return pais;
    }

    public void setPais(PaisResponse pais) {
        this.pais = pais;
    }
}
