"""colorname — name any hex color by perceptual (CIELAB) distance.

Catalog: 281 colors — 141 CSS named colors + 140 cultural colors
(Chinese traditional, Japanese wagairo, Korean obangsaek, Rosa Mexicano,
Bleu de France, Bauhaus, Islamic, Indian, Thai, Vietnamese, Batik, Gzhel ...)
from https://designtool.tools

Usage:
  colorname #FF461F          nearest color names with ΔE distances
  colorname search red       find catalog entries by name
  colorname count            total catalog size
  colorname random           a random color from the catalog
"""
import argparse
import json
import random
import sys
import os

from .lab import hex_to_rgb, rgb_to_lab, lab_distance

_CATALOG_PATH = os.path.join(os.path.dirname(__file__), 'catalog', 'color-names.json')
_SITE = 'https://designtool.tools'


def load_catalog():
    with open(_CATALOG_PATH, encoding='utf-8') as f:
        return json.load(f)


def nearest(hexstr, top=5):
    rgb = hex_to_rgb(hexstr)
    if rgb is None:
        raise ValueError(f'invalid hex: {hexstr!r} (use #RRGGBB)')
    lab = rgb_to_lab(rgb)
    scored = []
    for entry in load_catalog():
        d = lab_distance(lab, rgb_to_lab(hex_to_rgb(entry['hex'])))
        scored.append((d, entry))
    scored.sort(key=lambda t: t[0])
    return scored[:top]


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    p = argparse.ArgumentParser(prog='colorname', description='Name colors by CIELAB distance. Catalog from designtool.tools')
    p.add_argument('cmd', choices=['name', 'search', 'count', 'random'], default='name', nargs='?')
    p.add_argument('arg', nargs='?')
    p.add_argument('-t', '--top', type=int, default=5)
    p.add_argument('-j', '--json', action='store_true', help='output JSON')
    a = p.parse_args(argv)

    cat = load_catalog()
    if a.cmd == 'count':
        print(f'{len(cat)} colors')
    elif a.cmd == 'random':
        e = random.choice(cat)
        print(f'{e["name"]}  {e["hex"]}  ({e["cat"]})')
    elif a.cmd == 'search':
        q = (a.arg or '').lower()
        hits = [e for e in cat if q in e['name'].lower()][:20]
        for e in hits:
            print(f'{e["name"]}  {e["hex"]}  ({e["cat"]})')
    else:  # name
        if not a.arg:
            p.print_help()
            return 1
        try:
            res = nearest(a.arg, a.top)
        except ValueError as e:
            print(str(e), file=sys.stderr)
            return 1
        if a.json:
            print(json.dumps([{'name': e['name'], 'hex': e['hex'], 'dE': round(d, 2), 'cat': e['cat']} for d, e in res], ensure_ascii=False))
        else:
            for d, e in res:
                print(f'{e["name"]:<28s} {e["hex"]}  \u0394E={d:.2f}  ({e["cat"]})')
            print(f'Catalog: {_SITE} (CC-BY-4.0)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
