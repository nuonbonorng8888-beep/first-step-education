import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('data/courses.json', 'r', encoding='utf-8') as f:
    courses = json.load(f)

# Find all occurrences of problematic patterns in questions, options, explanations
patterns = {
    'raw_integral': r'∫',
    'slash_frac_parens': r'\(\d+/\d+\)',
    'raw_frac_slash': r'(?<![a-zA-Z0-9_])\d+/\d+(?![a-zA-Z0-9_])',
    'exponent_parens': r'\^\([^\)]+\)',
    'raw_trig': r'(?<!\\)\b(sin|cos|tan|cot|ln|log)\b',
    'raw_sqrt': r'√',
    'bad_lim': r'(?<!\\)\blim\b|\\lim_(?!\\limits)',
    'raw_arrow': r'->',
    'raw_plusminus': r'±',
    'raw_delta': r'Δ',
    'raw_sigma': r'Σ',
    'raw_inequality': r'(>=|<=)',
    'raw_pi': r'(?<!\\)π',
    'raw_alpha_beta': r'[αβθ]',
    'unclosed_dollar': r'unclosed_dollar'
}

stats = {k: 0 for k in patterns}
issues_by_course = {}

for c in courses:
    cid = c['id']
    issues_by_course[cid] = []
    for ch in c.get('chapters', []):
        for les in ch.get('lessons', []):
            lid = les['id']
            for qi, q in enumerate(les.get('quiz', [])):
                items = [('question', q.get('question', '')),
                         ('exp', q.get('explanation', ''))]
                for oi, opt in enumerate(q.get('options', [])):
                    items.append((f'opt_{oi}', opt))
                
                for field, text in items:
                    if not text:
                        continue
                    # check unclosed dollar
                    dollars = text.count('$')
                    if dollars % 2 != 0:
                        stats['unclosed_dollar'] += 1
                        issues_by_course[cid].append((f"{lid} Q{qi+1} {field}", 'unclosed_dollar', text))
                    
                    for p_name, regex in patterns.items():
                        if p_name == 'unclosed_dollar':
                            continue
                        if re.search(regex, text):
                            stats[p_name] += 1
                            issues_by_course[cid].append((f"{lid} Q{qi+1} {field}", p_name, text))

print("=== STATS ACROSS ALL QUIZZES ===")
for k, v in stats.items():
    print(f"  {k:20}: {v}")

print("\n=== TOTAL ISSUES BY COURSE ===")
for cid, issues in issues_by_course.items():
    print(f"  {cid:25}: {len(issues)} issues")
