# api/tk.py (සරලම, ස්ථාවරම අනුවාදය)

import requests
import re
import json
from urllib.parse import urlparse, parse_qs

# SSSTik වෙත යැවීමට අවශ්‍ය Headers
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Host': 'ssstik.io',
    'Origin': 'https://ssstik.io',
    'Referer': 'https://ssstik.io/',
    # අනෙකුත් Headers ඉවත් කර ඇත, ගැටලු අවම කිරීමට
}

def handler(request, response):
    """
    Vercel Serverless Function හි ප්‍රධාන Handler එක
    """
    response.headers['Content-Type'] = 'application/json'
    response.headers['Access-Control-Allow-Origin'] = '*'

    query_params = parse_qs(urlparse(request.url).query)
    tiktok_url = query_params.get('url', [None])[0]

    if not tiktok_url:
        response.status = 400
        return json.dumps({"status": "error", "message": "TikTok URL එකක් අවශ්‍යයි."})

    try:
        ssstik_url = "https://ssstik.io/abc?url=dl"
        data = {'id': tiktok_url, 'locale': 'en', 'tt': '0'}
        
        # POST ඉල්ලීම
        req_response = requests.post(ssstik_url, headers=HEADERS, data=data, timeout=10) # Timeout එකක් එකතු කර ඇත
        req_response.raise_for_status() 
        html_content = req_response.text

        # 1. Download Link (No Watermark) Regular Expression භාවිතයෙන් සොයන්න
        # මෙම රටාව සරලම 'No Watermark' බොත්තම ඉලක්ක කරයි.
        match = re.search(r'<a\s+href="([^"]+)"\s+class="button"\s+target="_blank"\s*>\s*No Watermark\s*<\/a>', html_content)
        
        download_link = None
        if match:
            download_link = match.group(1)
            if download_link and download_link.startswith('//'):
                download_link = 'https:' + download_link

        if not download_link:
            response.status = 500
            return json.dumps({
                "status": "error",
                "message": "බාගත කිරීමේ සබැඳිය සොයා ගැනීමට නොහැකි විය. Scraper logic එක හෝ SSSTik වෙබ් අඩවිය වෙනස් වී තිබිය හැක."
            })
        
        # 2. සාර්ථක ප්‍රතිචාරය (Simple JSON)
        final_response = {
            "developer": "@prm2.0",
            "status": "ok",
            "data": {
                "keyword": tiktok_url,
                "download_link": download_link,
                "title": "Available link only (No full details)", 
            }
        }
        
        response.status = 200
        return json.dumps(final_response, indent=2)

    except requests.exceptions.RequestException as e:
        response.status = 500
        return json.dumps({
            "status": "error",
            "message": "External request failed or timed out.",
            "details": str(e)
        })

    except Exception as e:
        response.status = 500
        return json.dumps({
            "status": "error",
            "message": "An unexpected Python error occurred.",
            "details": str(e)
        })
