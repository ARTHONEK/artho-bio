import { state } from './state.js';
import { translations } from './translations.js';
import { escapeHTML } from './utils.js';

const musicCache = {};
let currentPeriod = '7day';

export async function loadMusicStats(selectedPeriod = currentPeriod) {
    const container = document.getElementById('music-tab-content');
    if (!container) return;

    currentPeriod = selectedPeriod;
    const t = translations[state.currentLang];

    try {
        if (!musicCache[currentPeriod]) {
            const response = await fetch(`/api/get-music-stats?period=${currentPeriod}`);
            if (!response.ok) throw new Error('Music stats error');
            musicCache[currentPeriod] = await response.json();
        }

        const { topArtists = [], topTracks = [], topGenres = [], totalScrobbles = 0 } = musicCache[currentPeriod];

        const genresHtml = topGenres.length 
            ? `<div class="top-genres-container">
                <span class="genres-label">🏷️ ${t.top_genres}:</span>
                <div class="genres-list">
                    ${topGenres.map(g => `<span class="genre-badge">${escapeHTML(g)}</span>`).join('')}
                </div>
               </div>`
            : '';

        const artistsHtml = topArtists.length 
            ? topArtists.map((artist, idx) => `
                <div class="music-card top-artist-card">
                    <span class="rank-num">#${idx + 1}</span>
                    <div class="artist-info">
                        <div class="artist-name">${escapeHTML(artist.name)}</div>
                        <div class="artist-playcount">${artist.playcount} ${t.plays_unit}</div>
                    </div>
                </div>
            `).join('')
            : `<div class="empty-list">${t.no_music_data}</div>`;

        const tracksHtml = topTracks.length 
            ? topTracks.map((track, idx) => `
                <div class="music-card top-track-card">
                    <span class="rank-num">#${idx + 1}</span>
                    <img src="${track.image || 'img/music.webp'}" alt="${escapeHTML(track.name)}" class="track-cover" width="50" height="50" loading="lazy">
                    <div class="track-info">
                        <div class="track-title-full">${escapeHTML(track.name)}</div>
                        <div class="track-artist">${escapeHTML(track.artist)}</div>
                        <div class="track-album">${track.playcount} ${t.plays_unit}</div>
                    </div>
                </div>
            `).join('')
            : `<div class="empty-list">${t.no_music_data}</div>`;

        container.innerHTML = `
            <div class="music-dashboard">
                <div class="music-header-bar">
                    <span class="scrobbles-badge">${t.scrobbles_count}: <strong>${totalScrobbles}</strong></span>
                    ${genresHtml}
                </div>

                <div class="period-selector">
                    <button class="period-btn ${currentPeriod === '7day' ? 'active' : ''}" data-period="7day">${t.period_7day}</button>
                    <button class="period-btn ${currentPeriod === '1month' ? 'active' : ''}" data-period="1month">${t.period_1month}</button>
                    <button class="period-btn ${currentPeriod === 'overall' ? 'active' : ''}" data-period="overall">${t.period_overall}</button>
                </div>
                
                <div class="music-grid">
                    <div class="music-section">
                        <h4>🎵 ${t.top_tracks}</h4>
                        <div class="rank-list">${tracksHtml}</div>
                    </div>
                    <div class="music-section">
                        <h4>🔥 ${t.top_artists}</h4>
                        <div class="rank-list">${artistsHtml}</div>
                    </div>
                </div>
            </div>
        `;

        container.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.target.getAttribute('data-period');
                if (period !== currentPeriod) {
                    loadMusicStats(period);
                }
            });
        });

    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        container.innerHTML = `<div class="error-text">${t.no_music_data}</div>`;
    }
}
