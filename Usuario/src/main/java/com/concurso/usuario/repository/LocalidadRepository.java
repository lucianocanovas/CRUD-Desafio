package com.concurso.usuario.repository;

import com.concurso.usuario.entity.Localidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocalidadRepository extends JpaRepository<Localidad, Long> {
    List<Localidad> findByDepartamentoId(Long departamentoId);
}
