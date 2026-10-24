// api/_lib/pagos.js
// Módulo compartido para verificación de pagos en Mercado Pago,
// generación idempotente de códigos LTD-XXXXX en Redis y envío de correo de bienvenida.

const crypto = require('crypto');
const tls = require('tls');

const PRECIO_MINIMO_MXN = 95; // Precio oficial $100 MXN (margen por redondeos)
const LIMITE_DISPOSITIVOS_DEFAULT = 3;
const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin 0, O, 1, I para evitar confusión

// Genera un ID de dispositivo único a partir de cabeceras de la petición.
function generarIdDispositivo(req) {
  if (!req || !req.headers) return '';
  const userAgent = req.headers['user-agent'] || '';
  const acceptLang = req.headers['accept-language'] || '';
  const cfIp =
    req.headers['cf-connecting-ip'] ||
    (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : '') ||
    '';
  const raw = `${userAgent}|${acceptLang}|${cfIp}`;
  return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16);
}

// Firma HMAC-SHA256 para la cookie donor_token.
function firmarCookie(codigoHash, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(codigoHash)
    .digest('hex');
}

// Construye la cabecera Set-Cookie para donor_token (10 años de vigencia).
function crearCookieHeader(codigoNormalizado, secret) {
  const firma = firmarCookie(codigoNormalizado, secret);
  const cookieValor = `${codigoNormalizado}.${firma}`;
  return `donor_token=${cookieValor}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=315360000`;
}

// Valida formato básico de correo electrónico.
function esEmailValido(email) {
  if (!email || typeof email !== 'string') return false;
  const limpio = email.trim();
  if (limpio.length < 5 || limpio.length > 180) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(limpio);
}

// Consulta un pago directamente en la API oficial de Mercado Pago.
async function consultarPagoMercadoPago(paymentId) {
  const idLimpio = String(paymentId || '').trim();
  if (!/^\d{5,18}$/.test(idLimpio)) {
    return { ok: false, error: 'ID de pago inválido.' };
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return { ok: false, sinConfigurar: true, error: 'MP_ACCESS_TOKEN no configurada en el servidor.' };
  }

  const resp = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(idLimpio)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!resp.ok) {
    return {
      ok: false,
      statusHttp: resp.status,
      error: `No se encontró el pago ${idLimpio} en Mercado Pago.`
    };
  }

  const data = await resp.json();
  const status = data.status || '';
  const monto = Number(data.transaction_amount || 0);
  const moneda = data.currency_id || 'MXN';

  const esAprobado = status === 'approved';
  const montoValido = monto >= PRECIO_MINIMO_MXN && (moneda === 'MXN' || !moneda);

  return {
    ok: true,
    esAprobado,
    montoValido,
    esValido: esAprobado && montoValido,
    status,
    monto,
    moneda,
    pago: data
  };
}

// Genera un código aleatorio con formato LTD-XXXXX verificando que no exista en Redis.
async function generarCodigoUnico(redisClient) {
  for (let intento = 0; intento < 12; intento++) {
    let sufijo = '';
    for (let i = 0; i < 5; i++) {
      const idx = crypto.randomInt(0, ALFABETO_CODIGO.length);
      sufijo += ALFABETO_CODIGO[idx];
    }
    const candidato = `LTD-${sufijo}`;
    const existe = await redisClient.exists(`donor:code:${candidato}`);
    if (!existe) {
      return candidato;
    }
  }
  // Fallback con 7 caracteres si hubiera colisión
  let sufijoLargo = '';
  for (let i = 0; i < 7; i++) {
    sufijoLargo += ALFABETO_CODIGO[crypto.randomInt(0, ALFABETO_CODIGO.length)];
  }
  return `LTD-${sufijoLargo}`;
}

