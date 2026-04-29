// =============================================
// teambuilder.js — v4 (roles, hazards, threats)
// =============================================

const POKEAPI   = 'https://pokeapi.co/api/v2';
const BACKEND   = 'http://localhost:5000/api';  // Flask backend
const SPRITE    = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const SPRITE_HD = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
const LS_KEY    = 'poketeam_v2';

// ─── Estado global ───────────────────────────
let team          = [];
let teamSets      = {};
let format        = 'gen9ou';
let searchTimeout = null;
let pokeListCache = null;
let offMapCache   = {};
let backendOnline = false;

// ─── Habilidades com imunidade por tipo ──────
const ABILITY_IMMUNITIES = {
  'levitate':        'ground',
  'flash-fire':      'fire',
  'water-absorb':    'water',
  'volt-absorb':     'electric',
  'lightning-rod':   'electric',
  'storm-drain':     'water',
  'sap-sipper':      'grass',
  'earth-eater':     'ground',
  'well-baked-body': 'fire',
  'wind-rider':      'flying',
  'dry-skin':        'water',
  'motor-drive':     'electric',
};

const ABILITY_HALF = {
  'thick-fat':  ['fire','ice'],
  'heatproof':  ['fire'],
  'fluffy':     ['fire'],
  'purifying-salt': ['ghost'],
};

// ─── Move keywords para detecção de role ─────
const ROLE_MOVES = {
  hazard_setter:  ['stealth-rock','stealth rock','spikes','toxic-spikes','toxic spikes','sticky-web','sticky web'],
  hazard_removal: ['defog','rapid-spin','rapid spin','court-change','court change','mortal-spin','mortal spin'],
  pivot:          ['u-turn','u turn','volt-switch','volt switch','flip-turn','flip turn','parting-shot','parting shot','teleport','baton-pass','baton pass'],
  setup_sweeper:  ['dragon-dance','dragon dance','swords-dance','swords dance','nasty-plot','nasty plot','calm-mind','calm mind','bulk-up','bulk up','coil','shift-gear','shift gear','quiver-dance','quiver dance','shell-smash','shell smash'],
  priority:       ['aqua-jet','aqua jet','bullet-punch','bullet punch','extreme-speed','extremespeed','shadow-sneak','shadow sneak','quick-attack','quick attack','first-impression','first impression','sucker-punch','sucker punch','mach-punch','mach punch','ice-shard','ice shard','grassy-glide','grassy glide'],
  trick_room:     ['trick-room','trick room'],
  status_spreader:['will-o-wisp','will o wisp','thunder-wave','thunder wave','toxic','spore','sleep-powder','sleep powder','glare','nuzzle','yawn'],
  cleric:         ['wish','heal-bell','heal bell','aromatherapy'],
  phazer:         ['roar','whirlwind','dragon-tail','dragon tail','circle-throw','circle throw'],
  recovery:       ['recover','roost','moonlight','morning-sun','synthesis','slack-off','soft-boiled','shore-up','shore up','jungle-healing','jungle healing'],
};

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await checkBackend();
  loadTeamFromStorage();
  setupEvents();
  preloadPokeList();
});

async function checkBackend() {
  try {
    const r = await fetch(`${BACKEND}/health`, { signal: AbortSignal.timeout(1500) });
    backendOnline = r.ok;
  } catch { backendOnline = false; }
  const indicator = document.getElementById('backend-indicator');
  if (indicator) {
    indicator.textContent  = backendOnline ? '● Backend online' : '○ Backend offline';
    indicator.style.color  = backendOnline ? 'var(--accent)' : 'var(--muted)';
  }
}

// ─── Persistência ────────────────────────────
function saveTeamToStorage() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ ids: team.map(p => p.id), sets: teamSets }));
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
    results.forEach(r => { if (r.status === 'fulfilled' && r.value?.id) team.push(r.value); });
    renderTeamGrid();
    analyzeTeam();
  } catch(e) { console.warn('Erro ao carregar time:', e); }
}

