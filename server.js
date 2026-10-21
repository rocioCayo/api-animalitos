require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = Number(process.env.PORT || 3000);
const pool = new Pool(process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGDATABASE || 'appdb',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD,
    });

app.use(express.json());

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS animalitos (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      nombre TEXT NOT NULL,
      tamano TEXT NOT NULL CHECK (tamano IN ('chico', 'grande')),
      color TEXT NOT NULL
    )
  `);
}

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

app.get('/api/animalitos', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, nombre, tamano AS "tamaño", color FROM animalitos ORDER BY id');
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/animalitos/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, tamano AS "tamaño", color FROM animalitos WHERE id = $1',
      [req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: 'Item no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.post('/api/animalitos', async (req, res, next) => {
  const { nombre, tamaño, color } = req.body || {};
  if (typeof nombre !== 'string' || !nombre.trim()) {
    return res.status(400).json({ error: 'El campo nombre es obligatorio' });
  }
  if (!['chico', 'grande'].includes(tamaño)) {
    return res.status(400).json({ error: 'El tamaño debe ser chico o grande' });
  }
  if (typeof color !== 'string' || !color.trim()) {
    return res.status(400).json({ error: 'El campo color es obligatorio' });
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO animalitos (nombre, tamano, color) VALUES ($1, $2, $3) RETURNING id, nombre, tamano AS "tamaño", color',
      [nombre.trim(), tamaño, color.trim()],
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.put('/api/animalitos/:id', async (req, res, next) => {
  const { nombre, tamaño, color } = req.body || {};
  if (typeof nombre !== 'string' || !nombre.trim()) {
    return res.status(400).json({ error: 'El campo nombre es obligatorio' });
  }
  if (!['chico', 'grande'].includes(tamaño)) {
    return res.status(400).json({ error: 'El tamaño debe ser chico o grande' });
  }
  if (typeof color !== 'string' || !color.trim()) {
    return res.status(400).json({ error: 'El campo color es obligatorio' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE animalitos SET nombre = $1, tamano = $2, color = $3
       WHERE id = $4 RETURNING id, nombre, tamano AS "tamaño", color`,
      [nombre.trim(), tamaño, color.trim(), req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: 'Item no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/animalitos/:id', async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM animalitos WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Item no encontrado' });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

initializeDatabase()
  .then(() => app.listen(port, () => console.log(`API lista en http://localhost:${port}`)))
  .catch((error) => {
    console.error('No se pudo iniciar la API o conectar con PostgreSQL:', error.message);
    process.exit(1);
  });

async function shutdown() {
  await pool.end();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
