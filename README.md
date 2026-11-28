# Invitación de boda · Carlos y Alva + Mesa de regalos

100 % gratis: Vercel (plan Hobby) + Upstash Redis (plan gratuito).

- `public/index.html` → la invitación (calendario, cuenta regresiva, confirmación por WhatsApp, vestimenta y mesa de regalos)
- `public/admin.html` → panel privado (`tu-sitio.vercel.app/admin.html`): agrega regalos y ve quién eligió cada uno
- `public/og-image.jpg` → imagen que aparece al compartir el link (WhatsApp, Facebook)
- `api/` y `lib/` → funciones de Vercel y acceso a la base de datos

## Cosas que debes completar
1. **Ubicación**: en `public/index.html`, busca `var MAPS_URL = '';` y pega entre las comillas el link de Google Maps de la iglesia. Mientras esté vacío, el botón avisa "muy pronto compartiremos la ubicación".
2. **Dominio**: en `public/index.html` reemplaza `TU-DOMINIO.vercel.app` (2 veces) por el dominio real, para que se vea la foto al compartir por WhatsApp.
3. **Música**: `public/assets/musica.mp3` es la canción de fondo. Reemplázala por la que quieras (mismo nombre de archivo).

## Variables en Vercel
- `ADMIN_PASSWORD` = contraseña para entrar al panel.
- La base de datos Upstash Redis crea sus variables al conectarla (`KV_REST_API_URL`/`KV_REST_API_TOKEN`, o con otro prefijo; el código lo detecta solo).

Después de cambiar variables: Deployments → ⋯ → Redeploy.

## Cómo funciona la mesa de regalos
Los regalos **siempre siguen disponibles**: varios invitados pueden elegir el mismo. Cada elección se guarda con el nombre;
si la misma persona elige el mismo regalo dos veces, no se duplica. Los invitados no ven quién eligió qué; el panel muestra
todos los nombres de cada regalo y permite quitar una elección con el botón "Quitar".
