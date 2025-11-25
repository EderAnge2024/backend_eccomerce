-- Migración para corregir el tipo de id_producto en pedido_producto
-- Este script convierte id_producto de VARCHAR a INTEGER para que coincida con la tabla productos

-- Paso 1: Eliminar productos que no sean numéricos (si existen)
DELETE FROM pedido_producto WHERE id_producto !~ '^[0-9]+$';

-- Paso 2: Cambiar el tipo de columna de VARCHAR a INTEGER
ALTER TABLE pedido_producto 
ALTER COLUMN id_producto TYPE INTEGER USING id_producto::integer;

-- Paso 3: Agregar foreign key constraint (opcional pero recomendado)
-- ALTER TABLE pedido_producto 
-- ADD CONSTRAINT fk_pedido_producto_producto 
-- FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE;

-- Verificar el cambio
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pedido_producto' AND column_name = 'id_producto';
