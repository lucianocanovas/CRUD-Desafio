# 📘 MANUAL TÉCNICO Y DOCUMENTACIÓN INTEGRAL DEL BACKEND
## Concurso ABM - Sistema de Usuarios, Perfiles, SQLite y Seguridad JWT/OAuth

---

## 📑 ÍNDICE
1. [Resumen Ejecutivo y Cumplimiento de Consignas](#1-resumen-ejecutivo-y-cumplimiento-de-consignas)
2. [Arquitectura en Capas (MVC Modificado)](#2-arquitectura-en-capas-mvc-modificado)
3. [Patrones de Diseño Implementados](#3-patrones-de-diseño-implementados)
   - Patrón Plantilla (Template Method Pattern)
   - Patrón Creacional Builder
4. [Modelo de Dominio: Distinción Persona vs Usuario](#4-modelo-de-dominio-distinción-persona-vs-usuario)
5. [Seguridad, JWT y Gestión de Contraseñas (Cuentas Locales y Google/OAuth)](#5-seguridad-jwt-y-gestión-de-contraseñas-cuentas-locales-y-googleoauth)
6. [Persistencia en Base de Datos SQLite](#6-persistencia-en-base-de-datos-sqlite)
7. [Catálogo Completo de Endpoints de la API](#7-catálogo-completo-de-endpoints-de-la-api)
8. [Cómo Probar Todo el Backend sin el Frontend](#8-cómo-probar-todo-el-backend-sin-el-frontend)
9. [Despliegue en Producción (Don Web / MySQL)](#9-despliegue-en-producción-don-web--mysql)

---

## 1. RESUMEN EJECUTIVO Y CUMPLIMIENTO DE CONSIGNAS

El presente backend fue construido bajo las exigencias del **Concurso ABM**:
- **División en capas**: Controlador REST, Servicios de Negocio, Plantillas de Comportamiento, Repositorios JPA y Entidades de Dominio.
- **Patrones de diseño**: **Patrón Plantilla (Template Method)** en las operaciones de cuenta (Registro, Perfil y Cambio de Password) y **Patrón Builder**.
- **Distinción Persona vs Usuario**: Entidad `Persona` física desacoplada de la entidad `Usuario` mediante `@OneToOne`.
- **Persistencia SQLite**: Base de datos basada en archivo (`usuariodb.db`) que persiste la información entre reinicios del servidor.
- **Flujo de Usuario del Concurso**:
  - **1ro Login**: Autenticación tradicional (email/password) o mediante OAuth2 (Auth0 / Google).
  - **2do Opciones tras login**:
    - **Opción 1 (Perfil)**: Ver y modificar datos personales.
    - **Opción 2 (Cambio de clave)**: Cambio seguro de contraseña con BCrypt tanto para usuarios locales como para usuarios que ingresaron con Google.

---

## 2. ARQUITECTURA EN CAPAS (MVC MODIFICADO)

```
com.concurso.usuario
├── controller         # Capa de Entrada / REST API (Endpoints HTTP)
├── service            # Capa de Lógica de Negocio (Interfaces e Impl)
├── pattern.template   # Capa de Patrón Plantilla (Template Method Pattern)
├── repository         # Capa de Persistencia (Spring Data JPA)
├── entity             # Capa de Modelo / Entidades de Base de Datos
├── dto                # Capa de Transferencia de Datos (Requests y Responses)
├── security           # Capa de Seguridad Spring Security 6 & JWT
├── config             # Configuraciones (Security, Cors, OpenApi Swagger, SQLite DataInitializer)
└── exception          # Manejo global de excepciones (@RestControllerAdvice)
```

---

## 3. PATRONES DE DISEÑO IMPLEMENTADOS

### A) Patrón de Comportamiento: Plantilla (Template Method Pattern)
Define los pasos invariables de un algoritmo en una clase base (`AbstractAccountOperationTemplate`), obligando a las subclases a implementar la lógica particular sin alterar el flujo general:
1. `validateBusinessRules(request, userId)`
2. `prepare(request, userId)`
3. `processOperation(request, userId)`
4. `postProcess(request, result, userId)`

- **Subclases Concretas**:
  1. `UserRegistrationTemplate`: Unicidad de Email/DNI, hash BCrypt y emisión de JWT.
  2. `ProfileUpdateTemplate`: Actualización de datos de la Persona con validación de colisión de DNI.
  3. `PasswordChangeTemplate`: Valida contraseña actual en cuentas locales, permite configuración directa en cuentas Google/OAuth, verifica igualdad y almacena hash BCrypt.

### B) Patrón Creacional: Builder
Implementado en `Persona`, `Usuario` y DTOs para evitar constructores telescópicos y asegurar legibilidad.

---

## 4. MODELO DE DOMINIO: DISTINCIÓN PERSONA VS USUARIO

```
┌───────────────────────────┐          ┌───────────────────────────┐
│          USUARIO          │          │          PERSONA          │
├───────────────────────────┤          ├───────────────────────────┤
│ Long id                   │ 1      1 │ Long id                   │
│ String email (Unique)     ├──────────┤ String nombre             │
│ String password (BCrypt)  │          │ String apellido           │
│ Rol rol                   │          │ String dni (Unique)       │
│ AuthProvider authProvider │          │ LocalDate fechaNacimiento │
│ Boolean activo            │          │ String direccion          │
│ LocalDateTime createdAt   │          └───────────────────────────┘
│ LocalDateTime updatedAt   │
└───────────────────────────┘
```

---

## 5. SEGURIDAD, JWT Y GESTIÓN DE CONTRASEÑAS (CUENTAS LOCALES Y GOOGLE/OAUTH)

### Autenticación con Google y Cambio de Contraseña
1. Cuando un usuario inicia sesión con **Google** (`POST /api/auth/oauth-login`):
   - Se crea su registro con `authProvider = GOOGLE` y una clave segura temporal.
2. Al ir a la **Opción 2 (Cambiar Contraseña)** (`PUT /api/profile/change-password`):
   - El usuario **NO conoce su clave temporal de Google**.
   - Por ello, el campo `currentPassword` es **opcional** para cuentas de Google.
   - El backend valida la nueva contraseña (`newPassword` y `confirmPassword`), la encripta con BCrypt y la actualiza.
3. **Acceso Dual**: Una vez establecida la contraseña, el usuario puede continuar ingresando con el botón de Google O iniciar sesión mediante el formulario tradicional con su email y su nueva clave.

---

## 6. PERSISTENCIA EN BASE DE DATOS SQLITE

El sistema utiliza **SQLite** para persistir los datos en disco:
- **Archivo de base de datos**: `usuariodb.db` (en la raíz del proyecto).
- **Persistencia**: Los datos **no se pierden** al detener o reiniciar la aplicación.
- **Configuración en `application.properties`**:
  ```properties
  spring.datasource.url=jdbc:sqlite:usuariodb.db
  spring.datasource.driver-class-name=org.sqlite.JDBC
  spring.jpa.database-platform=org.hibernate.community.dialect.SQLiteDialect
  spring.jpa.hibernate.ddl-auto=update
  ```
- **Inspección de datos**: Se puede abrir el archivo `usuariodb.db` con cualquier herramienta externa como **DB Browser for SQLite**, DBeaver o la consola de SQLite para consultar las tablas `personas` y `usuarios`.

---

## 7. CATÁLOGO COMPLETO DE ENDPOINTS DE LA API

| Método | Endpoint | Cabecera | Descripción |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Ninguna | Registro de Persona + Usuario con Patrón Plantilla |
| **POST** | `/api/auth/login` | Ninguna | 1ro: Login tradicional email y clave (retorna JWT) |
| **POST** | `/api/auth/oauth-login` | Ninguna | Login con Google / Auth0 |
| **GET** | `/api/auth/check-token` | `Bearer <token>` | Verifica vigencia de la sesión |
| **GET** | `/api/profile` | `Bearer <token>` | 2do Opción 1: Ver perfil (Persona + Usuario) |
| **PUT** | `/api/profile` | `Bearer <token>` | 2do Opción 1: Modificar datos personales |
| **PUT** | `/api/profile/change-password`| `Bearer <token>` | 2do Opción 2: Cambiar clave (locales y Google) |
| **DELETE** | `/api/profile` | `Bearer <token>` | Baja de la cuenta propia |
| **GET** | `/api/users` | `Bearer <token>` | Grilla ABM: Listar todos los usuarios para React |
| **DELETE** | `/api/users/{id}` | `Bearer <token>` | Grilla ABM: Eliminar usuario por ID |
| **GET** | `/api/health` | Ninguna | Health Check del servicio |

---

## 8. CÓMO PROBAR TODO EL BACKEND SIN EL FRONTEND

1. **Swagger UI**: Abre [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) en tu navegador.
2. **Script PowerShell**: Ejecuta `.\test-api.ps1` en la consola para una corrida automatizada completa en 3 segundos.
3. **Tests de Maven**: Ejecuta `mvn test`.

---

## 9. DESPLIEGUE EN PRODUCCIÓN (DON WEB / MYSQL)

Para desplegar en Don Web con MySQL:
```bash
java -jar -Dspring.profiles.active=prod \
  -DDB_HOST=mysql.tudominio.com \
  -DDB_PORT=3306 \
  -DDB_NAME=usuariodb \
  -DDB_USER=root \
  -DDB_PASSWORD=tu_password \
  target/usuario-service-1.0.0-SNAPSHOT.jar
```
