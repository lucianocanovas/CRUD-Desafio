package com.concurso.usuario.service.impl;

import com.concurso.usuario.dto.request.LocalidadRequest;
import com.concurso.usuario.dto.response.DepartamentoResponse;
import com.concurso.usuario.dto.response.LocalidadResponse;
import com.concurso.usuario.dto.response.PaisResponse;
import com.concurso.usuario.entity.Departamento;
import com.concurso.usuario.entity.Localidad;
import com.concurso.usuario.exception.ResourceNotFoundException;
import com.concurso.usuario.repository.DepartamentoRepository;
import com.concurso.usuario.repository.LocalidadRepository;
import com.concurso.usuario.service.LocalidadService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LocalidadServiceImpl implements LocalidadService {

    private final LocalidadRepository localidadRepository;
    private final DepartamentoRepository departamentoRepository;

    public LocalidadServiceImpl(LocalidadRepository localidadRepository, DepartamentoRepository departamentoRepository) {
        this.localidadRepository = localidadRepository;
        this.departamentoRepository = departamentoRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<LocalidadResponse> getAll() {
        return localidadRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LocalidadResponse> getByDepartamentoId(Long departamentoId) {
        return localidadRepository.findByDepartamentoId(departamentoId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public LocalidadResponse getById(Long id) {
        Localidad localidad = localidadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Localidad no encontrada con ID: " + id));
        return mapToResponse(localidad);
    }

    @Override
    @Transactional
    public LocalidadResponse create(LocalidadRequest request) {
        Departamento depto = departamentoRepository.findById(request.getDepartamentoId())
                .orElseThrow(() -> new ResourceNotFoundException("Departamento no encontrado con ID: " + request.getDepartamentoId()));

        Localidad localidad = Localidad.builder()
                .nombre(request.getNombre().trim())
                .codigoPostal(request.getCodigoPostal() != null ? request.getCodigoPostal().trim() : null)
                .departamento(depto)
                .build();

        return mapToResponse(localidadRepository.save(localidad));
    }

    @Override
    @Transactional
    public LocalidadResponse update(Long id, LocalidadRequest request) {
        Localidad localidad = localidadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Localidad no encontrada con ID: " + id));

        Departamento depto = departamentoRepository.findById(request.getDepartamentoId())
                .orElseThrow(() -> new ResourceNotFoundException("Departamento no encontrado con ID: " + request.getDepartamentoId()));

        localidad.setNombre(request.getNombre().trim());
        localidad.setCodigoPostal(request.getCodigoPostal() != null ? request.getCodigoPostal().trim() : null);
        localidad.setDepartamento(depto);

        return mapToResponse(localidadRepository.save(localidad));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!localidadRepository.existsById(id)) {
            throw new ResourceNotFoundException("Localidad no encontrada con ID: " + id);
        }
        localidadRepository.deleteById(id);
    }

    private LocalidadResponse mapToResponse(Localidad localidad) {
        DepartamentoResponse deptoResponse = null;
        if (localidad.getDepartamento() != null) {
            PaisResponse paisResponse = null;
            if (localidad.getDepartamento().getPais() != null) {
                paisResponse = new PaisResponse(
                        localidad.getDepartamento().getPais().getId(),
                        localidad.getDepartamento().getPais().getNombre(),
                        localidad.getDepartamento().getPais().getCodigo()
                );
            }
            deptoResponse = new DepartamentoResponse(
                    localidad.getDepartamento().getId(),
                    localidad.getDepartamento().getNombre(),
                    paisResponse
            );
        }

        return new LocalidadResponse(
                localidad.getId(),
                localidad.getNombre(),
                localidad.getCodigoPostal(),
                deptoResponse
        );
    }
}
