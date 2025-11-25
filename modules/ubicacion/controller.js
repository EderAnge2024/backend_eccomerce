import { 
  createUbicacion, getAllUbicaciones, getUbicacionById, 
  getUbicacionesByUser, updateUbicacion, deleteUbicacion 
} from "./model.js";

// ============ CRUD UBICACIONES ============

export async function createUbicacionController(req, res) {
  const { id_usuario, nombre, direccion, ciudad, codigo_postal, telefono, es_principal } = req.body;
  
  if (!id_usuario || !nombre || !direccion) {
    return res.status(400).json({ success: false, message: "Campos obligatorios: id_usuario, nombre, direccion" });
  }

  try {
    const newUbicacion = await createUbicacion(id_usuario, nombre, direccion, ciudad, codigo_postal, telefono, es_principal);
    res.json({ success: true, ubicacion: newUbicacion });
  } catch (err) {
    console.error('Error en createUbicacionController:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getUbicaciones(req, res) {
  try {
    const ubicaciones = await getAllUbicaciones();
    res.json({ success: true, ubicaciones });
  } catch (err) {
    console.error('Error en getUbicaciones:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getUbicacion(req, res) {
  const { id } = req.params;
  try {
    const ubicacion = await getUbicacionById(id);
    if (!ubicacion) {
      return res.status(404).json({ success: false, message: "Ubicación no encontrada" });
    }
    res.json({ success: true, ubicacion });
  } catch (err) {
    console.error('Error en getUbicacion:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getUbicacionesByUserController(req, res) {
  const { id_usuario } = req.params;
  try {
    const ubicaciones = await getUbicacionesByUser(id_usuario);
    res.json({ success: true, ubicaciones });
  } catch (err) {
    console.error('Error en getUbicacionesByUserController:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateUbicacionController(req, res) {
  const { id } = req.params;
  const { nombre, direccion, ciudad, codigo_postal, telefono, es_principal } = req.body;
  
  if (!nombre || !direccion) {
    return res.status(400).json({ success: false, message: "Campos obligatorios: nombre, direccion" });
  }

  try {
    const updatedUbicacion = await updateUbicacion(id, nombre, direccion, ciudad, codigo_postal, telefono, es_principal);
    if (!updatedUbicacion) {
      return res.status(404).json({ success: false, message: "Ubicación no encontrada" });
    }
    res.json({ success: true, ubicacion: updatedUbicacion });
  } catch (err) {
    console.error('Error en updateUbicacionController:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteUbicacionController(req, res) {
  const { id } = req.params;
  try {
    const deletedUbicacion = await deleteUbicacion(id);
    if (!deletedUbicacion) {
      return res.status(404).json({ success: false, message: "Ubicación no encontrada" });
    }
    res.json({ success: true, message: "Ubicación eliminada", ubicacion: deletedUbicacion });
  } catch (err) {
    console.error('Error en deleteUbicacionController:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
