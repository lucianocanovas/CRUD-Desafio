# 🏆 Concurso ABM - Backend API REST (Spring Boot)

Backend robusto, modular y seguro desarrollado para el **Concurso ABM**, diseñado con **Arquitectura en Capas**, **Patrón de Diseño Plantilla (Template Method)**, **Spring Security 6 con JWT y OAuth2 (Google/Auth0)**, validaciones completas y persistencia en base de datos **SQLite** (archivo local persistente) y **MySQL** (producción en Don Web).

---

## 📋 Puntos Evaluados y Cumplimiento

| Criterio Evaluado | Implementación en este Backend |
| :--- | :--- |
| **1. División en Capas** | `Controller` ➔ `Service` (Interfaces e Impl) ➔ `Repository` (Spring Data JPA) ➔ `Entity` (Persona / Usuario) + Capa DTO y Capa de Patrones (`pattern.template`). |
| **2. FrontEnd React (API Ready)** | Configuración **CORS global** habilitando cualquier puerto de desarrollo (`http://localhost:5173`, `http://localhost:3000`) con soporte para tokens Bearer. Respuestas estándar `ApiResponse<T>`. |
| **3. Patrones de Diseño** | **Patrón Plantilla (Template Method)** implementado en `AbstractAccountOperationTemplate` con 3 concreciones: Registro, Modificación de Perfil y Cambio de Clave. **Patrón Creacional Builder** implementado en `Persona`, `Usuario` y DTOs. |
| **4. Validaciones** | Bean Validation (`@NotBlank`, `@Email`, `@Pattern` para DNI numérico, `@Past` para fecha de nacimiento, `@Size` para contraseñas) + Validaciones de reglas de negocio en la plantilla (unicidad de email y DNI, verificación de clave actual con BCrypt). |
| **5. Distinción Persona / Usuario** | **Persona** (`nombre`, `apellido`, `dni`, `fechaNacimiento`, `direccion`) y **Usuario** (`email`, `password`, `rol`, `authProvider`, `activo`) vinculados mediante relación `@OneToOne`. |
| **6. Seguridad (JWT + OAuth/Google)** | Spring Security 6 stateless con `JwtAuthenticationFilter`, encriptación de contraseñas con **BCrypt** y soporte para login OAuth (Google/Auth0). **Permite a usuarios de Google establecer y cambiar su propia clave local.** |
| **7. Persistencia SQLite y Deploy** | Base de datos **SQLite** (`usuariodb.db`) que persiste los datos en disco al apagar el servidor. Perfil `prod` configurado para MySQL en Don Web. |

---

## 💾 Persistencia en Base de Datos (SQLite)

La aplicación utiliza **SQLite** como motor de persistencia relacional local:
- **Archivo de base de datos**: `usuariodb.db` (generado automáticamente en la raíz del proyecto).
- **Persistencia real**: Todos los registros de usuarios y personas quedan guardados en disco; al reiniciar la aplicación, los datos **no se borran**.
- **Driver y Dialecto**: `org.sqlite.JDBC` con `org.hibernate.community.dialect.SQLiteDialect` (Hibernate 6).
- **Inspección de datos**: Puedes abrir `usuariodb.db` con cualquier visor como **DB Browser for SQLite** o extensiones de VS Code / IntelliJ para ver las tablas `personas` y `usuarios`.

---

## 🔑 Gestión de Contraseña para Usuarios de Google / OAuth

Cuando un usuario inicia sesión por primera vez con **Google** o **Auth0**:
1. Se auto-registra en la base de datos con su `Persona` y `Usuario` (`authProvider: GOOGLE`).
2. Para cambiar o establecer su contraseña (`PUT /api/profile/change-password`):
   - **No se le exige contraseña previa**, ya que al ingresar con Google no poseía una clave local conocida.
   - Envía su `newPassword` y `confirmPassword`.
   - El **Patrón Plantilla** detecta que proviene de Google/OAuth, valida la nueva clave, la encripta con BCrypt y la guarda.
3. **Doble beneficio**: Una vez establecida la clave, el usuario puede seguir iniciando sesión con Google O ingresar mediante el formulario tradicional con su email y su nueva contraseña (`POST /api/auth/login`).

---

## 🚀 Cómo Ejecutar el Backend

### Opción Rápida (Doble clic):
Ejecuta el archivo `run.bat` ubicado en la raíz del proyecto.

### Opción desde Terminal:
```bash
# Con OpenJDK 21
java -jar target/usuario-service-1.0.0-SNAPSHOT.jar
```

### URLs Clave:
- **API Base**: `http://localhost:8080/api`
- **Documentación Interactiva Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

---

## 👥 Credenciales Demo Precargadas

Al iniciar por primera vez, la aplicación carga automáticamente dos usuarios en `usuariodb.db`:

1. **Usuario Normal**: `usuario@concurso.com` / `usuario123` (Juan Pérez, DNI: 38123456)
2. **Administrador**: `admin@concurso.com` / `admin123`

---

## 📡 Endpoints Principales para React

| Acción | Método y Ruta | Body / Header |
| :--- | :--- | :--- |
| **Registrar** | `POST /api/auth/register` | `{"email", "password", "nombre", "apellido", "dni", "fechaNacimiento", "direccion"}` |
| **Login Tradicional** | `POST /api/auth/login` | `{"email", "password"}` ➔ Devuelve JWT Bearer |
| **Login Google / Auth0** | `POST /api/auth/oauth-login` | `{"email", "nombre", "apellido", "provider": "GOOGLE"}` |
| **1. Ver Perfil** | `GET /api/profile` | Header `Authorization: Bearer <token>` |
| **1. Modificar Perfil** | `PUT /api/profile` | Header `Authorization: Bearer <token>` + `{"nombre", "apellido", "dni", "fechaNacimiento", "direccion"}` |
| **2. Cambiar Clave** | `PUT /api/profile/change-password` | Header `Authorization: Bearer <token>` + `{"currentPassword": "...", "newPassword": "...", "confirmPassword": "..."}` *(currentPassword opcional si es cuenta de Google)* |
| **Listar Usuarios** | `GET /api/users` | Header `Authorization: Bearer <token>` (Devuelve array de perfiles para tabla React) |
| **Eliminar Usuario** | `DELETE /api/users/{id}` | Header `Authorization: Bearer <token>` |

> [!TIP]
> Consulta la guía de integración completa con componentes React listos para copiar y pegar en: **[`GUIA_INTEGRACION_FRONTEND.md`](./GUIA_INTEGRACION_FRONTEND.md)**.
