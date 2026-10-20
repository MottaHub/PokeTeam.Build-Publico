(() => {
  const RANKS = ['S', 'A', 'B', 'C', 'D', 'F'];
  const STARTERS = [
    [1,'Bulbasaur'],[4,'Charmander'],[7,'Squirtle'],[152,'Chikorita'],[155,'Cyndaquil'],[158,'Totodile'],
    [252,'Treecko'],[255,'Torchic'],[258,'Mudkip'],[387,'Turtwig'],[390,'Chimchar'],[393,'Piplup'],
    [495,'Snivy'],[498,'Tepig'],[501,'Oshawott'],[650,'Chespin'],[653,'Fennekin'],[656,'Froakie'],
    [722,'Rowlet'],[725,'Litten'],[728,'Popplio'],[810,'Grookey'],[813,'Scorbunny'],[816,'Sobble'],
    [906,'Sprigatito'],[909,'Fuecoco'],[912,'Quaxly']
  ];
  const CATALOG = {
    starters: { title: 'Melhores Pokémon iniciais', subtitle: 'Os 27 iniciais das nove gerações.', pokemon: STARTERS },
    eeveelutions: { title: 'Melhor evolução do Eevee', subtitle: 'Compare todas as evoluções do Eevee.', pokemon: [[134,'Vaporeon'],[135,'Jolteon'],[136,'Flareon'],[196,'Espeon'],[197,'Umbreon'],[470,'Leafeon'],[471,'Glaceon'],[700,'Sylveon']] },
    pseudos: { title: 'Melhores pseudo-lendários', subtitle: 'De Dratini a Frigibax: escolha sua linha favorita.', pokemon: [[149,'Dragonite'],[248,'Tyranitar'],[373,'Salamence'],[376,'Metagross'],[445,'Garchomp'],[635,'Hydreigon'],[706,'Goodra'],[784,'Kommo-o'],[887,'Dragapult'],[998,'Baxcalibur']] },
    pikachu: { title: 'Melhor parceiro do Pikachu', subtitle: 'Uma tier list para os mascotes elétricos da série.', pokemon: [[25,'Pikachu'],[26,'Raichu'],[172,'Pichu'],[181,'Ampharos'],[417,'Pachirisu'],[702,'Dedenne'],[777,'Togedemaru'],[877,'Morpeko'],[1017,'Miraidon']] }
  };
  const STORAGE_KEY = 'poketeam_tierlists_v1';
  let state = readState();
  let activeList = 'starters';
  let draggedId = null;
  let selectedPokemonId = null;
  let ignoreClickUntil = 0;

  function readState() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; } }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function current() {
    if (!state[activeList]) state[activeList] = { unranked: CATALOG[activeList].pokemon.map(([id]) => id), ranks: Object.fromEntries(RANKS.map(rank => [rank, []])) };
    const data = state[activeList];
    data.unranked ||= [];
    data.ranks ||= Object.fromEntries(RANKS.map(rank => [rank, []]));
    RANKS.forEach(rank => { data.ranks[rank] ||= []; });
    const valid = new Set(CATALOG[activeList].pokemon.map(([id]) => id));
    data.unranked = data.unranked.filter(id => valid.has(id));
    RANKS.forEach(rank => data.ranks[rank] = data.ranks[rank].filter(id => valid.has(id)));
    const placed = new Set([...data.unranked, ...RANKS.flatMap(rank => data.ranks[rank])]);
    CATALOG[activeList].pokemon.forEach(([id]) => { if (!placed.has(id)) data.unranked.push(id); });
    return data;
  }
  function getName(id) { return CATALOG[activeList].pokemon.find(item => item[0] === id)?.[1] || `Pokémon ${id}`; }
  function card(id) { const draggable = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches ? 'false' : 'true'; return `<button class="tier-pokemon" draggable="${draggable}" data-pokemon="${id}" title="${getName(id)}"><img loading="lazy" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png" alt=""><span>${getName(id)}</span></button>`; }
  function renderCatalog() {
    document.getElementById('tierlist-catalog').innerHTML = Object.entries(CATALOG).map(([key, list], index) => `<button class="tierlist-card tierlist-card-${index + 1}" data-list="${key}"><span class="tierlist-card-icon">${['✦','♡','◈','⚡'][index]}</span><span class="tierlist-card-label">TIER LIST</span><strong>${list.title}</strong><small>${list.pokemon.length} Pokémon</small><span class="tierlist-card-arrow">→</span></button>`).join('');
    document.querySelectorAll('.tierlist-card').forEach(button => button.addEventListener('click', () => {
      activeList = button.dataset.list;
      document.getElementById('tierlist-home').classList.add('hidden');
      document.getElementById('tierlist-editor').classList.remove('hidden');
      render();
      document.getElementById('tierlist-editor').scrollIntoView({ behavior:'smooth', block:'start' });
    }));
  }
  function showCatalog() {
    selectedPokemonId = null;
    document.getElementById('tierlist-editor').classList.add('hidden');
    document.getElementById('tierlist-home').classList.remove('hidden');
    document.getElementById('tier-list-view').scrollIntoView({ behavior:'smooth', block:'start' });
  }
  function render() {
    const data = current(), list = CATALOG[activeList];
    document.getElementById('tierlist-title').textContent = list.title;
    document.getElementById('tierlist-subtitle').textContent = list.subtitle;
    const rows = RANKS.map(rank => `<div class="tier-row" data-rank="${rank}"><div class="tier-label tier-${rank.toLowerCase()}">${rank}</div><div class="tier-dropzone" data-rank="${rank}">${data.ranks[rank].map(card).join('')}</div></div>`).join('');
    document.getElementById('tierlist-board').innerHTML = rows;
    document.getElementById('tierlist-selection').innerHTML = data.unranked.map(card).join('') || '<span class="tierlist-complete">Todos os Pokémon já estão em um tier.</span>';
    document.getElementById('tierlist-remaining').textContent = data.unranked.length;
    renderAssignment();
    bindBoard(); save();
  }
  function renderAssignment() {
    const box = document.getElementById('tierlist-assignment');
    if (!selectedPokemonId) { box.classList.add('hidden'); box.innerHTML = ''; document.querySelectorAll('.tier-pokemon').forEach(card => card.classList.remove('selected-for-tier')); return; }
    box.classList.remove('hidden');
    box.innerHTML = `<div class="tierlist-assignment-title">${getName(selectedPokemonId)} — escolha o tier</div><div class="tierlist-assignment-actions">${RANKS.map(rank => `<button class="tier-choose tier-${rank.toLowerCase()}" data-rank="${rank}">${rank}</button>`).join('')}<button class="tier-choose tier-choose-unranked" data-rank="unranked">Sem tier</button><button class="tier-choose-cancel" aria-label="Fechar">×</button></div>`;
    box.querySelectorAll('[data-rank]').forEach(button => button.addEventListener('click', () => move(selectedPokemonId, button.dataset.rank)));
    box.querySelector('.tier-choose-cancel').addEventListener('click', () => { selectedPokemonId = null; renderAssignment(); });
  }
  function move(id, destination, beforeId = null) {
    const data = current();
    data.unranked = data.unranked.filter(item => item !== id);
    RANKS.forEach(rank => data.ranks[rank] = data.ranks[rank].filter(item => item !== id));
    const all = destination === 'unranked' ? data.unranked : data.ranks[destination];
    if (beforeId && beforeId !== id) {
      const index = all.indexOf(beforeId);
      all.splice(index < 0 ? all.length : index, 0, id);
    } else all.push(id);
    selectedPokemonId = null;
    render();
  }
  function bindBoard() {
    document.querySelectorAll('#tierlist-editor .tier-pokemon').forEach(item => {
      item.addEventListener('dragstart', event => { draggedId = Number(item.dataset.pokemon); ignoreClickUntil = Date.now() + 700; event.dataTransfer.setData('text/plain', String(draggedId)); event.dataTransfer.effectAllowed = 'move'; });
      item.addEventListener('click', () => {
        if (Date.now() < ignoreClickUntil) { draggedId = null; return; }
        const id = Number(item.dataset.pokemon);
        selectedPokemonId = selectedPokemonId === id ? null : id;
        document.querySelectorAll('.tier-pokemon').forEach(card => card.classList.toggle('selected-for-tier', Number(card.dataset.pokemon) === selectedPokemonId));
        renderAssignment();
        if (selectedPokemonId) document.getElementById('tierlist-assignment').scrollIntoView({ behavior:'smooth', block:'nearest' });
      });
    });
    document.querySelectorAll('#tierlist-editor .tier-dropzone, #tierlist-selection').forEach(zone => {
      zone.addEventListener('dragover', event => { event.preventDefault(); zone.classList.add('drag-over'); });
      zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
      zone.addEventListener('drop', event => { event.preventDefault(); zone.classList.remove('drag-over'); const id = Number(event.dataTransfer.getData('text/plain')) || draggedId; const beforeId = Number(event.target.closest('[data-pokemon]')?.dataset.pokemon) || null; if (id) move(id, zone.dataset.rank, beforeId); draggedId = null; });
    });
  }

  function activateView(link) {
    const viewId = link.dataset.view;
    const isTierList = viewId === 'tier-list-view';
    document.querySelectorAll('.nav-link[data-view]').forEach(item => item.classList.toggle('active', item.dataset.view === viewId));
    document.body.classList.toggle('show-home', viewId === 'home-view');
    document.body.classList.toggle('show-tier-list', isTierList);
    document.body.classList.toggle('show-favorites', viewId === 'favorites-view');
    ['home-view', 'teambuilder-view', 'tier-list-view', 'favorites-view', 'quiz-view'].forEach(id => document.getElementById(id).classList.toggle('hidden', id !== viewId));
    document.body.classList.toggle('show-quiz', viewId === 'quiz-view');
    const view = document.getElementById(viewId);
    view.classList.remove('view-enter');
    const animated = new Set([
      ...view.children,
      ...view.querySelectorAll('.team-slot, .analysis-card, .stat-card, .tierlist-card, .tier-row, .tier-selection-section, .favorites-board-wrap, .favorites-collection-panel, .favorite-box-card, .quiz-intro, .pokemon-quiz, .quiz-result-layout > *, .quiz-other-matches, .quiz-match-card')
    ]);
    [...animated].forEach((element, index) => {
      element.classList.add('view-animated');
      element.style.animationDelay = `${Math.min(index * 35, 280)}ms`;
    });
    requestAnimationFrame(() => view.classList.add('view-enter'));
    if (isTierList) showCatalog();
    if (viewId === 'favorites-view') window.openFavorites?.();
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderCatalog();
    document.getElementById('tierlist-back').addEventListener('click', showCatalog);
    document.getElementById('tierlist-reset').addEventListener('click', () => {
      if (!window.confirm('Reiniciar esta tier list e mover todos os Pokémon para Sem rank?')) return;
      delete state[activeList]; render();
    });
    document.querySelectorAll('[data-view][href]').forEach(link => link.addEventListener('click', event => {
      event.preventDefault();
      history.replaceState(null, '', link.getAttribute('href'));
      activateView(link);
    }));
    const initialView = [...document.querySelectorAll('.nav-link[data-view]')].find(link => link.getAttribute('href') === window.location.hash);
    if (initialView) activateView(initialView);
  });
})();
