# Invitación 15 años · Arlene Dafne + Mesa de regalos

100 % gratis: Vercel (plan Hobby) + Upstash Redis (plan gratuito, no se duerme).

- `public/index.html` → la invitación (los invitados eligen regalos en "Sugerencias de regalos")
- `public/admin.html` → panel privado de la cumpleañera (`tu-sitio.vercel.app/admin.html`)
- `api/` y `lib/` → funciones de Vercel y acceso a la base de datos

## Subirlo a Vercel (sin instalar nada)

1. Sube esta carpeta a un repositorio de GitHub (github.com → "New repository" → "uploading an existing file").
2. En vercel.com → **Add New → Project** → importa ese repositorio → **Deploy** (deja todo por defecto).
3. En el proyecto: **Storage → Create Database → Upstash (Redis)** → plan gratuito → conéctala al proyecto.
   Vercel crea solo las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
4. En **Settings → Environment Variables** agrega:
   - `ADMIN_PASSWORD` = la contraseña que usará ella para entrar al panel.
5. **Deployments → ⋯ → Redeploy** (para que tome las variables).
6. Entra a `https://TU-SITIO.vercel.app/admin.html`, inicia sesión y agrega los regalos.

No hay tablas que crear ni comandos que correr.

## Cómo funciona lo de "ya no disponible"
Al elegir, se usa `HSETNX` (guardar solo si no existe), que es atómico: si dos personas eligen el mismo regalo
al mismo tiempo, solo una lo logra y la otra ve "ese regalo ya fue elegido".
Los invitados solo ven "Ya elegido"; únicamente el panel muestra el nombre de quién lo eligió.

## Pendiente de tu lado
- En `public/index.html` las etiquetas `canonical` y `og:` (vista previa al compartir por WhatsApp) siguen apuntando al sitio de Netlify.
  Cuando tengas tu dominio de Vercel, reemplázalo y sube un `og-image.jpg` a `public/`.