// Construye la plantilla HTML del correo con estética editorial de Libractiva.
function construirHtmlCorreo({ codigo, paymentId, nombre }) {
  const saludo = nombre ? `Hola, <strong>${ escapeHtml(nombre) }</strong>:` : 'Hola, lector(a):';
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Tu Código de Acceso Lifetime — Libractiva</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f1e7;font-family:'Georgia',serif;color:#2c1810;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f6f1e7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#fcfbf7;border:1px solid #dccbb1;border-radius:14px;overflow:hidden;box-shadow:0 8px 24px rgba(44,24,16,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#121c19 0%,#1f332d 100%);padding:28px 32px;text-align:center;border-bottom:3px solid #b8892a;">
              <div style="color:#d4a359;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin-bottom:6px;">✦ Biblioteca Digital Inteligente ✦</div>
              <h1 style="margin:0;color:#fcfbf7;font-size:28px;font-weight:700;letter-spacing:0.5px;">Libractiva</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 24px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#2c1810;">
              <p style="margin:0 0 16px 0;font-size:16px;">${saludo}</p>
              <p style="margin:0 0 20px 0;">¡Gracias por adquirir tu <strong>Acceso Lifetime</strong> en <strong>Libractiva</strong>! Tu pago ha sido confirmado y tu código personal de acceso permanente ya está activo:</p>

              <div style="background-color:#f3ead8;border:2px dashed #b8892a;border-radius:12px;padding:22px 16px;text-align:center;margin:24px 0;">
                <div style="font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#7a5a2b;margin-bottom:8px;">Tu Código de Acceso Lifetime</div>
                <div style="font-family:'Courier New',Courier,monospace;font-size:30px;font-weight:700;letter-spacing:3px;color:#121c19;user-select:all;">${escapeHtml(codigo)}</div>
                <div style="font-size:12px;color:#6e5a4f;margin-top:8px;">Válido simultáneamente en hasta <strong>3 dispositivos</strong> (PC, tablet o celular)</div>
              </div>

              <h3 style="margin:24px 0 10px 0;font-size:16px;color:#121c19;">¿Cómo usar tu código en tus dispositivos?</h3>
              <ol style="margin:0 0 24px 0;padding-left:20px;color:#3d291e;">
                <li style="margin-bottom:8px;">Entra a <a href="https://biblioteca-digital-eight.vercel.app" style="color:#8c6218;font-weight:600;text-decoration:underline;">Libractiva</a> desde tu navegador.</li>
                <li style="margin-bottom:8px;">Haz clic en el botón <strong>«Activar Acceso»</strong> en la parte superior.</li>
                <li style="margin-bottom:8px;">Escribe tu código <strong>${escapeHtml(codigo)}</strong> y pulsa <strong>«Verificar código»</strong>.</li>
              </ol>

              <div style="text-align:center;margin:28px 0 18px 0;">
                <a href="https://biblioteca-digital-eight.vercel.app" style="display:inline-block;background:linear-gradient(135deg,#d4a359 0%,#9e6f21 100%);color:#121c19;font-weight:700;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:15px;">Ir a Libractiva y comenzar a leer</a>
              </div>

              <p style="margin:20px 0 0 0;font-size:13px;color:#6e5a4f;border-top:1px solid #e6dec8;padding-top:16px;">
                Folio de operación Mercado Pago: <strong>#${escapeHtml(String(paymentId || ''))}</strong><br/>
                Guarda este correo como respaldo. Si tienes cualquier duda, responde directamente a este mensaje (<a href="mailto:contacto.libractiva@gmail.com" style="color:#8c6218;">contacto.libractiva@gmail.com</a>) o escríbenos por WhatsApp al <strong>+52 481 128 9106</strong>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Cliente SMTP sobre TLS nativo (puerto 465) como respaldo si nodemailer no está instalado.
function enviarCorreoSmtpNativo({ host, port, user, pass, from, to, subject, html }) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host, port, servername: host, timeout: 10000 });
    let buffer = '';
    let step = 0;

    const commands = [
      `EHLO libractiva.local`,
      `AUTH LOGIN`,
      Buffer.from(user, 'utf8').toString('base64'),
      Buffer.from(pass, 'utf8').toString('base64'),
      `MAIL FROM:<${user}>`,
      `RCPT TO:<${to}>`,
      `DATA`
    ];

    const subjectB64 = Buffer.from(subject, 'utf8').toString('base64');
    const htmlB64 = Buffer.from(html, 'utf8').toString('base64').replace(/(.{76})/g, '$1\r\n');
    const mimeBody = [
      `From: ${from}`,
      `To: <${to}>`,
      `Subject: =?UTF-8?B?${subjectB64}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      htmlB64,
      `.`,
      `QUIT`
    ].join('\r\n');

    socket.setEncoding('utf8');
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('Timeout en conexión SMTP'));
    });
    socket.on('error', err => reject(err));

    socket.on('data', chunk => {
      buffer += chunk;
      const lines = buffer.split('\r\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line) continue;
        // Si es respuesta multilínea (ej. 250-...), esperar a la línea final (ej. 250 ...)
        if (line.length >= 4 && line[3] === '-') continue;
        const code = parseInt(line.substring(0, 3), 10);
        if (code >= 400) {
          socket.destroy();
          return reject(new Error(`Error SMTP (${code}): ${line}`));
        }

        if (step < commands.length) {
          const cmd = commands[step++];
          socket.write(cmd + '\r\n');
        } else if (step === commands.length) {
          step++;
          socket.write(mimeBody + '\r\n');
        } else {
          socket.end();
          return resolve({ ok: true });
        }
      }
    });
  });
}

// Envía el correo con el código LTD-XXXXX usando Gmail SMTP (nodemailer o TLS nativo).
async function enviarCorreoCodigo({ destinatario, codigo, paymentId, nombre }) {
  if (!esEmailValido(destinatario)) {
    return { enviado: false, razon: 'email_invalido' };
  }

  const user = (process.env.GMAIL_USER || 'contacto.libractiva@gmail.com').trim();
  const pass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');

  if (!pass) {
    console.warn('[pagos] GMAIL_APP_PASSWORD no configurada; se omite envío de correo.');
    return { enviado: false, razon: 'sin_credenciales_smtp' };
  }

  const subject = `Tu Código de Acceso Lifetime (${codigo}) — Libractiva`;
  const html = construirHtmlCorreo({ codigo, paymentId, nombre });
  const from = `"Libractiva" <${user}>`;
  const to = destinatario.trim();

  try {
    let nodemailer = null;
    try {
      nodemailer = require('nodemailer');
    } catch (_) {
      nodemailer = null;
    }

    if (nodemailer) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user, pass }
      });
      await transporter.sendMail({ from, to, subject, html });
    } else {
      await enviarCorreoSmtpNativo({
        host: 'smtp.gmail.com',
        port: 465,
        user,
        pass,
        from,
        to,
        subject,
        html
      });
    }

    return { enviado: true };
  } catch (err) {
    console.error('[pagos] Error al enviar correo:', err.message);
    return { enviado: false, razon: err.message };
  }
}

// Extrae el mejor correo disponible del objeto de pago de Mercado Pago o del override.
function extraerEmailComprador(paymentData, emailOverride) {
  if (esEmailValido(emailOverride)) return emailOverride.trim().toLowerCase();
  if (esEmailValido(paymentData?.external_reference)) return paymentData.external_reference.trim().toLowerCase();
  if (esEmailValido(paymentData?.metadata?.email_comprador)) return paymentData.metadata.email_comprador.trim().toLowerCase();
  if (esEmailValido(paymentData?.payer?.email)) return paymentData.payer.email.trim().toLowerCase();
  return '';
}

function extraerNombreComprador(paymentData) {
  const first = paymentData?.payer?.first_name || '';
  const last = paymentData?.payer?.last_name || '';
  return `${first} ${last}`.trim();
}

// Procesa un pago aprobado de forma 100% idempotente en Redis.
// Garantiza que un mismo paymentId siempre reciba el mismo código LTD-XXXXX.
async function procesarPagoAprobado(redisClient, paymentData, opciones = {}) {
  const paymentId = String(paymentData.id).trim();
  const paymentKey = `donor:payment:${paymentId}`;
  const idDispositivo = opciones.idDispositivo || '';
  const emailComprador = extraerEmailComprador(paymentData, opciones.emailOverride);
  const nombreComprador = extraerNombreComprador(paymentData);
  const ahoraIso = new Date().toISOString();

  // 1. Verificar si este pago ya fue procesado anteriormente
  let registroPagoRaw = await redisClient.get(paymentKey);

  if (!registroPagoRaw) {
    // Generar un nuevo código e intentar adquirir el candado atómico con SET NX
    const nuevoCodigo = await generarCodigoUnico(redisClient);
    const nuevoRegistroPago = {
      codigo: nuevoCodigo,
      paymentId,
      email: emailComprador,
      nombre: nombreComprador,
      monto: paymentData.transaction_amount || 100,
      fecha: ahoraIso,
      emailEnviado: false
    };

    const bloqueado = await redisClient.set(paymentKey, JSON.stringify(nuevoRegistroPago), { NX: true });

    if (bloqueado) {
      // Ganamos la creación: guardar la clave donor:code:LTD-XXXXX
      const dispositivosIniciales = idDispositivo ? [idDispositivo] : [];
      const registroCodigo = {
        dispositivos: dispositivosIniciales,
        limite: LIMITE_DISPOSITIVOS_DEFAULT,
        origen: 'mercadopago_auto',
        paymentId,
        email: emailComprador,
        nombre: nombreComprador,
        fecha: ahoraIso
      };
      await redisClient.set(`donor:code:${nuevoCodigo}`, JSON.stringify(registroCodigo));

      // Enviar correo si tenemos email válido y no estamos en modo skipEmail
      let emailEnviado = false;
      if (emailComprador && !opciones.omitirCorreo) {
        const resMail = await enviarCorreoCodigo({
          destinatario: emailComprador,
          codigo: nuevoCodigo,
          paymentId,
          nombre: nombreComprador
        });
        emailEnviado = resMail.enviado;
        if (emailEnviado) {
          nuevoRegistroPago.emailEnviado = true;
          await redisClient.set(paymentKey, JSON.stringify(nuevoRegistroPago));
        }
      }

      return {
        codigo: nuevoCodigo,
        paymentId,
        email: emailComprador,
        emailEnviado,
        dispositivos: dispositivosIniciales.length,
        limite: LIMITE_DISPOSITIVOS_DEFAULT,
        yaExistia: false
      };
    }

    // Si otro proceso concurrente ganó el SET NX hace milisegundos, leer su registro
    registroPagoRaw = await redisClient.get(paymentKey);
  }

  // 2. El pago ya tenía un código asignado: recuperarlo y sincronizar dispositivo / correo
  const registroPago = JSON.parse(registroPagoRaw);
  const codigoAsignado = registroPago.codigo;
  const codeKey = `donor:code:${codigoAsignado}`;

  const registroCodigoRaw = await redisClient.get(codeKey);
  const registroCodigo = registroCodigoRaw
    ? JSON.parse(registroCodigoRaw)
    : {
        dispositivos: [],
        limite: LIMITE_DISPOSITIVOS_DEFAULT,
        origen: 'mercadopago_auto',
        paymentId,
        email: emailComprador || registroPago.email || '',
        nombre: nombreComprador || registroPago.nombre || '',
        fecha: registroPago.fecha || ahoraIso
      };

  const dispositivos = Array.isArray(registroCodigo.dispositivos) ? registroCodigo.dispositivos : [];
  const limite = registroCodigo.limite || LIMITE_DISPOSITIVOS_DEFAULT;
  let actualizoCodigo = false;

  if (idDispositivo && !dispositivos.includes(idDispositivo) && dispositivos.length < limite) {
    dispositivos.push(idDispositivo);
    registroCodigo.dispositivos = dispositivos;
    actualizoCodigo = true;
  }

  if (emailComprador && !registroCodigo.email) {
    registroCodigo.email = emailComprador;
    actualizoCodigo = true;
  }

  if (actualizoCodigo || !registroCodigoRaw) {
    await redisClient.set(codeKey, JSON.stringify(registroCodigo));
  }

  // Si aún no se había enviado el correo y ahora sí tenemos correo, enviarlo
  let emailEnviado = Boolean(registroPago.emailEnviado);
  const destinatarioFinal = emailComprador || registroPago.email || '';

  if (!emailEnviado && destinatarioFinal && !opciones.omitirCorreo) {
    const resMail = await enviarCorreoCodigo({
      destinatario: destinatarioFinal,
      codigo: codigoAsignado,
      paymentId,
      nombre: nombreComprador || registroPago.nombre || ''
    });
    if (resMail.enviado) {
      emailEnviado = true;
      registroPago.emailEnviado = true;
      registroPago.email = destinatarioFinal;
      await redisClient.set(paymentKey, JSON.stringify(registroPago));
    }
  }

  return {
    codigo: codigoAsignado,
    paymentId,
    email: destinatarioFinal,
    emailEnviado,
    dispositivos: dispositivos.length,
    limite,
    yaExistia: true
  };
}

module.exports = {
  PRECIO_MINIMO_MXN,
  LIMITE_DISPOSITIVOS_DEFAULT,
  generarIdDispositivo,
  firmarCookie,
  crearCookieHeader,
  esEmailValido,
  consultarPagoMercadoPago,
  generarCodigoUnico,
  construirHtmlCorreo,
  enviarCorreoCodigo,
  procesarPagoAprobado
};
