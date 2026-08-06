import {
    initLanguage,
    toggleLanguage
} from './i18n.js';

import {
    updateAge
} from './profile.js';

import {
    initTabs
} from './tabs.js';

import {
    initGallery,
    initLightbox
} from './gallery.js';

import {
    initLoreTabs
} from './lore.js';

import {
    updateDiscordStatus
} from './status.js';

import {
    updateLiveLog
} from './live-log.js';

import {
    checkCooldown,
    initContactForm
} from './contact-form.js';

import {
    initBackgroundEffect
} from './effects.js';

function initLanguageButton() {
    const button =
        document.getElementById(
            'lang-switch'
        );

    button?.addEventListener(
        'click',
        toggleLanguage
    );
}

async function initializeSite() {
    // Выставляем язык до инициализации интерфейса
    await initLanguage();

    initLanguageButton();

    initTabs();
    initLoreTabs();

    initGallery();
    initLightbox();

    initContactForm();
    initBackgroundEffect();

    checkCooldown();

    await Promise.all([
        updateAge(),
        updateDiscordStatus(),
        updateLiveLog()
    ]);

    setInterval(
        updateDiscordStatus,
        30_000
    );

    setInterval(
        updateLiveLog,
        20_000
    );
}

document.addEventListener(
    'DOMContentLoaded',
    initializeSite
);
