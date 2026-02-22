const BIRTH_DATE = "2006-05-27";
let currentLang = 'ru';

const translations = {
    ru: {
        bio_desc: "просто случайный протоген из Нижнего Новгорода",
        main_tabs: ["Инфо", "Арты", "Лор", "Скиллы"],
        info_text: `Привет! Меня зовут <span>Артур</span>, мне <span id="age">...</span>. Живу в Нижнем Новгороде. В фурри-сообществе нахожусь примерно с осени 2023 года. Рад знакомству!`,
        links: {
            tgc: "✈️ личный тгк",
            tgdm: "☕️ лс телеграма",
            protomap: "🥀 профиль Protomap",
            lfm: "🎧 мой last.fm профиль"
        },
        gallery_header: "Галерея персонажа",
        link_all_arts: "📸 все арты с моими персонажами",
        title_sys: "Системные характеристики",
        stats: ["Модель", "Место сборки", "Статус"],
        title_archive: "Архивы данных",
        lore_tabs: ["Происхождение", "Земля", "Анатомия"],
        title_skills: "Достижения и Сертификаты",
        footer: "Сделано при поддержке Gemini AI",
        loading: "Загрузка данных..."
    },
    en: {
        bio_desc: "just a random protogen from Nizhny Novgorod",
        main_tabs: ["Info", "Arts", "Lore", "Skills"],
        info_text: `Hi! My name is <span>Arthur</span>, I'm <span id="age">...</span>. I live in Nizhny Novgorod. I've been in the furry community since autumn 2023. Nice to meet you!`,
        links: {
            tgc: "✈️ personal channel",
            tgdm: "☕️ telegram DM",
            protomap: "🥀 Protomap profile",
            lfm: "🎧 my last.fm profile"
        },
        gallery_header: "Character Gallery",
        link_all_arts: "📸 all arts with my characters",
        title_sys: "System Specifications",
        stats: ["Model", "Assembly Place", "Status"],
        title_archive: "Data Archives",
        lore_tabs: ["Origin", "Earth", "Anatomy"],
        title_skills: "Achievements & Certificates",
        footer: "Made with Gemini AI support",
        loading: "Loading data..."
    }
};

// Функция переключения языка
function toggleLanguage() {
    currentLang = currentLang === 'ru' ? 'en' : 'ru';
    const t = translations[currentLang];
    
    // Кнопка переключателя
    document.getElementById('lang-switch').innerText = currentLang === 'ru' ? 'EN' : 'RU';
    
    // Базовые тексты
    document.getElementById('bio-desc').innerText = t.bio_desc;
    document.getElementById('info-text').innerHTML = t.info_text;
    document.getElementById('gallery-header').innerText = t.gallery_header;
    document.getElementById('link-all-arts').innerText = t.link_all_arts;
    document.getElementById('title-sys').innerText = t.title_sys;
    document.getElementById('title-archive').innerText = t.title_archive;
    document.getElementById('title-skills').innerText = t.title_skills;
    document.getElementById('footer-credit').innerText = t.footer;

    // Ссылки
    document.getElementById('link-tgc').innerText = t.links.tgc;
    document.getElementById('link-tgdm').innerText = t.links.tgdm;
    document.getElementById('link-protomap').innerText = t.links.protomap;
    document.getElementById('link-lfm').innerText = t.links.lfm;

    // Таблица характеристик
    document.getElementById('stat-model').innerText = t.stats[0];
    document.getElementById('stat-place').innerText = t.stats[1];
    document.getElementById('stat-status').innerText = t.stats[2];

    // Кнопки главного меню
    const mainBtns = document.querySelectorAll('#main-tabs .tab-btn');
    mainBtns.forEach((btn, i) => btn.innerText = t.main_tabs[i]);

    // Кнопки лора
    const loreBtns = document.querySelectorAll('#lore-sub-tabs .tab-btn');
    loreBtns.forEach((btn, i) => btn.innerText = t.lore_tabs[i]);

    // Пересчет возраста (так как мы переписали контейнер)
    updateAge();

    // Обновление лор-контента
    const activeLoreBtn = document.querySelector('#lore-sub-tabs .tab-btn.active');
    if (activeLoreBtn) {
        // Получаем имя файла из атрибута onclick
        const match = activeLoreBtn.getAttribute('onclick').match(/'([^']+)'/);
        if (match) {
            let fileName = match[1];
            // Если язык английский, добавляем суффикс (если его еще нет)
            if (currentLang === 'en' && !fileName.includes('_en')) {
                fileName = fileName.replace('.txt', '_en.txt');
            } else if (currentLang === 'ru') {
                fileName = fileName.replace('_en.txt', '.txt');
            }
            loadLore(fileName);
        }
    }
}