// ─── Eventos ─────────────────────────────────
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
  btn.addEventListener('click', () => { clearTimeout(searchTimeout); searchPokemon(input.value.trim()); });
  document.addEventListener('click', e => { if (!e.target.closest('.search-panel')) results.classList.add('hidden'); });

  document.getElementById('format-select').addEventListener('change', e => { format = e.target.value; });

  document.getElementById('export-btn').addEventListener('click', openExportModal);
  document.getElementById('modal-close').addEventListener('click', () => document.getElementById('export-modal').classList.add('hidden'));
  document.getElementById('copy-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(document.getElementById('export-text').value).then(() => {
      const b = document.getElementById('copy-btn');
      b.textContent = 'Copiado!';
      setTimeout(() => b.textContent = 'Copiar', 1500);
    });
  });
  document.getElementById('clear-btn').addEventListener('click', () => {
    if (!team.length || !confirm('Limpar o time?')) return;
    team = []; teamSets = {}; offMapCache = {};
    saveTeamToStorage(); renderTeamGrid(); analyzeTeam();
  });
  document.getElementById('poke-modal-close').addEventListener('click', () => document.getElementById('poke-modal').classList.add('hidden'));
  document.getElementById('poke-modal').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden'); });
  document.getElementById('export-modal').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden'); });
}

async function preloadPokeList() {
  try {
    const r = await fetch(`${POKEAPI}/pokemon?limit=1302`);
    pokeListCache = (await r.json()).results;
  } catch(e) { console.warn('Falha pré-carga:', e); }
}

// ─── Busca ────────────────────────────────────
async function searchPokemon(q) {
  if (!q) return;
  const results = document.getElementById('search-results');
  results.classList.remove('hidden');
  results.innerHTML = `<div class="result-msg">Buscando...</div>`;
  try {
    const direct = await fetch(`${POKEAPI}/pokemon/${/^\d+$/.test(q) ? q : q.toLowerCase()}`);
    if (direct.ok) { renderResults([await direct.json()]); return; }
    if (pokeListCache) {
      const matches = pokeListCache.filter(p => p.name.includes(q.toLowerCase())).slice(0, 12);
      if (!matches.length) { results.innerHTML = `<div class="result-msg">Nenhum Pokémon encontrado para "${q}"</div>`; return; }
      renderResults(await Promise.all(matches.map(m => fetch(m.url).then(r => r.json()))));
    }
  } catch { results.innerHTML = `<div class="result-msg">Erro ao buscar.</div>`; }
}

function renderResults(list) {
  const results = document.getElementById('search-results');
  results.innerHTML = '';
  list.forEach(p => {
    const item = document.createElement('div');
    item.className = 'result-item';
    item.innerHTML = `
      <img src="${SPRITE(p.id)}" alt="${p.name}" loading="lazy" />
      <div class="result-info">
        <div class="result-name">#${String(p.id).padStart(3,'0')} ${p.name}</div>
        <div class="result-types">${p.types.map(t => typeBadge(t.type.name)).join('')}</div>
      </div>`;
    item.addEventListener('click', () => addToTeam(p));
    results.appendChild(item);
  });
}

// ─── Time ─────────────────────────────────────
function addToTeam(pokemon) {
  if (team.length >= 6)                      { showToast('Time cheio!'); return; }
  if (team.find(p => p.id === pokemon.id))   { showToast(`${pokemon.name} já está no time!`); return; }
  team.push(pokemon); offMapCache = {};
  document.getElementById('search-results').classList.add('hidden');
  document.getElementById('search-input').value = '';
  saveTeamToStorage(); renderTeamGrid(); analyzeTeam();
}

function removeFromTeam(id) {
  team = team.filter(p => p.id !== id);
  delete teamSets[id]; offMapCache = {};
  saveTeamToStorage(); renderTeamGrid(); analyzeTeam();
}

