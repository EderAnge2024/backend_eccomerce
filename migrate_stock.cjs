const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ecomerce',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
});

pool.connect((err) => {
  if (err) {
    console.error('Error conectando:', err);
    process.exit(1);
  }
  
  console.log('Conectado a la base de datos');
  
  pool.query('ALTER TABLE productos ADD COLUMN IF NOT EXISTS stock INT DEFAULT 0', (err, res) => {
    if (err) {
      console.error('❌ Error:', err.message);
      pool.end();
      process.exit(1);
    }
    console.log('✅ Columna stock añadida/verificada');
    
    pool.query('SELECT id_producto, title, stock FROM productos LIMIT 5', (err, res) => {
      if (!err && res.rows) {
        console.log('\nPrimeros productos:');
        res.rows.forEach(r => console.log(`  ${r.id_producto}. ${r.title} (stock: ${r.stock})`));
      }
      pool.end();
      console.log('\nMigración completada');
    });
  });
});
