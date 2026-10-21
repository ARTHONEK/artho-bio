export function initAgeTooltip() {
    const container = document.querySelector('.tooltip-container');
    
    if (!container) {
        console.log('Контейнер подсказки не найден!');
        return;
    }

    // Обработка клика и тапа
    container.addEventListener('click', (e) => {
        e.stopPropagation();
        container.classList.toggle('active');
        console.log('Клик/тап по возрасту! Активен:', container.classList.contains('active'));
    });

    // Закрытие при клике в любое другое место экрана
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            container.classList.remove('active');
        }
    });
}
