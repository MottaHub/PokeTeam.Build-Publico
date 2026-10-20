(() => {
  const API = 'https://pokeapi.co/api/v2';
  const CACHE_KEY = 'pokebuild_quiz_pokemon_v2';
  const GRAPHQL_URL = 'https://graphql.pokeapi.co/v1beta2';
  const GRAPHQL_QUERY = offset => `query QuizPokemon {
    pokemon(limit: 1000, offset: ${offset}, order_by: {id: asc}) {
      id name
      pokemonstats { base_stat stat { name } }
      pokemontypes { type { name } }
      pokemonabilities { ability { name } }
      pokemonspecy {
        pokemonspeciesflavortexts(where: {language: {name: {_in: ["en", "pt-br"]}}}, limit: 8) {
          flavor_text language { name } version { name }
        }
      }
    }
  }`;
  const LIMITS = [12, 30, 60, 90, 120];
  const AXES = [
    ['Reservado', 'Energético'], ['Cauteloso', 'Corajoso'],
    ['Independente', 'Sociável'], ['Tranquilo', 'Explorador']
  ];
  const TYPE_PROFILES = {
    normal:[0,0,0,0], fire:[1,1,0,1], water:[-1,-1,1,0], electric:[2,1,1,1], grass:[-1,-1,1,-1],
    ice:[0,0,-1,1], fighting:[1,2,0,1], poison:[-1,1,-1,0], ground:[-1,1,-1,-1], flying:[1,0,0,2],
    psychic:[-1,0,-1,2], bug:[0,0,1,1], rock:[-1,1,-1,-1], ghost:[-1,1,-2,2], dragon:[1,2,0,2],
    dark:[-1,1,-2,1], steel:[-1,1,-1,0], fairy:[1,0,2,1]
  };
  // Natures are an interpretive label for the quiz profile, not a fixed trait of a species.
  // The vectors use the quiz's four axes and keep the standard competitive nature names.
  const NATURE_PROFILES = [
    ['Hardy',       [ 0, 0, 0, 0]], ['Lonely',     [-1, 1,-2, 0]],
    ['Brave',       [ 1, 2,-1, 0]], ['Adamant',    [ 1, 2,-1, 0]],
    ['Naughty',     [ 2, 1, 1, 1]], ['Bold',       [-1,-1, 1,-1]],
    ['Docile',      [ 0,-1, 1,-1]], ['Relaxed',    [-2,-1,-1,-2]],
    ['Impish',      [ 0, 1,-1, 0]], ['Lax',        [ 0,-1, 1, 0]],
    ['Timid',       [-2,-2,-1, 1]], ['Hasty',      [ 2, 0, 0, 2]],
    ['Serious',     [ 0, 0, 0, 0]], ['Jolly',      [ 2, 1, 2, 2]],
    ['Naive',       [ 2, 1, 0, 2]], ['Modest',     [-1, 0,-1, 0]],
    ['Mild',        [-1,-1, 1, 0]], ['Quiet',      [-2,-1,-2,-2]],
    ['Bashful',     [ 0, 0, 0, 0]], ['Rash',       [ 2, 1,-1, 2]],
    ['Calm',        [-2,-2, 1,-2]], ['Gentle',     [-1,-1, 2,-1]],
    ['Sassy',       [-2, 1,-1,-2]], ['Careful',    [-2,-2,-1,-1]],
    ['Quirky',      [ 0, 0, 1, 1]]
  ];
  const NATURE_DESCRIPTIONS = {
    Hardy:'estável e perseverante; costuma manter a calma e seguir em frente.',
    Lonely:'independente e introspectivo; valoriza ter espaço para fazer as coisas à sua maneira.',
    Brave:'corajoso e decidido; encara desafios mesmo quando eles parecem difíceis.',
    Adamant:'firme nas próprias convicções; quando acredita em algo, dificilmente desiste.',
    Naughty:'travesso e espontâneo; gosta de agir com liberdade e um toque de ousadia.',
    Bold:'confiante e destemido; não costuma se intimidar diante de situações novas.',
    Docile:'dócil e gentil; tende a ser paciente, receptivo e fácil de conviver.',
    Relaxed:'tranquilo e despreocupado; prefere respeitar o próprio ritmo.',
    Impish:'brincalhão e levado; gosta de provocar risadas e aprontar de vez em quando.',
    Lax:'descontraído e flexível; não se prende demais a regras ou pequenas preocupações.',
    Timid:'reservado e cauteloso; prefere observar e se sentir seguro antes de se arriscar.',
    Hasty:'agitado e impulsivo; gosta de resolver as coisas rapidamente e seguir adiante.',
    Serious:'ponderado e focado; costuma levar compromissos e decisões a sério.',
    Jolly:'alegre e animado; ganha energia ao aproveitar experiências com outras pessoas.',
    Naive:'curioso e espontâneo; encara novidades com entusiasmo e mente aberta.',
    Modest:'discreto e humilde; prefere deixar suas atitudes falarem por você.',
    Mild:'gentil e sensível; procura agir com cuidado e consideração.',
    Quiet:'calado e contemplativo; sente-se bem com momentos de paz e reflexão.',
    Bashful:'tímido e reservado; pode demorar um pouco para mostrar seu lado mais aberto.',
    Rash:'intenso e impulsivo; costuma seguir a empolgação do momento.',
    Calm:'sereno e equilibrado; tende a lidar com situações sem perder a tranquilidade.',
    Gentle:'atencioso e cuidadoso; procura tratar as pessoas com delicadeza.',
    Sassy:'atrevido e confiante; não tem medo de responder à altura ou defender seu espaço.',
    Careful:'prudente e atento; pensa nas consequências antes de tomar uma decisão.',
    Quirky:'original e imprevisível; gosta de seguir interesses e ideias pouco convencionais.'
  };
  const QUESTION_BANK = [
    [
      [-1,'Em uma reunião, prefiro ouvir bastante antes de falar.'],[1,'Uma conversa animada costuma me deixar com mais energia.'],[-1,'Depois de socializar muito, preciso de um tempo só meu.'],[1,'Não tenho dificuldade em começar conversa com gente nova.'],[-1,'Gosto de pensar nas minhas ideias antes de dividi-las.'],[1,'Costumo demonstrar meu entusiasmo sem esconder.'],[-1,'Prefiro encontros pequenos a eventos cheios.'],[1,'Trabalhar ou estudar com outras pessoas me dá ânimo.'],[-1,'Ser o centro das atenções por muito tempo me cansa.'],[1,'Em um grupo, normalmente sou uma das pessoas mais expressivas.'],[-1,'Observar primeiro me ajuda a me sentir à vontade.'],[1,'Gosto de manter contato frequente com meus amigos.'],[-1,'Aprecio atividades tranquilas que posso fazer sozinho.'],[1,'Uma boa novidade é ainda melhor quando posso compartilhá-la.'],[-1,'Prefiro uma conversa profunda a falar com muitas pessoas ao mesmo tempo.']
    ],
    [
      [1,'Se algo importante precisa ser feito, aceito o desafio mesmo com algum risco.'],[-1,'Antes de agir, gosto de entender o que pode dar errado.'],[1,'Encaro situações difíceis em vez de esperar que desapareçam.'],[-1,'Quando tenho dúvida, prefiro escolher o caminho mais seguro.'],[1,'Defendo minhas convicções mesmo quando isso exige coragem.'],[-1,'Peço tempo para avaliar uma decisão que pode afetar outras pessoas.'],[1,'Não desisto facilmente quando encontro um obstáculo.'],[-1,'Gosto de ter um plano antes de me comprometer com algo difícil.'],[1,'Mudanças inesperadas não me impedem de tentar.'],[-1,'Evito agir por impulso quando as consequências são grandes.'],[1,'Consigo tomar a frente quando ninguém sabe o que fazer.'],[-1,'Prefiro avançar aos poucos a apostar tudo de uma vez.'],[1,'Tenho disposição para experimentar mesmo sem garantia de sucesso.'],[-1,'Penso nas consequências antes de aceitar um desafio.'],[1,'Quando alguém precisa de ajuda, tento intervir mesmo que seja desconfortável.']
    ],
    [
      [-1,'Gosto de resolver problemas usando minhas próprias ideias.'],[1,'Quando alguém está com dificuldade, ofereço ajuda.'],[-1,'Ter espaço para tomar minhas decisões é muito importante para mim.'],[1,'Costumo perceber quando alguém no grupo precisa de apoio.'],[-1,'Prefiro não depender de outras pessoas para concluir minhas tarefas.'],[1,'Trabalhos em equipe podem trazer o melhor de mim.'],[-1,'Não preciso da aprovação dos outros para seguir um plano que faz sentido.'],[1,'Gosto de celebrar as conquistas junto com as pessoas próximas.'],[-1,'Em um grupo, valorizo poder manter meu jeito próprio de fazer as coisas.'],[1,'É natural para mim considerar como minhas escolhas afetam os outros.'],[-1,'Prefiro cuidar dos meus assuntos sem me envolver demais nos dos outros.'],[1,'Sinto falta das pessoas queridas quando passo muito tempo sem vê-las.'],[-1,'Consigo aproveitar bem o tempo fazendo algo sozinho.'],[1,'Para mim, criar confiança é uma parte importante de qualquer parceria.'],[-1,'Em decisões pessoais, prefiro confiar primeiro no meu próprio julgamento.']
    ],
    [
      [1,'Tenho vontade de conhecer lugares que nunca visitei.'],[-1,'Uma rotina conhecida me traz conforto.'],[1,'Gosto de aprender sobre assuntos que não conheço.'],[-1,'Prefiro aperfeiçoar o que já sei a começar algo completamente novo.'],[1,'Quando posso, escolho experimentar um caminho diferente.'],[-1,'Surpresas demais podem atrapalhar meu bem-estar.'],[1,'Tenho curiosidade sobre como as coisas funcionam.'],[-1,'Gosto de manter alguns hábitos mesmo quando minha vida muda.'],[1,'A possibilidade de descobrir algo novo me empolga.'],[-1,'Sinto-me melhor quando sei o que esperar do meu dia.'],[1,'Explorar uma ideia diferente pode ser divertido mesmo sem um objetivo.'],[-1,'Prefiro mudanças graduais a virar tudo de cabeça para baixo.'],[1,'Tenho facilidade para encontrar algo interessante em uma experiência nova.'],[-1,'Às vezes, o conhecido é exatamente o que eu preciso.'],[1,'Se surge uma oportunidade inesperada, fico curioso para saber onde ela vai dar.']
    ]
  ].flatMap((questions,axis) => questions.map(([sign,text]) => ({axis,sign,text})));
  const EXTRA_QUESTION_BANK = [
    [
      [-1,'Em uma festa, prefiro conversar com poucas pessoas de cada vez.'],[1,'Gosto de compartilhar minhas ideias assim que elas surgem.'],[-1,'Um dia cheio de interações costuma me deixar cansado.'],[1,'Sinto facilidade em me enturmar em ambientes novos.'],[-1,'Geralmente observo o grupo antes de participar.'],[1,'Falo com naturalidade mesmo quando há muita gente por perto.'],[-1,'Prefiro passar meu tempo livre em atividades mais reservadas.'],[1,'Conversar com desconhecidos pode ser uma experiência divertida.'],[-1,'Preciso de silêncio para recuperar as energias depois de um evento.'],[1,'Gosto de contar histórias e animar uma conversa.'],[-1,'Prefiro receber poucas pessoas em casa a ir a uma grande festa.'],[1,'Costumo me sentir à vontade para expressar minhas opiniões em grupo.'],[-1,'Tenho mais facilidade para me abrir em conversas individuais.'],[1,'A presença de outras pessoas costuma me motivar.'],[-1,'Aproveito bastante atividades que faço no meu próprio ritmo.']
    ],
    [
      [1,'Se percebo uma injustiça, tenho vontade de me posicionar.'],[-1,'Em uma situação incerta, busco informações antes de escolher.'],[1,'Aceito responsabilidades mesmo quando existe pressão.'],[-1,'Prefiro pedir conselho antes de tomar uma decisão arriscada.'],[1,'Não costumo recuar só porque uma tarefa parece intimidadora.'],[-1,'Analiso os possíveis problemas antes de começar um projeto.'],[1,'Sei defender uma ideia mesmo quando ela é impopular.'],[-1,'Evito me comprometer sem conhecer bem as condições.'],[1,'Gosto de testar meus limites de vez em quando.'],[-1,'Em uma discussão, escolho minhas palavras com cuidado.'],[1,'Confio na minha capacidade de lidar com imprevistos.'],[-1,'Prefiro uma solução segura a uma aposta incerta.'],[1,'Uma oportunidade desafiadora me dá vontade de tentar.'],[-1,'Quando há muito em jogo, valorizo a cautela.'],[1,'Não preciso ter certeza do resultado para dar o primeiro passo.']
    ],
    [
      [-1,'Gosto de decidir como organizar meu trabalho sem muita interferência.'],[1,'Peço a opinião de pessoas próximas antes de uma escolha importante.'],[-1,'Prefiro resolver um problema por conta própria antes de pedir ajuda.'],[1,'Costumo incluir outras pessoas nos planos que me animam.'],[-1,'Valorizo poder seguir meus próprios interesses, mesmo que sejam diferentes.'],[1,'Apoiar alguém é tão importante quanto alcançar meus objetivos.'],[-1,'Sinto-me confortável fazendo atividades sozinho.'],[1,'Gosto de criar momentos em que todos possam participar.'],[-1,'Não preciso estar acompanhado para aproveitar um passeio.'],[1,'Quando tenho uma boa notícia, quero dividi-la com alguém.'],[-1,'Prefiro que cada pessoa cuide de suas próprias responsabilidades.'],[1,'Tento construir soluções que funcionem para todo o grupo.'],[-1,'Em geral, confio primeiro na minha própria avaliação.'],[1,'Manter contato com pessoas queridas é uma prioridade para mim.'],[-1,'Gosto de ter independência para mudar meus planos.']
    ],
    [
      [1,'Uma viagem sem roteiro definido parece empolgante.'],[-1,'Prefiro saber com antecedência como será meu dia.'],[1,'Gosto de experimentar comidas ou atividades que nunca provei.'],[-1,'Repetir uma atividade que já conheço pode ser muito agradável.'],[1,'Tenho vontade de investigar temas só por curiosidade.'],[-1,'Mudanças rápidas na rotina costumam me incomodar.'],[1,'Se encontro um caminho desconhecido, fico tentado a explorá-lo.'],[-1,'Sinto conforto em manter tradições e hábitos familiares.'],[1,'Aprender uma habilidade do zero me parece estimulante.'],[-1,'Prefiro estabilidade a novidades constantes.'],[1,'Gosto de descobrir lugares diferentes na minha própria cidade.'],[-1,'Uma agenda previsível me ajuda a ficar tranquilo.'],[1,'Tenho interesse em ouvir perspectivas bem diferentes da minha.'],[-1,'Prefiro dominar uma atividade conhecida a trocar sempre de interesse.'],[1,'Uma mudança de planos pode abrir espaço para uma boa descoberta.']
    ]
  ].flatMap((questions,axis) => questions.map(([sign,text]) => ({axis,sign,text})));
  QUESTION_BANK.push(...EXTRA_QUESTION_BANK);

  let answers = [], questions = [], questionIndex = 0, selectedLength = 60, pokemon = [], loading = false, usingIndividualData = false;
  const host = document.getElementById('pokemon-quiz');
  const image = (id, artwork = false) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${artwork ? 'other/official-artwork/' : ''}${id}.png`;
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const shuffle = list => { const result = [...list]; for (let i=result.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [result[i],result[j]]=[result[j],result[i]]; } return result; };

  function renderStart(message = '') {
    host.innerHTML = `<div class="quiz-start"><span class="eyebrow">ESCOLHA O TAMANHO DO QUIZ</span><p>Mais perguntas deixam seu perfil mais detalhado. Você pode voltar e mudar suas respostas.</p><div class="quiz-length-options">${LIMITS.map(length=>`<button class="quiz-length-option ${selectedLength===length?'selected':''} ${length===60?'quiz-length-recommended':''}" data-length="${length}"><strong>${length}</strong><span>${length===12?'Rápido':length===30?'Completo':length===60?'Recomendado':length===90?'Extenso':'Máximo'}</span></button>`).join('')}</div>${message?`<p class="quiz-load-message">${message}</p>`:''}<button class="copy-btn quiz-start-button" id="quiz-start">Começar quiz →</button></div>`;
    host.querySelectorAll('[data-length]').forEach(button=>button.addEventListener('click',()=>{selectedLength=Number(button.dataset.length);renderStart(message);}));
    document.getElementById('quiz-start').addEventListener('click',startQuiz);
  }

  function balancedQuestions(count) {
    const groups = [0,1,2,3].map(axis=>shuffle(QUESTION_BANK.filter(q=>q.axis===axis)));
    const selected = [];
    while (selected.length < count) {
      for (const group of groups) {
        if (selected.length < count && group.length) selected.push(group.pop());
      }
    }
    return shuffle(selected);
  }

  const TRAIT_WORDS = [
    {
      positive:['energetic','lively','active','playful','cheerful','excited','restless','quick','fast','runs around','constantly moves','dances','sings','agitated','animado','agitada','cheio de energia','cheia de energia','brincalhão','brincalhona','alegre','elétrico','elétrica','corre','dança','canta'],
      negative:['quiet','shy','timid','calm','peaceful','gentle','still','sleeps','rarely moves','silent','reserved','quieto','quieta','tímido','tímida','calmo','calma','tranquilo','tranquila','dorme','silencioso','silenciosa','reservado','reservada']
    },
    {
      positive:['brave','fearless','courageous','bold','fierce','fights','protects','defends','confronts','strong-willed','corajoso','corajosa','destemido','destemida','valente','ousado','ousada','feroz','luta','protege','defende','enfrenta'],
      negative:['cautious','wary','careful','afraid','fearful','hides','avoids','flees','runs away','on guard','cauteloso','cautelosa','cuidadoso','cuidadosa','assustado','assustada','esconde','evita','foge','em alerta']
    },
    {
      positive:['friendly','affectionate','loyal','kind','helps','cares for','loves','companions','friends','group','pack','together','people','communicates','social','amigável','carinhoso','carinhosa','leal','gentil','ajuda','cuida','ama','companheiros','amigos','grupo','juntos','pessoas','comunica','sociável'],
      negative:['solitary','alone','loner','independent','territorial','distant','isolated','prefers to be alone','solitário','solitária','sozinho','sozinha','independente','territorial','distante','isolado','isolada']
    },
    {
      positive:['curious','explores','exploring','investigates','wanders','travels','seeks out','discovers','adventure','unknown','curioso','curiosa','explora','investiga','viaja','procura','descobre','aventura','desconhecido','desconhecida'],
      negative:['stays in one place','stays put','nests','settles','routine','does not move','sleeps all day','permanece','fica parado','fica parada','faz ninho','rotina','não se move','dorme o dia']
    }
  ];

  function normalizeText(value) {
    return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[\n\f\r]/g,' ').replace(/\s+/g,' ');
  }
  function matchedTerms(text,terms) { return terms.reduce((total,term)=>total+(text.includes(normalizeText(term))?1:0),0); }
  function textTraits(mon) {
    const texts=[...new Set((mon.flavorTexts||[]).map(entry=>normalizeText(entry.text)))].join(' ');
    return TRAIT_WORDS.map(words=>{
      const positive=matchedTerms(texts,words.positive),negative=matchedTerms(texts,words.negative);
      return Math.tanh((positive-negative)*0.65)*2;
    });
  }
  function statTraits(mon) {
    const stats=mon.stats||{};
    const clamp=value=>Math.max(-2,Math.min(2,value));
    return [
      clamp(((stats.speed||80)-80)/55),
      clamp((((stats.attack||75)+(stats.defense||75))-150)/70),
      0,
      0
    ];
  }
  function abilityTraits(mon) {
    const abilities=(mon.abilities||[]).join(' ').replace(/-/g,'');
    return [
      /speed|swift|quick|agility|chlorophyll|swiftswim|speedboost/.test(abilities)?0.7:0,
      /battlearmor|intimidate|defiant|steadfast|anger|brave|ironfist/.test(abilities)?0.7:0,
      /friendguard|healer|synchronize|plus|minus|hospitality|damp/.test(abilities)?0.7:/lonely|rivalry|competitive/.test(abilities)?-0.5:0,
      /curious|forewarn|frisk|analytic|anticipation|reckless|wander/.test(abilities)?0.7:0
    ];
  }
  function individualProfile(mon) {
    const lore=textTraits(mon), stats=statTraits(mon), abilities=abilityTraits(mon), types=typeProfile(mon.types);
    return lore.map((value,index)=>Math.max(-2,Math.min(2,value*.68+stats[index]*.17+abilities[index]*.1+types[index]*.05)));
  }
  function typeProfile(types) {
    const values=[0,0,0,0];
    (types||[]).forEach(type=>TYPE_PROFILES[type]?.forEach((value,index)=>{values[index]+=value;}));
    return values.map(value=>value/Math.max(1,(types||[]).length));
  }

  async function loadPokemon() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (Array.isArray(cached) && cached.length > 1000) { usingIndividualData=Boolean(cached[0]?.stats&&Array.isArray(cached[0]?.flavorTexts)); return cached; }
    } catch { /* cache inválido: carrega novamente */ }
    try {
      const fetchPage=async offset=>{
        const response=await fetch(GRAPHQL_URL,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({query:GRAPHQL_QUERY(offset)})});
        if(!response.ok)throw new Error('GraphQL indisponível');
        const payload=await response.json();
        if(payload.errors?.length||!payload.data?.pokemon)throw new Error('Consulta de dados individuais falhou');
        return payload.data.pokemon;
      };
      const records=(await Promise.all([fetchPage(0),fetchPage(1000)])).flat();
      if(!records.length)throw new Error('Consulta sem resultados');
      const detailed=records.map(mon=>{
        const species=mon.pokemonspecy||{};
        return {
          id:mon.id,name:mon.name,
          types:(mon.pokemontypes||[]).map(item=>item.type?.name).filter(Boolean),
          stats:Object.fromEntries((mon.pokemonstats||[]).map(item=>[item.stat?.name,item.base_stat])),
          abilities:(mon.pokemonabilities||[]).map(item=>item.ability?.name).filter(Boolean),
          flavorTexts:(species.pokemonspeciesflavortexts||[]).map(entry=>({text:entry.flavor_text,language:entry.language?.name,version:entry.version?.name}))
        };
      }).filter(mon=>mon.types.length);
      if(detailed.length<1000)throw new Error('Pokédex incompleta');
      usingIndividualData=true;
      try{localStorage.setItem(CACHE_KEY,JSON.stringify(detailed));}catch{/* quiz funciona mesmo sem salvar cache */}
      return detailed;
    } catch (error) {
      usingIndividualData=false;
      console.info('Dados individuais indisponíveis; usando tipos como alternativa.',error);
    }
    const response = await fetch(`${API}/pokemon?limit=2000`);
    if (!response.ok) throw new Error('PokéAPI indisponível');
    const data = await response.json();
    const list = data.results.map((entry,index)=>({id:Number(entry.url.match(/\/pokemon\/(\d+)\//)?.[1])||index+1,name:entry.name,types:[]}));
    const byId = new Map(list.map(mon=>[mon.id,mon]));
    const typeNames = Object.keys(TYPE_PROFILES);
    let typeFailures=0;
    await Promise.all(typeNames.map(async type=>{
      try {
        const typeResponse = await fetch(`${API}/type/${type}`);
        if (!typeResponse.ok) { typeFailures++; return; }
        const typeData = await typeResponse.json();
        typeData.pokemon.forEach(item=>{
          const id=Number(item.pokemon.url.match(/\/pokemon\/(\d+)\//)?.[1]);
          const mon=byId.get(id); if(mon&&!mon.types.includes(type)) mon.types.push(type);
        });
      } catch { typeFailures++; }
    }));
    if (typeFailures) throw new Error('Não foi possível carregar todos os tipos');
    const valid=list.filter(mon=>mon.types.length);
    if (!valid.length) throw new Error('Não foi possível carregar os tipos dos Pokémon');
    usingIndividualData=false;
    try { localStorage.setItem(CACHE_KEY,JSON.stringify(valid)); } catch { /* resultado continua disponível sem cache */ }
    return valid;
  }

  async function startQuiz() {
    if (loading) return;
    loading=true; host.innerHTML='<div class="quiz-loading"><span class="quiz-spinner"></span><strong>Preparando o quiz</strong><p>Carregando a Pokédex para incluir todos os Pokémon…</p></div>';
    try { pokemon=await loadPokemon(); questions=balancedQuestions(selectedLength); answers=Array(selectedLength).fill(null); questionIndex=0; renderQuestion(); }
    catch { renderStart('Não consegui carregar a Pokédex. Confira sua conexão e tente novamente.'); }
    finally { loading=false; }
  }

  function renderQuestion() {
    const q=questions[questionIndex], scaleLabels=['Discordo totalmente','Discordo','Neutro','Concordo','Concordo totalmente'];
    host.innerHTML=`<div class="quiz-progress"><span>PERGUNTA ${String(questionIndex+1).padStart(2,'0')} / ${questions.length}</span><div><i style="width:${((questionIndex+1)/questions.length)*100}%"></i></div></div><article class="quiz-question-card"><span class="eyebrow">${AXES[q.axis][0].toUpperCase()} <b>↔</b> ${AXES[q.axis][1].toUpperCase()}</span><h2>${q.text}</h2><div class="quiz-scale-labels"><span>Discordo</span><span>Concordo</span></div><div class="quiz-scale" role="group" aria-label="Grau de concordância">${[-2,-1,0,1,2].map((value,index)=>`<button class="quiz-scale-option ${answers[questionIndex]===value?'selected':''}" data-answer="${value}" aria-label="${scaleLabels[index]}" title="${scaleLabels[index]}"><span>${index+1}</span></button>`).join('')}</div><div class="quiz-scale-captions"><span>Discordo totalmente</span><span>Concordo totalmente</span></div></article><div class="quiz-controls"><button class="action-btn" id="quiz-prev" ${questionIndex===0?'disabled':''}>← Voltar</button><button class="copy-btn" id="quiz-next" ${answers[questionIndex]===null?'disabled':''}>${questionIndex===questions.length-1?'Ver resultado':'Próxima →'}</button></div>`;
    host.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>{answers[questionIndex]=Number(button.dataset.answer);renderQuestion();}));
    document.getElementById('quiz-prev').addEventListener('click',()=>{if(questionIndex>0){questionIndex--;renderQuestion();}});
    document.getElementById('quiz-next').addEventListener('click',()=>{if(answers[questionIndex]===null)return;if(questionIndex<questions.length-1){questionIndex++;renderQuestion();}else showResult();});
  }

  function profileFor(mon) { return Array.isArray(mon.profile)?mon.profile:(usingIndividualData?individualProfile(mon):typeProfile(mon.types)); }
  function similarity(profile,mon) {
    const candidate=profileFor(mon),distance=Math.sqrt(candidate.reduce((sum,value,index)=>sum+(value-profile[index])**2,0));
    return Math.max(0,Math.min(100,(1-distance/8)*100));
  }

  function natureFor(profile) {
    return NATURE_PROFILES.map(([name, traits]) => ({
      name,
      distance: traits.reduce((sum, value, index) => sum + (value - profile[index]) ** 2, 0)
    })).sort((a, b) => a.distance - b.distance)[0].name;
  }

  function shareMessage(winner, nature, profile) {
    const en = window.pokebuildLanguage?.() === 'en';
    const pokemonName = winner.name.replace(/-/g,' ').replace(/\b\p{L}/gu,letter=>letter.toUpperCase());
    const traits=profile.map((value,index)=>value>.25?AXES[index][1]:value<-.25?AXES[index][0]:null).filter(Boolean);
    const profileSummary = traits.length
      ? `${en ? 'My profile?' : 'Meu perfil?'} ${traits.map(value=>value.toLocaleLowerCase(en?'en-US':'pt-BR')).join(', ')}! ✨`
      : en ? 'My profile? Balanced in every aspect! ⚖️' : 'Meu perfil? Equilíbrio em todos os aspectos! ⚖️';
    const rawDescription = en ? window.pokebuildTranslate(NATURE_DESCRIPTIONS[nature]) : NATURE_DESCRIPTIONS[nature];
    const description = rawDescription.charAt(0).toLocaleUpperCase(en?'en-US':'pt-BR') + rawDescription.slice(1);
    return en
      ? `I found my Pokémon in PokéBuild! 🎃\n\n${pokemonName} — Nature ${nature}\n${description}\n\n${winner.match.toFixed(1)}% compatibility\n${profileSummary}\n\nAnd you, which Pokémon matches your personality?\n${window.location.origin}${window.location.pathname}#quiz`
      : `Descobri meu Pokémon no PokéBuild! 🎃\n\n${pokemonName} — Nature ${nature}\n${description}\n\n${winner.match.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}% de compatibilidade\n${profileSummary}\n\nE você, qual Pokémon combina com a sua personalidade?\n${window.location.origin}${window.location.pathname}#quiz`;
  }

  function loadShareImage(id, useArtwork = false) {
    return new Promise(resolve=>{
      const sprite=new Image(); sprite.crossOrigin='anonymous';
      sprite.onload=()=>resolve(sprite); sprite.onerror=()=>resolve(null);
      sprite.src=image(id,useArtwork);
    });
  }

  function loadBrandLogo() {
    return new Promise(resolve=>{
      const logo = new Image();
      logo.onload = () => resolve(logo);
      logo.onerror = () => resolve(null);
      logo.src = 'assets/pokebuild-logo.png';
    });
  }

  async function makeShareCard(winner, nature, profile, otherMatches, questionCount) {
    const tr = value => window.pokebuildTranslate?.(value) || value;
    const en = window.pokebuildLanguage?.() === 'en';
    const canvas=document.createElement('canvas'); canvas.width=1200; canvas.height=1160;
    const context=canvas.getContext('2d');
    const background=context.createLinearGradient(0,0,1200,1160);
    background.addColorStop(0,'#252137'); background.addColorStop(1,'#111019');
    context.fillStyle=background; context.fillRect(0,0,canvas.width,canvas.height);
    context.strokeStyle='rgba(170,158,232,.5)'; context.lineWidth=2; context.strokeRect(22,22,canvas.width-44,canvas.height-44);

    const panel=(x,y,width,height)=>{context.beginPath();context.roundRect(x,y,width,height,22);context.fillStyle='rgba(255,255,255,.035)';context.fill();context.strokeStyle='rgba(170,158,232,.2)';context.lineWidth=2;context.stroke();};
    const fitText=(text,x,y,maxWidth,size,color='#f5f3ff',weight='700')=>{
      context.textAlign='left';context.fillStyle=color;let fontSize=size;
      do {context.font=`${weight} ${fontSize}px sans-serif`;if(context.measureText(text).width<=maxWidth||fontSize<=18)break;fontSize-=2;} while(true);
      context.fillText(text,x,y);
    };
    const titleCase=value=>value.replace(/-/g,' ').replace(/\b\w/g,char=>char.toUpperCase());
    const [winnerArt,...loadedImages]=await Promise.all([loadShareImage(winner.id,true),...otherMatches.map(mon=>loadShareImage(mon.id)),loadBrandLogo()]);
    const brandLogo = loadedImages.pop();
    const matchSprites = loadedImages;

    panel(36,36,650,438); panel(704,36,460,438); panel(36,494,1128,578);
    context.textAlign='left';context.fillStyle='#aaa0e8';context.font='700 15px monospace';context.fillText(`${tr('SEU RESULTADO')} · ${questionCount} ${tr('PERGUNTAS')}`,64,72);
    if(winnerArt)context.drawImage(winnerArt,56,103,252,252);
    fitText(titleCase(winner.name),320,155,330,39);
    context.fillStyle='#b8b0e8';context.font='700 15px monospace';context.fillText(`${tr('Nature')} ${nature.toUpperCase()}`,322,187);
    context.fillStyle='#c9c5d9';context.font='16px sans-serif';
    const description=NATURE_DESCRIPTIONS[nature];
    const descWords=description.split(' ');let descLine='',descY=270;
    descWords.forEach(word=>{const candidate=descLine?`${descLine} ${word}`:word;if(context.measureText(candidate).width>320){context.fillText(descLine,322,descY);descLine=word;descY+=22;}else descLine=candidate;});
    if(descLine)context.fillText(descLine,322,descY);
    context.fillStyle='#aaa0e8';context.font='700 60px monospace';context.fillText(`${winner.match.toFixed(1)}%`,64,414);
    context.fillStyle='#a5a1b6';context.font='700 13px monospace';context.fillText('DE COMPATIBILIDADE',67,441);
    winner.types.forEach((type,index)=>{context.fillStyle='rgba(170,158,232,.14)';context.beginPath();context.roundRect(320+index*100,207,88,27,13);context.fill();context.fillStyle='#c9c1ff';context.font='13px sans-serif';context.fillText(type.toUpperCase(),331+index*100,225);});

    context.fillStyle='#f5f3ff';context.font='700 20px monospace';context.fillText(tr('SEU PERFIL'),732,76);
    AXES.forEach(([low,high],index)=>{
      const y=132+index*78;context.fillStyle='#a5a1b6';context.font='13px sans-serif';context.textAlign='left';context.fillText(low,732,y);
      context.textAlign='right';context.fillStyle='#f5f3ff';context.font='700 13px sans-serif';context.fillText(high,1136,y);
      const x=742,width=384,barY=y+22;const gradient=context.createLinearGradient(x,barY,x+width,barY);gradient.addColorStop(0,'#4f496b');gradient.addColorStop(1,'#aaa0e8');
      context.beginPath();context.roundRect(x,barY,width,7,4);context.fillStyle=gradient;context.fill();
      const markerX=x+((profile[index]+2)/4)*width;context.beginPath();context.arc(markerX,barY+3.5,8,0,Math.PI*2);context.fillStyle='#aaa0e8';context.fill();context.strokeStyle='#211e2f';context.lineWidth=3;context.stroke();
    });
    context.textAlign='left';context.fillStyle='#a5a1b6';context.font='13px sans-serif';context.fillText(tr('Seu perfil é uma leitura divertida das respostas.'),732,440);

    context.fillStyle='#aaa0e8';context.font='700 14px monospace';context.fillText(tr('POKÉMON COM PERFIL PARECIDO'),64,531);
    context.fillStyle='#f5f3ff';context.font='700 21px monospace';context.fillText(tr('Outras combinações próximas'),64,561);
    context.textAlign='right';context.fillStyle='#a5a1b6';context.font='12px monospace';context.fillText(`${pokemon.length.toLocaleString(en?'en-US':'pt-BR')} ${tr('COMPARADOS')}`,1135,559);
    otherMatches.forEach((mon,index)=>{
      const col=index%2,row=Math.floor(index/2),x=62+col*554,y=588+row*112;
      context.strokeStyle='rgba(255,255,255,.1)';context.beginPath();context.moveTo(x,y+99);context.lineTo(x+530,y+99);context.stroke();
      context.textAlign='left';context.fillStyle='#a5a1b6';context.font='12px monospace';context.fillText(String(index+2).padStart(2,'0'),x,y+44);
      const sprite=matchSprites[index];if(sprite)context.drawImage(sprite,x+32,y+8,66,66);
      fitText(titleCase(mon.name),x+108,y+29,305,16);
      context.fillStyle='#a5a1b6';context.font='12px sans-serif';context.fillText(mon.types.join(' · '),x+108,y+51);
      context.textAlign='right';context.fillStyle='#f5f3ff';context.font='700 14px monospace';context.fillText(`${mon.match.toFixed(1)}%`,x+520,y+29);
      context.beginPath();context.roundRect(x+108,y+64,390,5,3);context.fillStyle='rgba(255,255,255,.09)';context.fill();
      context.beginPath();context.roundRect(x+108,y+64,390*Math.max(0,Math.min(1,mon.match/100)),5,3);context.fillStyle='#aaa0e8';context.fill();
    });
    if (brandLogo) {
      const logoWidth = 190, logoHeight = logoWidth * brandLogo.height / brandLogo.width;
      context.drawImage(brandLogo, 600-logoWidth/2, 1080-logoHeight/2, logoWidth, logoHeight);
    }
    context.textAlign='center';context.fillStyle='#a5a1b6';context.font='12px sans-serif';context.fillText(`${window.pokebuildLanguage?.()==='en'?'Take your quiz at':'Faça seu quiz em'} ${window.location.host}`,600,1138);
    return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Não foi possível gerar a imagem.')),'image/png'));
  }

  async function shareResult(winner, nature, profile, otherMatches, questionCount) {
    const button=document.getElementById('quiz-share');
    const original=button.textContent;
    button.disabled=true; button.textContent='Preparando resultado…';
    try {
      const blob=await makeShareCard(winner,nature,profile,otherMatches,questionCount);
      const text=shareMessage(winner,nature,profile);
      const file=new File([blob],`pokebuild-${winner.name}-resultado.png`,{type:'image/png'});
      if(navigator.share) {
        if(navigator.canShare?.({files:[file]})) await navigator.share({title:'Meu resultado no PokéBuild',text,files:[file]});
        else await navigator.share({title:'Meu resultado no PokéBuild',text});
      } else {
        try { await navigator.clipboard.writeText(text); }
        catch { window.prompt('Copie o texto do seu resultado:',text); }
        const link=document.createElement('a'); link.href=URL.createObjectURL(blob); link.download=file.name; link.click();
        setTimeout(()=>URL.revokeObjectURL(link.href),1000);
        button.textContent='Texto copiado · imagem baixada';
        setTimeout(()=>{if(button.isConnected)button.textContent=original;},3500);
      }
    } catch(error) {
      if(error.name!=='AbortError') { console.error('Falha ao compartilhar resultado',error); button.textContent='Não foi possível compartilhar'; setTimeout(()=>{if(button.isConnected)button.textContent=original;},2500); }
    } finally { button.disabled=false; }
  }

  function showResult() {
    const profile=[0,0,0,0], counts=[0,0,0,0];
    questions.forEach((question,index)=>{profile[question.axis]+=answers[index]*question.sign;counts[question.axis]++;});
    profile.forEach((_,axis)=>{profile[axis]/=counts[axis]||1;});
    const ranked=pokemon.map(mon=>({...mon,match:similarity(profile,mon)})).sort((a,b)=>b.match-a.match||a.id-b.id);
    const winner=ranked[0],winnerProfile=profileFor(winner),nature=natureFor(profile), axes=AXES.map(([low,high],index)=>`<div class="quiz-result-axis"><div><span>${low}</span><b>${high}</b></div><div class="quiz-result-track"><i style="left:${((profile[index]+2)/4)*100}%"></i></div></div>`).join('');
    const otherMatches=ranked.slice(1,9);
    const others=otherMatches.map((mon,index)=>`<article class="quiz-match-card"><span class="quiz-match-rank">${String(index+2).padStart(2,'0')}</span><img loading="lazy" src="${image(mon.id)}" alt=""><div class="quiz-match-info"><strong>${escapeHtml(mon.name.replace(/-/g,' '))}</strong><small>${mon.types.join(' · ')}</small><div class="quiz-match-bar"><i style="width:${mon.match}%"></i></div></div><b class="quiz-match-percent">${mon.match.toFixed(1)}%</b></article>`).join('');
    const interpretation=winnerProfile.map((value,index)=>Math.abs(value)>.45?(value<0?AXES[index][0]:AXES[index][1]):null).filter(Boolean).slice(0,2).join(' e ');
    const insight=usingIndividualData?(interpretation?`As descrições da Pokédex e os dados individuais apontam para um perfil ${interpretation.toLowerCase()}.`:'As pistas individuais deste Pokémon ficam próximas do equilíbrio nos quatro eixos do quiz.'):'Os perfis individuais não carregaram; este resultado foi comparado principalmente pelos tipos.';
    const methodology=usingIndividualData?'O quiz interpreta descrições da Pokédex e combina essas pistas com habilidades, atributos e tipos. Os traços não são uma classificação oficial.':'Este resultado usa os tipos como referência porque os dados individuais não ficaram disponíveis.';
    host.innerHTML=`<div class="quiz-result-layout"><section class="quiz-result-hero"><span class="eyebrow">SEU RESULTADO · ${questions.length} PERGUNTAS</span><div class="quiz-result-main"><div class="quiz-result-mon"><img class="quiz-result-sprite" src="${image(winner.id,true)}" onerror="this.onerror=null;this.src='${image(winner.id)}'" alt="${escapeHtml(winner.name)}"><div class="quiz-result-match"><strong>${winner.match.toFixed(1)}%</strong><span>MAIS COMPATÍVEL</span></div></div><div class="quiz-result-copy"><span class="eyebrow">POKÉMON QUE MAIS COMBINA</span><h2>${escapeHtml(winner.name.replace(/-/g,' '))}</h2><div class="quiz-nature"><span>Sua Nature</span><strong>${nature}</strong></div><p class="quiz-nature-description">${escapeHtml(NATURE_DESCRIPTIONS[nature])}</p><p>${insight}</p><div class="quiz-type-list">${winner.types.map(type=>`<span>${type}</span>`).join('')}</div></div></div></section><section class="quiz-result-profile"><h3>SEU PERFIL</h3><div class="quiz-result-axes">${axes}</div><p>${methodology}</p><p class="quiz-nature-note">A Nature resume, de forma divertida, os traços de personalidade sugeridos pelas suas respostas. Nos jogos, ela também influencia atributos de batalha.</p></section></div><section class="quiz-other-matches"><div class="quiz-other-heading"><div><span class="eyebrow">POKÉMON COM PERFIL PARECIDO</span><h3>Outras combinações próximas</h3></div><span>${pokemon.length.toLocaleString('pt-BR')} Pokémon comparados</span></div><div class="quiz-match-list">${others}</div></section><div class="quiz-controls quiz-result-controls"><button class="action-btn" id="quiz-change-length">← Mudar duração</button><button class="copy-btn" id="quiz-share">↗ Compartilhar resultado</button><button class="copy-btn" id="quiz-restart">Refazer com ${questions.length} perguntas</button></div>`;
    document.getElementById('quiz-change-length').addEventListener('click',()=>renderStart());
    document.getElementById('quiz-share').addEventListener('click',()=>shareResult(winner,nature,profile,otherMatches,questions.length));
    document.getElementById('quiz-restart').addEventListener('click',startQuiz);
    host.scrollIntoView({behavior:'smooth',block:'start'});
  }

  document.addEventListener('DOMContentLoaded',()=>renderStart());
})();
