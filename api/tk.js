// api/tk.js (JavaScript / Node.js)

const fetch = require('node-fetch');
const cheerio = require('cheerio'); 

// SSSTik වෙත යැවීමට අවශ්‍ය Headers
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Host': 'ssstik.io',
    'Origin': 'https://ssstik.io',
    'Referer': 'https://ssstik.io/',
};

module.exports = async (req, res) => {
    // 1. URL එක ලබා ගැනීම
    const { url } = req.query;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*'); 

    if (!url) {
        return res.status(400).send({ status: 'error', message: 'TikTok URL එකක් \'url\' parameter එකෙන් ලබා දෙන්න.' });
    }

    try {
        const ssstik_url = "https://ssstik.io/abc?url=dl";
        
        // POST ඉල්ලීමට අවශ්‍ය දත්ත
        const data = new URLSearchParams({
            'id': url,
            'locale': 'en',
            'tt': '0',
        });

        // 2. SSSTik.io වෙත ඉල්ලීම යැවීම
        const response = await fetch(ssstik_url, {
            method: 'POST',
            headers: headers,
            body: data,
            timeout: 10000 // 10s timeout
        });
        
        const html = await response.text();
        
        // 3. Cheerio භාවිතයෙන් Download Link එක උපුටා ගැනීම
        const $ = cheerio.load(html);
        
        // 'No Watermark' බොත්තම සොයා ගැනීම
        const noWatermarkButton = $('a.button[target="_blank"]:contains("No Watermark")');
        
        let downloadLink = noWatermarkButton.attr('href');
        
        if (downloadLink && downloadLink.startsWith('//')) {
            downloadLink = 'https:' + downloadLink;
        }

        if (downloadLink) {
            // සාර්ථක ප්‍රතිචාරය (Success Response)
            res.status(200).send({
                "developer": "@prm2.0",
                "status": "ok",
                "data": {
                    "keyword": url,
                    "download_link": downloadLink,
                    "title": "Available link only (Node.js)" 
                }
            });
        } else {
            // සබැඳිය සොයා ගැනීමට නොහැකි නම්
            res.status(500).send({
                status: 'error',
                message: 'බාගත කිරීමේ සබැඳිය සොයා ගැනීමට නොහැකි විය. SSSTik වෙබ් අඩවිය වෙනස් වී තිබිය හැක.'
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
