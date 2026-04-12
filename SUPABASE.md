## Paso 1: Instalar y verificar Docker Desktop

**Objetivo:** dejar Docker funcionando, porque Supabase local corre sobre contenedores Docker.

### Pasos

1. Descargar Docker Desktop para la arquitectura correcta.
   - En Windows x64, usar AMD64.
2. Instalar Docker Desktop.
3. Abrir Docker Desktop.
4. Esperar a que quede corriendo.
5. Verificar en terminal:

```bash
docker --version
docker ps
```

Verificar que la Supabase CLI puede ejecutarse:

```bash
npx supabase --help
```

### Notas

Si es la primera vez, confirmar instalación temporal cuando lo solicite `npx`.

## Paso 2: Levantar Supabase local

**Objetivo:** iniciar el entorno completo de Supabase en local usando Docker.

### Pasos

1. Desde la raiz del proyecto, ejecutar:

```bash
npx supabase start
```

2. Esperar a que se descarguen las imagenes de Docker (la primera vez puede tardar varios minutos).

3. Verificar el estado del entorno:

```bash
npx supabase status
```

### Resultado esperado

Supabase levanta multiples servicios en contenedores Docker.

Se muestran URLs y credenciales locales, por ejemplo:

```text
Project URL: http://127.0.0.1:54321
REST API: http://127.0.0.1:54321/rest/v1
GraphQL: http://127.0.0.1:54321/graphql/v1
Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio: http://127.0.0.1:54323
```

Tambien se generan claves de acceso:

- `publishable`
- `secret`

### Aclaraciones

- La primera ejecucion descarga varias imagenes y puede tardar.
- Docker debe estar corriendo previamente.
- Cada vez que quieras levantar el entorno, usa `supabase start`.
- Para detenerlo:

```bash
npx supabase stop
```

### Notas

- Este entorno es completamente local e independiente del proyecto remoto.
- Las keys generadas son solo para desarrollo local.
- Todo lo que hagas (tablas, datos, buckets, etc.) queda solo en tu maquina.
- Supabase Studio permite administrar todo desde una UI en http://127.0.0.1:54323.
  Supabase local utiliza Docker para levantar:
- Base de datos (Postgres)
- Auth
- Storage
- API
- Studio (interfaz web)

## Paso 3: Configurar variables de entorno para Supabase local

**Objetivo:** permitir que la aplicacion se conecte al entorno local de Supabase.

### Pasos

1. Crear un archivo de entorno (por ejemplo `.env.dev`).

2. Agregar las siguientes variables usando los valores generados por `supabase start`:

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_PUBLISHABLE_KEY=sb_publishable_XXXX
SUPABASE_SECRET_KEY=sb_secret_XXXX
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Resultado esperado

La aplicacion puede conectarse a:

- API de Supabase
- Base de datos
- Auth
- Storage

### Aclaraciones

- Los valores deben copiarse del output de `npx supabase start` o `npx supabase status`.
- Estas credenciales son locales y no corresponden al proyecto remoto de Supabase.
- `SUPABASE_PUBLISHABLE_KEY` simula un cliente publico.
- `SUPABASE_SECRET_KEY` tiene acceso total y solo debe usarse en backend.
- `DATABASE_URL` permite conexion directa a Postgres (opcional segun uso).

### Notas

- No subir archivos `.env` al repositorio.
- Cada desarrollador debe tener su propio entorno local de Supabase corriendo.
- Si se reinicia el entorno (`supabase stop --no-backup`), las credenciales pueden regenerarse.

## Paso 4: Aplicar migrations y crear la base de datos

**Objetivo:** crear las tablas y estructura de la base de datos a partir de las migrations del proyecto.

### Pasos

1. Ejecutar el siguiente comando desde la raíz del proyecto:

```bash
npx supabase db reset
```

### Resultado esperado

- Se recrea la base de datos local.
- Se ejecutan todas las migrations en `supabase/migrations/`.
- Se crean las tablas, relaciones y constraints definidos en el proyecto.

### Aclaraciones

- Este comando elimina y vuelve a crear la base local.
- Es seguro usarlo en desarrollo.
- Garantiza que todos los desarrolladores tengan la misma estructura de base de datos.
- Es la forma recomendada de inicializar el schema local.

### Verificación

1. Abrir Supabase Studio:

```text
http://127.0.0.1:54323
```

2. Ir a Table Editor.

3. Verificar que existen tablas como:

- `app_user`
- `restaurant`
- `restaurant_staff`
- `menu`
- `category`
- `product`
- `restaurant_table`
- `restaurant_order`
- `order_item`

## Flujo de Auth y perfil

**Objetivo:** mantener `auth.users` como fuente de verdad para credenciales y `public.app_user` como perfil de negocio.

### Regla

- El frontend hace `supabase.auth.signUp({ email, password })`.
- El backend no recibe ni guarda passwords.
- Un trigger en Postgres crea o actualiza `public.app_user` con `id`, `email` y `global_role`.
- El resto de la app usa `app_user.id` como referencia para restaurantes, staff y órdenes.

### Resultado esperado

Cada usuario autenticado en Supabase tiene su fila correspondiente en `public.app_user` sin trabajo extra desde la API.

**CUIDADO**

## Paso 5:Desplegar schema a produccion (Supabase remoto)

**Objetivo:** aplicar las migrations locales al proyecto remoto de Supabase.

### Pasos

1. Iniciar sesion en Supabase CLI:

```bash
npx supabase login
```

2. Obtener el `project-ref` del proyecto remoto desde el dashboard de Supabase.

3. Linkear el proyecto local con el remoto:

```bash
npx supabase link --project-ref TU_PROJECT_REF
```

4. Aplicar las migrations al entorno remoto:

```bash
npx supabase db push
```

### Resultado esperado

- Las tablas, relaciones y constraints se crean en el proyecto remoto.
- El schema en produccion queda alineado con el entorno local.
- Las migrations quedan registradas en Supabase.

### Aclaraciones

- `db push` aplica solo las migrations que aun no fueron ejecutadas en el remoto.
- Es seguro ejecutarlo multiples veces (no duplica cambios ya aplicados).
- El proyecto debe estar previamente linkeado (`supabase link`).
- Este comando modifica la base de datos remota, usar con cuidado.

### Verificacion

1. Ir al dashboard de Supabase (proyecto remoto).
2. Abrir Table Editor.
3. Confirmar que existen las tablas:

- `app_user`
- `restaurant`
- `restaurant_staff`
- `menu`
- `category`
- `product`
- `restaurant_table`
- `restaurant_order`
- `order_item`

### Notas

- Este paso debe ejecutarse solo cuando el schema este validado localmente.
- Evitar ejecutar `db push` directamente sin probar antes con `db reset`.
- Las migrations son la fuente de verdad del schema, no el estado manual de la base.
