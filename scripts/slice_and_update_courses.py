import os
import sys
import json
import shutil
import pymupdf

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COURSES_PATH = os.path.join(BASE_DIR, 'data', 'courses.json')
COURSES_BAK = os.path.join(BASE_DIR, 'data', 'courses.json.bak')
PDF_OUT_DIR = os.path.join(BASE_DIR, 'uploads', 'pdfs')

os.makedirs(PDF_OUT_DIR, exist_ok=True)

# Helper for Khmer numerals
def to_khmer_num(n):
    kh_digits = "០១២៣៤៥៦៧៨៩"
    return "".join(kh_digits[int(d)] if d.isdigit() else d for d in str(n))

def format_size(size_bytes):
    if size_bytes >= 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / 1024:.1f} KB"

# Basic Math Lesson Definitions (Book Page is 1-indexed, PDF 0-index = bp + 4)
BASIC_LESSONS = [
    # Chapter 1
    {"id": "les-g11b-1-1", "title_kh": "មេរៀនទី ១ ៖ ស្វ៊ីតចំនួនពិត", "bp_start": 1, "bp_end": 9, "file_name": "g11b_ch1_les1.pdf"},
    {"id": "les-g11b-1-2", "title_kh": "មេរៀនទី ២ ៖ ស្វ៊ីតនព្វន្ត", "bp_start": 10, "bp_end": 15, "file_name": "g11b_ch1_les2.pdf"},
    {"id": "les-g11b-1-3", "title_kh": "មេរៀនទី ៣ ៖ ស្វ៊ីតធរណីមាត្រ", "bp_start": 16, "bp_end": 26, "file_name": "g11b_ch1_les3.pdf"},
    # Chapter 2
    {"id": "les-g11b-2-1", "title_kh": "មេរៀនទី ១ ៖ អនុគមន៍អិចស្ប៉ូណង់ស្យែល", "bp_start": 27, "bp_end": 47, "file_name": "g11b_ch2_les1.pdf"},
    {"id": "les-g11b-2-2", "title_kh": "មេរៀនទី ២ ៖ អនុគមន៍លោការីត", "bp_start": 48, "bp_end": 66, "file_name": "g11b_ch2_les2.pdf"},
    # Chapter 3
    {"id": "les-g11b-3-1", "title_kh": "មេរៀនទី ១ ៖ អនុគមន៍ត្រីកោណមាត្រ", "bp_start": 67, "bp_end": 87, "file_name": "g11b_ch3_les1.pdf"},
    {"id": "les-g11b-3-2", "title_kh": "មេរៀនទី ២ ៖ រូបមន្តត្រីកោណមាត្រ", "bp_start": 88, "bp_end": 97, "file_name": "g11b_ch3_les2.pdf"},
    {"id": "les-g11b-3-3", "title_kh": "មេរៀនទី ៣ ៖ សមីការ និងវិសមីការត្រីកោណមាត្រ", "bp_start": 98, "bp_end": 112, "file_name": "g11b_ch3_les3.pdf"},
    # Chapter 4
    {"id": "les-g11b-4-1", "title_kh": "មេរៀនទី ១ ៖ ម៉ាទ្រីស", "bp_start": 113, "bp_end": 129, "file_name": "g11b_ch4_les1.pdf"},
    {"id": "les-g11b-4-2", "title_kh": "មេរៀនទី ២ ៖ ដេទែរមីណង់", "bp_start": 130, "bp_end": 138, "file_name": "g11b_ch4_les2.pdf"},
    # Chapter 5
    {"id": "les-g11b-5-1", "title_kh": "មេរៀនទី ១ ៖ លីមីតនៃអនុគមន៍", "bp_start": 139, "bp_end": 148, "file_name": "g11b_ch5_les1.pdf"},
    {"id": "les-g11b-5-2", "title_kh": "មេរៀនទី ២ ៖ ដេរីវេនៃអនុគមន៍", "bp_start": 149, "bp_end": 159, "file_name": "g11b_ch5_les2.pdf"},
    {"id": "les-g11b-5-3", "title_kh": "មេរៀនទី ៣ ៖ អនុវត្តន៍នៃដេរីវេ", "bp_start": 160, "bp_end": 173, "file_name": "g11b_ch5_les3.pdf"},
    {"id": "les-g11b-5-4", "title_kh": "មេរៀនទី ៤ ៖ អថិរភាព និងក្រាបនៃអនុគមន៍", "bp_start": 174, "bp_end": 196, "file_name": "g11b_ch5_les4.pdf"},
    # Chapter 6
    {"id": "les-g11b-6-1", "title_kh": "មេរៀនទី ១ ៖ ប្រូបាប", "bp_start": 197, "bp_end": 218, "file_name": "g11b_ch6_les1.pdf"},
    # Chapter 7
    {"id": "les-g11b-7-1", "title_kh": "មេរៀនទី ១ ៖ ការបែងចែកទិន្នន័យជាភាគរយ", "bp_start": 219, "bp_end": 227, "file_name": "g11b_ch7_les1.pdf"},
    {"id": "les-g11b-7-2", "title_kh": "មេរៀនទី ២ ៖ រង្វាស់នៃគម្លាត", "bp_start": 228, "bp_end": 237, "file_name": "g11b_ch7_les2.pdf"},
    {"id": "les-g11b-7-3", "title_kh": "មេរៀនទី ៣ ៖ គំនូសតាងបំណែងចែក និងបំណែងចែកណ័រម៉ាល់", "bp_start": 238, "bp_end": 246, "file_name": "g11b_ch7_les3.pdf"},
]

