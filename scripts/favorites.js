(() => {
  const API = 'https://pokeapi.co/api/v2';
  const MAX_ID = 1302;
  const STORAGE_KEY = 'poketeam_favorites_board_v1';
  const GENERATIONS = [
    ['I',1,151],['II',152,251],['III',252,386],['IV',387,493],['V',494,649],
    ['VI',650,721],['VII',722,809],['VIII',810,905],['IX',906,1025]
  ];
  const TYPES = [
    ['normal','Normal'],['fire','Fogo'],['water','Água'],['grass','Grama'],['electric','Elétrico'],['ice','Gelo'],
    ['fighting','Lutador'],['psychic','Psíquico'],['rock','Pedra'],['flying','Voador'],['fairy','Fada'],['bug','Inseto'],
    ['poison','Veneno'],['ground','Terra'],['ghost','Fantasma'],['dragon','Dragão'],['dark','Noturno'],['steel','Aço']
  ];
  const CATEGORIES = [
    ['regional-bird','Pássaro regional'],['regional-mammal','Mamífero regional'],['regional-bug','Inseto regional'],['grass-girl','Inicial de grama'],
    ['pseudo-legendary','Pseudo-lendário'],['fossil','Fóssil favorito'],['mystery-dungeon','Herói de Mystery Dungeon'],['baby','Pokémon bebê'],
    ['box-legendary','Lendário de capa'],['mythical','Mítico'],['mega','Mega evolução'],['ultra-beast','Ultra Beast'],
    ['gigantamax','Gigantamax'],['paradox','Paradoxo'],['regional-form','Forma regional'],['new-evolution','Nova evolução'],
    ['type','Tipo favorito'],['pokeball','Poké Bola favorita'],['pikachu-clone','Clone do Pikachu'],['eeveelution','Evolução do Eevee'],
    ['spinda','Spinda'],['vivillon','Vivillon'],['furfrou','Furfrou'],['alcremie','Alcremie']
  ];
  const CATEGORY_POOLS = {
    'regional-bird':[16,17,18,163,164,276,277,396,397,398,519,520,521,661,662,663,731,732,733,821,822,823,940,941],
    'regional-mammal':[19,20,161,162,263,264,399,400,504,505,659,660,734,735,819,820,915,916],
    'regional-bug':[10,11,12,13,14,15,265,266,267,268,269,401,402,540,541,542,664,665,666,736,737,738,824,825,826,917,918],
    'grass-girl':[1,2,3,152,153,154,252,253,254,387,388,389,495,496,497,650,651,652,722,723,724,810,811,812,906,907,908],
    'pseudo-legendary':[147,148,149,246,247,248,371,372,373,374,375,376,443,444,445,633,634,635,704,705,706,782,783,784,885,886,887,996,997,998],
    'fossil':[138,139,140,141,142,345,346,347,348,408,409,410,411,564,565,566,567,696,697,698,699,880,881,882,883],
    'mystery-dungeon':[1,4,7,25,37,52,54,66,104,133,152,155,158,231,246,252,255,258,300,403,447,495,498,501,650,653,656,722,725,728],
    'baby':[172,173,174,175,236,238,239,240,298,360,406,433,438,439,440,446,447,458,848],
    'box-legendary':[150,249,250,382,383,384,483,484,487,643,644,646,716,717,718,791,792,800,888,889,890,898,1007,1008,1024],
    'mythical':[151,251,385,386,489,490,491,492,493,494,647,648,649,719,720,721,801,802,807,808,809,893,1025],
    'mega':[3,6,9,15,18,65,80,94,115,127,130,142,150,181,208,212,214,229,248,254,257,260,282,302,303,306,308,310,319,323,334,354,359,362,373,376,380,381,384,428,445,448,460,475,531,719],
    'ultra-beast':[793,794,795,796,797,798,799,803,804,805,806],
    'gigantamax':[3,6,9,12,25,52,68,94,99,131,133,143,569,809,812,815,818,823,826,834,839,841,842,844,849,851,858,861,869,879,884,892],
    'paradox':[984,985,986,987,988,989,990,991,992,993,994,995,1005,1006,1009,1010,1020,1021,1022,1023],
    'regional-form':[19,20,26,27,28,37,38,50,51,52,53,74,75,76,77,78,79,80,83,88,89,100,101,103,105,110,122,144,145,146,199,222,263,264,554,555,562,618,741,745,849],
    'new-evolution':[182,186,196,197,199,208,212,215,233,242,253,254,267,269,271,272,274,275,286,298,301,308,315,346,348,358,367,368,424,461,462,463,464,465,466,467,468,469,470,471,472,473,474,475,477,478,429,430,448,448,700,700,858,862,869,900,902,903,904,1000,1006,1017,1025],
    'pikachu-clone':[172,311,312,417,587,702,777,877,921,922,923],
    'eeveelution':[134,135,136,196,197,470,471,700],
    'pokeball':[100,101,590,591],
    'spinda':[327], 'vivillon':[666], 'furfrou':[676], 'alcremie':[869]
  };
  const FORM_SUFFIXES = {
    'regional-form': /-(alola|galar|hisui|paldea)$/,
    'mega': /-mega(?:-[xy])?$/,
    'gigantamax': /-gmax$/,
    'pokeball': /-hisui$/
  };
  const CUSTOM_COUNT = 3;
  let pokemon = [];
  let selections = loadSaved();
  let activeTarget = null;
  let loading = false;
  selections.team ||= [];
  selections.categories ||= {};
  selections.customNames ||= [];

  function loadSaved() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; } }
  function save() { localStorage.setItem(STORAGE_KEY,JSON.stringify(selections)); }
  function keyFor(gen,type) { return gen + ':' + type; }
  function generationFor(id) { return GENERATIONS.findIndex(([,min,max]) => id >= min && id <= max) + 1; }
  function esc(value) { return String(value).replace(/[&<>"']/g,char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
  function pokemonById(id) { return pokemon.find(mon => mon.id === Number(id)); }

  function renderBoard() {
    const cells = GENERATIONS.map(([generation],index) => '<div class="favorite-generation-head"><span>' + generation + '</span><small>GEN</small></div>' + TYPES.map(([type,label]) => {
      const key = keyFor(index + 1,type), mon = pokemonById(selections[key]);
      const contents = mon ? '<img loading="lazy" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' + mon.id + '.png" alt=""><span>' + esc(mon.displayName) + '</span><i class="favorite-remove" data-remove="' + key + '" title="Remover">×</i>' : '<span class="empty-mark">＋</span>';
      return '<button class="favorite-cell type-' + type + ' ' + (mon ? 'filled' : '') + '" data-gen="' + (index+1) + '" data-type="' + type + '" title="' + (mon ? 'Trocar ' + esc(mon.displayName) : 'Escolher favorito ' + label + ' da geração ' + generation) + '" aria-label="' + (mon ? esc(mon.displayName) : 'Escolher favorito ' + label + ' da geração ' + generation) + '">' + contents + '</button>';
    }).join('')).join('');
    document.getElementById('favorites-board').innerHTML = '<div class="favorites-corner">GERAÇÃO<br>／ TIPO</div>' + TYPES.map(([type,label]) => '<div class="favorite-column-head type-' + type + '" title="' + label + '"><span>✦</span><small>' + label + '</small></div>').join('') + cells;
    document.querySelectorAll('.favorite-cell').forEach(button => button.addEventListener('click',event => {
      const remove = event.target.closest('[data-remove]');
      if (remove) { delete selections[remove.dataset.remove]; save(); renderBoard(); return; }
      const gen = Number(button.dataset.gen), type = button.dataset.type;
      openPicker({kind:'matrix',key:keyFor(gen,type),gen:gen,type:type});
    }));
    const count = Object.keys(selections).filter(key => /^\d+:/.test(key)).length;
    document.getElementById('favorite-status').textContent = count + ' favoritos por geração e tipo';
  }

  function renderBox(title,kind,key,id,index) {
    const mon = pokemonById(id);
    const selectedType = kind === 'category' && key === 'type' && id;
    const typeLabel = selectedType ? (TYPES.find(([type]) => type === id)?.[1] || id) : '';
    const titlePart = kind === 'custom'
      ? '<input class="favorite-custom-name" data-custom-index="' + index + '" aria-label="Nome da categoria personalizada ' + (Number(index)+1) + '" value="' + esc(title) + '" maxlength="26">'
      : '<div class="favorite-box-title">' + esc(title) + '</div>';
    const inner = selectedType
      ? '<span class="favorite-type-chip" style="--type-color:' + (TYPE_COLORS[id] || '#aa9ee8') + '">' + esc(typeLabel) + '</span>'
      : mon ? '<img loading="lazy" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' + mon.id + '.png" alt=""><span>' + esc(mon.displayName) + '</span>'
      : '<span class="favorite-box-plus">' + (kind === 'team' ? Number(index)+1 : '＋') + '</span>';
    const hasValue = Boolean(mon || selectedType);
    const chosenName = selectedType ? typeLabel : mon?.displayName;
    return '<div class="favorite-box-card ' + (kind === 'team' ? 'team-box' : '') + '">' + titlePart + '<button class="favorite-box-select ' + (hasValue ? 'has-pokemon' : '') + '" data-picker-kind="' + kind + '" data-picker-key="' + esc(key) + '" title="' + (hasValue ? 'Trocar ' + esc(chosenName) : 'Escolher ' + esc(title)) + '">' + inner + '</button>' + (hasValue ? '<button class="favorite-box-remove" data-clear-kind="' + kind + '" data-clear-key="' + esc(key) + '" aria-label="Remover ' + esc(chosenName) + '">×</button>' : '') + '</div>';
  }

  function renderCollection() {
    document.getElementById('favorite-team').innerHTML = Array.from({length:6},(_,index) => renderBox('Slot ' + (index+1),'team',index,selections.team[index],index)).join('');
    document.getElementById('favorite-category-grid').innerHTML = CATEGORIES.map(([key,label]) => renderBox(label,'category',key,selections.categories[key],'')).join('') + Array.from({length:CUSTOM_COUNT},(_,index) => renderBox(selections.customNames[index] || 'Personalizada ' + (index+1),'custom','custom-' + index,selections.categories['custom-' + index],index)).join('');
    document.querySelectorAll('.favorite-box-select').forEach(button => button.addEventListener('click',() => openPicker({kind:button.dataset.pickerKind,key:button.dataset.pickerKey})));
    document.querySelectorAll('.favorite-box-remove').forEach(button => button.addEventListener('click',() => {
      if (button.dataset.clearKind === 'team') selections.team[Number(button.dataset.clearKey)] = null;
      else delete selections.categories[button.dataset.clearKey];
      save(); renderCollection();
    }));
    document.querySelectorAll('.favorite-custom-name').forEach(input => input.addEventListener('change',() => {
      const index = Number(input.dataset.customIndex);
      selections.customNames[index] = input.value.trim() || 'Personalizada ' + (index+1);
      save(); renderCollection();
    }));
  }

  function openPicker(target) {
    activeTarget = target;
    let context = 'ESCOLHER POKÉMON';
    if (target.kind === 'matrix') context = 'GERAÇÃO ' + GENERATIONS[target.gen-1][0] + ' · ' + TYPES.find(([id]) => id === target.type)[1].toUpperCase();
    else if (target.kind === 'team') context = 'TIME · SLOT ' + (Number(target.key)+1);
    else context = (CATEGORIES.find(([id]) => id === target.key)?.[1] || selections.customNames[Number(target.key.split('-')[1])] || 'CATEGORIA PERSONALIZADA').toUpperCase();
    document.getElementById('favorite-picker-context').textContent = context;
    const selectingType = target.kind === 'category' && target.key === 'type';
    document.getElementById('favorite-picker-title').textContent = selectingType ? 'Escolha seu tipo' : 'Escolha seu Pokémon';
    document.querySelector('.favorites-toolbar').classList.toggle('hidden',selectingType);
    document.getElementById('favorite-search').value = '';
    const genFilter = document.getElementById('favorite-picker-generation');
    const typeFilter = document.getElementById('favorite-picker-type');
    genFilter.value = target.gen ? String(target.gen) : 'all';
    typeFilter.value = target.type || 'all';
    genFilter.disabled = target.kind === 'matrix';
    typeFilter.disabled = target.kind === 'matrix';
    document.getElementById('favorite-picker').classList.remove('hidden');
    renderPicker();
    document.getElementById('favorite-picker').scrollIntoView({behavior:'smooth',block:'nearest'});
    document.getElementById('favorite-search').focus({preventScroll:true});
  }

  function renderPicker() {
    if (!activeTarget) return;
    if (activeTarget.kind === 'category' && activeTarget.key === 'type') {
      document.getElementById('favorite-picker-count').textContent = '18 tipos disponíveis';
      document.getElementById('favorite-grid').innerHTML = TYPES.map(([type,label]) => '<button class="favorite-type-option" data-type-id="' + type + '" style="--type-color:' + (TYPE_COLORS[type] || '#aa9ee8') + '"><span>' + label + '</span></button>').join('');
      document.querySelectorAll('.favorite-type-option').forEach(button => button.addEventListener('click',() => {
        selections.categories.type = button.dataset.typeId;
        save(); closePicker(); renderCollection();
      }));
      return;
    }
    if (!pokemon.length) return;
    const query = document.getElementById('favorite-search').value.trim().toLowerCase();
    const generationFilter = document.getElementById('favorite-picker-generation').value;
    const typeFilter = document.getElementById('favorite-picker-type').value;
    const gen = activeTarget.gen || (generationFilter === 'all' ? 0 : Number(generationFilter));
    const type = activeTarget.type || typeFilter;
    const allowedIds = activeTarget.kind === 'category' ? CATEGORY_POOLS[activeTarget.key] : null;
    const baseIdsByName = new Map(pokemon.filter(mon => mon.id <= 1025).map(mon => [mon.name,mon.id]));
    const suffix = activeTarget.kind === 'category' ? FORM_SUFFIXES[activeTarget.key] : null;
    const list = pokemon.filter(mon => {
      const baseName = suffix && mon.name.match(suffix) ? mon.name.replace(suffix,'') : '';
      const inCategory = !allowedIds || allowedIds.includes(mon.id) || (baseName && allowedIds.includes(baseIdsByName.get(baseName)));
      return inCategory && (!gen || generationFor(mon.id) === gen) && (!query || mon.name.includes(query)) && (type === 'all' || mon.types.includes(type));
    });
    const count = document.getElementById('favorite-picker-count');
    count.textContent = allowedIds ? list.length + ' opções desta categoria' : list.length + ' Pokémon disponíveis';
    const grid = document.getElementById('favorite-grid');
    grid.innerHTML = list.map(mon => '<button class="favorite-pokemon" data-id="' + mon.id + '" title="' + esc(mon.displayName) + '"><span class="favorite-pokemon-sprite"><img loading="lazy" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' + mon.id + '.png" alt=""></span><span>' + esc(mon.displayName) + '</span></button>').join('') || '<p class="favorite-empty">Nenhum Pokémon encontrado com esses filtros.</p>';
    grid.querySelectorAll('[data-id]').forEach(button => button.addEventListener('click',() => {
      const id = Number(button.dataset.id);
      if (activeTarget.kind === 'matrix') selections[activeTarget.key] = id;
      else if (activeTarget.kind === 'team') selections.team[Number(activeTarget.key)] = id;
      else selections.categories[activeTarget.key] = id;
      save(); closePicker(); renderBoard(); renderCollection();
    }));
  }

  function closePicker() { document.getElementById('favorite-picker').classList.add('hidden'); activeTarget = null; }

  async function loadPokemon() {
    if (loading || pokemon.length) return;
    loading = true;
    document.getElementById('favorite-status').textContent = 'Carregando Pokémon e tipos...';
    try {
      const response = await fetch(API + '/pokemon?limit=' + MAX_ID);
      if (!response.ok) throw new Error('PokéAPI indisponível');
      const data = await response.json();
      pokemon = data.results.map((entry,index) => ({id:Number(entry.url.match(/\/pokemon\/(\d+)\/$/)?.[1]) || index+1,name:entry.name,displayName:entry.name.replace(/-/g,' '),types:[]}));
      await Promise.all(TYPES.map(async ([type]) => {
        try {
          const response = await fetch(API + '/type/' + type),data = await response.json();
          const ids = new Set(data.pokemon.map(item => Number(item.pokemon.url.match(/\/pokemon\/(\d+)\/$/)?.[1])).filter(Boolean));
          pokemon.forEach(mon => {if (ids.has(mon.id)) mon.types.push(type);});
        } catch { /* mantém as outras opções disponíveis */ }
      }));
      renderBoard(); renderCollection();
      if (activeTarget) renderPicker();
    } catch {
      document.getElementById('favorite-status').textContent = 'Não foi possível carregar os Pokémon. Confira sua conexão e tente novamente.';
    } finally { loading = false; }
  }

  document.addEventListener('DOMContentLoaded',() => {
    GENERATIONS.forEach(([label],index) => document.getElementById('favorite-picker-generation').insertAdjacentHTML('beforeend','<option value="' + (index+1) + '">Geração ' + label + '</option>'));
    TYPES.forEach(([key,label]) => document.getElementById('favorite-picker-type').insertAdjacentHTML('beforeend','<option value="' + key + '">' + label + '</option>'));
    document.getElementById('favorite-search').addEventListener('input',renderPicker);
    document.getElementById('favorite-picker-generation').addEventListener('change',renderPicker);
    document.getElementById('favorite-picker-type').addEventListener('change',renderPicker);
    document.getElementById('favorite-picker-close').addEventListener('click',closePicker);
    document.getElementById('favorites-clear').addEventListener('click',() => {
      const hasChoices = Object.keys(selections).some(key => /^\d+:/.test(key) && selections[key]) || selections.team.some(Boolean) || Object.values(selections.categories).some(Boolean);
      if (!hasChoices || !window.confirm('Apagar todos os favoritos salvos?')) return;
      selections = {team:[],categories:{},customNames:[]}; save(); closePicker(); renderBoard(); renderCollection();
    });
    renderBoard(); renderCollection();
  });
  window.openFavorites = loadPokemon;
})();
