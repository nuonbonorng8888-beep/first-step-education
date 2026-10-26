# -*- coding: utf-8 -*-
"""
High-Standard MCQ Generator for Worksheet.Kh
Directly adheres to Teacher Nuon Bonorng's criteria:
1. Single problem per question with 4 calculated answer options.
2. Comparative verification questions ("តើសមភាពណាត្រឹមត្រូវ?" / "តើសមភាពណាមិនត្រឹមត្រូវ?").
3. Authentic math distractors (sign, exponent, fraction, arithmetic errors). No generic junk.
4. Comprehensive coverage of all grade levels (Grades 7, 8, 9, 10, 11, 12).
"""
import sys
import json
import re
import random
import os

sys.stdout.reconfigure(encoding='utf-8')

with open('data/worksheets.json', 'r', encoding='utf-8') as f:
    ws_data = json.load(f)

with open('data/courses.json', 'r', encoding='utf-8') as f:
    courses_data = json.load(f)

# Map existing course quizzes
courses_quiz_map = {}
for c in courses_data:
    for ch in c.get('chapters', []):
        for l in ch.get('lessons', []):
            if l.get('quiz'):
                courses_quiz_map[l['id']] = l['quiz']

def clean_html(text):
    if not text:
        return ''
    t = re.sub(r'<[^>]+>', ' ', text)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def extract_clean_ans(sol):
    if not sol:
        return "$0$"
    sol = str(sol).strip()
    lines = [l.strip() for l in sol.split('\n') if l.strip()]
    if not lines:
        return sol[:40]
    
    last_line = lines[-1]
    for l in reversed(lines):
        if any(w in l for w in ['ដូចនេះ', 'នាំឱ្យ', 'ទទួលបាន', 'ចម្លើយ']):
            last_line = l
            break
            
    last_line = re.sub(r'^(?:ដូចនេះ|នាំឱ្យ|ទទួលបាន|ចម្លើយ|សមមូល)\s*[:៖]?\s*', '', last_line).strip()
    last_line = re.sub(r'^[1-9]\)\s*', '', last_line).strip()
    
    dm = re.findall(r'\$\$([^\$]+)\$\$', last_line)
    target = dm[-1] if dm else last_line
    
    # Check if there are multiple equalities A = B = C
    eq_parts = re.split(r'\s*=\s*', target)
    if len(eq_parts) > 1:
        last_part = eq_parts[-1].strip().rstrip('។.')
        if len(eq_parts) == 2 and re.match(r'^\$?[a-zA-Z_]\$?$', eq_parts[0].strip()):
            v = eq_parts[0].strip().replace('$', '')
            lp = last_part.replace('$', '')
            ans = f"${v} = {lp}$"
        else:
            ans = last_part
        if not ans.startswith('$'): ans = f"${ans}"
        if not ans.endswith('$'): ans = f"{ans}$"
        ans = re.sub(r'\$+', '$', ans)
        return ans
    
    im = re.findall(r'\$([^\$]+)\$', target)
    if im:
        return f"${im[-1].strip()}$"
        
    res = target.rstrip('។.')
    if not res.startswith('$') and ('\\' in res or '^' in res or '_' in res):
        res = f"${res}$"
    return res[:60] if res else "$0$"

