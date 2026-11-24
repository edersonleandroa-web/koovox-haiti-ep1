# Especificação do roteiro visual — "HAITI" (KOOVOX, episódio 1)

Documentário de ~14 min em 5 capítulos de narração (Intro, 1, 2, 3, Final), editado em Remotion
(1920×1080, 30 fps). Este arquivo é o contrato entre o planejamento das cenas, a busca de mídia e o
código. Os dados de cada capítulo ficam em `src/data/scenes/<cap>.json` (cap = `intro`, `c1`, `c2`,
`c3`, `final`).

## 1. Estética (referências do usuário)

Quadro de investigação visto de frente/de cima sobre **um único fundo escuro quadriculado** (textura
do usuário, `public/textures/fundo-4x.jpg`). Sobre ele: **polaroids** presas com fita crepe ou
tachinha, **mapa** impresso (estilo mapa de papel antigo, dessaturado) com alfinetes e rota tracejada
vermelha, **pasta de arquivo** (kraft), **recortes de jornal**, **fio vermelho** ligando
pistas. Entre os quadros do mural entram **fotos e vídeos reais em tela cheia** (b-roll de
documentário, com granulação e vinheta).

Regras do usuário (obrigatórias):

- **Texto só quando necessário**: identificar lugares, nomes, datas, números importantes ou destacar
  uma informação essencial. Nada de frases, citações longas ou legendas da narração.
- **Sem poluição**: nada de elementos decorativos sem função narrativa. Uma ideia por cena.
- **Informação perto do centro** da tela (nunca nos cantos/bordas).
- **Textos com um neon bem leve** (o código cuida do brilho; o roteiro só define o texto).
- **Imagens e vídeos reais** buscados na internet.
- **O vídeo é em ESPANHOL** (a narração é em espanhol): todo texto de tela em espanhol, em MAIÚSCULAS,
  com acentos e sinais de abertura (¿ ¡). Ex.: PUERTO PRÍNCIPE, HAITÍ, PANDILLAS, REPÚBLICA DOMINICANA.
  Números no padrão hispano-americano (5,940,000 · 1.5).
- **Nunca linha embaixo do texto.** Para destacar uma palavra: marca-texto (`"mark": "marker"`) ou um
  círculo à mão em volta (`"mark": "circle"`) no `label`.

## 2. Formato do arquivo de cenas

```jsonc
{
  "chapter": "c1",            // intro | c1 | c2 | c3 | final
  "audio": "audio/1.mp3",      // narração do capítulo (já em public/audio)
  "duration": 158.04,          // duração do áudio em s
  "scenes": [ Scene, ... ]     // contíguas: scenes[0].start = 0, scenes[i].end = scenes[i+1].start,
                               // última .end = duration
}
```

Todos os tempos em **segundos**, relativos ao início do áudio do capítulo. `start`/`end` de cada
cena caem ~0,15 s ANTES da primeira palavra da frase que ela ilustra (cortes no respiro da voz).
Tempos internos (`at`) são relativos ao início da cena e caem na palavra que motiva o elemento
(ex.: o rótulo "1957" aparece quando o narrador diz "1957").

Duração de cena: **3,5 s a 8 s** (ideal 4–6 s). Trecho longo sobre um mesmo assunto = várias cenas
(planos diferentes da mesma coisa). Nenhuma cena acima de 9 s.

### Campos comuns a toda cena

```jsonc
{
  "id": "c1-07",                 // único
  "start": 31.0, "end": 36.2,
  "type": "photo",               // ver tipos abaixo
  "transition": "whip",          // como ESTA cena entra: whip | zoom | flash | glitch | fade | cut
  "label": {                     // opcional — texto de tela (ver regras de texto)
    "text": "NOVEMBRO DE 2026",
    "sub": "REUTERS",            // opcional, linha pequena
    "at": 0.6,                   // s desde o início da cena
    "kind": "date"               // place | name | date | number | info
  },
  "note": "o que a cena mostra (texto livre, não aparece no vídeo)"
}
```

