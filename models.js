import pool from "../../db.js";
import { initializeAdmin } from "../../modules/users/init-admin.js";

// Crear tablas automáticamente
async function ensureTables() {
  const usuarios = `
    CREATE TABLE IF NOT EXISTS usuarios (
      id_usuario SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      apellido VARCHAR(100),
      correo VARCHAR(150) UNIQUE NOT NULL,
      telefono VARCHAR(15),
      direccion VARCHAR(150),
      rol VARCHAR(20) CHECK (rol IN ('cliente','administrador')) DEFAULT 'cliente',
      usuario VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      es_super_admin BOOLEAN DEFAULT false
    );
  `;

  const ubicacion = `
    CREATE TABLE IF NOT EXISTS ubicacion (
      id_ubicacion SERIAL PRIMARY KEY,
      id_usuario INT REFERENCES usuarios(id_usuario),
      nombre VARCHAR(100) NOT NULL,
      direccion VARCHAR(255) NOT NULL,
      ciudad VARCHAR(100),
      codigo_postal VARCHAR(20),
      telefono VARCHAR(15),
      es_principal BOOLEAN DEFAULT false,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const pedidos = `
    CREATE TABLE IF NOT EXISTS pedidos (
      id_pedido SERIAL PRIMARY KEY,
      id_usuario INT REFERENCES usuarios(id_usuario),
      id_vendedor INT REFERENCES usuarios(id_usuario),
      id_pedido_maestro INT REFERENCES pedidos(id_pedido),
      id_ubicacion INT REFERENCES ubicacion(id_ubicacion) ON DELETE SET NULL,
      fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      total DECIMAL(10,2) NOT NULL,
      estado VARCHAR(20) CHECK (estado IN ('Pendiente','En proceso','Entregado')) DEFAULT 'Pendiente',
      tipo_pedido VARCHAR(20) CHECK (tipo_pedido IN ('maestro','sub_pedido','simple')) DEFAULT 'simple',
      es_pedido_compartido BOOLEAN DEFAULT false
    );
  `;

  const pedidoProducto = `
    CREATE TABLE IF NOT EXISTS pedido_producto (
      id_proPedido SERIAL PRIMARY KEY,
      id_pedido INT REFERENCES pedidos(id_pedido),
      id_producto VARCHAR(100) NOT NULL,
      cantidad INT NOT NULL,
      precio DECIMAL(10,2) NOT NULL
    );
  `;

  const token = `
    CREATE TABLE IF NOT EXISTS token (
      id_token SERIAL PRIMARY KEY,
      id_usuario INT REFERENCES usuarios(id_usuario),
      code_recuperacion VARCHAR(255) NOT NULL,
      fecha_expiracion TIMESTAMP NOT NULL
    );
  `;

  const productos = `
    CREATE TABLE IF NOT EXISTS productos (
      id_producto SERIAL PRIMARY KEY,
      id_usuario INT REFERENCES usuarios(id_usuario),
      title VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      image VARCHAR(500),
      rating_rate DECIMAL(3,2),
      rating_count INT,
      stock INT DEFAULT 0,
      stock_reservado INT DEFAULT 0,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const pedidoNotificaciones = `
    CREATE TABLE IF NOT EXISTS pedido_notificaciones (
      id_notificacion SERIAL PRIMARY KEY,
      id_pedido INT REFERENCES pedidos(id_pedido),
      id_usuario_destinatario INT REFERENCES usuarios(id_usuario),
      tipo_notificacion VARCHAR(50) NOT NULL,
      mensaje TEXT NOT NULL,
      leida BOOLEAN DEFAULT false,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const indices = `
    CREATE INDEX IF NOT EXISTS idx_pedidos_vendedor ON pedidos(id_vendedor);
    CREATE INDEX IF NOT EXISTS idx_pedidos_maestro ON pedidos(id_pedido_maestro);
    CREATE INDEX IF NOT EXISTS idx_pedidos_tipo ON pedidos(tipo_pedido);
    CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON pedido_notificaciones(id_usuario_destinatario);
    CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON pedido_notificaciones(leida);
  `;

  const vista = `
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
    
    CREATE OR REPLACE VIEW vista_stock_disponible AS
    SELECT 
      id_producto,
      id_usuario,
      title,
      price,
      description,
      category,
      image,
      rating_rate,
      rating_count,
      stock,
      stock_reservado,
      (stock - stock_reservado) as stock_disponible,
      fecha_creacion
    FROM productos;
  `;

  const comentarios = `
    COMMENT ON COLUMN pedidos.id_vendedor IS 'ID del vendedor responsable de este pedido (para sub-pedidos)';
    COMMENT ON COLUMN pedidos.id_pedido_maestro IS 'ID del pedido maestro al que pertenece este sub-pedido';
    COMMENT ON COLUMN pedidos.tipo_pedido IS 'Tipo: maestro (agrupa sub-pedidos), sub_pedido (para un vendedor), simple (un solo vendedor)';
    COMMENT ON COLUMN pedidos.es_pedido_compartido IS 'Indica si este pedido maestro tiene productos de múltiples vendedores';
  `;

  try {
    await pool.query( usuarios );
    await pool.query( ubicacion );
    await pool.query( pedidos );
    await pool.query( pedidoProducto );
    await pool.query( token );
    await pool.query( productos );
    await pool.query( pedidoNotificaciones );
    
    // Crear índices
    await pool.query( indices );
    
    // Crear vista
    await pool.query( vista );
    
    // Agregar comentarios
    await pool.query( comentarios );
    
    console.log("✅ Tablas creadas/verificadas correctamente");
    console.log("✅ Sistema multi-vendedor configurado");
    console.log("✅ Índices y vista creados");
    
    // Inicializar usuario administrador de forma asíncrona
    initializeAdmin().catch(error => {
      console.error("❌ Error en inicialización:", error.message);
    });
  } catch (err) {
    console.error("❌ Error creando tablas:", err);
  }
}

ensureTables();
