const BIRTH_DATE = "2006-05-27";

// Переключение табов
function openTab(evt, tabName) {
    const tabContent = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContent.length; i++) {
        tabContent[i].classList.remove("active");
    }

    const tabBtns = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tabBtns.length; i++) {
        tabBtns[i].classList.remove("active");
    }

    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
    
    // Перезагрузка галереи для корректного отображения
    initGallery();
}

// Возраст
function updateAge() {
    const today = new Date();
    const birth = new Date(BIRTH_DATE);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    
    let suffix = 'лет';
    let count = age % 100;
    if (!(count >= 5 && count <= 20)) {
        count = count % 10;
        if (count === 1) suffix = 'год';
        else if (count >= 2 && count <= 4) suffix = 'года';
    }
    const el = document.getElementById('age');
    if(el) el.innerText = `${age} ${suffix}`;
}

// Галерея
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

// Пасхалка для мобилок
function initEasterEgg() {
    const moai = document.getElementById('moai-egg');
    moai.addEventListener('touchstart', function(e) {
        if (!moai.classList.contains('visible')) {
            e.preventDefault();
            moai.classList.add('visible');
            setTimeout(() => moai.classList.remove('visible'), 3000);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateAge();
    initGallery();
    initEasterEgg();
});