// --- Остальные функции (без изменений, но исправленные) ---

function openTab(evt, tabName) {
    const tabContent = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContent.length; i++) tabContent[i].classList.remove("active");

    const tabBtns = document.querySelectorAll("#main-tabs .tab-btn");
    tabBtns.forEach(btn => btn.classList.remove("active"));

    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
    if (tabName === 'gallery') initGallery();
}

function updateAge() {
    const today = new Date();
    const birth = new Date(BIRTH_DATE);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    
    const el = document.getElementById('age');
    if(!el) return;

    if (currentLang === 'ru') {
        let suffix = 'лет';
        let count = age % 100;
        if (!(count >= 5 && count <= 20)) {
            count = count % 10;
            if (count === 1) suffix = 'год';
            else if (count >= 2 && count <= 4) suffix = 'года';
        }
        el.innerText = `${age} ${suffix}`;
    } else {
        el.innerText = `${age} years old`;
    }
}

function initGallery() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    document.querySelectorAll('.gallery-item img').forEach(img => {
        img.onclick = () => {
            lightboxImg.src = img.src;
            lightbox.style.display = 'flex';
        };
    });
}

async function loadLore(fileName, event) {
    const container = document.getElementById('lore-content');
    if (event) {
        const subButtons = event.currentTarget.parentElement.querySelectorAll('.tab-btn');
        subButtons.forEach(btn => btn.classList.remove('active'));
        event.currentTarget.classList.add('active');
    }

    try {
        container.style.opacity = "0.5";
        // Проверка: если язык EN, подменяем файл
        let targetFile = fileName;
        if (currentLang === 'en' && !targetFile.includes('_en')) {
            targetFile = targetFile.replace('.txt', '_en.txt');
        }

        const response = await fetch(targetFile);
        if (!response.ok) throw new Error();
        const text = await response.text();
        container.innerText = text;
    } catch (error) {
        container.innerHTML = '<span style="color:red">ERROR: DATA_CORRUPTED</span>';
    } finally {
        container.style.opacity = "1";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateAge();
    initGallery();
    loadLore('lore-headcanon.txt');
});

const LFM_API_KEY = "b6de514b70401a6ab70a250dc1cb63dd";
const LFM_USER = "arthonek";

async function updateLastFm() {
    const trackEl = document.getElementById('track-name');
    if (!trackEl) return; // Защита, если элемента нет на странице

    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LFM_USER}&api_key=${LFM_API_KEY}&format=json&limit=1`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("API Response Error");
        
        const data = await response.json();
        const track = data.recenttracks.track[0];

        // Проверяем статус "Now Playing"
        const isPlaying = track['@attr'] && track['@attr'].nowplaying === 'true';
        
        if (isPlaying) {
            const trackText = `${track.artist['#text']} — ${track.name}`;
            trackEl.innerText = currentLang === 'ru' ? ` ${trackText}` : `Listening to: ${trackText}`;
        } else {
            trackEl.innerText = currentLang === 'ru' ? "Сигнал потерян (Offline)" : "Signal lost (Offline)";
        }
    } catch (e) {
        console.error("Last.fm Error:", e);
        trackEl.innerText = currentLang === 'ru' ? "Ошибка модуля связи" : "Comms Error";
    }
}

// Запускаем сразу при загрузке
document.addEventListener('DOMContentLoaded', () => {
    updateAge();
    initGallery();
    loadLore('lore-headcanon.txt');
    updateLastFm(); // Вызываем здесь
    setInterval(updateLastFm, 30000); // И ставим таймер
});
