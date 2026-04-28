// =============================================
// setbuilder.js — Editor de set completo v1
// =============================================

// ─── Estado do editor ────────────────────────
let sbPokemon   = null;   // objeto pokemon da PokeAPI
let sbTeamIdx   = -1;     // índice no array team[]
let sbSet       = {};     // set atual sendo editado
let sbBuildFmt  = 'gen9ou';
let sbBuildsCache = {};   // { 'gen9ou:garchomp': [...] }

// Formatos disponíveis para busca de builds
const SB_FORMATS = [
  { key: 'gen9ou',            label: 'Gen 9 OU' },
  { key: 'gen9vgc2025regg',   label: 'VGC 25'  },
  { key: 'gen9uu',            label: 'UU'       },
  { key: 'gen9ubers',         label: 'Ubers'    },
  { key: 'gen7ou',            label: 'SM OU'    },
  { key: 'gen8ou',            label: 'SS OU'    },
];

const ALL_NATURES = [
  'hardy','lonely','brave','adamant','naughty',
  'bold','docile','relaxed','impish','lax',
  'timid','hasty','serious','jolly','naive',
  'modest','mild','quiet','bashful','rash',
  'calm','gentle','sassy','careful','quirky'
];

const ITEM_SUGGESTIONS = [
  'Choice Band','Choice Scarf','Choice Specs',
  'Life Orb','Leftovers','Assault Vest','Focus Sash',
  'Heavy-Duty Boots','Air Balloon','Rocky Helmet',
  'Expert Belt','Choice Belt','Sitrus Berry'
];

// Nature stat modifiers
const NATURE_MOD = {
  lonely:{up:'attack',down:'defense'}, brave:{up:'attack',down:'speed'},
  adamant:{up:'attack',down:'special-attack'}, naughty:{up:'attack',down:'special-defense'},
  bold:{up:'defense',down:'attack'}, relaxed:{up:'defense',down:'speed'},
  impish:{up:'defense',down:'special-attack'}, lax:{up:'defense',down:'special-defense'},
  timid:{up:'speed',down:'attack'}, hasty:{up:'speed',down:'defense'},
  jolly:{up:'speed',down:'special-attack'}, naive:{up:'speed',down:'special-defense'},
  modest:{up:'special-attack',down:'attack'}, mild:{up:'special-attack',down:'defense'},
  quiet:{up:'special-attack',down:'speed'}, rash:{up:'special-attack',down:'special-defense'},
  calm:{up:'special-defense',down:'attack'}, gentle:{up:'special-defense',down:'defense'},
  sassy:{up:'special-defense',down:'speed'}, careful:{up:'special-defense',down:'special-attack'},
};

const STAT_ORDER = ['hp','attack','defense','special-attack','special-defense','speed'];

