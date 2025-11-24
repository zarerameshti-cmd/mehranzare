
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images

// --- Database Initialization (Auto-Schema) ---
const initDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('⚙️  Checking Database Schema...');

    // 1. Artworks Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS artworks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255), title_fa VARCHAR(255), title_fr VARCHAR(255), title_de VARCHAR(255), title_ru VARCHAR(255), title_tr VARCHAR(255), title_ar VARCHAR(255), title_zh VARCHAR(255),
        description TEXT, description_fa TEXT, description_fr TEXT, description_de TEXT, description_ru TEXT, description_tr TEXT, description_ar TEXT, description_zh TEXT,
        year INT,
        category VARCHAR(100),
        imageUrl LONGTEXT,
        featured BOOLEAN DEFAULT FALSE,
        dimensions VARCHAR(100),
        technique VARCHAR(255), technique_fa VARCHAR(255), technique_fr VARCHAR(255), technique_de VARCHAR(255), technique_ru VARCHAR(255), technique_tr VARCHAR(255), technique_ar VARCHAR(255), technique_zh VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    // 2. Books Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255), title_fa VARCHAR(255), title_fr VARCHAR(255), title_de VARCHAR(255), title_ru VARCHAR(255), title_tr VARCHAR(255), title_ar VARCHAR(255), title_zh VARCHAR(255),
        subtitle VARCHAR(255), subtitle_fa VARCHAR(255), subtitle_fr VARCHAR(255), subtitle_de VARCHAR(255), subtitle_ru VARCHAR(255), subtitle_tr VARCHAR(255), subtitle_ar VARCHAR(255), subtitle_zh VARCHAR(255),
        description TEXT, description_fa TEXT, description_fr TEXT, description_de TEXT, description_ru TEXT, description_tr TEXT, description_ar TEXT, description_zh TEXT,
        price DECIMAL(10, 2),
        coverUrl LONGTEXT,
        pages INT,
        publishDate VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    // 3. Journal Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS journal (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255), title_fa VARCHAR(255), title_fr VARCHAR(255), title_de VARCHAR(255), title_ru VARCHAR(255), title_tr VARCHAR(255), title_ar VARCHAR(255), title_zh VARCHAR(255),
        excerpt TEXT, excerpt_fa TEXT, excerpt_fr TEXT, excerpt_de TEXT, excerpt_ru TEXT, excerpt_tr TEXT, excerpt_ar TEXT, excerpt_zh TEXT,
        content TEXT, content_fa TEXT,
        date VARCHAR(50),
        tags TEXT, -- Will store JSON string
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    console.log('✅ Tables verified/created successfully.');
    connection.release();
  } catch (err) {
    console.error('❌ Error initializing database:', err);
  }
};

// Initialize DB on start
initDB();

// --- Artworks Endpoints ---
app.get('/api/artworks', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM artworks ORDER BY year DESC');
    const processed = rows.map(r => ({ ...r, id: r.id.toString(), featured: Boolean(r.featured) }));
    res.json(processed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/artworks', async (req, res) => {
  try {
    const art = req.body;
    const { id, ...data } = art; 
    const [result] = await pool.query('INSERT INTO artworks SET ?', data);
    res.json({ id: result.insertId.toString(), ...data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/artworks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM artworks WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Books Endpoints ---
app.get('/api/books', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM books ORDER BY created_at DESC');
    const processed = rows.map(r => ({ ...r, id: r.id.toString() }));
    res.json(processed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/books', async (req, res) => {
  try {
    const book = req.body;
    const { id, ...data } = book;
    const [result] = await pool.query('INSERT INTO books SET ?', data);
    res.json({ id: result.insertId.toString(), ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM books WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Journal Endpoints ---
app.get('/api/journal', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM journal ORDER BY date DESC');
    const processed = rows.map(row => ({
      ...row,
      id: row.id.toString(),
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : row.tags
    }));
    res.json(processed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/journal', async (req, res) => {
  try {
    const post = req.body;
    const { id, ...data } = post;
    const dbPost = { ...data, tags: JSON.stringify(data.tags) };
    const [result] = await pool.query('INSERT INTO journal SET ?', dbPost);
    res.json({ id: result.insertId.toString(), ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/journal/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM journal WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
