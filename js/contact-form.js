
import { state } from './state.js';
import { translations } from './translations.js';
import { updateLiveLog } from './live-log.js';

// Момент загрузки страницы: сервер отсекает отправки быстрее нескольких секунд
const formReadyAt = Date.now();

// ===== Cloudflare Turnstile =====
const TURNSTILE_SITE_KEY = '0x4AAAAAAF8n_p_GrnpiX_2r';
const CAPTCHA_ENABLED = TURNSTILE_SITE_KEY !== 'YOUR_SITE_KEY';
const TURNSTILE_SCRIPT =
    'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let turnstileScriptPromise = null;
let isSending = false;

// Статус проверки под кнопкой
function setCaptchaStatus(message = '') {
    const button = document.getElementById('send-btn');
    if (!button) return;

    let status = document.getElementById('captcha-status');

    if (!status && message) {
        status = document.createElement('div');
        status.id = 'captcha-status';
        status.className = 'captcha-status';
        status.style.cssText =
            'font-size:13px;margin-top:8px;text-align:center;opacity:.8;';
        button.insertAdjacentElement('afterend', status);
    }

    if (status) {
        status.textContent = message;
        status.hidden = !message;
    }
}

// Загрузка Cloudflare Turnstile с таймаутом
function loadTurnstile() {
    if (window.turnstile) {
        return Promise.resolve(window.turnstile);
    }

    if (!turnstileScriptPromise) {
        turnstileScriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            let finished = false;

            const timeout = setTimeout(() => {
                if (finished) return;
                finished = true;

                script.remove();
                turnstileScriptPromise = null;
                reject(new Error('Turnstile script loading timeout'));
            }, 15000);

            script.src = TURNSTILE_SCRIPT;
            script.async = true;
            script.defer = true;

            script.onload = () => {
                if (finished) return;

                const api = window.turnstile;

                if (!api?.ready) {
                    finished = true;
                    clearTimeout(timeout);
                    turnstileScriptPromise = null;
                    reject(new Error('Turnstile API unavailable'));
                    return;
                }

                api.ready(() => {
                    if (finished) return;

                    finished = true;
                    clearTimeout(timeout);
                    resolve(api);
                });
            };

            script.onerror = () => {
                if (finished) return;

                finished = true;
                clearTimeout(timeout);
                script.remove();
                turnstileScriptPromise = null;

                reject(new Error('Turnstile script failed to load'));
            };

            document.head.appendChild(script);
        });
    }

    return turnstileScriptPromise;
}

