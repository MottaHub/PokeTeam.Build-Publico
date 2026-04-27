// =============================================
// teambuilder.js — Lógica principal
// =============================================

const POKEAPI = 'https://pokeapi.co/api/v2';
const SPRITE   = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const SPRITE_HD = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

// ─── Estado ─────────────────────────────────
let team    = [];   // Array de objetos Pokémon (máx 6)
let format  = 'OU';
let searchTimeout = null;
let pokeListCache = null;

// ─── Init ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderTeamGrid();
  setupEvents();
  preloadPokeList();
});

function setupEvents() {
  const input   = document.getElementById('search-input');
  const btn     = document.getElementById('search-btn');
  const results = document.getElementById('search-results');

  // Busca com debounce
  input.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const q = input.value.trim();
    if (!q) { results.classList.add('hidden'); return; }
    searchTimeout = setTimeout(() => searchPokemon(q), 350);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { clearTimeout(searchTimeout); searchPokemon(input.value.trim()); }
    if (e.key === 'Escape') { results.classList.add('hidden'); }
  });

  btn.addEventListener('click', () => {
    clearTimeout(searchTimeout);
    searchPokemon(document.getElementById('search-input').value.trim());
  });

  // Fecha resultados ao clicar fora
  document.addEventListener('click', e => {
    if (!e.target.closest('.search-panel')) results.classList.add('hidden');
  });

  // Seletor de formato
  document.getElementById('format-select').addEventListener('change', e => {
    format = e.target.value;
  });

  // Export
  document.getElementById('export-btn').addEventListener('click', openExportModal);
  document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('export-modal').classList.add('hidden');
  });
  document.getElementById('copy-btn').addEventListener('click', () => {
    const ta = document.getElementById('export-text');
    navigator.clipboard.writeText(ta.value).then(() => {
      const btn = document.getElementById('copy-btn');
      btn.textContent = 'Copiado!';
      setTimeout(() => btn.textContent = 'Copiar', 1500);
    });
  });

  // Clear
  document.getElementById('clear-btn').addEventListener('click', () => {
    if (team.length === 0) return;
    if (confirm('Limpar o time?')) { team = []; renderTeamGrid(); analyzeTeam(); }
  });

  // Poke modal close
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

// ─── Pre-carrega lista de Pokémon ────────────
async function preloadPokeList() {
  try {
    const r = await fetch(`${POKEAPI}/pokemon?limit=1302`);
    const d = await r.json();
    pokeListCache = d.results;
  } catch(e) { console.warn('Falha ao pré-carregar lista:', e); }
}

