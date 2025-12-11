# Backend API - E-commerce

## 🚀 Instalación y Ejecución

### 1. Instalar dependencias:
```bash
npm install
```

### 2. Configurar la base de datos en `db.js`:
```javascript
const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "tu_password",
  database: "tu_database",
  port: 5432,
});
```

### 3. Configurar variables de entorno en `.env`:
```env
GMAIL_USER=tu_correo@gmail.com
GMAIL_APP_PASSWORD=tu_contraseña_de_aplicacion
```

### 4. Iniciar el servidor:
```bash
npm start
```

El servidor estará disponible en: `http://localhost:3000`

## ⚡ Inicialización Automática

Al iniciar el servidor por primera vez, el sistema automáticamente:

1. ✅ Crea todas las tablas necesarias en PostgreSQL
2. ✅ Agrega el campo `es_super_admin` si no existe
3. ✅ Crea el usuario super administrador (ID 1)
4. ✅ Puebla la base de datos con productos de FakeStore API (solo si está vacía)

### 🔑 Credenciales del Super Admin

- **Usuario:** `superadmin`
- **Contraseña:** `admin123`
- **Rol:** Administrador con privilegios especiales

**Importante:** Solo el super admin puede crear otros administradores.

## 🗄️ Scripts Disponibles

### Iniciar el servidor (con inicialización automática)
```bash
npm start
```

### Ejecutar solo la inicialización (sin iniciar servidor)
```bash
npm run init
```

### Ejecutar configuración completa (legacy)
```bash
npm run setup
```

Todos estos scripts realizan la misma inicialización del sistema.

## 📊 Base de Datos

El sistema crea automáticamente las siguientes tablas en PostgreSQL:

- **usuarios** - Gestión de usuarios y autenticación
- **pedidos** - Registro de pedidos
- **pedido_producto** - Productos asociados a pedidos
- **token** - Tokens de recuperación de contraseña

## 📚 Documentación

- **API Endpoints:** Consulta `API_ENDPOINTS.md` para ver todos los endpoints disponibles
- **Inicialización:** Consulta `INICIALIZACION.md` para detalles sobre el sistema de inicialización automática
- **Permisos de Admin:** Consulta `PERMISOS_ADMIN.md` para entender el sistema de permisos y acceso por administrador

## 🔑 Endpoints Principales

### Usuarios
- `POST /api/usuarios/register` - Registrar usuario
- `POST /api/usuarios/login` - Iniciar sesión
- `GET /api/usuarios` - Listar usuarios
- `GET /api/usuarios/:id` - Obtener usuario
- `PUT /api/usuarios/:id` - Actualizar usuario
- `DELETE /api/usuarios/:id` - Eliminar usuario

### Pedidos
- `POST /api/pedidos` - Crear pedido
- `GET /api/pedidos` - Listar pedidos
- `GET /api/pedidos/:id` - Obtener pedido
- `GET /api/pedidos/usuario/:id_usuario` - Pedidos por usuario
- `PUT /api/pedidos/:id` - Actualizar pedido
- `DELETE /api/pedidos/:id` - Eliminar pedido

### Pedido Productos
- `POST /api/pedido-productos` - Agregar producto a pedido
- `GET /api/pedido-productos/pedido/:id_pedido` - Productos de un pedido
- `PUT /api/pedido-productos/:id` - Actualizar producto
- `DELETE /api/pedido-productos/:id` - Eliminar producto

### Tokens
- `GET /api/tokens` - Listar tokens
- `DELETE /api/tokens/clean/expired` - Limpiar tokens expirados

## 🛠️ Tecnologías

- Node.js + Express
- PostgreSQL
- bcrypt (encriptación de contraseñas)
- nodemailer (envío de correos)
- cors (manejo de CORS)

## 🧪 Pruebas con Thunder Client

Base URL: `http://localhost:3000/api`

Ejemplo de registro:
```json
POST /api/usuarios/register
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