// ─── Renderiza Grid ───────────────────────────
function renderTeamGrid() {
  const grid  = document.getElementById('team-grid');
  const badge = document.getElementById('team-count-badge');
  badge.textContent = `${team.length} / 6`;
  grid.innerHTML = '';

  for (let i = 0; i < 6; i++) {
    const slot = document.createElement('div');
    if (i < team.length) {
      const p = team[i];
      const types  = p.types.map(t => t.type.name);
      const hasSet = !!teamSets[p.id];
      const role   = detectRole(p, teamSets[p.id]);

      slot.className = 'team-slot filled';
      slot.innerHTML = `
        <button class="slot-remove" data-id="${p.id}">✕</button>
        <img class="slot-sprite" src="${SPRITE(p.id)}" alt="${p.name}" loading="lazy" />
        <div class="slot-name">${p.name}</div>
        <div class="slot-types">${types.map(t => typeBadge(t, true)).join('')}</div>
        ${role ? `<div class="slot-role-tag">${role.label}</div>` : ''}
        <button class="slot-edit-btn${hasSet?' has-set':''}" title="Editar set" data-idx="${i}">✎</button>
        <button class="slot-detail-btn" data-id="${p.id}">i</button>
      `;
      slot.querySelector('.slot-remove').addEventListener('click', e => { e.stopPropagation(); removeFromTeam(parseInt(e.currentTarget.dataset.id)); });
      slot.querySelector('.slot-edit-btn').addEventListener('click', e => { e.stopPropagation(); openSetBuilder(p, parseInt(e.currentTarget.dataset.idx)); });
      slot.querySelector('.slot-detail-btn').addEventListener('click', e => { e.stopPropagation(); openPokeModal(p); });
    } else {
      slot.className = 'team-slot empty';
      slot.innerHTML = `<div class="slot-empty-icon">+</div><div class="slot-empty-text">VAZIO</div>`;
      slot.addEventListener('click', () => document.getElementById('search-input').focus());
    }
    slot.style.animationDelay = `${i * 0.05}s`;
    grid.appendChild(slot);
  }
}

// ─── DETECÇÃO DE ROLE REAL ────────────────────
function detectRole(pokemon, set) {
  const moves   = normalizeList(set?.moves || []);
  const item    = normalize(set?.item    || '');
  const ability = normalize(set?.ability || pokemon.abilities?.[0]?.ability?.name || '');
  const stats   = {}; pokemon.stats.forEach(s => { stats[s.stat.name] = s.base_stat; });

  const hasMove = (...keys) => keys.some(k => moves.some(m => m === k || m.replace(/-/g,' ') === k.replace(/-/g,' ')));

  // Roles por ordem de prioridade
  if (hasMove(...ROLE_MOVES.trick_room))
    return { key: 'trick_room',    label: '🌀 Trick Room',     color: '#a78bfa' };
  if (hasMove(...ROLE_MOVES.hazard_setter))
    return { key: 'hazard_setter', label: '📌 Hazard Setter',   color: '#F8D030' };
  if (hasMove(...ROLE_MOVES.hazard_removal))
    return { key: 'hazard_removal',label: '🧹 Hazard Removal',  color: '#78C850' };
  if (hasMove(...ROLE_MOVES.setup_sweeper))
    return { key: 'setup_sweeper', label: '⚔️ Setup Sweeper',   color: '#F08030' };
  if (hasMove(...ROLE_MOVES.pivot))
    return { key: 'pivot',         label: '🔄 Pivot',           color: '#6890F0' };
  if (hasMove(...ROLE_MOVES.cleric))
    return { key: 'cleric',        label: '💚 Cleric',          color: '#78C850' };
  if (hasMove(...ROLE_MOVES.status_spreader))
    return { key: 'status',        label: '🌫️ Status Spreader', color: '#A040A0' };
  if (hasMove(...ROLE_MOVES.phazer))
    return { key: 'phazer',        label: '💨 Phazer',          color: '#705898' };

  // Sem set salvo — infere pelos stats base
  const hp   = stats['hp'] || 0;
  const def  = stats['defense'] || 0;
  const spd  = stats['special-defense'] || 0;
  const spe  = stats['speed'] || 0;
  const atk  = stats['attack'] || 0;
  const spatk= stats['special-attack'] || 0;

  if (item.includes('choice-scarf') || item.includes('choice scarf'))
    return { key: 'scarfer',   label: '🏃 Choice Scarfer', color: '#98D8D8' };

  if ((hp + def + spd) > 270 && spe < 70)
    return { key: 'wall',      label: '🛡️ Wall',           color: '#B8B8D0' };

  if (spe >= 100 && Math.max(atk, spatk) >= 100)
    return { key: 'sweeper',   label: '⚡ Sweeper',        color: '#F08030' };

  if (Math.max(atk, spatk) >= 120)
    return { key: 'wallbreaker',label:'💥 Wallbreaker',    color: '#C03028' };

  return { key: 'attacker',    label: '⚔️ Attacker',       color: '#A8A878' };
}

function normalize(s) { return (s||'').toLowerCase().replace(/\s+/g,' ').trim(); }
function normalizeList(arr) { return arr.map(normalize).filter(Boolean); }

