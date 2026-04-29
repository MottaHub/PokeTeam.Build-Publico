// =============================================
// setbuilder.js — Editor de set completo v2
// =============================================

let sbPokemon     = null;
let sbTeamIdx     = -1;
let sbSet         = {};
let sbBuildFmt    = 'gen9ou';
let sbBuildsCache = {};

// Move picker state
let sbMovePickerSlot   = -1;   // qual slot (0-3) está aberto
let sbMoveSearchTimer  = null;
let sbMoveCache        = {};   // { moveName: moveData }
let sbLearnableMoves   = [];   // lista de moves do pokémon atual

const SB_FORMATS = [
  { key: 'gen9ou',          label: 'Gen 9 OU' },
  { key: 'gen9vgc2025regg', label: 'VGC 25'   },
  { key: 'gen9uu',          label: 'UU'        },
  { key: 'gen9ubers',       label: 'Ubers'     },
  { key: 'gen7ou',          label: 'SM OU'     },
  { key: 'gen8ou',          label: 'SS OU'     },
];

const ALL_NATURES = [
  'hardy','lonely','brave','adamant','naughty',
  'bold','docile','relaxed','impish','lax',
  'timid','hasty','serious','jolly','naive',
  'modest','mild','quiet','bashful','rash',
  'calm','gentle','sassy','careful','quirky'
];

const NATURE_MOD = {
  lonely:{up:'attack',down:'defense'},       brave:{up:'attack',down:'speed'},
  adamant:{up:'attack',down:'special-attack'},naughty:{up:'attack',down:'special-defense'},
  bold:{up:'defense',down:'attack'},          relaxed:{up:'defense',down:'speed'},
  impish:{up:'defense',down:'special-attack'},lax:{up:'defense',down:'special-defense'},
  timid:{up:'speed',down:'attack'},           hasty:{up:'speed',down:'defense'},
  jolly:{up:'speed',down:'special-attack'},   naive:{up:'speed',down:'special-defense'},
  modest:{up:'special-attack',down:'attack'}, mild:{up:'special-attack',down:'defense'},
  quiet:{up:'special-attack',down:'speed'},   rash:{up:'special-attack',down:'special-defense'},
  calm:{up:'special-defense',down:'attack'},  gentle:{up:'special-defense',down:'defense'},
  sassy:{up:'special-defense',down:'speed'},  careful:{up:'special-defense',down:'special-attack'},
};

const STAT_ORDER = ['hp','attack','defense','special-attack','special-defense','speed'];

const DAMAGE_CLASS_LABEL = { physical: 'FÍS', special: 'ESP', status: 'STA' };
const DAMAGE_CLASS_COLOR = { physical: '#F08030', special: '#6890F0', status: '#78C850' };

