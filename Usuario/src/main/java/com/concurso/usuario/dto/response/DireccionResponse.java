package com.concurso.usuario.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Respuesta con datos de una Dirección")
public class DireccionResponse {

    @Schema(description = "Identificador único de la dirección", example = "1")
    private Long id;

    @Schema(description = "Calle", example = "Av. San Martín")
    private String calle;

    @Schema(description = "Número", example = "742")
    private String numero;

    @Schema(description = "Piso", example = "4")
    private String piso;

    @Schema(description = "Departamento", example = "B")
    private String departamento;

    @Schema(description = "Localidad a la que pertenece")
    private LocalidadResponse localidad;

    @Schema(description = "Representación textual legible y completa de la dirección", example = "Av. San Martín 742, Piso 4 Dpto B, Ciudad de Mendoza, Capital, Argentina")
    private String textoCompleto;

    public DireccionResponse() {
    }

    public DireccionResponse(Long id, String calle, String numero, String piso, String departamento, LocalidadResponse localidad) {
        this.id = id;
        this.calle = calle;
        this.numero = numero;
        this.piso = piso;
        this.departamento = departamento;
        this.localidad = localidad;
        this.textoCompleto = generarTextoCompleto();
    }

    private String generarTextoCompleto() {
        StringBuilder sb = new StringBuilder();
        if (calle != null) sb.append(calle);
        if (numero != null && !numero.isBlank()) sb.append(" ").append(numero);
        if (piso != null && !piso.isBlank()) sb.append(", Piso ").append(piso);
        if (departamento != null && !departamento.isBlank()) sb.append(" Dpto ").append(departamento);
        if (localidad != null) {
            sb.append(", ").append(localidad.getNombre());
            if (localidad.getDepartamento() != null) {
                sb.append(", ").append(localidad.getDepartamento().getNombre());
                if (localidad.getDepartamento().getPais() != null) {
                    sb.append(", ").append(localidad.getDepartamento().getPais().getNombre());
                }
            }
        }
        return sb.toString();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public LocalidadResponse getLocalidad() {
        return localidad;
    }

    public void setLocalidad(LocalidadResponse localidad) {
        this.localidad = localidad;
        this.textoCompleto = generarTextoCompleto();
    }

    public String getTextoCompleto() {
        return textoCompleto;
    }

    public void setTextoCompleto(String textoCompleto) {
        this.textoCompleto = textoCompleto;
    }
}
