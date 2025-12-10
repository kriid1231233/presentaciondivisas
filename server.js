const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

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

app.post('/api/media', upload.array('files'), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No se enviaron archivos' });
  }
  const filenames = req.files.map(f => f.filename);
  res.json({ success: true, files: filenames });
});

// Eliminar archivo
app.delete('/api/media/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  
  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ error: 'Error eliminando archivo' });
    res.json({ success: true });
  });
});
app.use('/uploads', express.static('uploads'));
// Subir archivos
app.post('/api/media', upload.array('files'), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No se enviaron archivos' });
  }
  const filenames = req.files.map(f => f.filename);
  res.json({ success: true, files: filenames });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});