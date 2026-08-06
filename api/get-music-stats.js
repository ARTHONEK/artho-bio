const IGNORED_TAGS = new Set([
    'seen live', 'favorites', 'favourite', 'female vocalists', 
    'male vocalists', 'awesome', 'my favorites', 'russian', 
    'under 2000 listeners', 'all', 'favorite artists'
]);

async function fetchTopGenres(topArtists, apiKey) {
    const genreCounts = {};
    const targetArtists = topArtists.slice(0, 10);

    await Promise.all(targetArtists.map(async (artist) => {
        try {
            const res = await fetch(
                `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptags&artist=${encodeURIComponent(artist.name)}&api_key=${apiKey}&format=json`
            );
            const data = await res.json();
            const tags = data?.toptags?.tag || [];

            tags.slice(0, 3).forEach(t => {
                const tagClean = t.name.toLowerCase().trim();
                if (!IGNORED_TAGS.has(tagClean)) {
                    genreCounts[tagClean] = (genreCounts[tagClean] || 0) + (parseInt(t.count) || 1);
                }
            });
        } catch (e) {}
    }));

    return Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([genre]) => genre);
}

export default async function handler(req, res) {
    const API_KEY = process.env.LFM_API_KEY;
    const USER = process.env.LFM_USERNAME;
    
    const period = req.query.period || '7day';

    if (!API_KEY) {
        return res.status(500).json({ error: 'No API key provided' });
    }

    try {
        const results = await Promise.allSettled([
            fetch(`https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${USER}&api_key=${API_KEY}&format=json&limit=5&period=${period}`).then(r => r.json()),
            fetch(`https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${USER}&api_key=${API_KEY}&format=json&limit=5&period=${period}`).then(r => r.json()),
            fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${USER}&api_key=${API_KEY}&format=json`).then(r => r.json())
        ]);

        const artistsData = results[0].status === 'fulfilled' ? results[0].value : null;
        const tracksData = results[1].status === 'fulfilled' ? results[1].value : null;
        const userData = results[2].status === 'fulfilled' ? results[2].value : null;

        const rawTracks = tracksData?.toptracks?.track || [];

        const topTracks = await Promise.all(rawTracks.map(async (t) => {
            let imageUrl = 'img/music.webp';

            try {
                const infoRes = await fetch(
                    `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${API_KEY}&artist=${encodeURIComponent(t.artist.name)}&track=${encodeURIComponent(t.name)}&format=json`
                );
                const infoData = await infoRes.json();
                
                const albumImages = infoData?.track?.album?.image;
                if (albumImages && albumImages.length) {
                    imageUrl = albumImages.find(img => img.size === 'medium')?.['#text'] 
                        || albumImages[albumImages.length - 1]?.['#text'] 
                        || 'img/music.webp';
                }
            } catch (e) {}

            if (imageUrl.includes('2a96cbd8b46e442fc41c2b86b821562f') || imageUrl.includes('2a96cbd8')) {
                imageUrl = 'img/music.webp';
            }

            return {
                name: t.name,
                artist: t.artist.name,
                playcount: t.playcount,
                image: imageUrl
            };
        }));

        const topArtists = (artistsData?.topartists?.artist || []).map(a => ({
            name: a.name,
            playcount: a.playcount
        }));

        const topGenres = topArtists.length ? await fetchTopGenres(topArtists, API_KEY) : [];
        const totalScrobbles = userData?.user?.playcount || 0;

        return res.status(200).json({ topArtists, topTracks, topGenres, totalScrobbles });
    } catch (err) {
        console.error('Music API Error:', err);
        return res.status(500).json({ error: err.message });
    }
}
