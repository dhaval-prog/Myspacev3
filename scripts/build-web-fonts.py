#!/usr/bin/env python3
"""Builds the web app's fonts: Latin subsets in WOFF2 (public/fonts/), about a quarter of the
original TTF size. Characters outside the subset (e.g. Devanagari names) fall back to the system
font per character. Re-run after adding a font:  pip install fonttools brotli && python3 scripts/build-web-fonts.py
"""
import glob
import os

from fontTools import subset

FONTS = [
    'BricolageGrotesque_700Bold', 'BricolageGrotesque_800ExtraBold',
    'SpaceMono_400Regular', 'SpaceMono_700Bold',
    'Figtree_400Regular', 'Figtree_400Regular_Italic', 'Figtree_500Medium', 'Figtree_600SemiBold',
    'Figtree_700Bold', 'Figtree_800ExtraBold',
    'DMMono_400Regular', 'DMMono_500Medium',
    'Caveat_400Regular', 'Caveat_500Medium', 'Caveat_600SemiBold', 'Caveat_700Bold',
    'PlusJakartaSans_400Regular', 'PlusJakartaSans_500Medium', 'PlusJakartaSans_600SemiBold',
    'PlusJakartaSans_700Bold', 'PlusJakartaSans_800ExtraBold',
]
# Latin, Latin-1, Latin Extended-A, punctuation, ₹ € ™, arrows, minus.
UNICODES = 'U+0000-024F,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+20B9,U+2122,U+2190-2199,U+2212,U+2215,U+FEFF,U+FFFD'

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(root, 'public', 'fonts')
os.makedirs(out, exist_ok=True)
for name in FONTS:
    src = glob.glob(os.path.join(root, 'node_modules', '@expo-google-fonts', '*', '*', f'{name}.ttf'))
    if not src:
        raise SystemExit(f'missing {name}.ttf')
    dst = os.path.join(out, f'{name}.woff2')
    subset.main([src[0], f'--unicodes={UNICODES}', '--layout-features=*', '--flavor=woff2', f'--output-file={dst}'])
    print(f'{name}: {os.path.getsize(src[0]) // 1024}K -> {os.path.getsize(dst) // 1024}K')