// ─── Abre o Set Builder ───────────────────────
function openSetBuilder(pokemon, teamIdx) {
  sbPokemon = pokemon;
  sbTeamIdx = teamIdx;
  sbMovePickerSlot = -1;

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
      nature,
      evs:  parseEVString(evs),
      moves: moves.map(m => m.replace('- ', '')),
    };
  }

  sbBuildFmt = document.getElementById('format-select').value || 'gen9ou';

  // Carrega lista de moves aprendíveis em background
  loadLearnableMoves(pokemon);

  renderSetBuilder();
  document.getElementById('setbuilder-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeSetBuilder() {
  closeMovePickerDropdown();
  document.getElementById('setbuilder-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

// ─── Carrega moves aprendíveis ────────────────
async function loadLearnableMoves(pokemon) {
  // Pega todos os moves do pokémon, prioriza level-up e machine
  const all = (pokemon.moves || []).map(m => ({
    name: m.move.name,
    url:  m.move.url,
    methods: m.version_group_details.map(d => d.move_learn_method.name),
  }));

  // Ordena: level-up primeiro, depois machine, depois o resto
  const priority = name => {
    if (name === 'level-up') return 0;
    if (name === 'machine')  return 1;
    if (name === 'egg')      return 2;
    return 3;
  };

  all.sort((a, b) => {
    const pa = Math.min(...a.methods.map(priority));
    const pb = Math.min(...b.methods.map(priority));
    return pa - pb;
  });

  sbLearnableMoves = all;
}

// ─── Busca dados de um move na PokeAPI ────────
async function fetchMoveData(name) {
  const key = name.toLowerCase().replace(/\s+/g, '-');
  if (sbMoveCache[key]) return sbMoveCache[key];

  try {
    const r = await fetch(`${POKEAPI}/move/${key}`);
    if (!r.ok) return null;
    const d = await r.json();
    const data = {
      name:     d.name,
      label:    d.names?.find(n => n.language.name === 'en')?.name || capitalize(d.name),
      type:     d.type?.name || 'normal',
      category: d.damage_class?.name || 'status',
      power:    d.power,
      accuracy: d.accuracy,
      pp:       d.pp,
    };
    sbMoveCache[key] = data;
    return data;
  } catch { return null; }
}

// ─── Renderiza tudo ──────────────────────────
function renderSetBuilder() {
  const p = sbPokemon;

  document.getElementById('sb-poke-title').textContent = p.name;
  document.getElementById('sb-sprite').src = SPRITE_HD(p.id);
  document.getElementById('sb-sprite').onerror = () => {
    document.getElementById('sb-sprite').src = SPRITE(p.id);
  };
  document.getElementById('sb-poke-name').textContent = p.name;
  document.getElementById('sb-poke-id').textContent = `#${String(p.id).padStart(3,'0')}`;
  document.getElementById('sb-types').innerHTML = p.types.map(t => typeBadge(t.type.name)).join('');

  document.getElementById('sb-nickname').value = sbSet.nickname || '';
  document.getElementById('sb-item').value     = sbSet.item     || '';

  const abilSelect = document.getElementById('sb-ability');
  abilSelect.innerHTML = (p.abilities || []).map(a =>
    `<option value="${a.ability.name}" ${a.ability.name === sbSet.ability ? 'selected' : ''}>
      ${capitalize(a.ability.name)}${a.is_hidden ? ' ★' : ''}
    </option>`
  ).join('');

  renderTeraGrid();
  renderNatureGrid();
  renderEVGrid();
  renderMovesGrid();
  updateStatPreview();
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
    const mod = NATURE_MOD[n];
    let title = capitalize(n);
    if (mod) title += ` (+${mod.up.split('-')[0]} -${mod.down.split('-')[0]})`;
    const active = sbSet.nature === n ? 'active' : '';
    return `<button class="nature-btn ${active}" data-nature="${n}" title="${title}">${n}</button>`;
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
      <input type="range" class="ev-slider" min="0" max="252" step="4" value="${val}" data-stat="${stat}" />
      <input type="number" class="ev-number" min="0" max="252" step="4" value="${val}" data-stat="${stat}" />
    `;
    grid.appendChild(row);

    const slider = row.querySelector('.ev-slider');
    const number = row.querySelector('.ev-number');

    slider.addEventListener('input', () => {
      const v = clampEV(stat, parseInt(slider.value));
      slider.value = number.value = v;
      sbSet.evs[stat] = v;
      updateEVTotal(); updateStatPreview();
    });
    number.addEventListener('change', () => {
      const v = clampEV(stat, parseInt(number.value) || 0);
      slider.value = number.value = v;
      sbSet.evs[stat] = v;
      updateEVTotal(); updateStatPreview();
    });
  });
  updateEVTotal();
}

function clampEV(stat, val) {
  val = Math.max(0, Math.min(252, Math.round(val / 4) * 4));
  const total = getTotalEVs();
  const remaining = 508 - (total - (sbSet.evs[stat] || 0));
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

// ─── Moves Grid com Picker ────────────────────
function renderMovesGrid() {
  const grid = document.getElementById('sb-moves-grid');
  grid.innerHTML = '';

  for (let i = 0; i < 4; i++) {
    const moveName = sbSet.moves[i] || '';
    const row = document.createElement('div');
    row.className = 'move-slot';
    row.dataset.idx = i;
    row.innerHTML = `
      <div class="move-slot-num">${i + 1}</div>
      <div class="move-picker-wrap" id="sb-move-wrap-${i}">
        <div class="move-selected" id="sb-move-display-${i}" data-idx="${i}">
          <div class="move-selected-left">
            <div class="move-type-chip" id="sb-move-type-${i}"></div>
            <div class="move-cat-chip"  id="sb-move-cat-${i}"></div>
            <span class="move-selected-name" id="sb-move-name-${i}">${moveName || '— Nenhum move —'}</span>
          </div>
          <div class="move-selected-right">
            <span class="move-stat-val" id="sb-move-pow-${i}"></span>
            <span class="move-stat-sep" id="sb-move-sep1-${i}"></span>
            <span class="move-stat-val" id="sb-move-acc-${i}"></span>
            <span class="move-stat-sep" id="sb-move-sep2-${i}"></span>
            <span class="move-stat-val muted" id="sb-move-pp-${i}"></span>
          </div>
          <button class="move-clear-btn" id="sb-move-clear-${i}" data-idx="${i}" title="Limpar move">×</button>
        </div>
        <div class="move-picker-dropdown hidden" id="sb-move-dropdown-${i}">
          <div class="move-search-wrap">
            <input class="move-search-input" id="sb-move-search-${i}"
                   placeholder="Buscar move..." autocomplete="off" data-idx="${i}" />
            <div class="move-filter-row">
              <button class="move-filter-btn active" data-filter="all"   data-idx="${i}">Todos</button>
              <button class="move-filter-btn" data-filter="physical" data-idx="${i}" style="color:#F08030">Físico</button>
              <button class="move-filter-btn" data-filter="special"  data-idx="${i}" style="color:#6890F0">Especial</button>
              <button class="move-filter-btn" data-filter="status"   data-idx="${i}" style="color:#78C850">Status</button>
            </div>
          </div>
          <div class="move-list" id="sb-move-list-${i}">
            <div class="move-list-loading">Carregando moves...</div>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(row);

    // Atualiza display imediato se já tem move
    if (moveName) refreshMoveDisplay(i, moveName);

    // Clique no display abre o picker
    const display = row.querySelector(`#sb-move-display-${i}`);
    display.addEventListener('click', (e) => {
      if (e.target.classList.contains('move-clear-btn')) return;
      toggleMovePicker(i);
    });

    // Botão de limpar
    row.querySelector(`#sb-move-clear-${i}`).addEventListener('click', (e) => {
      e.stopPropagation();
      sbSet.moves[i] = '';
      clearMoveDisplay(i);
      closeMovePickerDropdown();
    });

    // Search input
    const searchEl = row.querySelector(`#sb-move-search-${i}`);
    searchEl.addEventListener('input', () => {
      clearTimeout(sbMoveSearchTimer);
      sbMoveSearchTimer = setTimeout(() => renderMoveList(i, searchEl.value), 200);
    });
    searchEl.addEventListener('click', e => e.stopPropagation());

    // Filtros
    row.querySelectorAll(`.move-filter-btn[data-idx="${i}"]`).forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        row.querySelectorAll(`.move-filter-btn[data-idx="${i}"]`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderMoveList(i, searchEl.value, btn.dataset.filter);
      });
    });
  }

  // Fecha ao clicar fora
  document.addEventListener('click', handleOutsideClick);
}

