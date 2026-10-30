package com.concurso.usuario.service;

import com.concurso.usuario.dto.request.DireccionRequest;
import com.concurso.usuario.dto.response.DireccionResponse;
import com.concurso.usuario.entity.Direccion;

import java.util.List;

public interface DireccionService {
    List<DireccionResponse> getAll();
    DireccionResponse getById(Long id);
    DireccionResponse create(DireccionRequest request);
    DireccionResponse update(Long id, DireccionRequest request);
    void delete(Long id);
    Direccion getEntityById(Long id);
    Direccion getOrCreateFromRequest(DireccionRequest request, Long direccionId);
}
