export default async function handler(req, res) {
    const API_KEY = process.env.LFM_API_KEY;
    const USER = process.env.LFM_USERNAME || 'arthonek';

    if (!API_KEY) {
        return res.status(200).json({
            name: 'Last.fm key missing',
            artist: 'System',
            album: 'Check Vercel env',
            image: ''
        });
    }

    try {
        const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${USER}&api_key=${API_KEY}&format=json&limit=1`;
        const response = await fetch(url);
        const data = await response.json();

        const track = data?.recenttracks?.track?.[0];

        if (!track) {
            return res.status(200).json({ name: null, artist: null, album: null, image: '' });
        }

        const image = track.image?.find(img => img.size === 'medium')?.['#text'] 
            || track.image?.[0]?.['#text'] 
            || '';

        return res.status(200).json({
            name: track.name,
            artist: track.artist['#text'] || track.artist.name,
            album: track.album['#text'],
            image: image,
            nowplaying: track['@attr']?.nowplaying === 'true'
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
