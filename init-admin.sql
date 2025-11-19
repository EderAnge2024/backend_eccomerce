-- Script para crear usuario administrador por defecto
-- Ejecutar este script después de crear las tablas

-- Insertar usuario administrador (la contraseña es 'admin123' hasheada con bcrypt)
-- Nota: Debes ejecutar este script manualmente o crear un endpoint para inicializar el admin

INSERT INTO usuarios (nombre, apellido, correo, telefono, direccion, rol, usuario, password_hash)
VALUES (
  'Administrador',
  'Sistema',
  'admin@ecommerce.com',
  '999999999',
  'Oficina Central',
  'administrador',
  'admin',
  '$2b$10$rKZqYvYxGX7vZ8qKqZ8qKOqKqZ8qKqZ8qKqZ8qKqZ8qKqZ8qKqZ8q'
)
ON CONFLICT (usuario) DO NOTHING;

-- Nota: La contraseña hasheada arriba es un ejemplo
-- Para generar la contraseña real, ejecuta en Node.js:
-- const bcrypt = require('bcrypt');
-- bcrypt.hash('admin123', 10).then(hash => console.log(hash));
