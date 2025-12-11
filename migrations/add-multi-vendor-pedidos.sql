-- Migración para soportar pedidos multi-vendedor
-- Ejecutar este script para actualizar la base de datos

-- 1. Agregar campos a la tabla pedidos para soportar pedidos maestros y sub-pedidos
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS id_vendedor INT REFERENCES usuarios(id_usuario),
ADD COLUMN IF NOT EXISTS id_pedido_maestro INT REFERENCES pedidos(id_pedido),
ADD COLUMN IF NOT EXISTS tipo_pedido VARCHAR(20) CHECK (tipo_pedido IN ('maestro','sub_pedido','simple')) DEFAULT 'simple',
ADD COLUMN IF NOT EXISTS es_pedido_compartido BOOLEAN DEFAULT false;

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_pedidos_vendedor ON pedidos(id_vendedor);
CREATE INDEX IF NOT EXISTS idx_pedidos_maestro ON pedidos(id_pedido_maestro);
CREATE INDEX IF NOT EXISTS idx_pedidos_tipo ON pedidos(tipo_pedido);

-- 3. Crear tabla para tracking de notificaciones de pedidos
CREATE TABLE IF NOT EXISTS pedido_notificaciones (
  id_notificacion SERIAL PRIMARY KEY,
  id_pedido INT REFERENCES pedidos(id_pedido),
  id_usuario_destinatario INT REFERENCES usuarios(id_usuario),
  tipo_notificacion VARCHAR(50) NOT NULL, -- 'nuevo_pedido', 'pedido_compartido', 'cambio_estado'
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT false,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Crear vista para pedidos con información de vendedores
CREATE OR REPLACE VIEW vista_pedidos_completa AS
SELECT 
  p.id_pedido,
  p.id_usuario,
  p.id_vendedor,
  p.id_pedido_maestro,
  p.tipo_pedido,
  p.es_pedido_compartido,
  p.fecha_pedido,
  p.total,
  p.estado,
  p.id_ubicacion,
  -- Información del cliente
  u_cliente.nombre as cliente_nombre,
  u_cliente.apellido as cliente_apellido,
  u_cliente.correo as cliente_correo,
  -- Información del vendedor
  u_vendedor.nombre as vendedor_nombre,
  u_vendedor.apellido as vendedor_apellido,
  u_vendedor.correo as vendedor_correo,
  -- Información de ubicación
  ub.nombre as ubicacion_nombre,
  ub.direccion as ubicacion_direccion,
  ub.ciudad as ubicacion_ciudad
FROM pedidos p
LEFT JOIN usuarios u_cliente ON p.id_usuario = u_cliente.id_usuario
LEFT JOIN usuarios u_vendedor ON p.id_vendedor = u_vendedor.id_usuario
LEFT JOIN ubicacion ub ON p.id_ubicacion = ub.id_ubicacion;

-- 5. Comentarios explicativos
COMMENT ON COLUMN pedidos.id_vendedor IS 'ID del vendedor responsable de este pedido (para sub-pedidos)';
COMMENT ON COLUMN pedidos.id_pedido_maestro IS 'ID del pedido maestro al que pertenece este sub-pedido';
COMMENT ON COLUMN pedidos.tipo_pedido IS 'Tipo: maestro (agrupa sub-pedidos), sub_pedido (para un vendedor), simple (un solo vendedor)';
COMMENT ON COLUMN pedidos.es_pedido_compartido IS 'Indica si este pedido maestro tiene productos de múltiples vendedores';