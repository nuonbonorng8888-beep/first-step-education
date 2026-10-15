import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Import our custom lesson dictionaries
from math_fixes_g12 import G12_FIXES
from math_fixes_g11 import G11_FIXES
from math_fixes_g7_10 import G7_10_FIXES

ALL_CUSTOM_FIXES = {}
ALL_CUSTOM_FIXES.update(G12_FIXES)
ALL_CUSTOM_FIXES.update(G11_FIXES)
ALL_CUSTOM_FIXES.update(G7_10_FIXES)

print(f"Loaded {len(ALL_CUSTOM_FIXES)} curated custom lesson overhauls.")

def sanitize_math_text(text):
    if not isinstance(text, str) or not text.strip():
        return text
    
    t = text
    
    # 1. Fix known corrupted dollar sign patterns
    t = t.replace('$$y = x$^n$', '$y = x^n$')
    t = t.replace('$$y = x$^3 - 3x$', '$y = x^3 - 3x$')
    t = t.replace('$$y = x$^3 - 3x$^2 + 2', '$y = x^3 - 3x^2 + 2$')
    t = t.replace('$$y = x$^2$', '$y = x^2$')
    t = t.replace('$y = x$^2$', '$y = x^2$')
    t = t.replace('$$y = x^2$', '$y = x^2$')
    t = t.replace('$$y = x$', '$y = x$')
    t = t.replace('$$y = x^2', '$y = x^2$')
    t = t.replace('$dx = 2$', '$dx = 2$ ')
    t = t.replace('\\implies x = $0, $x = 1$', '\\implies x = 0, x = 1$')
    t = t.replace('$x^2 - y$^2 = a^2$', '$x^2 - y^2 = a^2$')
    t = t.replace('e^$x = 1$', '$e^x = 1$')
    t = t.replace('e^$x$', '$e^x$')
    t = t.replace('x^$2', '$x^2')
    
    # 2. Convert all \frac to \dfrac for large standard display
    t = t.replace(r'\frac{', r'\dfrac{')
    
    # 3. Ensure limits have \limits
    t = re.sub(r'\\lim_(?!\\limits)', r'\\lim\\limits_', t)
    
    # 4. Unicode symbols replacement inside and outside math
    # Greek letters
    t = t.replace('±', r'\pm')
    t = t.replace('Δ', r'\Delta')
    t = t.replace('Σ', r'\sum\limits')
    
    # Degree symbols
    t = re.sub(r'(\d+)\s*°', r'\1^\\circ', t)
    
    # Common slash fractions in parentheses: (1/2), (1/3), (1/4), (1/5), (1/6), (1/8), (1/10)
    frac_map = {
        '(1/2)': r'\dfrac{1}{2}',
        '(1/3)': r'\dfrac{1}{3}',
        '(1/4)': r'\dfrac{1}{4}',
        '(1/5)': r'\dfrac{1}{5}',
        '(1/6)': r'\dfrac{1}{6}',
        '(1/8)': r'\dfrac{1}{8}',
        '(1/10)': r'\dfrac{1}{10}',
        '(2/3)': r'\dfrac{2}{3}',
        '(3/4)': r'\dfrac{3}{4}',
        '(3/2)': r'\dfrac{3}{2}',
        '(4/3)': r'\dfrac{4}{3}',
    }
    for slash_f, dfrac_f in frac_map.items():
        t = t.replace(slash_f, dfrac_f)
    
    # 5. Fix math segments inside $ ... $
    parts = t.split('$')
    new_parts = []
    for idx, part in enumerate(parts):
        if idx % 2 == 1:
            # Inside math mode
            m = part
            # convert unescaped trig/log words: sin, cos, tan, cot, ln, log
            m = re.sub(r'(?<!\\)\b(sin|cos|tan|cot|ln|log|exp|arcsin|arccos|arctan)\b', r'\\\1', m)
            # fix e^(...) exponents
            m = re.sub(r'e\^\(([^\)]+)\)', r'e^{\1}', m)
            # fix general var^(...) exponents
            m = re.sub(r'([a-zA-Z0-9])\^\(([^\)]+)\)', r'\1^{\2}', m)
            # replace >= and <=
            m = m.replace('>=', r'\ge ')
            m = m.replace('<=', r'\le ')
            # replace pi inside math
            m = m.replace('π', r'\pi')
            m = m.replace('θ', r'\theta')
            m = m.replace('α', r'\alpha')
            m = m.replace('β', r'\beta')
            # replace raw sqrt inside math: √(expr) -> \sqrt{expr}
            m = re.sub(r'√\(([^)]+)\)', r'\\sqrt{\1}', m)
            m = re.sub(r'√([a-zA-Z0-9]+)', r'\\sqrt{\1}', m)
            # replace * with \cdot where it means multiplication
            m = re.sub(r'(?<=[a-zA-Z0-9\)\}])\s*\*\s*(?=[a-zA-Z0-9\(\{])', r' \\cdot ', m)
            new_parts.append(m)
        else:
            # Outside math mode (Khmer text or text surrounding math)
            out = part
            # If there's raw integral ∫ outside $, wrap in $...$
            # or if there's raw sqrt √
            out = re.sub(r'√\(([^)]+)\)', r'$\\sqrt{\1}$', out)
            out = re.sub(r'√([0-9]+)', r'$\\sqrt{\1}$', out)
            new_parts.append(out)
            
    res = '$'.join(new_parts)
    
    # Clean up empty $ blocks like $$
    res = res.replace('$$', '')
    
    return res

with open('data/courses.json', 'r', encoding='utf-8') as f:
    courses = json.load(f)

custom_applied = 0
total_questions = 0

for c in courses:
    for ch in c.get('chapters', []):
        for les in ch.get('lessons', []):
            lid = les['id']
            # If we have a custom handcrafted fix for this lesson:
            if lid in ALL_CUSTOM_FIXES:
                les['quiz'] = ALL_CUSTOM_FIXES[lid]
                custom_applied += 1
            else:
                # Sanitize the existing quiz
                for q in les.get('quiz', []):
                    total_questions += 1
                    q['question'] = sanitize_math_text(q.get('question', ''))
                    q['options'] = [sanitize_math_text(opt) for opt in q.get('options', [])]
                    q['explanation'] = sanitize_math_text(q.get('explanation', ''))

print(f"Applied custom overhauls to {custom_applied} lessons.")
print(f"Sanitized remaining questions across all lessons.")

# Verify dollar signs balance across every string
unbalanced = []
for c in courses:
    for ch in c.get('chapters', []):
        for les in ch.get('lessons', []):
            for qi, q in enumerate(les.get('quiz', [])):
                for field, txt in [('Q', q.get('question', '')), ('Exp', q.get('explanation', ''))] + [(f'Opt{oi}', opt) for oi, opt in enumerate(q.get('options', []))]:
                    if txt.count('$') % 2 != 0:
                        unbalanced.append((c['id'], les['id'], qi+1, field, txt))

print(f"Unbalanced dollar sign strings: {len(unbalanced)}")
if unbalanced:
    for u in unbalanced[:10]:
        print(f"  {u[0]} {u[1]} Q{u[2]} {u[3]}: {u[4]}")
    sys.exit(1)

# Write updated courses.json
with open('data/courses.json', 'w', encoding='utf-8') as f:
    json.dump(courses, f, ensure_ascii=False, indent=2)

print("Saved updated data/courses.json successfully!")
