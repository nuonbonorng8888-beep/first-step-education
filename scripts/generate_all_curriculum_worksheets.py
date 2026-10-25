# -*- coding: utf-8 -*-
"""
Curriculum Worksheets Generator for Grade 7, Grade 8, Grade 9
MoEYS Standard Textbook Curriculum
Guarantees:
1. ZERO overlapping or duplicate exercises between points.
2. Authentic Level 1 (មូលដ្ឋានគ្រឹះ) and Level 2 (អនុវត្តន៍) for each point.
3. High mathematical accuracy (e.g. Square roots of 64 are +8 and -8, whereas sqrt(64) = 8).
4. Balanced KaTeX delimiters ($...$) and complete step-by-step solutions.
"""

import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

def build_point(p_num, sheet_num, title, topic, obj, l1_ins, l1_q, l1_sol, l1_rub, l2_ins, l2_q, l2_sol, l2_rub):
    return {
        "pointNumber": p_num,
        "sheetNumber": f"{sheet_num} - ចំណុចទី {p_num}",
        "pointTitle": title,
        "topic": topic,
        "objective": obj,
        "totalPoints": 10,
        "exercises": [
            {
                "id": "ex1",
                "level": "កម្រិត ១ (ស្រួល / មូលដ្ឋានគ្រឹះ)",
                "points": 5,
                "instruction": l1_ins,
                "question": l1_q,
                "solution": l1_sol,
                "rubric": l1_rub
            },
            {
                "id": "ex2",
                "level": "កម្រិត ២ (មធ្យម / ការយល់ដឹង និងអនុវត្ត)",
                "points": 5,
                "instruction": l2_ins,
                "question": l2_q,
                "solution": l2_sol,
                "rubric": l2_rub
            }
        ]
    }

print("Worksheet builder helper loaded.")