# Advanced Math Lesson Definitions
ADV_LESSONS = [
    # Chapter 1
    {"id": "les-g11a-1-1", "title_kh": "មេរៀនទី ១ ៖ ផលបូកតួនៃស្វ៊ីតផ្សេងៗ", "bp_start": 1, "bp_end": 15, "file_name": "g11a_ch1_les1.pdf"},
    {"id": "les-g11a-1-2", "title_kh": "មេរៀនទី ២ ៖ ទំនាក់ទំនងតួនៃស្វ៊ីត", "bp_start": 16, "bp_end": 23, "file_name": "g11a_ch1_les2.pdf"},
    {"id": "les-g11a-1-3", "title_kh": "មេរៀនទី ៣ ៖ វិធានអនុមានរួមគណិតវិទ្យា", "bp_start": 24, "bp_end": 34, "file_name": "g11a_ch1_les3.pdf"},
    # Chapter 2
    {"id": "les-g11a-2-1", "title_kh": "មេរៀនទី ១ ៖ អនុគមន៍អិចស្ប៉ូណង់ស្យែល", "bp_start": 35, "bp_end": 45, "file_name": "g11a_ch2_les1.pdf"},
    {"id": "les-g11a-2-2", "title_kh": "មេរៀនទី ២ ៖ អនុគមន៍លោការីត", "bp_start": 46, "bp_end": 56, "file_name": "g11a_ch2_les2.pdf"},
    # Chapter 3
    {"id": "les-g11a-3-1", "title_kh": "មេរៀនទី ១ ៖ សមីការ និងវិសមីការត្រីកោណមាត្រ", "bp_start": 57, "bp_end": 72, "file_name": "g11a_ch3_les1.pdf"},
    # Chapter 4
    {"id": "les-g11a-4-1", "title_kh": "មេរៀនទី ១ ៖ បំលែងលីនេអ៊ែរ", "bp_start": 73, "bp_end": 102, "file_name": "g11a_ch4_les1.pdf"},
    # Chapter 5
    {"id": "les-g11a-5-1", "title_kh": "មេរៀនទី ១ ៖ អនុវត្តន៍ដេរីវេចំពោះសមីការ និងវិសមីការ", "bp_start": 103, "bp_end": 116, "file_name": "g11a_ch5_les1.pdf"},
    # Chapter 6
    {"id": "les-g11a-6-1", "title_kh": "មេរៀនទី ១ ៖ ប្រូបាបមានលក្ខខណ្ឌ", "bp_start": 117, "bp_end": 134, "file_name": "g11a_ch6_les1.pdf"},
    # Chapter 7
    {"id": "les-g11a-7-1", "title_kh": "មេរៀនទី ១ ៖ ចំនួនកុំផ្លិចទម្រង់ពីជគណិត", "bp_start": 135, "bp_end": 143, "file_name": "g11a_ch7_les1.pdf"},
    {"id": "les-g11a-7-2", "title_kh": "មេរៀនទី ២ ៖ ចំនួនកុំផ្លិចទម្រង់ត្រីកោណមាត្រ", "bp_start": 144, "bp_end": 163, "file_name": "g11a_ch7_les2.pdf"},
    {"id": "les-g11a-7-3", "title_kh": "មេរៀនទី ៣ ៖ ស្វ័យគុណទី n និងឫសទី n នៃចំនួនកុំផ្លិច", "bp_start": 164, "bp_end": 173, "file_name": "g11a_ch7_les3.pdf"},
    {"id": "les-g11a-7-4", "title_kh": "មេរៀនទី ៤ ៖ អនុវត្តន៍ចំនួនកុំផ្លិចក្នុងធរណីមាត្រ", "bp_start": 174, "bp_end": 188, "file_name": "g11a_ch7_les4.pdf"},
    # Chapter 8
    {"id": "les-g11a-8-1", "title_kh": "មេរៀនទី ១ ៖ វ៉ិចទ័រក្នុងលំហ", "bp_start": 189, "bp_end": 215, "file_name": "g11a_ch8_les1.pdf"},
    {"id": "les-g11a-8-2", "title_kh": "មេរៀនទី ២ ៖ សមីការបន្ទាត់ និងសមីការប្លង់ក្នុងលំហ", "bp_start": 216, "bp_end": 234, "file_name": "g11a_ch8_les2.pdf"},
]

