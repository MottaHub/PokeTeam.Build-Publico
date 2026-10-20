(() => {
  const STORAGE_LANGUAGE = 'pokebuild_language_v1';
  const STORAGE_THEME = 'pokebuild_theme_v1';
  const translations = {
    'Início':'Home','Batalha':'Battle','Favoritos':'Favorites','Formato':'Format','Idioma':'Language','Preferências do site':'Site preferences','SEU UNIVERSO POKÉMON, DO SEU JEITO':'YOUR POKÉMON WORLD, YOUR WAY',
    'Monte seu time.':'Build your team.','Descubra seu Pokémon.':'Discover your Pokémon.','Crie estratégias, organize seus favoritos, monte rankings e descubra qual Pokémon combina com sua personalidade.':'Build strategies, organize your favorites, create rankings, and find the Pokémon that matches your personality.',
    'Montar meu time':'Build my team','Fazer o quiz':'Take the quiz','Uma coleção de ferramentas para quem ama Pokémon':'A collection of tools for Pokémon fans','ESCOLHA · MONTE · DESCUBRA':'CHOOSE · BUILD · DISCOVER',
    'EXPLORE O POKÉBUILD':'EXPLORE POKÉBUILD','O que vamos fazer hoje?':'What would you like to do today?','Escolha uma ferramenta e comece a explorar.':'Choose a tool and start exploring.',
    'ESTRATÉGIA':'STRATEGY','SEU RANKING':'YOUR RANKING','SUA COLEÇÃO':'YOUR COLLECTION','PERSONALIDADE':'PERSONALITY','Monte seu time e confira cobertura, fraquezas e resistências.':'Build your team and check its coverage, weaknesses, and resistances.',
    'Criar um time':'Build a team','Organize Pokémon em rankings temáticos e compare suas escolhas.':'Rank Pokémon by theme and compare your picks.','Ver rankings':'Browse rankings',
    'Guarde seus favoritos por geração, tipo e outras categorias.':'Save your favorites by generation, type, and other categories.','Montar coleção':'Build your collection',
    'Responda às perguntas e descubra qual Pokémon combina com você.':'Answer questions and discover which Pokémon matches you.','Descobrir meu Pokémon':'Find my Pokémon',
    'Feito por fãs, para fãs.':'Made by fans, for fans.','Um espaço para brincar, experimentar e celebrar o mundo Pokémon.':'A place to play, experiment, and celebrate the Pokémon world.',
    'Buscar Pokémon...':'Search Pokémon...','MEU TIME':'MY TEAM','Exportar para Showdown':'Export to Showdown','Limpar time':'Clear team','Limpar':'Clear',
    'Cobertura ofensiva':'Offensive coverage','Tipos que seu time consegue acertar em super-efetivo':'Types your team can hit for super-effective damage',
    'Fraquezas defensivas':'Defensive weaknesses','Tipos que ameaçam seu time':'Types that threaten your team','Resistências':'Resistances','Tipos que seu time bloqueia':'Types your team resists',
    'Diagnóstico':'Team analysis','Pontos fortes e fracos do time':'Team strengths and weaknesses','STATS DO TIME':'TEAM STATS','Exportar para Showdown':'Export to Showdown','Copiar':'Copy',
    'RANKINGS TEMÁTICOS':'THEMED RANKINGS','Tier Lists Pokémon':'Pokémon Tier Lists','Escolha uma lista para começar a rankear.':'Choose a list to start ranking.',
    '← Todas as Tier Lists':'← All Tier Lists','RANKING TEMÁTICO':'THEMED RANKING','↺ Reiniciar':'↺ Reset','Reiniciar':'Reset',
    'No computador, arraste os Pokémon. No celular, toque em um Pokémon da seleção e escolha o tier.':'On desktop, drag Pokémon into a tier. On mobile, tap a Pokémon below and choose its tier.',
    'Pokémon para rankear':'Pokémon to rank','Toque em um Pokémon para escolher o tier ou arraste-o para uma linha.':'Tap a Pokémon to choose its tier, or drag it into a row.',
    'COLEÇÃO PESSOAL':'PERSONAL COLLECTION','Favoritos por geração':'Favorites by generation','Escolha um Pokémon favorito para cada combinação de geração e tipo.':'Choose a favorite Pokémon for each generation and type combination.',
    'Limpar favoritos':'Clear favorites','Abra esta aba para carregar os Pokémon.':'Open this tab to load Pokémon.','OUTRAS CATEGORIAS':'MORE CATEGORIES','Seu time e seus favoritos':'Your team and favorites',
    'Escolha um Pokémon para cada categoria. Clique numa caixa para escolher ou trocar.':'Choose a Pokémon for each category. Click a box to choose or replace it.',
    'TIME':'TEAM','ESCOLHER FAVORITO':'CHOOSE A FAVORITE','Escolha seu Pokémon':'Choose your Pokémon','Todas as gerações':'All generations','Todos os tipos':'All types',
    'Filtrar geração':'Filter by generation','Filtrar tipo':'Filter by type','QUIZ DE PERSONALIDADE':'PERSONALITY QUIZ','Qual Pokémon combina com você?':'Which Pokémon matches you?',
    'Responda com sinceridade e descubra qual Pokémon tem mais a ver com seu jeito. A comparação inclui Pokémon e formas disponíveis na PokéAPI.':'Answer honestly to find the Pokémon that best matches your personality. The quiz compares Pokémon and forms available through PokéAPI.',
    'Curtiu o PokéBuild?':'Enjoying PokéBuild?','Explore o código, sugira uma melhoria ou compartilhe o PokéBuild com outro treinador.':'Explore the code, suggest an improvement, or share PokéBuild with another Trainer.',
    'Ver no GitHub ↗':'View on GitHub ↗','Sugerir melhoria':'Suggest an improvement','↗ Compartilhar projeto':'↗ Share project','Apoie financeiramente':'Support the project',
    'Ajude o PokéBuild a continuar crescendo.':'Help PokéBuild keep growing.','Em breve':'Coming soon','Pokémon e personagens relacionados pertencem à Nintendo, Game Freak e The Pokémon Company. PokéBuild é um projeto de fã não oficial.':'Pokémon and related characters belong to Nintendo, Game Freak, and The Pokémon Company. PokéBuild is an unofficial fan project.',
    'ESCOLHA O TAMANHO DO QUIZ':'CHOOSE QUIZ LENGTH','Mais perguntas deixam seu perfil mais detalhado. Você pode voltar e mudar suas respostas.':'More questions create a more detailed profile. You can go back and change your answers.',
    'Rápido':'Quick','Completo':'Standard','Recomendado':'Recommended','Extenso':'Long','Máximo':'Maximum','Detalhado':'Detailed','Começar quiz →':'Start quiz →','Discordo totalmente':'Strongly disagree','Discordo':'Disagree','Neutro':'Neutral','Concordo':'Agree','Concordo totalmente':'Strongly agree',
    '← Voltar':'← Back','Próxima →':'Next →','Ver resultado':'See results','Preparando o quiz':'Preparing your quiz','Carregando a Pokédex para incluir todos os Pokémon…':'Loading the Pokédex to include all Pokémon…',
    'Não consegui carregar a Pokédex. Confira sua conexão e tente novamente.':'Could not load the Pokédex. Check your connection and try again.',
    'SEU RESULTADO':'YOUR RESULT','PERGUNTAS':'QUESTIONS','MAIS COMPATÍVEL':'CLOSEST MATCH','POKÉMON QUE MAIS COMBINA':'YOUR MATCH','Sua Nature':'Your Nature','Nature':'Nature','SEU PERFIL':'YOUR PROFILE',
    'PRÉVIA ILUSTRATIVA':'ILLUSTRATIVE PREVIEW','É assim que fica o seu resultado':'Here is what your result looks like','Ao terminar, você verá seu Pokémon mais compatível, a Nature associada ao seu perfil e outras combinações próximas.':'At the end, you’ll see your closest Pokémon match, the Nature associated with your profile, and other similar matches.','Curioso e espontâneo; encara novidades com entusiasmo e mente aberta.':'Curious and spontaneous; approaches new things with enthusiasm and an open mind.','NATURE INTERPRETADA':'INTERPRETED NATURE','A Nature resume de forma leve alguns traços sugeridos pelas suas respostas.':'Your Nature playfully summarizes some traits suggested by your answers.','OUTRA COMBINAÇÃO PRÓXIMA':'ANOTHER CLOSE MATCH','O resultado compara seu perfil com Pokémon de diferentes tipos e características.':'Your result compares your profile with Pokémon of different types and traits.',
    'COMO FUNCIONA':'HOW IT WORKS','Como funciona o quiz de personalidade':'How the personality quiz works','Responda a afirmações sobre seu jeito. Suas respostas formam um perfil em quatro dimensões, que é comparado com características dos Pokémon.':'Answer statements about your personality. Your responses create a profile across four dimensions, which is compared with Pokémon traits.','Responda às perguntas':'Answer the questions','Indique se concorda ou discorda de cada afirmação. Não há respostas certas ou erradas.':'Say whether you agree or disagree with each statement. There are no right or wrong answers.','Seu perfil ganha forma':'Your profile takes shape','Suas respostas mostram tendências em energia, coragem, sociabilidade e curiosidade.':'Your answers reveal tendencies in energy, courage, sociability, and curiosity.','Descubra seu Pokémon':'Discover your Pokémon','Veja qual Pokémon mais combina com seu perfil, sua Nature interpretada e outras combinações próximas.':'Find the Pokémon that best matches your profile, your interpreted Nature, and other close matches.',
    'POKÉMON COM PERFIL PARECIDO':'POKÉMON WITH A SIMILAR PROFILE','Outras combinações próximas':'Other close matches','COMPARADOS':'COMPARED','Pokémon comparados':'Pokémon compared',
    'Seu perfil é uma leitura divertida das respostas.':'Your profile is a fun interpretation of your answers.','DE COMPATIBILIDADE':'COMPATIBILITY','COMPARADOS':'COMPARED',
    'estável e perseverante; costuma manter a calma e seguir em frente.':'steady and persistent; usually stays calm and keeps moving forward.',
    'independente e introspectivo; valoriza ter espaço para fazer as coisas à sua maneira.':'independent and introspective; values having room to do things your own way.',
    'corajoso e decidido; encara desafios mesmo quando eles parecem difíceis.':'brave and determined; faces challenges even when they seem difficult.',
    'firme nas próprias convicções; quando acredita em algo, dificilmente desiste.':'steadfast in your convictions; once you believe in something, you rarely give up.',
    'travesso e espontâneo; gosta de agir com liberdade e um toque de ousadia.':'mischievous and spontaneous; enjoys acting freely with a touch of boldness.',
    'confiante e destemido; não costuma se intimidar diante de situações novas.':'confident and fearless; new situations rarely intimidate you.',
    'dócil e gentil; tende a ser paciente, receptivo e fácil de conviver.':'gentle and kind; tends to be patient, receptive, and easy to get along with.',
    'tranquilo e despreocupado; prefere respeitar o próprio ritmo.':'calm and easygoing; prefers to move at your own pace.',
    'brincalhão e levado; gosta de provocar risadas e aprontar de vez em quando.':'playful and mischievous; enjoys making people laugh and causing a little trouble now and then.',
    'descontraído e flexível; não se prende demais a regras ou pequenas preocupações.':'relaxed and flexible; does not get too caught up in rules or minor worries.',
    'reservado e cauteloso; prefere observar e se sentir seguro antes de se arriscar.':'reserved and cautious; prefers to observe and feel safe before taking a risk.',
    'agitado e impulsivo; gosta de resolver as coisas rapidamente e seguir adiante.':'energetic and impulsive; likes to handle things quickly and move on.',
    'ponderado e focado; costuma levar compromissos e decisões a sério.':'thoughtful and focused; tends to take commitments and decisions seriously.',
    'alegre e animado; ganha energia ao aproveitar experiências com outras pessoas.':'cheerful and lively; gains energy from sharing experiences with others.',
    'curioso e espontâneo; encara novidades com entusiasmo e mente aberta.':'curious and spontaneous; approaches new things with enthusiasm and an open mind.',
    'discreto e humilde; prefere deixar suas atitudes falarem por você.':'modest and humble; prefers to let your actions speak for you.',
    'gentil e sensível; procura agir com cuidado e consideração.':'kind and sensitive; tries to act with care and consideration.',
    'calado e contemplativo; sente-se bem com momentos de paz e reflexão.':'quiet and contemplative; feels at ease in moments of peace and reflection.',
    'tímido e reservado; pode demorar um pouco para mostrar seu lado mais aberto.':'shy and reserved; may take a little time to show your more open side.',
    'intenso e impulsivo; costuma seguir a empolgação do momento.':'intense and impulsive; often follows the excitement of the moment.',
    'sereno e equilibrado; tende a lidar com situações sem perder a tranquilidade.':'serene and balanced; tends to handle situations without losing composure.',
    'atencioso e cuidadoso; procura tratar as pessoas com delicadeza.':'thoughtful and caring; tries to treat people with gentleness.',
    'atrevido e confiante; não tem medo de responder à altura ou defender seu espaço.':'bold and confident; is not afraid to speak up or stand your ground.',
    'prudente e atento; pensa nas consequências antes de tomar uma decisão.':'careful and attentive; thinks about the consequences before making a decision.',
    'original e imprevisível; gosta de seguir interesses e ideias pouco convencionais.':'original and unpredictable; likes following unconventional interests and ideas.',
    'A Nature resume, de forma divertida, os traços de personalidade sugeridos pelas suas respostas. Nos jogos, ela também influencia atributos de batalha.':'Your Nature is a playful summary of the personality traits suggested by your answers. In the games, Natures also affect battle stats.',
    '← Mudar duração':'← Change quiz length','↗ Compartilhar resultado':'↗ Share result','Refazer com':'Retake with','perguntas':'questions','Preparando resultado…':'Preparing result…',
    'Texto copiado · imagem baixada':'Text copied · image downloaded','Não foi possível compartilhar':'Could not share','Não foi possível gerar a imagem.':'Could not create the image.',
    'Não foi possível carregar os Pokémon. Confira sua conexão e tente novamente.':'Could not load Pokémon. Check your connection and try again.',
    'Carregando Pokémon e tipos...':'Loading Pokémon and types...','favoritos por geração e tipo':'favorites by generation and type','Pokémon disponíveis':'Pokémon available','opções desta categoria':'options in this category',
    'Nenhum Pokémon encontrado com esses filtros.':'No Pokémon found with these filters.','18 tipos disponíveis':'18 types available','Geração':'Generation','Remover':'Remove','Trocar':'Replace','Escolher favorito':'Choose favorite',
    'Geração I':'Generation I','Geração II':'Generation II','Geração III':'Generation III','Geração IV':'Generation IV','Geração V':'Generation V','Geração VI':'Generation VI','Geração VII':'Generation VII','Geração VIII':'Generation VIII','Geração IX':'Generation IX',
    'Normal':'Normal','Fogo':'Fire','Água':'Water','Grama':'Grass','Elétrico':'Electric','Gelo':'Ice','Lutador':'Fighting','Psíquico':'Psychic','Pedra':'Rock','Voador':'Flying','Fada':'Fairy','Inseto':'Bug','Veneno':'Poison','Terra':'Ground','Fantasma':'Ghost','Dragão':'Dragon','Noturno':'Dark','Aço':'Steel',
    'Pássaro regional':'Regional bird','Mamífero regional':'Regional mammal','Inseto regional':'Regional bug','Inicial de grama':'Grass starter','Pseudo-lendário':'Pseudo-legendary','Fóssil favorito':'Favorite fossil','Herói de Mystery Dungeon':'Mystery Dungeon hero','Pokémon bebê':'Baby Pokémon','Lendário de capa':'Box legendary','Mítico':'Mythical','Mega evolução':'Mega Evolution','Ultra Beast':'Ultra Beast','Paradoxo':'Paradox','Forma regional':'Regional form','Nova evolução':'New evolution','Tipo favorito':'Favorite type','Poké Bola favorita':'Favorite Poké Ball','Clone do Pikachu':'Pikachu clone','Evolução do Eevee':'Eevee evolution','Personalizada':'Custom',
    'As descrições da Pokédex e os dados individuais apontam para um perfil':'Pokédex entries and individual data suggest a profile that is',
    'As pistas individuais deste Pokémon ficam próximas do equilíbrio nos quatro eixos do quiz.':'This Pokémon’s individual clues are close to balanced across all four quiz axes.',
    'Os perfis individuais não carregaram; este resultado foi comparado principalmente pelos tipos.':'Individual profiles could not be loaded; this result was matched mainly by type.',
    'O quiz interpreta descrições da Pokédex e combina essas pistas com habilidades, atributos e tipos. Os traços não são uma classificação oficial.':'The quiz interprets Pokédex entries and combines those clues with abilities, stats, and types. These traits are not an official classification.',
    'Este resultado usa os tipos como referência porque os dados individuais não ficaram disponíveis.':'This result uses types as a reference because individual data was unavailable.',
    'Buscar':'Search','Vazio':'Empty','Cobertura':'Coverage','Fraquezas':'Weaknesses','Ataques':'Attacks','Defesa':'Defense','Especial':'Special','Velocidade':'Speed'
  };
  let language = localStorage.getItem(STORAGE_LANGUAGE) === 'en' ? 'en' : 'pt';
  const originals = new WeakMap();
  const attrs = ['title','placeholder','aria-label'];

  function translated(value) {
    if (language !== 'en') return value;
    const trimmed = value.trim();
    if (translations[trimmed]) return value.replace(trimmed, translations[trimmed]);
    let result = value;
    Object.keys(translations).sort((a,b)=>b.length-a.length).forEach(source => {
      if (source.length > 2 && result.includes(source)) {
        const escaped = source.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
        result = result.replace(new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`,'gu'), `$1${translations[source]}`);
      }
    });
    return result;
  }

  function translateNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.nodeValue.trim()) return;
      const saved = originals.get(node);
      const current = node.nodeValue;
      const source = saved && (current === saved.pt || current === saved.en) ? saved.pt : current;
      const en = translated(source);
      originals.set(node, {pt:source,en});
      if (node.nodeValue !== (language === 'en' ? en : source)) node.nodeValue = language === 'en' ? en : source;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || ['SCRIPT','STYLE'].includes(node.tagName)) return;
    attrs.forEach(attr => {
      if (!node.hasAttribute(attr)) return;
      const saved = originals.get(node) || {};
      const current = node.getAttribute(attr);
      const source = saved[attr] && (current === saved[attr].pt || current === saved[attr].en) ? saved[attr].pt : current;
      const en = translated(source);
      saved[attr] = {pt:source,en}; originals.set(node,saved);
      node.setAttribute(attr,language === 'en' ? en : source);
    });
    node.childNodes.forEach(translateNode);
  }

  function setLanguage(next) {
    language = next === 'en' ? 'en' : 'pt';
    localStorage.setItem(STORAGE_LANGUAGE,language);
    document.documentElement.lang = language === 'en' ? 'en' : 'pt-BR';
    document.title = language === 'en' ? 'PokéBuild — Build a team and discover your Pokémon' : 'PokéBuild — Monte seu time e descubra seu Pokémon';
    const select = document.getElementById('language-select');
    if (select) select.value = language;
    translateNode(document.body);
  }

  function setTheme(next) {
    const theme = next === 'light' ? 'light' : 'dark';
    document.body.dataset.theme = theme;
    localStorage.setItem(STORAGE_THEME,theme);
    const button = document.getElementById('theme-toggle');
    if (button) {
      button.textContent = theme === 'light' ? '☾' : '☼';
      const label = theme === 'light' ? (language === 'en' ? 'Switch to dark theme' : 'Ativar tema escuro') : (language === 'en' ? 'Switch to light theme' : 'Ativar tema claro');
      button.title = label; button.setAttribute('aria-label',label);
    }
  }

  window.pokebuildLanguage = () => language;
  window.pokebuildTranslate = value => translated(String(value));

  document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(records => records.forEach(record => {
      if (record.type === 'characterData') translateNode(record.target);
      else record.addedNodes.forEach(translateNode);
    }));
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    const savedTheme = localStorage.getItem(STORAGE_THEME) === 'light' ? 'light' : 'dark';
    setTheme(savedTheme);
    setLanguage(language);
    document.getElementById('language-select').addEventListener('change',event=>{setLanguage(event.target.value);setTheme(document.body.dataset.theme);});
    document.getElementById('theme-toggle').addEventListener('click',()=>setTheme(document.body.dataset.theme === 'light' ? 'dark' : 'light'));
  });
})();
