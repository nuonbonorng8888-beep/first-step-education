# -*- coding: utf-8 -*-
"""
Master Application Script:
Applies the official MoEYS standard textbook curriculum to Grade 7, 8, and 9:
- 22 Lessons for Grade 7 (4 Chapters)
- 18 Lessons for Grade 8 (4 Chapters)
- 18 Lessons for Grade 9 (4 Chapters)
- Sliced PDF files attached to every lesson
- Rich point-by-point learning objectives
- 290 high quality KaTeX-formatted quiz questions
- 58 interactive point-by-point worksheets
"""
import os
import sys
import json
import shutil

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(BASE_DIR, 'scripts'))

from generate_official_g7 import get_g7_chapters
from generate_official_g8 import get_g8_chapters
from generate_official_g9 import get_g9_chapters
from generate_official_worksheets import build_worksheets

COURSES_PATH = os.path.join(BASE_DIR, 'data', 'courses.json')
COURSES_BAK = os.path.join(BASE_DIR, 'data', 'courses.json.bak_g789')
WS_PATH = os.path.join(BASE_DIR, 'data', 'worksheets.json')
WS_BAK = os.path.join(BASE_DIR, 'data', 'worksheets.json.bak_g789')
WS_G11_PATH = os.path.join(BASE_DIR, 'data', 'worksheets_g11.json')

