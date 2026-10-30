package com.concurso.usuario.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "direcciones")
public class Direccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String calle;

    @Column(nullable = false, length = 20)
    private String numero;

    @Column(length = 20)
    private String piso;

    @Column(name = "nro_departamento", length = 20)
    private String nroDepartamento;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "localidad_id", nullable = false)
    private Localidad localidad;

    public Direccion() {
    }

    public Direccion(Long id, String calle, String numero, String piso, String nroDepartamento, Localidad localidad) {
        this.id = id;
        this.calle = calle;
        this.numero = numero;
        this.piso = piso;
        this.nroDepartamento = nroDepartamento;
        this.localidad = localidad;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String calle;
        private String numero;
        private String piso;
        private String nroDepartamento;
        private Localidad localidad;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder calle(String calle) {
            this.calle = calle;
            return this;
        }

        public Builder numero(String numero) {
            this.numero = numero;
            return this;
        }

        public Builder piso(String piso) {
            this.piso = piso;
            return this;
        }

        public Builder nroDepartamento(String nroDepartamento) {
            this.nroDepartamento = nroDepartamento;
            return this;
        }

        public Builder localidad(Localidad localidad) {
            this.localidad = localidad;
            return this;
        }

        public Direccion build() {
            return new Direccion(id, calle, numero, piso, nroDepartamento, localidad);
        }
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

    public String getNroDepartamento() {
        return nroDepartamento;
    }

    public void setNroDepartamento(String nroDepartamento) {
        this.nroDepartamento = nroDepartamento;
    }

    public Localidad getLocalidad() {
        return localidad;
    }

    public void setLocalidad(Localidad localidad) {
        this.localidad = localidad;
    }
}
