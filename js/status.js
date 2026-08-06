import { DISCORD_ID, state } from './state.js';
import { translations } from './translations.js';

async function updateMusic() {
    const cover = document.getElementById('track-cover');
    const title = document.getElementById('track-title-full');
    const album = document.getElementById('track-album');
    const artist = document.getElementById('track-artist');

    try {
        const response = await fetch('/api/get-music');

        if (!response.ok) {
            throw new Error('Music API error');
        }

        const music = await response.json();

        if (cover) {
            cover.src = music.image || 'images/default-cover.png';
        }

        if (title) {
            title.textContent = music.name || (
                state.currentLang === 'ru' ? 'Тишина в эфире' : 'Silence'
            );
        }

        if (album) {
            album.textContent = music.album || (music.name ? 'Single / Album N/A' : '—');
        }

        if (artist) {
            artist.textContent = music.artist || '—';
        }
    } catch (error) {
        console.error('Ошибка Last.fm:', error);

        if (title) {
            title.textContent = state.currentLang === 'ru' ? 'Ошибка связи' : 'Comms Error';
        }
        if (artist) artist.textContent = '—';
        if (album) album.textContent = '—';
    }
}

async function updateDiscord() {
    const gameElement = document.getElementById('game-name');
    const t = translations[state.currentLang];

    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);

        if (!response.ok) {
            throw new Error('Lanyard API error');
        }

        const result = await response.json();

        if (!result.success || !result.data) {
            return;
        }

        const presence = result.data;
        const statusDot = document.getElementById('discord-status-dot');

        if (statusDot && presence.discord_status) {
            statusDot.className = `status-dot ${presence.discord_status}`;
        }

        const game = presence.activities?.find(activity => activity.type === 0);

        if (!gameElement) return;

        if (game) {
            let text = ` ${t.playing_in} ${game.name}`;
            if (game.details) {
                text += ` (${game.details})`;
            }
            gameElement.textContent = text;
        } else {
            gameElement.textContent = ` ${t.game_silence}`;
        }
    } catch (error) {
        console.error('Ошибка Discord:', error);

        if (gameElement) {
            gameElement.textContent = state.currentLang === 'ru'
                ? ' Отдыхает от игр'
                : ' Not gaming';
        }
    }
}

export async function updateDiscordStatus() {
    await Promise.allSettled([
        updateMusic(),
        updateDiscord()
    ]);
}
