# Fluw --- Sistema de Gestión de Finanzas Personales

Fluw es una aplicación web de gestión financiera personal desarrollada
con Angular, Node.js, Express, TypeScript, Prisma y PostgreSQL.
Centraliza autenticación, ingresos, gastos, impuestos, ahorros, eventos,
fondo de emergencia, gastos planeados, notificaciones y visualización
financiera desde un dashboard.

## Estado actual

El proyecto incluye autenticación tradicional con correo y contraseña,
autenticación y registro automático con Google, sesiones con JWT y
refresh tokens en cookies HttpOnly, pantalla de sesión caducada,
dashboard, ingresos fijos/variables/extraordinarios, gastos, impuestos,
presupuesto de impuestos, metas de ahorro, fondo de emergencia, gastos
planeados, eventos, notificaciones y gráficas de ingresos/gastos.

## Tecnologías

**Frontend:** Angular, TypeScript, RxJS, Reactive Forms, CSS y Google
Identity Services.

**Backend:** Node.js, Express, TypeScript, Prisma ORM, JWT, bcrypt,
`google-auth-library`, `cookie-parser` y CORS.

**Infraestructura:** PostgreSQL 16, Docker, Docker Compose, pnpm, Git y
GitHub.

## Arquitectura

``` text
Usuario
  ↓
Angular — http://localhost:4200
  ↓ HTTP + cookies
Express API — http://localhost:3000/api
  ↓
Prisma ORM
  ↓
PostgreSQL 16 — Docker :5432
```

Google utiliza este flujo:

``` text
Google Identity Services
  ↓ credential / ID token
Angular
  ↓ POST /api/auth/google
Backend verifica el token
  ↓
Busca o crea al usuario
  ↓
Crea la sesión de Fluw
  ↓
Dashboard
```

# Instalación y ejecución

## Requisitos

Se requiere Node.js, pnpm, Docker Desktop, Docker Compose y Git.
PostgreSQL se ejecuta mediante Docker.

``` powershell
node --version
pnpm --version
docker --version
docker compose version
git --version
```

## Backend

### 1. Entrar al backend

``` powershell
cd E:\kinal\proyecto\Fluw\backend
```

### 2. Instalar dependencias

``` powershell
pnpm install
```

### 3. Crear `.env`

Crear `backend/.env`:

``` env
DATABASE_URL="postgresql://flow_user:flow_password@localhost:5432/flow_db?schema=public"
JWT_SECRET="REEMPLAZAR_POR_UN_SECRETO_LARGO_Y_SEGURO"
PORT=3000
ACCESS_TOKEN_EXPIRES_IN=20s
SESSION_IDLE_TIMEOUT=1h
GOOGLE_CLIENT_ID="TU_CLIENT_ID_DE_GOOGLE.apps.googleusercontent.com"
```

`JWT_SECRET` debe ser una clave segura. `GOOGLE_CLIENT_ID` corresponde
al cliente OAuth Web de Fluw. El Client Secret de Google no debe
colocarse en Angular.

### 4. Iniciar PostgreSQL

``` powershell
docker compose up -d
```

### 5. Verificar Docker

``` powershell
docker ps
docker logs flow-postgres
```

### 6. Generar Prisma Client

``` powershell
pnpm exec prisma generate
```

### 7. Aplicar migraciones

Para instalar un repositorio que ya contiene sus migraciones:

``` powershell
pnpm exec prisma migrate deploy
```

Para crear una migración nueva durante desarrollo:

``` powershell
pnpm exec prisma migrate dev --name nombre_de_la_migracion
```

No se deben recrear manualmente las migraciones históricas en cada
instalación.

Si el proyecto mantiene datos de prueba mediante seed:

``` powershell
pnpm exec prisma db seed
```

### 8. Detectar errores

``` powershell
pnpm exec tsc --noEmit
```

### 9. Compilar backend

``` powershell
pnpm run build
```

