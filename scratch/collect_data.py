import requests
import os
import re

def download_images():
    characters = [
        {"name": "Mickey_Mouse", "title": "Mickey Mouse"},
        {"name": "Elsa", "title": "Elsa"},
        {"name": "Ariel", "title": "Ariel"},
        {"name": "Aladdin", "title": "Aladdin"},
        {"name": "Simba", "title": "Simba"},
        {"name": "Belle", "title": "Belle"}
    ]
    
    base_dir = r"c:\Users\isg11\OneDrive\Desktop\workplace\05_디즈니닮을꼴찾기\scratch\training_data"
    api_url = "https://disney.fandom.com/api.php"
    
    for char in characters:
        print(f"Collecting data for {char['name']}...")
        char_dir = os.path.join(base_dir, char['name'])
        if not os.path.exists(char_dir):
            os.makedirs(char_dir)
            
        # 1. Get image list for the character
        params = {
            "action": "query",
            "format": "json",
            "prop": "images",
            "titles": char['title'],
            "imlimit": 50
        }
        
        response = requests.get(api_url, params=params).json()
        pages = response.get("query", {}).get("pages", {})
        
        images = []
        for page_id in pages:
            images.extend(pages[page_id].get("images", []))
            
        print(f"Found {len(images)} potential images for {char['name']}.")
        
        # 2. Get direct URLs for each image and download
        count = 0
        for img in images:
            if count >= 20: break
            
            img_title = img['title']
            # Filter for character-related images (avoid common icons)
            if any(ext in img_title.lower() for ext in [".png", ".jpg", ".jpeg"]):
                info_params = {
                    "action": "query",
                    "format": "json",
                    "prop": "imageinfo",
                    "titles": img_title,
                    "iiprop": "url"
                }
                
                info_res = requests.get(api_url, params=info_params).json()
                info_pages = info_res.get("query", {}).get("pages", {})
                
                for pid in info_pages:
                    info = info_pages[pid].get("imageinfo", [{}])[0]
                    url = info.get("url")
                    
                    if url:
                        try:
                            img_data = requests.get(url).content
                            # Clean filename
                            clean_name = re.sub(r'[^\w\-_\. ]', '_', img_title.replace("File:", ""))
                            file_path = os.path.join(char_dir, clean_name)
                            
                            with open(file_path, "wb") as f:
                                f.write(img_data)
                            count += 1
                            print(f"Downloaded {count}/20: {clean_name}")
                        except Exception as e:
                            print(f"Failed to download {img_title}: {e}")
                            
    print("Data collection complete!")

if __name__ == "__main__":
    download_images()
