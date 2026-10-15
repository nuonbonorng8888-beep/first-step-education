import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('data/courses.json', 'r', encoding='utf-8') as f:
    courses = json.load(f)

for c in courses:
    for ch in c.get('chapters', []):
        for les in ch.get('lessons', []):
            for qi, q in enumerate(les.get('quiz', [])):
                all_text = q['question'] + ' ' + ' '.join(q['options']) + ' ' + q.get('explanation', '')
                if '∫' in all_text or r'\int' in all_text:
                    print(f"[{c['id']}] {les['id']} Q{qi+1}:")
                    print(f"  Q:   {q['question']}")
                    for oi, opt in enumerate(q['options']):
                        print(f"  [{chr(65+oi)}] {opt}")
                    print(f"  Exp: {q.get('explanation')}")
                    print()
