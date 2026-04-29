# PokeTeam Builder — Backend

## Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

O servidor sobe em `http://localhost:5000`.

## Endpoints

| Endpoint | Descrição |
|---|---|
| `GET /api/smogon/<pokemon>/<fmt>` | Proxy para análises do Smogon (resolve CORS) |
| `GET /api/threats/<fmt>` | Top ameaças do meta por formato |
| `GET /api/ability-synergy?abilities=levitate,flash-fire` | Imunidades/resistências por habilidade |
| `GET /api/health` | Status do servidor e cache |

## Formatos suportados
- `gen9ou` — Gen 9 OU
- `gen9vgc2025regg` — VGC 2025
- `gen9uu` — UU
- `gen9ubers` — Ubers
- `gen7ou` — SM OU
- `gen8ou` — SS OU