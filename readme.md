# PokéBuild

PokéBuild é um projeto comunitário para montar times de Pokémon, explorar listas temáticas, guardar favoritos e descobrir qual Pokémon combina com seu perfil.

## Executar localmente

O frontend usa APIs públicas da PokéAPI e pode ser servido localmente com Python:

```bash
python -m http.server 8000
```

Abra `http://localhost:8000` no navegador.

O backend Flask é opcional e fornece dados de ameaças do meta e sinergias de habilidades. Para iniciá-lo em outro terminal:

```bash
python -m pip install -r requirements.txt
python app.py
```

O servidor inicia em `http://localhost:5000`. Algumas funções do frontend consultam esse endereço local; APIs externas, como a PokéAPI, continuam sendo usadas diretamente pelo navegador.

## Dados e serviços externos

- [PokéAPI](https://pokeapi.co/) fornece dados e sprites de Pokémon.
- [Smogon](https://www.smogon.com/) fornece análises competitivas quando disponíveis.

Esses serviços e seus conteúdos têm termos e licenças próprios.

## Licença

O código original deste projeto está sob a licença [MIT](LICENSE).

A licença MIT deste repositório não concede direitos sobre Pokémon, seus nomes, personagens, marcas, logotipos, ilustrações ou sprites. Esses materiais pertencem aos respectivos titulares ou provedores e não estão cobertos pela licença do código original. Consulte os termos dos serviços externos antes de reutilizar dados ou arquivos obtidos por meio deles.
