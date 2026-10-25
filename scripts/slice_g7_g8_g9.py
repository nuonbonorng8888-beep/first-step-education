# -*- coding: utf-8 -*-
import os
import sys
import pymupdf

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_OUT_DIR = os.path.join(BASE_DIR, 'uploads', 'pdfs')
os.makedirs(PDF_OUT_DIR, exist_ok=True)

G7_LESSONS = [
    {"num": 1, "title": "មេរៀនទី ១ ៖ ចំនួនគត់", "bp_s": 1, "bp_e": 14, "file": "g7_les01.pdf"},
    {"num": 2, "title": "មេរៀនទី ២ ៖ តួចែកនិងពហុគុណ", "bp_s": 15, "bp_e": 24, "file": "g7_les02.pdf"},
    {"num": 3, "title": "មេរៀនទី ៣ ៖ ចំនួនគត់រ៉ឺឡាទីប", "bp_s": 25, "bp_e": 40, "file": "g7_les03.pdf"},
    {"num": 4, "title": "មេរៀនទី ៤ ៖ ប្រភាគ", "bp_s": 41, "bp_e": 52, "file": "g7_les04.pdf"},
    {"num": 5, "title": "មេរៀនទី ៥ ៖ ចំនួនទសភាគ", "bp_s": 53, "bp_e": 62, "file": "g7_les05.pdf"},
    {"num": 6, "title": "មេរៀនទី ៦ ៖ ភាគរយ", "bp_s": 63, "bp_e": 72, "file": "g7_les06.pdf"},
    {"num": 7, "title": "មេរៀនទី ៧ ៖ រង្វាស់រង្វាល់", "bp_s": 73, "bp_e": 80, "file": "g7_les07.pdf"},
    {"num": 8, "title": "មេរៀនទី ៨ ៖ កន្សោមពីជគណិត", "bp_s": 81, "bp_e": 90, "file": "g7_les08.pdf"},
    {"num": 9, "title": "មេរៀនទី ៩ ៖ សមីការដឺក្រេទីមួយមានមួយអញ្ញាត", "bp_s": 91, "bp_e": 100, "file": "g7_les09.pdf"},
    {"num": 10, "title": "មេរៀនទី ១០ ៖ វិសមភាព", "bp_s": 101, "bp_e": 106, "file": "g7_les10.pdf"},
    {"num": 11, "title": "មេរៀនទី ១១ ៖ ផលធៀបនិងសមាមាត្រ", "bp_s": 107, "bp_e": 116, "file": "g7_les11.pdf"},
    {"num": 12, "title": "មេរៀនទី ១២ ៖ សញ្ញាណដំបូងនៃរូបធរណីមាត្រ", "bp_s": 117, "bp_e": 126, "file": "g7_les12.pdf"},
    {"num": 13, "title": "មេរៀនទី ១៣ ៖ មុំ", "bp_s": 127, "bp_e": 138, "file": "g7_les13.pdf"},
    {"num": 14, "title": "មេរៀនទី ១៤ ៖ បន្ទាត់ស្រប បន្ទាត់កែង", "bp_s": 139, "bp_e": 150, "file": "g7_les14.pdf"},
    {"num": 15, "title": "មេរៀនទី ១៥ ៖ រូបធរណីមាត្រដែលមានវិមាត្រពីរ", "bp_s": 151, "bp_e": 166, "file": "g7_les15.pdf"},
    {"num": 16, "title": "មេរៀនទី ១៦ ៖ បរិមាត្រនិងផ្ទៃក្រឡាពហុកោណ", "bp_s": 167, "bp_e": 176, "file": "g7_les16.pdf"},
    {"num": 17, "title": "មេរៀនទី ១៧ ៖ រង្វង់", "bp_s": 177, "bp_e": 184, "file": "g7_les17.pdf"},
    {"num": 18, "title": "មេរៀនទី ១៨ ៖ មាឌនិងផ្ទៃក្រឡាខាងនៃសូលីត", "bp_s": 185, "bp_e": 192, "file": "g7_les18.pdf"},
    {"num": 19, "title": "មេរៀនទី ១៩ ៖ ភាពឆ្លុះ", "bp_s": 193, "bp_e": 200, "file": "g7_les19.pdf"},
    {"num": 20, "title": "មេរៀនទី ២០ ៖ ប្រូបាប", "bp_s": 201, "bp_e": 208, "file": "g7_les20.pdf"},
    {"num": 21, "title": "មេរៀនទី ២១ ៖ ក្រាបសសរ", "bp_s": 209, "bp_e": 216, "file": "g7_les21.pdf"},
    {"num": 22, "title": "មេរៀនទី ២២ ៖ ក្រាបផ្លិត", "bp_s": 217, "bp_e": 220, "file": "g7_les22.pdf"},
]

