import { escapeHTML } from './utils.js';

export async function updateLiveLog() {
    const container = document.getElementById('tg-messages');
    if (!container) return;

    try {
        const response = await fetch('/api/get-messages');
        if (!response.ok) throw new Error('Messages API error');

        const data = await response.json();
        const messages = Array.isArray(data) ? data : (data.messages || []);

        if (!messages.length) {
            container.innerHTML = '<div class="log-empty">&gt; Сообщений пока нет...</div>';
            return;
        }

        let previousTime = '';

        const html = messages.map(message => {
            const time = message.timestamp
                ? new Date(message.timestamp).toLocaleString([], {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                })
                : '';

            const sameTime = time === previousTime;
            if (time) previousTime = time;

            const timeClass = sameTime ? 'log-time-hidden' : 'log-time';
            const author = escapeHTML(message.username || message.name || 'Аноним');
            const text = escapeHTML(message.text || '');

            return `<div class="log-entry">` +
                `<div class="log-meta">` +
                    (time ? `<span class="${timeClass}">[${time}]</span> ` : '') +
                    `<span class="log-author">${author} &gt;</span>` +
                `</div>` +
                `<div class="log-text">${text}</div>` +
            `</div>`;
        }).join('');

        // Курсор/индикатор снизу
        container.innerHTML = html + '<span class="log-cursor"></span>';
        container.scrollTop = container.scrollHeight;
    } catch (error) {
        console.error('Ошибка обновления лога:', error);
        container.textContent = 'Ошибка синхронизации';
    }
}
