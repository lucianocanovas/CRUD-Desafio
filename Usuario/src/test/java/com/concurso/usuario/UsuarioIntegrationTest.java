package com.concurso.usuario;

import com.concurso.usuario.dto.request.ChangePasswordRequest;
import com.concurso.usuario.dto.request.DepartamentoRequest;
import com.concurso.usuario.dto.request.DireccionRequest;
import com.concurso.usuario.dto.request.LocalidadRequest;
import com.concurso.usuario.dto.request.LoginRequest;
import com.concurso.usuario.dto.request.OAuthLoginRequest;
import com.concurso.usuario.dto.request.PaisRequest;
import com.concurso.usuario.dto.request.ProfileUpdateRequest;
import com.concurso.usuario.dto.request.RegisterRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class UsuarioIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("1. Health Check debe responder 200 OK")
    void testHealthCheck() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("2. Flujo completo: Registro -> Login -> Opción 1 (Perfil) -> Opción 2 (Cambio Clave) [Sin roles]")
    void testFullUserFlow() throws Exception {
        // --- PASO 1: REGISTRAR USUARIO (CON PERSONA Y DIRECCION) ---
        RegisterRequest registerReq = new RegisterRequest(
                "maria.becerra@concurso.com",
                "ClaveSecreta123",
                "María",
                "Becerra",
                "41999888",
                LocalDate.of(2000, 2, 12),
                "Calle 13 Nro 500"
        );

        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("maria.becerra@concurso.com"))
                .andExpect(jsonPath("$.data.nombre").value("María"))
                .andExpect(jsonPath("$.data.apellido").value("Becerra"))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andReturn();

        // --- PASO 2: LOGIN TRADICIONAL ---
        LoginRequest loginReq = new LoginRequest("maria.becerra@concurso.com", "ClaveSecreta123");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andReturn();

        JsonNode loginJson = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String token = loginJson.get("data").get("token").asText();
        String authHeader = "Bearer " + token;

        // --- OPCIÓN 1: VER PERFIL ---
        mockMvc.perform(get("/api/profile")
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("maria.becerra@concurso.com"))
                .andExpect(jsonPath("$.data.persona.nombre").value("María"))
                .andExpect(jsonPath("$.data.persona.apellido").value("Becerra"))
                .andExpect(jsonPath("$.data.persona.dni").value("41999888"))
                .andExpect(jsonPath("$.data.persona.direccion.calle").value("Calle 13 Nro 500"));

        // --- OPCIÓN 1: MODIFICAR DATOS DEL PERFIL ---
        ProfileUpdateRequest updateReq = new ProfileUpdateRequest(
                "María Emilia",
                "Becerra Modificada",
                "41999888",
                LocalDate.of(2000, 2, 12),
                "Nueva Dirección 999"
        );

        mockMvc.perform(put("/api/profile")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.persona.nombre").value("María Emilia"))
                .andExpect(jsonPath("$.data.persona.apellido").value("Becerra Modificada"))
                .andExpect(jsonPath("$.data.persona.direccion.calle").value("Nueva Dirección 999"));

        // --- OPCIÓN 2: CAMBIAR LA CLAVE (Y QUE FUNCIONE) ---
        // A) Intentar cambiar con contraseña actual incorrecta -> debe fallar con 400
        ChangePasswordRequest wrongPassReq = new ChangePasswordRequest(
                "ClaveIncorrecta",
                "NuevaClave456",
                "NuevaClave456"
        );
        mockMvc.perform(put("/api/profile/change-password")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongPassReq)))
                .andExpect(status().isBadRequest());

        // B) Cambiar con contraseña actual correcta -> debe ser exitoso
        ChangePasswordRequest correctPassReq = new ChangePasswordRequest(
                "ClaveSecreta123",
                "NuevaClave456",
                "NuevaClave456"
        );
        mockMvc.perform(put("/api/profile/change-password")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(correctPassReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // C) Verificar que la clave anterior ya NO funciona
        LoginRequest oldLoginReq = new LoginRequest("maria.becerra@concurso.com", "ClaveSecreta123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(oldLoginReq)))
                .andExpect(status().isUnauthorized());

        // D) Verificar que la NUEVA clave SÍ funciona
        LoginRequest newLoginReq = new LoginRequest("maria.becerra@concurso.com", "NuevaClave456");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLoginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty());
    }

    @Test
    @DisplayName("3. Login Demo inicializado por DataInitializer debe funcionar")
    void testDemoUserLogin() throws Exception {
        LoginRequest loginReq = new LoginRequest("usuario@concurso.com", "usuario123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.nombre").value("Juan"))
                .andExpect(jsonPath("$.data.token").isNotEmpty());
    }

    @Test
    @DisplayName("4. Usuario de Google/OAuth debe poder establecer o cambiar su contraseña sin clave actual")
    void testGoogleUserPasswordChange() throws Exception {
        OAuthLoginRequest googleReq = new OAuthLoginRequest(
                "google.user@gmail.com",
                "Google",
                "User",
                "45111222",
                LocalDate.of(1998, 7, 20),
                "Google Street 100",
                "GOOGLE",
                "google-id-12345"
        );

        MvcResult oauthResult = mockMvc.perform(post("/api/auth/oauth-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(googleReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andReturn();

        String token = objectMapper.readTree(oauthResult.getResponse().getContentAsString())
                .get("data").get("token").asText();

        ChangePasswordRequest setPasswordReq = new ChangePasswordRequest(
                null,
                "MiNuevaClaveGoogle2026",
                "MiNuevaClaveGoogle2026"
        );

        mockMvc.perform(put("/api/profile/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(setPasswordReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        LoginRequest loginReq = new LoginRequest("google.user@gmail.com", "MiNuevaClaveGoogle2026");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty());
    }

    @Test
    @DisplayName("5. CRUD de Países, Departamentos, Localidades y Direcciones")
    void testGeographicalEntitiesCrud() throws Exception {
        // A) Crear País
        PaisRequest paisReq = new PaisRequest("Uruguay", "UY");
        MvcResult paisResult = mockMvc.perform(post("/api/paises")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(paisReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.nombre").value("Uruguay"))
                .andReturn();

        Long paisId = objectMapper.readTree(paisResult.getResponse().getContentAsString()).get("data").get("id").asLong();

        // B) Crear Departamento
        DepartamentoRequest deptoReq = new DepartamentoRequest("Montevideo", paisId);
        MvcResult deptoResult = mockMvc.perform(post("/api/departamentos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(deptoReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.nombre").value("Montevideo"))
                .andReturn();

        Long deptoId = objectMapper.readTree(deptoResult.getResponse().getContentAsString()).get("data").get("id").asLong();

        // C) Crear Localidad
        LocalidadRequest locReq = new LocalidadRequest("Centro", "11100", deptoId);
        MvcResult locResult = mockMvc.perform(post("/api/localidades")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(locReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.nombre").value("Centro"))
                .andReturn();

        Long locId = objectMapper.readTree(locResult.getResponse().getContentAsString()).get("data").get("id").asLong();

        // D) Crear Dirección
        DireccionRequest dirReq = new DireccionRequest("Av. 18 de Julio", "1020", "3", "A", locId);
        MvcResult dirResult = mockMvc.perform(post("/api/direcciones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dirReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.calle").value("Av. 18 de Julio"))
                .andExpect(jsonPath("$.data.numero").value("1020"))
                .andExpect(jsonPath("$.data.localidad.nombre").value("Centro"))
                .andReturn();

        Long dirId = objectMapper.readTree(dirResult.getResponse().getContentAsString()).get("data").get("id").asLong();

        // E) Listar todas las direcciones
        mockMvc.perform(get("/api/direcciones"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());

        // F) Obtener dirección por ID
        mockMvc.perform(get("/api/direcciones/" + dirId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(dirId));
    }
}