function handleOutsideClick(e) {
  if (!e.target.closest('.move-picker-wrap')) closeMovePickerDropdown();
}

function toggleMovePicker(idx) {
  const isOpen = sbMovePickerSlot === idx;
  closeMovePickerDropdown();
  if (!isOpen) {
    sbMovePickerSlot = idx;
    const dropdown = document.getElementById(`sb-move-dropdown-${idx}`);
    dropdown.classList.remove('hidden');
    // Foca no search
    setTimeout(() => {
      document.getElementById(`sb-move-search-${idx}`)?.focus();
    }, 50);
    renderMoveList(idx, '', 'all');
  }
}

function closeMovePickerDropdown() {
  if (sbMovePickerSlot >= 0) {
    document.getElementById(`sb-move-dropdown-${sbMovePickerSlot}`)?.classList.add('hidden');
    sbMovePickerSlot = -1;
  }
}

// ─── Renderiza lista de moves no dropdown ─────
async function renderMoveList(slotIdx, query, filter) {
  const listEl = document.getElementById(`sb-move-list-${slotIdx}`);
  if (!listEl) return;

  // Pega o filtro ativo se não passou
  if (!filter) {
    const activeBtn = document.querySelector(`.move-filter-btn.active[data-idx="${slotIdx}"]`);
    filter = activeBtn?.dataset.filter || 'all';
  }

  const q = (query || '').toLowerCase().replace(/\s+/g, '-');

  // Filtra da lista aprendível do pokémon
  let candidates = sbLearnableMoves
    .filter(m => !q || m.name.includes(q) || m.name.replace(/-/g,' ').includes(q))
    .slice(0, 60);

  listEl.innerHTML = '<div class="move-list-loading">Carregando...</div>';

  // Busca dados dos moves em lotes
  const batch = candidates.slice(0, 30);
  const datas = await Promise.all(batch.map(m => fetchMoveData(m.name)));

  // Filtra por categoria se necessário
  let rows = batch.map((m, i) => ({ move: m, data: datas[i] }))
    .filter(({ data }) => data && (filter === 'all' || data.category === filter));

  if (!rows.length) {
    listEl.innerHTML = `<div class="move-list-empty">Nenhum move encontrado.</div>`;
    return;
  }

  listEl.innerHTML = '';
  rows.forEach(({ move, data }) => {
    const typeColor = TYPE_COLORS[data.type] || '#888';
    const catColor  = DAMAGE_CLASS_COLOR[data.category] || '#888';
    const catLabel  = DAMAGE_CLASS_LABEL[data.category] || '?';
    const pow = data.power    ? `<span class="mi-pow">${data.power}</span>` : `<span class="mi-pow muted">—</span>`;
    const acc = data.accuracy ? `<span class="mi-acc">${data.accuracy}%</span>` : `<span class="mi-acc muted">—</span>`;
    const pp  = data.pp       ? `<span class="mi-pp muted">${data.pp}PP</span>` : '';

    const item = document.createElement('div');
    item.className = 'move-list-item';
    item.innerHTML = `
      <span class="mi-type-badge" style="background:${typeColor}">${data.type}</span>
      <span class="mi-cat-badge"  style="background:${catColor}">${catLabel}</span>
      <span class="mi-name">${data.label}</span>
      <div class="mi-stats">
        ${pow}
        ${acc}
        ${pp}
      </div>
    `;
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      selectMove(slotIdx, data.label, data);
    });
    listEl.appendChild(item);
  });
}

