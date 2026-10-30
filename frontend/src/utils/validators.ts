import type { User, ValidationResult } from '../models/user.model';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Sincronizado con @Pattern(regexp = "^[0-9]{7,10}$") del Backend Spring Boot
const DNI_REGEX = /^\d{7,10}$/;

export function validateUserFields(
  data: {
    nombre: string;
    apellido: string;
    dni: string;
    fechaNacimiento: string;
    direccion: string;
    email: string;
    password?: string;
    confirmPassword?: string;
  },
  existingUsers: User[] = [],
  options: {
    requirePassword?: boolean;
    excludeUserId?: string;
  } = {}
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.nombre.trim()) {
    errors.nombre = 'Ingresá tu nombre.';
  } else if (data.nombre.trim().length < 2) {
    errors.nombre = 'Mínimo 2 caracteres.';
  }

  if (!data.apellido.trim()) {
    errors.apellido = 'Ingresá tu apellido.';
  } else if (data.apellido.trim().length < 2) {
    errors.apellido = 'Mínimo 2 caracteres.';
  }

  const cleanDni = data.dni.trim();
  if (!cleanDni) {
    errors.dni = 'Ingresá tu DNI.';
  } else if (!DNI_REGEX.test(cleanDni)) {
    errors.dni = 'Solo números (7 a 10 dígitos).';
  } else if (existingUsers.length > 0) {
    const duplicateDni = existingUsers.some(
      (u) => u.dni === cleanDni && String(u.id) !== String(options.excludeUserId)
    );
    if (duplicateDni) {
      errors.dni = 'Este DNI ya está registrado.';
    }
  }

  if (!data.fechaNacimiento) {
    errors.fechaNacimiento = 'Seleccioná una fecha.';
  } else {
    const birthDate = new Date(data.fechaNacimiento);
    const now = new Date();
    if (isNaN(birthDate.getTime()) || birthDate >= now) {
      errors.fechaNacimiento = 'La fecha de nacimiento debe ser una fecha pasada.';
    }
  }

  if (!data.direccion.trim()) {
    errors.direccion = 'Ingresá una dirección.';
  } else if (data.direccion.trim().length < 3) {
    errors.direccion = 'La dirección debe tener al menos 3 caracteres.';
  }

  const cleanEmail = data.email.trim().toLowerCase();
  if (!cleanEmail) {
    errors.email = 'Ingresá un email.';
  } else if (!EMAIL_REGEX.test(cleanEmail)) {
    errors.email = 'Formato de email inválido.';
  } else if (existingUsers.length > 0) {
    const duplicateEmail = existingUsers.some(
      (u) =>
        u.email.toLowerCase() === cleanEmail &&
        String(u.id) !== String(options.excludeUserId)
    );
    if (duplicateEmail) {
      errors.email = 'Este email ya está registrado.';
    }
  }

  if (options.requirePassword) {
    const pwd = data.password ?? '';
    if (!pwd) {
      errors.password = 'Ingresá una contraseña.';
    } else if (pwd.length < 6) {
      errors.password = 'Mínimo 6 caracteres.';
    }

    if (data.confirmPassword !== undefined && pwd !== data.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
