import { state } from './state.js';
import { translations } from './translations.js';
import { updateLiveLog } from './live-log.js';

export function toggleContactInput() {
    const checkbox = document.getElementById('leave-contacts');
    const input = document.getElementById('user-contact');

    if (!checkbox || !input) return;

    input.hidden = !checkbox.checked;

    if (checkbox.checked) {
        input.focus();
    }
}

export function startTimer(seconds) {
    state.isCooldown = true;
    const button = document.getElementById('send-btn');
    let timeLeft = Math.floor(seconds);

    if (state.cooldownTimerId) {
        clearInterval(state.cooldownTimerId);
    }

    const updateButton = () => {
        if (!button) return;
        button.textContent = timeLeft;
        button.disabled = true;
        button.style.opacity = '0.5';
    };

    updateButton();

    state.cooldownTimerId = setInterval(() => {
        timeLeft--;

        if (timeLeft >= 0) {
            updateButton();
            return;
        }

        clearInterval(state.cooldownTimerId);
        state.cooldownTimerId = null;
        state.isCooldown = false;

        localStorage.removeItem('cooldownFinish');

        if (button) {
            button.textContent = translations[state.currentLang].send_btn;
            button.disabled = false;
            button.style.opacity = '1';
        }
    }, 1000);
}

export function checkCooldown() {
    const finish = localStorage.getItem('cooldownFinish');
    if (!finish) return;

    const seconds = Math.floor((Number(finish) - Date.now()) / 1000);

    if (seconds > 0) {
        startTimer(seconds);
    } else {
        localStorage.removeItem('cooldownFinish');
    }
}

export async function sendMessageToTG(event) {
    if (event) {
        event.preventDefault();
    }

    if (state.isCooldown) return;

    const t = translations[state.currentLang];
    const messageInput = document.getElementById('user-input');
    const nameInput = document.getElementById('user-name');
    const contactInput = document.getElementById('user-contact');
    const checkbox = document.getElementById('leave-contacts');

    const message = messageInput?.value.trim();
    if (!message) return;

    let name = nameInput?.value.trim() || 'Аноним';
    let contact = '';

    if (checkbox?.checked && contactInput?.value.trim()) {
        contact = contactInput.value.trim();
    }

    try {
        const response = await fetch('/api/send-to-tg', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, contact, message })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));

            if (response.status === 429 && error.retryAfter) {
                const finish = Date.now() + (error.retryAfter * 1000);
                localStorage.setItem('cooldownFinish', String(finish));
                startTimer(error.retryAfter);
                alert(error.message || `Подождите еще ${error.retryAfter} сек.`);
                return;
            }

            alert(
                error.error === 'Forbidden content'
                    ? t.link_error
                    : (error.message || 'Ошибка отправки')
            );
            return;
        }

        if (messageInput) messageInput.value = '';
        if (nameInput) nameInput.value = '';
        if (contactInput) contactInput.value = '';
        if (checkbox) checkbox.checked = false;

        toggleContactInput();
        alert(t.send_success);

        const finish = Date.now() + 150_000;
        localStorage.setItem('cooldownFinish', String(finish));
        startTimer(150);

        await updateLiveLog();
    } catch (error) {
        console.error('Ошибка отправки:', error);
        alert('Ошибка сервера');
    }
}

export function initContactForm() {
    const checkbox = document.getElementById('leave-contacts');
    const form = document.getElementById('message-form');
    const button = document.getElementById('send-btn');

    checkbox?.addEventListener('change', toggleContactInput);

    // Подключение слушателей
    form?.addEventListener('submit', sendMessageToTG);
    button?.addEventListener('click', sendMessageToTG);

    toggleContactInput();
}