// ─── Busca ───────────────────────────────────
async function searchPokemon(q) {
  if (!q) return;
  const results = document.getElementById('search-results');
  results.classList.remove('hidden');
  results.innerHTML = `<div class="result-msg">Buscando...</div>`;

  try {
    // Tenta busca direta primeiro (nome exato)
    const direct = await fetch(`${POKEAPI}/pokemon/${q.toLowerCase()}`);
    if (direct.ok) {
      const data = await direct.json();
      renderResults([data]);
      return;
    }

    // Busca por substring na lista cacheada
    if (pokeListCache) {
      const matches = pokeListCache
        .filter(p => p.name.includes(q.toLowerCase()))
        .slice(0, 12);

      if (!matches.length) {
        results.innerHTML = `<div class="result-msg">Nenhum Pokémon encontrado para "${q}"</div>`;
        return;
      }

      const details = await Promise.all(
        matches.map(m => fetch(m.url).then(r => r.json()))
      );
      renderResults(details);
    } else {
      results.innerHTML = `<div class="result-msg">Lista ainda carregando, tente novamente em instantes.</div>`;
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
        <div class="result-types">
          ${types.map(t => typeBadge(t)).join('')}
        </div>
      </div>
    `;
    item.addEventListener('click', () => addToTeam(p));
    results.appendChild(item);
  });
}

// ─── Gerenciamento do Time ───────────────────
function addToTeam(pokemon) {
  if (team.length >= 6) {
    showToast('Time cheio! Remova um Pokémon primeiro.');
    return;
  }
  if (team.find(p => p.id === pokemon.id)) {
    showToast(`${pokemon.name} já está no time!`);
    return;
  }
  team.push(pokemon);
  document.getElementById('search-results').classList.add('hidden');
  document.getElementById('search-input').value = '';
  renderTeamGrid();
  analyzeTeam();
}

function removeFromTeam(id) {
  team = team.filter(p => p.id !== id);
  renderTeamGrid();
  analyzeTeam();
}

// ─── Renderiza o Grid do Time ─────────────────
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
      slot.className = 'team-slot filled';
      slot.innerHTML = `
        <button class="slot-remove" title="Remover" data-id="${p.id}">✕</button>
        <img class="slot-sprite" src="${SPRITE(p.id)}" alt="${p.name}" loading="lazy" />
        <div class="slot-name">${p.name}</div>
        <div class="slot-types">${types.map(t => typeBadge(t, true)).join('')}</div>
        <button class="slot-detail-btn" title="Ver detalhes" data-id="${p.id}">i</button>
      `;
      slot.querySelector('.slot-remove').addEventListener('click', e => {
        e.stopPropagation();
        removeFromTeam(parseInt(e.currentTarget.dataset.id));
      });
      slot.querySelector('.slot-detail-btn').addEventListener('click', e => {
        e.stopPropagation();
        openPokeModal(p);
      });
    } else {
      slot.className = 'team-slot empty';
      slot.innerHTML = `
        <div class="slot-empty-icon">+</div>
        <div class="slot-empty-text">VAZIO</div>
      `;
      slot.addEventListener('click', () => {
        document.getElementById('search-input').focus();
      });
    }
    slot.style.animationDelay = `${i * 0.05}s`;
    grid.appendChild(slot);
  }
}

// ─── Análise do Time ─────────────────────────
function analyzeTeam() {
  if (team.length === 0) {
    document.getElementById('offensive-chart').innerHTML  = '<div class="result-msg">Adicione Pokémon ao time</div>';
    document.getElementById('defensive-chart').innerHTML  = '<div class="result-msg">Adicione Pokémon ao time</div>';
    document.getElementById('resist-chart').innerHTML     = '<div class="result-msg">Adicione Pokémon ao time</div>';
    document.getElementById('tips-list').innerHTML        = '<div class="result-msg">Adicione Pokémon ao time</div>';
    document.getElementById('stats-grid').innerHTML       = '';
    return;
  }

  // --- Cobertura ofensiva: quantos Pokémon do time cobrem cada tipo inimigo ---
  // Para cada tipo de ataque disponível, conta quantos membros têm move de tipo super-efetivo
  // Simplificação: consideramos que cada membro pode usar qualquer tipo que conheça via learnset
  // Aqui usamos os próprios tipos do Pokémon como proxy de cobertura ofensiva
  const offMap = {};
  ALL_TYPES.forEach(t => offMap[t] = 0);

  team.forEach(p => {
    const myTypes = p.types.map(t => t.type.name);
    ALL_TYPES.forEach(atk => {
      // Simula: se algum membro do time PODE usar ataques do tipo `atk`
      // Proxy: contamos os tipos do próprio Pokémon
      if (myTypes.includes(atk)) {
        // Quais tipos defensores esse ataque cobriria?
        ALL_TYPES.forEach(def => {
          const m = getOffensiveMult(atk, [def]);
          if (m >= 2) offMap[def] = (offMap[def] || 0) + 1;
        });
      }
    });
  });

  // --- Análise defensiva ---
  const weakMap   = {};
  const resistMap = {};
  const immuneMap = {};
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

  renderTypeChart('offensive-chart', offMap, 'ofensiva');
  renderTypeChart('defensive-chart', weakMap, 'fraqueza');
  renderTypeChart('resist-chart', resistMap, 'resistencia');
  renderTips(weakMap, resistMap, immuneMap, offMap);
  renderStatCards();
}

function renderTypeChart(elId, map, mode) {
  const el = document.getElementById(elId);
  el.innerHTML = '';

  const entries = Object.entries(map)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (!entries.length) {
    el.innerHTML = `<div class="result-msg" style="font-size:12px;padding:8px 0">Nenhum dado</div>`;
    return;
  }

  const maxVal = entries[0][1];

  entries.forEach(([type, count]) => {
    const pct  = Math.round((count / Math.max(maxVal, 1)) * 100);
    const color = TYPE_COLORS[type] || '#888';
    const row  = document.createElement('div');
    row.className = 'type-row';
    row.innerHTML = `
      <div class="type-row-badge">${typeBadge(type, true)}</div>
      <div class="type-bar-track">
        <div class="type-bar-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <div class="type-count">${count}</div>
    `;
    el.appendChild(row);
  });
}

function renderTips(weakMap, resistMap, immuneMap, offMap) {
  const el    = document.getElementById('tips-list');
  const tips  = [];
  const n     = team.length;

  if (n === 0) { el.innerHTML = ''; return; }

  // Fraquezas críticas (>= 50% do time)
  const critWeak = ALL_TYPES.filter(t => weakMap[t] >= Math.ceil(n * 0.5));
  if (critWeak.length) {
    tips.push({ type: 'warn', text: `Fraqueza crítica em <strong>${critWeak.join(', ')}</strong> — mais de metade do time é vulnerável.` });
  }

  // Imunidades
  const immuneTypes = ALL_TYPES.filter(t => immuneMap[t] > 0);
  if (immuneTypes.length) {
    tips.push({ type: 'ok', text: `Imunidade a: <strong>${immuneTypes.join(', ')}</strong>` });
  }

  // Cobertura ofensiva faltando
  const uncovered = ALL_TYPES.filter(t => (offMap[t] || 0) === 0 && weakMap[t] > 0);
  if (uncovered.length) {
    tips.push({ type: 'warn', text: `Sem cobertura ofensiva para: <strong>${uncovered.join(', ')}</strong>` });
  }

  // Time completo
  if (n === 6) {
    const dominated = ALL_TYPES.filter(t => weakMap[t] === 0 && resistMap[t] > 0);
    if (dominated.length >= 6) {
      tips.push({ type: 'ok', text: `Boa diversidade! Time com resistências sólidas.` });
    }
    tips.push({ type: 'info', text: `Time completo em formato <strong>${format}</strong>. Use o botão "Showdown" para exportar.` });
  } else {
    tips.push({ type: 'info', text: `Adicione mais ${6 - n} Pokémon para completar o time.` });
  }

  el.innerHTML = tips.map(t =>
    `<div class="tip-item tip-${t.type}">${t.text}</div>`
  ).join('');
}

function renderStatCards() {
  const grid = document.getElementById('stats-grid');
  grid.innerHTML = '';

  team.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'stat-card';
    card.style.animationDelay = `${i * 0.06}s`;

    const statsHtml = p.stats.map(s => {
      const label = STAT_LABELS[s.stat.name] || s.stat.name.toUpperCase().slice(0,3);
      const val   = s.base_stat;
      const pct   = Math.round((val / 255) * 100);
      const color = statColor(val);
      return `
        <div class="stat-line">
          <div class="stat-key">${label}</div>
          <div class="stat-mini-track">
            <div class="stat-mini-fill" style="width:${pct}%;background:${color}"></div>
          </div>
          <div class="stat-val">${val}</div>
        </div>
      `;
    }).join('');

    card.innerHTML = `
      <div class="stat-card-name">${p.name}</div>
      <div class="stat-bars">${statsHtml}</div>
    `;
    card.addEventListener('click', () => openPokeModal(p));
    grid.appendChild(card);
  });
}

// ─── Modal de Detalhes do Pokémon ─────────────
function openPokeModal(p) {
  const types    = p.types.map(t => t.type.name);
  const abilities = p.abilities || [];
  const modal    = document.getElementById('poke-modal');
  const content  = document.getElementById('poke-modal-content');

  const statsHtml = p.stats.map(s => {
    const label = STAT_LABELS[s.stat.name] || s.stat.name;
    const val   = s.base_stat;
    const pct   = Math.round((val / 255) * 100);
    const color = statColor(val);
    return `
      <div class="poke-stat-row">
        <div class="poke-stat-label">${label}</div>
        <div class="poke-stat-track">
          <div class="poke-stat-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="poke-stat-val">${val}</div>
      </div>
    `;
  }).join('');

  const totalBST = p.stats.reduce((acc, s) => acc + s.base_stat, 0);

  const abilitiesHtml = abilities.map(a => {
    const cls = a.is_hidden ? 'ability-chip hidden-ability' : 'ability-chip';
    const tag = a.is_hidden ? ' (hidden)' : '';
    return `<span class="${cls}">${a.ability.name}${tag}</span>`;
  }).join('');

  content.innerHTML = `
    <div class="poke-detail-header">
      <img class="poke-detail-sprite" 
           src="${SPRITE_HD(p.id)}" 
           onerror="this.src='${SPRITE(p.id)}'"
           alt="${p.name}" />
      <div class="poke-detail-info">
        <div class="poke-detail-id">#${String(p.id).padStart(3,'0')}</div>
        <h2>${p.name}</h2>
        <div class="poke-detail-types">${types.map(t => typeBadge(t)).join('')}</div>
      </div>
    </div>
    <div class="poke-stats-title">BASE STATS — BST ${totalBST}</div>
    ${statsHtml}
    <div class="poke-abilities">
      <div class="poke-abilities-title">HABILIDADES</div>
      ${abilitiesHtml || '<span style="color:var(--muted);font-size:12px">—</span>'}
    </div>
  `;

  modal.classList.remove('hidden');
}

// ─── Export Showdown ─────────────────────────
function openExportModal() {
  if (team.length === 0) { showToast('Adicione Pokémon antes de exportar.'); return; }

  const paste = team.map(p => {
    const types = p.types.map(t => t.type.name);
    const name  = capitalize(p.name);
    const ability = p.abilities?.[0]?.ability?.name
      ? capitalize(p.abilities[0].ability.name)
      : 'Ability';
    const bst = p.stats.reduce((a, s) => a + s.base_stat, 0);

    // Natureza sugerida (heurística simples baseada no maior stat)
    const atkStat  = p.stats.find(s => s.stat.name === 'attack')?.base_stat || 0;
    const spatkStat = p.stats.find(s => s.stat.name === 'special-attack')?.base_stat || 0;
    const nature = spatkStat > atkStat ? 'Modest' : 'Adamant';

    // Moveset placeholder
    const moves = ['- Move 1', '- Move 2', '- Move 3', '- Move 4'];

    return `${name}
Ability: ${ability}
Level: 50
Tera Type: ${capitalize(types[0])}
EVs: 252 Atk / 4 Def / 252 Spe
${nature} Nature
${moves.join('\n')}`;
  }).join('\n\n');

  document.getElementById('export-text').value = paste;
  document.getElementById('export-modal').classList.remove('hidden');
}

// ─── Helpers ─────────────────────────────────
function typeBadge(type, small = false) {
  const color = TYPE_COLORS[type] || '#888';
  const size  = small ? 'font-size:9px;padding:1px 5px' : '';
  return `<span class="type-badge" style="background:${color};${size}">${type}</span>`;
}

function capitalize(str) {
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
      padding:10px 18px;z-index:9999;white-space:nowrap;
      transition:opacity .2s;pointer-events:none;
    `;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t.__timeout);
  t.__timeout = setTimeout(() => t.style.opacity = '0', 2500);
}