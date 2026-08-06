import { initGallery } from './gallery.js';
import { startTerminalBoot, loadActiveLore } from './lore.js';
import { loadMusicStats } from './music.js'; // Добавили импорт

export function openTab(tabName, button) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    document.querySelectorAll('#main-tabs .tab-btn').forEach(tabButton => {
        tabButton.classList.remove('active');
    });

    const targetTab = document.getElementById(tabName);

    if (targetTab) {
        targetTab.classList.add('active');
    }

    if (button) {
        button.classList.add('active');
    }

    if (tabName === 'gallery' || tabName === 'achieve') {
        initGallery();
    }

    if (tabName === 'lore') {
        startTerminalBoot();
    }

    // Вызываем загрузку при открытии вкладки Музыка:
    if (tabName === 'music') {
        loadMusicStats();
    }
}

export function openSubTab(subTabId, button) {
    const parent = button?.parentElement;
    if (!parent) return;

    parent.querySelectorAll('.tab-btn').forEach(tabButton => {
        tabButton.classList.remove('active');
    });

    button.classList.add('active');

    const isGalleryTab = parent.id === 'gallery-sub-tabs';
    const contentSelector = isGalleryTab
        ? '.gallery-sub-content'
        : '.lore-sub-content';

    document.querySelectorAll(contentSelector).forEach(content => {
        content.classList.remove('active');
    });

    const target = document.getElementById(subTabId);

    if (target) {
        target.classList.add('active');
    }

    if (isGalleryTab) {
        initGallery();
    } else {
        loadActiveLore();
    }
}

export function initTabs() {
    document.querySelectorAll('#main-tabs .tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            openTab(button.dataset.tab, button);
        });
    });

    document.querySelectorAll('#gallery-sub-tabs .tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            openSubTab(button.dataset.subtab, button);
        });
    });
}
