import { getElement } from './utils.js';

export function initAgeTooltip() {
    const container = document.querySelector('.tooltip-container');
    
    if (container) {
        container.addEventListener('click', (e) => {
            e.stopPropagation();
            container.classList.toggle('active');
        });

        // Закрываем при клике в любое другое место
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                container.classList.remove('active');
            }
        });
    }
}
