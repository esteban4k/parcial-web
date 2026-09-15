import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

// Exige un token JWT válido en el header "Authorization: Bearer <token>"
export function verificarToken(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Debe iniciar sesión para acceder a este recurso' });
  }

  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Permite el acceso solo a los roles indicados (usar después de verificarToken)
export function permitirRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({
        error: `No autorizado: esta acción solo la puede realizar el rol ${roles.join(' o ')}`,
      });
    }
    next();
  };
}
