// api/tk.js (JavaScript / Node.js - SaveFrom.net භාවිතයෙන්)

const fetch = require('node-fetch');
const cheerio = require('cheerio'); 

// SaveFrom.net වෙත ඉල්ලීම් යැවීමට අවශ්‍ය Headers
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Origin': 'https://en.savefrom.net',
    'Referer': 'https://en.savefrom.net/',
};

// =========================================================================
// ප්‍රධාන Serverless Function එක
// =========================================================================

module.exports = async (req, res) => {
    const { url } = req.query;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*'); 

    if (!url) {
        return res.status(400).send({ status: 'error', message: 'TikTok URL එකක් \'url\' parameter එකෙන් ලබා දෙන්න.' });
    }

    try {
        const savefrom_url = `https://en.savefrom.net/api/convert`; // API endpoint
        
        // POST ඉල්ලීමට අවශ්‍ය දත්ත
        const data = new URLSearchParams({
            'url': url,
            'ds': '',
            'app': '',
            'page': '',
            'host': '',
        });

        // 1. SaveFrom.net වෙත POST ඉල්ලීම යැවීම
        const response = await fetch(savefrom_url, {
            method: 'POST',
            headers: headers,
            body: data,
            timeout: 10000 
        });
        
        const html = await response.text();
        
        // 2. Cheerio භාවිතයෙන් Download Link එක උපුටා ගැනීම
        const $ = cheerio.load(html);
        
        // SaveFrom.net හි Download Button එක සොයා ගැනීමට උත්සාහ කිරීම
        const downloadButton = $('.link.button.download');
        
        let downloadLink = downloadButton.attr('href');
        let qualityText = downloadButton.text().trim(); 

        if (downloadLink) {
            // සාර්ථක ප්‍රතිචාරය (Success Response)
            res.status(200).send({
                "developer": "@prm2.0",
                "status": "ok",
                "data": {
                    "keyword": url,
                    "title": "TikTok Video (SaveFrom.net)", 
                    "thumbnail": "N/A",      
                    "links": {
                        "video": [
                            {
                                "q_text": qualityText || "MP4", 
                                "size": "N/A", 
                                "url": downloadLink
                            }
                        ],
                        "audio": [] 
                    },
                    "author": {
                        "username": "unknown",
                        "full_name": "Unknown Creator",
                        "avatar": "N/A"
                    }
                }
            });
        } else {
            // සබැඳිය සොයා ගැනීමට නොහැකි නම්
            res.status(500).send({
                status: 'error',
                message: 'බාගත කිරීමේ සබැඳිය සොයා ගැනීමට නොහැකි විය. SaveFrom.net වෙබ් අඩවිය වෙනස් වී තිබිය හැක හෝ URL අസാර්ථකයි.',
                details: html.substring(0, 500) // දෝෂය හඳුනා ගැනීමට HTML කොටසක් යැවීම
            });
        }

    } catch (error) {
        console.error("API Error:", error);
        res.status(500).send({
            status: 'error',
            message: 'අභ්‍යන්තර සේවාදායක දෝෂයක් සිදුවිය.',
            details: error.message
        });
    }
};
