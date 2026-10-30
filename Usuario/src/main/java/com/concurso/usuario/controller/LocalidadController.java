package com.concurso.usuario.controller;

import com.concurso.usuario.dto.request.LocalidadRequest;
import com.concurso.usuario.dto.response.ApiResponse;
import com.concurso.usuario.dto.response.LocalidadResponse;
import com.concurso.usuario.service.LocalidadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/localidades")
@Tag(name = "5. Localidades", description = "Endpoints CRUD para la gestión de Localidades")
public class LocalidadController {

    private final LocalidadService localidadService;

    public LocalidadController(LocalidadService localidadService) {
        this.localidadService = localidadService;
    }

    @GetMapping
    @Operation(summary = "Listar todas las localidades", description = "Devuelve localidades, opcionalmente filtradas por departamento.")
    public ResponseEntity<ApiResponse<List<LocalidadResponse>>> getAll(
            @RequestParam(required = false) Long departamentoId) {
        List<LocalidadResponse> list = (departamentoId != null)
                ? localidadService.getByDepartamentoId(departamentoId)
                : localidadService.getAll();
        return ResponseEntity.ok(ApiResponse.ok("Listado de localidades obtenido con éxito.", list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener localidad por ID", description = "Devuelve los datos de una localidad por su ID.")
    public ResponseEntity<ApiResponse<LocalidadResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Localidad obtenida con éxito.", localidadService.getById(id)));
    }

    @PostMapping
    @Operation(summary = "Crear nueva localidad", description = "Registra una nueva localidad asociada a un departamento.")
    public ResponseEntity<ApiResponse<LocalidadResponse>> create(@Valid @RequestBody LocalidadRequest request) {
        LocalidadResponse response = localidadService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Localidad creada exitosamente.", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modificar localidad", description = "Actualiza los datos de una localidad existente.")
    public ResponseEntity<ApiResponse<LocalidadResponse>> update(@PathVariable Long id, @Valid @RequestBody LocalidadRequest request) {
        LocalidadResponse response = localidadService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Localidad actualizada exitosamente.", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar localidad", description = "Elimina una localidad por su ID.")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        localidadService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Localidad eliminada exitosamente."));
    }
}
