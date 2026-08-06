import { state } from './state.js';

export function startTerminalBoot() {
    const container =
        document.getElementById(
            'lore-content'
        );

    if (
        !container ||
        state.loreLoaded
    ) {
        return;
    }

    const bootSequence = [
        '> Initializing Neuro-Link...',
        '> Searching for local data archives...',
        '> Syncing with Moon Colony Selena-4...',
        '> Decrypting anatomy files...',
        '> Connection established. Welcome, operator.'
    ];

    let lineIndex = 0;

    container.textContent = '';

    function playNextLine() {
        if (
            lineIndex <
            bootSequence.length
        ) {
            container.textContent +=
                `${bootSequence[lineIndex]}\n`;

            lineIndex++;

            setTimeout(
                playNextLine,
                600
            );

            return;
        }

        setTimeout(async () => {
            state.loreLoaded = true;

            await loadLore(
                'lore-headcanon.txt'
            );
        }, 800);
    }

    playNextLine();
}

export async function loadLore(
    fileName,
    button = null
) {
    const container =
        document.getElementById(
            'lore-content'
        );

    if (!container) return;

    if (button) {
        button.parentElement
            ?.querySelectorAll(
                '.tab-btn'
            )
            .forEach(tab => {
                tab.classList.remove(
                    'active'
                );
            });

        button.classList.add(
            'active'
        );
    }

    try {
        container.style.opacity = '0.5';

        const targetFile =
            state.currentLang === 'en'
                ? fileName.replace(
                    '.txt',
                    '_en.txt'
                )
                : fileName;

        const response = await fetch(
            `lore/${targetFile}`
        );

        if (!response.ok) {
            throw new Error(
                'Lore file error'
            );
        }

        container.textContent =
            await response.text();
    } catch (error) {
        console.error(
            'Ошибка загрузки лора:',
            error
        );

        container.innerHTML =
            '<span class="error-text">ERROR: DATA_CORRUPTED</span>';
    } finally {
        container.style.opacity = '1';
    }
}

export async function loadActiveLore() {
    const activeButton =
        document.querySelector(
            '#lore-sub-tabs .tab-btn.active'
        );

    const fileName =
        activeButton?.dataset.file;

    if (fileName) {
        await loadLore(fileName);
    }
}

export function initLoreTabs() {
    document
        .querySelectorAll(
            '#lore-sub-tabs .tab-btn'
        )
        .forEach(button => {
            button.addEventListener(
                'click',
                () => {
                    loadLore(
                        button.dataset.file,
                        button
                    );
                }
            );
        });
}