# designtool — Free Online Design Tools

[![Python](https://img.shields.io/badge/Python-3.8%2B-blue)](https://python.org)
[![License: MIT (code)](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Catalog: CC-BY-4.0](https://img.shields.io/badge/Catalog-CC--BY--4.0-green.svg)](LICENSE-data)
[![Tools](https://img.shields.io/badge/Tools-38-purple)](https://designtool.tools)

**Official public archive for [designtool.tools](https://designtool.tools)** — a free, browser-based design toolkit with 38 tools (color science, CSS generators, AI palette/typography engines, and logo/poster/card/thumbnail makers), available in 14 languages.

> ⚠️ **Important**: designtool.tools is **not** open-source software. The web application itself is proprietary. This repository is an *archive*, not the product: it hosts the color-name catalog, the `colorname` CLI, and an edge-infrastructure snippet for reference. All processing runs 100% locally in the browser — files never leave the user's device.

## What's inside

| Path | What it is | License |
|---|---|---|
| [`cli/catalog/color-names.json`](cli/catalog/color-names.json) | 281 named colors — 141 CSS standard names + 140 cultural colors (Chinese traditional, Japanese wagairo, Korean obangsaek, Rosa Mexicano, Bleu de France, Bauhaus, Islamic, Indian, Thai, Vietnamese, Batik, Gzhel) | CC-BY-4.0 — attribution: link to https://designtool.tools |
| [`cli/`](cli) | `colorname` command-line tool: name any hex by perceptual CIELAB distance, search and explore the catalog | MIT |
| [`edge/`](edge) | Cloudflare Worker snippet: static assets + R2 model streaming with HTTP range support (serves the on-device AI models) | Provided for reference, no license granted |

## Install the CLI

```bash
pip install git+https://github.com/yangchangjiang/designtool.git
```

## Usage

```bash
$ colorname #FF461F
Chinese Red (China)         #FF461F  ΔE=0.00  (zh-CN)
...

$ colorname search coral
Coral                        #FF7F50  (css)
...

$ colorname count
281 colors

$ colorname random
Forest Green                #228B22  (css)
```

The engine is the classic sRGB → CIE Lab (D65) pipeline with Euclidean ΔE —
the same color science used by the Color Namer at https://designtool.tools/color-namer/.
