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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, contact = '', message } = req.body || {};

  const cleanName = String(name || '').trim();
  const cleanContact = String(contact || '').trim();
  const cleanMessage = String(message || '').trim();

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

  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = typeof forwardedFor === 'string'
    ? forwardedFor.split(',')[0].trim()
    : req.socket.remoteAddress || '127.0.0.1';

  const sanitizedIp = ip.replace(/[.:#$[\]]/g, '_');
  const now = Date.now();
  const cooldownMs = 150 * 1000;

  try {
    if (admin.apps.length) {
      const db = admin.database();
      const ipRef = db.ref(`rate_limits/${sanitizedIp}`);
      const snapshot = await ipRef.get();

      if (snapshot.exists()) {
        const lastTime = snapshot.val().lastSend || 0;
        const timePassed = now - lastTime;

        if (timePassed < cooldownMs) {
          const retryAfter = Math.ceil((cooldownMs - timePassed) / 1000);
          return res.status(429).json({
            error: 'RateLimitExceeded',
            retryAfter,
            message: `Подождите еще ${retryAfter} сек.`
          });
        }
      }

      await ipRef.set({ lastSend: now });
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