// ─── Seleciona move ───────────────────────────
function selectMove(slotIdx, moveName, data) {
  sbSet.moves[slotIdx] = moveName;
  refreshMoveDisplay(slotIdx, moveName, data);
  closeMovePickerDropdown();
}

// ─── Atualiza display do move selecionado ─────
async function refreshMoveDisplay(slotIdx, moveName, data) {
  if (!data) data = await fetchMoveData(moveName);

  const nameEl = document.getElementById(`sb-move-name-${slotIdx}`);
  const typeEl = document.getElementById(`sb-move-type-${slotIdx}`);
  const catEl  = document.getElementById(`sb-move-cat-${slotIdx}`);
  const powEl  = document.getElementById(`sb-move-pow-${slotIdx}`);
  const accEl  = document.getElementById(`sb-move-acc-${slotIdx}`);
  const ppEl   = document.getElementById(`sb-move-pp-${slotIdx}`);
  const sep1   = document.getElementById(`sb-move-sep1-${slotIdx}`);
  const sep2   = document.getElementById(`sb-move-sep2-${slotIdx}`);

  if (!nameEl) return;

  if (!data) {
    nameEl.textContent = moveName;
    return;
  }

  const typeColor = TYPE_COLORS[data.type] || '#888';
  const catColor  = DAMAGE_CLASS_COLOR[data.category] || '#888';
  const catLabel  = DAMAGE_CLASS_LABEL[data.category] || '?';

  nameEl.textContent = data.label || moveName;
  typeEl.innerHTML = `<span style="background:${typeColor}" class="mi-type-badge-sm">${data.type}</span>`;
  catEl.innerHTML  = `<span style="background:${catColor};color:#fff;font-size:8px;padding:1px 4px;border-radius:2px;font-family:var(--mono)">${catLabel}</span>`;

  if (data.power) {
    powEl.textContent = `${data.power}`;
    powEl.title = 'Poder';
    sep1.textContent = '·';
  } else {
    powEl.textContent = ''; sep1.textContent = '';
  }
  if (data.accuracy) {
    accEl.textContent = `${data.accuracy}%`;
    accEl.title = 'Acurácia';
    sep2.textContent = '·';
  } else {
    accEl.textContent = ''; sep2.textContent = '';
  }
  ppEl.textContent = data.pp ? `${data.pp}PP` : '';
}

