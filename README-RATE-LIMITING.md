# 🛡️ Rate Limiting - Configuración de Producción

## Descripción

Sistema de rate limiting distribuido usando Redis, diseñado para entornos de producción con múltiples instancias del servidor.

## Características

### ✅ Almacenamiento Distribuido (Redis)
- **Redis Store**: Todos los límites se almacenan en Redis para consistencia entre múltiples instancias
- **Reconexión automática**: Reintenta conexión con backoff exponencial
- **Pool de conexiones**: Optimizado para rendimiento (2-10 conexiones)

### 🔐 Key Generator Inteligente
- Prioriza ID de usuario autenticado: `user:{id_usuario}`
- Fallback a IP real (considerando X-Forwarded-For): `ip:{client_ip}`
- Último recurso: dirección del socket

### 🛡️ Seguridad Reforzada
- **Login**: 5 intentos cada 15 minutos (anti-fuerza bruta)
- **Registro**: 3 cuentas por hora (anti-spam)
- **Verificación email**: 10 códigos por hora
- **Admin**: 50 operaciones por minuto
- **Password Reset**: 3 intentos por hora (crítico)
- **General API**: 100 requests cada 15 minutos

### 🌐 Trust Proxy
- Detecta IP real detrás de proxies/load balancers
- Configurable para CloudFlare, AWS ELB, Nginx, etc.
- Soporta rangos de IPs privadas

### ⚡ Optimización
- Skip en health checks y rutas estáticas
- Headers estándar (RFC 6585)
- Retry-After preciso en segundos
- Logging detallado de bloqueos

## Configuración Redis

### Variables de Entorno

```bash
# Redis (requerido para producción)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=tu_password_aqui
REDIS_DB=0
REDIS_CLUSTER=false

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000        # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_MAX_REQUESTS=5
REGISTER_RATE_LIMIT_MAX_REQUESTS=3
VERIFICATION_RATE_LIMIT_MAX_REQUESTS=10
ADMIN_RATE_LIMIT_MAX_REQUESTS=50
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

### AWS ElastiCache / Redis Cloud

```bash
REDIS_HOST=tu-cluster.redis.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}  # Desde secrets manager
REDIS_CLUSTER=true
```

## Arquitectura

### Archivos Principales

1. **`/config/redis.js`** - Cliente Redis y conexión
2. **`/middlewares/rateLimiting.js`** - Exportación principal
3. **`/middlewares/rateLimitingProduction.js`** - Implementación completa
4. **`/server.js`** - Inicialización del servidor

### Flujo de Petición

```
Petición → Trust Proxy → Rate Limit Check (Redis) → Handler
                                    ↓
                              Rate Limitado?
                                    ↓
                        ┌───────────┴───────────┐
                        │                       │
                    Sí (429)                 No → Request
                        ↓
                    Header: Retry-After
                    Body: JSON error
                    Log: Detallado
```

## Uso

### Inicialización Automática

En `server.js`, el rate limiting se inicializa automáticamente:

```javascript
import { initRateLimiting } from './src/middlewares/rateLimiting.js';

// Inicializar antes de los middlewares
await initRateLimiting();
```

### Aplicar a Rutas

```javascript
import { loginLimiter } from '../middlewares/rateLimiting.js';

// Aplicar middleware
router.post('/login', loginLimiter, loginController);
```

### Custom Rate Limiter

```javascript
import { dynamicRateLimiter } from '../middlewares/rateLimiting.js';

// Crear limiter dinámico
const customLimiter = dynamicRateLimiter(50, 15); // 50 requests/15min

router.get('/api/custom', customLimiter, controller);
```

## Health Check

### Comprobar Redis

```bash
curl http://localhost:3000/api/health
```

### Rate Limit Status

```javascript
import { checkRateLimitHealth } from './middlewares/rateLimiting.js';

const status = await checkRateLimitHealth();
console.log(status);
// {
//   redis: { healthy: true, message: 'Redis operativo' },
//   rateLimiter: { general: {...}, login: {...} },
//   redisAvailable: true,
//   store: 'Redis'
// }
```

## Monitoreo

### Logs de Rate Limit

Cuando se excede el límite:

```
🚨 Rate limit excedido: POST /api/login
Key: login:ip:192.168.1.100
IP: 192.168.1.100
Retry-After: 897s
```

### Métricas Redis

```bash
# Conectarse a Redis
redis-cli

# Ver claves de rate limit
KEYS rl:*

# Ver TTL de una clave
TTL rl:user:123

# Ver requests restantes
GET rl:ip:192.168.1.100
```

## Escalabilidad

### Multi-Instancia

Todas las instancias comparten el mismo Redis → Consistencia global de límites.

### Redis Cluster

Para alta disponibilidad:

```bash
REDIS_CLUSTER=true
REDIS_HOST=redis-cluster.internal
```

### Redis Sentinel

Configuración automática de failover (ver documentación de `redis` npm package).

## Seguridad

### Prevención de Ataques

- **Fuerza Brutea**: Login limitado a 5/15min
- **SPAM**: Registro limitado a 3/hora
- **Email Bombing**: Verificación limitada a 10/hora
- **DDoS**: API general limitada a 100/15min
- **Abuso Admin**: 50 operaciones/minuto

### Headers de Seguridad

```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1704067200
Retry-After: 900
Content-Type: application/json
```

## Troubleshooting

### Redis No Disponible

**Desarrollo**: El servidor arranca sin Redis (usa memoria local)
**Producción**: El servidor se detiene (requerido)

### Conexión Lenta

- Verificar latencia de red
- Aumentar timeout: `socket: { connectTimeout: 10000 }`
- Usar Redis local o en misma VPC

### Memory Usage

- Redis limpia automáticamente (TTL)
- Configurar `maxmemory-policy: allkeys-lru`
- Monitorear: `redis-cli INFO memory`

## Testing

### Simular Rate Limit

```bash
# Enviar 6 requests rápidos
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/login \
    -H "Content-Type: application/json" \
    -d '{"correo":"t@e.com","contrasena":"123456"}'
done

# El 6to debería devolver 429
```

### Test Redis

```bash
# Conexión
redis-cli ping  # Debería responder PONG

# Keys
KEYS rl:*  # Debería mostrar claves de rate limit

# TTL
TTL rl:user:123  # Tiempo restante en segundos
```

## Mejores Prácticas

1. **Siempre usar Redis en producción**
2. **Configurar password y TLS**
3. **Monitorear memoria de Redis**
4. **Ajustar límites según métricas**
5. **Usar CDN/WAF para capa adicional**
6. **Implementar circuit breaker**
7. **Backoff exponencial en cliente**

## Referencias

- [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit)
- [rate-limit-redis](https://github.com/express-rate-limit/rate-limit-redis)
- [Redis Node.js Client](https://github.com/redis/node-redis)
- [RFC 6585 - 429 Status](https://tools.ietf.org/html/rfc6585#section-4)