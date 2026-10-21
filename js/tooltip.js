export function initAgeTooltip() {
    const container = document.querySelector('.tooltip-container');
    
    if (!container) {
        console.log('Контейнер подсказки не найден!');
        return;
    }

    container.addEventListener('click', (e) => {
        e.stopPropagation();
        container.classList.toggle('active');
        console.log('Клик по возрасту! Класс active:', container.classList.contains('active'));
    });

    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            container.classList.remove('active');
        }
    });
}
