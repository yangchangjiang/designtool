"""CIELAB color science — hex to Lab conversion and perceptual color distance.

Pure standard-library implementation of the classic sRGB → CIE Lab pipeline
(D65 white point), matching the designtool.tools Color Namer engine.
"""
import math


def hex_to_rgb(hexstr):
    """Parse '#RRGGBB' (hash optional) into an (r, g, b) tuple, or None."""
    s = hexstr.strip().lstrip('#')
    if len(s) != 6:
        return None
    try:
        v = int(s, 16)
    except ValueError:
        return None
    return ((v >> 16) & 255, (v >> 8) & 255, v & 255)


def rgb_to_lab(rgb):
    """Convert an (r, g, b) tuple (0-255) to (L, a, b) in CIE Lab (D65)."""
    r, g, b = (c / 255.0 for c in rgb)

    def srgb_to_linear(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = map(srgb_to_linear, (r, g, b))
    x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
    y = (r * 0.2126 + g * 0.7152 + b * 0.0722)
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883

    def pivot(t):
        return t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116

    x, y, z = map(pivot, (x, y, z))
    return (116 * y - 16, 500 * (x - y), 200 * (y - z))


def lab_distance(l1, l2):
    """Euclidean distance between two Lab colors — the perceptual ΔE."""
    return math.sqrt((l1[0] - l2[0]) ** 2 + (l1[1] - l2[1]) ** 2 + (l1[2] - l2[2]) ** 2)
