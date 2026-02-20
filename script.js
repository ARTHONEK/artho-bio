// Настройки даты рождения
const BIRTH_DATE = "2006-05-27";

// Функция расчета и вывода возраста
function updateAge() {
    const today = new Date();
    const birth = new Date(BIRTH_DATE);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    let suffix = 'лет';
    let count = age % 100;
    
    if (!(count >= 5 && count <= 20)) {
        count = count % 10;
        if (count === 1) suffix = 'год';
        else if (count >= 2 && count <= 4) suffix = 'года';
    }
    
    const ageElement = document.getElementById('age');
    if(ageElement) ageElement.innerText = `${age} ${suffix}`;
}

// Настройка кликов по картинкам во всех галереях
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

// Загрузка
document.addEventListener('DOMContentLoaded', () => {
    updateAge();
    initGallery();
});
function initEasterEgg() {
    const moai = document.getElementById('moai-egg');
    
    // Для мобильных устройств: показываем при первом тапе
    moai.addEventListener('touchstart', function(e) {
        if (!moai.classList.contains('visible')) {
            e.preventDefault(); // Отменяем переход по ссылке при первом клике
            moai.classList.add('visible');
            
            // Скрыть обратно через 3 секунды, если не нажали
            setTimeout(() => {
                moai.classList.remove('visible');
            }, 3000);
        }
    });
}

// Добавь запуск функции в основной блок загрузки:
document.addEventListener('DOMContentLoaded', () => {
    updateAge();
    initGallery();
    initEasterEgg(); // Запускаем пасхалку
});