function clearMoveDisplay(slotIdx) {
  const nameEl = document.getElementById(`sb-move-name-${slotIdx}`);
  const typeEl = document.getElementById(`sb-move-type-${slotIdx}`);
  const catEl  = document.getElementById(`sb-move-cat-${slotIdx}`);
  const powEl  = document.getElementById(`sb-move-pow-${slotIdx}`);
  const accEl  = document.getElementById(`sb-move-acc-${slotIdx}`);
  const ppEl   = document.getElementById(`sb-move-pp-${slotIdx}`);
  const sep1   = document.getElementById(`sb-move-sep1-${slotIdx}`);
  const sep2   = document.getElementById(`sb-move-sep2-${slotIdx}`);
  if (nameEl) nameEl.textContent = '— Nenhum move —';
  if (typeEl) typeEl.innerHTML = '';
  if (catEl)  catEl.innerHTML  = '';
  if (powEl)  powEl.textContent = '';
  if (accEl)  accEl.textContent = '';
  if (ppEl)   ppEl.textContent  = '';
  if (sep1)   sep1.textContent  = '';
  if (sep2)   sep2.textContent  = '';
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

    let final;
    if (key === 'hp') {
      final = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
    } else {
      let val = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
      if (nat && nat.up   === key) val = Math.floor(val * 1.1);
      if (nat && nat.down === key) val = Math.floor(val * 0.9);
      final = val;
    }

    const label  = STAT_LABELS[key] || key;
    const color  = statColor(base);
    const pct    = Math.round((base / 255) * 100);
    const natMark = nat
      ? (nat.up   === key ? '<span style="color:#c8ff00;font-size:9px"> ▲</span>'
       : nat.down === key ? '<span style="color:#ff6b35;font-size:9px"> ▼</span>' : '')
      : '';

    const row = document.createElement('div');
    row.className = 'sb-stat-row';
    row.innerHTML = `
      <div class="sb-stat-label">${label}${natMark}</div>
      <div class="sb-stat-base-val">${base}</div>
      <div class="sb-stat-track"><div class="sb-stat-fill" style="width:${pct}%;background:${color}"></div></div>
      <div class="sb-stat-final-val">${final}</div>
    `;
    container.appendChild(row);
  });
}

