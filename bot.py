import os
import json
import base64
import telebot
import firebase_admin
from firebase_admin import credentials, db
from datetime import datetime

def init_firebase():
    if not firebase_admin._apps:
        b64_config = os.environ.get("FIREBASE_CONFIG_B64")
        if not b64_config:
            raise ValueError("Не задана переменная окружения FIREBASE_CONFIG_B64!")

        decoded_bytes = base64.b64decode(b64_config)
        service_account_info = json.loads(decoded_bytes.decode('utf-8'))

        db_url = os.environ.get("FIREBASE_DATABASE_URL") or service_account_info.get(
            "databaseURL", 
            f"https://{service_account_info.get('project_id')}-default-rtdb.asia-southeast1.firebasedatabase.app"
        )
        
        cred = credentials.Certificate(service_account_info)
        firebase_admin.initialize_app(cred, {
            'databaseURL': db_url
        })

init_firebase()

TOKEN = os.environ.get("TELEGRAM_TOKEN")
if not TOKEN:
    raise ValueError("Не задана переменная окружения TELEGRAM_TOKEN!")

bot = telebot.TeleBot(TOKEN)

@bot.message_handler(commands=['start', 'help'])
def send_welcome(message):
    bot.reply_to(
        message, 
        "👋 Привет! Отправь мне текстовое сообщение, и оно появится в прямой трансляции данных на сайте."
    )

@bot.message_handler(func=lambda message: True)
def handle_all_messages(message):
    try:
        raw_text = message.text or message.caption
        if not raw_text:
            return

        clean_text = raw_text.strip()
        
        # 🔥 ИГНОРИРУЕМ СООБЩЕНИЯ, КОТОРЫЕ САЙТ ОТПРАВИЛ В TELEGRAM
        if "Новое сообщение с сайта!" in clean_text:
            return

        author_name = message.from_user.first_name or "Аноним"
        if message.from_user.last_name:
            author_name += f" {message.from_user.last_name}"

        if len(clean_text) > 1000:
            clean_text = clean_text[:1000] + "..."

        ref = db.reference('messages')
        
        # В Live Log попадают ТОЛЬКО твои прямые сообщения боту в ТГ
        ref.push({
            'name': author_name[:50],
            'text': clean_text,
            'timestamp': int(datetime.now().timestamp() * 1000)
        })
        
        bot.reply_to(message, "✅ Готово! Сообщение отправлено на сайт.")
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Сообщение от {author_name} сохранено в Live Log.")
        
    except Exception as e:
        print(f"Ошибка сохранения в Firebase: {e}")

if __name__ == "__main__":
    print("Бот запущен...")
    bot.polling(none_stop=True, skip_pending=True)
