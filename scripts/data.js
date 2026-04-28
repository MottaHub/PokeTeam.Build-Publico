// =============================================
// data.js — Dados de tipos, cores e efetividade
// =============================================

const TYPE_COLORS = {
  normal:   '#A8A878', fire:     '#F08030', water:    '#6890F0',
  electric: '#F8D030', grass:    '#78C850', ice:      '#98D8D8',
  fighting: '#C03028', poison:   '#A040A0', ground:   '#E0C068',
  flying:   '#A890F0', psychic:  '#F85888', bug:      '#A8B820',
  rock:     '#B8A038', ghost:    '#705898', dragon:   '#7038F8',
  dark:     '#705848', steel:    '#B8B8D0', fairy:    '#EE99AC'
};

const TYPE_CHART = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { fire: 0.5, grass: 2, fighting: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};

const ALL_TYPES = Object.keys(TYPE_COLORS);

function getOffensiveMult(attackType, defenderTypes) {
  let mult = 1;
  const eff = TYPE_CHART[attackType] || {};
  defenderTypes.forEach(dt => { if (eff[dt] !== undefined) mult *= eff[dt]; });
  return mult;
}

function getDefensiveMult(attackType, defenderTypes) {
  return getOffensiveMult(attackType, defenderTypes);
}

const STAT_LABELS = {
  hp: 'HP', attack: 'ATK', defense: 'DEF',
  'special-attack': 'SPA', 'special-defense': 'SPD', speed: 'SPE'
};

function statColor(val) {
  if (val >= 110) return '#c8ff00';
  if (val >= 80)  return '#78C850';
  if (val >= 60)  return '#F8D030';
  if (val >= 40)  return '#F08030';
  return '#C03028';
}

// ─── Cache de move types por Pokémon ─────────
const moveTypeCache = {};

async function fetchMoveTypes(pokemon) {
  if (moveTypeCache[pokemon.id]) return moveTypeCache[pokemon.id];

  const learnableMoves = (pokemon.moves || [])
    .filter(m => m.version_group_details.some(
      d => ['level-up', 'machine'].includes(d.move_learn_method.name)
    ))
    .map(m => m.move.url)
    .slice(0, 40);

  const typeSet = new Set();
  pokemon.types.forEach(t => typeSet.add(t.type.name));

  try {
    const results = await Promise.allSettled(
      learnableMoves.map(url => fetch(url).then(r => r.json()))
    );
    results.forEach(r => {
      if (r.status === 'fulfilled' && r.value?.type?.name) {
        typeSet.add(r.value.type.name);
      }
    });
  } catch(e) { console.warn('Erro fetchMoveTypes:', e); }

  moveTypeCache[pokemon.id] = typeSet;
  return typeSet;
}

async function calcRealOffensiveCoverage(team) {
  const offMap = {};
  ALL_TYPES.forEach(t => offMap[t] = 0);

  const moveTypeSets = await Promise.all(team.map(p => fetchMoveTypes(p)));

  team.forEach((p, idx) => {
    const myMoveTypes = moveTypeSets[idx];
    const coveredDefTypes = new Set();
    myMoveTypes.forEach(atkType => {
      ALL_TYPES.forEach(defType => {
        if (getOffensiveMult(atkType, [defType]) >= 2) coveredDefTypes.add(defType);
      });
    });
    coveredDefTypes.forEach(defType => { offMap[defType]++; });
  });

  return offMap;
}

// ─── Sugestão de natureza e EVs ───────────────
function suggestNatureAndEVs(pokemon) {
  const stats = {};
  pokemon.stats.forEach(s => { stats[s.stat.name] = s.base_stat; });

  const atk   = stats['attack'] || 0;
  const spatk = stats['special-attack'] || 0;
  const spe   = stats['speed'] || 0;
  const def   = stats['defense'] || 0;
  const spdef = stats['special-defense'] || 0;
  const hp    = stats['hp'] || 0;

  const isPhysical = atk >= spatk;
  const isFast     = spe >= 80;
  const isTank     = (def + spdef + hp) > 220 && spe < 70;

  if (isTank && !isPhysical) return { nature: 'calm',    evs: '252 HP / 4 Def / 252 SpD',  role: 'Specially Defensive' };
  if (isTank && isPhysical)  return { nature: 'impish',  evs: '252 HP / 252 Def / 4 SpD',  role: 'Physically Defensive' };
  if (isPhysical && isFast)  return { nature: 'jolly',   evs: '252 Atk / 4 Def / 252 Spe', role: 'Physical Sweeper' };
  if (isPhysical && !isFast) return { nature: 'adamant', evs: '252 HP / 252 Atk / 4 Def',  role: 'Bulky Physical' };
  if (!isPhysical && isFast) return { nature: 'timid',   evs: '252 SpA / 4 Def / 252 Spe', role: 'Special Sweeper' };
  return { nature: 'modest', evs: '252 HP / 252 SpA / 4 SpD', role: 'Bulky Special' };
}

