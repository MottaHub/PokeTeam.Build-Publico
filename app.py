"""
PokeTeam Builder — Flask Backend
  - Proxy para a API do Smogon (resolve CORS)
  - Endpoint de meta threats por formato
  - Cache em memória para não hammerar as APIs externas
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import requests, json, time

app = Flask(__name__)
CORS(app)   # libera CORS para o frontend local

# ─── Cache simples em memória ─────────────────
_cache = {}
CACHE_TTL = 3600  # 1 hora

def cache_get(key):
    entry = _cache.get(key)
    if not entry: return None
    if time.time() - entry['ts'] > CACHE_TTL:
        del _cache[key]; return None
    return entry['data']

def cache_set(key, data):
    _cache[key] = {'data': data, 'ts': time.time()}

# ─── Meta threats por formato ─────────────────
# Top ameaças conhecidas de cada formato (Gen 9)
META_THREATS = {
    'gen9ou': [
        {'name': 'gholdengo',   'types': ['steel','ghost'],   'speed': 133, 'threats': ['ghost','dark','fire','ground']},
        {'name': 'dragapult',   'types': ['dragon','ghost'],  'speed': 142, 'threats': ['ghost','dark','dragon','fairy','ice']},
        {'name': 'kingambit',   'types': ['dark','steel'],    'speed': 50,  'threats': ['fighting','ground','fire']},
        {'name': 'garchomp',    'types': ['dragon','ground'], 'speed': 102, 'threats': ['ice','dragon','fairy']},
        {'name': 'volcarona',   'types': ['bug','fire'],      'speed': 100, 'threats': ['rock','water','flying']},
        {'name': 'great-tusk',  'types': ['ground','fighting'],'speed': 87, 'threats': ['water','grass','ice','psychic','flying','fairy']},
        {'name': 'iron-valiant','types': ['fairy','fighting'], 'speed': 116, 'threats': ['poison','steel','psychic','flying','fairy']},
        {'name': 'ting-lu',     'types': ['dark','ground'],   'speed': 45,  'threats': ['water','grass','ice','fighting','fairy','bug']},
        {'name': 'iron-moth',   'types': ['fire','poison'],   'speed': 110, 'threats': ['water','rock','ground','psychic']},
        {'name': 'roaring-moon','types': ['dragon','dark'],   'speed': 119, 'threats': ['ice','fighting','bug','fairy','dragon']},
    ],
    'gen9vgc2025regg': [
        {'name': 'flutter-mane','types': ['ghost','fairy'],   'speed': 119, 'threats': ['ghost','dark','steel','poison']},
        {'name': 'urshifu-rapid-strike','types':['water','fighting'],'speed':97,'threats':['psychic','flying','fairy','electric','grass']},
        {'name': 'incineroar',  'types': ['fire','dark'],     'speed': 60,  'threats': ['water','rock','ground','fighting']},
        {'name': 'rillaboom',   'types': ['grass'],           'speed': 85,  'threats': ['fire','ice','poison','flying','bug']},
        {'name': 'tornadus',    'types': ['flying'],          'speed': 111, 'threats': ['rock','electric','ice']},
        {'name': 'amoonguss',   'types': ['grass','poison'],  'speed': 30,  'threats': ['fire','ice','psychic','flying']},
        {'name': 'calyrex-shadow','types':['psychic','ghost'],'speed': 150, 'threats': ['ghost','dark']},
        {'name': 'chien-pao',   'types': ['dark','ice'],      'speed': 135, 'threats': ['fighting','rock','steel','fire','fairy','bug']},
    ],
    'gen9uu': [
        {'name': 'ogerpon',     'types': ['grass'],           'speed': 110, 'threats': ['fire','ice','poison','flying','bug']},
        {'name': 'scizor',      'types': ['bug','steel'],     'speed': 65,  'threats': ['fire']},
        {'name': 'gengar',      'types': ['ghost','poison'],  'speed': 110, 'threats': ['ghost','dark','ground','psychic']},
        {'name': 'empoleon',    'types': ['water','steel'],   'speed': 60,  'threats': ['electric','fighting','ground']},
        {'name': 'toxapex',     'types': ['poison','water'],  'speed': 35,  'threats': ['ground','electric','psychic']},
    ],
    'gen9ubers': [
        {'name': 'zacian',      'types': ['fairy'],           'speed': 138, 'threats': ['poison','steel']},
        {'name': 'koraidon',    'types': ['fighting','dragon'],'speed': 135, 'threats': ['psychic','flying','ice','fairy','dragon']},
        {'name': 'miraidon',    'types': ['electric','dragon'],'speed': 135, 'threats': ['ground','ice','dragon','fairy']},
        {'name': 'calyrex-shadow','types':['psychic','ghost'],'speed': 150, 'threats': ['ghost','dark']},
        {'name': 'eternatus',   'types': ['poison','dragon'], 'speed': 130, 'threats': ['ground','ice','dragon','psychic']},
    ],
    'gen7ou': [
        {'name': 'landorus-therian','types':['ground','flying'],'speed':91,'threats':['ice','water']},
        {'name': 'tapu-koko',   'types': ['electric','fairy'], 'speed': 130, 'threats': ['ground','poison','steel']},
        {'name': 'garchomp',    'types': ['dragon','ground'], 'speed': 102, 'threats': ['ice','dragon','fairy']},
        {'name': 'toxapex',     'types': ['poison','water'],  'speed': 35,  'threats': ['ground','electric','psychic']},
        {'name': 'magearna',    'types': ['steel','fairy'],   'speed': 65,  'threats': ['fire','ground']},
        {'name': 'ash-greninja','types': ['water','dark'],    'speed': 122, 'threats': ['electric','grass','fighting','fairy','bug']},
        {'name': 'zygarde',     'types': ['dragon','ground'], 'speed': 95,  'threats': ['ice','dragon','fairy']},
        {'name': 'celesteela',  'types': ['steel','flying'],  'speed': 61,  'threats': ['fire','electric']},
    ],
    'gen8ou': [
        {'name': 'dragapult',   'types': ['dragon','ghost'],  'speed': 142, 'threats': ['ghost','dark','dragon','fairy','ice']},
        {'name': 'clefable',    'types': ['fairy'],           'speed': 60,  'threats': ['poison','steel']},
        {'name': 'landorus-therian','types':['ground','flying'],'speed':91,'threats':['ice','water']},
        {'name': 'corviknight', 'types': ['flying','steel'],  'speed': 67,  'threats': ['fire','electric']},
        {'name': 'spectrier',   'types': ['ghost'],           'speed': 130, 'threats': ['ghost','dark']},
        {'name': 'urshifu-rapid-strike','types':['water','fighting'],'speed':97,'threats':['psychic','flying','fairy','electric','grass']},
    ],
}

# ─── Habilidades com efeito defensivo (imunidades/resistências) ──
ABILITY_TYPE_IMMUNITIES = {
    'levitate':       'ground',
    'flash-fire':     'fire',
    'water-absorb':   'water',
    'volt-absorb':    'electric',
    'lightning-rod':  'electric',
    'storm-drain':    'water',
    'sap-sipper':     'grass',
    'earth-eater':    'ground',
    'well-baked-body':'fire',
    'wind-rider':     'flying',
    'dry-skin':       'water',
    'motor-drive':    'electric',
    'wonder-guard':   None,   # especial, ignora
}

ABILITY_TYPE_HALF = {
    'thick-fat':  ['fire','ice'],
    'heatproof':  ['fire'],
    'fluffy':     ['fire'],
}

@app.route('/api/smogon/<pokemon>/<fmt>')
def smogon_proxy(pokemon, fmt):
    """Proxy para a API do Smogon — resolve CORS."""
    cache_key = f'smogon:{pokemon}:{fmt}'
    cached = cache_get(cache_key)
    if cached:
        return jsonify(cached)

    try:
        url  = f'https://smogon.com/dex/api/analyses/{pokemon.lower()}/{fmt}/'
        resp = requests.get(url, timeout=8, headers={'User-Agent': 'PokeTeamBuilder/1.0'})
        if resp.status_code != 200:
            return jsonify({'error': 'not found', 'strategies': []}), 404
        data = resp.json()
        cache_set(cache_key, data)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e), 'strategies': []}), 500


@app.route('/api/threats/<fmt>')
def meta_threats(fmt):
    """Retorna lista de ameaças do meta para um formato."""
    threats = META_THREATS.get(fmt, META_THREATS.get('gen9ou', []))
    return jsonify({'format': fmt, 'threats': threats})


@app.route('/api/ability-synergy')
def ability_synergy():
    """
    Dado um time (lista de abilities), retorna quais tipos são
    imunizados/reduzidos por habilidade — além da tipagem normal.
    Query param: abilities=levitate,flash-fire,...
    """
    raw = request.args.get('abilities', '')
    abilities = [a.strip().lower() for a in raw.split(',') if a.strip()]

    immunities = {}  # { tipo: [ability, ...] }
    halved     = {}  # { tipo: [ability, ...] }

    for ab in abilities:
        imm = ABILITY_TYPE_IMMUNITIES.get(ab)
        if imm:
            immunities.setdefault(imm, []).append(ab)
        halves = ABILITY_TYPE_HALF.get(ab, [])
        for t in halves:
            halved.setdefault(t, []).append(ab)

    return jsonify({'immunities': immunities, 'halved': halved})


@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'cache_entries': len(_cache)})


if __name__ == '__main__':
    print("🚀 PokeTeam Backend rodando em http://localhost:5000")
    app.run(debug=True, port=5000)