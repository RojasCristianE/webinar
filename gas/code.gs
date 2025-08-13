/**
 * @fileoverview Script para la gestión automatizada de constancias de webinars.
 * @version 1.0.0
 */

// --- Configuración Esencial (EDITAR ESTOS VALORES) ---

/**
 * URL base para la página de verificación.
 * Reemplazar con la URL de tu sitio estático (Cloudflare/GitHub Pages).
 * @type {string}
 */
const VERIFY_BASE = 'https://webinar.jscomunicadores.com/index.html?id=';

/**
 * URL pública del formulario de Google para el registro de participantes.
 * @type {string}
 */
const REGISTRATION_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSf-e1aINSX51u65wXH--vYvIiGNQWcFCE76Zh6gBvzz-6DOfQ/viewform?usp=header';

/**
 * Nombre de la hoja de cálculo que contiene los perfiles de los participantes.
 * @type {string}
 */
const PROFILE_SHEET_NAME = 'profiles';

/**
 * Lista opcional de sesiones programadas. Útil para que el frontend
 * sugiera a los usuarios qué formularios les falta por completar.
 * @type {Array<{title: string, formUrl: string}>}
 */
const SESSIONS = [
  { title: 'Comunicación Popular 2025-08-01', formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSdrH1BAeb7MNJj1FIGctMlYUZ-ALCr0eZoQpXXmoKiGW67-aA/viewform' },
  // { title: 'Planificación Estratégica 2025-08-08', formUrl: 'https://forms.gle/...' }
];

// --- Constantes del Script (NO EDITAR) ---
const SCRIPT_VERSION = '1.0.0';
const ID_PREFIX = 'CRT_';
const ID_LENGTH = 16;
const EMAIL_HEADER = 'Dirección de correo electrónico';
const NAME_HEADER = 'Nombre';
const ID_HEADER = 'ID';
const TIMESTAMP_HEADER = 'Marca temporal';
const SCORE_REGEX = /^Puntuación$/i;

/**
 * Función principal que se activa al enviar un formulario vinculado a la hoja de cálculo.
 * @param {GoogleAppsScript.Events.SheetsOnFormSubmit} e - Objeto del evento.
 */
function onFormSubmit(e) {
  const sheet = e.range.getSheet();
  const sheetName = sheet.getName();
  const values = e.namedValues;
  const email = normalizeEmail(values[EMAIL_HEADER][0]);

  if (!email) return;

  if (sheetName === PROFILE_SHEET_NAME) {
    handleProfileRegistration(sheet, e.range.getRow(), email);
  } else {
    handleSessionSubmission(sheet, e.range.getRow(), email, values);
  }
}

/**
 * Maneja el registro en la hoja "Perfil".
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Hoja de Perfil.
 * @param {number} row - Fila del nuevo registro.
 * @param {string} email - Correo normalizado.
 */
function handleProfileRegistration(sheet, row, email) {
  const id = generateId(email);
  const headers = getHeaders(sheet);
  const idCol = headers.indexOf(ID_HEADER) + 1;

  if (idCol > 0) {
    const idCell = sheet.getRange(row, idCol);
    if (!idCell.getValue()) { // First-write wins
      idCell.setValue(id);
    }
  }
}

/**
 * Maneja el envío de un formulario de sesión.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Hoja de la sesión.
 * @param {number} row - Fila del nuevo registro.
 * @param {string} email - Correo normalizado.
 * @param {Object} values - Valores del formulario.
 */
function handleSessionSubmission(sheet, row, email, values) {
  const id = generateId(email);
  const headers = getHeaders(sheet);

  // 1. Escribir ID
  let idCol = headers.indexOf(ID_HEADER) + 1;
  if (idCol === 0) {
    sheet.getRange(1, headers.length + 1).setValue(ID_HEADER);
    idCol = headers.length + 1;
  }
  sheet.getRange(row, idCol).setValue(id);

  // 2. Obtener datos
  const profile = getProfileByEmail(email);
  const sessionTitle = sheet.getName();
  const sessionDate = formatDate(values[TIMESTAMP_HEADER][0]);
  const score = extractScore(values);

  // 3. Enviar correo de confirmación
  sendConfirmationEmail(email, profile, sessionTitle, sessionDate, id, score);
}

/**
 * Normaliza un correo electrónico.
 * @param {string} email - Correo a normalizar.
 * @return {string} Correo normalizado.
 */
function normalizeEmail(email) {
  return email ? email.trim().toLowerCase() : '';
}

/**
 * Genera un ID opaco a partir de un correo electrónico.
 * @param {string} email - Correo normalizado.
 * @return {string} ID generado.
 */
function generateId(email) {
  const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, email);
  const hex = hash.map(byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
  return ID_PREFIX + hex.substring(0, ID_LENGTH).toUpperCase();
}

/**
 * Obtiene los encabezados de una hoja.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - La hoja.
 * @return {string[]} Lista de encabezados.
 */
function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

/**
 * Busca el perfil de un usuario por su correo.
 * @param {string} email - Correo normalizado.
 * @return {{name: string, id: string}|null} - Perfil o null si no se encuentra.
 */
function getProfileByEmail(email) {
  const profileSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PROFILE_SHEET_NAME);
  if (!profileSheet) return null;

  const data = profileSheet.getDataRange().getValues();
  const headers = data.shift();
  const emailCol = headers.indexOf(EMAIL_HEADER);
  const nameCol = headers.indexOf(NAME_HEADER);
  const idCol = headers.indexOf(ID_HEADER);

  if (emailCol === -1 || nameCol === -1 || idCol === -1) return null;

  for (const row of data) {
    if (normalizeEmail(row[emailCol]) === email) {
      return { name: row[nameCol], id: row[idCol] };
    }
  }
  return null;
}

