
const mysql = require('mysql2/promise');

// Configuration based on your ArvanCloud credentials
const dbConfig = {
  host: '204bc61aaac241d99da18d8f9e5a209a.db.arvandbaas.ir',
  user: 'base-user',
  password: '69_E-H@t4#32SPPBHdKC6NEV',
  database: 'default',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false // Often required for cloud DBs to prevent SSL errors
  }
};

const pool = mysql.createPool(dbConfig);

console.log(`Connecting to database at ${dbConfig.host}...`);

pool.getConnection()
  .then(conn => {
    console.log('✅ Connected to ArvanCloud Database successfully.');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

module.exports = pool;
