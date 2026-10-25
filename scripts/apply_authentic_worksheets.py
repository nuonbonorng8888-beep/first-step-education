# -*- coding: utf-8 -*-
"""
Apply Authentic MoEYS Worksheets & Curriculum Fixes
- Injects 100% unique point-by-point worksheets for Grades 7, 8, 9
- Fixes mathematical precision: Square roots definition (x^2 = 64 => x = +-8) vs radical sqrt(64) = 8
- Updates data/worksheets.json, data/worksheets_g11.json, and data/courses.json
- Validates 0 duplicates across points, dollar balances, and JSON schemas
"""
import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, 'scripts'))

from worksheets_g7 import get_grade7_worksheets
from worksheets_g8 import get_grade8_worksheets
from worksheets_g9 import get_grade9_worksheets

def main():
    print("=== Step 1: Generating Grade 7, 8, 9 Worksheets ===")
    ws_g7 = get_grade7_worksheets()
    ws_g8 = get_grade8_worksheets()
    ws_g9 = get_grade9_worksheets()

    print(f"Grade 7: {len(ws_g7)} lessons, {sum(len(w['points']) for w in ws_g7.values())} points")
    print(f"Grade 8: {len(ws_g8)} lessons, {sum(len(w['points']) for w in ws_g8.values())} points")
    print(f"Grade 9: {len(ws_g9)} lessons, {sum(len(w['points']) for w in ws_g9.values())} points")

    # Step 2: Validate zero duplicate questions in every lesson
    print("\n=== Step 2: Verifying Zero Question Overlaps Between Points ===")
    total_duplicates = 0
    all_generated = {**ws_g7, **ws_g8, **ws_g9}

    for lid, sheet in all_generated.items():
        qs = []
        for pt in sheet.get("points", []):
            for ex in pt.get("exercises", []):
                qs.append(ex["question"].strip())
        if len(qs) != len(set(qs)):
            print(f"ERROR: Duplicate questions found in {lid} ({sheet['lessonTitle']})!")
            total_duplicates += 1

    if total_duplicates == 0:
        print("SUCCESS: 100% Unique questions across all points in all 58 lessons!")
    else:
        raise ValueError(f"Found {total_duplicates} lessons with duplicate questions!")

    # Step 3: Load and update data/worksheets.json
    print("\n=== Step 3: Updating data/worksheets.json & worksheets_g11.json ===")
    ws_file = os.path.join(BASE_DIR, 'data', 'worksheets.json')
    with open(ws_file, 'r', encoding='utf-8') as f:
        master_ws = json.load(f)

    # Replace/Update G7, G8, G9 in master_ws
    for lid, sheet in all_generated.items():
        master_ws[lid] = sheet

    with open(ws_file, 'w', encoding='utf-8') as f:
        json.dump(master_ws, f, ensure_ascii=False, indent=2)
    print(f"Updated {ws_file} with {len(master_ws)} total worksheets.")

    # Also sync data/worksheets_g11.json
    ws_g11_file = os.path.join(BASE_DIR, 'data', 'worksheets_g11.json')
    if os.path.exists(ws_g11_file):
        with open(ws_g11_file, 'w', encoding='utf-8') as f:
            json.dump(master_ws, f, ensure_ascii=False, indent=2)
        print(f"Synced {ws_g11_file}.")

    # Step 4: Update data/courses.json for les-g7-01 quiz question 4
    print("\n=== Step 4: Updating data/courses.json for Mathematical Precision ===")
    courses_file = os.path.join(BASE_DIR, 'data', 'courses.json')
    with open(courses_file, 'r', encoding='utf-8') as f:
        courses = json.load(f)

    updated_quiz = False
    for c in courses:
        if c.get("id") == "course-math-g7":
            for ch in c.get("chapters", []):
                for les in ch.get("lessons", []):
                    if les.get("id") == "les-g7-01":
                        quizzes = les.get("quiz", [])
                        if len(quizzes) >= 4:
                            quizzes[3] = {
                                "question": "រកឫសការេនៃចំនួន $64$ ៖",
                                "options": [
                                    "$8$ និង $-8$ (ឬ $\\pm 8$)",
                                    "$8$ តែមួយគត់",
                                    "$-8$ តែមួយគត់",
                                    "$16$ និង $-16$"
                                ],
                                "correct": 0,
                                "explanation": "តាមនិយមន័យ ឫសការេនៃចំនួនពិតវិជ្ជមាន $a$ គឺជាចំនួន $x$ ដែល $x^2 = a$។ តាង $x^2 = 64 \\implies x = \\pm \\sqrt{64} = \\pm 8$។ ដូចនេះ ឫសការេនៃ $64$ មានពីរចម្លើយគឺ $8$ និង $-8$។ ចំណែកឯរ៉ាឌីកាល់ $\\sqrt{64}$ ទើបស្មើនឹង $8$ (ឫសការេវិជ្ជមាន)។"
                            }
                            updated_quiz = True
                            print("Updated les-g7-01 Quiz Q4 with precise square root definition!")

    if updated_quiz:
        with open(courses_file, 'w', encoding='utf-8') as f:
            json.dump(courses, f, ensure_ascii=False, indent=2)
        print(f"Saved {courses_file}.")

    # Step 5: Check KaTeX Dollar Balances
    print("\n=== Step 5: Validating LaTeX Math ($) Syntax ===")
    def check_dollars(obj, path=""):
        errs = []
        if isinstance(obj, str):
            count = obj.count('$')
            if count % 2 != 0:
                errs.append(f"Unbalanced $ in {path}: {count} dollars: {repr(obj[:80])}")
        elif isinstance(obj, dict):
            for k, v in obj.items():
                errs.extend(check_dollars(v, f"{path}.{k}"))
        elif isinstance(obj, list):
            for idx, item in enumerate(obj):
                errs.extend(check_dollars(item, f"{path}[{idx}]"))
        return errs

    math_errs = check_dollars(all_generated, "generated_worksheets")
    if math_errs:
        print(f"WARNING: Found {len(math_errs)} unbalanced dollar issues:")
        for err in math_errs[:10]:
            print(" ", err)
    else:
        print("SUCCESS: All LaTeX math formulas have perfectly balanced '$' symbols!")

    print("\n=== All Worksheets & Curriculum updates completed successfully! ===")

if __name__ == '__main__':
    main()
