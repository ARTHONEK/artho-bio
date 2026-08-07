import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccountBase64 = process.env.FIREBASE_CONFIG_B64;

    if (serviceAccountBase64) {
      const serviceAccount = JSON.parse(
        Buffer.from(serviceAccountBase64, 'base64').toString('utf8')
      );

      const dbUrl =
        process.env.FIREBASE_DATABASE_URL ||
        serviceAccount.databaseURL ||
        `https://${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`;

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: dbUrl,
      });
    }
  } catch (error) {
    console.error('Firebase Init Error:', error);
  }
}

const OWNER_ID = Number(process.env.MY_TELEGRAM_ID);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('Webhook active');
  }

  const update = req.body;

  if (!update?.message) {
    return res.status(200).send('OK');
  }

  const message = update.message;

  // Разрешаем сообщения только от владельца
  if (!message.from || message.from.id !== OWNER_ID) {
    console.log(
      `Отклонено сообщение от ${message.from?.id} (${message.from?.username || "unknown"})`
    );
    return res.status(200).send('OK');
  }

  const text = (message.text || message.caption || '').trim();

  if (!text) {
    return res.status(200).send('OK');
  }

  // Игнорируем пересланные сообщения с сайта
  if (text.includes('Новое сообщение с сайта!')) {
    return res.status(200).send('OK');
  }

  let authorName = message.from.first_name || 'Аноним';

  if (message.from.last_name) {
    authorName += ` ${message.from.last_name}`;
  }

  try {
    const db = admin.database();

    await db.ref('messages').push({
      username: authorName.substring(0, 50),
      text: text.substring(0, 1000),
      timestamp: Date.now(),
    });

    console.log(`Сообщение от ${authorName} сохранено.`);
  } catch (err) {
    console.error('Firebase save error:', err);
  }

  return res.status(200).send('OK');
}