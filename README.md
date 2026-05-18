# CreaTuCita - Backend API

API REST para la gestion de citas medicas, construida con **NestJS**, **TypeORM** y **PostgreSQL**.

## Requisitos

- Node.js >= 18
- npm >= 9
- PostgreSQL >= 15
- Docker y Docker Compose (opcional, para base de datos)

## Instalacion rapida

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd creatucita-backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar la base de datos

**Opcion A - Con Docker (recomendado):**

```bash
docker-compose up -d
```

Esto levanta PostgreSQL en el puerto `5433` y pgAdmin en `http://localhost:5050`.

**Opcion B - PostgreSQL local:**

Crea una base de datos llamada `creatucita` y actualiza el archivo `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_NAME=creatucita
```

### 4. Configurar variables de entorno

Copia o edita el archivo `.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=password123
DB_NAME=creatucita

# Authentication
JWT_SECRET=super-secret-key-change-this-in-production
JWT_EXPIRES_IN=1d

# App Configuration
PORT=3002
NODE_ENV=development
```

### 5. Iniciar el servidor

```bash
# Desarrollo (con hot-reload)
npm run start:dev

# Produccion
npm run build
npm run start:prod
```

El servidor estara disponible en `http://localhost:3002`.

### 6. Crear usuario administrador

Una vez el servidor este corriendo, ejecuta:

```bash
curl -X POST http://localhost:3002/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@creatucita.com","password":"Admin123@","name":"Administrador"}'
```

O con PowerShell:

```powershell
Invoke-RestMethod -Uri "http://localhost:3002/auth/create-admin" -Method Post -ContentType "application/json" -Body '{"email":"admin@creatucita.com","password":"Admin123@","name":"Administrador"}'
```

**Credenciales del admin:**
- Email: `admin@creatucita.com`
- Password: `Admin123@`

## Scripts disponibles

| Comando | Descripcion |
|---------|-------------|
| `npm run start:dev` | Inicia en modo desarrollo con hot-reload |
| `npm run start:debug` | Inicia con debugger habilitado |
| `npm run start:prod` | Inicia la version compilada |
| `npm run build` | Compila el proyecto TypeScript |
| `npm run lint` | Ejecuta ESLint con correccion automatica |
| `npm run test` | Ejecuta las pruebas unitarias |
| `npm run test:cov` | Ejecuta pruebas con cobertura |

## API Endpoints

### Autenticacion

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/auth/register` | Registrar cliente |
| POST | `/auth/register-specialist` | Registrar especialista |
| POST | `/auth/login` | Iniciar sesion |
| POST | `/auth/create-admin` | Crear usuario admin |

### Usuarios (Admin)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/users` | Listar usuarios activos |
| GET | `/users/deleted` | Listar usuarios eliminados |
| POST | `/users` | Crear usuario |
| PATCH | `/users/:id` | Actualizar usuario |
| DELETE | `/users/:id` | Soft delete usuario |
| PATCH | `/users/:id/restore` | Restaurar usuario |

### Especialistas

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/specialists/me` | Mi perfil de especialista |
| GET | `/specialists/dashboard` | Dashboard del especialista |
| PATCH | `/specialists/profile` | Actualizar perfil |
| GET | `/specialists/admin/pending` | Solicitudes pendientes (Admin) |
| GET | `/specialists/admin/all` | Todos los especialistas (Admin) |
| PATCH | `/specialists/admin/:id/approve` | Aprobar solicitud (Admin) |
| PATCH | `/specialists/admin/:id/reject` | Rechazar solicitud (Admin) |

### Categorias

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/categories` | Listar categorias |
| POST | `/categories` | Crear categoria |
| PATCH | `/categories/:id` | Actualizar categoria |
| DELETE | `/categories/:id` | Eliminar categoria |
| POST | `/categories/:id/subcategories` | Crear subcategoria |
| PATCH | `/categories/subcategories/:id` | Actualizar subcategoria |
| DELETE | `/categories/subcategories/:id` | Eliminar subcategoria |

### Citas

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/appointments` | Crear cita |
| GET | `/appointments/my-appointments` | Mis citas |
| GET | `/appointments/specialist/upcoming` | Citas proximas del especialista |
| PATCH | `/appointments/:id/status` | Actualizar estado de cita |

## Documentacion Swagger

La documentacion interactiva de la API esta disponible en:

```
http://localhost:3002/api/docs
```

## Estructura del proyecto

```
src/
├── auth/               # Autenticacion y JWT
├── categories/         # Categorias y subcategorias
├── appointments/       # Gestion de citas
├── schedules/          # Horarios y disponibilidad
├── specialists/        # Perfiles de especialistas
├── users/              # Gestion de usuarios
├── offered-services/   # Servicios ofrecidos
├── mail/               # Servicio de correo
├── config/             # Configuraciones
├── app.module.ts       # Modulo principal
└── main.ts             # Punto de entrada
```

## Tecnologias

- **NestJS 11** - Framework backend
- **TypeORM** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos
- **Passport + JWT** - Autenticacion
- **Swagger** - Documentacion API
- **class-validator** - Validacion de DTOs
- **bcrypt** - Hash de contrasenas
- **nodemailer** - Envio de correos

## Notas de produccion

1. Cambia `JWT_SECRET` por una clave segura y unica
2. Cambia `synchronize: true` a `false` en `app.module.ts`
3. Configura las variables de correo electronico en `.env`
4. Usa HTTPS en produccion
5. Configura CORS con dominios especificos