/**
 * Formatea una fecha a 'yyyy-MM-dd'.
 * @param {string} timestamp - La fecha a formatear.
 * @return {string} Fecha formateada.
 */
function formatDate(timestamp) {
  return Utilities.formatDate(new Date(timestamp), 'America/Managua', 'yyyy-MM-dd');
}

/**
 * Extrae el puntaje de los valores del formulario si existe.
 * @param {Object} values - Valores del formulario.
 * @return {{raw: string, total: number, pct: number}|null} - El puntaje o null.
 */
function extractScore(values) {
  const scoreKey = Object.keys(values).find(k => SCORE_REGEX.test(k));
  if (!scoreKey || !values[scoreKey][0]) return null;

  const scoreValue = values[scoreKey][0];
  if (typeof scoreValue !== 'string') return null; // Ensure it's a string before splitting

  const parts = scoreValue.split('/').map(s => parseFloat(s.trim()));
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1]) || parts[1] === 0) {
    return null;
  }

  return {
    raw: `${parts[0]} / ${parts[1]}`,
    total: parts[1],
    pct: (parts[0] / parts[1]) * 100
  };
}

/**
 * Envía el correo de confirmación al participante.
 * @param {string} email - Correo del destinatario.
 * @param {{name: string}} profile - Perfil del usuario.
 * @param {string} sessionTitle - Título de la sesión.
 * @param {string} sessionDate - Fecha de la sesión.
 * @param {string} id - ID de la constancia.
 * @param {Object} score - Puntaje obtenido.
 */
function sendConfirmationEmail(email, profile, sessionTitle, sessionDate, id, score) {
  const subject = `Tu constancia de participación: ${sessionTitle}`;
  const name = profile ? profile.name : 'participante';
  let body = `
    <p>Hola ${name},</p>
    <p>Gracias por participar en la sesión "<strong>${sessionTitle}</strong>" el día ${sessionDate}.</p>
    <p>Tu constancia ha sido emitida automáticamente. Puedes consultarla y descargarla desde los siguientes enlaces:</p>
    <ul>
      <li><strong>Ver y descargar tu constancia:</strong> <a href="${VERIFY_BASE.replace('index.html?id=', 'index.html?cert_id=')}${id}">Enlace a la constancia</a></li>
      <li><strong>Verificar la validez:</strong> <a href="${VERIFY_BASE}${id}">Enlace de verificación</a></li>
    </ul>
  `;

  if (score) {
    body += `<p>Tu puntaje en la evaluación fue: <strong>${score.raw}</strong> (${score.pct.toFixed(2)}%).</p>`;
  }

  body += `
    <p>Saludos cordiales,<br>El equipo organizador.</p>
    <p><small>ID de constancia: ${id}</small></p>
  `;

  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: body,
    name: 'Sistema de Constancias'
  });
}

/**
 * Maneja las solicitudes GET a la Web App (API JSON/JSONP).
 * @param {GoogleAppsScript.Events.DoGet} e - Objeto del evento.
 * @return {GoogleAppsScript.Content.TextOutput} - Respuesta JSON o JSONP.
 */
