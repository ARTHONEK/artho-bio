import { state } from './state.js';
import { getElement } from './utils.js';

function getRussianAgeSuffix(age) {
    const lastTwoDigits = age % 100;

    if (lastTwoDigits >= 5 && lastTwoDigits <= 20) {
        return 'лет';
    }

    const lastDigit = age % 10;

    if (lastDigit === 1) {
        return 'год';
    }

    if (lastDigit >= 2 && lastDigit <= 4) {
        return 'года';
    }

    return 'лет';
}

export async function updateAge() {
    const ageElement = getElement('age');

    if (!ageElement) return;

    try {
        const response = await fetch('/api/get-profile-data');

        if (!response.ok) {
            throw new Error('Profile API response error');
        }

        const data = await response.json();
        const age = Number(data.age);

        if (isNaN(age) || age <= 0) {
            throw new Error('Invalid age value');
        }

        const tooltipEl = document.querySelector('.tooltip-container .tooltip-text');

        if (tooltipEl && /^\d{4}-\d{2}-\d{2}$/.test(String(data.birthDate))) {
            const [year, month, day] = data.birthDate.split('-');
            const label = state.currentLang === 'ru' ? 'Дата рождения' : 'Date of birth';
            tooltipEl.textContent = `${label}: ${day}.${month}.${year}`;
        }

        if (state.currentLang === 'ru') {
            ageElement.textContent = `${age} ${getRussianAgeSuffix(age)}`;
        } else {
            ageElement.textContent = `${age} years old`;
        }
    } catch (error) {
        console.error('Ошибка получения возраста:', error);
        ageElement.textContent = '??';
    }
}
