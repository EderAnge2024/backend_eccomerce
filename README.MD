# Backend API - E-commerce Seguro & Multi-Vendedor 🛡️💼

Este es el núcleo del sistema de e-commerce, una API robusta construida con **Node.js, Express y PostgreSQL**, diseñada con un enfoque prioritario en la seguridad y la escalabilidad.

## 🚀 Instalación y Configuración

### 1. Clonar e Instalar Dependencias
```bash
npm install
npm run install-security
```

### 2. Configuración de Entorno
Crea un archivo `.env` basado en `.env.example`:
```bash
cp .env.example .env
```
Configura las siguientes variables críticas:
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: Credenciales de PostgreSQL.
- `JWT_SECRET`: Llave para firmas de tokens (se genera una auto si se deja vacía).
- `ALLOWED_ORIGINS`: Dominios permitidos para CORS (ej: `http://localhost:5173`).

### 3. Ejecución
```bash
# Desarrollo con reinicio automático
npm start
```

## 🛡️ Pilares de Seguridad

El sistema implementa múltiples capas de protección:
- **Autenticación JWT**: Tokens de acceso (1h) y Refresh tokens (7d).
- **Control de Acceso (RBAC)**: Roles de `cliente`, `administrador` y `super_administrador`.
- **Rate Limiting**: Protección contra fuerza bruta en login (5 intentos/15min) y ráfagas de peticiones.
- **Sanitización**: Protección automática contra SQL Injection y XSS (Helmet + express-validator).
- **Auditoría**: Registro de operaciones administrativas y bloqueos de seguridad.

## 📦 Características Principales

### 🤝 Sistema Multi-Vendedor
Permite que múltiples vendedores gestionen sus propios productos y pedidos de forma independiente dentro de la misma plataforma.

### 🔄 Integración Híbrida de Productos
- **Productos Propios**: Almacenados directamente en PostgreSQL.
- **Productos Externos**: Sincronización transparente con `FakeStore API`.
- **Script de Población**: `node seed-productos.js` para cargar el catálogo inicial.

### 📧 Sistema de Recuperación
Gestión de olvido de contraseñas mediante códigos de verificación enviados por email (Nodemailer).

## 🔗 Endpoints Clave

### Públicos
- `POST /api/usuarios/register`: Registro de nuevos usuarios.
- `POST /api/usuarios/login`: Obtención de tokens.
- `GET /api/productos`: Catálogo combinado (BD + API).

### Clientes (Auth Requerida)
- `POST /api/pedidos`: Creación de órdenes de compra.
- `GET /api/pedidos/usuario/:id`: Historial de pedidos personal.

### Administración (Admin Requerido)
- `POST /api/productos`: Gestión de inventario (CRUD).
- `PUT /api/pedidos/:id/estado`: Control de logística y estados.
- `GET /api/usuarios`: Gestión de base de usuarios.

## 🛠️ Herramientas de Gestión de Acceso

Se incluyen scripts especializados para la administración del sistema:
- `npm run show-admin`: Lista usuarios con privilegios.
- `node change-superadmin-password.js`: Cambio interactivo y seguro de contraseña.
- `node reset-superadmin-password.js`: Reset de emergencia.

---

## 📊 Estado del Sistema
- **Versión**: 2.0 (Segura)
- **Base de Datos**: PostgreSQL
- **Estado de Producción**: ✅ Ready
- **Última Auditoría**: Marzo 2026

**Desarrollado con estándares de alta disponibilidad y seguridad bancaria.** 🔒
