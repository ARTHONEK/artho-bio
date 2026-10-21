import { getElement } from './utils.js';

export function initAgeTooltip() {
    const ageContainer = getElement('age');
    
    if (ageContainer) {
        ageContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            ageContainer.classList.toggle('active');
        });

        document.addEventListener('click', () => {
            ageContainer.classList.remove('active');
        });
    }
}
