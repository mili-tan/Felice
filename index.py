import io
import sys
from random import choice

import requests
from flask import Flask, redirect

headers = requests.utils.default_headers()
headers.update({'User-Agent': 'Felice/0.1'})

instances = requests.get(
    "https://searx.space/data/instances.json",
    headers=headers).json()["instances"]

app = Flask(__name__, static_url_path='', static_folder="./static")


@app.route("/")
def index():
    return app.send_static_file('index.html')


@app.route("/searx")
def searx():
    return str(getSearX())


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

    if '@' in keyword:
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


def getSearX():
    name = choice(list(instances.keys()))
    inst = instances[name]
    try:
        if '.onion' in name or '.i2p' in name or int(inst["version"].split('.')[0]) < 2 \
                or 'A' not in inst["tls"]['grade'] or 'A' not in inst["http"]['grade'] or (
                inst["html"]['grade'] != "V" and inst["html"]['grade'] != "F"):
            return getSearX()
        else:
            return name
    except:
        return getSearX()


if __name__ == '__main__':
    app.run()