// ─── ANÁLISE COMPLETA ─────────────────────────
async function analyzeTeam() {
  const empty = `<div class="result-msg">Adicione Pokémon ao time</div>`;
  if (!team.length) {
    ['offensive-chart','defensive-chart','resist-chart'].forEach(id => document.getElementById(id).innerHTML = empty);
    document.getElementById('tips-list').innerHTML = empty;
    document.getElementById('stats-grid').innerHTML = '';
    updateOffensiveLabel(false);
    return;
  }

  // Análise defensiva com habilidades
  const abilitySynergy = buildAbilitySynergy();
  const { weakMap, resistMap, immuneMap } = buildDefensiveMaps(abilitySynergy);

  renderTypeChart('defensive-chart', weakMap);
  renderTypeChart('resist-chart', resistMap);
  renderStatCards();

  // Roles
  const roleMap = buildRoleMap();

  // Speed analysis
  const speedAnalysis = buildSpeedAnalysis();

  // Tips iniciais (sem ofensiva ainda)
  renderDiagnostic(weakMap, resistMap, immuneMap, null, roleMap, speedAnalysis, null);

  // Ofensiva assíncrona
  updateOffensiveLabel(true);
  document.getElementById('offensive-chart').innerHTML =
    `<div class="result-msg" style="font-size:12px">Analisando movesets...</div>`;

  try {
    const offMap = await calcRealOffensiveCoverage(team);
    offMapCache = offMap;
    updateOffensiveLabel(false);
    renderTypeChart('offensive-chart', offMap);

    // Threats analysis via backend
    const threats = await fetchThreats(format);
    renderDiagnostic(weakMap, resistMap, immuneMap, offMap, roleMap, speedAnalysis, threats);
  } catch(e) {
    document.getElementById('offensive-chart').innerHTML =
      `<div class="result-msg" style="font-size:12px">Erro ao analisar movesets.</div>`;
    updateOffensiveLabel(false);
    renderDiagnostic(weakMap, resistMap, immuneMap, null, roleMap, speedAnalysis, null);
  }
}

// ─── Sinergias de habilidade ──────────────────
function buildAbilitySynergy() {
  // { tipo: [pokemonName, ...] }  — quem cobre o tipo via habilidade
  const immunities = {};
  const halved     = {};
  team.forEach(p => {
    const saved   = teamSets[p.id];
    const abilKey = normalize(saved?.ability || p.abilities?.[0]?.ability?.name || '');
    const name    = p.name;

    const imm = ABILITY_IMMUNITIES[abilKey];
    if (imm) immunities[imm] = [...(immunities[imm]||[]), name];

    const halves = ABILITY_HALF[abilKey] || [];
    halves.forEach(t => { halved[t] = [...(halved[t]||[]), name]; });
  });
  return { immunities, halved };
}

function buildDefensiveMaps(abilitySynergy) {
  const weakMap = {}, resistMap = {}, immuneMap = {};
  ALL_TYPES.forEach(t => { weakMap[t] = 0; resistMap[t] = 0; immuneMap[t] = 0; });

  team.forEach(p => {
    const defTypes = p.types.map(t => t.type.name);
    const saved    = teamSets[p.id];
    const abilKey  = normalize(saved?.ability || p.abilities?.[0]?.ability?.name || '');

    ALL_TYPES.forEach(atk => {
      // Imunidade por habilidade sobrescreve tudo
      if (ABILITY_IMMUNITIES[abilKey] === atk) {
        immuneMap[atk]++;
        return;
      }
      let m = getDefensiveMult(atk, defTypes);
      // Habilidade de half
      const halves = ABILITY_HALF[abilKey] || [];
      if (halves.includes(atk)) m *= 0.5;

      if (m === 0)       immuneMap[atk]++;
      else if (m >= 2)   weakMap[atk]++;
      else if (m <= 0.5) resistMap[atk]++;
    });
  });
  return { weakMap, resistMap, immuneMap };
}

// ─── Role map ─────────────────────────────────
function buildRoleMap() {
  const roles = {};
  team.forEach(p => {
    const role = detectRole(p, teamSets[p.id]);
    if (role) roles[role.key] = [...(roles[role.key]||[]), p.name];
  });
  return roles;
}

