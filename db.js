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
});

// Verificar conexión
pool.connect()
  .then(() => console.log("✅ Conectado a la base de datos"))
  .catch((err) => console.error("❌ Error al conectar a la base de datos:", err));

export default pool; // para que funcione el import en model.js
