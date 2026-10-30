# 🏆 Concurso ABM - Backend API REST (Spring Boot)

Backend modular, escalable y seguro desarrollado para el **Concurso ABM**, diseñado con **Arquitectura en Capas**, **Patrón de Diseño Plantilla (Template Method)**, **Spring Security 6 con JWT y OAuth2 (Google/Auth0)**, modelado relacional completo de **Direcciones Geográficas** (País, Departamento, Localidad y Dirección) y persistencia en base de datos **SQLite** (archivo local persistente) y **MySQL** (producción en Don Web).

---

## 📋 Puntos Evaluados y Cumplimiento

| Criterio Evaluado | Implementación en este Backend |
| :--- | :--- |
| **1. División en Capas** | `Controller` ➔ `Service` (Interfaces e Impl) ➔ `Repository` (Spring Data JPA) ➔ `Entity` (Usuario, Persona, Direccion, Localidad, Departamento, Pais) + Capa DTO y Capa de Patrones (`pattern.template`). |
| **2. FrontEnd React (API Ready)** | Configuración **CORS global** habilitando cualquier puerto de desarrollo (`http://localhost:5173`, `http://localhost:3000`) con soporte para tokens Bearer. Respuestas estándar `ApiResponse<T>`. |
| **3. Patrones de Diseño** | **Patrón Plantilla (Template Method)** implementado en `AbstractAccountOperationTemplate` con 3 concreciones: Registro, Modificación de Perfil y Cambio de Clave. **Patrón Creacional Builder** implementado en todas las entidades de dominio y DTOs. |
| **4. Validaciones** | Bean Validation (`@NotBlank`, `@Email`, `@Pattern` para DNI numérico, `@Past` para fecha de nacimiento, `@Size` para contraseñas) + Validaciones de reglas de negocio en la plantilla (unicidad de email y DNI, verificación de clave actual con BCrypt). |
| **5. Modelo de Dominio y Direcciones** | **Persona** (`nombre`, `apellido`, `dni`, `fechaNacimiento`, `direccion`) y **Usuario** (`email`, `password`, `authProvider`, `activo`) vinculados mediante relación `@OneToOne`. Modelado completo de direcciones: `Pais` ➔ `Departamento` ➔ `Localidad` ➔ `Direccion`. |
| **6. Sin Roles ni Admin** | El sistema no maneja roles ni usuarios administradores. Solo usuarios normales que se registran e inician sesión. Las **únicas páginas/rutas a restringir son las del perfil y la contraseña** (`/api/profile/**`). Todas las demás son de libre acceso. |
| **7. Persistencia SQLite y Deploy** | Base de datos **SQLite** (`usuariodb.db`) que persiste los datos en disco al apagar el servidor. Perfil `prod` configurado para MySQL en Don Web. |

---

## 🗺️ Modelo Relacional de Direcciones

El sistema cuenta con un catálogo geográfico completamente estructurado:
- **`Pais`**: ID, nombre, código ISO.
- **`Departamento`**: ID, nombre, relación con `Pais`.
- **`Localidad`**: ID, nombre, código postal, relación con `Departamento`.
- **`Direccion`**: ID, calle, número, piso, departamento, relación con `Localidad`.
- **`Persona`**: Vinculada con clave foránea a `Direccion`.

Cada entidad cuenta con su respectivo **Controlador REST CRUD**, servicio y repositorio.

---

## 🚀 Cómo Ejecutar el Backend

### Opción Rápida (Doble clic):
Ejecuta el archivo `run.bat` ubicado en la raíz del proyecto.

### Opción desde Terminal:
```bash
java -jar target/usuario-service-1.0.0-SNAPSHOT.jar
```

### URLs Clave:
- **API Base**: `http://localhost:8080/api`
- **Documentación Interactiva Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

---

## 👤 Credenciales Demo Precargadas

Al iniciar por primera vez, la aplicación carga automáticamente un catálogo geográfico y un usuario demo:
- **Email**: `usuario@concurso.com`
- **Contraseña**: `usuario123`
- **Persona**: Juan Pérez (DNI: 38123456)
- **Dirección**: Av. San Martín 742, Piso 4 Dpto B, Ciudad de Mendoza, Capital, Argentina.
