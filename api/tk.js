// api/tk.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    const { url } = req.query;

    // Headers set කිරීම
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');

    if (!url) {
        return res.status(400).json({
            status: "error",
            message: "TikTok URL එකක් ලබා දී නොමැත."
        });
    }

    try {
        // TikWM API වෙත Request එක යැවීම
        const apiUrl = 'https://www.tikwm.com/api/';
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
            },
            body: new URLSearchParams({
                'url': url,
                'count': 12,
                'cursor': 0,
                'web': 1,
                'hd': 1
            })
        });

        const data = await response.json();

        // TikWM වෙතින් දත්ත ලැබුනු විට
        if (data && data.data) {
            const videoData = data.data;

            // ඔබ ඉල්ලූ JSON Format එකට දත්ත සැකසීම
            const finalResponse = {
                "developer": "@DarkNaviya",
                "status": "ok",
                "mess": "Success",
                "p": "convert",
                "data": {
                    "page": "detail",
                    "extractor": "tiktok",
                    "status": "ok",
                    "keyword": url,
                    "title": videoData.title || "No Title",
                    "thumbnail": videoData.cover || videoData.origin_cover,
                    "links": {
                        "video": [
                            {
                                "q_text": "MP4 No Watermark",
                                "size": (videoData.size / (1024 * 1024)).toFixed(2) + " MB", // Size conversion
                                "url": videoData.play // Direct link
                            },
                            {
                                "q_text": "MP4 HD",
                                "size": "HD",
                                "url": videoData.hdplay || videoData.play
                            }
                        ],
                        "audio": [
                            {
                                "q_text": "Audio [MP3]",
                                "size": "",
                                "url": videoData.music
                            }
                        ]
                    },
                    "author": {
                        "username": videoData.author.unique_id,
                        "full_name": videoData.author.nickname,
                        "avatar": videoData.author.avatar
                    }
                }
            };

            return res.status(200).json(finalResponse);
        } else {
            // TikWM දත්ත ලබා නොදුන් විට
            return res.status(500).json({
                status: "error",
                message: "වීඩියෝ විස්තර ලබා ගැනීමට නොහැකි විය. URL එක නිවැරදි දැයි බලන්න."
            });
        }

    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error",
            error: error.message
        });
    }
};
