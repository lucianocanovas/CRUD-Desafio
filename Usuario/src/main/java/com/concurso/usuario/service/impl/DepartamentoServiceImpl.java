package com.concurso.usuario.service.impl;

import com.concurso.usuario.dto.request.DepartamentoRequest;
import com.concurso.usuario.dto.response.DepartamentoResponse;
import com.concurso.usuario.dto.response.PaisResponse;
import com.concurso.usuario.entity.Departamento;
import com.concurso.usuario.entity.Pais;
import com.concurso.usuario.exception.ResourceNotFoundException;
import com.concurso.usuario.repository.DepartamentoRepository;
import com.concurso.usuario.repository.PaisRepository;
import com.concurso.usuario.service.DepartamentoService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DepartamentoServiceImpl implements DepartamentoService {

    private final DepartamentoRepository departamentoRepository;
    private final PaisRepository paisRepository;

    public DepartamentoServiceImpl(DepartamentoRepository departamentoRepository, PaisRepository paisRepository) {
        this.departamentoRepository = departamentoRepository;
        this.paisRepository = paisRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartamentoResponse> getAll() {
        return departamentoRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartamentoResponse> getByPaisId(Long paisId) {
        return departamentoRepository.findByPaisId(paisId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DepartamentoResponse getById(Long id) {
        Departamento depto = departamentoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Departamento no encontrado con ID: " + id));
        return mapToResponse(depto);
    }

    @Override
    @Transactional
    public DepartamentoResponse create(DepartamentoRequest request) {
        Pais pais = paisRepository.findById(request.getPaisId())
                .orElseThrow(() -> new ResourceNotFoundException("País no encontrado con ID: " + request.getPaisId()));

        Departamento depto = Departamento.builder()
                .nombre(request.getNombre().trim())
                .pais(pais)
                .build();

        return mapToResponse(departamentoRepository.save(depto));
    }

    @Override
    @Transactional
    public DepartamentoResponse update(Long id, DepartamentoRequest request) {
        Departamento depto = departamentoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Departamento no encontrado con ID: " + id));

        Pais pais = paisRepository.findById(request.getPaisId())
                .orElseThrow(() -> new ResourceNotFoundException("País no encontrado con ID: " + request.getPaisId()));

        depto.setNombre(request.getNombre().trim());
        depto.setPais(pais);

        return mapToResponse(departamentoRepository.save(depto));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!departamentoRepository.existsById(id)) {
            throw new ResourceNotFoundException("Departamento no encontrado con ID: " + id);
        }
        departamentoRepository.deleteById(id);
    }

    private DepartamentoResponse mapToResponse(Departamento depto) {
        PaisResponse paisResponse = null;
        if (depto.getPais() != null) {
            paisResponse = new PaisResponse(
                    depto.getPais().getId(),
                    depto.getPais().getNombre(),
                    depto.getPais().getCodigo()
            );
        }
        return new DepartamentoResponse(depto.getId(), depto.getNombre(), paisResponse);
    }
}
