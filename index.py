import requests
from flask import Flask, redirect

app = Flask(__name__, static_url_path='', static_folder="./static")
headers = requests.utils.default_headers()
headers.update({'User-Agent': 'Felice/0.1'})


@app.route("/")
def index():
    return app.send_static_file('index.html')


@app.route('/search/<keyword>')
def search(keyword):
    keywords = keyword.split('.')
    if len(keywords) == 3 or (len(keywords) == 2 and keywords[1] != 's' and keywords[1] != 'search'):
        return redirect(
            "https://searx.neocities.org/?q=" + keywords[0].replace('-', " ") + "&engines=" + getEngine(keywords[1])
            + "&theme=simple&language=all&oscar-style=logicodev")
    else:
        return redirect("https://searx.neocities.org/?q=" + keywords[0].replace('-', " ")
                        + "&theme=simple&language=all&oscar-style=logicodev")


@app.route('/find/<keyword>')
def find(keyword):
    if keyword == 'idk' or keyword == '.idk':
        return redirect("https://felice.vercel.app")

    if keyword.contains('@'):
        keywords = keyword.split('@')
        return redirect(
            "https://searx.neocities.org/?q=" + keywords[0].replace('-', " ") + "&engines=" + getEngine(keywords[1])
            + "&theme=simple&language=all&oscar-style=logicodev")

    keyword = keyword.replace('-', " ")
    keyword = keyword.rstrip('.idk')

    entitySearch = requests.get(
        "https://www.wikidata.org/w/api.php?action=wbsearchentities&language=en&limit=3&format=json&search=" + keyword,
        headers=headers).json()
    if len(entitySearch['search']) != 0:
        for i in entitySearch['search']:
            d = i['id']
            entityClaims = requests.get(
                "https://www.wikidata.org/w/api.php?action=wbgetclaims&property=P856&format=json&entity=" + d,
                headers=headers).json()
            if len(entityClaims['claims']) != 0:
                return redirect(entityClaims['claims']['P856'][0]['mainsnak']['datavalue']['value'])

    searx = requests.get(
        "https://search.unlocked.link/search?format=json&language=all&safesearch=1&q=" + keyword,
        headers=headers).json()
    if len(searx) != 0 and len(searx['results']) != 0:
        return redirect(searx['results'][0]['url'])
    return redirect("https://duckduckgo.com/?q=!ducky+" + keyword)


def getEngine(engine):
    if engine == "ddg":
        engine = "duckduckgo"
    elif engine == "go" or engine == "gg":
        engine = "google"
    elif engine == "bi" or engine == "by":
        engine = "bing"
    elif engine == "yh":
        engine = "yahoo"
    elif engine == "wp" or engine == "wiki":
        engine = "wikipedia"
    return engine


if __name__ == '__main__':
    app.run()
