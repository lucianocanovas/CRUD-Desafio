package com.concurso.usuario.controller;

import com.concurso.usuario.dto.request.PaisRequest;
import com.concurso.usuario.dto.response.ApiResponse;
import com.concurso.usuario.dto.response.PaisResponse;
import com.concurso.usuario.service.PaisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/paises")
@Tag(name = "3. Países", description = "Endpoints CRUD para la gestión de Países")
public class PaisController {

    private final PaisService paisService;

    public PaisController(PaisService paisService) {
        this.paisService = paisService;
    }

    @GetMapping
    @Operation(summary = "Listar todos los países", description = "Devuelve la lista completa de países registrados.")
    public ResponseEntity<ApiResponse<List<PaisResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok("Listado de países obtenido con éxito.", paisService.getAll()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener país por ID", description = "Devuelve los datos de un país por su identificador único.")
    public ResponseEntity<ApiResponse<PaisResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("País obtenido con éxito.", paisService.getById(id)));
    }

    @PostMapping
    @Operation(summary = "Crear nuevo país", description = "Registra un nuevo país en el sistema.")
    public ResponseEntity<ApiResponse<PaisResponse>> create(@Valid @RequestBody PaisRequest request) {
        PaisResponse response = paisService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("País creado exitosamente.", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modificar país", description = "Actualiza los datos de un país existente.")
    public ResponseEntity<ApiResponse<PaisResponse>> update(@PathVariable Long id, @Valid @RequestBody PaisRequest request) {
        PaisResponse response = paisService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok("País actualizado exitosamente.", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar país", description = "Elimina un país por su ID.")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        paisService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("País eliminado exitosamente."));
    }
}
