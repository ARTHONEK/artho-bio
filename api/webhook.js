import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccountBase64 = process.env.FIREBASE_CONFIG_B64;
    if (serviceAccountBase64) {
      const serviceAccount = JSON.parse(
        Buffer.from(serviceAccountBase64, 'base64').toString('utf8')
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
    console.error('Firebase Init Error in Webhook:', error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('Webhook active');
  }

  const update = req.body;
  if (!update || !update.message) {
    return res.status(200).send('OK');
  }

  const message = update.message;
  const text = message.text || message.caption || '';
  const authorName = message.from?.first_name || 'Аноним';

  try {
    if (text && admin.apps.length) {
      const db = admin.database();
      await db.ref('messages').push({
        username: authorName,
        text: text,
        timestamp: Date.now()
      });
    }
  } catch (err) {
    console.error('Firebase save error in webhook:', err);
  }

  return res.status(200).send('OK');
}
