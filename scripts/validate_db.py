import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

data = json.load(open('data/courses.json', encoding='utf-8'))
assert len(data) == 8, f'Expected 8 courses, got {len(data)}'
total_q = sum(len(les.get('quiz', [])) for c in data for ch in c.get('chapters', []) for les in ch.get('lessons', []))
total_les = sum(len(ch.get('lessons', [])) for c in data for ch in c.get('chapters', []))
assert total_les == 159, f'Expected 159 lessons, got {total_les}'
assert total_q == 930, f'Expected 930 questions, got {total_q}'

for c in data:
    for ch in c.get('chapters', []):
        for les in ch.get('lessons', []):
            for qi, q in enumerate(les.get('quiz', [])):
                assert len(q.get('options', [])) == 4, f'Question without 4 options: {les["id"]} Q{qi+1}'
                for t in [q['question'], q['explanation']] + q['options']:
                    assert t.count('$') % 2 == 0, f'Unbalanced dollar in {les["id"]} Q{qi+1}: {t}'

print(f">>> ALL {total_q} QUESTIONS AND {total_les} LESSONS VALIDATED SUCCESSFULLY! 0 ERRORS! <<<")