// ─── Speed analysis ───────────────────────────
function buildSpeedAnalysis() {
  const speeds = team.map(p => {
    const spe = p.stats.find(s => s.stat.name === 'speed')?.base_stat || 0;
    const saved = teamSets[p.id];
    const item  = normalize(saved?.item || '');
    const hasScarf = item.includes('choice-scarf') || item.includes('choice scarf');
    const effectiveSpe = hasScarf ? Math.floor(spe * 1.5) : spe;
    return { name: p.name, base: spe, effective: effectiveSpe, scarf: hasScarf };
  });

  const hasPriority = team.some(p => {
    const moves = normalizeList(teamSets[p.id]?.moves || []);
    return moves.some(m => ROLE_MOVES.priority.some(pk => m === pk || m.replace(/-/g,' ') === pk.replace(/-/g,' ')));
  });

  const hasTrickRoom = team.some(p => {
    const moves = normalizeList(teamSets[p.id]?.moves || []);
    return moves.some(m => m === 'trick-room' || m === 'trick room');
  });

  const avgSpeed = speeds.length ? Math.round(speeds.reduce((a,s) => a+s.base,0) / speeds.length) : 0;
  const fastest  = speeds.sort((a,b) => b.effective - a.effective)[0];
  return { speeds, avgSpeed, hasPriority, hasTrickRoom, fastest };
}

// ─── Busca threats do meta ────────────────────
async function fetchThreats(fmt) {
  if (backendOnline) {
    try {
      const r = await fetch(`${BACKEND}/threats/${fmt}`, { signal: AbortSignal.timeout(3000) });
      const d = await r.json();
      return d.threats || [];
    } catch {}
  }
  // Fallback inline (subconjunto)
  const FALLBACK = {
    'gen9ou': [
      {name:'gholdengo',types:['steel','ghost'],speed:133,threats:['ghost','dark','fire','ground']},
      {name:'dragapult',types:['dragon','ghost'],speed:142,threats:['ghost','dark','dragon','fairy','ice']},
      {name:'kingambit',types:['dark','steel'],speed:50,threats:['fighting','ground','fire']},
      {name:'garchomp',types:['dragon','ground'],speed:102,threats:['ice','dragon','fairy']},
      {name:'volcarona',types:['bug','fire'],speed:100,threats:['rock','water','flying']},
      {name:'great-tusk',types:['ground','fighting'],speed:87,threats:['water','grass','ice','psychic','flying','fairy']},
      {name:'iron-valiant',types:['fairy','fighting'],speed:116,threats:['poison','steel','psychic','flying','fairy']},
    ],
    'gen9vgc2025regg': [
      {name:'flutter-mane',types:['ghost','fairy'],speed:119,threats:['ghost','dark','steel','poison']},
      {name:'incineroar',types:['fire','dark'],speed:60,threats:['water','rock','ground','fighting']},
      {name:'rillaboom',types:['grass'],speed:85,threats:['fire','ice','poison','flying','bug']},
    ],
    'gen7ou': [
      {name:'landorus-therian',types:['ground','flying'],speed:91,threats:['ice','water']},
      {name:'tapu-koko',types:['electric','fairy'],speed:130,threats:['ground','poison','steel']},
      {name:'garchomp',types:['dragon','ground'],speed:102,threats:['ice','dragon','fairy']},
    ],
  };
  return FALLBACK[fmt] || FALLBACK['gen9ou'];
}

// ─── Analisa vulnerabilidade a uma ameaça ─────
function analyzeVsThreats(threats, weakMap, resistMap, immuneMap, offMap) {
  const dangerous = [];
  const teamTypes = team.map(p => p.types.map(t => t.type.name));

  threats.forEach(threat => {
    // Meu time consegue acertar?
    const canHit = threat.types.some(tt => (offMap?.[tt] || 0) > 0);
    // Meu time é fraco?
    const vulnerableCount = threat.threats
      .filter(atkType => (weakMap[atkType] || 0) >= 2).length;

    if (vulnerableCount >= 1 && !canHit) {
      dangerous.push({ name: threat.name, reason: `fraco a ${threat.threats.filter(t => (weakMap[t]||0)>=2).join('/')} e sem cobertura` });
    } else if (vulnerableCount >= 2) {
      dangerous.push({ name: threat.name, reason: `${vulnerableCount} membros vulneráveis aos ataques` });
    }
  });
  return dangerous;
}