Si se necesita ejecutar directamente el compilador:

``` powershell
pnpm exec tsc
```

### 10. Ejecutar backend

``` powershell
pnpm run dev
```

Disponible en `http://localhost:3000`.

## Frontend

### 1. Abrir otra PowerShell

``` powershell
cd E:\kinal\proyecto\Fluw\frontend
```

### 2. Instalar dependencias

``` powershell
pnpm install
```

### 3. Configurar Angular

Revisar `frontend/src/environments/environment.ts`:

``` ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  googleClientId: 'TU_CLIENT_ID_DE_GOOGLE.apps.googleusercontent.com',
};
```

El `googleClientId` debe corresponder al mismo cliente OAuth configurado
para el backend.

### 4. Detectar errores

``` powershell
pnpm exec tsc --noEmit
```

### 5. Compilar frontend

``` powershell
pnpm run build
```

### 6. Iniciar frontend

``` powershell
pnpm start
```

Abrir `http://localhost:4200`.

## Orden recomendado

**Terminal 1**

``` powershell
cd E:\kinal\proyecto\Fluw\backend
docker compose up -d
pnpm run dev
```

**Terminal 2**

``` powershell
cd E:\kinal\proyecto\Fluw\frontend
pnpm start
```

Orden: PostgreSQL → Backend → Frontend → Navegador.

# Google OAuth

Crear en Google Cloud un cliente OAuth de tipo **Aplicación web**. Para
desarrollo local debe autorizarse el origen:

``` text
http://localhost:4200
```

El Client ID se configura en `backend/.env` y
`frontend/src/environments/environment.ts`. El Client Secret no se
utiliza en el frontend.

Si Google Auth Platform está en modo **Testing**, las cuentas utilizadas
durante las pruebas pueden necesitar agregarse como usuarios de prueba.

Comportamiento implementado:

-   Primera entrada con una cuenta Google nueva: se crea automáticamente
    un usuario `USER`.
-   Entradas posteriores: se localiza al usuario mediante su `googleId`
    y se crea una nueva sesión.
-   Las cuentas locales `ADMIN` y `USER` continúan usando correo y
    contraseña.
-   Una cuenta local existente no se sustituye automáticamente por una
    cuenta Google con el mismo correo.

# Autenticación y sesiones

Fluw utiliza `access_token` y `refresh_token`. Las cookies se envían
como `HttpOnly`, y el frontend utiliza `withCredentials: true`.

``` text
Correo + contraseña → POST /api/auth/login
Google credential   → POST /api/auth/google
Refresh token       → POST /api/auth/refresh
Usuario actual      → GET  /api/auth/me
Cerrar sesión       → POST /api/auth/logout
```

Las rutas privadas utilizan el middleware `requireAuth`.

# API REST

URL base:

``` text
http://localhost:3000/api
```

## Autenticación

  Método   Endpoint              Descripción
  -------- --------------------- --------------------------------
  POST     `/api/auth/login`     Login con correo y contraseña
  POST     `/api/auth/google`    Login o registro con Google
  POST     `/api/auth/refresh`   Renueva el access token
  GET      `/api/auth/me`        Obtiene el usuario autenticado
  POST     `/api/auth/logout`    Cierra la sesión

Login tradicional:

``` json
{
  "email": "usuario@correo.com",
  "password": "contraseña"
}
```

Google:

``` json
{
  "credential": "ID_TOKEN_ENTREGADO_POR_GOOGLE"
}
```

El `credential` debe provenir de Google Identity Services.

## Ingresos

Ruta base: `/api/ingresos`.

Administra los ingresos del usuario, incluidos los tipos utilizados para
ingresos fijos, variables y extraordinarios.

## Gastos

Ruta base: `/api/gastos`.

Administra los gastos asociados al usuario autenticado.

## Impuestos

``` http
GET /api/impuestos?mes=YYYY-MM
```

Ejemplo:

``` http
GET /api/impuestos?mes=2026-09
```

