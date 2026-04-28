// =============================================
// teambuilder.js — Lógica principal (v3)
// =============================================

const POKEAPI   = 'https://pokeapi.co/api/v2';
const SPRITE    = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const SPRITE_HD = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
const LS_KEY    = 'poketeam_v2';

// ─── Estado global ───────────────────────────
let team          = [];
let teamSets      = {};  // { pokemonId: { nature, evs, moves, item, ability, tera, nickname } }
let format        = 'gen9ou';
let searchTimeout = null;
let pokeListCache = null;
let offMapCache   = {};

// ─── Init ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadTeamFromStorage();
  setupEvents();
  preloadPokeList();
});

// ─── Persistência ────────────────────────────
function saveTeamToStorage() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      ids:  team.map(p => p.id),
      sets: teamSets,
    }));
  } catch(e) { console.warn('localStorage indisponível'); }
}

async function loadTeamFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!saved?.ids?.length) return;

    teamSets = saved.sets || {};
    showToast('Carregando time salvo...');

    const results = await Promise.allSettled(
      saved.ids.map(id => fetch(`${POKEAPI}/pokemon/${id}`).then(r => r.json()))
    );
    results.forEach(r => {
      if (r.status === 'fulfilled' && r.value?.id) team.push(r.value);
    });
    renderTeamGrid();
    analyzeTeam();
  } catch(e) { console.warn('Erro ao carregar time:', e); }
}

// ─── Setup de Eventos ────────────────────────
function setupEvents() {
  const input   = document.getElementById('search-input');
  const btn     = document.getElementById('search-btn');
  const results = document.getElementById('search-results');

  input.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const q = input.value.trim();
    if (!q) { results.classList.add('hidden'); return; }
    searchTimeout = setTimeout(() => searchPokemon(q), 350);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { clearTimeout(searchTimeout); searchPokemon(input.value.trim()); }
    if (e.key === 'Escape') results.classList.add('hidden');
  });

  btn.addEventListener('click', () => {
    clearTimeout(searchTimeout);
    searchPokemon(document.getElementById('search-input').value.trim());
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.search-panel')) results.classList.add('hidden');
  });

  document.getElementById('format-select').addEventListener('change', e => {
    format = e.target.value;
  });

  document.getElementById('export-btn').addEventListener('click', openExportModal);
  document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('export-modal').classList.add('hidden');
  });
  document.getElementById('copy-btn').addEventListener('click', () => {
    const ta = document.getElementById('export-text');
    navigator.clipboard.writeText(ta.value).then(() => {
      const b = document.getElementById('copy-btn');
      b.textContent = 'Copiado!';
      setTimeout(() => b.textContent = 'Copiar', 1500);
    });
  });

  document.getElementById('clear-btn').addEventListener('click', () => {
    if (!team.length) return;
    if (confirm('Limpar o time?')) {
      team = []; teamSets = {}; offMapCache = {};
      saveTeamToStorage();
      renderTeamGrid();
      analyzeTeam();
    }
  });

  document.getElementById('poke-modal-close').addEventListener('click', () => {
    document.getElementById('poke-modal').classList.add('hidden');
  });
  document.getElementById('poke-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
  });
  document.getElementById('export-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
  });
}

// ─── Pre-carrega lista ───────────────────────
async function preloadPokeList() {
  try {
    const r = await fetch(`${POKEAPI}/pokemon?limit=1302`);
    const d = await r.json();
    pokeListCache = d.results;
  } catch(e) { console.warn('Falha pré-carga:', e); }
}