// Получение токена капчи
async function getTurnstileToken() {
    const turnstile = await loadTurnstile();

    if (!turnstile?.render || !turnstile?.execute) {
        throw new Error('Turnstile API is incomplete');
    }

    let box = document.getElementById('captcha-box');

    if (!box) {
        box = document.createElement('div');
        box.id = 'captcha-box';
        box.className = 'captcha-box';

        document.getElementById('send-btn')?.before(box);
    }

    return new Promise((resolve, reject) => {
        let widgetId = null;
        let timer = null;
        let finished = false;

        const finish = (callback, value) => {
            if (finished) return;
            finished = true;

            clearTimeout(timer);

            if (widgetId !== null) {
                try {
                    turnstile.remove(widgetId);
                } catch (error) {
                    console.warn('Turnstile cleanup:', error);
                }
            }

            box.innerHTML = '';
            callback(value);
        };

        timer = setTimeout(() => {
            finish(
                reject,
                new Error('Captcha timeout (15 seconds)')
            );
        }, 15000);

        try {
            widgetId = turnstile.render(box, {
                sitekey: TURNSTILE_SITE_KEY,
                execution: 'execute',
                appearance: 'interaction-only',
                theme: 'dark',
                language: state.currentLang === 'ru' ? 'ru' : 'en',

                callback: (token) => {
                    if (token) {
                        finish(resolve, token);
                    } else {
                        finish(reject, new Error('Empty captcha token'));
                    }
                },

                'error-callback': (errorCode) => {
                    finish(
                        reject,
                        new Error(`Captcha error: ${errorCode ?? 'unknown'}`)
                    );
                },

                'expired-callback': () => {
                    finish(reject, new Error('Captcha token expired'));
                },

                'timeout-callback': () => {
                    finish(reject, new Error('Captcha interaction timeout'));
                }
            });

            if (widgetId === undefined || widgetId === null) {
                throw new Error('Failed to render Turnstile widget');
            }

            turnstile.execute(widgetId);

        } catch (error) {
            finish(reject, error);
        }
    });
}

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

    if (state.isCooldown || isSending) return;

    const t = translations[state.currentLang];
    const messageInput = document.getElementById('user-input');
    const nameInput = document.getElementById('user-name');
    const contactInput = document.getElementById('user-contact');
    const checkbox = document.getElementById('leave-contacts');

    const message = messageInput?.value.trim();
    if (!message) return;

    const name = nameInput?.value.trim() || 'Аноним';

    let contact = '';

    if (checkbox?.checked && contactInput?.value.trim()) {
        contact = contactInput.value.trim();
    }

    const sendButton = document.getElementById('send-btn');
    const isRu = state.currentLang === 'ru';
    let turnstileToken = '';

    isSending = true;

    if (sendButton) {
        sendButton.disabled = true;
    }

    try {
        // Проверка Cloudflare
        if (CAPTCHA_ENABLED) {
            setCaptchaStatus(
                isRu
                    ? 'Проверка безопасности...'
                    : 'Security verification...'
            );

            try {
                turnstileToken = await getTurnstileToken();

                setCaptchaStatus(
                    isRu
                        ? 'Проверка пройдена!'
                        : 'Verification successful!'
                );

            } catch (captchaError) {
                console.error('Turnstile:', captchaError);

                setCaptchaStatus(
                    isRu
                        ? 'Ошибка проверки. Попробуйте ещё раз.'
                        : 'Verification failed. Please try again.'
                );

                alert(
                    (isRu
                        ? 'Не удалось пройти проверку. Обновите страницу и попробуйте ещё раз.'
                        : 'Verification failed. Reload the page and try again.')
                    + `\n(${captchaError.message})`
                );

                return;
            }
        }

        // Отправка на сервер
        const response = await fetch('/api/send-to-tg', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                contact,
                message,
                website: document.getElementById('hp-field')?.value || '',
                fillTime: Date.now() - formReadyAt,
                turnstileToken
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));

            if (response.status === 429 && error.retryAfter) {
                const finish = Date.now() + error.retryAfter * 1000;

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

        // Успешная отправка
        if (messageInput) messageInput.value = '';
        if (nameInput) nameInput.value = '';
        if (contactInput) contactInput.value = '';
        if (checkbox) checkbox.checked = false;

        toggleContactInput();

        const finish = Date.now() + 150000;
        localStorage.setItem('cooldownFinish', String(finish));
        startTimer(150);

        setCaptchaStatus('');
        alert(t.send_success);

        // Ошибка журнала не должна отменять успешную отправку
        try {
            await updateLiveLog();
        } catch (error) {
            console.error('Ошибка обновления журнала:', error);
        }

    } catch (error) {
        console.error('Ошибка отправки:', error);
        alert('Ошибка сервера');

    } finally {
        isSending = false;
        setCaptchaStatus('');

        if (sendButton && !state.isCooldown) {
            sendButton.disabled = false;
        }
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

    // Honeypot: невидимое поле-ловушка для ботов
    if (form && !document.getElementById('hp-field')) {
        const trap = document.createElement('input');
        trap.type = 'text';
        trap.name = 'website';
        trap.id = 'hp-field';
        trap.className = 'hp-field';
        trap.tabIndex = -1;
        trap.autocomplete = 'off';
        trap.setAttribute('aria-hidden', 'true');
        form.append(trap);
    }

    toggleContactInput();
}
