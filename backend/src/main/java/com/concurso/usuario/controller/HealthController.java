package com.concurso.usuario.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@Tag(name = "3. Monitoreo", description = "Verificación de estado del servicio")
public class HealthController {

    @GetMapping
    @Operation(summary = "Comprobar estado del servicio (Health Check)", description = "Devuelve el estado operativo del backend para que React verifique la conexión.")
    @ApiResponse(responseCode = "200", description = "Servicio activo y respondiendo correctamente")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("service", "Concurso ABM - Servicio de Usuarios y Autenticación");
        status.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(status);
    }
}