// ─── Busca ───────────────────────────────────
async function searchPokemon(q) {
  if (!q) return;
  const results = document.getElementById('search-results');
  results.classList.remove('hidden');
  results.innerHTML = `<div class="result-msg">Buscando...</div>`;

  try {
    const numQuery = /^\d+$/.test(q) ? q : null;
    const direct   = await fetch(`${POKEAPI}/pokemon/${numQuery || q.toLowerCase()}`);
    if (direct.ok) { renderResults([await direct.json()]); return; }

    if (pokeListCache) {
      const matches = pokeListCache.filter(p => p.name.includes(q.toLowerCase())).slice(0, 12);
      if (!matches.length) {
        results.innerHTML = `<div class="result-msg">Nenhum Pokémon encontrado para "${q}"</div>`;
        return;
      }
      renderResults(await Promise.all(matches.map(m => fetch(m.url).then(r => r.json()))));
    } else {
      results.innerHTML = `<div class="result-msg">Lista carregando, tente em instantes.</div>`;
    }
  } catch(e) {
    results.innerHTML = `<div class="result-msg">Erro ao buscar. Verifique sua conexão.</div>`;
  }
}

function renderResults(list) {
  const results = document.getElementById('search-results');
  results.innerHTML = '';
  list.forEach(p => {
    const types = p.types.map(t => t.type.name);
    const item  = document.createElement('div');
    item.className = 'result-item';
    item.innerHTML = `
      <img src="${SPRITE(p.id)}" alt="${p.name}" loading="lazy" />
      <div class="result-info">
        <div class="result-name">#${String(p.id).padStart(3,'0')} ${p.name}</div>
        <div class="result-types">${types.map(t => typeBadge(t)).join('')}</div>
      </div>`;
    item.addEventListener('click', () => addToTeam(p));
    results.appendChild(item);
  });
}

// ─── Gerenciamento do Time ───────────────────
function addToTeam(pokemon) {
  if (team.length >= 6)               { showToast('Time cheio! Remova um Pokémon primeiro.'); return; }
  if (team.find(p => p.id === pokemon.id)) { showToast(`${pokemon.name} já está no time!`); return; }
  team.push(pokemon);
  offMapCache = {};
  document.getElementById('search-results').classList.add('hidden');
  document.getElementById('search-input').value = '';
  saveTeamToStorage();
  renderTeamGrid();
  analyzeTeam();
}

function removeFromTeam(id) {
  team = team.filter(p => p.id !== id);
  delete teamSets[id];
  offMapCache = {};
  saveTeamToStorage();
  renderTeamGrid();
  analyzeTeam();
}

// ─── Renderiza Grid do Time ──────────────────
function renderTeamGrid() {
  const grid  = document.getElementById('team-grid');
  const badge = document.getElementById('team-count-badge');
  badge.textContent = `${team.length} / 6`;
  grid.innerHTML = '';

  for (let i = 0; i < 6; i++) {
    const slot = document.createElement('div');
    if (i < team.length) {
      const p     = team[i];
      const types = p.types.map(t => t.type.name);
      const hasSet = !!teamSets[p.id];
      slot.className = 'team-slot filled';
      slot.innerHTML = `
        <button class="slot-remove" title="Remover" data-id="${p.id}">✕</button>
        <img class="slot-sprite" src="${SPRITE(p.id)}" alt="${p.name}" loading="lazy" />
        <div class="slot-name">${p.name}</div>
        <div class="slot-types">${types.map(t => typeBadge(t, true)).join('')}</div>
        <button class="slot-edit-btn ${hasSet ? 'has-set' : ''}" title="Editar set" data-idx="${i}">✎</button>
        <button class="slot-detail-btn" title="Ver detalhes" data-id="${p.id}">i</button>
      `;
      slot.querySelector('.slot-remove').addEventListener('click', e => {
        e.stopPropagation();
        removeFromTeam(parseInt(e.currentTarget.dataset.id));
      });
      slot.querySelector('.slot-edit-btn').addEventListener('click', e => {
        e.stopPropagation();
        openSetBuilder(p, parseInt(e.currentTarget.dataset.idx));
      });
      slot.querySelector('.slot-detail-btn').addEventListener('click', e => {
        e.stopPropagation();
        openPokeModal(p);
      });
    } else {
      slot.className = 'team-slot empty';
      slot.innerHTML = `<div class="slot-empty-icon">+</div><div class="slot-empty-text">VAZIO</div>`;
      slot.addEventListener('click', () => document.getElementById('search-input').focus());
    }
    slot.style.animationDelay = `${i * 0.05}s`;
    grid.appendChild(slot);
  }
}

