import express from 'express';
import { join } from 'node:path';
import authRoutes from './routes/auth.routes.js';
import peliculasRoutes from './routes/peliculas.routes.js';

const app = express();

app.use(express.json());

// Front básico en public/index.html (http://localhost:3000)
app.use(express.static(join(import.meta.dirname, '..', 'public')));

app.get('/api', (req, res) => {
  res.json({ mensaje: 'API Parcial 1 Desarrollo Web', rutas: ['/api/auth', '/api/peliculas'] });
});

app.use('/api/auth', authRoutes);
app.use('/api/peliculas', peliculasRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

export default app;