Consulta los ingresos relevantes del mes y los cálculos de impuestos
correspondientes.

## Presupuesto de impuestos

Ruta base: `/api/presupuesto-impuestos`.

Permite almacenar y consultar el presupuesto destinado al pago de
impuestos.

## Ahorros

Ruta base: `/api/ahorros`.

Gestiona la meta de ahorro, periodicidad de cuota, monto y progreso.

## Fondo de emergencia

Ruta base: `/api/fondo-emergencia`.

Administra el fondo de emergencia del usuario.

## Gastos planeados

Ruta base: `/api/gastos-planeados`.

Administra gastos previstos para la planificación financiera.

## Eventos

Ruta base: `/api/eventos`.

Gestiona próximos eventos financieros, incluyendo creación, consulta,
edición y eliminación.

## Notificaciones

Ruta base: `/api/notificaciones`.

El sistema genera notificaciones para acciones como inicio de sesión,
próximos eventos, metas de ahorro, impuestos y acciones relacionadas con
gastos.

> Para los módulos cuya tabla anterior solo indica la ruta base, los
> métodos HTTP exactos deben consultarse en el archivo `*.routes.ts`
> correspondiente. Esto evita documentar operaciones que no estén
> implementadas en el código actual.

# Módulos funcionales

**Dashboard:** concentra la información financiera y los accesos
principales.

**Ingresos:** administra fuentes de ingreso y alimenta totales y
gráficas.

**Gastos:** registra gastos y alimenta totales, límites y gráficas.

**Impuestos:** consulta los impuestos por mes utilizando `mes=YYYY-MM`.

**Ahorros:** permite definir una meta y visualizar su progreso.

**Fondo de emergencia:** mantiene una reserva financiera independiente.

**Gastos planeados:** registra compromisos financieros previstos.

**Eventos:** guarda fechas y descripciones de próximos eventos.

**Notificaciones:** informa sobre acciones relevantes generadas por los
módulos.

**Gráficas:** muestra un resumen semanal y permite analizar ingresos y
gastos por diferentes períodos.

# Modelos principales

Entre las entidades administradas mediante Prisma se encuentran:

-   `User`
-   `RefreshToken`
-   `Ingreso`
-   `Gasto`
-   `Evento`
-   `Ahorro`
-   `PresupuestoImpuesto`
-   `FondoEmergencia`
-   `GastoPlaneado`
-   `Notificacion`

Los usuarios Google almacenan un `googleId` estable y un proveedor de
autenticación. Los datos financieros están relacionados con el usuario
propietario.

# Pruebas

## Login tradicional

1.  Abrir `http://localhost:4200`.
2.  Introducir las credenciales de un usuario local.
3.  Presionar **Iniciar sesión**.
4.  Verificar el acceso al dashboard.

## Login con Google

1.  Abrir `http://localhost:4200`.
2.  Presionar el botón oficial de Google.
3.  Seleccionar una cuenta autorizada.
4.  Google entrega el `credential`.
5.  Angular llama a `/api/auth/google`.
6.  El backend verifica el token.
7.  Si es una cuenta nueva, crea el usuario.
8.  Se inicia la sesión y se abre el dashboard.

## Sesión caducada

Para pruebas puede configurarse un access token corto, por ejemplo
`ACCESS_TOKEN_EXPIRES_IN=20s`. Debe verificarse el comportamiento de
renovación y, cuando la sesión completa ya no sea válida, la navegación
a la pantalla de sesión caducada.

Un access token de 20 segundos es una configuración de prueba, no una
recomendación para producción.

# Comandos útiles

``` powershell
# Ver contenedores
docker ps

# Logs de PostgreSQL
docker logs flow-postgres

# Detener Docker sin eliminar los datos persistentes
docker compose down

# Generar Prisma Client
pnpm exec prisma generate

# Aplicar migraciones existentes
pnpm exec prisma migrate deploy

# Crear una migración nueva en desarrollo
pnpm exec prisma migrate dev --name descripcion_del_cambio

# Abrir Prisma Studio
pnpm exec prisma studio

# Comprobar TypeScript
pnpm exec tsc --noEmit

# Compilar
pnpm run build
```