// ─── Format Tabs ─────────────────────────────
function renderFormatTabs() {
  const tabs = document.getElementById('sb-format-tabs');
  tabs.innerHTML = SB_FORMATS.map(f =>
    `<button class="sb-format-tab ${f.key === sbBuildFmt ? 'active' : ''}" data-fmt="${f.key}">${f.label}</button>`
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

// ─── Builds do Smogon ─────────────────────────
async function loadBuilds(fmt) {
  const pname    = sbPokemon.name.toLowerCase().replace(/-/g, '');
  const cacheKey = `${fmt}:${pname}`;
  const list     = document.getElementById('sb-builds-list');

  if (sbBuildsCache[cacheKey]) { renderBuilds(sbBuildsCache[cacheKey]); return; }
  list.innerHTML = '<div class="sb-build-loading">Buscando builds...</div>';

  try {
    const url  = `https://smogon.com/dex/api/analyses/${sbPokemon.name.toLowerCase()}/${fmt}/`;
    const r    = await fetch(url);
    if (!r.ok) throw new Error('not found');
    const data = await r.json();
    const builds = parseSmogonData(data);
    sbBuildsCache[cacheKey] = builds;
    renderBuilds(builds);
  } catch {
    const builds = generateFallbackBuilds(sbPokemon);
    sbBuildsCache[cacheKey] = builds;
    renderBuilds(builds);
  }
}

function parseSmogonData(data) {
  const builds = [];
  (data?.strategies || []).forEach(strat => {
    (strat.sets || []).forEach(set => {
      builds.push({
        name:    set.name || strat.name || 'Unnamed',
        item:    Array.isArray(set.item)      ? set.item[0]      : (set.item    || ''),
        ability: Array.isArray(set.ability)   ? set.ability[0]   : (set.ability || ''),
        nature:  Array.isArray(set.nature)    ? set.nature[0]    : (set.nature  || ''),
        evs:     set.evs || {},
        moves:   (set.moveslots || []).map(slot => Array.isArray(slot) ? slot[0] : (slot || '')).filter(Boolean).slice(0,4),
        tera:    Array.isArray(set.teratype)  ? set.teratype[0]  : (set.teratype || ''),
      });
    });
  });
  return builds;
}

function generateFallbackBuilds(pokemon) {
  const { nature, evs, role } = suggestNatureAndEVs(pokemon);
  const moves    = suggestMoves(pokemon, role);
  const types    = pokemon.types.map(t => t.type.name);
  const stats    = {};
  pokemon.stats.forEach(s => { stats[s.stat.name] = s.base_stat; });
  const isPhys   = (stats['attack'] || 0) >= (stats['special-attack'] || 0);
  const ability  = pokemon.abilities?.[0]?.ability?.name || '';

  const builds = [
    { name: role, item: 'Life Orb', ability, nature, evs: parseEVString(evs), moves: moves.map(m => m.replace('- ','')), tera: types[0] },
    { name: isPhys ? 'Choice Scarf' : 'Choice Specs', item: isPhys ? 'Choice Scarf' : 'Choice Specs', ability,
      nature: isPhys ? 'jolly' : 'timid',
      evs: parseEVString(isPhys ? '252 Atk / 4 Def / 252 Spe' : '252 SpA / 4 Def / 252 Spe'),
      moves: moves.map(m => m.replace('- ','')), tera: types[0] },
  ];

  const defTotal = (stats['defense']||0) + (stats['special-defense']||0) + (stats['hp']||0);
  if (defTotal > 220) {
    builds.push({ name: 'Defensive', item: 'Leftovers', ability,
      nature: isPhys ? 'impish' : 'calm',
      evs: parseEVString('252 HP / 252 Def / 4 SpD'),
      moves: [moves[0].replace('- ',''), 'Protect', 'Stealth Rock', 'Roost'],
      tera: types[0] });
  }
  return builds;
}

function renderBuilds(builds) {
  const list = document.getElementById('sb-builds-list');
  if (!builds.length) {
    list.innerHTML = `<div class="sb-build-empty">Nenhuma build encontrada.<br><span style="font-size:11px;opacity:.5">Tente outro formato.</span></div>`;
    return;
  }
  list.innerHTML = '';
  builds.forEach(build => {
    const card   = document.createElement('div');
    card.className = 'sb-build-card';
    const evStr  = formatEVString(build.evs);
    const tera   = build.tera ? `<span>Tera: ${capitalize(build.tera)}</span>` : '';
    card.innerHTML = `
      <div class="sb-build-name">${build.name}</div>
      <div class="sb-build-meta">
        ${build.item    ? `<span>@ ${capitalize(build.item)}</span>`   : ''}
        ${build.ability ? `<span>${capitalize(build.ability)}</span>`   : ''}
        ${build.nature  ? `<span>${capitalize(build.nature)}</span>`    : ''}
        ${tera}
      </div>
      <div class="sb-build-meta" style="margin-bottom:6px">
        ${evStr ? `<span style="border-color:rgba(200,255,0,.2);color:rgba(200,255,0,.6)">${evStr}</span>` : ''}
      </div>
      <div class="sb-build-moves">
        ${(build.moves || []).map(m => `<div class="sb-build-move">· ${m}</div>`).join('')}
      </div>`;
    card.addEventListener('click', () => {
      applyBuild(build);
      list.querySelectorAll('.sb-build-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
    list.appendChild(card);
  });
}

function applyBuild(build) {
  sbSet.nature  = (build.nature  || sbSet.nature).toLowerCase();
  sbSet.item    = build.item    || sbSet.item;
  sbSet.ability = build.ability || sbSet.ability;
  sbSet.moves   = [...(build.moves || [])];
  if (build.evs)  sbSet.evs  = { ...build.evs };
  if (build.tera) sbSet.tera = build.tera.toLowerCase();

  document.getElementById('sb-item').value = sbSet.item;

  const abilSelect = document.getElementById('sb-ability');
  if (Array.from(abilSelect.options).some(o => o.value === sbSet.ability)) {
    abilSelect.value = sbSet.ability;
  }

  document.querySelectorAll('.nature-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.nature === sbSet.nature);
  });
  document.querySelectorAll('.tera-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tera === sbSet.tera);
  });

  renderEVGrid();

  // Re-renderiza moves com displays atualizados
  sbSet.moves.forEach((m, i) => {
    clearMoveDisplay(i);
    if (m) refreshMoveDisplay(i, m);
    const nameEl = document.getElementById(`sb-move-name-${i}`);
    if (nameEl && !document.getElementById(`sb-move-type-${i}`)?.innerHTML) {
      nameEl.textContent = m || '— Nenhum move —';
    }
  });

  updateStatPreview();
  showToast('Build aplicada!');
}

// ─── Salva o set ──────────────────────────────
function saveSet() {
  sbSet.nickname = document.getElementById('sb-nickname').value.trim();
  sbSet.item     = document.getElementById('sb-item').value.trim();
  sbSet.ability  = document.getElementById('sb-ability').value;
  // moves já estão em sbSet.moves atualizados pelo picker

  teamSets[sbPokemon.id] = JSON.parse(JSON.stringify(sbSet));
  saveTeamToStorage();
  closeSetBuilder();
  showToast('Set salvo!');
}

// ─── Helpers ─────────────────────────────────
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
  return STAT_ORDER.filter(s => (evs[s] || 0) > 0).map(s => `${evs[s]} ${map[s]}`).join(' / ');
}

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sb-back').addEventListener('click', () => {
    if (confirm('Descartar alterações?')) closeSetBuilder();
  });
  document.getElementById('sb-save').addEventListener('click', saveSet);
});