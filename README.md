# parcial-web

API en Node JS con Express para registrar usuarios y gestionar películas.

## Integrantes

Juan Esteban Zapata Londoño

## Cómo ejecutarlo

Requiere Node 22.13 o superior.

```bash
npm install
npm start
```

Abrir http://localhost:3000 para usar el front de prueba.

## Endpoints

| Método | Ruta | Quién |
|--------|------|-------|
| POST | `/api/auth/registro` | Cualquiera |
| POST | `/api/auth/login` | Cualquiera |
| POST | `/api/peliculas` | Solo administrador |
| GET | `/api/peliculas` | Usuarios logueados |
