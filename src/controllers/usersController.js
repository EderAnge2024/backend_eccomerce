import { 
  createUser, getAllUsers, getUserById, updateUser, deleteUser,
  findUser, findUserByEmail, updatePassword, 
  createVerificationCode, verifyCode, cleanExpiredCodes 
} from "../models/user.model.js";
import pool from "../../db.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { ENV_CONFIG } from "../../config/env.js";
import { generateAccessToken, generateRefreshToken, createUserPayload } from "../utils/jwt.js";
import { 
  validateEmail, validatePassword, validateUsername, validatePhoneNumber,
  validateTextLength, sanitizeString 
} from "../helpers/validation.js";
import { successResponse, errorResponse } from "../helpers/response.js";

// se encarga de le envio a la correo del codigo de verificacion
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: ENV_CONFIG.EMAIL.GMAIL_USER,
      pass: ENV_CONFIG.EMAIL.GMAIL_APP_PASSWORD
    },
    connectionTimeout: 30000,
    socketTimeout: 30000,
    greetingTimeout: 30000,
    pool: true,
    maxConnections: 3,
    maxMessages: 50
  });
};

// reintenta el envio si esta falla
const sendEmailWithRetry = async (mailOptions, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const transporter = createTransporter();
    try {
      console.log(`📧 Intento ${attempt} de enviar correo a: ${mailOptions.to}`);
      const result = await transporter.sendMail(mailOptions);
      console.log(`✅ Correo enviado a: ${mailOptions.to}`);
      await transporter.close();
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(`❌ Intento ${attempt} fallido:`, error.code);
      try { await transporter.close(); } catch (e) {}
      if (attempt === maxRetries) throw error;
      const waitTime = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

const VERIFICATION_CODE_EXPIRATION = ENV_CONFIG.EMAIL.VERIFICATION_CODE_EXPIRATION;

// genera el contenido del correo y llama a la funcion de envio
const sendVerificationCode = async (correo, codigo) => {
  if (!ENV_CONFIG.EMAIL.GMAIL_USER || !ENV_CONFIG.EMAIL.GMAIL_APP_PASSWORD) {
    console.error('❌ Credenciales de correo no configuradas');
    throw new Error('Credenciales de correo no configuradas');
  }

  const mailOptions = {
    from: `"Sistema de Verificación" <${ENV_CONFIG.EMAIL.GMAIL_USER}>`,
    to: correo,
    subject: '🔐 Código de Verificación - Recuperación de Contraseña',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; text-align: center;">Recuperación de Contraseña</h2>
        <p>Hola,</p>
        <p>Has solicitado restablecer tu contraseña. Usa el siguiente código para verificar tu identidad:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; margin: 25px 0; letter-spacing: 8px; border-radius: 8px;">
          ${codigo}
        </div>
        <p>Este código expirará en <strong>10 minutos</strong>.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Si no solicitaste este código, por favor ignora este mensaje.
        </p>
      </div>
    `
  };

  try {
    return await sendEmailWithRetry(mailOptions);
  } catch (error) {
    console.error('❌ Error enviando correo:', error);
    throw new Error(`Error al enviar el correo: ${error.message}`);
  }
};

// ============ VALIDACIONES MEJORADAS ============

const validateUserRegistration = (userData) => {
  const errors = [];
  
  // Validar campos requeridos
  if (!userData.nombre?.trim()) errors.push('Nombre es obligatorio');
  if (!userData.correo?.trim()) errors.push('Correo es obligatorio');
  if (!userData.usuario?.trim()) errors.push('Usuario es obligatorio');
  if (!userData.contrasena) errors.push('Contraseña es obligatoria');
  
  // Validar formato de email
  if (userData.correo && !validateEmail(userData.correo)) {
    errors.push('Formato de correo inválido');
  }
  
  // Validar username
  if (userData.usuario && !validateUsername(userData.usuario)) {
    errors.push('Usuario debe tener 3-30 caracteres, solo letras, números, puntos, guiones');
  }
  
  // Validar contraseña
  if (userData.contrasena && !validatePassword(userData.contrasena)) {
    errors.push('Contraseña debe tener al menos 8 caracteres con mayúsculas, minúsculas y números');
  }
  
  // Validar teléfono si se proporciona
  if (userData.telefono && !validatePhoneNumber(userData.telefono)) {
    errors.push('Formato de teléfono inválido');
  }
  
  // Validar longitudes
  const lengthValidations = [
    { field: 'nombre', value: userData.nombre, max: 100 },
    { field: 'apellido', value: userData.apellido, max: 100 },
    { field: 'correo', value: userData.correo, max: 150 },
    { field: 'direccion', value: userData.direccion, max: 150 },
    { field: 'usuario', value: userData.usuario, max: 100 }
  ];
  
  lengthValidations.forEach(({ field, value, max }) => {
    if (value) {
      const lengthError = validateTextLength(value, field, 0, max);
      if (lengthError) errors.push(lengthError);
    }
  });
  
  return errors;
};

// ============ CRUD USUARIOS CON SEGURIDAD MEJORADA ============

export async function register(req, res) {
  console.log('📝 Register llamado');
  
  try {
    // Sanitizar entrada
    const userData = {
      nombre: sanitizeString(req.body.nombre, 100),
      apellido: sanitizeString(req.body.apellido, 100),
      correo: sanitizeString(req.body.correo, 150)?.toLowerCase(),
      telefono: sanitizeString(req.body.telefono, 15),
      direccion: sanitizeString(req.body.direccion, 150),
      rol: req.body.rol || 'cliente',
      usuario: sanitizeString(req.body.usuario, 100)?.toLowerCase(),
      contrasena: req.body.contrasena
    };
    
    // Validar datos
    const validationErrors = validateUserRegistration(userData);
    if (validationErrors.length > 0) {
      return errorResponse(res, 'Datos de registro inválidos', 400, { errors: validationErrors });
    }
    
    // Verificar si el usuario ya existe
    console.log('🔍 Verificando si el usuario ya existe...');
    const existingUserByEmail = await findUserByEmail(userData.correo);
    if (existingUserByEmail) {
      return errorResponse(res, 'El correo ya está registrado', 409);
    }
    
    const existingUserByUsername = await pool.query(
      "SELECT id_usuario FROM usuarios WHERE usuario = $1",
      [userData.usuario]
    );
    
    if (existingUserByUsername.rows.length > 0) {
      return errorResponse(res, 'El nombre de usuario ya está en uso', 409);
    }
    
    // Crear usuario
    console.log('✅ Creando nuevo usuario...');
    const newUser = await createUser(
      userData.nombre,
      userData.apellido,
      userData.correo,
      userData.telefono,
      userData.direccion,
      userData.rol,
      userData.usuario,
      userData.contrasena
    );
    
    // Generar tokens JWT
    const payload = createUserPayload(newUser);
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    
    // Remover contraseña de la respuesta
    const { password_hash, ...userWithoutPassword } = newUser;
    
    console.log('✅ Usuario registrado exitosamente:', newUser.usuario);
    
    // Configurar cookies para los tokens
    const cookieOptions = {
      httpOnly: true,
      secure: ENV_CONFIG.isProduction(),
      sameSite: ENV_CONFIG.isProduction() ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días (máximo entre access y refresh)
    };

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 }); // 15 min
    res.cookie('refreshToken', refreshToken, cookieOptions);
    
    return successResponse(res, {
      user: userWithoutPassword,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: ENV_CONFIG.JWT_EXPIRES_IN
      }
    }, 'Usuario registrado exitosamente', 201);
    
  } catch (err) {
    console.error('❌ Error en registro:', err);
    
    // Manejar errores específicos de base de datos
    if (err.code === '23505') { // Unique violation
      return errorResponse(res, 'El usuario o correo ya existe', 409);
    }
    
    return errorResponse(res, 'Error interno del servidor', 500, err);
  }
}

export async function login(req, res) {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return errorResponse(res, 'Usuario y contraseña son obligatorios', 400);
  }

  try {
    const user = await findUser(usuario, contrasena);
    if (user) {
      // Generar tokens JWT
      const payload = createUserPayload(user);
      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);
      
      // Remover contraseña de la respuesta
      const { password_hash, ...userWithoutPassword } = user;
      
      console.log(`✅ Login exitoso para usuario: ${user.usuario}`);
      
      // Configurar cookies para los tokens
      const cookieOptions = {
        httpOnly: true,
        secure: ENV_CONFIG.isProduction(),
        sameSite: ENV_CONFIG.isProduction() ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
      };

      res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 }); // 15 min
      res.cookie('refreshToken', refreshToken, cookieOptions);
      
      return successResponse(res, {
        user: userWithoutPassword,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: ENV_CONFIG.JWT_EXPIRES_IN
        }
      }, 'Login exitoso');
    } else {
      console.warn(`⚠️  Intento de login fallido para usuario: ${usuario}`);
      return errorResponse(res, 'Usuario o contraseña incorrectos', 401);
    }
  } catch (err) {
    console.error('❌ Error en login:', err);
    return errorResponse(res, 'Error interno del servidor', 500, err);
  }
}

export async function logout(req, res) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  console.log('🚪 Sesión cerrada y cookies eliminadas');
  return res.json({ success: true, message: 'Sesión cerrada correctamente' });
}

// ============ RECUPERACIÓN DE CONTRASEÑA ============

export async function requestCode(req, res) {
  const { correo } = req.body;

  if (!correo) {
    return errorResponse(res, 'El correo es obligatorio', 400);
  }

  if (!validateEmail(correo)) {
    return errorResponse(res, 'Formato de correo inválido', 400);
  }

  try {
    await cleanExpiredCodes();
    const user = await findUserByEmail(correo.toLowerCase());
    if (!user) {
      return errorResponse(res, 'Correo no encontrado', 404);
    }

    const codigo = crypto.randomInt(100000, 1000000).toString();
    await createVerificationCode(correo.toLowerCase(), codigo, VERIFICATION_CODE_EXPIRATION);
    await sendVerificationCode(correo.toLowerCase(), codigo);

    console.log(`📧 Código de verificación enviado a: ${correo}`);
    return successResponse(res, { correo: correo.toLowerCase() }, 'Código de verificación enviado a tu correo');
  } catch (err) {
    console.error("❌ Error en requestCode:", err);
    return errorResponse(res, 'Error al enviar el código', 500, err);
  }
}

export async function verifyCodeAndResetPassword(req, res) {
  const { correo, codigo, nuevaContrasena } = req.body;

  if (!correo || !codigo || !nuevaContrasena) {
    return errorResponse(res, 'Todos los campos son obligatorios', 400);
  }

  if (!validateEmail(correo)) {
    return errorResponse(res, 'Formato de correo inválido', 400);
  }

  if (!validatePassword(nuevaContrasena)) {
    return errorResponse(res, 'La contraseña debe tener al menos 8 caracteres con mayúsculas, minúsculas y números', 400);
  }

  try {
    const verifiedCode = await verifyCode(correo.toLowerCase(), codigo);
    if (!verifiedCode) {
      return errorResponse(res, 'Código inválido o expirado', 400);
    }

    const user = await findUserByEmail(correo.toLowerCase());
    if (!user) {
      return errorResponse(res, 'Correo no encontrado', 404);
    }

    await updatePassword(correo.toLowerCase(), nuevaContrasena);
    
    console.log(`🔑 Contraseña actualizada para usuario: ${user.usuario}`);
    return successResponse(res, null, 'Contraseña actualizada correctamente');
  } catch (err) {
    console.error("❌ Error en verifyCodeAndResetPassword:", err);
    return errorResponse(res, 'Error al actualizar la contraseña', 500, err);
  }
}

export async function verifyCodeOnly(req, res) {
  const { correo, codigo } = req.body;

  if (!correo || !codigo) {
    return errorResponse(res, 'Correo y código son obligatorios', 400);
  }

  try {
    const verifiedCode = await verifyCode(correo.toLowerCase(), codigo);
    if (verifiedCode) {
      return successResponse(res, null, 'Código verificado correctamente');
    } else {
      return errorResponse(res, 'Código inválido o expirado', 400);
    }
  } catch (err) {
    console.error("❌ Error en verifyCodeOnly:", err);
    return errorResponse(res, 'Error al verificar el código', 500, err);
  }
}

export async function verifyEmail(req, res) {
  const { correo } = req.body;

  if (!correo) {
    return errorResponse(res, 'El correo es obligatorio', 400);
  }

  if (!validateEmail(correo)) {
    return errorResponse(res, 'Formato de correo inválido', 400);
  }

  try {
    const user = await findUserByEmail(correo.toLowerCase());
    if (user) {
      return successResponse(res, { exists: true }, 'Correo encontrado');
    } else {
      return errorResponse(res, 'Correo no encontrado', 404);
    }
  } catch (err) {
    console.error("❌ Error en verifyEmail:", err);
    return errorResponse(res, 'Error al verificar el correo', 500, err);
  }
}

// ============ CRUD USUARIOS ============

export async function getUsers(req, res) {
  try {
    // Verificar que el usuario autenticado es superadmin
    if (!req.user || !req.user.es_super_admin) {
      console.warn(`⚠️ Intento de acceso a usuarios por no-superadmin: ${req.user?.usuario || 'desconocido'}`);
      return errorResponse(res, 'Solo el Super Administrador puede ver todos los usuarios', 403);
    }

    console.log(`👑 SuperAdmin ${req.user.usuario} solicitando lista de usuarios`);
    const users = await getAllUsers();
    return successResponse(res, { users }, 'Usuarios obtenidos exitosamente');
  } catch (err) {
    console.error('❌ Error obteniendo usuarios:', err);
    return errorResponse(res, 'Error interno del servidor', 500, err);
  }
}

export async function getUser(req, res) {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id))) {
    return errorResponse(res, 'ID de usuario inválido', 400);
  }

  try {
    const user = await getUserById(id);
    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }
    return successResponse(res, { user }, 'Usuario obtenido exitosamente');
  } catch (err) {
    console.error('❌ Error obteniendo usuario:', err);
    return errorResponse(res, 'Error interno del servidor', 500, err);
  }
}

export async function updateUserController(req, res) {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id))) {
    return errorResponse(res, 'ID de usuario inválido', 400);
  }

  try {
    // Obtener el usuario actual primero
    const currentUser = await getUserById(id);
    if (!currentUser) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    // Sanitizar datos de entrada, manteniendo valores actuales si no se proporcionan nuevos
    const userData = {
      nombre: req.body.nombre ? sanitizeString(req.body.nombre, 100) : currentUser.nombre,
      apellido: req.body.apellido ? sanitizeString(req.body.apellido, 100) : currentUser.apellido,
      correo: req.body.correo ? sanitizeString(req.body.correo, 150)?.toLowerCase() : currentUser.correo,
      telefono: req.body.telefono ? sanitizeString(req.body.telefono, 15) : currentUser.telefono,
      direccion: req.body.direccion ? sanitizeString(req.body.direccion, 150) : currentUser.direccion,
      rol: req.body.rol || currentUser.rol,
      usuario: req.body.usuario ? sanitizeString(req.body.usuario, 100)?.toLowerCase() : currentUser.usuario
    };

    // Validar datos si se proporcionan nuevos valores
    const errors = [];
    if (req.body.correo && !validateEmail(userData.correo)) {
      errors.push('Formato de correo inválido');
    }
    if (req.body.usuario && !validateUsername(userData.usuario)) {
      errors.push('Formato de usuario inválido');
    }
    if (req.body.telefono && !validatePhoneNumber(userData.telefono)) {
      errors.push('Formato de teléfono inválido');
    }

    if (errors.length > 0) {
      return errorResponse(res, 'Datos inválidos', 400, { errors });
    }

    let passwordUpdated = false;
    let updatesMessage = [];

    // Si se proporciona una nueva contraseña, actualizarla por separado
    if (req.body.contrasena) {
      if (!validatePassword(req.body.contrasena)) {
        return errorResponse(res, 'La contraseña debe tener al menos 8 caracteres con mayúsculas, minúsculas y números', 400);
      }
      await updatePassword(currentUser.correo, req.body.contrasena);
      passwordUpdated = true;
      updatesMessage.push('contraseña');
      console.log(`🔑 Contraseña actualizada para usuario ID: ${id}`);
    }

    // Verificar qué campos se están actualizando
    if (req.body.nombre && req.body.nombre !== currentUser.nombre) updatesMessage.push('nombre');
    if (req.body.apellido && req.body.apellido !== currentUser.apellido) updatesMessage.push('apellido');
    if (req.body.correo && req.body.correo !== currentUser.correo) updatesMessage.push('correo');
    if (req.body.telefono && req.body.telefono !== currentUser.telefono) updatesMessage.push('teléfono');
    if (req.body.direccion && req.body.direccion !== currentUser.direccion) updatesMessage.push('dirección');
    if (req.body.rol && req.body.rol !== currentUser.rol) updatesMessage.push('rol');
    if (req.body.usuario && req.body.usuario !== currentUser.usuario) updatesMessage.push('usuario');

    const updatedUser = await updateUser(
      id,
      userData.nombre,
      userData.apellido,
      userData.correo,
      userData.telefono,
      userData.direccion,
      userData.rol,
      userData.usuario
    );

    console.log('✅ updateUser completado, preparando respuesta...');

    // Crear mensaje personalizado basado en lo que se actualizó
    let message = 'Usuario actualizado exitosamente';
    if (updatesMessage.length > 0) {
      const updatedFields = updatesMessage.join(', ');
      message = `Usuario actualizado exitosamente. Campos actualizados: ${updatedFields}`;
    }

    const responseData = {
      user: updatedUser,
      passwordUpdated,
      updatedFields: updatesMessage
    };

    console.log('📤 Enviando respuesta exitosa...');
    return successResponse(res, responseData, message);
  } catch (err) {
    console.error('❌ Error actualizando usuario:', err);
    
    if (err.code === '23505') { // Unique violation
      return errorResponse(res, 'El usuario o correo ya existe', 409);
    }
    
    return errorResponse(res, 'Error interno del servidor', 500, err);
  }
}

export async function deleteUserController(req, res) {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id))) {
    return errorResponse(res, 'ID de usuario inválido', 400);
  }

  try {
    const deletedUser = await deleteUser(id);
    if (!deletedUser) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    console.log(`🗑️  Usuario eliminado: ${deletedUser.usuario}`);
    return successResponse(res, { user: deletedUser }, 'Usuario eliminado exitosamente');
  } catch (err) {
    console.error('❌ Error eliminando usuario:', err);
    return errorResponse(res, 'Error interno del servidor', 500, err);
  }
}

// ============ FUNCIONES ESPECIALES ============

export async function updateUserInfo(req, res) {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id))) {
    return errorResponse(res, 'ID de usuario inválido', 400);
  }

  try {
    const { nombre, apellido, telefono, direccion } = req.body;
    
    // Sanitizar datos
    const sanitizedData = {
      nombre: sanitizeString(nombre, 100),
      apellido: sanitizeString(apellido, 100),
      telefono: sanitizeString(telefono, 15),
      direccion: sanitizeString(direccion, 150)
    };

    // Validar teléfono si se proporciona
    if (sanitizedData.telefono && !validatePhoneNumber(sanitizedData.telefono)) {
      return errorResponse(res, 'Formato de teléfono inválido', 400);
    }

    const user = await getUserById(id);
    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    // Verificar qué campos se están actualizando
    const updatesMessage = [];
    if (sanitizedData.nombre && sanitizedData.nombre !== user.nombre) updatesMessage.push('nombre');
    if (sanitizedData.apellido && sanitizedData.apellido !== user.apellido) updatesMessage.push('apellido');
    if (sanitizedData.telefono && sanitizedData.telefono !== user.telefono) updatesMessage.push('teléfono');
    if (sanitizedData.direccion && sanitizedData.direccion !== user.direccion) updatesMessage.push('dirección');

    const updatedUser = await updateUser(
      id,
      sanitizedData.nombre || user.nombre,
      sanitizedData.apellido || user.apellido,
      user.correo,
      sanitizedData.telefono || user.telefono,
      sanitizedData.direccion || user.direccion,
      user.rol,
      user.usuario
    );

    let message = 'Información actualizada exitosamente';
    if (updatesMessage.length > 0) {
      const updatedFields = updatesMessage.join(', ');
      message = `Información actualizada exitosamente. Campos actualizados: ${updatedFields}`;
    }

    return successResponse(res, { 
      user: updatedUser,
      updatedFields: updatesMessage 
    }, message);
  } catch (err) {
    console.error('❌ Error actualizando información:', err);
    return errorResponse(res, 'Error interno del servidor', 500, err);
  }
}

export async function updateCredentials(req, res) {
  const { id } = req.params;
  const { usuario, contrasena } = req.body;
  
  if (!id || isNaN(parseInt(id))) {
    return errorResponse(res, 'ID de usuario inválido', 400);
  }

  if (!usuario || !contrasena) {
    return errorResponse(res, 'Usuario y contraseña son obligatorios', 400);
  }

  try {
    // Validar datos
    const sanitizedUsername = sanitizeString(usuario, 100)?.toLowerCase();
    
    if (!validateUsername(sanitizedUsername)) {
      return errorResponse(res, 'Formato de usuario inválido', 400);
    }

    if (!validatePassword(contrasena)) {
      return errorResponse(res, 'La contraseña debe tener al menos 8 caracteres con mayúsculas, minúsculas y números', 400);
    }

    // Verificar que el usuario existe
    const user = await getUserById(id);
    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    // Verificar que el nuevo username no esté en uso
    const existingUser = await pool.query(
      "SELECT id_usuario FROM usuarios WHERE usuario = $1 AND id_usuario != $2",
      [sanitizedUsername, id]
    );

    if (existingUser.rows.length > 0) {
      return errorResponse(res, 'El nombre de usuario ya está en uso', 409);
    }

    // Verificar qué se está actualizando
    const updatesMessage = [];
    if (sanitizedUsername !== user.usuario) updatesMessage.push('usuario');
    updatesMessage.push('contraseña'); // Siempre se actualiza la contraseña

    // Actualizar usuario
    const updatedUser = await updateUser(
      id,
      user.nombre,
      user.apellido,
      user.correo,
      user.telefono,
      user.direccion,
      user.rol,
      sanitizedUsername
    );

    // Actualizar contraseña
    await updatePassword(user.correo, contrasena);

    const updatedFields = updatesMessage.join(' y ');
    const message = `Credenciales actualizadas exitosamente. Se actualizó: ${updatedFields}`;

    console.log(`🔑 Credenciales actualizadas para usuario ID: ${id} - ${updatedFields}`);
    
    return successResponse(res, { 
      user: updatedUser,
      passwordUpdated: true,
      updatedFields: updatesMessage
    }, message);
  } catch (err) {
    console.error('❌ Error actualizando credenciales:', err);
    
    if (err.code === '23505') { // Unique violation
      return errorResponse(res, 'El nombre de usuario ya está en uso', 409);
    }
    
    return errorResponse(res, 'Error interno del servidor', 500, err);
  }
}

// ============ GESTIÓN DE ADMINISTRADORES (SOLO SUPERADMIN) ============

export async function createAdmin(req, res) {
  console.log('👑 CreateAdmin llamado - Solo SuperAdmin puede crear administradores');
  
  try {
    // Verificar que el usuario autenticado es superadmin
    if (!req.user || !req.user.es_super_admin) {
      console.warn(`⚠️ Intento de crear admin por usuario no autorizado: ${req.user?.usuario || 'desconocido'}`);
      return errorResponse(res, 'Solo el Super Administrador puede crear otros administradores', 403);
    }
    
    // Sanitizar entrada
    const adminData = {
      nombre: sanitizeString(req.body.nombre, 100),
      apellido: sanitizeString(req.body.apellido, 100),
      correo: sanitizeString(req.body.correo, 150)?.toLowerCase(),
      telefono: sanitizeString(req.body.telefono, 15),
      direccion: sanitizeString(req.body.direccion, 150),
      usuario: sanitizeString(req.body.usuario, 100)?.toLowerCase(),
      contrasena: req.body.contrasena,
      es_super_admin: req.body.es_super_admin === true // Solo true si se especifica explícitamente
    };
    
    // Validar datos obligatorios para admin
    const errors = [];
    if (!adminData.nombre?.trim()) errors.push('Nombre es obligatorio');
    if (!adminData.correo?.trim()) errors.push('Correo es obligatorio');
    if (!adminData.usuario?.trim()) errors.push('Usuario es obligatorio');
    if (!adminData.contrasena) errors.push('Contraseña es obligatoria');
    
    // Validar formatos
    if (adminData.correo && !validateEmail(adminData.correo)) {
      errors.push('Formato de correo inválido');
    }
    
    if (adminData.usuario && !validateUsername(adminData.usuario)) {
      errors.push('Usuario debe tener 3-30 caracteres, solo letras, números, puntos, guiones');
    }
    
    if (adminData.contrasena && !validatePassword(adminData.contrasena)) {
      errors.push('Contraseña debe tener al menos 8 caracteres con mayúsculas, minúsculas y números');
    }
    
    if (adminData.telefono && !validatePhoneNumber(adminData.telefono)) {
      errors.push('Formato de teléfono inválido');
    }
    
    if (errors.length > 0) {
      return errorResponse(res, 'Datos de administrador inválidos', 400, { errors });
    }
    
    // Verificar si el usuario ya existe
    console.log('🔍 Verificando si el administrador ya existe...');
    const existingUserByEmail = await findUserByEmail(adminData.correo);
    if (existingUserByEmail) {
      return errorResponse(res, 'El correo ya está registrado', 409);
    }
    
    const existingUserByUsername = await pool.query(
      "SELECT id_usuario FROM usuarios WHERE usuario = $1",
      [adminData.usuario]
    );
    
    if (existingUserByUsername.rows.length > 0) {
      return errorResponse(res, 'El nombre de usuario ya está en uso', 409);
    }
    
    // Crear administrador
    console.log('✅ Creando nuevo administrador...');
    const newAdmin = await createUser(
      adminData.nombre,
      adminData.apellido,
      adminData.correo,
      adminData.telefono,
      adminData.direccion,
      'administrador', // Rol fijo como administrador
      adminData.usuario,
      adminData.contrasena
    );
    
    // Si se especificó que sea super admin, actualizar el campo
    if (adminData.es_super_admin) {
      await pool.query(
        'UPDATE usuarios SET es_super_admin = true WHERE id_usuario = $1',
        [newAdmin.id_usuario]
      );
      newAdmin.es_super_admin = true;
      console.log('👑 Nuevo Super Administrador creado');
    } else {
      console.log('👤 Nuevo Administrador creado');
    }
    
    // Remover contraseña de la respuesta
    const { password_hash, ...adminWithoutPassword } = newAdmin;
    
    console.log(`✅ Administrador creado exitosamente: ${newAdmin.usuario} por SuperAdmin: ${req.user.usuario}`);
    
    const adminType = adminData.es_super_admin ? 'Super Administrador' : 'Administrador';
    const message = `${adminType} "${newAdmin.usuario}" creado exitosamente. Puede iniciar sesión con las credenciales proporcionadas.`;
    
    return successResponse(res, {
      admin: adminWithoutPassword,
      adminType: adminType.toLowerCase(),
      canCreateAdmins: adminData.es_super_admin
    }, message, 201);
    
  } catch (err) {
    console.error('❌ Error creando administrador:', err);
    
    // Manejar errores específicos de base de datos
    if (err.code === '23505') { // Unique violation
      return errorResponse(res, 'El usuario o correo ya existe', 409);
    }
    
    return errorResponse(res, 'Error interno del servidor', 500, err);
  }
}

export async function promoteToAdmin(req, res) {
  console.log('⬆️ PromoteToAdmin llamado - Solo SuperAdmin puede promover usuarios');
  
  const { id } = req.params;
  const { es_super_admin } = req.body;
  
  if (!id || isNaN(parseInt(id))) {
    return errorResponse(res, 'ID de usuario inválido', 400);
  }
  
  try {
    // Verificar que el usuario autenticado es superadmin
    if (!req.user || !req.user.es_super_admin) {
      console.warn(`⚠️ Intento de promover usuario por no-superadmin: ${req.user?.usuario || 'desconocido'}`);
      return errorResponse(res, 'Solo el Super Administrador puede promover usuarios a administradores', 403);
    }
    
    // Verificar que el usuario existe
    const user = await getUserById(id);
    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }
    
    // Verificar que no es el mismo superadmin
    if (user.id_usuario === req.user.userId) {
      return errorResponse(res, 'No puedes modificar tu propio rol', 400);
    }
    
    // Actualizar rol a administrador
    const updatedUser = await updateUser(
      id,
      user.nombre,
      user.apellido,
      user.correo,
      user.telefono,
      user.direccion,
      'administrador', // Cambiar rol a administrador
      user.usuario
    );
    
    // Si se especifica que sea super admin, actualizar el campo
    if (es_super_admin === true) {
      await pool.query(
        'UPDATE usuarios SET es_super_admin = true WHERE id_usuario = $1',
        [id]
      );
      updatedUser.es_super_admin = true;
      console.log(`👑 Usuario ${user.usuario} promovido a Super Administrador por ${req.user.usuario}`);
      const message = `Usuario "${user.usuario}" promovido a Super Administrador exitosamente. Ahora puede crear otros administradores.`;
      return successResponse(res, { user: updatedUser }, message);
    } else {
      console.log(`👤 Usuario ${user.usuario} promovido a Administrador por ${req.user.usuario}`);
      const message = `Usuario "${user.usuario}" promovido a Administrador exitosamente. Ahora puede gestionar productos y pedidos.`;
      return successResponse(res, { user: updatedUser }, message);
    }
    
  } catch (err) {
    console.error('❌ Error promoviendo usuario:', err);
    return errorResponse(res, 'Error interno del servidor', 500, err);
  }
}

export async function demoteAdmin(req, res) {
  console.log('⬇️ DemoteAdmin llamado - Solo SuperAdmin puede degradar administradores');
  
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id))) {
    return errorResponse(res, 'ID de usuario inválido', 400);
  }
  
  try {
    // Verificar que el usuario autenticado es superadmin
    if (!req.user || !req.user.es_super_admin) {
      console.warn(`⚠️ Intento de degradar admin por no-superadmin: ${req.user?.usuario || 'desconocido'}`);
      return errorResponse(res, 'Solo el Super Administrador puede degradar administradores', 403);
    }
    
    // Verificar que el usuario existe
    const user = await getUserById(id);
    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }
    
    // Verificar que no es el mismo superadmin
    if (user.id_usuario === req.user.userId) {
      return errorResponse(res, 'No puedes modificar tu propio rol', 400);
    }
    
    // Verificar que es administrador
    if (user.rol !== 'administrador') {
      return errorResponse(res, 'El usuario no es administrador', 400);
    }
    
    // Actualizar rol a cliente
    const updatedUser = await updateUser(
      id,
      user.nombre,
      user.apellido,
      user.correo,
      user.telefono,
      user.direccion,
      'cliente', // Cambiar rol a cliente
      user.usuario
    );
    
    // Remover privilegios de super admin si los tenía
    await pool.query(
      'UPDATE usuarios SET es_super_admin = false WHERE id_usuario = $1',
      [id]
    );
    updatedUser.es_super_admin = false;
    
    console.log(`⬇️ Administrador ${user.usuario} degradado a Cliente por ${req.user.usuario}`);
    
    const message = `Administrador "${user.usuario}" degradado a Cliente exitosamente. Ya no tiene permisos administrativos.`;
    
    return successResponse(res, { 
      user: updatedUser,
      previousRole: 'administrador',
      newRole: 'cliente'
    }, message);
    
  } catch (err) {
    console.error('❌ Error degradando administrador:', err);
    return errorResponse(res, 'Error interno del servidor', 500, err);
  }
}

// Función para actualizar el estado de super administrador
export async function updateSuperAdminStatus(req, res) {
  console.log('👑 UpdateSuperAdminStatus llamado');
  
  const { id_usuario, es_super_admin } = req.body;
  
  if (!id_usuario || typeof es_super_admin !== 'boolean') {
    return errorResponse(res, 'ID de usuario y estado de super admin requeridos', 400);
  }
  
  try {
    // DOBLE CAPA DE SEGURIDAD: Verificar que el usuario que hace la petición es superadmin
    if (!req.user || !req.user.es_super_admin) {
      console.warn(`🚨 Intento no autorizado de cambiar estado SuperAdmin por: ${req.user?.usuario || 'desconocido'}`);
      return errorResponse(res, 'Solo el Super Administrador puede realizar esta acción', 403);
    }

    // Actualizar el campo es_super_admin
    const result = await pool.query(
      'UPDATE usuarios SET es_super_admin = $1 WHERE id_usuario = $2 RETURNING id_usuario, nombre, apellido, correo, telefono, direccion, rol, usuario, es_super_admin',
      [es_super_admin, id_usuario]
    );
    
    if (result.rows.length === 0) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }
    
    const updatedUser = result.rows[0];
    
    console.log(`👑 Usuario ${updatedUser.usuario} actualizado: es_super_admin = ${es_super_admin}`);
    
    const message = `Estado de super administrador actualizado exitosamente para ${updatedUser.usuario}`;
    
    return successResponse(res, { user: updatedUser }, message);
    
  } catch (err) {
    console.error('❌ Error actualizando estado de super admin:', err);
    return errorResponse(res, 'Error interno del servidor', 500, err);
  }
}