// ─── Análise do Time ─────────────────────────
async function analyzeTeam() {
  const empty = `<div class="result-msg">Adicione Pokémon ao time</div>`;
  if (!team.length) {
    document.getElementById('offensive-chart').innerHTML  = empty;
    document.getElementById('defensive-chart').innerHTML  = empty;
    document.getElementById('resist-chart').innerHTML     = empty;
    document.getElementById('tips-list').innerHTML        = empty;
    document.getElementById('stats-grid').innerHTML       = '';
    updateOffensiveLabel(false);
    return;
  }

  const weakMap = {}, resistMap = {}, immuneMap = {};
  ALL_TYPES.forEach(t => { weakMap[t] = 0; resistMap[t] = 0; immuneMap[t] = 0; });

  team.forEach(p => {
    const defTypes = p.types.map(t => t.type.name);
    ALL_TYPES.forEach(atk => {
      const m = getDefensiveMult(atk, defTypes);
      if (m === 0)       immuneMap[atk]++;
      else if (m >= 2)   weakMap[atk]++;
      else if (m <= 0.5) resistMap[atk]++;
    });
  });

  renderTypeChart('defensive-chart', weakMap);
  renderTypeChart('resist-chart', resistMap);
  renderTips(weakMap, resistMap, immuneMap, null);
  renderStatCards();

  updateOffensiveLabel(true);
  document.getElementById('offensive-chart').innerHTML =
    `<div class="result-msg" style="font-size:12px">Analisando movesets...</div>`;

  try {
    const offMap = await calcRealOffensiveCoverage(team);
    offMapCache  = offMap;
    updateOffensiveLabel(false);
    renderTypeChart('offensive-chart', offMap);
    renderTips(weakMap, resistMap, immuneMap, offMap);
  } catch(e) {
    document.getElementById('offensive-chart').innerHTML =
      `<div class="result-msg" style="font-size:12px">Erro ao analisar movesets.</div>`;
    updateOffensiveLabel(false);
  }
}

function updateOffensiveLabel(loading) {
  const sub = document.querySelector('#offensive-card .analysis-sub');
  if (!sub) return;
  sub.innerHTML = loading
    ? `Analisando movesets reais <span style="color:var(--accent);font-family:var(--mono);font-size:10px">(buscando…)</span>`
    : 'Tipos que seu time pode acertar em super-efetivo (moveset real)';
}

function renderTypeChart(elId, map) {
  const el = document.getElementById(elId);
  el.innerHTML = '';
  const entries = Object.entries(map).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]).slice(0,12);
  if (!entries.length) {
    el.innerHTML = `<div class="result-msg" style="font-size:12px;padding:8px 0">Nenhum dado</div>`;
    return;
  }
  const maxVal = entries[0][1];
  entries.forEach(([type, count]) => {
    const pct   = Math.round((count / Math.max(maxVal,1)) * 100);
    const color = TYPE_COLORS[type] || '#888';
    const row   = document.createElement('div');
    row.className = 'type-row';
    row.innerHTML = `
      <div class="type-row-badge">${typeBadge(type, true)}</div>
      <div class="type-bar-track">
        <div class="type-bar-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <div class="type-count">${count}</div>`;
    el.appendChild(row);
  });
}

