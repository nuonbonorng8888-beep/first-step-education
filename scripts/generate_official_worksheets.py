# -*- coding: utf-8 -*-
"""
Generate comprehensive worksheets for all lessons in Grade 7, 8, 9
"""
import os
import sys

from generate_official_g7 import get_g7_chapters
from generate_official_g8 import get_g8_chapters
from generate_official_g9 import get_g9_chapters

def build_worksheets(base_dir):
    worksheets = {}

    configs = [
        (7, "course-math-g7", get_g7_chapters(base_dir)),
        (8, "course-math-g8", get_g8_chapters(base_dir)),
        (9, "course-math-g9", get_g9_chapters(base_dir))
    ]

    for grade, course_id, chapters in configs:
        sheet_counter = 1
        for ch in chapters:
            ch_title = ch["title"]
            for les in ch["lessons"]:
                lid = les["id"]
                title = les["title"]
                points = les.get("points", [])
                quizzes = les.get("quiz", [])

                ws_points = []
                for p_idx, pt in enumerate(points):
                    p_num = pt["number"]
                    p_title = pt["title"]
                    p_topic = pt["topic"]

                    # Pick quiz questions to derive exercises
                    q1 = quizzes[p_idx % len(quizzes)] if quizzes else None
                    q2 = quizzes[(p_idx + 1) % len(quizzes)] if len(quizzes) > 1 else q1

                    ex1_q = q1["question"] if q1 else f"អនុវត្តន៍គណនាលំហាត់មូលដ្ឋានលើ {p_topic}"
                    ex1_sol = q1["explanation"] if q1 else "អនុវត្តតាមរូបមន្ត និងទ្រឹស្តីបទមេរៀន។"

                    ex2_q = q2["question"] if q2 else f"ដោះស្រាយចំណោទអនុវត្តន៍លើ {p_topic}"
                    ex2_sol = q2["explanation"] if q2 else "អនុវត្តតាមវិធីសាស្ត្រដោះស្រាយលំហាត់។"

                    ws_points.append({
                        "pointNumber": p_num,
                        "sheetNumber": f"សន្លឹកកិច្ចការទី {sheet_counter:02d} - ចំណុចទី {p_num}",
                        "pointTitle": p_title,
                        "topic": p_topic,
                        "objective": f"យល់ដឹងច្បាស់ និងចេះអនុវត្តដោះស្រាយលំហាត់ទាក់ទងនឹង {p_topic}",
                        "totalPoints": 10,
                        "exercises": [
                            {
                                "id": f"ex-{p_num}-1",
                                "level": "កម្រិត ១ (ស្រួល / មូលដ្ឋានគ្រឹះ)",
                                "points": 5,
                                "instruction": f"ចូរដោះស្រាយលំហាត់គ្រឹះខាងក្រោម ៖",
                                "question": ex1_q,
                                "solution": ex1_sol,
                                "rubric": "សរសេរជំហានដោះស្រាយ និងចម្លើយត្រឹមត្រូវ (៥ ពិន្ទុ)"
                            },
                            {
                                "id": f"ex-{p_num}-2",
                                "level": "កម្រិត ២ (មធ្យម / អនុវត្តន៍)",
                                "points": 5,
                                "instruction": f"ចូរដោះស្រាយលំហាត់អនុវត្តន៍ខាងក្រោម ៖",
                                "question": ex2_q,
                                "solution": ex2_sol,
                                "rubric": "សរសេរជំហានដោះស្រាយ និងចម្លើយត្រឹមត្រូវ (៥ ពិន្ទុ)"
                            }
                        ]
                    })

                # Top-level exercises (from first point)
                top_exercises = ws_points[0]["exercises"] if ws_points else []

                worksheets[lid] = {
                    "lessonId": lid,
                    "courseId": course_id,
                    "sheetNumber": f"សន្លឹកកិច្ចការទី {sheet_counter:02d}",
                    "sheetNumberNum": sheet_counter,
                    "lessonTitle": title,
                    "chapterTitle": ch_title,
                    "topic": les["description"][:100] + "...",
                    "objective": f"ពង្រឹងសមត្ថភាពសិស្សលើ {title} តាមរយៈលំហាត់អនុវត្តន៍ជាក់ស្តែង",
                    "totalPoints": 10,
                    "totalPointsCount": len(ws_points),
                    "exercises": top_exercises,
                    "points": ws_points
                }

                sheet_counter += 1

    return worksheets

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ws = build_worksheets(base_dir)
    print(f"Generated {len(ws)} worksheets for Grade 7, 8, and 9.")
