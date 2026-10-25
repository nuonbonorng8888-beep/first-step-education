# -*- coding: utf-8 -*-
import os

target_files = [
    'scripts/generate_official_g7.py',
    'scripts/generate_official_g8.py',
    'scripts/generate_official_g9.py'
]

for fname in target_files:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace \\$$ with \\text{ ដុល្លារ}$
    content = content.replace('\\$$', ' \\text{ ដុល្លារ}$')
    
    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Fixed currency symbols in {fname}")
