import { state } from './state.js';
import { escapeHTML } from './utils.js';

export function initGallery() {
    state.currentGalleryImages = Array.from(
        document.querySelectorAll('.gallery-item img, .achieve-item img')
    );

    state.currentGalleryImages.forEach((image, index) => {
        image.onclick = () => {
            state.currentImgIndex = index;
            showImageInLightbox();
            openLightbox();
        };
    });
}

export function openLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    lightbox.style.display = 'flex';
    lightbox.setAttribute('aria-hidden', 'false');
}

export function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    lightbox.style.display = 'none';
    lightbox.setAttribute('aria-hidden', 'true');
}

export function showImageInLightbox() {
    const image = state.currentGalleryImages[state.currentImgIndex];
    if (!image) return;

    const lightboxImage = document.getElementById('lightbox-img');
    const caption = document.getElementById('lightbox-caption');

    if (lightboxImage) {
        lightboxImage.src = image.src;
        lightboxImage.alt = image.alt || 'Изображение';
    }

    if (!caption) return;

    const rawCaption = image.dataset.author || image.title || image.alt || '';

    if (!rawCaption.trim()) {
        caption.style.display = 'none';
        caption.textContent = '';
        return;
    }

    const text = rawCaption.trim();
    let link = '';

    if (text.startsWith('https://') || text.startsWith('http://')) {
        link = text;
    } else if (text.startsWith('t.me/')) {
        link = `https://${text}`;
    } else if (text.startsWith('@')) {
        link = `https://t.me/${text.slice(1)}`;
    }

    caption.style.display = 'block';

    if (link) {
        caption.innerHTML = `
            <a
                href="${escapeHTML(link)}"
                target="_blank"
                rel="noopener noreferrer"
                class="lightbox-author-link"
            >
                ${escapeHTML(text)}
            </a>
        `;
    } else {
        caption.textContent = text;
    }
}

export function changeImage(direction) {
    const total = state.currentGalleryImages.length;
    if (!total) return;

    state.currentImgIndex = (state.currentImgIndex + direction + total) % total;
    showImageInLightbox();
}

export function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    lightbox.addEventListener('click', event => {
        if (event.target === lightbox) {
            closeLightbox();
        }
    });

    document.querySelectorAll('[data-lightbox-dir]').forEach(button => {
        button.addEventListener('click', event => {
            event.stopPropagation();
            changeImage(Number(button.dataset.lightboxDir));
        });
    });

    document.addEventListener('keydown', event => {
        if (lightbox.style.display !== 'flex') return;

        if (event.key === 'Escape') closeLightbox();
        if (event.key === 'ArrowLeft') changeImage(-1);
        if (event.key === 'ArrowRight') changeImage(1);
    });
}
