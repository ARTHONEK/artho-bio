import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const b64Config = process.env.FIREBASE_CONFIG_B64;
    if (b64Config) {
      const serviceAccount = JSON.parse(
        Buffer.from(b64Config, 'base64').toString('utf-8')
      );
      const dbUrl = process.env.FIREBASE_DATABASE_URL || 
                    serviceAccount.databaseURL || 
                    `https://${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`;

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: dbUrl
      });
    }
  } catch (error) {
    console.error('Firebase Admin Init Error in send-to-tg:', error);
  }
}

function escapeTelegramHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Проверка токена Cloudflare Turnstile на сервере (клиенту доверять нельзя)
async function verifyTurnstile(secret, token, ip) {
  if (typeof token !== 'string' || !token || token.length > 2048) {
    return false;
  }

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set('remoteip', ip);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(8000)
    });

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Turnstile verify error:', error);
    return false;
  }
}

export default async function handler(req, res) {

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, contact = '', message, website = '', fillTime } = req.body || {};

  const cleanName = String(name || '').trim();
  const cleanContact = String(contact || '').trim();
  const cleanMessage = String(message || '').trim();

  // --- Антиспам ---
  // 1) Honeypot: человек не видит это поле, а боты его заполняют.
  //    Делаем вид, что всё хорошо, чтобы бот не понял, что его раскусили.
  if (website) {
    return res.status(200).json({ success: true, message: 'Message sent successfully!' });
  }

  // 2) Время заполнения: сайт присылает fillTime. Прямые запросы в API
  //    (без него) и слишком быстрые отправки отклоняем.
  const filledIn = Number(fillTime);
  if (!Number.isFinite(filledIn) || filledIn < 3000) {
    return res.status(400).json({
      error: 'TooFast',
      message: 'Слишком быстро или страница устарела: обновите страницу и попробуйте снова. / Too fast or outdated page: reload and try again.'
    });
  }

  if (!cleanName || !cleanMessage) {
    return res.status(400).json({ error: 'Name and message are required' });
  }

  if (cleanName.length > 50) {
    return res.status(400).json({ error: 'Name is too long' });
  }

  if (cleanContact.length > 100) {
    return res.status(400).json({ error: 'Contact is too long' });
  }

  if (cleanMessage.length > 2000) {
    return res.status(400).json({ error: 'Message is too long' });
  }

  // Ссылки в имени и сообщении (клиент покажет t.link_error)
  const urlPattern = /(https?:\/\/|www\.|\bt\.me\/|\btelegram\.me\/|\bwa\.me\/|tg:\/\/)/i;
  if (urlPattern.test(cleanName) || urlPattern.test(cleanMessage)) {
    return res.status(400).json({ error: 'Forbidden content' });
  }

  // Номера телефонов в тексте: типичный спам. Для контактов есть отдельное поле
  const phonePattern = /(?:\+?\d[\s\-().]*){10,}/;
  if (phonePattern.test(cleanName) || phonePattern.test(cleanMessage)) {
    return res.status(400).json({
      error: 'Phone in message',
      message: 'Контакты укажите в отдельном поле (галочка ниже). / Please put contacts in the contacts field.'
    });
  }

  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = typeof forwardedFor === 'string'
    ? forwardedFor.split(',')[0].trim()
    : req.socket.remoteAddress || '127.0.0.1';

  const sanitizedIp = ip.replace(/[.:#$[\]]/g, '_');
  const now = Date.now();
  const cooldownMs = 150 * 1000;

  // --- Капча (Cloudflare Turnstile) ---
  // Если TURNSTILE_SECRET_KEY не задан в Vercel, проверка отключена
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (turnstileSecret) {
    const captchaOk = await verifyTurnstile(turnstileSecret, req.body?.turnstileToken, ip);
    if (!captchaOk) {
      return res.status(400).json({
        error: 'CaptchaFailed',
        message: 'Проверка не пройдена. Обновите страницу и попробуйте снова. / Verification failed. Reload the page and try again.'
      });
    }
  } else {
    console.warn('TURNSTILE_SECRET_KEY is not set: captcha check is disabled');
  }

  try {
    if (admin.apps.length) {
      const db = admin.database();
      const ipRef = db.ref(`rate_limits/${sanitizedIp}`);

      // Атомарная проверка: параллельные запросы не обойдут лимит
      const result = await ipRef.transaction((current) => {
        if (current && now - (current.lastSend || 0) < cooldownMs) {
          return; // abort: лимит ещё действует
        }
        return { lastSend: now };
      });

      if (!result.committed) {
        const lastTime = result.snapshot.val()?.lastSend || now;
        const retryAfter = Math.max(1, Math.ceil((cooldownMs - (now - lastTime)) / 1000));
        return res.status(429).json({
          error: 'RateLimitExceeded',
          retryAfter,
          message: `Подождите еще ${retryAfter} сек.`
        });
      }
    }

    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.MY_TELEGRAM_ID;

    if (!token || !chatId) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const safeName = escapeTelegramHtml(cleanName);
    const safeContact = escapeTelegramHtml(cleanContact);
    const safeMessage = escapeTelegramHtml(cleanMessage);

    const contactBlock = safeContact ? `\n📎 <b>Контакт:</b> ${safeContact}` : '';
    // Специальная плашка, по которой бот поймет, что это сообщение с сайта
    const text = `📬 <b>Новое сообщение с сайта!</b>\n\n` +
                 `👤 <b>Имя:</b> ${safeName}${contactBlock}\n` +
                 `💬 <b>Сообщение:</b>\n${safeMessage}`;

    const tgResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML'
      })
    });

    if (!tgResponse.ok) {
      const tgError = await tgResponse.json();
      throw new Error(tgError.description || 'Failed to send message via Telegram');
    }

    return res.status(200).json({
      success: true,
      message: 'Message sent successfully!'
    });
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