`transition`: use `whip` na maioria (câmera varre o mural), `zoom` quando a cena seguinte é um
detalhe da anterior, `flash` ao entrar uma foto de arquivo/histórica, `glitch` só em momentos de
violência/ruptura (golpe, massacre, assassinato), `fade` só no início de capítulo. Varie; nunca 3
iguais seguidas, exceto `whip`.

### Mídia (`media`)

```jsonc
"media": {
  "src": "media/c1/duvalier-1957.jpg",   // caminho dentro de public/
  "kind": "image",                       // image | video
  "trim": 12.0,                          // vídeo: segundo do arquivo onde o trecho começa (padrão 0)
  "focus": [0.5, 0.35],                  // ponto de interesse (0..1) para corte e Ken Burns
  "grade": "bw",                         // bw | warm | cold | none  (padrão: bw p/ antes de 2000, warm depois)
  "credit": "c1-duvalier"                // id em data/credits/<cap>.json
}
```

Antes da busca, o planejador deixa `src: null` e descreve o que precisa em `"want"`:
`"want": "retrato de François Duvalier (Papa Doc), anos 1950-60"`.

### Tipos de cena

| type | quando usar | campos próprios |
|---|---|---|
| `photo` | foto/vídeo real apresentado como objeto no mural | `media`, `frame`: `polaroid` \| `print` \| `clipping` \| `tv`; `caption` (opcional, ≤ 3 palavras, escrito à mão na polaroid) |
| `full` | b-roll em tela cheia (foto com Ken Burns ou vídeo) | `media`, `move`: `in` \| `out` \| `left` \| `right` (foto) |
| `person` | apresentar uma pessoa pela 1ª vez | `media` (retrato), `name`, `role` (≤ 4 palavras), `years` (opcional) |
| `duo` | relação entre 2 pessoas/grupos | `items`: 2× `{media, name}`, `link`: texto curto opcional do fio (≤ 2 palavras) |
| `network` | coalizões/redes (3–5 nós) | `items`: 3–5× `{media|null, name}`, `center` (nome do nó central opcional) |
| `map` | lugares, rotas, territórios | `view`, `pins`, `route`, `regions`, `shade` (ver §4) |
| `stat` | número importante | `value` (número), `prefix`, `suffix`, `decimals`, `text` (≤ 5 palavras sob o número), `media` opcional (fundo escurecido) |
| `date` | ano/data marcante | `text` (ex.: "1957"), `sub` (≤ 4 palavras), `media` opcional (fundo) |
| `timeline` | sequência de anos (história) | `years`: lista de `{year, text}` (≤ 7 itens, `text` ≤ 3 palavras), `focus`: índice destacado |
| `doc` | relatório, decreto, denúncia, documento | `title` (≤ 5 palavras), `media` opcional (foto clipada no documento) |
| `headline` | notícia/recorte de jornal | `headline` (≤ 8 palavras, fato da narração), `date`, `media` opcional |
| `chapter` | cartão de capítulo (só o código usa) | — |

Regras de escolha:
- Pessoa citada pela primeira vez → `person` (com retrato real). Citações seguintes → `photo`/`full`.
- Ano/data dita com ênfase → `date` ou `label kind:date` numa cena de foto. Não as duas coisas.
- Número importante (porcentagem, mortos, deslocados, veículos) → `stat` ou `label kind:number`.
- Lugar citado → `map` (com pin) ou `label kind:place` em foto do lugar.
- Alterne: nunca 3 cenas seguidas do mesmo `type`. A cada ~4 cenas no mural, 1–2 de `full`.
- Mire em ~30% `full` (b-roll real), ~35% `photo`/`person`/`duo`/`network`, ~35% gráficos
  (`map`/`stat`/`date`/`timeline`/`doc`/`headline`).

## 3. Regras de texto de tela

- **Espanhol**, **MAIÚSCULAS**, sem ponto final, com acentos e ¿ ¡. Grafia correta dos nomes próprios
  (PUERTO PRÍNCIPE; HAITÍ; PANDILLAS; FRAPH; BAZ; KOOVOX; TONTONS MACOUTES; CITÉ SOLEIL; GRAN GRIF).
  Transcrição correta em espanhol: `data/transcripts-es/`.
