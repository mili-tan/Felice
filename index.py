import requests
from flask import Flask, redirect, render_template

app = Flask(__name__, static_url_path='', static_folder="./static")
headers = requests.utils.default_headers()
headers.update({'User-Agent': 'Felice/0.1'})


@app.route("/")
def template1():
    return app.send_static_file('/static/index.html')

@app.route('/find/<keyword>')
def find(keyword):
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
    return redirect("https://searx.si/search?q=" + keyword)


if __name__ == '__main__':
    app.run()
