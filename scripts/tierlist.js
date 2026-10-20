(() => {
  const RANKS = ['S', 'A', 'B', 'C', 'D', 'F'];
  const STARTERS = [
    [1,'Bulbasaur'],[4,'Charmander'],[7,'Squirtle'],[152,'Chikorita'],[155,'Cyndaquil'],[158,'Totodile'],
    [252,'Treecko'],[255,'Torchic'],[258,'Mudkip'],[387,'Turtwig'],[390,'Chimchar'],[393,'Piplup'],
    [495,'Snivy'],[498,'Tepig'],[501,'Oshawott'],[650,'Chespin'],[653,'Fennekin'],[656,'Froakie'],
    [722,'Rowlet'],[725,'Litten'],[728,'Popplio'],[810,'Grookey'],[813,'Scorbunny'],[816,'Sobble'],
    [906,'Sprigatito'],[909,'Fuecoco'],[912,'Quaxly']
  ];
  const LEGENDARY_IDS = [144,145,146,150,243,244,245,249,250,377,378,379,380,381,382,383,384,480,481,482,483,484,485,486,487,488,638,639,640,641,642,643,644,645,646,716,717,718,772,773,785,786,787,788,789,790,791,792,800,888,889,890,891,892,894,895,896,897,898,905,1007,1008,1014,1015,1016,1017,1020,1021,1022,1023,1024];
  const MYTHICAL_IDS = [151,251,385,386,489,490,491,492,493,494,647,648,649,719,720,721,801,802,807,808,809,893,1025];
  const ULTRA_BEAST_IDS = [793,794,795,796,797,798,799,803,804,805,806];
  const TYPE_ENTRIES = [[1,'Normal'],[10,'Fogo'],[11,'Água'],[12,'Grama'],[13,'Elétrico'],[15,'Gelo'],[2,'Lutador'],[14,'Psíquico'],[6,'Pedra'],[3,'Voador'],[18,'Fada'],[7,'Inseto'],[4,'Veneno'],[5,'Terra'],[8,'Fantasma'],[16,'Dragão'],[17,'Noturno'],[9,'Aço']];
  let pokemonSpecies = null;
  let pokemonSpeciesRequest = null;
  const CATALOG = {
    starters: { title: 'Melhores Pokémon iniciais', subtitle: 'Os 27 iniciais das nove gerações.', pokemon: STARTERS },
    eeveelutions: { title: 'Melhor evolução do Eevee', subtitle: 'Compare o Eevee e todas as suas evoluções.', pokemon: [[133,'Eevee'],[134,'Vaporeon'],[135,'Jolteon'],[136,'Flareon'],[196,'Espeon'],[197,'Umbreon'],[470,'Leafeon'],[471,'Glaceon'],[700,'Sylveon']] },
    pseudos: { title: 'Melhores pseudo-lendários', subtitle: 'De Dratini a Frigibax: escolha sua linha favorita.', pokemon: [[149,'Dragonite'],[248,'Tyranitar'],[373,'Salamence'],[376,'Metagross'],[445,'Garchomp'],[635,'Hydreigon'],[706,'Goodra'],[784,'Kommo-o'],[887,'Dragapult'],[998,'Baxcalibur']] },
    pikachu: { title: 'Melhores Pikaclones', subtitle: 'Pikachu, suas formas e seus parceiros elétricos.', pokemon: [[25,'Pikachu'],[26,'Raichu'],[10100,'Raichu de Alola',null,26],[12000,'Mega Raichu X','raichu-mega-x',26],[12001,'Mega Raichu Y','raichu-mega-y',26],[172,'Pichu'],[181,'Ampharos'],[311,'Plusle'],[312,'Minun'],[417,'Pachirisu'],[587,'Emolga'],[702,'Dedenne'],[777,'Togedemaru'],[877,'Morpeko'],[921,'Pawmi'],[922,'Pawmo'],[923,'Pawmot'],[1017,'Miraidon']] },
    all: { title: 'Todos os Pokémon', subtitle: 'Rankeie os 1.025 Pokémon de todas as gerações.', pokemon: [], count: 1025, remote: true },
    types: { title: 'Melhores tipos Pokémon', subtitle: 'Rankeie os 18 tipos Pokémon.', pokemon: TYPE_ENTRIES, cardKind: 'type' },
    legendary: { title: 'Melhores Pokémon lendários', subtitle: 'Rankeie os Pokémon lendários de todas as gerações.', pokemon: [], count: LEGENDARY_IDS.length, remote: true },
    mythical: { title: 'Melhores Pokémon míticos', subtitle: 'Rankeie os Pokémon míticos de todas as gerações.', pokemon: [], count: MYTHICAL_IDS.length, remote: true },
    ultraBeasts: { title: 'Melhores Ultra Beasts', subtitle: 'Rankeie as Ultra Beasts conhecidas.', pokemon: [], count: ULTRA_BEAST_IDS.length, remote: true },
    special: { title: 'Lendários, míticos e Ultra Beasts', subtitle: 'Compare todos os lendários, míticos e Ultra Beasts em uma lista.', pokemon: [], count: new Set([...LEGENDARY_IDS,...MYTHICAL_IDS,...ULTRA_BEAST_IDS]).size, remote: true }
  };
  const STORAGE_KEY = 'poketeam_tierlists_v1';
  let state = readState();
  let activeList = 'starters';
  let draggedId = null;
  let selectedPokemonId = null;
  let ignoreClickUntil = 0;
  let selectionSearch = '';

  function readState() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; } }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function formatName(name) { return name.replace(/-/g,' ').replace(/\b\p{L}/gu, letter => letter.toUpperCase()); }
  async function ensurePokemonSpecies() {
    if (pokemonSpecies) return pokemonSpecies;
    if (!pokemonSpeciesRequest) pokemonSpeciesRequest = fetch('https://pokeapi.co/api/v2/pokemon-species?limit=2000')
      .then(response => { if (!response.ok) throw new Error('Falha ao carregar a Pokédex'); return response.json(); })
      .then(data => data.results.map(entry => ({ id:Number(entry.url.match(/\/pokemon-species\/(\d+)\/$/)?.[1]), name:formatName(entry.name) })).filter(item => item.id).sort((a,b)=>a.id-b.id))
      .then(list => { pokemonSpecies = list; return list; })
      .catch(error => { pokemonSpeciesRequest = null; throw error; });
    return pokemonSpeciesRequest;
  }
  async function loadRemoteCatalog(key) {
    const species = await ensurePokemonSpecies();
    const names = new Map(species.map(mon => [mon.id,mon.name]));
    if (key === 'all') {
      CATALOG.all.count = species.length;
      CATALOG.all.subtitle = `Rankeie os ${species.length.toLocaleString('pt-BR')} Pokémon de todas as gerações.`;
      const count = document.querySelector('.tierlist-card[data-list="all"] small');
      if (count) count.textContent = `${species.length.toLocaleString('pt-BR')} Pokémon`;
    }
    const ids = key === 'all' ? species.map(mon => mon.id)
      : key === 'legendary' ? LEGENDARY_IDS
      : key === 'mythical' ? MYTHICAL_IDS
      : key === 'ultraBeasts' ? ULTRA_BEAST_IDS
      : [...new Set([...LEGENDARY_IDS,...MYTHICAL_IDS,...ULTRA_BEAST_IDS])];
    CATALOG[key].pokemon = ids.filter(id => names.has(id)).map(id => [id,names.get(id)]);
  }
  function spriteUrl(id) {
    if (CATALOG[activeList].cardKind === 'type') return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/${id}.png`;
    const entry = CATALOG[activeList].pokemon.find(item => item[0] === id);
    if (entry?.[2]) return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${entry[2]}.png`;
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  }
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
  function card(id) { const draggable = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches ? 'false' : 'true'; const entry=CATALOG[activeList].pokemon.find(item=>item[0]===id); const fallbackId=entry?.[3]||id; return `<button class="tier-pokemon ${CATALOG[activeList].cardKind === 'type' ? 'tier-type-card' : ''}" draggable="${draggable}" data-pokemon="${id}" title="${getName(id)}"><img loading="lazy" src="${spriteUrl(id)}" onerror="this.onerror=null;this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${fallbackId}.png'" alt=""><span>${getName(id)}</span></button>`; }
  function renderCatalog() {
    document.getElementById('tierlist-catalog').innerHTML = Object.entries(CATALOG).map(([key, list], index) => `<button class="tierlist-card tierlist-card-${index + 1}" data-list="${key}"><span class="tierlist-card-label">TIER LIST</span><strong>${list.title}</strong><small>${list.count ?? list.pokemon.length} Pokémon</small><span class="tierlist-card-arrow">→</span></button>`).join('');
    document.querySelectorAll('.tierlist-card').forEach(button => button.addEventListener('click', async () => {
      activeList = button.dataset.list;
      selectionSearch = '';
      document.getElementById('tierlist-home').classList.add('hidden');
      document.getElementById('tierlist-editor').classList.remove('hidden');
      if (CATALOG[activeList].remote && !CATALOG[activeList].pokemon.length) {
        const targetList = activeList;
        const list = CATALOG[targetList];
        document.getElementById('tierlist-title').textContent = list.title;
        document.getElementById('tierlist-subtitle').textContent = list.subtitle;
        document.querySelector('.tier-selection-section').classList.toggle('tier-selection-large', targetList === 'all');
        document.getElementById('tierlist-board').innerHTML = '';
        document.getElementById('tierlist-remaining').textContent = list.count;
        document.getElementById('tierlist-search').classList.add('hidden');
        document.getElementById('tierlist-assignment').classList.add('hidden');
        document.getElementById('tierlist-selection').innerHTML = '<span class="tierlist-complete">Carregando Pokémon…</span>';
        document.getElementById('tierlist-editor').scrollIntoView({ behavior:'smooth', block:'start' });
        try { await loadRemoteCatalog(targetList); if (activeList === targetList && !document.getElementById('tierlist-editor').classList.contains('hidden')) render(); }
        catch { if (activeList === targetList && !document.getElementById('tierlist-editor').classList.contains('hidden')) document.getElementById('tierlist-selection').innerHTML = '<span class="tierlist-complete">Não foi possível carregar a Pokédex. Volte e tente novamente.</span>'; }
      } else { render(); document.getElementById('tierlist-editor').scrollIntoView({ behavior:'smooth', block:'start' }); }
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
    document.querySelector('.tier-selection-section').classList.toggle('tier-selection-large', activeList === 'all');
    const rows = RANKS.map(rank => `<div class="tier-row" data-rank="${rank}"><div class="tier-label tier-${rank.toLowerCase()}">${rank}</div><div class="tier-dropzone" data-rank="${rank}">${data.ranks[rank].map(card).join('')}</div></div>`).join('');
    document.getElementById('tierlist-board').innerHTML = rows;
    const search = document.getElementById('tierlist-search');
    search.classList.toggle('hidden', activeList !== 'all');
    search.value = selectionSearch;
    search.oninput = () => { selectionSearch = search.value.trim().toLocaleLowerCase(); renderSelection(data); bindPokemonCards(document.getElementById('tierlist-selection')); };
    renderSelection(data);
    document.getElementById('tierlist-remaining').textContent = data.unranked.length;
    renderAssignment();
    bindBoard(); save();
  }
  function renderSelection(data) {
    const filtered = data.unranked.filter(id => !selectionSearch || getName(id).toLocaleLowerCase().includes(selectionSearch));
    document.getElementById('tierlist-selection').innerHTML = filtered.map(card).join('') || (data.unranked.length ? '<span class="tierlist-complete">Nenhum Pokémon encontrado.</span>' : '<span class="tierlist-complete">Todos os Pokémon já estão em um tier.</span>');
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
  function bindPokemonCards(container = document) {
    container.querySelectorAll('.tier-pokemon').forEach(item => {
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
  }
  function bindBoard() {
    bindPokemonCards(document.getElementById('tierlist-editor'));
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
