package com.concurso.usuario.service.impl;

import com.concurso.usuario.dto.request.PaisRequest;
import com.concurso.usuario.dto.response.PaisResponse;
import com.concurso.usuario.entity.Pais;
import com.concurso.usuario.exception.BadRequestException;
import com.concurso.usuario.exception.ResourceNotFoundException;
import com.concurso.usuario.repository.PaisRepository;
import com.concurso.usuario.service.PaisService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PaisServiceImpl implements PaisService {

    private final PaisRepository paisRepository;

    public PaisServiceImpl(PaisRepository paisRepository) {
        this.paisRepository = paisRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaisResponse> getAll() {
        return paisRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PaisResponse getById(Long id) {
        Pais pais = paisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("País no encontrado con ID: " + id));
        return mapToResponse(pais);
    }

    @Override
    @Transactional
    public PaisResponse create(PaisRequest request) {
        String nombre = request.getNombre().trim();
        if (paisRepository.existsByNombreIgnoreCase(nombre)) {
            throw new BadRequestException("Ya existe un país registrado con el nombre: " + nombre);
        }

        Pais pais = Pais.builder()
                .nombre(nombre)
                .codigo(request.getCodigo() != null ? request.getCodigo().trim().toUpperCase() : null)
                .build();

        return mapToResponse(paisRepository.save(pais));
    }

    @Override
    @Transactional
    public PaisResponse update(Long id, PaisRequest request) {
        Pais pais = paisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("País no encontrado con ID: " + id));

        String nombre = request.getNombre().trim();
        if (!pais.getNombre().equalsIgnoreCase(nombre) && paisRepository.existsByNombreIgnoreCase(nombre)) {
            throw new BadRequestException("Ya existe otro país registrado con el nombre: " + nombre);
        }

        pais.setNombre(nombre);
        pais.setCodigo(request.getCodigo() != null ? request.getCodigo().trim().toUpperCase() : null);

        return mapToResponse(paisRepository.save(pais));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!paisRepository.existsById(id)) {
            throw new ResourceNotFoundException("País no encontrado con ID: " + id);
        }
        paisRepository.deleteById(id);
    }

    private PaisResponse mapToResponse(Pais pais) {
        return new PaisResponse(pais.getId(), pais.getNombre(), pais.getCodigo());
    }
}
