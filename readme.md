# PokéBuild

Monte um time, organize Pokémon em tier lists, guarde seus favoritos e responda ao quiz para descobrir qual Pokémon combina com seu perfil.

PokéBuild é um projeto de fã, sem cadastro. O time, os favoritos e as tier lists ficam salvos no armazenamento local do navegador; não há conta nem banco de dados de usuários.

## O que dá para fazer

- **Teambuilder:** pesquise Pokémon, monte um time de até seis integrantes e consulte informações úteis para planejar sets.
- **Tier List:** organize Pokémon em tiers para temas como iniciais, evoluções do Eevee e pseudo-lendários. As escolhas ficam salvas no navegador.
- **Favoritos:** escolha seus Pokémon preferidos por geração, tipo e categorias especiais.
- **Quiz de personalidade:** responda 12, 30 ou 60 perguntas e veja o Pokémon com perfil mais próximo, uma Nature interpretativa e outras combinações.
- **Compartilhar resultado:** gere um card e compartilhe pelo menu do dispositivo quando o navegador oferecer suporte.

Algumas áreas da navegação ainda estão em desenvolvimento.

## Como funciona o quiz

As respostas formam um perfil em quatro eixos: reservado/energético, cauteloso/corajoso, independente/sociável e tranquilo/explorador. O quiz compara esse perfil com informações disponíveis para cada Pokémon, incluindo descrições da Pokédex, atributos base, habilidades e tipos.

A compatibilidade é uma aproximação calculada pela distância entre os perfis. Quando as descrições individuais não estão disponíveis, o quiz usa os tipos como alternativa. A Nature exibida resume os traços sugeridos pelas respostas; é uma interpretação recreativa, não uma característica fixa da espécie nem uma avaliação científica.

## Tecnologias

| Parte | Tecnologia |
| --- | --- |
| Interface | HTML, CSS e JavaScript sem framework |
| Backend local opcional | Python e Flask |
| Dados Pokémon | PokéAPI REST e GraphQL |
| Análises competitivas | Dados do Smogon quando disponíveis |
| Hospedagem do site | Netlify |

## Executar localmente

Requer Python 3. Para servir a interface, na pasta do projeto execute:

```bash
python -m http.server 8000
```

Abra `http://localhost:8000` no navegador. A interface consulta serviços externos, como a PokéAPI, então algumas funções precisam de conexão com a internet.

O backend Flask é opcional. Em outro terminal, instale as dependências e inicie o servidor:

```bash
python -m pip install -r requirements.txt
python app.py
```

Ele fica disponível em `http://localhost:5000` e fornece dados de ameaças, sinergias de habilidades e endpoints de apoio ao Smogon. O frontend só tenta acessar esse backend quando está sendo executado localmente.

## API local

| Método | Endpoint | Uso |
| --- | --- | --- |
| `GET` | `/api/health` | Verifica se o backend local está ativo |
| `GET` | `/api/threats/<formato>` | Retorna ameaças conhecidas para um formato |
| `GET` | `/api/ability-synergy?abilities=levitate,flash-fire` | Agrupa imunidades e resistências de habilidades |
| `GET` | `/api/smogon/<pokemon>/<formato>` | Consulta análises competitivas e mantém cache em memória |

## Estrutura do projeto

```text
PokéBuilder/
├── app.py                 # API Flask opcional
├── index.html             # Interface e seções principais
├── assets/                # Logo e favicon do projeto
├── scripts/               # Teambuilder, quiz, favoritos e tier lists
├── styles/                # Estilos da interface
├── requirements.txt       # Dependências Python do backend
├── LICENSE                # Licença MIT para o código original
└── .gitignore             # Arquivos locais ignorados pelo Git
```

## Serviços e créditos

- [PokéAPI](https://pokeapi.co/) fornece dados e referências de sprites.
- [Smogon](https://www.smogon.com/) é consultado para informações competitivas quando disponíveis.
- [CajunAvenger](https://cajunavenger.github.io/) e [12 Axes](https://12axes.vercel.app/) são referências de inspiração para ideias de organização de favoritos e apresentação de quizzes. O PokéBuild tem implementação e conteúdo próprios.

PokéAPI, Smogon e os respectivos titulares mantêm seus próprios termos e direitos sobre os dados, marcas e materiais que disponibilizam.

## Licença

O código original do PokéBuild está sob a licença [MIT](LICENSE). Essa licença não cobre Pokémon, nomes, personagens, marcas, logotipos, ilustrações, sprites ou outros materiais de terceiros. Esses elementos continuam sujeitos aos direitos e termos de seus respectivos titulares e provedores.
