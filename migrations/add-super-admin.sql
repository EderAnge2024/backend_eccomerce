-- Script de migración para agregar campo es_super_admin

-- 1. Agregar campo es_super_admin a la tabla usuarios (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' AND column_name = 'es_super_admin'
    ) THEN
        ALTER TABLE usuarios 
        ADD COLUMN es_super_admin BOOLEAN DEFAULT false;
        
        RAISE NOTICE 'Campo es_super_admin agregado a la tabla usuarios';
    ELSE
        RAISE NOTICE 'Campo es_super_admin ya existe en la tabla usuarios';
    END IF;
END $$;

-- 2. Marcar el primer administrador como super admin
UPDATE usuarios 
SET es_super_admin = true 
WHERE id_usuario = 1 AND rol = 'administrador';

-- 3. Verificar resultado
DO $$ 
DECLARE
    super_admin_count INT;
BEGIN
    SELECT COUNT(*) INTO super_admin_count 
    FROM usuarios 
    WHERE es_super_admin = true;
    
    RAISE NOTICE 'Super administradores en el sistema: %', super_admin_count;
END $$;

-- Mensaje de confirmación
DO $$ 
BEGIN
    RAISE NOTICE 'Migración completada exitosamente';
    RAISE NOTICE '- Campo es_super_admin agregado';
    RAISE NOTICE '- Usuario ID 1 marcado como super admin';
END $$;
