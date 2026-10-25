# -*- coding: utf-8 -*-
"""
Full MoEYS Worksheets Builder (Grades 7, 8, 9)
Constructs authentic point-by-point worksheets with zero duplicate questions.
"""
import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FILE = os.path.join(BASE_DIR, 'data', 'worksheets.json')
DATA_G11_FILE = os.path.join(BASE_DIR, 'data', 'worksheets_g11.json')

def make_exercise(eid, level, points, ins, q, sol, rub):
    return {
        "id": eid,
        "level": level,
        "points": points,
        "instruction": ins,
        "question": q,
        "solution": sol,
        "rubric": rub
    }

def make_point(num, sheet_num, title, topic, obj, l1_ins, l1_q, l1_sol, l1_rub, l2_ins, l2_q, l2_sol, l2_rub):
    return {
        "pointNumber": num,
        "sheetNumber": f"{sheet_num} - ចំណុចទី {num}",
        "pointTitle": title,
        "topic": topic,
        "objective": obj,
        "totalPoints": 10,
        "exercises": [
            make_exercise("ex1", "កម្រិត ១ (ស្រួល / មូលដ្ឋានគ្រឹះ)", 5, l1_ins, l1_q, l1_sol, l1_rub),
            make_exercise("ex2", "កម្រិត ២ (មធ្យម / ការយល់ដឹង និងអនុវត្ត)", 5, l2_ins, l2_q, l2_sol, l2_rub)
        ]
    }

def make_sheet(s_num, lid, cid, l_title, ch_title, desc, points):
    return {
        "lessonId": lid,
        "courseId": cid,
        "sheetNumber": f"សន្លឹកកិច្ចការទី {s_num:02d}",
        "sheetNumberNum": s_num,
        "lessonTitle": l_title,
        "chapterTitle": ch_title,
        "topic": desc[:100] + ("..." if len(desc) > 100 else ""),
        "objective": f"ពង្រឹងសមត្ថភាពសិស្សលើ {l_title} តាមរយៈលំហាត់អនុវត្តន៍ជាក់ស្តែង",
        "totalPoints": 10,
        "totalPointsCount": len(points),
        "exercises": points[0]["exercises"] if points else [],
        "points": points
    }

print("Base generator template loaded.")
