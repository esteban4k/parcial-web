import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { JWT_SECRET, JWT_EXPIRES_IN, ROLES } from '../config.js';
import { verificarToken } from '../middlewares/auth.js';

const router = Router();
const SALT_ROUNDS = 10;

// POST /api/auth/registro -> crea un usuario con la contraseña hasheada
router.post('/registro', async (req, res) => {
  const { username, password, rol = ROLES.BASICO } = req.body ?? {};

  if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'username y password son obligatorios' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'El password debe tener al menos 6 caracteres' });
  }
  if (!Object.values(ROLES).includes(rol)) {
    return res.status(400).json({ error: `rol inválido, valores permitidos: ${Object.values(ROLES).join(', ')}` });
  }

  const nombre = username.trim();
  const existe = db.prepare('SELECT id FROM usuarios WHERE username = ?').get(nombre);
  if (existe) {
    return res.status(409).json({ error: 'El username ya está registrado' });
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const { lastInsertRowid } = db
    .prepare('INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)')
    .run(nombre, hash, rol);

  res.status(201).json({ id: Number(lastInsertRowid), username: nombre, rol });
});

// POST /api/auth/login -> valida credenciales y entrega un JWT
router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'username y password son obligatorios' });
  }

  const usuario = db.prepare('SELECT id, username, password, rol FROM usuarios WHERE username = ?').get(username.trim());
  const valido = usuario && (await bcrypt.compare(password, usuario.password));
  if (!valido) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const payload = { id: usuario.id, username: usuario.username, rol: usuario.rol };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  res.json({ token, usuario: payload });
});

// GET /api/auth/perfil -> consulta la información del usuario autenticado
router.get('/perfil', verificarToken, (req, res) => {
  const usuario = db.prepare('SELECT id, username, rol FROM usuarios WHERE id = ?').get(req.usuario.id);
  if (!usuario) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  res.json(usuario);
});

export default router;