function renderTips(weakMap, resistMap, immuneMap, offMap) {
  const el   = document.getElementById('tips-list');
  const tips = [];
  const n    = team.length;
  if (!n) { el.innerHTML = ''; return; }

  const critWeak = ALL_TYPES.filter(t => weakMap[t] >= Math.ceil(n * 0.5));
  if (critWeak.length)
    tips.push({ type: 'warn', text: `Fraqueza crítica em <strong>${critWeak.join(', ')}</strong> — mais da metade do time é vulnerável.` });

  const immuneTypes = ALL_TYPES.filter(t => immuneMap[t] > 0);
  if (immuneTypes.length)
    tips.push({ type: 'ok', text: `Imunidade a: <strong>${immuneTypes.join(', ')}</strong>` });

  if (offMap) {
    const noOffense = ALL_TYPES.filter(t => (offMap[t]||0) === 0 && weakMap[t] > 0);
    if (noOffense.length)
      tips.push({ type: 'warn', text: `Sem cobertura nos tipos que te ameaçam: <strong>${noOffense.join(', ')}</strong>` });
    else
      tips.push({ type: 'ok', text: `Cobertura ofensiva sólida para ${18 - ALL_TYPES.filter(t=>(offMap[t]||0)===0).length} tipos.` });
  } else {
    tips.push({ type: 'info', text: 'Analisando movesets reais...' });
  }

  const noResist = ALL_TYPES.filter(t => weakMap[t] > 0 && resistMap[t] === 0 && immuneMap[t] === 0);
  if (noResist.length > 4)
    tips.push({ type: 'warn', text: `Resistências limitadas: ${noResist.slice(0,5).join(', ')}...` });

  tips.push({ type: 'info', text: n === 6
    ? `Time completo. Use <strong>↗ Showdown</strong> para exportar.`
    : `Adicione mais ${6-n} Pokémon para completar o time.` });

  el.innerHTML = tips.map(t => `<div class="tip-item tip-${t.type}">${t.text}</div>`).join('');
}

function renderStatCards() {
  const grid = document.getElementById('stats-grid');
  grid.innerHTML = '';
  team.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.style.animationDelay = `${i*0.06}s`;
    const statsHtml = p.stats.map(s => {
      const label = STAT_LABELS[s.stat.name] || s.stat.name.toUpperCase().slice(0,3);
      const val   = s.base_stat;
      const pct   = Math.round((val/255)*100);
      return `<div class="stat-line">
        <div class="stat-key">${label}</div>
        <div class="stat-mini-track"><div class="stat-mini-fill" style="width:${pct}%;background:${statColor(val)}"></div></div>
        <div class="stat-val">${val}</div>
      </div>`;
    }).join('');
    card.innerHTML = `<div class="stat-card-name">${p.name}</div><div class="stat-bars">${statsHtml}</div>`;
    card.addEventListener('click', () => openPokeModal(p));
    grid.appendChild(card);
  });
}

// ─── Modal de Detalhes ───────────────────────
function openPokeModal(p) {
  const types   = p.types.map(t => t.type.name);
  const modal   = document.getElementById('poke-modal');
  const content = document.getElementById('poke-modal-content');

  const defRows = ALL_TYPES.map(atk => {
    const m = getDefensiveMult(atk, types);
    if (m === 1) return null;
    return { atk, label: m === 0 ? '0×' : `${m}×`, cls: m===0?'immune':m<1?'resist':'weak' };
  }).filter(Boolean);

  const defHtml = defRows.length ? `
    <div class="poke-def-grid">${defRows.map(r => `
      <div class="poke-def-chip poke-def-${r.cls}">
        <span class="poke-def-type">${r.atk}</span>
        <span class="poke-def-mult">${r.label}</span>
      </div>`).join('')}</div>` : '';

  const totalBST = p.stats.reduce((a,s) => a+s.base_stat, 0);
  const { nature, evs, role } = suggestNatureAndEVs(p);
  const moves = suggestMoves(p, role);

  content.innerHTML = `
    <div class="poke-detail-header">
      <img class="poke-detail-sprite" src="${SPRITE_HD(p.id)}" onerror="this.src='${SPRITE(p.id)}'" alt="${p.name}" />
      <div class="poke-detail-info">
        <div class="poke-detail-id">#${String(p.id).padStart(3,'0')}</div>
        <h2>${p.name}</h2>
        <div class="poke-detail-types">${types.map(t => typeBadge(t)).join('')}</div>
        <div class="poke-role-tag">${role}</div>
      </div>
    </div>
    <div class="poke-stats-title">BASE STATS — BST ${totalBST}</div>
    ${p.stats.map(s => {
      const val = s.base_stat;
      const pct = Math.round((val/255)*100);
      return `<div class="poke-stat-row">
        <div class="poke-stat-label">${STAT_LABELS[s.stat.name]||s.stat.name}</div>
        <div class="poke-stat-track"><div class="poke-stat-fill" style="width:${pct}%;background:${statColor(val)}"></div></div>
        <div class="poke-stat-val">${val}</div>
      </div>`;
    }).join('')}
    <div class="poke-section-title">FRAQUEZAS / RESISTÊNCIAS</div>
    ${defHtml}
    <div class="poke-abilities">
      <div class="poke-abilities-title">HABILIDADES</div>
      ${(p.abilities||[]).map(a => `<span class="${a.is_hidden?'ability-chip hidden-ability':'ability-chip'}">${a.ability.name}${a.is_hidden?' (hidden)':''}</span>`).join('') || '—'}
    </div>
  `;
  modal.classList.remove('hidden');
}

