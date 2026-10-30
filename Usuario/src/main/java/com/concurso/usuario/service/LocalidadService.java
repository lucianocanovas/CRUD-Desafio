package com.concurso.usuario.service;

import com.concurso.usuario.dto.request.LocalidadRequest;
import com.concurso.usuario.dto.response.LocalidadResponse;

import java.util.List;

public interface LocalidadService {
    List<LocalidadResponse> getAll();
    List<LocalidadResponse> getByDepartamentoId(Long departamentoId);
    LocalidadResponse getById(Long id);
    LocalidadResponse create(LocalidadRequest request);
    LocalidadResponse update(Long id, LocalidadRequest request);
    void delete(Long id);
}