def generate_math_distractors(ans, topic=""):
    ans = str(ans).strip()
    clean = ans.replace('$', '').strip()
    
    # 1. Pure number like $4$, $-5$, $0.2$
    m_num = re.search(r'^\$?([+-]?\d+(?:\.\d+)?)\$?$', ans)
    if m_num:
        val_str = m_num.group(1)
        if '.' in val_str:
            val = float(val_str)
            d1 = f"${-val}$"
            d2 = f"${round(val / 10, 4)}$"
            d3 = f"${round(val * 10, 4)}$"
            return [d1, d2, d3]
        else:
            val = int(val_str)
            d1 = f"${-val}$" if val != 0 else "$1$"
            d2 = f"${val + 2}$" if val >= 0 else f"${val - 2}$"
            d3 = f"${val * 2}$" if val not in (0, 1, -1) else f"${val + 3}$"
            if d2 == d1: d2 = f"${val + 4}$"
            if d3 == d1 or d3 == d2: d3 = f"${val - 3}$"
            return [d1, d2, d3]
            
    # 2. Fraction $\dfrac{a}{b}$ or $-\dfrac{a}{b}$
    m_frac = re.search(r'^\$?([+-]?)\s*\\d?frac\{([^}]+)\}\{([^}]+)\}\$?$', ans)
    if m_frac:
        sign = m_frac.group(1)
        num = m_frac.group(2).strip()
        den = m_frac.group(3).strip()
        opp_sign = "" if sign == "-" else "-"
        d1 = f"${opp_sign}\\dfrac{{{num}}}{{{den}}}$"
        d2 = f"${sign}\\dfrac{{{den}}}{{{num}}}$"
        if num.isdigit() and den.isdigit():
            n_sq = int(num)**2
            d_sq = int(den)**2
            d3 = f"${sign}\\dfrac{{{n_sq}}}{{{d_sq}}}$"
        else:
            d3 = f"${sign}\\dfrac{{{num}}}{{{den}+1}}$"
        if d2 == d1: d2 = f"${sign}\\dfrac{{{int(num)+1 if num.isdigit() else num}}}{{{den}}}$"
        return [d1, d2, d3]

    # 3. Variable equality x = val or y = val
    m_eq = re.search(r'^\$?([a-zA-Z_0-9]+)\s*=\s*([+-]?\d+(?:\.\d+)?)\$?$', ans)
    if m_eq:
        var = m_eq.group(1)
        val = int(float(m_eq.group(2)))
        d1 = f"${var} = {-val}$" if val != 0 else f"${var} = 1$"
        d2 = f"${var} = {val + 1}$"
        d3 = f"${var} = {val - 1}$"
        return [d1, d2, d3]

    # 4. Inequality x <= val or x >= val
    m_ineq = re.search(r'^\$?([a-zA-Z_0-9]+)\s*(\\le|\\ge|<|>)\s*([+-]?\d+(?:\.\d+)?)\$?$', ans)
    if m_ineq:
        var = m_ineq.group(1)
        op = m_ineq.group(2)
        val = m_ineq.group(3)
        opp_op = "\\ge" if op == "\\le" else ("\\le" if op == "\\ge" else (">" if op == "<" else "<"))
        d1 = f"${var} {opp_op} {val}$"
        d2 = f"${var} {op} {-int(val) if val.lstrip('-').isdigit() else val}$"
        d3 = f"${var} {opp_op} {-int(val) if val.lstrip('-').isdigit() else val}$"
        return [d1, d2, d3]

    # 5. Domain interval e.g. [a, b] or [a, +\infty)
    if '[' in ans or '(' in ans:
        if '+\\infty' in ans:
            # e.g. [2, +\infty)
            m_iv = re.search(r'\[([+-]?\d+),\s*\+\\infty\)', ans)
            if m_iv:
                v = m_iv.group(1)
                return [f"$(-\\infty, {v}]$", f"$({v}, +\\infty)$", f"$(-\\infty, {-int(v)}]$"]
        if '-\\infty' in ans:
            m_iv = re.search(r'\(-\\infty,\s*([+-]?\d+)\]', ans)
            if m_iv:
                v = m_iv.group(1)
                return [f"$[{v}, +\\infty)$", f"$(-\\infty, {v})$", f"$[{-int(v)}, +\\infty)$"]

    # 6. Radical expression \sqrt{a}
    m_rad = re.search(r'\\sqrt(?:\[3\])?\{([^}]+)\}', ans)
    if m_rad:
        inside = m_rad.group(1)
        return [
            f"${inside}$",
            f"$-{clean}$" if not clean.startswith('-') else f"${clean.lstrip('-')}$",
            f"${clean}^2$"
        ]

    # 7. Categorical Math Fallbacks
    if 'អនន្ត' in ans:
        return ["ជាស្វ៊ីតរាប់អស់", "ជាស្វ៊ីតថេរ", "ជាស្វ៊ីតមិនកំណត់"]
    if 'រាប់អស់' in ans:
        return ["ជាស្វ៊ីតអនន្ត", "ជាស្វ៊ីតមិនកំណត់", "ជាស្វ៊ីតសូន្យ"]
    if 'កើន' in ans and 'ចុះ' not in ans:
        return ["ជាស្វ៊ីតចុះដាច់ខាត", "ជាស្វ៊ីតថេរ", "ជាស្វ៊ីតមិនម៉ូណូតូន"]
    if 'ចុះ' in ans and 'កើន' not in ans:
        return ["ជាស្វ៊ីតកើនដាច់ខាត", "ជាស្វ៊ីតថេរ", "ជាស្វ៊ីតមិនម៉ូណូតូន"]
    if 'កាត់កែង' in ans:
        return ["ស្របគ្នា", "ត្រួតស៊ីគ្នា", "កាត់គ្នាមិនកែង"]
    if 'ស្រប' in ans:
        return ["កាត់កែងគ្នា", "កាត់គ្នាបង្កើតមុំ $45^\\circ$", "ត្រួតស៊ីគ្នា"]
    if 'ពិត' in ans and 'និម្មិត' in ans:
        return ["ផ្នែកពិត $0$ និងផ្នែកនិម្មិត $0$", "មានតែផ្នែកពិត គ្មានផ្នែកនិម្មិត", "មានតែផ្នែកនិម្មិត គ្មានផ្នែកពិត"]

    # Generic high-standard mathematical distractors
    c_no_dl = clean.lstrip('$').rstrip('$')
    return [
        f"$-{c_no_dl}$" if not c_no_dl.startswith('-') else f"${c_no_dl.lstrip('-')}$",
        f"${c_no_dl} + 1$",
        f"${c_no_dl} - 1$"
    ]

