const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ecomerce',
  password: 'admin',
  port: 5432,
});

pool.query('ALTER TABLE productos ADD COLUMN IF NOT EXISTS stock INT DEFAULT 0', (err, res) => {
  if (err) {
    console.log('Error:', err.message);
  } else {
    console.log('Stock column added/verified');
  }
  pool.end();
});
