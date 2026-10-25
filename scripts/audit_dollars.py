# -*- coding: utf-8 -*-
import os

target_files = [
    'scripts/generate_official_g7.py',
    'scripts/generate_official_g8.py',
    'scripts/generate_official_g9.py'
]

for fname in target_files:
    lines = open(fname, encoding='utf-8').readlines()
    for i, l in enumerate(lines):
        d_cnt = l.count('$')
        if d_cnt % 2 != 0:
            print(f"{fname}:{i+1} [count={d_cnt}]: {l.strip()}")
