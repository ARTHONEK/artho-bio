export function initBackgroundEffect() {
    document.addEventListener('mousemove', event => {
        const moveX = (event.clientX - window.innerWidth / 2) * 0.01;
        const moveY = (event.clientY - window.innerHeight / 2) * 0.01;

        document.body.style.backgroundPosition = `center, ${moveX}px ${moveY}px, ${-moveX}px ${moveY}px`;
    });
}