def slice_course(course_pdf_name, lessons_def, course_label):
    pdf_full_path = os.path.join(BASE_DIR, course_pdf_name)
    print(f"\nProcessing {course_label} from {course_pdf_name}...")
    src_doc = pymupdf.open(pdf_full_path)
    total_doc_pages = len(src_doc)
    print(f"Source PDF total pages: {total_doc_pages}")

    results = {}

    for item in lessons_def:
        bp_s = item["bp_start"]
        bp_e = item["bp_end"]
        # PDF 0-indexed page is bp + 4
        from_page = bp_s + 4
        to_page = bp_e + 4

        # Bounds check
        from_page = max(0, min(from_page, total_doc_pages - 1))
        to_page = max(0, min(to_page, total_doc_pages - 1))

        out_doc = pymupdf.open()
        out_doc.insert_pdf(src_doc, from_page=from_page, to_page=to_page)
        
        target_path = os.path.join(PDF_OUT_DIR, item["file_name"])
        out_doc.save(target_path)
        page_count = len(out_doc)
        out_doc.close()

        size_bytes = os.path.getsize(target_path)
        human_size = format_size(size_bytes)

        kh_start = to_khmer_num(bp_s)
        kh_end = to_khmer_num(bp_e)
        display_title = f"{item['title_kh']} (ទំព័រ {kh_start} - {kh_end})"
        doc_display_name = f"{item['title_kh']} (ទំព័រ {kh_start} - {kh_end}).pdf"

        results[item["id"]] = {
            "id": f"file-{item['id']}",
            "name": doc_display_name,
            "fileName": item["file_name"],
            "fileUrl": f"uploads/pdfs/{item['file_name']}",
            "fileType": "pdf",
            "fileSize": human_size,
            "uploadedAt": "2026-10-15",
            "page_count": page_count,
            "display_title": display_title
        }

        print(f"  [OK] {item['id']} -> {item['file_name']} ({page_count} pages, {human_size})")

    src_doc.close()
    return results

def main():
    # 1. Backup courses.json
    if not os.path.exists(COURSES_BAK):
        shutil.copyfile(COURSES_PATH, COURSES_BAK)
        print(f"Backed up courses.json -> {COURSES_BAK}")

    # 2. Slice Basic Math
    basic_results = slice_course('ថ្នាក់ទី១១៖_គណិតវិទ្យា_កម្រិតមូលដ្ឋាន.pdf', BASIC_LESSONS, 'គណិតវិទ្យា កម្រិតមូលដ្ឋាន (G11 Basic)')

    # 3. Slice Advanced Math
    adv_results = slice_course('ថ្នាក់ទី១១៖_គណិតវិទ្យា_កម្រិតខ្ពស់.pdf', ADV_LESSONS, 'គណិតវិទ្យា កម្រិតខ្ពស់ (G11 Advanced)')

    # 4. Update courses.json
    with open(COURSES_PATH, 'r', encoding='utf-8') as f:
        courses = json.load(f)

    for c in courses:
        cid = c.get('id')
        if cid == 'course-math-g11-basic':
            print("\nUpdating course-math-g11-basic in courses.json...")
            for ch in c.get('chapters', []):
                for les in ch.get('lessons', []):
                    lid = les.get('id')
                    if lid in basic_results:
                        res = basic_results[lid]
                        les['title'] = res['display_title']
                        les['files'] = [{
                            "id": res["id"],
                            "name": res["name"],
                            "fileName": res["fileName"],
                            "fileUrl": res["fileUrl"],
                            "fileType": res["fileType"],
                            "fileSize": res["fileSize"],
                            "uploadedAt": res["uploadedAt"]
                        }]
            c['totalLessons'] = sum(len(ch.get('lessons', [])) for ch in c.get('chapters', []))
            c['totalFiles'] = sum(sum(len(l.get('files', [])) for l in ch.get('lessons', [])) for ch in c.get('chapters', []))
            print(f"course-math-g11-basic updated: totalLessons={c['totalLessons']}, totalFiles={c['totalFiles']}")

        elif cid == 'course-math-g11-advanced':
            print("\nUpdating course-math-g11-advanced in courses.json...")
            for ch in c.get('chapters', []):
                for les in ch.get('lessons', []):
                    lid = les.get('id')
                    if lid in adv_results:
                        res = adv_results[lid]
                        les['title'] = res['display_title']
                        les['files'] = [{
                            "id": res["id"],
                            "name": res["name"],
                            "fileName": res["fileName"],
                            "fileUrl": res["fileUrl"],
                            "fileType": res["fileType"],
                            "fileSize": res["fileSize"],
                            "uploadedAt": res["uploadedAt"]
                        }]
            c['totalLessons'] = sum(len(ch.get('lessons', [])) for ch in c.get('chapters', []))
            c['totalFiles'] = sum(sum(len(l.get('files', [])) for l in ch.get('lessons', [])) for ch in c.get('chapters', []))
            print(f"course-math-g11-advanced updated: totalLessons={c['totalLessons']}, totalFiles={c['totalFiles']}")

    with open(COURSES_PATH, 'w', encoding='utf-8') as f:
        json.dump(courses, f, ensure_ascii=False, indent=2)

    print("\nSuccessfully updated courses.json with all sliced PDFs!")

if __name__ == '__main__':
    main()
