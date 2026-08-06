import { state } from './state.js';
import { translations } from './translations.js';
import { updateAge } from './profile.js';
import { updateDiscordStatus } from './status.js';
import { loadActiveLore } from './lore.js';
import { loadMusicStats } from './music.js';

function setText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}

function setLinkText(selector, text) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = text;
    }
}

export async function applyLanguage() {
    const t = translations[state.currentLang];
    if (!t) return;

    document.documentElement.lang = state.currentLang;

    setText(
        'lang-switch',
        state.currentLang === 'ru' ? 'EN' : 'RU'
    );

    setText('bio-desc', t.bio_desc);

    const infoText = document.getElementById('info-text');
    if (infoText) {
        infoText.innerHTML = t.info_text;
    }

    setText('gallery-header', t.gallery_header);
    setText('title-sys', t.title_sys);
    setText('title-archive', t.title_archive);
    setText('title-music', t.music_title);
    setText('title-skills', t.title_skills);
    setText('footer-credit', t.footer);
    setText('title-live-log', t.title_live_log);

    setLinkText('#link-all-arts span', t.link_all_arts);
    setLinkText('#link-tgc span', t.links?.tgc);
    setLinkText('#link-tgdm span', t.links?.tgdm);
    setLinkText('#link-protomap span', t.links?.protomap);
    setLinkText('#link-lfm span', t.links?.lfm);

    if (t.stats) {
        setText('stat-model', t.stats[0]);
        setText('stat-place', t.stats[1]);
        setText('stat-status', t.stats[2]);
    }

    const messageInput = document.getElementById('user-input');
    const nameInput = document.getElementById('user-name');
    const contactInput = document.getElementById('user-contact');
    const contactsLabel = document.getElementById('label-contacts');
    const sendButton = document.getElementById('send-btn');

    if (messageInput) messageInput.placeholder = t.input_placeholder;
    if (nameInput) nameInput.placeholder = t.name_placeholder;
    if (contactInput) contactInput.placeholder = t.contact_placeholder;
    if (contactsLabel) contactsLabel.textContent = t.label_contacts;
    if (sendButton && !state.isCooldown) sendButton.textContent = t.send_btn;

    document.querySelectorAll('#main-tabs .tab-btn').forEach((button, index) => {
        if (t.main_tabs?.[index]) button.textContent = t.main_tabs[index];
    });

    document.querySelectorAll('#gallery-sub-tabs .tab-btn').forEach((button, index) => {
        if (t.gallery_tabs?.[index]) button.textContent = t.gallery_tabs[index];
    });

    document.querySelectorAll('#lore-sub-tabs .tab-btn').forEach((button, index) => {
        if (t.lore_tabs?.[index]) button.textContent = t.lore_tabs[index];
    });

    // Безопасное обновление зависимых компонентов
    try {
        await updateAge();
        await updateDiscordStatus();

        if (state.loreLoaded) {
            await loadActiveLore();
        }

        const activeTab = document.querySelector('#main-tabs .tab-btn.active');
        if (activeTab?.dataset.tab === 'music') {
            await loadMusicStats();
        }
    } catch (e) {
        console.warn('i18n async update skipped:', e);
    }
}

export async function initLanguage() {
    const savedLang = localStorage.getItem('site_lang');

    if (savedLang) {
        state.currentLang = savedLang;
    } else {
        const hostname = window.location.hostname;
        if (hostname.includes('vercel.app')) {
            state.currentLang = 'en';
        } else {
            state.currentLang = 'ru';
        }
    }

    await applyLanguage();
}

export async function toggleLanguage() {
    state.currentLang = state.currentLang === 'ru' ? 'en' : 'ru';
    localStorage.setItem('site_lang', state.currentLang);
    await applyLanguage();
}