// ─── DIAGNÓSTICO COMPLETO ─────────────────────
function renderDiagnostic(weakMap, resistMap, immuneMap, offMap, roleMap, speedInfo, threats) {
  const el   = document.getElementById('tips-list');
  const tips = [];
  const n    = team.length;
  if (!n) { el.innerHTML = ''; return; }

  // — ROLES —
  const missingRoles = [];
  if (!roleMap['hazard_setter'])  missingRoles.push('Hazard Setter (Stealth Rock/Spikes)');
  if (!roleMap['hazard_removal']) missingRoles.push('Hazard Removal (Defog/Rapid Spin)');
  if (!roleMap['pivot'])          missingRoles.push('Pivot (U-turn/Volt Switch)');

  if (missingRoles.length) {
    tips.push({ type: 'warn', text: `Funções ausentes: <strong>${missingRoles.join(', ')}</strong>` });
  }

  const presentRoles = Object.keys(roleMap).map(k => {
    const labels = { hazard_setter:'📌 Hazard Setter', hazard_removal:'🧹 Hazard Removal',
      pivot:'🔄 Pivot', setup_sweeper:'⚔️ Setup Sweeper', trick_room:'🌀 Trick Room',
      cleric:'💚 Cleric', status:'🌫️ Status', phazer:'💨 Phazer', wall:'🛡️ Wall',
      sweeper:'⚡ Sweeper', wallbreaker:'💥 Wallbreaker', scarfer:'🏃 Scarfer' };
    return labels[k] || k;
  });
  if (presentRoles.length) {
    tips.push({ type: 'ok', text: `Funções no time: ${presentRoles.join(', ')}` });
  }

  // — HAZARDS específicos —
  const hasStealthRock = team.some(p => {
    const moves = normalizeList(teamSets[p.id]?.moves || []);
    return moves.some(m => m === 'stealth-rock' || m === 'stealth rock');
  });
  const hasSpikes = team.some(p => {
    const moves = normalizeList(teamSets[p.id]?.moves || []);
    return moves.some(m => m === 'spikes' || m === 'toxic-spikes' || m === 'toxic spikes');
  });
  if (!hasStealthRock && n >= 2) {
    tips.push({ type: 'warn', text: 'Nenhum Pokémon com <strong>Stealth Rock</strong> — hazard mais impactante do meta.' });
  }

  // — SPEED CONTROL —
  if (!speedInfo.hasPriority && !speedInfo.hasTrickRoom && !speedInfo.speeds.some(s => s.scarf)) {
    tips.push({ type: 'warn', text: `Sem speed control: nenhum priority move, Choice Scarf ou Trick Room detectado.` });
  } else {
    const ctrl = [];
    if (speedInfo.hasPriority)   ctrl.push('priority move');
    if (speedInfo.hasTrickRoom)  ctrl.push('Trick Room');
    if (speedInfo.speeds.some(s => s.scarf)) ctrl.push('Choice Scarf');
    tips.push({ type: 'ok', text: `Speed control: ${ctrl.join(', ')}.` });
  }

  if (speedInfo.avgSpeed < 70 && !speedInfo.hasTrickRoom) {
    tips.push({ type: 'warn', text: `Time muito lento (média ${speedInfo.avgSpeed} Spe) sem Trick Room para compensar.` });
  } else if (speedInfo.avgSpeed >= 100) {
    tips.push({ type: 'ok', text: `Time rápido: média de ${speedInfo.avgSpeed} Spe.` });
  }

  // — DEFENSIVA —
  const critWeak = ALL_TYPES.filter(t => (weakMap[t]||0) >= Math.ceil(n * 0.5));
  if (critWeak.length) {
    tips.push({ type: 'warn', text: `Fraqueza crítica: <strong>${critWeak.join(', ')}</strong> — ≥50% do time vulnerável.` });
  }

  const immuneTypes = ALL_TYPES.filter(t => (immuneMap[t]||0) > 0);
  if (immuneTypes.length) {
    tips.push({ type: 'ok', text: `Imunidades (tipo + habilidade): <strong>${immuneTypes.join(', ')}</strong>` });
  }

  // — OFENSIVA —
  if (offMap) {
    const uncovered = ALL_TYPES.filter(t => (offMap[t]||0) === 0 && (weakMap[t]||0) > 0);
    if (uncovered.length) {
      tips.push({ type: 'warn', text: `Sem cobertura ofensiva nos tipos que te ameaçam: <strong>${uncovered.join(', ')}</strong>` });
    } else {
      const total = 18 - ALL_TYPES.filter(t => (offMap[t]||0) === 0).length;
      tips.push({ type: 'ok', text: `Cobertura ofensiva em ${total}/18 tipos.` });
    }
  } else {
    tips.push({ type: 'info', text: 'Analisando movesets reais...' });
  }

  // — THREATS DO META —
  if (threats && offMap) {
    const dangerous = analyzeVsThreats(threats, weakMap, resistMap, immuneMap, offMap);
    if (dangerous.length) {
      dangerous.slice(0,3).forEach(t => {
        tips.push({ type: 'warn', text: `⚠️ Ameaça do meta — <strong>${capitalize(t.name)}</strong>: ${t.reason}.` });
      });
    } else {
      tips.push({ type: 'ok', text: `Sem ameaças críticas do meta detectadas para ${format.toUpperCase()}.` });
    }
  }

  // — WIN CONDITION —
  const hasSetup   = !!(roleMap['setup_sweeper']);
  const hasWall    = !!(roleMap['wall']);
  const hasBreaker = !!(roleMap['wallbreaker']);
  if (!hasSetup && !hasBreaker) {
    tips.push({ type: 'warn', text: 'Sem win condition clara: nenhum setup sweeper ou wallbreaker detectado.' });
  }
  if (hasWall && !roleMap['hazard_removal']) {
    tips.push({ type: 'warn', text: 'Time com Wall mas sem Hazard Removal — stall fica vulnerável a chip damage.' });
  }

  // — SINERGIA OFENSIVA/DEFENSIVA —
  const physicalCount = team.filter(p => {
    const s = {}; p.stats.forEach(st => { s[st.stat.name] = st.base_stat; });
    return (s['attack']||0) >= (s['special-attack']||0);
  }).length;
  if (physicalCount >= 5) {
    tips.push({ type: 'warn', text: 'Time muito físico — Intimidate/Will-O-Wisp pode paralisar a ofensiva.' });
  } else if (physicalCount <= 1) {
    tips.push({ type: 'warn', text: 'Time quase todo especial — Unaware / Special walls cortam sua ofensiva.' });
  }

  // — STATUS FINAL —
  tips.push({ type: 'info', text: n === 6
    ? `Time completo. Use <strong>↗ Showdown</strong> para exportar.`
    : `Adicione mais ${6-n} Pokémon para completar o time.` });

  el.innerHTML = tips.map(t => `<div class="tip-item tip-${t.type}">${t.text}</div>`).join('');
}

