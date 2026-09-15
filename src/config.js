// Carga variables desde .env si existe (Node >= 21.7 lo trae incorporado)
try {
  process.loadEnvFile();
} catch {
  // Sin archivo .env: se usan los valores por defecto
}

export const PORT = process.env.PORT || 3000;
export const JWT_SECRET = process.env.JWT_SECRET || 'cambiar-este-secreto-en-produccion';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';
export const DB_PATH = process.env.DB_PATH || 'data/parcial.db';

export const ROLES = Object.freeze({
  ADMIN: 'administrador',
  BASICO: 'basico',
});
