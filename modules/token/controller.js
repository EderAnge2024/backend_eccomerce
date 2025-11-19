import { 
  createToken, getAllTokens, getTokenById, getTokensByUser, 
  updateToken, deleteToken, cleanExpiredTokens 
} from "./model.js";

// Crear token
export async function createTokenController(req, res) {
  const { id_usuario, code_recuperacion, fecha_expiracion } = req.body;
  
  if (!id_usuario || !code_recuperacion || !fecha_expiracion) {
    return res.status(400).json({ 
      success: false, 
      message: "id_usuario, code_recuperacion y fecha_expiracion son obligatorios" 
    });
  }

  try {
    const newToken = await createToken(id_usuario, code_recuperacion, fecha_expiracion);
    res.json({ success: true, token: newToken });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Obtener todos los tokens
export async function getTokens(req, res) {
  try {
    const tokens = await getAllTokens();
    res.json({ success: true, tokens });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Obtener token por ID
export async function getToken(req, res) {
  const { id } = req.params;
  try {
    const token = await getTokenById(id);
    if (!token) {
      return res.status(404).json({ success: false, message: "Token no encontrado" });
    }
    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Obtener tokens por usuario
export async function getTokensByUserController(req, res) {
  const { id_usuario } = req.params;
  try {
    const tokens = await getTokensByUser(id_usuario);
    res.json({ success: true, tokens });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Actualizar token
export async function updateTokenController(req, res) {
  const { id } = req.params;
  const { code_recuperacion, fecha_expiracion } = req.body;
  
  if (!code_recuperacion || !fecha_expiracion) {
    return res.status(400).json({ 
      success: false, 
      message: "code_recuperacion y fecha_expiracion son obligatorios" 
    });
  }

  try {
    const updatedToken = await updateToken(id, code_recuperacion, fecha_expiracion);
    if (!updatedToken) {
      return res.status(404).json({ success: false, message: "Token no encontrado" });
    }
    res.json({ success: true, token: updatedToken });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Eliminar token
export async function deleteTokenController(req, res) {
  const { id } = req.params;
  try {
    const deletedToken = await deleteToken(id);
    if (!deletedToken) {
      return res.status(404).json({ success: false, message: "Token no encontrado" });
    }
    res.json({ success: true, message: "Token eliminado", token: deletedToken });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Limpiar tokens expirados
export async function cleanExpiredTokensController(req, res) {
  try {
    const deletedTokens = await cleanExpiredTokens();
    res.json({ 
      success: true, 
      message: `${deletedTokens.length} tokens expirados eliminados`, 
      tokens: deletedTokens 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
