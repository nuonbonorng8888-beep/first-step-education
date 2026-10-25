# -*- coding: utf-8 -*-
"""
Complete Point-by-Point Worksheets Builder for Grade 7, 8, 9
MoEYS Standard Curriculum
Guarantees:
- Every point has its own distinct Level 1 (មូលដ្ឋានគ្រឹះ) and Level 2 (អនុវត្តន៍) exercises.
- ZERO overlap between Point 1, Point 2, and Point 3.
- Exact mathematical rigor:
    Square roots of 64 are +8 and -8 (x^2 = 64), whereas sqrt(64) = 8.
- Balanced KaTeX math delimiters ($...$).
"""

import os
import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COURSES_FILE = os.path.join(BASE_DIR, 'data', 'courses.json')
WORKSHEETS_FILE = os.path.join(BASE_DIR, 'data', 'worksheets.json')
WORKSHEETS_G11_FILE = os.path.join(BASE_DIR, 'data', 'worksheets_g11.json')

print("Loading curriculum courses...")
with open(COURSES_FILE, 'r', encoding='utf-8') as f:
    courses = json.load(f)

print("Found", len(courses), "courses.")
