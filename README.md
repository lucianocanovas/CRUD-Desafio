# ⚙️ CRUD-Desafio · Sistema Integral de Usuarios y Perfiles (React 19 + Three.js + Spring Boot 3)

Sistema full-stack desarrollado bajo una **Arquitectura en Capas (MVC)** y el **Patrón de Diseño Comportamental Plantilla (*Template Method Pattern*)**, integrando un **Frontend 3D interactivo Steampunk** (React 19, TypeScript, Three.js y modelos `.glb` de Blender) con un **Backend API REST en Spring Boot 3** (Spring Security 6, JWT, OAuth2, JPA/Hibernate y persistencia relacional en **SQLite** / **MySQL**).

---

## 📑 Tabla de Contenidos

1. [Arquitectura de Capas (MVC) e Integración Full-Stack](#1-arquitectura-de-capas-mvc-e-integración-full-stack)
2. [Implementación del Patrón Plantilla (Template Method Pattern)](#2-implementación-del-patrón-plantilla-template-method-pattern)
3. [Modelo de Dominio: Separación Persona vs Usuario](#3-modelo-de-dominio-separación-persona-vs-usuario)
4. [Estructura de Carpetas del Proyecto](#4-estructura-de-carpetas-del-proyecto)
   - [4.1 Estructura del Backend (`backend/`)](#41-estructura-del-backend-backend)
   - [4.2 Estructura del Frontend (`frontend/`)](#42-estructura-del-frontend-frontend)
5. [Catálogo de Endpoints REST Consumidos](#5-catálogo-de-endpoints-rest-consumidos)
6. [Instrucciones de Ejecución](#6-instrucciones-de-ejecución)
7. [Credenciales Demo Precargadas](#7-credenciales-demo-precargadas)

---

## 1. Arquitectura de Capas (MVC) e Integración Full-Stack

Tanto el **Frontend** como el **Backend** respetan estrictamente la separación de responsabilidades en capas **MVC (Modelo - Vista - Controlador)** junto con capas dedicadas para **Servicios**, **Infraestructura HTTP/Seguridad** y **Patrones de Diseño**:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19 + TypeScript)                      │
├──────────────────────────────────────────────────────────────────────────────┤
│  1. VISTA (View)           -> src/components/views, ui, three                │
│  2. CONTROLADOR (MVC)      -> src/controllers/useUserController.ts           │
│  3. PATRÓN PLANTILLA       -> src/patterns/template/*Template.ts             │
│  4. SERVICIOS DE NEGOCIO   -> src/services/userService.ts                    │
│  5. CLIENTE HTTP + JWT     -> src/api/apiClient.ts (Bearer Interceptor)      │
│  6. MODELO & DTOs (Model)  -> src/models/user.model.ts                       │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │  HTTP / JSON + Authorization: Bearer <JWT>
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     BACKEND (Spring Boot 3 + Java 21)                        │
├──────────────────────────────────────────────────────────────────────────────┤
│  1. SEGURIDAD & FILTROS    -> security/jwt/JwtAuthenticationFilter.java      │
│  2. CONTROLADOR REST (C)   -> controller/*Controller.java                    │
│  3. SERVICIOS (Service)    -> service/impl/*ServiceImpl.java                 │
│  4. PATRÓN PLANTILLA       -> pattern/template/*Template.java                │
│  5. REPOSITORIOS JPA       -> repository/*Repository.java                    │
│  6. MODELO & ENTIDADES (M) -> entity/Usuario.java & entity/Persona.java      │
│  7. BASE DE DATOS          -> SQLite (usuariodb.db) / MySQL (Producción)     │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Implementación del Patrón Plantilla (*Template Method Pattern*)

El **Patrón Plantilla (*Template Method*)** define el esqueleto invariable de un algoritmo para las operaciones críticas de cuenta en una clase abstracta base, delegando los pasos específicos a sus subclases concretas sin alterar el flujo de ejecución:

### Pasos invariables del algoritmo (`execute(request, userId)`):
1. **`validateBusinessRules(request, userId)`**: Valida las reglas de negocio e integridad (formato de campos, unicidad de Email y DNI, validez de fecha de nacimiento, coincidencia de contraseñas y verificación de clave actual con BCrypt).
2. **`prepare(request, userId)`**: Normaliza y sanea los datos de entrada (`trim` de cadenas, conversión de email a minúsculas, asignación de `avatarId` por defecto).
3. **`processOperation(request, userId)`**: Ejecuta la operación transaccional principal (persistencia JPA/SQLite, encriptación BCrypt, emisión de JWT o invocación REST).
4. **`postProcess(request, result, userId)`**: Hook de post-procesamiento para auditoría, sincronización de sesión y actualización de preferencias.

### Clases del Patrón Plantilla en Backend y Frontend:

| Operación | Clase en Backend (`com.concurso.usuario.pattern.template`) | Clase en Frontend (`src/patterns/template`) |
| :--- | :--- | :--- |
| **Clase Base Abstracta** | `AbstractAccountOperationTemplate<T, R>` | `AbstractAccountOperationTemplate<TRequest, TResult>` |
| **Alta / Registración** | `UserRegistrationTemplate` | `UserRegistrationTemplate` |
| **Opción 1: Modificar Perfil** | `ProfileUpdateTemplate` | `ProfileUpdateTemplate` |
| **Opción 2: Cambiar Clave** | `PasswordChangeTemplate` | `PasswordChangeTemplate` |

---

## 3. Modelo de Dominio: Separación `Persona` vs `Usuario`

El modelo de dominio desacopla la identidad física (**`Persona`**) de las credenciales de acceso y seguridad (**`Usuario`**) mediante una relación `@OneToOne`:

- **`Usuario`** (`tabla: usuarios`): `id`, `email` (único), `password` (hash BCrypt), `rol` (`ROLE_USER` / `ROLE_ADMIN`), `authProvider` (`LOCAL` / `GOOGLE`), `activo`, `createdAt`, `updatedAt`, `persona_id`.
- **`Persona`** (`tabla: personas`): `id`, `nombre`, `apellido`, `dni` (único, 7 a 10 dígitos), `fechaNacimiento`, `direccion`, `avatarId` (personaje 3D Steampunk).

---

## 4. Estructura de Carpetas del Proyecto

```text
CRUD-Desafio/
├── README.md                  # Documentación general de arquitectura e integración
├── backend/                   # API REST en Spring Boot 3 (Java 21 + SQLite + JWT)
└── frontend/                  # SPA en React 19 + TypeScript + Three.js (Vite)
```

### 4.1 Estructura del Backend (`backend/`)

```text
backend/
├── pom.xml                                  # Configuración Maven (Spring Boot 3.3, Security, JWT, SQLite, OpenAPI)
├── run.bat                                  # Script de arranque rápido del servidor en puerto 8080
├── test-api.ps1                             # Script automatizado de pruebas de integración de la API
├── usuariodb.db                             # Base de datos relacional SQLite persistente en disco
├── DOCUMENTACION_BACKEND.md                 # Manual técnico detallado del backend
├── GUIA_INTEGRACION_FRONTEND.md             # Guía de consumo de endpoints y contratos JSON
└── src/
    ├── main/
    │   ├── java/com/concurso/usuario/
    │   │   ├── UsuarioApplication.java      # Punto de entrada de la aplicación Spring Boot
    │   │   ├── controller/                  # [CAPA CONTROLADOR - MVC] Endpoints REST HTTP
    │   │   │   ├── AuthController.java      # POST /api/auth/register, /login, /oauth-login, GET /check-token
    │   │   │   ├── ProfileController.java   # GET/PUT/DELETE /api/profile, PUT /api/profile/change-password
    │   │   │   ├── UsuarioController.java   # GET /api/users, DELETE /api/users/{id} (Grilla ABM)
    │   │   │   └── HealthController.java    # GET /api/health (Estado del servidor)
    │   │   ├── service/                     # [CAPA DE SERVICIO] Contratos e implementaciones de negocio
    │   │   │   ├── AuthService.java
    │   │   │   ├── ProfileService.java
    │   │   │   └── impl/
    │   │   │       ├── AuthServiceImpl.java     # Login (Email o DNI), OAuth2 y delegación a Plantilla de Registro
    │   │   │       └── ProfileServiceImpl.java  # Gestión de perfil y delegación a Plantillas de Perfil y Clave
    │   │   ├── pattern/template/            # [PATRÓN PLANTILLA - Template Method Pattern]
    │   │   │   ├── AbstractAccountOperationTemplate.java  # Esqueleto invariable de 4 pasos (execute)
    │   │   │   ├── UserRegistrationTemplate.java          # Concreción 1: Alta de Persona + Usuario + BCrypt + JWT
    │   │   │   ├── ProfileUpdateTemplate.java             # Concreción 2: Edición de Persona con validación de DNI/Email
    │   │   │   └── PasswordChangeTemplate.java            # Concreción 3: Cambio seguro de clave (Local y Google/OAuth)
    │   │   ├── repository/                  # [CAPA DE PERSISTENCIA] Interfaces Spring Data JPA
    │   │   │   ├── PersonaRepository.java   # Consultas JPA sobre la tabla `personas`
    │   │   │   └── UsuarioRepository.java   # Consultas JPA sobre la tabla `usuarios` (por Email y DNI)
    │   │   ├── entity/                      # [CAPA DE MODELO - MVC] Entidades JPA y Patrón Builder
    │   │   │   ├── Persona.java             # Entidad física (nombre, apellido, dni, fechaNacimiento, direccion, avatarId)
    │   │   │   ├── Usuario.java             # Entidad de cuenta (email, password BCrypt, rol, authProvider, @OneToOne Persona)
    │   │   │   ├── Rol.java                 # Enum: ROLE_USER, ROLE_ADMIN
    │   │   │   └── AuthProvider.java        # Enum: LOCAL, GOOGLE
    │   │   ├── dto/                         # [CAPA DE TRANSFERENCIA DE DATOS]
    │   │   │   ├── request/                 # LoginRequest, RegisterRequest, ProfileUpdateRequest, ChangePasswordRequest, OAuthLoginRequest
    │   │   │   └── response/                # ApiResponse<T>, AuthResponse, ProfileResponse, PersonaDTO
    │   │   ├── security/                    # [CAPA DE SEGURIDAD] Spring Security 6 + JWT Stateless
    │   │   │   ├── UserDetailsServiceImpl.java
    │   │   │   └── jwt/
    │   │   │       ├── JwtAuthenticationFilter.java  # Interceptor que valida el header Authorization: Bearer <token>
    │   │   │       └── JwtTokenProvider.java         # Firma y validación de tokens HMAC-SHA256
    │   │   ├── config/                      # [CAPA DE CONFIGURACIÓN]
    │   │   │   ├── SecurityConfig.java      # Reglas de rutas públicas/protegidas y BCryptPasswordEncoder
    │   │   │   ├── CorsConfig.java          # Configuración CORS habilitada para el Frontend React
    │   │   │   ├── DataInitializer.java     # Semilla automática de usuarios demo en SQLite
    │   │   │   └── OpenApiConfig.java       # Configuración de documentación interactiva Swagger UI
    │   │   └── exception/                   # [MANEJO GLOBAL DE ERRORES]
    │   │       ├── GlobalExceptionHandler.java  # @RestControllerAdvice que unifica respuestas de error
    │   │       ├── ErrorResponse.java
    │   │       ├── BadRequestException.java
    │   │       ├── ResourceNotFoundException.java
    │   │       └── UnauthorizedException.java
    │   └── resources/
    │       ├── application.properties       # Configuración local (puerto 8080, SQLite usuariodb.db, JWT, Swagger)
    │       └── application-prod.properties  # Perfil de producción para MySQL
    └── test/                                # Pruebas de integración automatizadas con MockMvc (JUnit 5)
        └── java/com/concurso/usuario/UsuarioIntegrationTest.java
```

---

### 4.2 Estructura del Frontend (`frontend/`)

```text
frontend/
├── index.html                               # Documento raíz HTML5
├── package.json                             # Dependencias (React 19, Three.js, Lucide Icons, TypeScript, Vite)
├── vite.config.ts                           # Configuración del bundler Vite
├── public/
│   └── models/
│       └── steampunk_mechanism.glb          # Escena 3D Steampunk exportada desde Blender
├── scripts/
│   └── generate_steampunk_core.py           # Script Python para Blender que genera el mecanismo 3D .glb
└── src/
    ├── main.tsx                             # Punto de montaje de React
    ├── App.tsx                              # Layout principal, barra superior de estado y enrutamiento de vistas
    ├── App.css / index.css                  # Sistema de diseño visual Steampunk (Aether-OS)
    ├── models/                              # [CAPA MODELO - MVC]
    │   └── user.model.ts                    # Entidades (Persona, User) y DTOs sincronizados con el Backend
    ├── api/                                 # [CAPA DE INFRAESTRUCTURA HTTP]
    │   └── apiClient.ts                     # Cliente HTTP centralizado con inyección de Bearer JWT y manejo de ApiError
    ├── patterns/                            # [CAPA DE PATRONES DE DISEÑO]
    │   └── template/                        # Implementación del Patrón Plantilla (Template Method) en Frontend
    │       ├── AbstractAccountOperationTemplate.ts  # Clase abstracta con el método plantilla `execute()`
    │       ├── UserRegistrationTemplate.ts          # Plantilla concreta para registro de Persona + Usuario
    │       ├── ProfileUpdateTemplate.ts             # Plantilla concreta para modificación de datos personales
    │       └── PasswordChangeTemplate.ts            # Plantilla concreta para cambio de contraseña
    ├── services/                            # [CAPA DE SERVICIOS]
    │   └── userService.ts                   # Consumo de endpoints del Backend, mapeo Persona/Usuario y fallback resiliente
    ├── controllers/                         # [CAPA CONTROLADOR - MVC]
    │   └── useUserController.ts             # Controlador React que coordina vistas, estado de sesión, plantillas y errores
    ├── components/                          # [CAPA VISTA - MVC]
    │   ├── views/                           # Vistas principales de negocio
    │   │   ├── LoginView.tsx                # 1ro: Inicio de sesión por Email o DNI + Contraseña
    │   │   ├── RegisterView.tsx             # Alta de cuenta (datos de Persona + credenciales de Usuario + Avatar 3D)
    │   │   └── ProfileView.tsx              # 2do: Opción 1 (Ver/Modificar Perfil y Baja) y Opción 2 (Cambiar Contraseña)
    │   ├── ui/                              # Componentes de interfaz reutilizables
    │   │   ├── SteampunkAvatarPicker.tsx    # Selector interactivo de los 6 personajes 3D Low-Poly PSX
    │   │   └── SteamValveControl.tsx        # Control interactivo de válvula de vapor
    │   └── three/                           # Motor gráfico 3D en tiempo real (Three.js)
    │       ├── SteampunkBackground.tsx      # Escena 3D de fondo con engranajes, pistones, giroscopio y partículas
    │       ├── SteampunkAvatar3D.tsx        # Visor 3D interactivo para retratos de personajes
    │       ├── steampunkAvatars.ts          # Generador procedural de los 6 personajes 3D estilo PSX y animaciones idle
    │       └── steampunkInstrumentation.ts  # Utilidades de instrumentación mecánica 3D
    ├── utils/                               # [UTILIDADES TRANSVERSALES]
    │   └── validators.ts                    # Reglas de validación sincronizadas con Jakarta Validation del Backend
    └── data/
        └── mockUsers.json                   # Datos semilla locales sincronizados con `DataInitializer.java`
```

---

## 5. Catálogo de Endpoints REST Consumidos

| Operación | Método y Ruta | Autenticación | Patrón Plantilla Ejecutado |
| :--- | :--- | :--- | :--- |
| **Registro de Usuario y Persona** | `POST /api/auth/register` | Pública | `UserRegistrationTemplate` |
| **1ro: Login (Email o DNI)** | `POST /api/auth/login` | Pública | Autenticación Spring Security + JWT |
| **Login OAuth2 (Google / Auth0)** | `POST /api/auth/oauth-login` | Pública | Auto-registro + Emisión JWT |
| **Validar Sesión Activa** | `GET /api/auth/check-token` | `Bearer <token>` | Filtro `JwtAuthenticationFilter` |
| **Opción 1: Obtener Perfil** | `GET /api/profile` | `Bearer <token>` | Lectura `Usuario` + `PersonaDTO` |
| **Opción 1: Modificar Perfil** | `PUT /api/profile` | `Bearer <token>` | `ProfileUpdateTemplate` |
| **Opción 2: Cambiar Contraseña** | `PUT /api/profile/change-password` | `Bearer <token>` | `PasswordChangeTemplate` |
| **Eliminar Cuenta Propia** | `DELETE /api/profile` | `Bearer <token>` | Baja en cascada `Usuario` + `Persona` |
| **Listar Usuarios (ABM)** | `GET /api/users` | `Bearer <token>` | Consulta general de perfiles |
| **Health Check** | `GET /api/health` | Pública | Verificación de estado del servidor |

---

## 6. Instrucciones de Ejecución

### 1. Iniciar el Backend (Spring Boot)
Desde la carpeta `backend/`:
```bash
cd backend
# En Windows:
run.bat

# O con Maven / Java 21 en cualquier sistema operativo:
mvn spring-boot:run
```
- **API Base**: `http://localhost:8080/api`
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`

### 2. Iniciar el Frontend (React + Vite)
Desde la carpeta `frontend/`:
```bash
cd frontend
npm install
npm run dev
```
- **Aplicación Web**: `http://localhost:5173`
- Por defecto se conecta automáticamente a `http://localhost:8080/api` (configurable mediante `VITE_API_URL`).

---

## 7. Credenciales Demo Precargadas

Al iniciar el sistema, se encuentran disponibles las siguientes cuentas iniciales (se puede ingresar tanto con **Email** como con **DNI**):

| Rol | Email | DNI | Contraseña | Nombre |
| :--- | :--- | :--- | :--- | :--- |
| **Usuario Estándar** | `usuario@concurso.com` | `38123456` | `usuario123` | Juan Pérez |
| **Administrador** | `admin@concurso.com` | `20987654` | `admin123` | Admin Principal |