function suggestMoves(pokemon, role) {
  const types = pokemon.types.map(t => t.type.name);
  const stats = {};
  pokemon.stats.forEach(s => { stats[s.stat.name] = s.base_stat; });
  const isPhysical = (stats['attack'] || 0) >= (stats['special-attack'] || 0);
  const isTank = role && role.includes('Defensive');

  const moves = [];
  moves.push(`- ${getSignatureMove(types[0], isPhysical)}`);
  if (types[1]) {
    moves.push(`- ${getSignatureMove(types[1], isPhysical)}`);
  } else {
    moves.push(`- ${getSignatureMove(types[0], isPhysical, true)}`);
  }
  moves.push(`- ${getCoverageMove(types, isPhysical)}`);
  moves.push(isTank ? '- Recover' : '- Protect');
  return moves;
}

function getSignatureMove(type, physical, alt = false) {
  const pm = {
    normal: ['Return','Facade'], fire: ['Flare Blitz','Fire Punch'],
    water: ['Waterfall','Aqua Jet'], electric: ['Wild Charge','Thunder Punch'],
    grass: ['Wood Hammer','Seed Bomb'], ice: ['Icicle Crash','Ice Punch'],
    fighting: ['Close Combat','Drain Punch'], poison: ['Poison Jab','Gunk Shot'],
    ground: ['Earthquake','High Horsepower'], flying: ['Brave Bird','Aerial Ace'],
    psychic: ['Zen Headbutt','Psycho Cut'], bug: ['U-turn','X-Scissor'],
    rock: ['Stone Edge','Rock Slide'], ghost: ['Shadow Claw','Shadow Sneak'],
    dragon: ['Outrage','Dragon Claw'], dark: ['Crunch','Knock Off'],
    steel: ['Iron Head','Bullet Punch'], fairy: ['Play Rough','Fairy Wind']
  };
  const sm = {
    normal: ['Hyper Voice','Swift'], fire: ['Flamethrower','Fire Blast'],
    water: ['Surf','Hydro Pump'], electric: ['Thunderbolt','Thunder'],
    grass: ['Giga Drain','Energy Ball'], ice: ['Ice Beam','Blizzard'],
    fighting: ['Focus Blast','Aura Sphere'], poison: ['Sludge Bomb','Sludge Wave'],
    ground: ['Earth Power','Mud Bomb'], flying: ['Air Slash','Hurricane'],
    psychic: ['Psychic','Psyshock'], bug: ['Bug Buzz','Signal Beam'],
    rock: ['Power Gem','Ancient Power'], ghost: ['Shadow Ball','Hex'],
    dragon: ['Draco Meteor','Dragon Pulse'], dark: ['Dark Pulse','Night Daze'],
    steel: ['Flash Cannon','Doom Desire'], fairy: ['Moonblast','Dazzling Gleam']
  };
  const pool = (physical ? pm : sm)[type];
  if (!pool) return physical ? 'Tackle' : 'Swift';
  return alt ? (pool[1] || pool[0]) : pool[0];
}

function getCoverageMove(types, physical) {
  const cm = {
    fire: physical ? 'Earthquake' : 'Focus Blast',
    water: physical ? 'Ice Punch' : 'Ice Beam',
    grass: physical ? 'Poison Jab' : 'Sludge Bomb',
    electric: physical ? 'Ice Punch' : 'Focus Blast',
    ice: physical ? 'Earthquake' : 'Energy Ball',
    fighting: 'Ice Punch', psychic: physical ? 'Shadow Claw' : 'Shadow Ball',
    ghost: physical ? 'Crunch' : 'Dark Pulse',
    dragon: physical ? 'Iron Head' : 'Flash Cannon',
    dark: physical ? 'Sucker Punch' : 'Focus Blast',
    steel: physical ? 'Earthquake' : 'Flamethrower',
    fairy: physical ? 'Poison Jab' : 'Psyshock',
    normal: physical ? 'Earthquake' : 'Shadow Ball',
    rock: physical ? 'Earthquake' : 'Fire Blast',
    ground: physical ? 'Stone Edge' : 'Earth Power',
    flying: physical ? 'Return' : 'Heat Wave',
    bug: physical ? 'Iron Head' : 'Energy Ball',
    poison: physical ? 'Earthquake' : 'Sludge Wave'
  };
  return cm[types[0]] || (physical ? 'Earthquake' : 'Shadow Ball');
}