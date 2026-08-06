import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccountBase64 = process.env.FIREBASE_CONFIG_B64;
    
    if (!serviceAccountBase64) {
      throw new Error('FIREBASE_CONFIG_B64 environment variable is missing.');
    }

    const serviceAccount = JSON.parse(
      Buffer.from(serviceAccountBase64, 'base64').toString('utf8')
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || serviceAccount.databaseURL || "https://artho-web-bio-default-rtdb.asia-southeast1.firebasedatabase.app"
    });
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const db = admin.database();
    const ref = db.ref('messages');
    
    // 🧹 1. АВТО-ОЧИСТКА: Удаляем сообщения старше 30 дней (в миллисекундах)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const oldMessagesSnapshot = await ref
      .orderByChild('timestamp')
      .endAt(thirtyDaysAgo)
      .once('value');

    if (oldMessagesSnapshot.exists()) {
      const updates = {};
      oldMessagesSnapshot.forEach((child) => {
        updates[child.key] = null; // Присвоение null в Firebase удаляет узел
      });
      await ref.update(updates);
    }

    // 2. ВЫВЕДЕНИЕ ОСТАВШИХСЯ СООБЩЕНИЙ (до 50 штук)
    const snapshot = await ref.orderByChild('timestamp').limitToLast(50).once('value');
    
    const messages = [];
    snapshot.forEach((childSnapshot) => {
      messages.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });

    return res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error('Database Error:', error);
    return res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
  }
}
