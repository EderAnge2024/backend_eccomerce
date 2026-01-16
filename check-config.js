// Verificar configuración del backend
import { ENV_CONFIG } from './config/env.js';

console.log('🔍 VERIFICACIÓN DE CONFIGURACIÓN DEL BACKEND');
console.log('============================================\n');

console.log('📋 Configuración del Servidor:');
console.log(`   NODE_ENV: ${ENV_CONFIG.NODE_ENV}`);
console.log(`   HOST: ${ENV_CONFIG.HOST}`);
console.log(`   PORT: ${ENV_CONFIG.PORT}`);

console.log('\n📊 Configuración de Base de Datos:');
console.log(`   HOST: ${ENV_CONFIG.DB.HOST}`);
console.log(`   PORT: ${ENV_CONFIG.DB.PORT}`);
console.log(`   USER: ${ENV_CONFIG.DB.USER}`);
console.log(`   NAME: ${ENV_CONFIG.DB.NAME}`);
console.log(`   PASSWORD: ${ENV_CONFIG.DB.PASSWORD ? '***[CONFIGURADO]***' : '❌ NO CONFIGURADO'}`);

console.log('\n🔑 Configuración JWT:');
console.log(`   SECRET: ${ENV_CONFIG.JWT_SECRET ? ENV_CONFIG.JWT_SECRET.substring(0, 20) + '...' : '❌ NO CONFIGURADO'}`);
console.log(`   EXPIRES_IN: ${ENV_CONFIG.JWT_EXPIRES_IN}`);
console.log(`   REFRESH_EXPIRES_IN: ${ENV_CONFIG.JWT_REFRESH_EXPIRES_IN}`);

console.log('\n📧 Configuración de Email:');
console.log(`   GMAIL_USER: ${ENV_CONFIG.EMAIL.GMAIL_USER || '❌ NO CONFIGURADO'}`);
console.log(`   GMAIL_APP_PASSWORD: ${ENV_CONFIG.EMAIL.GMAIL_APP_PASSWORD ? '***[CONFIGURADO]***' : '❌ NO CONFIGURADO'}`);
console.log(`   VERIFICATION_EXPIRATION: ${ENV_CONFIG.EMAIL.VERIFICATION_CODE_EXPIRATION}s`);

console.log('\n🌐 Configuración CORS:');
console.log(`   ALLOWED_ORIGINS (${ENV_CONFIG.CORS.ALLOWED_ORIGINS.length}):`);
ENV_CONFIG.CORS.ALLOWED_ORIGINS.forEach((origin, index) => {
  console.log(`     ${index + 1}. ${origin}`);
});

console.log('\n⏱️ Configuración Rate Limiting:');
console.log(`   WINDOW_MS: ${ENV_CONFIG.RATE_LIMIT.WINDOW_MS}ms (${ENV_CONFIG.RATE_LIMIT.WINDOW_MS / 1000 / 60} min)`);
console.log(`   MAX_REQUESTS: ${ENV_CONFIG.RATE_LIMIT.MAX_REQUESTS}`);
console.log(`   LOGIN_MAX_REQUESTS: ${ENV_CONFIG.RATE_LIMIT.LOGIN_MAX_REQUESTS}`);

console.log('\n✅ VERIFICACIÓN DE PROBLEMAS COMUNES:');

// Verificar JWT Secret
if (!ENV_CONFIG.JWT_SECRET || ENV_CONFIG.JWT_SECRET.length < 32) {
  console.log('❌ JWT_SECRET es muy corto o no está configurado');
} else {
  console.log('✅ JWT_SECRET configurado correctamente');
}

// Verificar Email
if (!ENV_CONFIG.EMAIL.GMAIL_USER || !ENV_CONFIG.EMAIL.GMAIL_APP_PASSWORD) {
  console.log('⚠️ Configuración de email incompleta (funcionalidad de email no disponible)');
} else {
  console.log('✅ Configuración de email completa');
}

// Verificar CORS para app móvil
const mobileOrigins = ENV_CONFIG.CORS.ALLOWED_ORIGINS.filter(origin => 
  origin.includes('192.168.') || origin.includes('10.0.') || origin.includes('8081')
);

if (mobileOrigins.length === 0) {
  console.log('❌ No hay orígenes configurados para app móvil');
} else {
  console.log(`✅ ${mobileOrigins.length} orígenes configurados para app móvil`);
}

// Verificar configuración de producción
if (ENV_CONFIG.isProduction()) {
  console.log('\n🔒 VERIFICACIÓN DE PRODUCCIÓN:');
  
  if (ENV_CONFIG.JWT_SECRET === 'tu_jwt_secret_super_seguro_aqui_2024') {
    console.log('❌ JWT_SECRET usando valor por defecto - CAMBIAR EN PRODUCCIÓN');
  }
  
  if (ENV_CONFIG.DB.PASSWORD === 'admin') {
    console.log('❌ Contraseña de BD usando valor por defecto - CAMBIAR EN PRODUCCIÓN');
  }
  
  const httpsOrigins = ENV_CONFIG.CORS.ALLOWED_ORIGINS.filter(origin => origin.startsWith('https://'));
  if (httpsOrigins.length === 0) {
    console.log('⚠️ No hay orígenes HTTPS configurados para producción');
  }
}

console.log('\n🚀 ESTADO GENERAL:');
const issues = [];

if (!ENV_CONFIG.JWT_SECRET || ENV_CONFIG.JWT_SECRET.length < 32) issues.push('JWT_SECRET');
if (!ENV_CONFIG.DB.PASSWORD) issues.push('DB_PASSWORD');
if (ENV_CONFIG.CORS.ALLOWED_ORIGINS.length === 0) issues.push('CORS_ORIGINS');

if (issues.length === 0) {
  console.log('✅ Configuración completa y lista para usar');
} else {
  console.log(`❌ Problemas encontrados: ${issues.join(', ')}`);
}

console.log('\n💡 Para probar la conectividad:');
console.log('   cd ECCOMERCE-MOBILE && npm run diagnose');