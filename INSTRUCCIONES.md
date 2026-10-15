# Formatos UGI – Roles y acceso

## Primer uso
1. Abre `login.html`. Como aún no hay usuarios, aparece **Configuración inicial**: crea la cuenta del Administrador.
2. Entra al **Panel** → **Usuarios** → **Crear usuario** para dar de alta a Desarrolladores, Supervisores u otros Administradores.
   La contraseña se genera (o la escribes) y se muestra **una sola vez**: cópiala y entrégala a la persona.
3. Los **Usuarios** comunes se registran solos en `registro.html` (usuario, correo, contraseña y datos personales).

## Qué ve cada rol
| Rol | Acceso |
|---|---|
| Administrador | Todo: Panel, Formatos, Solicitudes, Etapas (puede cambiarlas) y Usuarios (crear, cambiar rol, desactivar, nueva contraseña, eliminar) |
| Desarrollador | Solo **Solicitudes** (lista de todas y detalle en solo lectura) |
| Supervisor | Solo **Etapas de desarrollo** (en qué etapa va cada solicitud) |
| Usuario | Solo los dos formularios (Requerimiento y Cambios) y **sus propias** solicitudes |

Etapas: Recibida → En análisis → En desarrollo → En pruebas QA → Implementada (o Rechazada).

## Archivos nuevos
`login.html`, `registro.html`, `panel.html`, `solicitudes.html`, `etapas.html`, `usuarios.html`,
`js/auth.js` (usuarios, roles, sesión, menú), `js/login.js`, `js/registro.js`, `js/panel.js`, `js/solicitudes.js`,
`js/etapas.js`, `js/usuarios.js`, `css/app.css`. Se modificaron `index.html`, `requerimiento.html`, `cambios.html`,
`js/common.js`, `js/index.js`, `js/requerimiento.js` y `js/cambios.js`.

## Limitación importante
Todo se guarda en el `localStorage` del navegador (igual que antes). Por eso:
- Cada computadora tiene **sus propios** usuarios y solicitudes; no se comparten entre equipos.
- El control de roles protege la interfaz pero **no es seguridad real**: quien abra la consola del navegador puede saltárselo.

Para uso real con varias personas hace falta un servidor con base de datos que valide el inicio de sesión y los permisos
(la interfaz de este proyecto se puede conectar a esa API cambiando las funciones de `js/auth.js` y `U.list/U.upsert` en `js/common.js`).
