import { initializeAdmin } from "../src/models/users/init-admin.js";

async function runSeed() {
  console.log("🛠️ Iniciando script de poblado manual...");
  try {
    const result = await initializeAdmin();
    if (result.success) {
      console.log("✅ Proceso completado exitosamente.");
    } else {
      console.log("⚠️ El proceso terminó con advertencias o errores.");
    }
  } catch (error) {
    console.error("❌ Error fatal en el script de poblado:", error);
  } finally {
    process.exit(0);
  }
}

runSeed();
