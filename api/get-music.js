export default async function handler(req, res) {
    const apiKey = process.env.LFM_API_KEY;
    const user = "arthonek";
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${user}&api_key=${apiKey}&format=json&limit=1`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const track = data.recenttracks.track[0];
        
        const isPlaying = track['@attr'] && track['@attr'].nowplaying === 'true';

        // ДОБАВЛЕНО: Кэширование ответа на стороне Vercel Edge Network
        // s-maxage=30 — кэширует на сервере на 30 секунд
        // stale-while-revalidate — позволяет отдавать старые данные, пока фоном обновляются новые
        res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');

        if (isPlaying) {
            res.status(200).json({ artist: track.artist['#text'], name: track.name });
        } else {
            res.status(200).json({ message: "offline" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch music" });
    }
}