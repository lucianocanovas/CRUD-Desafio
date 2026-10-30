package com.concurso.usuario.controller;

import com.concurso.usuario.dto.request.DepartamentoRequest;
import com.concurso.usuario.dto.response.ApiResponse;
import com.concurso.usuario.dto.response.DepartamentoResponse;
import com.concurso.usuario.service.DepartamentoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departamentos")
@Tag(name = "4. Departamentos", description = "Endpoints CRUD para la gestión de Departamentos / Provincias")
public class DepartamentoController {

    private final DepartamentoService departamentoService;

    public DepartamentoController(DepartamentoService departamentoService) {
        this.departamentoService = departamentoService;
    }

    @GetMapping
    @Operation(summary = "Listar todos los departamentos", description = "Devuelve departamentos, opcionalmente filtrados por país.")
    public ResponseEntity<ApiResponse<List<DepartamentoResponse>>> getAll(
            @RequestParam(required = false) Long paisId) {
        List<DepartamentoResponse> list = (paisId != null)
                ? departamentoService.getByPaisId(paisId)
                : departamentoService.getAll();
        return ResponseEntity.ok(ApiResponse.ok("Listado de departamentos obtenido con éxito.", list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener departamento por ID", description = "Devuelve los datos de un departamento por su ID.")
    public ResponseEntity<ApiResponse<DepartamentoResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Departamento obtenido con éxito.", departamentoService.getById(id)));
    }

    @PostMapping
    @Operation(summary = "Crear nuevo departamento", description = "Registra un nuevo departamento asociado a un país.")
    public ResponseEntity<ApiResponse<DepartamentoResponse>> create(@Valid @RequestBody DepartamentoRequest request) {
        DepartamentoResponse response = departamentoService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Departamento creado exitosamente.", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modificar departamento", description = "Actualiza los datos de un departamento existente.")
    public ResponseEntity<ApiResponse<DepartamentoResponse>> update(@PathVariable Long id, @Valid @RequestBody DepartamentoRequest request) {
        DepartamentoResponse response = departamentoService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Departamento actualizado exitosamente.", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar departamento", description = "Elimina un departamento por su ID.")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        departamentoService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Departamento eliminado exitosamente."));
    }
}
