import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DB_PATH } from './config.js';

if (DB_PATH !== ':memory:') {
  mkdirSync(dirname(DB_PATH), { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    rol      TEXT NOT NULL CHECK (rol IN ('administrador', 'basico'))
  );

  CREATE TABLE IF NOT EXISTS peliculas (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo           TEXT    NOT NULL,
    director         TEXT    NOT NULL,
    anio_lanzamiento INTEGER NOT NULL,
    productora       TEXT    NOT NULL,
    precio           REAL    NOT NULL
  );
`);