// ─── Type Charts ─────────────────────────────
function updateOffensiveLabel(loading) {
  const sub = document.querySelector('#offensive-card .analysis-sub');
  if (!sub) return;
  sub.innerHTML = loading
    ? `Analisando movesets <span style="color:var(--accent);font-family:var(--mono);font-size:10px">(buscando…)</span>`
    : 'Tipos que seu time cobre em super-efetivo (moveset real)';
}

function renderTypeChart(elId, map) {
  const el = document.getElementById(elId);
  el.innerHTML = '';
  const entries = Object.entries(map).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]).slice(0,12);
  if (!entries.length) { el.innerHTML = `<div class="result-msg" style="font-size:12px;padding:8px 0">Nenhum dado</div>`; return; }
  const maxVal = entries[0][1];
  entries.forEach(([type, count]) => {
    const pct = Math.round((count / Math.max(maxVal,1)) * 100);
    const row = document.createElement('div');
    row.className = 'type-row';
    row.innerHTML = `
      <div class="type-row-badge">${typeBadge(type, true)}</div>
      <div class="type-bar-track"><div class="type-bar-fill" style="width:${pct}%;background:${TYPE_COLORS[type]||'#888'}"></div></div>
      <div class="type-count">${count}</div>`;
    el.appendChild(row);
  });
}

