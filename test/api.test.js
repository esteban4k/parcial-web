import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

// Base de datos en memoria para no tocar data/parcial.db
process.env.DB_PATH = ':memory:';
const { default: app } = await import('../src/app.js');
const { db } = await import('../src/db.js');

let server;
let baseUrl;
let tokenAdmin;
let tokenBasico;

async function peticion(metodo, ruta, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(baseUrl + ruta, { method: metodo, headers, body: body && JSON.stringify(body) });
  return { status: res.status, data: await res.json() };
}

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

after(() => server.close());

test('1. registra usuarios con password hasheado y los autentica', async () => {
  const admin = await peticion('POST', '/api/auth/registro', {
    body: { username: 'admin', password: 'admin123', rol: 'administrador' },
  });
  assert.equal(admin.status, 201);
  assert.equal(admin.data.rol, 'administrador');
  assert.equal(admin.data.password, undefined);

  const basico = await peticion('POST', '/api/auth/registro', { body: { username: 'pepe', password: 'pepe123' } });
  assert.equal(basico.status, 201);
  assert.equal(basico.data.rol, 'basico');

  const guardado = db.prepare('SELECT password FROM usuarios WHERE username = ?').get('admin');
  assert.notEqual(guardado.password, 'admin123');
  assert.match(guardado.password, /^\$2[aby]\$/);

  const duplicado = await peticion('POST', '/api/auth/registro', { body: { username: 'admin', password: 'otro123' } });
  assert.equal(duplicado.status, 409);

  const malo = await peticion('POST', '/api/auth/login', { body: { username: 'admin', password: 'incorrecto' } });
  assert.equal(malo.status, 401);

  const loginAdmin = await peticion('POST', '/api/auth/login', { body: { username: 'admin', password: 'admin123' } });
  assert.equal(loginAdmin.status, 200);
  tokenAdmin = loginAdmin.data.token;

  const loginBasico = await peticion('POST', '/api/auth/login', { body: { username: 'pepe', password: 'pepe123' } });
  tokenBasico = loginBasico.data.token;

  const perfil = await peticion('GET', '/api/auth/perfil', { token: tokenBasico });
  assert.deepEqual({ ...perfil.data }, { id: 2, username: 'pepe', rol: 'basico' });
});

test('2. solo el administrador puede crear películas', async () => {
  const pelicula = { titulo: 'Matrix', director: 'Wachowski', anioLanzamiento: 1999, productora: 'Warner', precio: 30000 };

  const basico = await peticion('POST', '/api/peliculas', { body: pelicula, token: tokenBasico });
  assert.equal(basico.status, 403);
  assert.match(basico.data.error, /No autorizado/);

  const sinToken = await peticion('POST', '/api/peliculas', { body: pelicula });
  assert.equal(sinToken.status, 401);

  const invalida = await peticion('POST', '/api/peliculas', { body: { titulo: 'X' }, token: tokenAdmin });
  assert.equal(invalida.status, 400);

  const creadas = [
    pelicula,
    { titulo: 'Interstellar', director: 'Nolan', anioLanzamiento: 2014, productora: 'Paramount', precio: 45000 },
    { titulo: 'Oppenheimer', director: 'Nolan', anioLanzamiento: 2023, productora: 'Universal', precio: 60000 },
    { titulo: 'Coco', director: 'Unkrich', anioLanzamiento: 2017, productora: 'Pixar', precio: 25000 },
  ];
  for (const p of creadas) {
    const res = await peticion('POST', '/api/peliculas', { body: p, token: tokenAdmin });
    assert.equal(res.status, 201);
    assert.equal(res.data.titulo, p.titulo);
  }
});

test('3. usuarios logueados consultan todas las películas', async () => {
  const sinToken = await peticion('GET', '/api/peliculas');
  assert.equal(sinToken.status, 401);

  for (const token of [tokenAdmin, tokenBasico]) {
    const res = await peticion('GET', '/api/peliculas', { token });
    assert.equal(res.status, 200);
    assert.equal(res.data.length, 4);
  }
});

test('4. filtra por año de lanzamiento mayor y precio menor o igual', async () => {
  const sinToken = await peticion('GET', '/api/peliculas/filtro?anio=2000&precio=50000');
  assert.equal(sinToken.status, 401);

  for (const token of [tokenAdmin, tokenBasico]) {
    const res = await peticion('GET', '/api/peliculas/filtro?anio=2000&precio=45000', { token });
    assert.equal(res.status, 200);
    assert.deepEqual(res.data.map((p) => p.titulo), ['Interstellar', 'Coco']);
  }

  const borde = await peticion('GET', '/api/peliculas/filtro?anio=2014&precio=60000', { token: tokenBasico });
  assert.deepEqual(borde.data.map((p) => p.titulo), ['Coco', 'Oppenheimer']);

  const faltante = await peticion('GET', '/api/peliculas/filtro?anio=2000', { token: tokenBasico });
  assert.equal(faltante.status, 400);
});
