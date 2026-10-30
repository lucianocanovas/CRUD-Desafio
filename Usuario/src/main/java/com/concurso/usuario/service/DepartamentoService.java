package com.concurso.usuario.service;

import com.concurso.usuario.dto.request.DepartamentoRequest;
import com.concurso.usuario.dto.response.DepartamentoResponse;

import java.util.List;

public interface DepartamentoService {
    List<DepartamentoResponse> getAll();
    List<DepartamentoResponse> getByPaisId(Long paisId);
    DepartamentoResponse getById(Long id);
    DepartamentoResponse create(DepartamentoRequest request);
    DepartamentoResponse update(Long id, DepartamentoRequest request);
    void delete(Long id);
}
