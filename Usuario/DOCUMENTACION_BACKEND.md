# 📘 MANUAL TÉCNICO Y DOCUMENTACIÓN INTEGRAL DEL BACKEND
## Concurso ABM - Sistema de Usuarios, Direcciones Geográficas, SQLite y Seguridad JWT/OAuth

---

## 📑 ÍNDICE
1. [Resumen Ejecutivo y Cumplimiento de Consignas](#1-resumen-ejecutivo-y-cumplimiento-de-consignas)
2. [Arquitectura en Capas](#2-arquitectura-en-capas)
3. [Patrones de Diseño Implementados](#3-patrones-de-diseño-implementados)
   - Patrón Plantilla (Template Method Pattern)
   - Patrón Creacional Builder
4. [Modelo de Dominio: Persona, Usuario y Direcciones](#4-modelo-de-dominio-persona-usuario-y-direcciones)
5. [Seguridad y Restricción de Rutas (Sin Roles ni Admin)](#5-seguridad-y-restricción-de-rutas-sin-roles-ni-admin)
6. [Persistencia en Base de Datos SQLite](#6-persistencia-en-base-de-datos-sqlite)
7. [Catálogo Completo de Endpoints de la API](#7-catálogo-completo-de-endpoints-de-la-api)
8. [Cómo Probar Todo el Backend sin el Frontend](#8-cómo-probar-todo-el-backend-sin-el-frontend)
9. [Despliegue en Producción (Don Web / MySQL)](#9-despliegue-en-producción-don-web--mysql)

---

## 1. RESUMEN EJECUTIVO Y CUMPLIMIENTO DE CONSIGNAS

El presente backend fue adaptado según los requerimientos del proyecto:
- **Sin roles ni perfiles de administrador**: Únicamente usuarios que se registran e inician sesión.
- **Rutas restringidas estrictas**: Las **únicas** rutas que requieren autenticación son las del perfil y la del cambio de contraseña (`/api/profile/**`).
- **Modelado relacional de direcciones**: Jerarquía completa normalizada con controladores CRUD completos:
  - `Pais` ➔ `Departamento` ➔ `Localidad` ➔ `Direccion` ➔ vinculada a `Persona`.
- **División en capas**: Controlador REST, Servicios de Negocio, Plantillas de Comportamiento, Repositorios JPA y Entidades de Dominio.
- **Patrones de diseño**: **Patrón Plantilla (Template Method)** en las operaciones de cuenta (Registro, Perfil y Cambio de Password) y **Patrón Builder** en las entidades.
- **Distinción Persona vs Usuario**: Entidad `Persona` física desacoplada de la entidad `Usuario` mediante `@OneToOne`.
- **Persistencia SQLite**: Base de datos basada en archivo (`usuariodb.db`) que persiste la información entre reinicios del servidor.

---

## 2. ARQUITECTURA EN CAPAS

```
com.concurso.usuario
├── controller         # Capa REST API (Auth, Profile, Pais, Departamento, Localidad, Direccion)
├── service            # Capa de Lógica de Negocio e Interfaces (impl)
├── pattern.template   # Capa de Patrón Plantilla (Template Method Pattern)
├── repository         # Capa de Persistencia Spring Data JPA
├── entity             # Capa de Modelo / Entidades (Usuario, Persona, Direccion, Localidad, Departamento, Pais)
├── dto                # Capa DTO (Request / Response) con soporte JSON flexible
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
  1. `UserRegistrationTemplate`: Unicidad de Email/DNI, resolución de Dirección estructurada, hash BCrypt y emisión de JWT.
  2. `ProfileUpdateTemplate`: Actualización de datos de la Persona y Dirección con validación de colisión de DNI.
  3. `PasswordChangeTemplate`: Valida contraseña actual en cuentas locales, permite configuración directa en cuentas Google/OAuth, verifica igualdad y almacena hash BCrypt.

### B) Patrón Creacional: Builder
Implementado en `Pais`, `Departamento`, `Localidad`, `Direccion`, `Persona` y `Usuario`.

---

## 4. MODELO DE DOMINIO: PERSONA, USUARIO Y DIRECCIONES

```
┌───────────────────────────┐         ┌───────────────────────────┐         ┌───────────────────────────┐
│          USUARIO          │         │          PERSONA          │         │         DIRECCION         │
├───────────────────────────┤         ├───────────────────────────┤         ├───────────────────────────┤
│ Long id                   │ 1     1 │ Long id                   │ *     1 │ Long id                   │
│ String email (Unique)     ├─────────┤ String nombre             ├─────────┤ String calle              │
│ String password (BCrypt)  │         │ String apellido           │         │ String numero             │
│ AuthProvider authProvider │         │ String dni (Unique)       │         │ String piso               │
│ Boolean activo            │         │ LocalDate fechaNacimiento │         │ String nroDepartamento    │
│ LocalDateTime createdAt   │         │ Direccion direccion       │         │ Localidad localidad       │
│ LocalDateTime updatedAt   │         └───────────────────────────┘         └─────────────┬─────────────┘
└───────────────────────────┘                                                             │
                                                                                          │ *
                                                                                          │ 1
┌───────────────────────────┐         ┌───────────────────────────┐         ┌─────────────┴─────────────┐
│           PAIS            │ 1     * │       DEPARTAMENTO        │ 1     * │         LOCALIDAD         │
├───────────────────────────┤─────────┤───────────────────────────┤─────────┤───────────────────────────┤
│ Long id                   │         │ Long id                   │         │ Long id                   │
│ String nombre             │         │ String nombre             │         │ String nombre             │
│ String codigo             │         │ Pais pais                 │         │ String codigoPostal       │
└───────────────────────────┘         └───────────────────────────┘         │ Departamento departamento │
                                                                            └───────────────────────────┘
```

---

## 5. SEGURIDAD Y RESTRICCIÓN DE RUTAS (SIN ROLES NI ADMIN)

- **Sin Roles ni Administradores**: Cualquier usuario registrado puede acceder a su propio perfil y opciones de cuenta.
- **Rutas Públicas**:
  - Catálogo de direcciones (`/api/paises/**`, `/api/departamentos/**`, `/api/localidades/**`, `/api/direcciones/**`).
  - Autenticación (`/api/auth/**`).
  - Documentación Swagger (`/swagger-ui/**`, `/v3/api-docs/**`).
  - Monitoreo (`/api/health`).
- **Rutas Restringidas (Requieren JWT en `Authorization: Bearer <token>`)**:
  - `/api/profile/**` (Ver perfil, modificar perfil, cambiar contraseña, baja de cuenta).

---

## 6. PERSISTENCIA EN BASE DE DATOS SQLITE

El sistema utiliza **SQLite** para persistir los datos en disco:
- **Archivo de base de datos**: `usuariodb.db` (en la raíz del proyecto).
- **Persistencia**: Los datos se conservan íntegros al apagar o reiniciar la aplicación.

---

## 7. CATÁLOGO COMPLETO DE ENDPOINTS DE LA API

| Método | Endpoint | Cabecera | Descripción |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Ninguna | Registro de Persona + Usuario con Patrón Plantilla |
| **POST** | `/api/auth/login` | Ninguna | 1ro: Login tradicional email y clave (retorna JWT) |
| **POST** | `/api/auth/oauth-login` | Ninguna | Login con Google / Auth0 |
| **GET** | `/api/auth/check-token` | `Bearer <token>` | Verifica vigencia de la sesión |
| **GET** | `/api/profile` | `Bearer <token>` | **Protegido**: Ver perfil (Persona + Usuario + Dirección) |
| **PUT** | `/api/profile` | `Bearer <token>` | **Protegido**: Modificar datos personales y dirección |
| **PUT** | `/api/profile/change-password`| `Bearer <token>` | **Protegido**: Cambiar contraseña |
| **DELETE** | `/api/profile` | `Bearer <token>` | **Protegido**: Baja de la cuenta propia |
| **GET** | `/api/paises` | Ninguna | Listar todos los países |
| **POST** | `/api/paises` | Ninguna | Crear un país |
| **PUT** | `/api/paises/{id}` | Ninguna | Modificar un país |
| **DELETE** | `/api/paises/{id}` | Ninguna | Eliminar un país |
| **GET** | `/api/departamentos` | Ninguna | Listar departamentos (filtro opcional `?paisId=`) |
| **POST** | `/api/departamentos` | Ninguna | Crear un departamento |
| **PUT** | `/api/departamentos/{id}` | Ninguna | Modificar un departamento |
| **DELETE** | `/api/departamentos/{id}` | Ninguna | Eliminar un departamento |
| **GET** | `/api/localidades` | Ninguna | Listar localidades (filtro opcional `?departamentoId=`) |
| **POST** | `/api/localidades` | Ninguna | Crear una localidad |
| **PUT** | `/api/localidades/{id}` | Ninguna | Modificar una localidad |
| **DELETE** | `/api/localidades/{id}` | Ninguna | Eliminar una localidad |
| **GET** | `/api/direcciones` | Ninguna | Listar direcciones estructuradas completas |
| **POST** | `/api/direcciones` | Ninguna | Crear una dirección |
| **PUT** | `/api/direcciones/{id}` | Ninguna | Modificar una dirección |
| **DELETE** | `/api/direcciones/{id}` | Ninguna | Eliminar una dirección |
| **GET** | `/api/health` | Ninguna | Health Check del servicio |

---

## 8. CÓMO PROBAR TODO EL BACKEND SIN EL FRONTEND

1. **Swagger UI**: Abre [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) en tu navegador.
2. **Script PowerShell**: Ejecuta `.\test-api.ps1` en la consola para una corrida automatizada completa.
3. **Tests de Integración**: Ejecuta las pruebas automatizadas de Maven (`mvn test`).
