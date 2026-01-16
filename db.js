import pkg from "pg";
import { ENV_CONFIG } from "./config/env.js";

const { Pool } = pkg;

// Configuración de conexión a PostgreSQL usando configuración centralizada
const pool = new Pool({
  host: ENV_CONFIG.DB.HOST,
  user: ENV_CONFIG.DB.USER,
  password: ENV_CONFIG.DB.PASSWORD,
  database: ENV_CONFIG.DB.NAME,
  port: ENV_CONFIG.DB.PORT,
  // Configuraciones adicionales para evitar conexiones colgadas
  max: 20, // máximo número de conexiones en el pool
  idleTimeoutMillis: 30000, // cerrar conexiones inactivas después de 30 segundos
  connectionTimeoutMillis: 2000, // timeout para obtener conexión del pool
  query_timeout: 10000, // timeout para queries (10 segundos)
});

// Verificar conexión
pool.connect()
  .then(() => console.log("✅ Conectado a la base de datos"))
  .catch((err) => console.error("❌ Error al conectar a la base de datos:", err));

// Manejo de errores del pool
pool.on('error', (err, client) => {
  console.error('❌ Error inesperado en el pool de conexiones:', err);
});

pool.on('connect', (client) => {
  if (ENV_CONFIG.isDevelopment()) {
    console.log('🔗 Nueva conexión establecida');
  }
});

pool.on('remove', (client) => {
  if (ENV_CONFIG.isDevelopment()) {
    console.log('🔌 Conexión removida del pool');
  }
});

export default pool; // para que funcione el import en model.js