function doGet(e) {
  const params = e.parameter;
  let result = {};

  try {
    if (params.id) {
      result = getCertificateById(params.id);
    } else if (params.id_hash) {
      // Esta opción es conceptualmente similar a `email` pero usando el hash.
      // Se asume que el front puede generar el hash para la búsqueda.
      result = getDataByIdHash(params.id_hash);
    } else {
      result = { ok: false, error: 'Parámetro no válido.' };
    }
  } catch (error) {
    result = { ok: false, error: error.message };
  }

  const output = JSON.stringify(result);
  const callback = params.callback;

  if (callback) {
    return ContentService.createTextOutput(`${callback}(${output})`).setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    return ContentService.createTextOutput(output).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Obtiene los datos de una constancia por su ID.
 * @param {string} id - El ID de la constancia.
 * @return {Object} Datos de la constancia.
 */
function getCertificateById(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  
  for (const sheet of sheets) {
    const sheetName = sheet.getName();
    if (sheetName === PROFILE_SHEET_NAME) continue;

    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    const idCol = headers.indexOf(ID_HEADER);
    const emailCol = headers.indexOf(EMAIL_HEADER);
    const tsCol = headers.indexOf(TIMESTAMP_HEADER);
    const scoreKey = headers.find(h => SCORE_REGEX.test(h)) || '';
    const scoreCol = headers.indexOf(scoreKey);

    if (idCol === -1) continue;

    for (const row of data) {
      if (row[idCol] === id) {
        const email = normalizeEmail(row[emailCol]);
        const profile = getProfileByEmail(email);
        const score = extractScore({ [scoreKey]: [row[scoreCol]] });

        return {
          ok: true,
          valid: true,
          ID: id,
          nombre: profile ? profile.name : null,
          SESSION_TITLE: sheetName,
          SESSION_DATE: formatDate(row[tsCol]),
          score_raw: score ? score.raw : null,
          score_total: score ? score.total : null,
          score_pct: score ? score.pct : null,
          verify_url: `${VERIFY_BASE}${id}`,
          version: SCRIPT_VERSION
        };
      }
    }
  }
  return { ok: true, valid: false };
}



/**
 * Obtiene los datos de un usuario por el hash de su ID.
 * @param {string} idHash - El ID completo.
 * @return {Object} Datos del usuario.
 */
function getDataByIdHash(idHash) {
    const profileSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PROFILE_SHEET_NAME);
    if (!profileSheet) return { ok: true, registered: false, items: [], sessions: SESSIONS };

    const data = profileSheet.getDataRange().getValues();
    const headers = data.shift();
    const idCol = headers.indexOf(ID_HEADER);

    if (idCol === -1) return { ok: true, registered: false, items: [], sessions: SESSIONS };

    let found = false;
    for (const row of data) {
        if (row[idCol] === idHash) {
            found = true;
            break;
        }
    }

    if (!found) {
        return { ok: true, registered: false, items: [], sessions: SESSIONS };
    }

    return {
        ok: true,
        registered: true,
        items: findUserCertificates(idHash),
        sessions: SESSIONS
    };
}


/**
 * Busca todas las constancias de un usuario por su ID.
 * @param {string} id - El ID del usuario.
 * @return {Array<Object>} Lista de constancias.
 */
function findUserCertificates(id) {
  const certificates = [];
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  for (const sheet of sheets) {
    const sheetName = sheet.getName();
    if (sheetName === PROFILE_SHEET_NAME) continue;

    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    const idCol = headers.indexOf(ID_HEADER);
    const tsCol = headers.indexOf(TIMESTAMP_HEADER);

    if (idCol === -1) continue;

    for (const row of data) {
      // El ID de la fila es el ID del usuario para esa sesión específica.
      // Necesitamos generar el ID de la constancia a partir del correo de esa fila.
      const emailCol = headers.indexOf(EMAIL_HEADER);
      const email = normalizeEmail(row[emailCol]);
      const certificateId = generateId(email);
      
      // Comparamos el ID del usuario (buscado) con el ID generado para el correo de la fila
      if (generateId(email) === id) {
        certificates.push({
          id: row[idCol], // Este es el ID de la constancia específica
          title: sheetName,
          date: formatDate(row[tsCol]),
          cert_url: VERIFY_BASE.replace('index.html?id=', 'index.html?cert_id=') + row[idCol],
          verify_url: VERIFY_BASE + row[idCol]
        });
      }
    }
  }
  return certificates;
}