- `label.text` ≤ 4 palavras; `sub` ≤ 4 palavras. Máximo **1 rótulo por cena**.
- Só fatos ditos na narração (ou datas/nomes inequívocos do próprio assunto narrado).
  Nada inventado. Na dúvida, sem texto.
- Nada de legendas da fala. Nada de títulos genéricos ("A HISTÓRIA", "O COMEÇO").

## 4. Mapas

`view`: `americas` (El Salvador → Haiti) · `caribbean` (Caribe/Hispaniola) · `haiti` (país inteiro,
departamentos) · `pap` (região metropolitana de Porto Príncipe, comunas).

```jsonc
"pins":    [ {"name": "PORTO PRÍNCIPE", "lon": -72.335, "lat": 18.539, "at": 0.8} ],
"route":   {"from": [-89.19, 13.69], "to": [-72.33, 18.54], "at": 0.5, "label": "SOLDADOS"},
"regions": [ {"name": "Artibonite", "at": 1.0} ],          // destaca departamento (ADM1) ou comuna (ADM3)
"shade":   {"communes": ["Cite Soleil","Delmas","Port au Prince","Tabarre","Carrefour"], "at": 1.2, "text": "+80% SOB CONTROLE"}
```

Nomes de `regions`/`shade` precisam bater com `src/data/geo/hti-adm1.json` (departamentos,
ex. "Artibonite Department", "Département de l'Ouest") ou `hti-adm3.json` (comunas, ex.
"Cite Soleil", "Delmas", "Petionville", "Croix des Bouquets", "Carrefour", "Tabarre", "Kenscoff",
"Port au Prince", "Gressier", "Cabaret", "Arcahaie", "Saint-Marc", "Gonaives", "Cap Haitien",
"Mirebalais", "Les Cayes", "Jeremie", "Jacmel", "Hinche"…). Coordenadas em graus decimais (WGS84).
Máx. 4 pins por cena.

## 5. Busca de mídia (imagens e vídeos reais)

Fontes permitidas (o repositório do projeto é **público**, então só licenças livres):
- **Wikimedia Commons** (API: `https://commons.wikimedia.org/w/api.php`) — só **domínio público,
  CC0, CC BY, CC BY-SA**. Nunca NC/ND, nunca "fair use".
- **Governo dos EUA = domínio público**: DVIDS (dvidshub.net), US Navy/Army/Coast Guard/USAID/
  Departamento de Estado, VOA (Voice of America), Biblioteca do Congresso sem restrições.
- **Internet Archive** (archive.org) — só itens em domínio público (cinejornais antigos etc.).
- Não usar bancos pagos (Freepik/Getty/AP/Reuters/AFP), nem YouTube.
- Nada de cadáveres, sangue ou violência explícita (política do YouTube). Armas, barricadas,
  fumaça, polícia, multidões e destruição podem.
- Pessoas privadas: não. Figuras públicas (presidentes, líderes de gangue conhecidos e sancionados
  publicamente, policiais/soldados em serviço) podem.

Arquivos:
- Imagens → `public/media/<cap>/<slug>.jpg`, lado maior ≤ 2400 px (ffmpeg:
  `ffmpeg -i in -vf "scale='min(2400,iw)':-2" -q:v 3 out.jpg`). Mínimo aceitável: 900 px de largura.
- Vídeos → `public/media/<cap>/<slug>.mp4`, trecho ≤ 20 s, H.264, 30 fps, sem áudio, ≤ 1920 px:
  `ffmpeg -ss <ini> -t <dur> -i in -an -vf "scale='min(1920,iw)':-2,fps=30" -c:v libx264 -crf 21 -preset medium -g 15 -pix_fmt yuv420p -movflags +faststart out.mp4`
- Créditos → `data/credits/<cap>.json`: lista de
  `{"id", "file", "title", "author", "license", "source"}` (source = página do arquivo).
- **Abra (veja) cada imagem baixada** e confira que mostra o que a cena pede. Para vídeo, extraia
  1–2 quadros com ffmpeg e olhe.
