// Настройки
const BIRTH_DATE = "2006-05-27";

// Расчет возраста
function updateAge() {
    const today = new Date();
    const birth = new Date(BIRTH_DATE);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    // Склонение слова "лет"
    let suffix = 'лет';
    let count = age % 100;
    if (!(count >= 5 && count <= 20)) {
        count = count % 10;
        if (count === 1) suffix = 'год';
        else if (count >= 2 && count <= 4) suffix = 'года';
    }
    
    document.getElementById('age').innerText = `${age} ${suffix}`;
}

// Управление галереей
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

// Запуск при загрузке
document.addEventListener('DOMContentLoaded', () => {
    updateAge();
    initGallery();
});
