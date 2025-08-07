
# Sistema de Gestión de Constancias para Webinars

Este proyecto implementa un sistema automatizado para emitir y verificar constancias de participación en webinars, utilizando Google Apps Script como backend y un frontend estático (HTML, CSS, JS) que puede ser alojado en servicios como Cloudflare Pages o GitHub Pages.

## Características

- **Registro Único:** Los participantes se registran una sola vez con su nombre y correo.
- **Emisión Automática:** Al completar el formulario de una sesión, se genera y envía automáticamente una constancia por correo.
- **Identificador Opaco:** Cada participante tiene un ID único y privado (`CRT_...`) que no expone su correo.
- **Verificación en Línea:** Cualquier persona puede verificar la validez de una constancia usando su ID.
- **Búsqueda Centralizada:** Los participantes pueden buscar todas sus constancias y ver las sesiones pendientes usando su correo.
- **Generación de PDF:** Las constancias se pueden descargar como PDF directamente desde el navegador.
- **Sin Servidor (Serverless):** Funciona completamente sobre la infraestructura de Google y un hosting estático.

---

## Guía de Despliegue y Configuración

Sigue estos pasos cuidadosamente para poner en marcha el sistema.

### Paso 1: Configurar la Hoja de Cálculo y los Formularios

1.  **Crea una nueva Hoja de Cálculo de Google.** Ponle un nombre descriptivo (ej. "Constancias Webinars 2025").
2.  **Crea el Formulario de Registro:**
    *   Dentro de la hoja, ve a `Herramientas > Crear un nuevo formulario`.
    *   Nómbralo "Registro de participantes".
    *   Añade una pregunta de **Respuesta corta** para el **"Nombre completo"** (márcala como obligatoria).
    *   La pregunta de correo electrónico se añade por defecto. En la pestaña `Configuración` del formulario, asegúrate de que "Recopilar direcciones de correo electrónico" esté activado y **limita a 1 respuesta**.
    *   Las respuestas de este formulario se guardarán en una pestaña llamada "Respuestas de formulario 1". **Renómbrala a `Perfil`** (o al valor que uses en la variable `PROFILE_SHEET_NAME`).
3.  **Crea el Formulario para la Primera Sesión:**
    *   Crea otro formulario de Google (puede ser independiente).
    *   Ponle un título que identifique la sesión (ej. "Comunicación Popular 2025-08-01").
    *   Añade las preguntas que necesites. Si quieres una evaluación, crea un **Cuestionario** en la `Configuración` del formulario para que Google calcule el puntaje.
    *   **Importante:** No necesitas preguntar el nombre. Solo asegúrate de que la recopilación de correos esté activada.
    *   Vincula este formulario a la misma hoja de cálculo: En la pestaña `Respuestas` del formulario, haz clic en los tres puntos y selecciona "Seleccionar destino de las respuestas". Elige "Hoja de cálculo existente" y busca la que creaste en el paso 1.
    *   Google creará una nueva pestaña en tu hoja. **El nombre de esta pestaña debe coincidir exactamente con el título de la sesión** que usarás en la configuración del script.

### Paso 2: Configurar el Script de Apps Script

1.  **Abre el Editor de Scripts:** En tu hoja de cálculo, ve a `Extensiones > Apps Script`.
2.  **Pega el Código:** Borra el contenido por defecto y pega el código completo de `gas/code.gs`.
3.  **Configura las Variables:**
    *   Edita las constantes en la parte superior del archivo `code.gs`:
        *   `VERIFY_BASE`: **Déjala como está por ahora.** La actualizarás después de desplegar el frontend.
        *   `REGISTRATION_URL`: Pega la URL pública del formulario de registro que creaste.
        *   `PROFILE_SHEET_NAME`: Asegúrate de que sea `Perfil` o el nombre que le diste a la pestaña de registros.
        *   `SESSIONS`: Si quieres, añade las sesiones programadas con su título (debe coincidir con el nombre de la pestaña de la hoja) y la URL pública de su formulario.
4.  **Guarda el proyecto** (icono de disquete).

### Paso 3: Desplegar la Web App (API)

1.  En el editor de Apps Script, haz clic en **Implementar > Nueva implementación**.
2.  Selecciona el tipo de implementación haciendo clic en el icono de engranaje y elige **Aplicación web**.
3.  En la configuración:
    *   **Descripción:** "API para Sistema de Constancias v1".
    *   **Ejecutar como:** "Yo".
    *   **Quién tiene acceso:** **Cualquiera**.
4.  Haz clic en **Implementar**. Google te pedirá que autorices los permisos. Revísalos y acéptalos.
5.  Al final, se te proporcionará una **URL de la aplicación web**. Cópiala. Esta es tu `SCRIPT_URL`.

