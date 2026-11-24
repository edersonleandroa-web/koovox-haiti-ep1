# HAITI — KOOVOX, episódio 1 (Remotion)

Documentário de ~14 min sobre o Haiti e as gangues, editado em **Remotion** a partir de 5 narrações
(Intro, Capítulo 1, 2, 3 e Final) e renderizado na nuvem pelo **GitHub Actions**.

## Estilo

- Quadro de investigação sobre o **fundo quadriculado escuro** enviado pelo usuário
  (`public/textures/fundo-limpo.jpg`, ampliado 4× no Magnific e limpo de uma fileira de pontos de poeira).
- Polaroids com fita crepe e tachinhas, mapa de papel com alfinetes e rotas tracejadas, pasta de
  arquivo, recortes de jornal, fio vermelho ligando pistas, b-roll real em tela cheia.
- **Texto só para lugares, nomes, datas, números e informação essencial**, sempre perto do centro,
  com um **neon bem leve** (`src/theme.ts`: `GLOW_WHITE`, `GLOW_RED`).
- Fontes do Google Fonts via `@remotion/google-fonts`: Special Elite (máquina de escrever),
  Oswald (números, datas, títulos) e Permanent Marker (legenda à mão nas polaroids).

## Como funciona

| Pasta | O que tem |
|---|---|
| `docs/ESPEC-ROTEIRO.md` | contrato do roteiro visual (tipos de cena, regras de texto e de mídia) |
| `data/transcripts/` | transcrição palavra a palavra das narrações (faster-whisper large-v3-turbo) |
| `src/data/scenes/*.json` | roteiro de cada capítulo: cenas sincronizadas com a fala |
| `src/scenes/` | tipos de cena: foto no mural, tela cheia, pessoa, dupla, rede, mapa, número, data, linha do tempo, documento, manchete, logo |
| `src/SceneHost.tsx` | transições (chicotada com desfoque, zoom, flash, glitch, fade) |
| `src/audio/` | mixagem em `mix.ts`: trilha fixa sob a voz (sobe só no título e nos cartões) e efeitos só em transições e números que acendem |
| `public/music`, `public/sfx` | trilhas e efeitos gerados no **Magnific** (Google Lyria 3 Pro / ElevenLabs SFX) |
| `public/media/<capítulo>/` | fotos e vídeos reais com licença livre (créditos em `CREDITS.md`) |

## Render na nuvem

Cada push na `main` dispara `.github/workflows/render.yml`:

1. verifica tipos e lint;
2. renderiza o vídeo em **12 pedaços paralelos** e a mixagem de áudio em outro job;
3. junta os pedaços, nivela o áudio em **-14 LUFS** (duas passadas de loudnorm) e publica
   `HAITI-KOOVOX-EP1.mp4` (1080p) e uma cópia leve de 720p na release **render-mais-recente**.

## Comandos locais

```bash
npm ci
npm run dev                                   # Remotion Studio
node scripts/render.mjs info                  # duração total
node scripts/render.mjs stills 120,900 0.5    # quadros de conferência em out/stills
py scripts/scenes_index.py                    # reindexa src/data/scenes depois de mudar roteiros
py scripts/build_speech.py                    # trechos de fala (para a trilha abaixar sob a voz)
```
