-- Script de migración para agregar nuevas funcionalidades
-- Ejecutar este script si ya tienes una base de datos existente

-- 1. Agregar campo 'estado' a la tabla pedidos (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' AND column_name = 'estado'
    ) THEN
        ALTER TABLE pedidos 
        ADD COLUMN estado VARCHAR(20) CHECK (estado IN ('Pendiente','En proceso','Entregado')) DEFAULT 'Pendiente';
        
        -- Actualizar pedidos existentes con estado 'Pendiente'
        UPDATE pedidos SET estado = 'Pendiente' WHERE estado IS NULL;
        
        RAISE NOTICE 'Campo estado agregado a la tabla pedidos';
    ELSE
        RAISE NOTICE 'Campo estado ya existe en la tabla pedidos';
    END IF;
END $$;

-- 2. Crear tabla ubicacion (si no existe)
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

-- 3. Crear tabla productos (si no existe)
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
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_ubicacion_usuario ON ubicacion(id_usuario);
CREATE INDEX IF NOT EXISTS idx_ubicacion_principal ON ubicacion(id_usuario, es_principal);
CREATE INDEX IF NOT EXISTS idx_productos_usuario ON productos(id_usuario);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(category);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);

-- Mensaje de confirmación
DO $$ 
BEGIN
    RAISE NOTICE 'Migración completada exitosamente';
    RAISE NOTICE '- Campo estado agregado a pedidos';
    RAISE NOTICE '- Tabla ubicacion creada';
    RAISE NOTICE '- Tabla productos creada';
    RAISE NOTICE '- Índices creados para optimización';
END $$;