G8_LESSONS = [
    {"num": 1, "title": "មេរៀនទី ១ ៖ ចំនួនសនិទាន", "bp_s": 1, "bp_e": 12, "file": "g8_les01.pdf"},
    {"num": 2, "title": "មេរៀនទី ២ ៖ ស្វ័យគុណ", "bp_s": 13, "bp_e": 26, "file": "g8_les02.pdf"},
    {"num": 3, "title": "មេរៀនទី ៣ ៖ ទំហំសមាមាត្រនិងភាគរយ", "bp_s": 27, "bp_e": 42, "file": "g8_les03.pdf"},
    {"num": 4, "title": "មេរៀនទី ៤ ៖ រង្វាស់រង្វាល់", "bp_s": 43, "bp_e": 50, "file": "g8_les04.pdf"},
    {"num": 5, "title": "មេរៀនទី ៥ ៖ កន្សោមពីជគណិត", "bp_s": 51, "bp_e": 74, "file": "g8_les05.pdf"},
    {"num": 6, "title": "មេរៀនទី ៦ ៖ កន្សោមសនិទាន", "bp_s": 75, "bp_e": 88, "file": "g8_les06.pdf"},
    {"num": 7, "title": "មេរៀនទី ៧ ៖ សមីការដឺក្រេទី១មានមួយអញ្ញាត", "bp_s": 89, "bp_e": 102, "file": "g8_les07.pdf"},
    {"num": 8, "title": "មេរៀនទី ៨ ៖ វិសមីការដឺក្រេទី១មានមួយអញ្ញាត", "bp_s": 103, "bp_e": 114, "file": "g8_les08.pdf"},
    {"num": 9, "title": "មេរៀនទី ៩ ៖ ប្លង់កូអរដោនេនិងក្រាប", "bp_s": 115, "bp_e": 122, "file": "g8_les09.pdf"},
    {"num": 10, "title": "មេរៀនទី ១០ ៖ ស្ថិតិ", "bp_s": 123, "bp_e": 140, "file": "g8_les10.pdf"},
    {"num": 11, "title": "មេរៀនទី ១១ ៖ ប្រូបាប", "bp_s": 141, "bp_e": 146, "file": "g8_les11.pdf"},
    {"num": 12, "title": "មេរៀនទី ១២ ៖ ការប្រៀបធៀបត្រីកោណ", "bp_s": 147, "bp_e": 168, "file": "g8_les12.pdf"},
    {"num": 13, "title": "មេរៀនទី ១៣ ៖ ចតុកោណ", "bp_s": 169, "bp_e": 186, "file": "g8_les13.pdf"},
    {"num": 14, "title": "មេរៀនទី ១៤ ៖ ផ្ទៃក្រឡាពហុកោណ", "bp_s": 187, "bp_e": 196, "file": "g8_les14.pdf"},
    {"num": 15, "title": "មេរៀនទី ១៥ ៖ រង្វង់", "bp_s": 197, "bp_e": 204, "file": "g8_les15.pdf"},
    {"num": 16, "title": "មេរៀនទី ១៦ ៖ បន្ទាត់និងអង្កត់ពិសេសជួបគ្នានៅក្នុងត្រីកោណ", "bp_s": 205, "bp_e": 214, "file": "g8_les16.pdf"},
    {"num": 17, "title": "មេរៀនទី ១៧ ៖ រូបធរណីមាត្រដែលមានវិមាត្របី", "bp_s": 215, "bp_e": 230, "file": "g8_les17.pdf"},
    {"num": 18, "title": "មេរៀនទី ១៨ ៖ មាត្រដ្ឋាន", "bp_s": 231, "bp_e": 236, "file": "g8_les18.pdf"},
]

