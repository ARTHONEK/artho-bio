export function initAgeTooltip() {
    // Блок #info-text перерисовывается при смене языка,
    // поэтому слушаем клики на document, а не на самом элементе
    document.addEventListener('click', (event) => {
        const container = event.target.closest('.tooltip-container');

        document.querySelectorAll('.tooltip-container.active').forEach((element) => {
            if (element !== container) {
                element.classList.remove('active');
            }
        });

        if (container) {
            container.classList.toggle('active');
        }
    });
}
