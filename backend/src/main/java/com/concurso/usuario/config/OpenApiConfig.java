package com.concurso.usuario.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Concurso ABM - API REST de Gestión de Usuarios y Autenticación",
                version = "1.0.0",
                description = "### Documentación Oficial de la API REST para el Concurso ABM\n\n" +
                        "**Puntos Clave Evaluados:**\n" +
                        "- **División en Capas**: Controller -> Service -> Repository -> Entity / DTOs.\n" +
                        "- **Patrón Plantilla (Template Method)**: Aplicado en Registración, Modificación de Perfil y Cambio de Contraseña.\n" +
                        "- **Seguridad**: Spring Security 6, JWT Bearer Token y soporte OAuth2 (Auth0 / Google).\n" +
                        "- **Distinción Persona vs Usuario**: Persona física separada de la cuenta de acceso.\n" +
                        "- **Integración FrontEnd React**: Compatible con `@auth0/auth0-react` y CORS habilitado.",
                contact = @Contact(
                        name = "Equipo Chocolate Block Gigante",
                        email = "concurso@block.com"
                ),
                license = @License(name = "Uso Académico / Concurso ABM")
        ),
        servers = {
                @Server(url = "http://localhost:8080", description = "Servidor Local de Desarrollo"),
                @Server(url = "https://tudominio.donweb.com", description = "Servidor de Producción Don Web")
        },
        tags = {
                @Tag(name = "1. Autenticación y Registro", description = "Endpoints públicos para registro, login tradicional y autenticación OAuth2 / Auth0"),
                @Tag(name = "2. Perfil de Usuario", description = "Endpoints protegidos por JWT: Opción 1 (Ver y modificar datos de la Persona) y Opción 2 (Cambio de contraseña con BCrypt)"),
                @Tag(name = "3. Monitoreo", description = "Endpoint de salud del backend para verificación de conexión desde React")
        }
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        bearerFormat = "JWT",
        scheme = "bearer",
        description = "Ingrese el token JWT obtenido en el login o registro (sin escribir 'Bearer ', solo el token)"
)
public class OpenApiConfig {
}