// ─── Abre o Set Builder ───────────────────────
function openSetBuilder(pokemon, teamIdx) {
  sbPokemon = pokemon;
  sbTeamIdx = teamIdx;

  // Inicializa o set — usa o set salvo ou gera sugestão
  const savedSet = teamSets[pokemon.id];
  if (savedSet) {
    sbSet = JSON.parse(JSON.stringify(savedSet));
  } else {
    const { nature, evs, role } = suggestNatureAndEVs(pokemon);
    const moves = suggestMoves(pokemon, role);
    sbSet = {
      nickname: '',
      item:     '',
      ability:  pokemon.abilities?.[0]?.ability?.name || '',
      tera:     pokemon.types[0]?.type?.name || 'normal',
      nature:   nature,
      evs:      parseEVString(evs),
      moves:    moves.map(m => m.replace('- ', '')),
    };
  }

  // Detecta formato atual
  sbBuildFmt = document.getElementById('format-select').value || 'gen9ou';

  renderSetBuilder();
  document.getElementById('setbuilder-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeSetBuilder() {
  document.getElementById('setbuilder-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

// ─── Renderiza tudo ──────────────────────────
function renderSetBuilder() {
  const p = sbPokemon;

  // Header
  document.getElementById('sb-poke-title').textContent = p.name;
  document.getElementById('sb-sprite').src = SPRITE_HD(p.id);
  document.getElementById('sb-sprite').onerror = () => {
    document.getElementById('sb-sprite').src = SPRITE(p.id);
  };
  document.getElementById('sb-poke-name').textContent = p.name;
  document.getElementById('sb-poke-id').textContent = `#${String(p.id).padStart(3,'0')}`;
  document.getElementById('sb-types').innerHTML =
    p.types.map(t => typeBadge(t.type.name)).join('');

  // Campos simples
  document.getElementById('sb-nickname').value = sbSet.nickname || '';
  document.getElementById('sb-item').value     = sbSet.item     || '';
  populateItemDatalist();
  updateItemIcon(sbSet.item);
  const itemInput = document.getElementById('sb-item');
  itemInput.oninput = () => updateItemIcon(itemInput.value);

  // Habilidade
  const abilSelect = document.getElementById('sb-ability');
  abilSelect.innerHTML = (p.abilities || []).map(a =>
    `<option value="${a.ability.name}" ${a.ability.name === sbSet.ability ? 'selected' : ''}>
      ${capitalize(a.ability.name)}${a.is_hidden ? ' ★' : ''}
    </option>`
  ).join('');

  // Tera type
  renderTeraGrid();

  // Nature
  renderNatureGrid();

  // EVs
  renderEVGrid();

  // Moves
  renderMovesGrid();

  // Stat preview
  updateStatPreview();

  // Format tabs + builds
  renderFormatTabs();
  loadBuilds(sbBuildFmt);
}

// ─── Tera Grid ───────────────────────────────
function renderTeraGrid() {
  const grid = document.getElementById('sb-tera-grid');
  grid.innerHTML = ALL_TYPES.map(t => {
    const color = TYPE_COLORS[t] || '#888';
    const active = sbSet.tera === t ? 'active' : '';
    return `<button class="tera-btn ${active}" style="background:${color}"
              data-tera="${t}" title="${t}">${t.slice(0,3).toUpperCase()}</button>`;
  }).join('');

  grid.querySelectorAll('.tera-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sbSet.tera = btn.dataset.tera;
      grid.querySelectorAll('.tera-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// ─── Nature Grid ─────────────────────────────
function renderNatureGrid() {
  const grid = document.getElementById('sb-nature-grid');
  grid.innerHTML = ALL_NATURES.map(n => {
    const active = sbSet.nature === n ? 'active' : '';
    return `<button class="nature-btn ${active}" data-nature="${n}">${n}</button>`;
  }).join('');

  grid.querySelectorAll('.nature-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sbSet.nature = btn.dataset.nature;
      grid.querySelectorAll('.nature-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateStatPreview();
    });
  });
}

// ─── EV Grid ─────────────────────────────────
function renderEVGrid() {
  const grid = document.getElementById('sb-ev-grid');
  grid.innerHTML = '';

  STAT_ORDER.forEach(stat => {
    const label = STAT_LABELS[stat] || stat;
    const val   = sbSet.evs[stat] || 0;
    const row   = document.createElement('div');
    row.className = 'ev-row';
    row.innerHTML = `
      <div class="ev-label">${label}</div>
      <input type="range" class="ev-slider" min="0" max="252" step="4"
             value="${val}" data-stat="${stat}" />
      <input type="number" class="ev-number" min="0" max="252" step="4"
             value="${val}" data-stat="${stat}" />
    `;
    grid.appendChild(row);

    const slider = row.querySelector('.ev-slider');
    const number = row.querySelector('.ev-number');

    slider.addEventListener('input', () => {
      const v = clampEV(stat, parseInt(slider.value));
      slider.value = v;
      number.value = v;
      sbSet.evs[stat] = v;
      updateEVTotal();
      updateStatPreview();
    });

    number.addEventListener('change', () => {
      const v = clampEV(stat, parseInt(number.value) || 0);
      slider.value = v;
      number.value = v;
      sbSet.evs[stat] = v;
      updateEVTotal();
      updateStatPreview();
    });
  });

  updateEVTotal();
}

function clampEV(stat, val) {
  val = Math.max(0, Math.min(252, Math.round(val / 4) * 4));
  const total = getTotalEVs();
  const current = sbSet.evs[stat] || 0;
  const remaining = 508 - (total - current);
  return Math.min(val, remaining);
}

function getTotalEVs() {
  return STAT_ORDER.reduce((acc, s) => acc + (sbSet.evs[s] || 0), 0);
}

function updateEVTotal() {
  const total = getTotalEVs();
  const el = document.getElementById('sb-ev-total');
  el.textContent = `${total} / 508`;
  el.className = 'ev-total-val ' + (total > 508 ? 'over' : 'ok');
}

// ─── Moves Grid ──────────────────────────────
function populateItemDatalist() {
  const list = document.getElementById('sb-item-list');
  if (!list) return;
  list.innerHTML = ITEM_SUGGESTIONS.map(item => `<option value="${item}"></option>`).join('');
}

function renderMovesGrid() {
  const grid = document.getElementById('sb-moves-grid');
  grid.innerHTML = '';

  for (let i = 0; i < 4; i++) {
    const move = sbSet.moves[i] || '';
    const row  = document.createElement('div');
    row.className = 'move-slot';
    row.innerHTML = `
      <div class="move-slot-num">${i + 1}</div>
      <div class="move-type-dot" id="sb-move-dot-${i}"></div>
      <input type="text" class="move-input" placeholder="Move ${i+1}"
             value="${move}" data-move-idx="${i}" />
    `;
    grid.appendChild(row);

    const input = row.querySelector('.move-input');
    input.addEventListener('input', () => {
      sbSet.moves[i] = input.value;
    });
  }
}

// ─── Stat Preview ─────────────────────────────
function updateStatPreview() {
  const p   = sbPokemon;
  const nat = NATURE_MOD[sbSet.nature] || null;
  const container = document.getElementById('sb-basestats');
  container.innerHTML = '';

  p.stats.forEach(s => {
    const key   = s.stat.name;
    const base  = s.base_stat;
    const ev    = sbSet.evs[key] || 0;
    const iv    = 31;
    const level = 50;

    // Formula Smogon
    let final;
    if (key === 'hp') {
      final = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
    } else {
      let val = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
      if (nat && nat.up === key)   val = Math.floor(val * 1.1);
      if (nat && nat.down === key) val = Math.floor(val * 0.9);
      final = val;
    }

    const label = STAT_LABELS[key] || key;
    const color = statColor(base);
    const pct   = Math.round((base / 255) * 100);

    const natMark = nat
      ? (nat.up === key ? '<span style="color:#c8ff00;font-size:9px"> ▲</span>'
        : nat.down === key ? '<span style="color:#ff6b35;font-size:9px"> ▼</span>' : '')
      : '';

    const row = document.createElement('div');
    row.className = 'sb-stat-row';
    row.innerHTML = `
      <div class="sb-stat-label">${label}${natMark}</div>
      <div class="sb-stat-base-val">${base}</div>
      <div class="sb-stat-track">
        <div class="sb-stat-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <div class="sb-stat-final-val">${final}</div>
    `;
    container.appendChild(row);
  });
}

// ─── Format Tabs ─────────────────────────────
function renderFormatTabs() {
  const tabs = document.getElementById('sb-format-tabs');
  tabs.innerHTML = SB_FORMATS.map(f =>
    `<button class="sb-format-tab ${f.key === sbBuildFmt ? 'active' : ''}"
             data-fmt="${f.key}">${f.label}</button>`
  ).join('');

  tabs.querySelectorAll('.sb-format-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      sbBuildFmt = btn.dataset.fmt;
      tabs.querySelectorAll('.sb-format-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadBuilds(sbBuildFmt);
    });
  });
}

// ─── Carrega builds do Smogon ─────────────────
async function loadBuilds(fmt) {
  const pname = sbPokemon.name.toLowerCase().replace(/-/g, '');
  const cacheKey = `${fmt}:${pname}`;
  const list = document.getElementById('sb-builds-list');

  if (sbBuildsCache[cacheKey]) {
    renderBuilds(sbBuildsCache[cacheKey]);
    return;
  }

  list.innerHTML = '<div class="sb-build-loading">Buscando builds...</div>';

  try {
    // Smogon exporta seus sets via um JSON público
    const url = `https://smogon.com/dex/api/analyses/${sbPokemon.name.toLowerCase()}/${fmt}/`;
    const r   = await fetch(url);

    if (!r.ok) throw new Error('not found');
    const data = await r.json();

    const builds = parseSmogonData(data, fmt);
    sbBuildsCache[cacheKey] = builds;
    renderBuilds(builds);
  } catch(e) {
    // Fallback: gera builds baseadas nos stats
    const builds = generateFallbackBuilds(sbPokemon, fmt);
    sbBuildsCache[cacheKey] = builds;
    renderBuilds(builds);
  }
}

function parseSmogonData(data, fmt) {
  // A API do Smogon retorna analyses com sets nomeados
  const builds = [];
  const strategies = data?.strategies || [];

  strategies.forEach(strat => {
    (strat.sets || []).forEach(set => {
      builds.push({
        name:    set.name || strat.name || 'Unnamed',
        item:    Array.isArray(set.item)    ? set.item[0]    : (set.item    || ''),
        ability: Array.isArray(set.ability) ? set.ability[0] : (set.ability || ''),
        nature:  Array.isArray(set.nature)  ? set.nature[0]  : (set.nature  || ''),
        evs:     set.evs || {},
        moves:   (set.moveslots || []).map(slot =>
          Array.isArray(slot) ? slot[0] : (slot || '')
        ).filter(Boolean).slice(0,4),
        tera:    Array.isArray(set.teratype) ? set.teratype[0] : (set.teratype || ''),
      });
    });
  });

  return builds;
}

function generateFallbackBuilds(pokemon, fmt) {
  // Gera builds heurísticas baseadas nos stats
  const { nature, evs, role } = suggestNatureAndEVs(pokemon);
  const moves = suggestMoves(pokemon, role);
  const types = pokemon.types.map(t => t.type.name);

  const stats = {};
  pokemon.stats.forEach(s => { stats[s.stat.name] = s.base_stat; });
  const isPhys = (stats['attack'] || 0) >= (stats['special-attack'] || 0);
  const ability = pokemon.abilities?.[0]?.ability?.name || '';
  const item1 = isPhys ? 'Choice Scarf' : 'Choice Specs';
  const item2 = isPhys ? 'Life Orb' : 'Life Orb';

  const builds = [
    {
      name: role,
      item: item2,
      ability,
      nature,
      evs: parseEVString(evs),
      moves: moves.map(m => m.replace('- ','')),
      tera: types[0],
    },
    {
      name: isPhys ? 'Choice Scarf' : 'Choice Specs',
      item: item1,
      ability,
      nature: isPhys ? 'jolly' : 'timid',
      evs: parseEVString(isPhys ? '252 Atk / 4 Def / 252 Spe' : '252 SpA / 4 Def / 252 Spe'),
      moves: moves.map(m => m.replace('- ','')),
      tera: types[0],
    },
  ];

  // Adiciona build defensiva se tiver stats para isso
  const defTotal = (stats['defense']||0) + (stats['special-defense']||0) + (stats['hp']||0);
  if (defTotal > 220) {
    const { nature: dn, evs: de, role: dr } = suggestNatureAndEVs({
      ...pokemon,
      stats: pokemon.stats.map(s => {
        if (s.stat.name === 'speed') return { ...s, base_stat: 50 };
        if (s.stat.name === 'defense') return { ...s, base_stat: 200 };
        return s;
      })
    });
    builds.push({
      name: 'Defensive',
      item: 'Leftovers',
      ability,
      nature: dn,
      evs: parseEVString('252 HP / 252 Def / 4 SpD'),
      moves: [moves[0].replace('- ',''), 'Protect', 'Stealth Rock', 'Roost'].filter(Boolean),
      tera: types[0],
    });
  }

  return builds;
}

// ─── Renderiza lista de builds ────────────────
function renderBuilds(builds) {
  const list = document.getElementById('sb-builds-list');

  if (!builds.length) {
    list.innerHTML = `
      <div class="sb-build-empty">
        Nenhuma build encontrada para este Pokémon neste formato.<br>
        <span style="font-size:11px;opacity:.5">Tente outro formato ou edite manualmente.</span>
      </div>`;
    return;
  }

  list.innerHTML = '';
  builds.forEach((build, idx) => {
    const card = document.createElement('div');
    card.className = 'sb-build-card';

    const evStr = formatEVString(build.evs);
    const tera  = build.tera ? `<span>Tera: ${capitalize(build.tera)}</span>` : '';

    card.innerHTML = `
      <div class="sb-build-name">${build.name}</div>
      <div class="sb-build-meta">
        ${build.item    ? `<span>@ ${capitalize(build.item)}</span>` : ''}
        ${build.ability ? `<span>${capitalize(build.ability)}</span>` : ''}
        ${build.nature  ? `<span>${capitalize(build.nature)}</span>` : ''}
        ${tera}
      </div>
      <div class="sb-build-meta" style="margin-bottom:6px">
        ${evStr ? `<span style="border-color:rgba(200,255,0,.2);color:rgba(200,255,0,.6)">${evStr}</span>` : ''}
      </div>
      <div class="sb-build-moves">
        ${(build.moves || []).map(m => `<div class="sb-build-move">· ${m}</div>`).join('')}
      </div>
    `;

    card.addEventListener('click', () => {
      applyBuild(build);
      list.querySelectorAll('.sb-build-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });

    list.appendChild(card);
  });
}

// ─── Aplica build ao editor ───────────────────
function applyBuild(build) {
  sbSet.nature  = (build.nature  || sbSet.nature).toLowerCase();
  sbSet.item    = build.item    || sbSet.item;
  sbSet.ability = build.ability || sbSet.ability;
  sbSet.moves   = [...(build.moves || [])];
  if (build.evs)  sbSet.evs  = { ...build.evs };
  if (build.tera) sbSet.tera = build.tera.toLowerCase();

  // Re-renderiza os campos editáveis
  document.getElementById('sb-item').value = sbSet.item;
  updateItemIcon(sbSet.item);

  const abilSelect = document.getElementById('sb-ability');
  if (Array.from(abilSelect.options).some(o => o.value === sbSet.ability)) {
    abilSelect.value = sbSet.ability;
  }

  // Nature
  document.querySelectorAll('.nature-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.nature === sbSet.nature);
  });

  // Tera
  document.querySelectorAll('.tera-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tera === sbSet.tera);
  });

  // EVs — re-render sliders
  renderEVGrid();

  // Moves
  document.querySelectorAll('.move-input').forEach((inp, i) => {
    inp.value = sbSet.moves[i] || '';
  });

  updateStatPreview();
  showToast('Build aplicada!');
}

// ─── Salva o set ──────────────────────────────
function saveSet() {
  // Coleta estado final dos inputs
  sbSet.nickname = document.getElementById('sb-nickname').value.trim();
  sbSet.item     = document.getElementById('sb-item').value.trim();
  sbSet.ability  = document.getElementById('sb-ability').value;

  sbSet.moves = [];
  document.querySelectorAll('.move-input').forEach(inp => {
    sbSet.moves.push(inp.value.trim());
  });

  // Salva no objeto global teamSets
  teamSets[sbPokemon.id] = JSON.parse(JSON.stringify(sbSet));
  saveTeamToStorage();
  closeSetBuilder();
  showToast('Set salvo!');
}

// ─── Helpers ─────────────────────────────────
function itemIconUrl(item) {
  if (!item) return '';
  const name = item.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `https://play.pokemonshowdown.com/sprites/items/${name}.png`;
}

function updateItemIcon(item) {
  const img = document.getElementById('sb-item-icon');
  const url = itemIconUrl(item);
  if (!url) {
    img.classList.add('hidden');
    img.src = '';
    return;
  }
  img.onload = () => img.classList.remove('hidden');
  img.onerror = () => img.classList.add('hidden');
  img.src = url;
}

function parseEVString(str) {
  const evs = {};
  STAT_ORDER.forEach(s => evs[s] = 0);
  if (!str) return evs;
  const map = { 'Atk':'attack','Def':'defense','SpA':'special-attack','SpD':'special-defense','Spe':'speed','HP':'hp' };
  str.split('/').forEach(part => {
    const [num, key] = part.trim().split(' ');
    if (map[key]) evs[map[key]] = parseInt(num) || 0;
  });
  return evs;
}

function formatEVString(evs) {
  if (!evs) return '';
  const map = { 'attack':'Atk','defense':'Def','special-attack':'SpA','special-defense':'SpD','speed':'Spe','hp':'HP' };
  return STAT_ORDER
    .filter(s => (evs[s] || 0) > 0)
    .map(s => `${evs[s]} ${map[s]}`)
    .join(' / ');
}

// ─── Init eventos do setbuilder ───────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sb-back').addEventListener('click', () => {
    if (confirm('Descartar alterações?')) closeSetBuilder();
  });

  document.getElementById('sb-save').addEventListener('click', saveSet);
});