### Paso 4: Configurar y Desplegar el Frontend

1.  **Actualiza los Placeholders en los Archivos HTML:**
    *   Abre `index.html`, `verificar.html`, `cert.html` y `buscar.html`.
    *   Busca `TU_SCRIPT_ID` y reemplázalo por la URL de la aplicación web que copiaste en el paso anterior.
    *   En `index.html` y `buscar.html`, busca `TU_FORMULARIO_DE_REGISTRO` y reemplázalo por la URL del formulario de registro.
2.  **Reemplaza el Logo:** Sustituye `assets/logo.png` por el logo de tu organización.
3.  **Publica los Archivos:**
    *   Sube todos los archivos (`index.html`, `verificar.html`, `cert.html`, `buscar.html` y la carpeta `assets`) a un servicio de hosting estático como [Cloudflare Pages](https://pages.cloudflare.com/) o [GitHub Pages](https://pages.github.com/).
    *   Una vez publicado, tendrás una URL pública para tu sitio (ej. `https://webinar.ejemplo.com`).

### Paso 5: Actualizar la URL de Verificación

1.  Vuelve al editor de Apps Script.
2.  Actualiza la constante `VERIFY_BASE` con la URL de tu sitio, apuntando a `verificar.html`. Ejemplo: `https://webinar.ejemplo.com/verificar.html?id=`.
3.  Guarda el script.
4.  Vuelve a **Implementar > Gestionar implementaciones**.
5.  Selecciona tu implementación, haz clic en el lápiz (Editar) y cambia la **Versión** a **Nueva versión**. Haz clic en **Implementar**.

### Paso 6: Configurar el Activador (Trigger)

1.  En el editor de Apps Script, ve a la sección **Activadores** (icono de reloj).
2.  Haz clic en **Añadir activador**.
3.  Configúralo de la siguiente manera:
    *   **Función que se debe ejecutar:** `onFormSubmit`
    *   **Implementación que se debe ejecutar:** `Principal`
    *   **Seleccionar la fuente del evento:** `Desde una hoja de cálculo`
    *   **Seleccionar el tipo de evento:** `Al enviar un formulario`
4.  Guarda el activador.

**¡El sistema ya está operativo!**

---

## Cuotas y Límites de Google Apps Script

- **Envío de correos (`MailApp.sendEmail`):** La cuota para una cuenta de Gmail gratuita es de **100 destinatarios por día**. Si esperas más de 100 participantes por día en todas tus sesiones, necesitarás una cuenta de Google Workspace (la cuota sube a 1,500).
- **Tiempo de ejecución de scripts:** Cada script tiene un límite de 6 minutos por ejecución. Este script es muy rápido, por lo que no debería ser un problema.
- **Llamadas a la API (`doGet`):** Las aplicaciones web tienen límites de uso, pero son suficientemente altos para este tipo de proyecto.

---

## Checklist de Pruebas Manuales

- [ ] **Registro:**
    - [ ] Abre el enlace de registro y envía tus datos.
    - [ ] Verifica que en la pestaña `Perfil` de la hoja de cálculo aparece tu correo, nombre y un `ID` recién generado.
- [ ] **Emisión de Constancia:**
    - [ ] Abre el formulario de una sesión y envíalo con el mismo correo.
    - [ ] Revisa tu bandeja de entrada. Deberías recibir un correo de confirmación.
    - [ ] Verifica que en la hoja de la sesión aparece una nueva fila con tus datos y el `ID`.
- [ ] **Verificación:**
    - [ ] Haz clic en el enlace de verificación del correo. La página `verificar.html` debe mostrar que la constancia es **VÁLIDA** y mostrar los datos correctos.
    - [ ] Intenta verificar con un ID falso. Debe mostrar **NO VÁLIDA**.
- [ ] **Constancia y PDF:**
    - [ ] Haz clic en el enlace de la constancia en el correo.
    - [ ] La página `cert.html` debe mostrar tu nombre, la sesión, fecha y un código QR.
    - [ ] Haz clic en "Descargar PDF". El archivo debe generarse correctamente.
- [ ] **Búsqueda:**
    - [ ] Ve a `buscar.html` e introduce tu correo.
    - [ ] La página debe mostrar la constancia que acabas de obtener y las sesiones pendientes (si las configuraste).
    - [ ] Prueba a buscar con un correo no registrado. Debe invitarte a registrarte.
- [ ] **Responsividad:**
    - [ ] Abre todas las páginas en un dispositivo móvil o usando las herramientas de desarrollador del navegador para simularlo. El diseño debe adaptarse correctamente.
