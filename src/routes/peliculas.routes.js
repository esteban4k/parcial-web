import { Router } from 'express';
import { db } from '../db.js';
import { ROLES } from '../config.js';
import { verificarToken, permitirRoles } from '../middlewares/auth.js';

const router = Router();

const COLUMNAS = 'id, titulo, director, anio_lanzamiento AS anioLanzamiento, productora, precio';

const textoValido = (valor) => typeof valor === 'string' && valor.trim() !== '';

// Convierte un query param a número; devuelve NaN si viene vacío o no es numérico
const aNumero = (valor) => (typeof valor === 'string' && valor.trim() !== '' ? Number(valor) : NaN);

// Todas las rutas de películas requieren estar logueado
router.use(verificarToken);

// POST /api/peliculas -> solo administrador
router.post('/', permitirRoles(ROLES.ADMIN), (req, res) => {
  const { titulo, director, anioLanzamiento, productora, precio } = req.body ?? {};

  if (![titulo, director, productora].every(textoValido)) {
    return res.status(400).json({ error: 'titulo, director y productora son obligatorios' });
  }
  if (!Number.isInteger(anioLanzamiento) || anioLanzamiento < 1800) {
    return res.status(400).json({ error: 'anioLanzamiento debe ser un año válido (entero)' });
  }
  if (typeof precio !== 'number' || !Number.isFinite(precio) || precio < 0) {
    return res.status(400).json({ error: 'precio debe ser un número mayor o igual a 0' });
  }

  const { lastInsertRowid } = db
    .prepare('INSERT INTO peliculas (titulo, director, anio_lanzamiento, productora, precio) VALUES (?, ?, ?, ?, ?)')
    .run(titulo.trim(), director.trim(), anioLanzamiento, productora.trim(), precio);

  const pelicula = db.prepare(`SELECT ${COLUMNAS} FROM peliculas WHERE id = ?`).get(lastInsertRowid);
  res.status(201).json(pelicula);
});

// GET /api/peliculas -> todas las películas (administrador y básico)
router.get('/', (req, res) => {
  const peliculas = db.prepare(`SELECT ${COLUMNAS} FROM peliculas ORDER BY id`).all();
  res.json(peliculas);
});

// GET /api/peliculas/filtro?anio=2000&precio=50000
// -> películas con año de lanzamiento > anio y precio <= precio
router.get('/filtro', (req, res) => {
  const anio = aNumero(req.query.anio);
  const precio = aNumero(req.query.precio);

  if (!Number.isFinite(anio) || !Number.isFinite(precio)) {
    return res.status(400).json({ error: 'Los parámetros anio y precio son obligatorios y deben ser numéricos' });
  }

  const peliculas = db
    .prepare(`SELECT ${COLUMNAS} FROM peliculas WHERE anio_lanzamiento > ? AND precio <= ? ORDER BY anio_lanzamiento`)
    .all(anio, precio);
  res.json(peliculas);
});

export default router;
