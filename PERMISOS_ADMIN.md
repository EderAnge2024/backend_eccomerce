# 🛡️ Sistema de Permisos de Administradores

## Descripción General

El sistema implementa un modelo de permisos donde cada administrador tiene acceso limitado a sus propios recursos, excepto el super administrador que tiene privilegios especiales.

## Jerarquía de Usuarios

### 1. Super Administrador (ID 1)
**Privilegios:**
- ✅ Crear otros administradores
- ✅ Ver todos los productos del sistema
- ✅ Ver todos los pedidos del sistema
- ✅ Gestionar usuarios y cambiar roles
- ✅ Acceso completo al panel de administración

**Identificación:**
- Campo `es_super_admin = true` en la base de datos
- Siempre tiene `id_usuario = 1`

### 2. Administradores Regulares
**Privilegios:**
- ✅ Ver solo sus propios productos
- ✅ Agregar nuevos productos (se asignan a su ID)
- ✅ Editar sus propios productos
- ✅ Eliminar sus propios productos
- ✅ Ver pedidos que contienen sus productos
- ✅ Cambiar estado de pedidos con sus productos
- ✅ Ver información de clientes que compraron sus productos
- ✅ Cambiar roles de usuarios a "cliente"
- ❌ NO pueden crear otros administradores
- ❌ NO pueden ver productos de otros admins
- ❌ NO pueden ver pedidos sin sus productos

### 3. Clientes
**Privilegios:**
- ✅ Ver todos los productos del catálogo
- ✅ Realizar compras
- ✅ Ver su historial de pedidos
- ✅ Gestionar sus direcciones de envío
- ✅ Editar su perfil
- ❌ NO tienen acceso al panel de administración

## Flujo de Productos por Administrador

### Creación de Productos
```javascript
// Cuando un admin crea un producto
POST /api/productos
{
  "id_usuario": 2,  // ID del admin que lo crea
  "title": "Producto X",
  "price": 99.99,
  ...
}
```

El producto queda asociado al administrador que lo creó mediante el campo `id_usuario`.

### Visualización de Productos
```javascript
// Admin regular (ID 2) solo ve sus productos
GET /api/productos/usuario/2

// Respuesta: Solo productos donde id_usuario = 2
```

### Edición y Eliminación
Los administradores solo pueden editar o eliminar productos donde `id_usuario` coincida con su ID.

## Flujo de Pedidos por Administrador

### Cómo Funciona

Cuando un cliente realiza una compra:
1. Se crea un pedido con los productos seleccionados
2. Los productos se guardan en `pedido_producto` con referencia al `id_producto`
3. Cada producto tiene un `id_usuario` que identifica al admin que lo creó

### Consulta de Pedidos por Admin

```sql
-- Query que filtra pedidos con productos del admin
SELECT DISTINCT p.*
FROM pedidos p
INNER JOIN pedido_producto pp ON p.id_pedido = pp.id_pedido
INNER JOIN productos prod ON pp.id_producto = prod.id_producto::text
WHERE prod.id_usuario = 2  -- ID del admin
```

**Resultado:** El admin solo ve pedidos que contienen al menos uno de sus productos.

### Ejemplo Práctico

**Escenario:**
- Admin A (ID 2) tiene productos: [1, 2, 3]
- Admin B (ID 3) tiene productos: [4, 5, 6]
- Cliente compra: Producto 1 (Admin A) + Producto 4 (Admin B)

**Resultado:**
- Admin A ve el pedido (contiene su producto 1)
- Admin B ve el pedido (contiene su producto 4)
- Ambos pueden gestionar el estado del pedido
- Cada uno solo ve la información relevante a sus productos

## Endpoints del Backend

### Productos

| Endpoint | Descripción | Acceso |
|----------|-------------|--------|
| `GET /api/productos` | Todos los productos | Público |
| `GET /api/productos/usuario/:id` | Productos de un admin | Admin |
| `POST /api/productos` | Crear producto | Admin |
| `PUT /api/productos/:id` | Actualizar producto | Admin (solo propios) |
| `DELETE /api/productos/:id` | Eliminar producto | Admin (solo propios) |

### Pedidos

| Endpoint | Descripción | Acceso |
|----------|-------------|--------|
| `GET /api/pedidos` | Todos los pedidos | Super Admin |
| `GET /api/pedidos/admin/:id` | Pedidos con productos del admin | Admin |
| `GET /api/pedidos/usuario/:id` | Pedidos de un cliente | Cliente/Admin |
| `PUT /api/pedidos/:id/estado` | Cambiar estado | Admin |

### Usuarios

| Endpoint | Descripción | Acceso |
|----------|-------------|--------|
| `GET /api/usuarios` | Todos los usuarios | Admin |
| `PUT /api/usuarios/:id` | Actualizar usuario/rol | Admin |

## Implementación en el Frontend

### Componente de Productos (Admin)

```javascript
// ECCOMERCE-MOBILE/app/modules/admin/modules/productos.jsx

const cargarProductos = async () => {
  // Carga solo productos del admin actual
  const response = await getProductosByUser(user.id_usuario);
  setProductos(response.productos);
};
```

### Componente de Pedidos (Admin)