# Solución de problemas

## Prisma P1000 / P1001

Comprobar Docker, `flow-postgres`, las credenciales de `DATABASE_URL`,
la base de datos y el puerto `5432`.

## Google: `401 invalid_client`

Comprobar que `environment.ts` no conserve el placeholder
`TU_CLIENT_ID_DE_GOOGLE` y que el ID pertenezca a un cliente OAuth
válido de tipo Aplicación web.

## Google: origen no autorizado

Comprobar que Google Cloud tenga autorizado `http://localhost:4200` y
que Angular realmente esté ejecutándose en ese puerto.

## Google en modo Testing

Agregar las cuentas necesarias a los usuarios de prueba de Google Auth
Platform.

## Prisma Client desactualizado

``` powershell
pnpm exec prisma generate
```

## Errores TypeScript

``` powershell
pnpm exec tsc --noEmit
```

# Seguridad

-   No subir `.env` al repositorio.
-   No publicar `JWT_SECRET`.
-   No guardar el Google Client Secret en Angular.
-   Cifrar contraseñas con bcrypt.
-   Mantener tokens de sesión en cookies `HttpOnly`.
-   Utilizar HTTPS y cookies `Secure` en producción.
-   Restringir CORS al frontend autorizado.
-   Rotar cualquier secreto expuesto durante desarrollo.
-   Cambiar credenciales de prueba antes de producción.
-   Utilizar tiempos de expiración adecuados en producción.

# Estructura general

``` text
Fluw/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/
│   │   ├── generated/prisma/
│   │   ├── middlewares/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── ingresos/
│   │   │   ├── gastos/
│   │   │   ├── impuestos/
│   │   │   ├── eventos/
│   │   │   └── ...
│   │   └── app.ts
│   ├── .env
│   ├── docker-compose.yml
│   ├── package.json
│   ├── prisma.config.ts
│   └── tsconfig.json
├── frontend/
│   ├── public/images/
│   ├── src/
│   │   ├── app/
│   │   │   ├── features/
│   │   │   └── services/
│   │   ├── environments/environment.ts
│   │   ├── index.html
│   │   └── styles.css
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

# Flujo de desarrollo

Después de cambios:

``` powershell
pnpm exec tsc --noEmit
pnpm run build
```

Después de cambios en Prisma:

``` powershell
pnpm exec prisma migrate dev --name descripcion_del_cambio
pnpm exec prisma generate
```

Para Git:

``` powershell
git add .
git commit -m "feat: descripcion del cambio"
git push origin main
```

# Producción

Antes de desplegar:

-   Usar un `JWT_SECRET` fuerte.
-   Configurar tiempos de sesión apropiados.
-   Utilizar HTTPS.
-   Activar cookies `Secure`.
-   Configurar CORS para el dominio real.
-   Crear/configurar las credenciales OAuth de producción.
-   Agregar el dominio real a Google Auth Platform.
-   Revisar el estado de publicación de OAuth.
-   Rotar secretos expuestos durante desarrollo.
-   Aplicar migraciones con `prisma migrate deploy`.
-   Eliminar o cambiar credenciales de prueba.
-   Configurar copias de seguridad de PostgreSQL.

# Resumen

Fluw evolucionó de un login básico a una aplicación de finanzas
personales con autenticación basada en sesiones, acceso con Google,
dashboard y módulos para ingresos, gastos, impuestos, ahorros, eventos,
fondo de emergencia, gastos planeados, notificaciones y visualización
financiera.

La arquitectura separa Angular, la API REST de Express, Prisma y
PostgreSQL, facilitando el mantenimiento y la incorporación de nuevas
funcionalidades.