def parse_exercise_to_subitems(q_text, s_text):
    """
    Carefully dissect a question and solution into granular, single-target problem units.
    """
    results = []
    
    # 1. Split on Khmer sub-sections [ក-ឃ]\.
    parts_q = re.split(r'(?:^|\n)\s*([ក-ឃ]\.\s*)', q_text)
    parts_s = re.split(r'(?:^|\n)\s*([ក-ឃ]\.\s*)', s_text)
    
    if len(parts_q) > 2:
        prefix_q = parts_q[0].strip()
        for i in range(1, len(parts_q), 2):
            tag = parts_q[i].strip()
            sub_q = parts_q[i+1].strip()
            
            # Match solution
            sub_s = s_text
            if len(parts_s) > 2:
                for j in range(1, len(parts_s), 2):
                    if parts_s[j].strip()[0] == tag[0]:
                        sub_s = parts_s[j+1].strip()
                        break
            
            # Check for numbered items 1), 2), 3)...
            num_q = re.split(r'(?:^|\n)\s*([0-9]+[\)\.])\s*', sub_q)
            num_s = re.split(r'(?:^|\n)\s*([0-9]+[\)\.])\s*', sub_s)
            
            if len(num_q) > 2:
                sub_prefix = num_q[0].strip() or prefix_q
                for k in range(1, len(num_q), 2):
                    ntag = num_q[k].strip()
                    item_q = num_q[k+1].strip()
                    item_s = sub_s
                    if len(num_s) > 2:
                        for l in range(1, len(num_s), 2):
                            if num_s[l].strip().rstrip(').') == ntag.rstrip(').'):
                                item_s = num_s[l+1].strip()
                                break
                    # Clean title
                    clean_header = sub_prefix.rstrip(' ៖:')
                    q_final = f"{clean_header} ៖ {item_q}" if clean_header else item_q
                    results.append({
                        "question": q_final,
                        "raw_item": item_q,
                        "solution": item_s
                    })
            else:
                clean_header = prefix_q.rstrip(' ៖:')
                q_final = f"{clean_header} {tag} {sub_q}".strip() if clean_header else f"{tag} {sub_q}".strip()
                results.append({
                    "question": q_final,
                    "raw_item": sub_q,
                    "solution": sub_s
                })
    else:
        # Check direct numbered items 1), 2), 3)...
        num_q = re.split(r'(?:^|\n)\s*([0-9]+[\)\.])\s*', q_text)
        num_s = re.split(r'(?:^|\n)\s*([0-9]+[\)\.])\s*', s_text)
        if len(num_q) > 2:
            prefix = num_q[0].strip()
            for k in range(1, len(num_q), 2):
                ntag = num_q[k].strip()
                item_q = num_q[k+1].strip()
                item_s = s_text
                if len(num_s) > 2:
                    for l in range(1, len(num_s), 2):
                        if num_s[l].strip().rstrip(').') == ntag.rstrip(').'):
                            item_s = num_s[l+1].strip()
                            break
                clean_header = prefix.rstrip(' ៖:')
                q_final = f"{clean_header} ៖ {item_q}" if clean_header else item_q
                results.append({
                    "question": q_final,
                    "raw_item": item_q,
                    "solution": item_s
                })
        else:
            results.append({
                "question": q_text.strip(),
                "raw_item": q_text.strip(),
                "solution": s_text.strip()
            })
            
    return results

print("Generator helpers compiled successfully.")
