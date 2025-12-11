import express from "express";
import cors from "cors";
import router from "./modules/routes.js"; // Rutas principales
import "./modules/models.js"; // Inicializar tablas
import { ENV_CONFIG } from "./config/env.js";

const app = express();

// Middlewares
app.use(cors({
  origin: ENV_CONFIG.CORS.ALLOWED_ORIGINS,
  credentials: true
}));
app.use(express.json());

// Middleware de logging para debugging
app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Prefijo de rutas
app.use("/api", router);

app.listen(ENV_CONFIG.PORT, ENV_CONFIG.HOST, () => {
  console.log(`✅ Servidor corriendo en http://${ENV_CONFIG.HOST}:${ENV_CONFIG.PORT}`);
  
  // Log configuration in development
  ENV_CONFIG.logConfig();
});
