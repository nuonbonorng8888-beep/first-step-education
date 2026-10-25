import json
import copy

def update_g12_basic():
    with open('data/courses.json', 'r', encoding='utf-8') as f:
        courses = json.load(f)
        
    cdict = {c['id']: c for c in courses}
    g12b = cdict.get('course-math-g12-basic')
    g12a = cdict.get('course-math-g12-advanced')
    
    if not g12b or not g12a:
        print("Error: Could not find g12b or g12a")
        return
        
    complex_ch_orig = g12a['chapters'][0]
    # Deep copy complex chapter
    complex_ch = copy.deepcopy(complex_ch_orig)
    complex_ch['id'] = 'ch-g12b-1'
    complex_ch['title'] = 'ជំពូកទី ១ ៖ ចំនួនកុំផ្លិច'
    
    # Old chapters of g12b renumbered
    old_chapters = g12b['chapters']
    renumbered_chapters = [complex_ch]
    
    khmer_digits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩']
    
    for idx, ch in enumerate(old_chapters, start=2):
        new_ch = copy.deepcopy(ch)
        new_ch['id'] = f'ch-g12b-{idx}'
        # Update chapter title number to Khmer digit
        kh_num = khmer_digits[idx] if idx < len(khmer_digits) else str(idx)
        # e.g. "ជំពូកទី ១ ៖ ..." -> "ជំពូកទី ២ ៖ ..."
        parts = new_ch['title'].split('៖', 1)
        if len(parts) == 2:
            new_ch['title'] = f"ជំពូកទី {kh_num} ៖{parts[1]}"
        else:
            new_ch['title'] = f"ជំពូកទី {kh_num} ៖ {new_ch['title']}"
        renumbered_chapters.append(new_ch)
        
    g12b['chapters'] = renumbered_chapters
    g12b['description'] = "កម្មវិធីសិក្សាគណិតវិទ្យាថ្នាក់ទី១២ កម្រិតមូលដ្ឋាន ស្របតាមសៀវភៅពុម្ពគោលរបស់ក្រសួងអប់រំ យុវជន និងកីឡា រួមមាន ៧ ជំពូក និង ១៥ មេរៀន៖ ចំនួនកុំផ្លិច, លីមីត និងភាពជាប់, ដេរីវេ និងអនុវត្តន៍, អនុគមន៍អិចស្បូណង់ស្យែល និងលោការីត, ព្រីមីទីវ និងអាំងតេក្រាល, ស្ថិតិវិទ្យា, និង ប្រូបាប។"
    g12b['totalLessons'] = sum(len(ch['lessons']) for ch in renumbered_chapters)
    
    # Save back
    with open('data/courses.json', 'w', encoding='utf-8') as f:
        json.dump(courses, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully updated course-math-g12-basic! Now has {len(renumbered_chapters)} chapters and {g12b['totalLessons']} lessons.")
    for ch in g12b['chapters']:
        print(f"  - {ch['id']} : {ch['title']}")
        for les in ch['lessons']:
            print(f"      * {les['id']} : {les['title']}")

if __name__ == '__main__':
    update_g12_basic()
