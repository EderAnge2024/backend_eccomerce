import express from "express";
import cors from "cors";
import router from "./modules/routes.js"; // Rutas principales
import "./modules/models.js"; // Inicializar tablas

const app = express();

// Middlewares
app.use(cors());
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

const PORT = 3000;
app.listen(PORT,"0.0.0.0", () => {
  console.log(`✅ Servidor corriendo en http://0.0.0.0:${PORT}`);
});
