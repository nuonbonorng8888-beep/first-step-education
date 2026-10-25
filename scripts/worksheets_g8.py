# -*- coding: utf-8 -*-
"""
Authentic MoEYS Grade 8 Worksheets Generator (18 Lessons)
Zero duplicate questions between points.
Mathematically precise according to MoEYS Standard Curriculum.
"""

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

def make_sheet(s_num, lid, l_title, ch_title, desc, points):
    return {
        "lessonId": lid,
        "courseId": "course-math-g8",
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

def get_grade8_worksheets():
    ws = {}
    from worksheets_g8_part_a import populate_g8_lessons_1_to_9
    from worksheets_g8_part_b import populate_g8_lessons_10_to_18

    populate_g8_lessons_1_to_9(ws, make_point, make_sheet)
    populate_g8_lessons_10_to_18(ws, make_point, make_sheet)

    return ws