```javascript
// ECCOMERCE-MOBILE/app/modules/admin/modules/pedidos.jsx

const cargarPedidos = async () => {
  // Carga solo pedidos con productos del admin actual
  const response = await getPedidosByAdmin(user.id_usuario);
  setPedidos(response.pedidos);
};
```

### Componente de Clientes (Admin)

```javascript
// ECCOMERCE-MOBILE/app/modules/admin/modules/clientes.jsx

const handleCambiarRol = async (cliente, nuevoRol) => {
  // Solo super admin puede crear administradores
  if (nuevoRol === 'administrador' && !esSuperAdmin) {
    Alert.alert('Permiso Denegado', 'Solo el super admin puede crear admins');
    return;
  }
  // Proceder con el cambio de rol
};
```

## Validaciones de Seguridad

### Backend
- ✅ Verificar `id_usuario` en cada operación CRUD de productos
- ✅ Filtrar pedidos por productos del admin en consultas
- ✅ Validar permisos antes de cambiar roles
- ✅ Proteger endpoints sensibles

### Frontend
- ✅ Ocultar opciones no permitidas según rol
- ✅ Mostrar mensajes claros de permisos denegados
- ✅ Validar rol antes de mostrar panel de admin
- ✅ Filtrar datos según permisos del usuario

## Casos de Uso

### Caso 1: Admin Agrega Producto
1. Admin B (ID 3) crea "Laptop Gaming"
2. Producto se guarda con `id_usuario = 3`
3. Solo Admin B puede editar/eliminar este producto
4. Todos los clientes pueden ver y comprar el producto

### Caso 2: Cliente Compra Productos de Múltiples Admins
1. Cliente compra:
   - "Laptop Gaming" (Admin B, ID 3)
   - "Mouse Gamer" (Admin A, ID 2)
2. Se crea un pedido con ambos productos
3. Admin A ve el pedido (tiene Mouse Gamer)
4. Admin B ve el pedido (tiene Laptop Gaming)
5. Ambos pueden cambiar el estado del pedido

### Caso 3: Admin Intenta Crear Otro Admin
1. Admin regular intenta promover usuario a admin
2. Sistema verifica: `es_super_admin === true`?
3. Si NO: Muestra error "Permiso Denegado"
4. Si SÍ: Permite el cambio de rol

## Beneficios del Sistema

### Para el Negocio
- 📊 Cada admin gestiona su inventario independientemente
- 🔒 Seguridad: Admins no ven productos de otros
- 📈 Escalabilidad: Múltiples admins sin conflictos
- 🎯 Responsabilidad clara por producto

### Para los Administradores
- 🎨 Panel limpio con solo sus productos
- 📦 Seguimiento de pedidos relevantes
- ⚡ Gestión más rápida y enfocada
- 🔔 Notificaciones solo de sus productos

### Para los Clientes
- 🛍️ Catálogo completo de todos los admins
- 📦 Pedidos unificados
- 🚚 Seguimiento centralizado
- 💳 Experiencia de compra fluida

## Archivos Modificados

### Backend
- `backend/modules/pedidos/model.js` - Agregada función `getPedidosByAdmin()`
- `backend/modules/pedidos/controller.js` - Agregado controlador `getPedidosByAdminController()`
- `backend/modules/routes.js` - Agregada ruta `GET /api/pedidos/admin/:id_admin`

### Frontend
- `ECCOMERCE-MOBILE/components/services/store/pedidos.js` - Agregada función `getPedidosByAdmin()`
- `ECCOMERCE-MOBILE/app/modules/admin/modules/productos.jsx` - Usa `getProductosByUser()`
- `ECCOMERCE-MOBILE/app/modules/admin/modules/pedidos.jsx` - Usa `getPedidosByAdmin()`

## Testing

### Probar Permisos de Productos
```bash
# Como Admin ID 2
GET /api/productos/usuario/2
# Debe retornar solo productos con id_usuario = 2

# Como Admin ID 3
GET /api/productos/usuario/3
# Debe retornar solo productos con id_usuario = 3
```

### Probar Permisos de Pedidos
```bash
# Como Admin ID 2
GET /api/pedidos/admin/2
# Debe retornar solo pedidos con productos donde id_usuario = 2

# Como Admin ID 3
GET /api/pedidos/admin/3
# Debe retornar solo pedidos con productos donde id_usuario = 3
```

### Probar Creación de Admins
```bash
# Como Admin Regular (ID 2)
PUT /api/usuarios/5
{ "rol": "administrador" }
# Frontend debe bloquear esta acción

# Como Super Admin (ID 1)
PUT /api/usuarios/5
{ "rol": "administrador" }
# Debe permitir el cambio
```

## Mantenimiento

### Agregar Nuevo Admin
1. Super admin inicia sesión
2. Va a "Gestión de Clientes"
3. Selecciona usuario
4. Cambia rol a "administrador"
5. Usuario ahora tiene acceso al panel admin

### Revocar Permisos de Admin
1. Super admin selecciona administrador
2. Cambia rol a "cliente"
3. Usuario pierde acceso al panel
4. Sus productos permanecen en el sistema

### Auditoría
- Cada producto tiene `id_usuario` para rastrear creador
- Cada pedido se puede rastrear a los admins involucrados
- Logs del sistema registran cambios de rol
