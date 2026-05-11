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
- `REDIS_HOST`, `REDIS_PORT`: Configuración de Redis (recomendado para producción).

### 3. Ejecución
```bash
# Desarrollo con reinicio automático
npm start
```

## 🛡️ Pilares de Seguridad

El sistema implementa múltiples capas de protección:
- **Autenticación JWT**: Tokens de acceso (1h) y Refresh tokens (7d).
- **Control de Acceso (RBAC)**: Roles de `cliente`, `administrador` y `super_administrador`.
- **Rate Limiting Avanzado**: Protección contra fuerza bruta y DDoS usando Redis:
  - 🔐 Login: 5 intentos/15min (anti-fuerza bruta)
  - 📝 Registro: 3 cuentas/hora (anti-spam)
  - 📧 Verificación: 10 códigos/hora
  - 🔧 Admin: 50 operaciones/minuto
  - 🌐 API General: 100 requests/15min
- **Trust Proxy**: Detección de IP real detrás de proxies/load balancers
- **Key Generator Inteligente**: Tracking por usuario autenticado o IP
- **Sanitización**: Protección automática contra SQL Injection y XSS (Helmet + express-validator).
- **Auditoría**: Registro de operaciones administrativas y bloqueos de seguridad.

## 🔗 Redis - Rate Limiting Distribuido

El sistema utiliza **Redis** para almacenar los contadores de rate limiting de forma distribuida, permitiendo consistencia entre múltiples instancias del servidor.

### Variables de Entorno (Redis)

```bash
# Redis (requerido para producción)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_CLUSTER=false
```

### Docker Compose (Redis)

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: redis-cache
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
```

### Verificación

```bash
# Comprobar conexión
redis-cli ping  # Respuesta: PONG

# Ver claves de rate limit
KEYS rl:*

# Ver TTL de una clave
TTL rl:user:123
```

### Modo Fallback

- **Producción**: Redis es requerido (el servidor se detiene si no está disponible)
- **Desarrollo**: Si Redis no está disponible, usa memoria local (ideal para testing)

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
- **Rate Limiting**: ✅ Redis
- **Estado de Producción**: ✅ Ready
- **Última Auditoría**: Marzo 2026

**Desarrollado con estándares de alta disponibilidad y seguridad bancaria.** 🔒