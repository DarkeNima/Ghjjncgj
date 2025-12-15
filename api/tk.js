// api/tk.js (JavaScript / Node.js - SaveTT.cc භාවිතයෙන්)

const fetch = require('node-fetch');
const cheerio = require('cheerio'); 

// Headers (User-Agent එක ස්ථාවරව තබා ගන්න)
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Origin': 'https://savett.cc',
    'Referer': 'https://savett.cc/',
};

module.exports = async (req, res) => {
    const { url } = req.query;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*'); 

    if (!url) {
        return res.status(400).send({ status: 'error', message: 'TikTok URL එකක් \'url\' parameter එකෙන් ලබා දෙන්න.' });
    }

    try {
        const savett_url = 'https://savett.cc/action/';
        
        // POST Data (ඔවුන්ගේ form එකට අනුව)
        const data = new URLSearchParams({
            'k': url, // TikTok URL එක
            'v': ''   // වෙනත් අවශ්‍ය අගයක්
        });

        // 1. SaveTT.cc වෙත POST ඉල්ලීම යැවීම
        const response = await fetch(savett_url, {
            method: 'POST',
            headers: headers,
            body: data,
            timeout: 10000 
        });
        
        const html = await response.text();
        
        // 2. Cheerio භාවිතයෙන් Download Link එක උපුටා ගැනීම
        const $ = cheerio.load(html);
        
        // SaveTT.cc හි Download Button එක සොයා ගැනීමට උත්සාහ කිරීම
        // මෙය SaveTT.cc වෙබ් අඩවියේ ඇති download සබැඳිය අඩංගු විය හැකි class එකකි.
        const downloadButton = $('.download-item a'); 
        
        let downloadLink = downloadButton.attr('href');
        let qualityText = downloadButton.text().trim(); 

        if (downloadLink && downloadLink.includes('https')) { // සැබෑ සබැඳියක්දැයි පරීක්ෂා කිරීම
            
            // සාර්ථක ප්‍රතිචාරය (Success Response)
            res.status(200).send({
                "developer": "@prm2.0",
                "status": "ok",
                "data": {
                    "keyword": url,
                    "title": "TikTok Video (SaveTT.cc)", 
                    "links": {
                        "video": [
                            {
                                "q_text": qualityText || "MP4 No Watermark", 
                                "url": downloadLink
                            }
                        ]
                    }
                }
            });
        } else {
            // සබැඳිය සොයා ගැනීමට නොහැකි නම්
            res.status(500).send({
                status: 'error',
                message: 'බාගත කිරීමේ සබැඳිය සොයා ගැනීමට නොහැකි විය. SaveTT.cc ව්‍යුහය වෙනස් වී තිබිය හැක.',
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