G9_LESSONS = [
    {"num": 1, "title": "មេរៀនទី ១ ៖ ចំនួនអសនិទាន", "bp_s": 1, "bp_e": 16, "file": "g9_les01.pdf"},
    {"num": 2, "title": "មេរៀនទី ២ ៖ សមាមាត្រ", "bp_s": 17, "bp_e": 26, "file": "g9_les02.pdf"},
    {"num": 3, "title": "មេរៀនទី ៣ ៖ កន្សោមពីជគណិត", "bp_s": 27, "bp_e": 40, "file": "g9_les03.pdf"},
    {"num": 4, "title": "មេរៀនទី ៤ ៖ សមីការដឺក្រេទី១មានមួយអញ្ញាត", "bp_s": 41, "bp_e": 50, "file": "g9_les04.pdf"},
    {"num": 5, "title": "មេរៀនទី ៥ ៖ វិសមីការដឺក្រេទី១មានមួយអញ្ញាត", "bp_s": 51, "bp_e": 60, "file": "g9_les05.pdf"},
    {"num": 6, "title": "មេរៀនទី ៦ ៖ បំណែងចែកប្រេកង់", "bp_s": 61, "bp_e": 74, "file": "g9_les06.pdf"},
    {"num": 7, "title": "មេរៀនទី ៧ ៖ មធ្យមស្ថិតិ", "bp_s": 75, "bp_e": 84, "file": "g9_les07.pdf"},
    {"num": 8, "title": "មេរៀនទី ៨ ៖ ប្រូបាប", "bp_s": 85, "bp_e": 96, "file": "g9_les08.pdf"},
    {"num": 9, "title": "មេរៀនទី ៩ ៖ ចម្ងាយរវាងពីរចំណុច", "bp_s": 97, "bp_e": 104, "file": "g9_les09.pdf"},
    {"num": 10, "title": "មេរៀនទី ១០ ៖ សមីការនៃបន្ទាត់", "bp_s": 105, "bp_e": 120, "file": "g9_les10.pdf"},
    {"num": 11, "title": "មេរៀនទី ១១ ៖ ប្រព័ន្ធសមីការដឺក្រេទី១មានពីរអញ្ញាត", "bp_s": 121, "bp_e": 134, "file": "g9_les11.pdf"},
    {"num": 12, "title": "មេរៀនទី ១២ ៖ ទ្រឹស្ដីបទពីតាក័រ", "bp_s": 135, "bp_e": 142, "file": "g9_les12.pdf"},
    {"num": 13, "title": "មេរៀនទី ១៣ ៖ រង្វង់និងបន្ទាត់", "bp_s": 143, "bp_e": 158, "file": "g9_les13.pdf"},
    {"num": 14, "title": "មេរៀនទី ១៤ ៖ លក្ខណៈមុំនៃរង្វង់", "bp_s": 159, "bp_e": 180, "file": "g9_les14.pdf"},
    {"num": 15, "title": "មេរៀនទី ១៥ ៖ ទ្រឹស្ដីបទតាឡែស", "bp_s": 181, "bp_e": 190, "file": "g9_les15.pdf"},
    {"num": 16, "title": "មេរៀនទី ១៦ ៖ ត្រីកោណដូចគ្នា", "bp_s": 191, "bp_e": 212, "file": "g9_les16.pdf"},
    {"num": 17, "title": "មេរៀនទី ១៧ ៖ ពហុកោណ", "bp_s": 213, "bp_e": 222, "file": "g9_les17.pdf"},
    {"num": 18, "title": "មេរៀនទី ១៨ ៖ សូលីត", "bp_s": 223, "bp_e": 235, "file": "g9_les18.pdf"},
]

def to_khmer_num(n):
    kh_digits = "០១២៣៤៥៦៧៨៩"
    return "".join(kh_digits[int(d)] if d.isdigit() else d for d in str(n))

def format_size(size_bytes):
    if size_bytes >= 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / 1024:.1f} KB"

def slice_all(pdf_source, lesson_list, grade_label):
    print(f"\n==========================================")
    print(f"Slicing {grade_label} from '{pdf_source}'")
    print(f"==========================================")
    src_path = os.path.join(BASE_DIR, pdf_source)
    if not os.path.exists(src_path):
        raise FileNotFoundError(f"Source PDF not found: {src_path}")
    
    doc = pymupdf.open(src_path)
    total_pages = len(doc)
    print(f"Total pages in source: {total_pages}")
    
    file_info = {}
    for item in lesson_list:
        from_page = item["bp_s"] + 4
        to_page = item["bp_e"] + 4
        from_page = max(0, min(from_page, total_pages - 1))
        to_page = max(0, min(to_page, total_pages - 1))
        
        out_doc = pymupdf.open()
        out_doc.insert_pdf(doc, from_page=from_page, to_page=to_page)
        out_path = os.path.join(PDF_OUT_DIR, item["file"])
        out_doc.save(out_path)
        page_count = len(out_doc)
        out_doc.close()
        
        size = os.path.getsize(out_path)
        human_size = format_size(size)
        kh_s = to_khmer_num(item["bp_s"])
        kh_e = to_khmer_num(item["bp_e"])
        display_title = f"{item['title']} (ទំព័រ {kh_s} - {kh_e})"
        
        file_info[item["file"]] = {
            "fileName": item["file"],
            "fileUrl": f"uploads/pdfs/{item['file']}",
            "fileSize": human_size,
            "pageCount": page_count,
            "displayTitle": display_title
        }
        print(f"  [OK] {item['file']} ({page_count}p, {human_size}) -> {display_title}")
        
    doc.close()
    return file_info

if __name__ == '__main__':
    g7_info = slice_all('ថ្នាក់ទី៧៖_គណិតវិទ្យា.pdf', G7_LESSONS, 'ថ្នាក់ទី ៧')
    g8_info = slice_all('ថ្នាក់ទី៨៖_គណិតវិទ្យា.pdf', G8_LESSONS, 'ថ្នាក់ទី ៨')
    g9_info = slice_all('ថ្នាក់ទី៩៖_គណិតវិទ្យា.pdf', G9_LESSONS, 'ថ្នាក់ទី ៩')
    print(f"\nCompleted slicing all {len(g7_info) + len(g8_info) + len(g9_info)} PDFs!")