// ─── Export Showdown ─────────────────────────
function openExportModal() {
  if (!team.length) { showToast('Adicione Pokémon antes de exportar.'); return; }

  const paste = team.map(p => {
    const saved = teamSets[p.id];
    const types = p.types.map(t => t.type.name);

    let name, ability, nature, evs, moves, item, tera;

    if (saved) {
      name    = saved.nickname
                  ? `${capitalize(saved.nickname)} (${capitalize(p.name)})`
                  : capitalize(p.name);
      item    = saved.item    ? ` @ ${capitalize(saved.item)}` : '';
      ability = capitalize(saved.ability || p.abilities?.[0]?.ability?.name || 'Ability');
      nature  = capitalize(saved.nature);
      tera    = capitalize(saved.tera || types[0]);
      evs     = formatEVStringForExport(saved.evs);
      moves   = (saved.moves || []).filter(Boolean).map(m => `- ${m}`);
    } else {
      const sugg = suggestNatureAndEVs(p);
      name    = capitalize(p.name);
      item    = '';
      ability = capitalize(p.abilities?.[0]?.ability?.name || 'Ability');
      nature  = capitalize(sugg.nature);
      tera    = capitalize(types[0]);
      evs     = sugg.evs;
      moves   = suggestMoves(p, sugg.role);
    }

    return `${name}${item}
Ability: ${ability}
Level: 50
Tera Type: ${tera}
EVs: ${evs}
${nature} Nature
${Array.isArray(moves) ? moves.join('\n') : moves}`;
  }).join('\n\n');

  document.getElementById('export-text').value = paste;
  document.getElementById('export-modal').classList.remove('hidden');
}

function formatEVStringForExport(evs) {
  if (!evs) return '252 Atk / 4 Def / 252 Spe';
  const map = { 'attack':'Atk','defense':'Def','special-attack':'SpA','special-defense':'SpD','speed':'Spe','hp':'HP' };
  const parts = ['hp','attack','defense','special-attack','special-defense','speed']
    .filter(s => (evs[s]||0) > 0)
    .map(s => `${evs[s]} ${map[s]}`);
  return parts.join(' / ') || '4 Def';
}

// ─── Helpers ─────────────────────────────────
function typeBadge(type, small = false) {
  const color = TYPE_COLORS[type] || '#888';
  const size  = small ? 'font-size:9px;padding:1px 5px' : '';
  return `<span class="type-badge" style="background:${color};${size}">${type}</span>`;
}

function capitalize(str) {
  if (!str) return '';
  return str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function showToast(msg) {
  let t = document.getElementById('__toast');
  if (!t) {
    t = document.createElement('div');
    t.id = '__toast';
    t.style.cssText = `
      position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
      background:var(--bg4);border:1px solid var(--border2);border-radius:6px;
      color:var(--text);font-family:var(--mono);font-size:11px;letter-spacing:.04em;
      padding:10px 18px;z-index:9999;white-space:nowrap;transition:opacity .2s;pointer-events:none;
    `;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t.__timeout);
  t.__timeout = setTimeout(() => t.style.opacity = '0', 2500);
}