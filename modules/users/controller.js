import { 
  createUser, getAllUsers, getUserById, updateUser, deleteUser,
  findUser, findUserByEmail, updatePassword, 
  createVerificationCode, verifyCode, cleanExpiredCodes 
} from "./model.js";
import pool from "../../db.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from 'dotenv';

dotenv.config();

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    },
    connectionTimeout: 30000,
    socketTimeout: 30000,
    greetingTimeout: 30000,
    pool: true,
    maxConnections: 3,
    maxMessages: 50
  });
};

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

const VERIFICATION_CODE_EXPIRATION = process.env.VERIFICATION_CODE_EXPIRATION
  ? parseInt(process.env.VERIFICATION_CODE_EXPIRATION, 10)
  : 600;

const sendVerificationCode = async (correo, codigo) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('❌ Credenciales de correo no configuradas');
    throw new Error('Credenciales de correo no configuradas');
  }

  const mailOptions = {
    from: `"Sistema de Verificación" <${process.env.GMAIL_USER}>`,
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

// ============ CRUD USUARIOS ============

export async function register(req, res) {
  console.log('📝 Register llamado');
  console.log('Body recibido:', req.body);
  
  const { nombre, apellido, correo, telefono, direccion, rol, usuario, contrasena } = req.body;
  
  if (!nombre || !correo || !usuario || !contrasena) {
    console.log('❌ Campos faltantes');
    return res.status(400).json({ success: false, message: "Campos obligatorios: nombre, correo, usuario, contrasena" });
  }

  try {
    console.log('🔍 Verificando si el usuario ya existe...');
    
    // Verificar si el usuario ya existe
    const existingUserByUsername = await pool.query(
      "SELECT * FROM usuarios WHERE usuario = $1",
      [usuario]
    );
    
    if (existingUserByUsername.rows.length > 0) {
      console.log('❌ Usuario ya existe');
      return res.status(400).json({ success: false, message: "El nombre de usuario ya está en uso" });
    }
    
    // Verificar si el correo ya existe
    const existingUserByEmail = await pool.query(
      "SELECT * FROM usuarios WHERE correo = $1",
      [correo]
    );
    
    if (existingUserByEmail.rows.length > 0) {
      console.log('❌ Correo ya existe');
      return res.status(400).json({ success: false, message: "El correo ya está registrado" });
    }
    
    console.log('✅ Usuario y correo disponibles, creando usuario...');
    const newUser = await createUser(nombre, apellido, correo, telefono, direccion, rol, usuario, contrasena);
    console.log('✅ Usuario creado:', newUser);
    
    const { password_hash, ...userWithoutPassword } = newUser;
    res.json({ success: true, user: userWithoutPassword });
  } catch (err) {
    console.error('❌ Error en register:', err);
    console.error('Stack:', err.stack);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getUsers(req, res) {
  try {
    const users = await getAllUsers();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function getUser(req, res) {
  const { id } = req.params;
  try {
    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateUserController(req, res) {
  const { id } = req.params;
  const { nombre, apellido, correo, telefono, direccion, rol, usuario, contrasena } = req.body;
  
  try {
    // Si se proporciona una nueva contraseña, actualizar también la contraseña
    if (contrasena) {
      const user = await getUserById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: "Usuario no encontrado" });
      }
      await updatePassword(user.correo, contrasena);
    }
    
    const updatedUser = await updateUser(id, nombre, apellido, correo, telefono, direccion, rol, usuario);
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }
    
    const { password_hash, ...userWithoutPassword } = updatedUser;
    res.json({ success: true, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function deleteUserController(req, res) {
  const { id } = req.params;
  try {
    const deletedUser = await deleteUser(id);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }
    res.json({ success: true, message: "Usuario eliminado", user: deletedUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// ============ AUTENTICACIÓN ============

export async function login(req, res) {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({ success: false, message: "Todos los campos son obligatorios" });
  }

  try {
    const user = await findUser(usuario, contrasena);
    if (user) {
      const { password_hash, ...userWithoutPassword } = user;
      res.json({ success: true, message: "Login exitoso", user: userWithoutPassword });
    } else {
      res.json({ success: false, message: "Usuario o contraseña incorrectos" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ============ RECUPERACIÓN DE CONTRASEÑA ============

export async function requestCode(req, res) {
  const { correo } = req.body;

  if (!correo) {
    return res.status(400).json({ success: false, message: "El correo es obligatorio" });
  }

  try {
    await cleanExpiredCodes();
    const user = await findUserByEmail(correo);
    if (!user) {
      return res.json({ success: false, message: "Correo no encontrado" });
    }

    const codigo = crypto.randomInt(100000, 1000000).toString();
    await createVerificationCode(correo, codigo, VERIFICATION_CODE_EXPIRATION);
    await sendVerificationCode(correo, codigo);

    res.json({ success: true, message: "Código de verificación enviado a tu correo", correo });
  } catch (err) {
    console.error("Error en requestCode:", err);
    res.status(500).json({ success: false, message: "Error al enviar el código: " + (err?.message || err) });
  }
}

export async function verifyCodeAndResetPassword(req, res) {
  const { correo, codigo, nuevaContrasena } = req.body;

  if (!correo || !codigo || !nuevaContrasena) {
    return res.status(400).json({ success: false, message: "Todos los campos son obligatorios" });
  }

  try {
    const verifiedCode = await verifyCode(correo, codigo);
    if (!verifiedCode) {
      return res.json({ success: false, message: "Código inválido o expirado" });
    }

    const user = await findUserByEmail(correo);
    if (!user) {
      return res.json({ success: false, message: "Correo no encontrado" });
    }

    await updatePassword(correo, nuevaContrasena);
    res.json({ success: true, message: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.error("Error en verifyCodeAndResetPassword:", err);
    res.status(500).json({ success: false, message: "Error al actualizar la contraseña: " + (err?.message || err) });
  }
}

export async function verifyCodeOnly(req, res) {
  const { correo, codigo } = req.body;

  if (!correo || !codigo) {
    return res.status(400).json({ success: false, message: "Correo y código son obligatorios" });
  }

  try {
    const verifiedCode = await verifyCode(correo, codigo);
    if (verifiedCode) {
      res.json({ success: true, message: "Código verificado correctamente", valido: true });
    } else {
      res.json({ success: false, message: "Código inválido o expirado", valido: false });
    }
  } catch (err) {
    console.error("Error en verifyCodeOnly:", err);
    res.status(500).json({ success: false, message: "Error al verificar el código: " + (err?.message || err) });
  }
}

export async function verifyEmail(req, res) {
  const { correo } = req.body;

  if (!correo) {
    return res.status(400).json({ success: false, message: "El correo es obligatorio" });
  }

  try {
    const user = await findUserByEmail(correo);
    if (user) {
      res.json({ success: true, exists: true, message: "Correo verificado correctamente" });
    } else {
      res.json({ success: false, exists: false, message: "Correo no encontrado" });
    }
  } catch (err) {
    console.error("Error en verifyEmail:", err);
    res.status(500).json({ success: false, message: "Error al verificar el correo: " + (err?.message || err) });
  }
}

// ============ ACTUALIZAR INFORMACIÓN DEL PERFIL ============

export async function updateUserInfo(req, res) {
  const { id } = req.params;
  const { nombre, apellido, correo } = req.body;
  
  console.log('📝 updateUserInfo llamado');
  console.log('ID:', id);
  console.log('Body:', { nombre, apellido, correo });
  
  if (!nombre || !apellido || !correo) {
    console.log('❌ Campos faltantes');
    return res.status(400).json({ 
      success: false, 
      message: "Todos los campos son obligatorios (nombre, apellido, correo)" 
    });
  }

  try {
    console.log('🔍 Buscando usuario con ID:', id);
    const user = await getUserById(id);
    console.log('Usuario encontrado:', user);
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    // Verificar si el correo ya existe en otro usuario
    if (correo !== user.correo) {
      console.log('📧 Verificando si el correo ya existe...');
      const existingUser = await findUserByEmail(correo);
      if (existingUser && existingUser.id_usuario !== parseInt(id)) {
        console.log('❌ Correo ya existe en otro usuario');
        return res.status(400).json({ 
          success: false, 
          message: "El correo ya está registrado por otro usuario" 
        });
      }
    }

    // Actualizar solo nombre, apellido y correo
    console.log('💾 Actualizando usuario en la base de datos...');
    console.log('Datos a actualizar:', {
      id,
      nombre,
      apellido,
      correo,
      telefono: user.telefono,
      direccion: user.direccion,
      rol: user.rol,
      usuario: user.usuario
    });
    
    const updatedUser = await updateUser(
      id, 
      nombre, 
      apellido, 
      correo, 
      user.telefono, 
      user.direccion, 
      user.rol, 
      user.usuario
    );
    
    console.log('✅ Usuario actualizado:', updatedUser);
    
    const { password_hash, ...userWithoutPassword } = updatedUser;
    res.json({ 
      success: true, 
      message: "Información actualizada correctamente",
      user: userWithoutPassword 
    });
  } catch (err) {
    console.error("❌ Error en updateUserInfo:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
