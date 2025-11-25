import pool from "../db.js";
import { initializeAdmin } from "./users/init-admin.js";

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
      id_ubicacion INT REFERENCES ubicacion(id_ubicacion) ON DELETE SET NULL,
      fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      total DECIMAL(10,2) NOT NULL,
      estado VARCHAR(20) CHECK (estado IN ('Pendiente','En proceso','Entregado')) DEFAULT 'Pendiente'
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
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query( usuarios );
    await pool.query( ubicacion );
    await pool.query( pedidos );
    await pool.query( pedidoProducto );
    await pool.query( token );
    await pool.query( productos );
    console.log("Tablas creadas/verificadas correctamente ✔");
    
    // Inicializar usuario administrador
    await initializeAdmin();
  } catch (err) {
    console.error("Error creando tablas:", err);
  }
}

ensureTables();
