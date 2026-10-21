# API REST con Node.js y PostgreSQL

API CRUD para administrar animalitos con `id`, `nombre`, `tamaño`, y `color`. El tamaño acepta `chico` o `grande`.

## Inicio con Docker Desktop

1. Copia `.env.example` a `.env` y cambia `PGPASSWORD` por una contraseña propia.
2. Asegúrate de que Docker Desktop esté iniciado y que exista el volumen Docker `postgres_data`.
3. En esta carpeta ejecuta `docker compose up --build -d`.
4. Revisa `http://localhost:3000/health` y prueba los endpoints de abajo.

Compose usa el volumen existente `postgres_data` para persistir la base. La tabla `animalitos` se crea al iniciar la API.

## Endpoints

- `GET /health` — verifica la conexión a PostgreSQL.
- `GET /api/animalitos` — lista los animalitos.
- `GET /api/animalitos/:id` — obtiene un animalito.
- `POST /api/animalitos` — crea uno; JSON: `{"nombre":"Gato","tamaño":"chico","color":"gris"}`.
- `PUT /api/animalitos/:id` — actualiza nombre, tamaño y color con el mismo formato JSON.
- `DELETE /api/animalitos/:id` — elimina un animalito.

La API usa el puerto `3000` y PostgreSQL `5432`. Ajusta `.env` si esos puertos ya están ocupados.

## Publicar en Render

El archivo `render.yaml` configura un servicio Docker para la API y una base PostgreSQL administrada por Render. Sube este repositorio a GitHub y, en Render, crea un **New Blueprint Instance** seleccionando el repositorio. Render leerá `render.yaml` y configurará `DATABASE_URL` sin guardar credenciales en Git.
