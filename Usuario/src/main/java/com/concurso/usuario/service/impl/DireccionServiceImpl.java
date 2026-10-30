package com.concurso.usuario.service.impl;

import com.concurso.usuario.dto.request.DireccionRequest;
import com.concurso.usuario.dto.response.DepartamentoResponse;
import com.concurso.usuario.dto.response.DireccionResponse;
import com.concurso.usuario.dto.response.LocalidadResponse;
import com.concurso.usuario.dto.response.PaisResponse;
import com.concurso.usuario.entity.Direccion;
import com.concurso.usuario.entity.Localidad;
import com.concurso.usuario.exception.BadRequestException;
import com.concurso.usuario.exception.ResourceNotFoundException;
import com.concurso.usuario.repository.DireccionRepository;
import com.concurso.usuario.repository.LocalidadRepository;
import com.concurso.usuario.service.DireccionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DireccionServiceImpl implements DireccionService {

    private final DireccionRepository direccionRepository;
    private final LocalidadRepository localidadRepository;

    public DireccionServiceImpl(DireccionRepository direccionRepository, LocalidadRepository localidadRepository) {
        this.direccionRepository = direccionRepository;
        this.localidadRepository = localidadRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DireccionResponse> getAll() {
        return direccionRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DireccionResponse getById(Long id) {
        Direccion direccion = getEntityById(id);
        return mapToResponse(direccion);
    }

    @Override
    @Transactional(readOnly = true)
    public Direccion getEntityById(Long id) {
        return direccionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dirección no encontrada con ID: " + id));
    }

    @Override
    @Transactional
    public DireccionResponse create(DireccionRequest request) {
        Localidad localidad = resolveLocalidad(request.getLocalidadId());

        Direccion direccion = Direccion.builder()
                .calle(request.getCalle() != null ? request.getCalle().trim() : "Calle S/N")
                .numero(request.getNumero() != null ? request.getNumero().trim() : "S/N")
                .piso(request.getPiso() != null ? request.getPiso().trim() : null)
                .nroDepartamento(request.getDepartamento() != null ? request.getDepartamento().trim() : null)
                .localidad(localidad)
                .build();

        return mapToResponse(direccionRepository.save(direccion));
    }

    @Override
    @Transactional
    public DireccionResponse update(Long id, DireccionRequest request) {
        Direccion direccion = getEntityById(id);
        Localidad localidad = resolveLocalidad(request.getLocalidadId());

        direccion.setCalle(request.getCalle() != null ? request.getCalle().trim() : direccion.getCalle());
        direccion.setNumero(request.getNumero() != null ? request.getNumero().trim() : direccion.getNumero());
        direccion.setPiso(request.getPiso() != null ? request.getPiso().trim() : null);
        direccion.setNroDepartamento(request.getDepartamento() != null ? request.getDepartamento().trim() : null);
        direccion.setLocalidad(localidad);

        return mapToResponse(direccionRepository.save(direccion));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!direccionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Dirección no encontrada con ID: " + id);
        }
        direccionRepository.deleteById(id);
    }

    @Override
    @Transactional
    public Direccion getOrCreateFromRequest(DireccionRequest request, Long direccionId) {
        if (direccionId != null) {
            return getEntityById(direccionId);
        }

        if (request != null) {
            Localidad localidad = resolveLocalidad(request.getLocalidadId());
            Direccion nuevaDireccion = Direccion.builder()
                    .calle(request.getCalle() != null && !request.getCalle().isBlank() ? request.getCalle().trim() : "Sin especificar")
                    .numero(request.getNumero() != null && !request.getNumero().isBlank() ? request.getNumero().trim() : "S/N")
                    .piso(request.getPiso() != null ? request.getPiso().trim() : null)
                    .nroDepartamento(request.getDepartamento() != null ? request.getDepartamento().trim() : null)
                    .localidad(localidad)
                    .build();
            return direccionRepository.save(nuevaDireccion);
        }

        // Si no se envía información, vincular a la primera localidad por defecto
        Localidad fallbackLocalidad = resolveLocalidad(null);
        Direccion fallbackDireccion = Direccion.builder()
                .calle("Sin especificar")
                .numero("S/N")
                .localidad(fallbackLocalidad)
                .build();
        return direccionRepository.save(fallbackDireccion);
    }

    private Localidad resolveLocalidad(Long localidadId) {
        if (localidadId != null) {
            return localidadRepository.findById(localidadId)
                    .orElseThrow(() -> new ResourceNotFoundException("Localidad no encontrada con ID: " + localidadId));
        }
        // Fallback a primera localidad existente
        List<Localidad> localidades = localidadRepository.findAll();
        if (!localidades.isEmpty()) {
            return localidades.get(0);
        }
        throw new BadRequestException("No existen localidades configuradas en el sistema para asociar la dirección.");
    }

    public DireccionResponse mapToResponse(Direccion direccion) {
        LocalidadResponse localidadResponse = null;
        if (direccion.getLocalidad() != null) {
            Localidad loc = direccion.getLocalidad();
            DepartamentoResponse deptoResponse = null;
            if (loc.getDepartamento() != null) {
                PaisResponse paisResponse = null;
                if (loc.getDepartamento().getPais() != null) {
                    paisResponse = new PaisResponse(
                            loc.getDepartamento().getPais().getId(),
                            loc.getDepartamento().getPais().getNombre(),
                            loc.getDepartamento().getPais().getCodigo()
                    );
                }
                deptoResponse = new DepartamentoResponse(
                        loc.getDepartamento().getId(),
                        loc.getDepartamento().getNombre(),
                        paisResponse
                );
            }
            localidadResponse = new LocalidadResponse(
                    loc.getId(),
                    loc.getNombre(),
                    loc.getCodigoPostal(),
                    deptoResponse
            );
        }

        return new DireccionResponse(
                direccion.getId(),
                direccion.getCalle(),
                direccion.getNumero(),
                direccion.getPiso(),
                direccion.getNroDepartamento(),
                localidadResponse
        );
    }
}
