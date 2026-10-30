package com.concurso.usuario.controller;

import com.concurso.usuario.dto.request.DireccionRequest;
import com.concurso.usuario.dto.response.ApiResponse;
import com.concurso.usuario.dto.response.DireccionResponse;
import com.concurso.usuario.service.DireccionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/direcciones")
@Tag(name = "6. Direcciones", description = "Endpoints CRUD para la gestión de Direcciones físicas")
public class DireccionController {

    private final DireccionService direccionService;

    public DireccionController(DireccionService direccionService) {
        this.direccionService = direccionService;
    }

    @GetMapping
    @Operation(summary = "Listar todas las direcciones", description = "Devuelve la lista completa de direcciones registradas con su localidad, departamento y país.")
    public ResponseEntity<ApiResponse<List<DireccionResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok("Listado de direcciones obtenido con éxito.", direccionService.getAll()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener dirección por ID", description = "Devuelve los datos de una dirección por su identificador único.")
    public ResponseEntity<ApiResponse<DireccionResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Dirección obtenida con éxito.", direccionService.getById(id)));
    }

    @PostMapping
    @Operation(summary = "Crear nueva dirección", description = "Registra una nueva dirección asociada a una localidad.")
    public ResponseEntity<ApiResponse<DireccionResponse>> create(@Valid @RequestBody DireccionRequest request) {
        DireccionResponse response = direccionService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Dirección creada exitosamente.", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modificar dirección", description = "Actualiza los datos de una dirección existente.")
    public ResponseEntity<ApiResponse<DireccionResponse>> update(@PathVariable Long id, @Valid @RequestBody DireccionRequest request) {
        DireccionResponse response = direccionService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Dirección actualizada exitosamente.", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar dirección", description = "Elimina una dirección por su ID.")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        direccionService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Dirección eliminada exitosamente."));
    }
}
