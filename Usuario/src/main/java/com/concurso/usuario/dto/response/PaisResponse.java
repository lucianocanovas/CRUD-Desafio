package com.concurso.usuario.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Respuesta con datos de un País")
public class PaisResponse {

    @Schema(description = "Identificador único del país", example = "1")
    private Long id;

    @Schema(description = "Nombre del país", example = "Argentina")
    private String nombre;

    @Schema(description = "Código del país", example = "AR")
    private String codigo;

    public PaisResponse() {
    }

    public PaisResponse(Long id, String nombre, String codigo) {
        this.id = id;
        this.nombre = nombre;
        this.codigo = codigo;
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

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }
}
