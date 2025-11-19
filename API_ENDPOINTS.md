# API Endpoints - CRUD Completo

Base URL: `http://localhost:3000/api`

---

## 📋 USUARIOS

### Registro y Autenticación
- **POST** `/usuarios/register` - Registrar nuevo usuario
  ```json
  {
    "nombre": "Juan",
    "apellido": "Pérez",
    "correo": "juan@example.com",
    "telefono": "1234567890",
    "direccion": "Calle 123",
    "rol": "cliente",
    "usuario": "juanperez",
    "contrasena": "password123"
  }
  ```

- **POST** `/usuarios/login` - Iniciar sesión
  ```json
  {
    "usuario": "juanperez",
    "contrasena": "password123"
  }
  ```

### CRUD Usuarios
- **GET** `/usuarios` - Obtener todos los usuarios
- **GET** `/usuarios/:id` - Obtener usuario por ID
- **PUT** `/usuarios/:id` - Actualizar usuario
  ```json
  {
    "nombre": "Juan",
    "apellido": "Pérez",
    "correo": "juan@example.com",
    "telefono": "1234567890",
    "direccion": "Calle 123",
    "rol": "cliente",
    "usuario": "juanperez"
  }
  ```
- **DELETE** `/usuarios/:id` - Eliminar usuario

### Recuperación de Contraseña
- **POST** `/usuarios/verify-email` - Verificar si correo existe
  ```json
  { "correo": "juan@example.com" }
  ```

- **POST** `/usuarios/request-code` - Solicitar código de recuperación
  ```json
  { "correo": "juan@example.com" }
  ```

- **POST** `/usuarios/verify-code` - Verificar código
  ```json
  {
    "correo": "juan@example.com",
    "codigo": "123456"
  }
  ```

- **POST** `/usuarios/verify-code-reset` - Verificar código y cambiar contraseña
  ```json
  {
    "correo": "juan@example.com",
    "codigo": "123456",
    "nuevaContrasena": "newpassword123"
  }
  ```

---

## 🛒 PEDIDOS

- **POST** `/pedidos` - Crear pedido
  ```json
  {
    "id_usuario": 1,
    "total": 150.50
  }
  ```

- **GET** `/pedidos` - Obtener todos los pedidos
- **GET** `/pedidos/:id` - Obtener pedido por ID
- **GET** `/pedidos/usuario/:id_usuario` - Obtener pedidos de un usuario
- **PUT** `/pedidos/:id` - Actualizar pedido
  ```json
  {
    "total": 200.00
  }
  ```
- **DELETE** `/pedidos/:id` - Eliminar pedido

---

## 📦 PEDIDO_PRODUCTO

- **POST** `/pedido-productos` - Crear pedido_producto
  ```json
  {
    "id_pedido": 1,
    "id_producto": "PROD123",
    "cantidad": 2,
    "precio": 75.25
  }
  ```

- **GET** `/pedido-productos` - Obtener todos los pedido_producto
- **GET** `/pedido-productos/:id` - Obtener pedido_producto por ID
- **GET** `/pedido-productos/pedido/:id_pedido` - Obtener productos de un pedido
- **PUT** `/pedido-productos/:id` - Actualizar pedido_producto
  ```json
  {
    "cantidad": 3,
    "precio": 80.00
  }
  ```
- **DELETE** `/pedido-productos/:id` - Eliminar pedido_producto

---

## 🔐 TOKEN

- **POST** `/tokens` - Crear token
  ```json
  {
    "id_usuario": 1,
    "code_recuperacion": "ABC123",
    "fecha_expiracion": "2024-12-31T23:59:59"
  }
  ```

- **GET** `/tokens` - Obtener todos los tokens
- **GET** `/tokens/:id` - Obtener token por ID
- **GET** `/tokens/usuario/:id_usuario` - Obtener tokens de un usuario
- **PUT** `/tokens/:id` - Actualizar token
  ```json
  {
    "code_recuperacion": "XYZ789",
    "fecha_expiracion": "2024-12-31T23:59:59"
  }
  ```
- **DELETE** `/tokens/:id` - Eliminar token
- **DELETE** `/tokens/clean/expired` - Limpiar tokens expirados

---

## 📝 Notas

- Todos los endpoints devuelven JSON con formato:
  ```json
  {
    "success": true/false,
    "message": "Mensaje descriptivo",
    "data": { ... }
  }
  ```

- Los campos obligatorios están marcados en cada endpoint
- Las contraseñas se hashean automáticamente con bcrypt
- Los tokens de recuperación expiran en 10 minutos por defecto
