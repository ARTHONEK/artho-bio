export default async function handler(req, res) {
    const apiKey = process.env.LFM_API_KEY; // Ключ будет браться из настроек Vercel
    const user = "arthonek";
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${user}&api_key=${apiKey}&format=json&limit=1`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const track = data.recenttracks.track[0];
        
        const isPlaying = track['@attr'] && track['@attr'].nowplaying === 'true';

        if (isPlaying) {
            res.status(200).json({ artist: track.artist['#text'], name: track.name });
        } else {
            res.status(200).json({ message: "offline" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch music" });
    }
}
