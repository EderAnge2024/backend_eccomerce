-- Script de migración para agregar campo id_ubicacion a la tabla pedidos

-- 1. Agregar campo id_ubicacion a la tabla pedidos (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' AND column_name = 'id_ubicacion'
    ) THEN
        ALTER TABLE pedidos 
        ADD COLUMN id_ubicacion INT REFERENCES ubicacion(id_ubicacion) ON DELETE SET NULL;
        
        RAISE NOTICE 'Campo id_ubicacion agregado a la tabla pedidos';
    ELSE
        RAISE NOTICE 'Campo id_ubicacion ya existe en la tabla pedidos';
    END IF;
END $$;

-- 2. Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_pedidos_ubicacion ON pedidos(id_ubicacion);

-- Mensaje de confirmación
DO $$ 
BEGIN
    RAISE NOTICE 'Migración completada exitosamente';
    RAISE NOTICE '- Campo id_ubicacion agregado a pedidos';
    RAISE NOTICE '- Índice creado para optimización';
END $$;