def main():
    print("==================================================================")
    print("Applying Official MoEYS Curriculum for Grade 7, 8, and 9")
    print("==================================================================")

    # 1. Backups
    if not os.path.exists(COURSES_BAK):
        shutil.copyfile(COURSES_PATH, COURSES_BAK)
        print(f"Backed up courses.json -> {COURSES_BAK}")
    if not os.path.exists(WS_BAK):
        shutil.copyfile(WS_PATH, WS_BAK)
        print(f"Backed up worksheets.json -> {WS_BAK}")

    # 2. Generate Chapters
    g7_chapters = get_g7_chapters(BASE_DIR)
    g8_chapters = get_g8_chapters(BASE_DIR)
    g9_chapters = get_g9_chapters(BASE_DIR)
    worksheets = build_worksheets(BASE_DIR)

    # 3. Update courses.json
    with open(COURSES_PATH, 'r', encoding='utf-8') as f:
        courses = json.load(f)

    for c in courses:
        cid = c.get('id')
        if cid == 'course-math-g7':
            print("\nUpdating course-math-g7...")
            c['title'] = "គណិតវិទ្យា ថ្នាក់ទី ៧ (កម្រិតអនុវិទ្យាល័យ)"
            c['description'] = "កម្មវិធីសិក្សាគណិតវិទ្យាថ្នាក់ទី ៧ ស្តង់ដាជាតិក្រសួងអប់រំ យុវជន និងកីឡា (២២ មេរៀនពេញលេញ) ៖ ចំនួនគត់ តួចែកនិងពហុគុណ ចំនួនគត់រ៉ឺឡាទីប ប្រភាគ ចំនួនទសភាគ ភាគរយ រង្វាស់រង្វាល់ កន្សោមពីជគណិត សមីការ វិសមភាព សមាមាត្រ ធរណីមាត្រ មុំ បន្ទាត់ស្រប/កែង បរិមាត្រ/ផ្ទៃក្រឡា រង្វង់ សូលីត ភាពឆ្លុះ ប្រូបាប និងក្រាបស្ថិតិ។"
            c['chapters'] = g7_chapters
            c['totalLessons'] = sum(len(ch['lessons']) for ch in g7_chapters)
            c['totalFiles'] = sum(sum(len(l.get('files', [])) for l in ch['lessons']) for ch in g7_chapters)
            print(f"  G7: {len(g7_chapters)} chapters, {c['totalLessons']} lessons, {c['totalFiles']} files")

        elif cid == 'course-math-g8':
            print("\nUpdating course-math-g8...")
            c['title'] = "គណិតវិទ្យា ថ្នាក់ទី ៨ (កម្រិតអនុវិទ្យាល័យ)"
            c['description'] = "កម្មវិធីសិក្សាគណិតវិទ្យាថ្នាក់ទី ៨ ស្តង់ដាជាតិក្រសួងអប់រំ យុវជន និងកីឡា (១៨ មេរៀនពេញលេញ) ៖ ចំនួនសនិទាន ស្វ័យគុណ ទំហំសមាមាត្រនិងភាគរយ រង្វាស់រង្វាល់ កន្សោមពីជគណិត កន្សោមសនិទាន សមីការ វិសមីការ ប្លង់កូអរដោនេ ស្ថិតិ ប្រូបាប ការប្រៀបធៀបត្រីកោណ ចតុកោណ ផ្ទៃក្រឡាពហុកោណ រង្វង់ បន្ទាត់ពិសេសក្នុងត្រីកោណ សូលីត និងមាត្រដ្ឋាន។"
            c['chapters'] = g8_chapters
            c['totalLessons'] = sum(len(ch['lessons']) for ch in g8_chapters)
            c['totalFiles'] = sum(sum(len(l.get('files', [])) for l in ch['lessons']) for ch in g8_chapters)
            print(f"  G8: {len(g8_chapters)} chapters, {c['totalLessons']} lessons, {c['totalFiles']} files")

        elif cid == 'course-math-g9':
            print("\nUpdating course-math-g9...")
            c['title'] = "គណិតវិទ្យា ថ្នាក់ទី ៩ (ត្រៀមប្រឡងឌីប្លូម)"
            c['description'] = "កម្មវិធីសិក្សាគណិតវិទ្យាថ្នាក់ទី ៩ ស្តង់ដាជាតិក្រសួងអប់រំ យុវជន និងកីឡា (១៨ មេរៀនពេញលេញ ត្រៀមប្រឡងឌីប្លូម) ៖ ចំនួនអសនិទាន សមាមាត្រ កន្សោមពីជគណិតគូប សមីការ/វិសមីការ បំណែងចែកប្រេកង់ មធ្យមស្ថិតិ ប្រូបាប ចម្ងាយរវាងពីរចំណុច សមីការនៃបន្ទាត់ ប្រព័ន្ធសមីការដឺក្រេទី១មានពីរអញ្ញាត ទ្រឹស្តីបទពីតាក័រ រង្វង់និងបន្ទាត់ មុំក្នុងរង្វង់ ទ្រឹស្តីបទតាឡែស ត្រីកោណដូចគ្នា ពហុកោណ និងសូលីត។"
            c['chapters'] = g9_chapters
            c['totalLessons'] = sum(len(ch['lessons']) for ch in g9_chapters)
            c['totalFiles'] = sum(sum(len(l.get('files', [])) for l in ch['lessons']) for ch in g9_chapters)
            print(f"  G9: {len(g9_chapters)} chapters, {c['totalLessons']} lessons, {c['totalFiles']} files")

    with open(COURSES_PATH, 'w', encoding='utf-8') as f:
        json.dump(courses, f, ensure_ascii=False, indent=2)
    print("\nSaved courses.json successfully!")

    # 4. Update worksheets.json & worksheets_g11.json
    print("\nUpdating worksheets.json and worksheets_g11.json...")
    with open(WS_PATH, 'r', encoding='utf-8') as f:
        ws_data = json.load(f)

    # Remove old dummy keys
    old_dummy = [f"les-g{g}-{i:02d}" for g in [7, 8, 9] for i in range(1, 10)]
    for k in old_dummy:
        if k in ws_data:
            del ws_data[k]

    # Insert all 58 new worksheets
    for k, sheet in worksheets.items():
        ws_data[k] = sheet

    with open(WS_PATH, 'w', encoding='utf-8') as f:
        json.dump(ws_data, f, ensure_ascii=False, indent=2)

    with open(WS_G11_PATH, 'w', encoding='utf-8') as f:
        json.dump(ws_data, f, ensure_ascii=False, indent=2)

    print(f"Saved worksheets ({len(ws_data)} total entries across all grades)!")

    # 5. Validation Check
    print("\nRunning comprehensive validation...")
    total_q = 0
    total_files = 0
    missing_files = []

    for c in courses:
        for ch in c.get('chapters', []):
            for les in ch.get('lessons', []):
                for q in les.get('quiz', []):
                    total_q += 1
                    assert len(q.get('options', [])) == 4, f"Options != 4 in {les['id']}"
                    for text in [q['question'], q['explanation']] + q['options']:
                        count_d = text.count('$')
                        assert count_d % 2 == 0, f"Unbalanced dollar ({count_d}) in {les['id']}: {text}"
                for f in les.get('files', []):
                    total_files += 1
                    disk_path = os.path.join(BASE_DIR, f['fileUrl'].replace('/', os.sep))
                    if not os.path.exists(disk_path):
                        missing_files.append(disk_path)

    if missing_files:
        print(f"WARNING: {len(missing_files)} missing files!")
        for mf in missing_files[:5]:
            print(f"  Missing: {mf}")
    else:
        print(f"All {total_files} PDF files exist on disk in uploads/pdfs/!")

    print(f"Total questions validated across entire database: {total_q}")
    print("SUCCESS: Grade 7, 8, and 9 curriculum fully updated to official MoEYS standard textbooks!")

if __name__ == '__main__':
    main()
