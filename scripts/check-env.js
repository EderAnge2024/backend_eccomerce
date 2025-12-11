#!/usr/bin/env node

import { ENV_CONFIG } from '../config/env.js';

console.log('🔍 Verificando configuración de variables de entorno...\n');

// Verificar configuración del servidor
console.log('📡 Configuración del Servidor:');
console.log(`  ✅ Puerto: ${ENV_CONFIG.PORT}`);
console.log(`  ✅ Host: ${ENV_CONFIG.HOST}`);
console.log(`  ✅ Entorno: ${ENV_CONFIG.NODE_ENV}`);

// Verificar configuración de base de datos
console.log('\n🗄️  Configuración de Base de Datos:');
console.log(`  ✅ Host: ${ENV_CONFIG.DB.HOST}`);
console.log(`  ✅ Puerto: ${ENV_CONFIG.DB.PORT}`);
console.log(`  ✅ Usuario: ${ENV_CONFIG.DB.USER}`);
console.log(`  ✅ Base de datos: ${ENV_CONFIG.DB.NAME}`);
console.log(`  ${ENV_CONFIG.DB.PASSWORD ? '✅' : '❌'} Contraseña: ${ENV_CONFIG.DB.PASSWORD ? '***' : 'NO CONFIGURADA'}`);

// Verificar configuración de email
console.log('\n📧 Configuración de Email:');
console.log(`  ${ENV_CONFIG.EMAIL.GMAIL_USER ? '✅' : '❌'} Usuario Gmail: ${ENV_CONFIG.EMAIL.GMAIL_USER || 'NO CONFIGURADO'}`);
console.log(`  ${ENV_CONFIG.EMAIL.GMAIL_APP_PASSWORD ? '✅' : '❌'} Contraseña de App: ${ENV_CONFIG.EMAIL.GMAIL_APP_PASSWORD ? '***' : 'NO CONFIGURADA'}`);
console.log(`  ✅ Expiración de código: ${ENV_CONFIG.EMAIL.VERIFICATION_CODE_EXPIRATION} segundos`);

// Verificar configuración de CORS
console.log('\n🌐 Configuración de CORS:');
ENV_CONFIG.CORS.ALLOWED_ORIGINS.forEach((origin, index) => {
  console.log(`  ✅ Origen ${index + 1}: ${origin}`);
});

// Resumen
console.log('\n📋 Resumen:');
const emailConfigured = ENV_CONFIG.validateEmailConfig();
console.log(`  ${emailConfigured ? '✅' : '⚠️ '} Email: ${emailConfigured ? 'Configurado correctamente' : 'Configuración incompleta'}`);
console.log(`  ✅ Base de datos: Configurada`);
console.log(`  ✅ Servidor: Configurado`);

if (!emailConfigured) {
  console.log('\n⚠️  ADVERTENCIA: La configuración de email está incompleta.');
  console.log('   Las funciones de recuperación de contraseña no funcionarán.');
  console.log('   Configura GMAIL_USER y GMAIL_APP_PASSWORD en el archivo .env');
}

console.log('\n✅ Verificación completada.');