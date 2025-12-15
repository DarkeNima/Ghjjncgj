# api/tk.py

import requests
import re
import json
from urllib.parse import urlparse, parse_qs
from bs4 import BeautifulSoup 

# SSSTik වෙත යැවීමට අවශ්‍ය Headers
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Host': 'ssstik.io',
    'Origin': 'https://ssstik.io',
    'Referer': 'https://ssstik.io/',
}

def handler(request, response):
    """
    Vercel Serverless Function හි ප්‍රධාන Handler එක
    """
    response.headers['Content-Type'] = 'application/json'
    response.headers['Access-Control-Allow-Origin'] = '*'

    # 1. 'url' parameter එක ලබා ගැනීම
    query_params = parse_qs(urlparse(request.url).query)
    tiktok_url = query_params.get('url', [None])[0]

    if not tiktok_url:
        response.status = 400
        return json.dumps({
            "status": "error",
            "message": "TikTok URL එකක් 'url' parameter එකෙන් ලබා දෙන්න."
        })

    try:
        ssstik_url = "https://ssstik.io/abc?url=dl"
        data = {
            'id': tiktok_url,
            'locale': 'en',
            'tt': '0',
        }

        # 2. SSSTik.io වෙත ඉල්ලීම යැවීම
        req_response = requests.post(ssstik_url, headers=HEADERS, data=data)
        req_response.raise_for_status() 
        html_content = req_response.text

        # 3. Beautiful Soup භාවිතයෙන් දත්ත උපුටා ගැනීම
        soup = BeautifulSoup(html_content, 'html.parser')

        # --- Download Link (No Watermark) ---
        download_link = None
        # No Watermark බොත්තම සොයා ගැනීම
        no_watermark_btn = soup.find('a', class_='button', string=re.compile(r'No Watermark'))
        if no_watermark_btn:
            download_link = no_watermark_btn.get('href')
            if download_link and download_link.startswith('//'):
                download_link = 'https:' + download_link

        # --- Title / Description ---
        video_desc_tag = soup.find('p', class_='main-text') 
        video_title = video_desc_tag.text.strip() if video_desc_tag else "Title Unavailable"

        # --- Thumbnail ---
        video_tag = soup.find('video')
        thumbnail = video_tag.get('poster') if video_tag and video_tag.get('poster') else "Thumbnail Unavailable"

        # --- Author ---
        # කර්තෘගේ නම සොයා ගැනීමට උත්සාහ කිරීම (SSSTik මෙය නිවැරදිව ලබා නොදෙන අවස්ථා ඇත)
        author_element = soup.find('h2', class_='name') 
        author_name = author_element.text.strip() if author_element else "Unknown Author"

        if not download_link:
            response.status = 500
            return json.dumps({
                "status": "error",
                "message": "බාගත කිරීමේ සබැඳිය සොයා ගැනීමට නොහැකි විය. වෙබ් අඩවිය වෙනස් වී තිබිය හැක."
            })
        
        # 4. ඔබට අවශ්‍ය සම්පූර්ණ JSON ආකෘතියට දත්ත සකස් කිරීම
        final_response = {
            "developer": "@prm2.0",
            "status": "ok",
            "mess": "",
            "p": "convert",
            "data": {
                "page": "detail",
                "extractor": "tiktok",
                "status": "ok",
                "keyword": tiktok_url,
                "title": video_title, 
                "thumbnail": thumbnail,      
                "links": {
                    "video": [
                        {
                            "q_text": "MP4 No Watermark", 
                            "size": "N/A", 
                            "url": download_link
                        }
                        # SSSTik තව Video Quality links දෙන්නේ නැත.
                    ],
                    "audio": [
                         {
                            "q_text": "Audio [MP3]",
                            "size": "",
                            "url": "N/A" # Audio link එක SSSTik වෙතින් ස්වයංක්‍රීයව ලබා ගත නොහැක
                        }
                    ] 
                },
                "author": {
                    "username": author_name.replace('@', ''),
                    "full_name": author_name,
                    "avatar": "N/A"
                }
            }
        }
        
        response.status = 200
        return json.dumps(final_response, indent=2)

    except Exception as e:
        response.status = 500
        return json.dumps({
            "status": "error",
            "message": "An error occurred during API execution or scraping.",
            "details": str(e)
        })
