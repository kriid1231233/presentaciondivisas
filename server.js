const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
require('dotenv').config(); // opcional: para desarrollo local si tienes .env
// Configuración multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Obtener lista de archivos multimedia
app.get('/api/media', (req, res) => {
  fs.readdir('uploads/', (err, files) => {
    if (err) return res.json([]);
    const mediaFiles = files.filter(file => 
      file.match(/\.(jpg|jpeg|png|gif|mp4|webm|avi)$/i)
    );
    res.json(mediaFiles);
  });
});

// Subir archivos y registrar en la BD
app.post('/api/media', upload.array('files'), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No se enviaron archivos' });
  }

  const inserted = [];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const f of req.files) {
      const text = 'INSERT INTO media (filename, original_name, mime_type, size) VALUES ($1, $2, $3, $4) RETURNING filename, original_name, mime_type, size, uploaded_at';
      const values = [f.filename, f.originalname, f.mimetype, f.size];
      const r = await client.query(text, values);
      inserted.push(r.rows[0]);
    }
    await client.query('COMMIT');
    res.json({ success: true, files: inserted });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al insertar media en BD:', err);
    res.status(500).json({ error: 'Error al registrar archivos' });
  } finally {
    client.release();
  }
});

// Eliminar archivo
// Eliminar archivo: borrar fichero y registro en BD
app.delete('/api/media/:filename', async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);

  try {
    // borrar fichero si existe
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // borrar registro en BD
    const result = await pool.query('DELETE FROM media WHERE filename = $1', [filename]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error eliminando media:', err);
    res.status(500).json({ error: 'Error eliminando archivo' });
  }
});


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});