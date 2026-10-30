# 🚀 GUÍA PASO A PASO: INTEGRACIÓN FRONTEND (REACT) CON BACKEND SPRING BOOT
### Concurso ABM - Sistema de Usuarios, Perfiles y Seguridad JWT/OAuth

Esta guía contiene todo el código listo para copiar y pegar para que el frontend en **React (Vite)** se conecte de forma transparente con el backend de Spring Boot.

---

## 📌 ÍNDICE
1. [Instalación de Dependencias](#paso-1-instalación-de-dependencias)
2. [Configuración de Auth0 (`main.jsx`)](#paso-2-configuración-de-auth0-mainjsx)
3. [Configuración del Cliente Axios (`src/api/client.js`)](#paso-3-configuración-del-cliente-axios-srcapiclientjs)
4. [Capa de Servicios API (`src/services/apiService.js`)](#paso-4-capa-de-servicios-api-srcservicesapiservicejs)
5. [Componente: Login y Registro (`src/components/Auth.jsx`)](#paso-5-componente-login-y-registro-srccomponentsauthjsx)
6. [Componente: Opción 1 - Ver y Modificar Perfil (`src/components/Profile.jsx`)](#paso-6-componente-opción-1---ver-y-modificar-perfil-srccomponentsprofilejsx)
7. [Componente: Opción 2 - Cambiar Contraseña (`src/components/ChangePassword.jsx`)](#paso-7-componente-opción-2---cambiar-contraseña-srccomponentschangepasswordjsx)
8. [Componente Principal (`src/App.jsx`)](#paso-8-componente-principal-srcappjsx)
9. [Cómo Ejecutar Ambos](#paso-9-cómo-ejecutar-ambos)

---

## PASO 1: Instalación de Dependencias

En la carpeta de tu proyecto React, instala **Axios** para las peticiones HTTP y el SDK oficial de **Auth0**:

```bash
npm install axios @auth0/auth0-react
```

---

## PASO 2: Configuración de Auth0 (`main.jsx`)

Configura el proveedor de Auth0 con las credenciales y el `audience` de tu backend:

```jsx
// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { Auth0Provider } from '@auth0/auth0-react';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Auth0Provider
      domain="dev-1x6qm5adx348o8vd.us.auth0.com"
      clientId="7oT83TwUIejo9yjQtEoRjhYUhni4VhXq"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: "https://block/"
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);
```

---

## PASO 3: Configuración del Cliente Axios (`src/api/client.js`)

Crea una instancia centralizada de Axios que inyecte automáticamente el token JWT en cada petición:

```javascript
// src/api/client.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor: agrega el Bearer Token automáticamente si existe en localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default api;
```

---

## PASO 4: Capa de Servicios API (`src/services/apiService.js`)

Funciones listas para consumir cada endpoint del backend:

```javascript
// src/services/apiService.js
import api from '../api/client';

export const authService = {
  // 1. Registro de Persona + Usuario
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },

  // 2. Login tradicional
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  // 3. Login OAuth (Google / Auth0)
  oauthLogin: async (oauthData) => {
    const res = await api.post('/auth/oauth-login', oauthData);
    return res.data;
  },

  // 4. Verificar token al recargar página
  checkToken: async () => {
    const res = await api.get('/auth/check-token');
    return res.data;
  }
};

export const profileService = {
  // Opción 1: Ver perfil (Persona + Usuario)
  getProfile: async () => {
    const res = await api.get('/profile');
    return res.data;
  },

  // Opción 1: Modificar datos de la Persona
  updateProfile: async (profileData) => {
    const res = await api.put('/profile', profileData);
    return res.data;
  },

  // Opción 2: Cambiar la contraseña (y que funcione)
  changePassword: async (passwordData) => {
    const res = await api.put('/profile/change-password', passwordData);
    return res.data;
  },

  // Baja de la cuenta propia
  deleteAccount: async () => {
    const res = await api.delete('/profile');
    return res.data;
  }
};

export const userService = {
  // Grilla ABM: Listar todos los usuarios
  getAllUsers: async () => {
    const res = await api.get('/users');
    return res.data;
  },

  // Grilla ABM: Eliminar usuario por ID
  deleteUser: async (id) => {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  }
};
```

---

## PASO 5: Componente: Login y Registro (`src/components/Auth.jsx`)

Formularios para iniciar sesión (tradicional o Auth0) y registrarse:

```jsx
// src/components/Auth.jsx
import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { authService } from '../services/apiService';

export default function Auth({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const { loginWithRedirect } = useAuth0();

  // Estados para Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Estados para Registro (Persona + Usuario)
  const [regData, setRegData] = useState({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    dni: '',
    fechaNacimiento: '',
    direccion: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await authService.login({ email: loginEmail, password: loginPassword });
      if (res.success) {
        localStorage.setItem('token', res.data.token);
        onLoginSuccess(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await authService.register(regData);
      if (res.success) {
        localStorage.setItem('token', res.data.token);
        onLoginSuccess(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error en el registro');
    }
  };

  return (
    <div style={{ maxWidth: '450px', margin: '2rem auto', padding: '2rem', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>{isRegister ? 'Registrar Nueva Cuenta' : 'Iniciar Sesión'}</h2>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      {!isRegister ? (
        <form onSubmit={handleLogin}>
          <div>
            <label>Email:</label><br />
            <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required style={{ width: '100%', marginBottom: '1rem' }} />
          </div>
          <div>
            <label>Contraseña:</label><br />
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required style={{ width: '100%', marginBottom: '1rem' }} />
          </div>
          <button type="submit" style={{ width: '100%', padding: '0.6rem', marginBottom: '1rem', background: '#007bff', color: 'white' }}>
            Ingresar
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister}>
          <input placeholder="Nombre" value={regData.nombre} onChange={e => setRegData({...regData, nombre: e.target.value})} required style={{ width: '100%', marginBottom: '0.5rem' }} />
          <input placeholder="Apellido" value={regData.apellido} onChange={e => setRegData({...regData, apellido: e.target.value})} required style={{ width: '100%', marginBottom: '0.5rem' }} />
          <input placeholder="DNI (7 a 10 números)" value={regData.dni} onChange={e => setRegData({...regData, dni: e.target.value})} required style={{ width: '100%', marginBottom: '0.5rem' }} />
          <input type="date" placeholder="Fecha Nacimiento" value={regData.fechaNacimiento} onChange={e => setRegData({...regData, fechaNacimiento: e.target.value})} required style={{ width: '100%', marginBottom: '0.5rem' }} />
          <input placeholder="Dirección" value={regData.direccion} onChange={e => setRegData({...regData, direccion: e.target.value})} required style={{ width: '100%', marginBottom: '0.5rem' }} />
          <input type="email" placeholder="Email" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} required style={{ width: '100%', marginBottom: '0.5rem' }} />
          <input type="password" placeholder="Contraseña (mín 6 car.)" value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} required style={{ width: '100%', marginBottom: '1rem' }} />
          <button type="submit" style={{ width: '100%', padding: '0.6rem', marginBottom: '1rem', background: '#28a745', color: 'white' }}>
            Registrarme
          </button>
        </form>
      )}

      <hr />

      <button onClick={() => loginWithRedirect()} style={{ width: '100%', padding: '0.6rem', background: '#ea4335', color: 'white', marginBottom: '1rem' }}>
        🔑 Iniciar sesión con Auth0 / Google
      </button>

      <button onClick={() => setIsRegister(!isRegister)} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}>
        {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
      </button>
    </div>
  );
}
```

---

## PASO 6: Componente: Opción 1 - Ver y Modificar Perfil (`src/components/Profile.jsx`)

Cumple con la **Opción 1** exigida por el profesor:

```jsx
// src/components/Profile.jsx
import React, { useEffect, useState } from 'react';
import { profileService } from '../services/apiService';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    fechaNacimiento: '',
    direccion: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      const res = await profileService.getProfile();
      if (res.success) {
        setProfile(res.data);
        setFormData({
          nombre: res.data.persona.nombre,
          apellido: res.data.persona.apellido,
          dni: res.data.persona.dni,
          fechaNacimiento: res.data.persona.fechaNacimiento,
          direccion: res.data.persona.direccion
        });
      }
    } catch (err) {
      setError('Error al cargar datos del perfil');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const res = await profileService.updateProfile(formData);
      if (res.success) {
        setMessage('¡Datos del perfil actualizados con éxito!');
        cargarPerfil();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar perfil');
    }
  };

  if (!profile) return <div>Cargando perfil...</div>;

  return (
    <div style={{ maxWidth: '500px', margin: '1rem auto', padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>👤 Opción 1: Mi Perfil y Datos Personales</h3>
      <p><strong>Email de cuenta:</strong> {profile.email} ({profile.authProvider})</p>
      <p><strong>Rol:</strong> {profile.rol}</p>

      {message && <div style={{ color: 'green', marginBottom: '1rem' }}>{message}</div>}
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleUpdate}>
        <div style={{ marginBottom: '0.8rem' }}>
          <label>Nombre:</label>
          <input value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '0.8rem' }}>
          <label>Apellido:</label>
          <input value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '0.8rem' }}>
          <label>DNI:</label>
          <input value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '0.8rem' }}>
          <label>Fecha de Nacimiento:</label>
          <input type="date" value={formData.fechaNacimiento} onChange={e => setFormData({...formData, fechaNacimiento: e.target.value})} required style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Dirección:</label>
          <input value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} required style={{ width: '100%' }} />
        </div>
        <button type="submit" style={{ padding: '0.6rem 1.2rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
          Guardar Cambios
        </button>
      </form>
    </div>
  );
}
```

---

## PASO 7: Componente: Opción 2 - Cambiar Contraseña (`src/components/ChangePassword.jsx`)

Cumple con la **Opción 2 (y que funcione)** exigida por el profesor:

```jsx
// src/components/ChangePassword.jsx
import React, { useState } from 'react';
import { profileService } from '../services/apiService';

export default function ChangePassword({ isOAuthUser }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    try {
      const res = await profileService.changePassword({
        currentPassword: isOAuthUser ? '' : currentPassword,
        newPassword,
        confirmPassword
      });

      if (res.success) {
        setMessage('¡Contraseña cambiada exitosamente! Ya puedes iniciar sesión con ella.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar contraseña');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '1rem auto', padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>🔒 Opción 2: Cambiar Contraseña</h3>

      {isOAuthUser && (
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          ℹ️ Iniciaste con Google/Auth0: no requieres clave anterior para establecer tu nueva contraseña.
        </p>
      )}

      {message && <div style={{ color: 'green', marginBottom: '1rem' }}>{message}</div>}
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleChangePassword}>
        {!isOAuthUser && (
          <div style={{ marginBottom: '0.8rem' }}>
            <label>Contraseña Actual:</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required style={{ width: '100%' }} />
          </div>
        )}
        <div style={{ marginBottom: '0.8rem' }}>
          <label>Nueva Contraseña (mín 6 caracteres):</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Confirmar Nueva Contraseña:</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} style={{ width: '100%' }} />
        </div>
        <button type="submit" style={{ padding: '0.6rem 1.2rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>
          Actualizar Contraseña
        </button>
      </form>
    </div>
  );
}
```

---

## PASO 8: Componente Principal (`src/App.jsx`)

Orquesta el estado general de la aplicación, el menú de las 2 opciones y la sincronización con Auth0:

```jsx
// src/App.jsx
import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import Auth from './components/Auth';
import Profile from './components/Profile';
import ChangePassword from './components/ChangePassword';
import { authService } from './services/apiService';

export default function App() {
  const { user, isAuthenticated, logout: auth0Logout } = useAuth0();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('perfil'); // 'perfil' o 'password'

  // 1. Sincronizar automáticamente cuando el usuario se loguea con Auth0 / Google
  useEffect(() => {
    if (isAuthenticated && user) {
      authService.oauthLogin({
        email: user.email,
        nombre: user.given_name || user.name || 'Usuario',
        apellido: user.family_name || 'Auth0',
        provider: 'AUTH0',
        providerId: user.sub
      }).then(res => {
        if (res.success) {
          localStorage.setItem('token', res.data.token);
          setCurrentUser(res.data);
        }
      });
    }
  }, [isAuthenticated, user]);

  // 2. Al recargar la página, comprobar si el token en localStorage sigue siendo válido
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !currentUser) {
      authService.checkToken()
        .then(res => {
          if (res.success) setCurrentUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setCurrentUser(null);
        });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    if (isAuthenticated) {
      auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    }
  };

  if (!currentUser) {
    return <Auth onLoginSuccess={(userData) => setCurrentUser(userData)} />;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '1rem' }}>
        <div>
          <h2>Concurso ABM - Panel de Usuario</h2>
          <p>Bienvenido, <strong>{currentUser.nombre} {currentUser.apellido}</strong> ({currentUser.email})</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Cerrar Sesión
        </button>
      </header>

      {/* Menú de las 2 Opciones Solicitadas por el Profesor */}
      <nav style={{ display: 'flex', gap: '1rem', margin: '1.5rem 0' }}>
        <button
          onClick={() => setActiveTab('perfil')}
          style={{ padding: '0.8rem 1.5rem', cursor: 'pointer', background: activeTab === 'perfil' ? '#007bff' : '#eee', color: activeTab === 'perfil' ? 'white' : '#333', border: 'none', borderRadius: '4px' }}>
          1. Mi Perfil (Modificar Datos)
        </button>
        <button
          onClick={() => setActiveTab('password')}
          style={{ padding: '0.8rem 1.5rem', cursor: 'pointer', background: activeTab === 'password' ? '#007bff' : '#eee', color: activeTab === 'password' ? 'white' : '#333', border: 'none', borderRadius: '4px' }}>
          2. Cambiar Contraseña
        </button>
      </nav>

      <main>
        {activeTab === 'perfil' && <Profile />}
        {activeTab === 'password' && <ChangePassword isOAuthUser={currentUser.rol !== 'ROLE_ADMIN' && isAuthenticated} />}
      </main>
    </div>
  );
}
```

---

## PASO 9: Cómo Ejecutar Ambos

1. **Iniciar el Backend Spring Boot**:
   - Doble clic en `run.bat` (o ejecuta `java -jar target/usuario-service-1.0.0-SNAPSHOT.jar`).
   - Quedará escuchando en: `http://localhost:8080`.
2. **Iniciar el Frontend React (Vite)**:
   - Abre la terminal en la carpeta del frontend y ejecuta con el puerto estricto para Auth0:
   ```bash
   npm run dev -- --port 5173 --strictPort
   ```
   - Abre tu navegador en: `http://localhost:5173`.
