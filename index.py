import requests
from flask import Flask, redirect

app = Flask(__name__, static_url_path='', static_folder="./static")
headers = requests.utils.default_headers()
headers.update({'User-Agent': 'Felice/0.1'})


@app.route("/")
def index():
    return app.send_static_file('index.html')


@app.route('/find/<keyword>')
def find(keyword):
    if keyword == 'idk' or keyword == '.idk':
        return redirect("https://felice.vercel.app")

    keyword = keyword.replace('-', " ")
    keyword = keyword.rstrip('.idk')

    search = requests.get(
        "https://www.wikidata.org/w/api.php?action=wbsearchentities&language=en&limit=3&format=json&search=" + keyword,
        headers=headers).json()
    if len(search['search']) != 0:
        for i in search['search']:
            d = i['id']
            entity = requests.get(
                "https://www.wikidata.org/w/api.php?action=wbgetclaims&property=P856&format=json&entity=" + d,
                headers=headers).json()
            if len(entity['claims']) != 0:
                p856url = entity['claims']['P856'][0]['mainsnak']['datavalue']['value']
                return redirect(p856url)

    searx = requests.get(
        "https://search.unlocked.link/search?format=json&language=all&safesearch=1&q=" + keyword,
        headers=headers).json()
    if len(searx) != 0 and len(searx['results']) != 0:
        return redirect(searx['results'][0]['url'])
    return redirect("https://duckduckgo.com/?q=!ducky+" + keyword)


if __name__ == '__main__':
    app.run()
