package com.concurso.usuario.service;

import com.concurso.usuario.dto.request.PaisRequest;
import com.concurso.usuario.dto.response.PaisResponse;

import java.util.List;

public interface PaisService {
    List<PaisResponse> getAll();
    PaisResponse getById(Long id);
    PaisResponse create(PaisRequest request);
    PaisResponse update(Long id, PaisRequest request);
    void delete(Long id);
}