// ─── Stat Cards ───────────────────────────────
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

  const saved  = teamSets[p.id];
  const role   = detectRole(p, saved);
  const totalBST = p.stats.reduce((a,s) => a+s.base_stat, 0);
  const { nature, evs } = suggestNatureAndEVs(p);

  content.innerHTML = `
    <div class="poke-detail-header">
      <img class="poke-detail-sprite" src="${SPRITE_HD(p.id)}" onerror="this.src='${SPRITE(p.id)}'" alt="${p.name}" />
      <div class="poke-detail-info">
        <div class="poke-detail-id">#${String(p.id).padStart(3,'0')}</div>
        <h2>${p.name}</h2>
        <div class="poke-detail-types">${types.map(t => typeBadge(t)).join('')}</div>
        ${role ? `<div class="poke-role-tag" style="border-color:${role.color}30;color:${role.color}">${role.label}</div>` : ''}
        ${saved?.item ? `<div class="poke-item-tag">@ ${capitalize(saved.item)}</div>` : ''}
      </div>
    </div>
    <div class="poke-stats-title">BASE STATS — BST ${totalBST}</div>
    ${p.stats.map(s => {
      const val = s.base_stat; const pct = Math.round((val/255)*100);
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
      ${(p.abilities||[]).map(a => `<span class="${a.is_hidden?'ability-chip hidden-ability':'ability-chip'}">${a.ability.name}${a.is_hidden?' (hidden)':''}</span>`).join('')||'—'}
    </div>
    ${saved?.moves?.filter(Boolean).length ? `
    <div class="poke-set-suggestion">
      <div class="poke-abilities-title">SET SALVO</div>
      <div class="poke-set-box">
        ${saved.nature  ? `<div class="poke-set-line"><span class="poke-set-key">Nature</span><span class="poke-set-val">${capitalize(saved.nature)}</span></div>` : ''}
        ${saved.ability ? `<div class="poke-set-line"><span class="poke-set-key">Ability</span><span class="poke-set-val">${capitalize(saved.ability)}</span></div>` : ''}
        <div class="poke-set-line"><span class="poke-set-key">Moves</span><span class="poke-set-val">${saved.moves.filter(Boolean).join(' · ')}</span></div>
      </div>
    </div>` : ''}
  `;
  modal.classList.remove('hidden');
}

// ─── Export Showdown ─────────────────────────
function openExportModal() {
  if (!team.length) { showToast('Adicione Pokémon antes de exportar.'); return; }
  const paste = team.map(p => {
    const saved = teamSets[p.id];
    const types = p.types.map(t => t.type.name);
    if (saved) {
      const name   = saved.nickname ? `${capitalize(saved.nickname)} (${capitalize(p.name)})` : capitalize(p.name);
      const item   = saved.item    ? ` @ ${capitalize(saved.item)}` : '';
      const ability= capitalize(saved.ability || p.abilities?.[0]?.ability?.name || '');
      const evs    = formatEVStringForExport(saved.evs);
      const moves  = (saved.moves||[]).filter(Boolean).map(m => `- ${m}`);
      return `${name}${item}\nAbility: ${ability}\nLevel: 50\nTera Type: ${capitalize(saved.tera||types[0])}\nEVs: ${evs}\n${capitalize(saved.nature)} Nature\n${moves.join('\n')}`;
    }
    const sugg = suggestNatureAndEVs(p);
    const moves = suggestMoves(p, sugg.role);
    return `${capitalize(p.name)}\nAbility: ${capitalize(p.abilities?.[0]?.ability?.name||'')}\nLevel: 50\nTera Type: ${capitalize(types[0])}\nEVs: ${sugg.evs}\n${capitalize(sugg.nature)} Nature\n${moves.join('\n')}`;
  }).join('\n\n');

  document.getElementById('export-text').value = paste;
  document.getElementById('export-modal').classList.remove('hidden');
}

function formatEVStringForExport(evs) {
  if (!evs) return '252 Atk / 4 Def / 252 Spe';
  const map = { 'attack':'Atk','defense':'Def','special-attack':'SpA','special-defense':'SpD','speed':'Spe','hp':'HP' };
  const parts = ['hp','attack','defense','special-attack','special-defense','speed']
    .filter(s => (evs[s]||0) > 0).map(s => `${evs[s]} ${map[s]}`);
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
  return str.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase());
}

function showToast(msg) {
  let t = document.getElementById('__toast');
  if (!t) {
    t = document.createElement('div'); t.id = '__toast';
    t.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
      background:var(--bg4);border:1px solid var(--border2);border-radius:6px;
      color:var(--text);font-family:var(--mono);font-size:11px;letter-spacing:.04em;
      padding:10px 18px;z-index:9999;white-space:nowrap;transition:opacity .2s;pointer-events:none;`;
    document.body.appendChild(t);
  }
  t.textContent = msg; t.style.opacity = '1';
  clearTimeout(t.__timeout);
  t.__timeout = setTimeout(() => t.style.opacity = '0', 2500);
}