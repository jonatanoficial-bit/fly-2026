# Flight Simulator Web Game

Este repositório contém um protótipo de um jogo de simulador de avião estilo **AAA** desenvolvido para ser hospedado no GitHub.

O objetivo principal é fornecer uma base sólida e expansível para um jogo de gerenciamento e voo de aeronaves.  O jogo possui duas partes principais:

1. **Simulação de Voo 3D** – utiliza a biblioteca [three.js](https://threejs.org/) para renderizar a aeronave em um ambiente tridimensional e permite controlar o avião com teclado.  A biblioteca é conhecida por ser perfeita para desenvolver jogos 3D no navegador e oferece efeitos visuais avançados【945860909363583†L33-L36】.
2. **Mapa 2D e Gestão de Companhias** – utiliza a biblioteca [Leaflet](https://leafletjs.com/) e uma API de mapas (OpenStreetMap/MapBox) para exibir voos em um mapa realista.  A administração da companhia aérea inclui orçamento, funcionários, missões e ações comerciais, inspirada em jogos de gestão de companhias aéreas que permitem rastrear voos no mapa, agendar reparos e personalizar aeronaves【690044430469829†L61-L69】.

O jogo foi projetado de forma modular para facilitar futuras expansões e DLCs.  Há também uma interface de administração (em `admin.html`) que permite adicionar novos modelos de aviões, missões e dados de atualização (em versões futuras, os dados podem ser persistidos em um banco de dados ou API).

### Executar localmente

Para rodar localmente, basta abrir o arquivo `index.html` em um navegador moderno com suporte a WebGL.  O mapa utiliza a API do Mapbox; substitua o token `YOUR_MAPBOX_ACCESS_TOKEN` em `js/map.js` por um token válido ou configure o mapa para usar tiles do OpenStreetMap.

### Estrutura

```
flight-simulator/
├── index.html        # Página principal do jogo
├── admin.html        # Painel de administração restrito
├── js/
│   ├── game.js       # Lógica da simulação de voo e controles 3D
│   ├── map.js        # Lógica do mapa 2D e rotas
│   ├── ui.js         # Interface de usuário e menus
│   ├── data.js       # Dados estáticos (aeronaves, missões, funcionários)
│   └── admin.js      # Lógica do painel de administração
├── css/
│   ├── style.css     # Estilo global do jogo
│   └── admin.css     # Estilo da página de administração
└── assets/
    ├── images/
    │   ├── cover.png # Capa do jogo (imagem gerada)
    │   ├── logo.png  # Logotipo simples
    │   └── plane.png # Ícone de avião para o mapa
    └── models/
        └── (vazio)   # Diretório para modelos 3D adicionais (GLB/GLTF)
```

O código foi estruturado de maneira que seja fácil adicionar novos módulos, como motores de física mais realistas ou integração com serviços externos.  Embora este protótipo utilize um modelo de avião simples, a estrutura está preparada para carregar modelos 3D em formato GLTF via `GLTFLoader` do three.js, conforme exemplificado pela documentação da Mapbox【945860909363583†L206-L214】.