# -*- coding: utf-8 -*-
"""
Deep Repair Engine:
1. Ensure every prompt is a single-target question ("សួរតែ ១", no compound prompts).
2. Transform proof prompts ("បង្ហាញថា...") into proper multiple choice questions.
3. Clean all broken distractors ("+ 1", "- 1" on text/units, dummy options like (u_n), corrupted signs).
"""
import json
import re
import math
import sys
import os

sys.path.insert(0, os.path.abspath('.'))
sys.stdout.reconfigure(encoding='utf-8')

from scripts.master_replace_boilerplates import detect_domain, generate_clean_math_question

def clean_multi_part_prompt(q_txt):
    """Ensure prompt asks ONLY ONE THING ('សួរតែ ១')"""
    q = q_txt.strip()
    
    # 1. គណនាកន្សោម ... រួចគណនា ... -> គណនា ...
    q = re.sub(r'គណនាកន្សោម\s*(\$?[^\$]+\$?)\s*រួចគណនា\s*', 'គណនា', q)
    # 2. ចូរពិនិត្យផលដក ... រួចបញ្ជាក់ថាស្វ៊ីតខាងក្រោមជាស្វ៊ីតកើន ឬស្វ៊ីតចុះ ៖ -> តើស្វ៊ីតខាងក្រោមជាប្រភេទស្វ៊ីតអ្វី? ៖
    q = re.sub(r'ចូរពិនិត្យផលដក\s*[^\n]+?\s*រួចបញ្ជាក់ថាស្វ៊ីតខាងក្រោមជាស្វ៊ីតកើន ឬស្វ៊ីតចុះ\s*៖', 'តើស្វ៊ីតខាងក្រោមជាប្រភេទស្វ៊ីតអ្វី? ៖', q)
    # 3. បង្ហាញថា ... រួចទាញសន្និដ្ឋានថា (u_n) ជាស្វ៊ីត... -> តើ (u_n) ជាប្រភេទស្វ៊ីតអ្វី?
    q = re.sub(r'បង្ហាញថា\s*[^\n]+?\s*រួចទាញសន្និដ្ឋានថា\s*(\([a-zA-Z_0-9]+\))\s*ជាស្វ៊ីត[^\n៖]+[៖:]?', r'តើ \1 ជាប្រភេទស្វ៊ីតអ្វី? ៖', q)
    # 4. បង្ហាញថា ... រួចសរសេរជាទម្រង់ស្តង់ដា ៖ -> សរសេរជាទម្រង់ស្តង់ដា ៖
    q = re.sub(r'បង្ហាញថា[^\n]+?រួចសរសេរជា', 'សរសេរជា', q)
    # 5. រក ... រួចគណនា ... -> គណនា ...
    q = re.sub(r'រក[^\n]+?រួចគណនា\s*', 'គណនា ', q)
    # 6. រក ... រួចរក ... -> រក ...
    q = re.sub(r'រក[^\n]+?រួចរក\s*', 'រក ', q)
    # 7. រក ... រួចទាញរក ... -> ទាញរក ...
    q = re.sub(r'រក[^\n]+?រួចទាញរក\s*', 'ទាញរក ', q)
    # 8. គណនាឫសការេ ... រួចទាញរក ... -> រក ...
    q = re.sub(r'គណនាឫសការេ[^\n]+?រួចទាញរក\s*', 'រក', q)
    # 9. គណនាកូអរដោនេ ... រួចគណនា ... -> គណនា ...
    q = re.sub(r'គណនាកូអរដោនេ[^\n]+?រួចគណនា\s*', 'គណនា', q)
    # 10. បង្រួមកន្សោម ... ឱ្យសាមញ្ញបំផុត រួចគណនា ... -> គណនា ...
    q = re.sub(r'បង្រួមកន្សោម[^\n]+?ឱ្យសាមញ្ញបំផុត\s*រួចគណនា\s*', 'គណនា', q)
    # 11. សរសេរផលធៀប ... រួចគណនា ... -> គណនា ...
    q = re.sub(r'សរសេរផលធៀប[^\n]+?រួចគណនា\s*', 'គណនា', q)
    # 12. គណនាផ្ទៃក្រឡា ... រួចទាញរក ... -> គណនា ...
    q = re.sub(r'គណនាផ្ទៃក្រឡា[^\n]+?រួចទាញរក\s*', 'គណនា', q)
    # 13. បញ្ចេញកត្តាពីរ៉ាឌីកាល់ រួចគណនាបង្រួមកន្សោម ៖ -> គណនាបង្រួមកន្សោម ៖
    q = re.sub(r'បញ្ចេញកត្តាពីរ៉ាឌីកាល់\s*រួចគណនាបង្រួមកន្សោម\s*', 'គណនាបង្រួមកន្សោម ', q)
    # 14. ព្រមទាំង ...
    q = re.sub(r'ព្រមទាំង\s*(?:គណនា|រក)[^\n៖]*', '', q)
    
    # General cleanup of remaining "រួច"
    if 'រួច' in q:
        m = re.search(r'^(.*?)\s*៖\s*(.*?)\s*រួច\s*(.*)$', q)
        if m:
            prefix, part1, part2 = m.group(1), m.group(2), m.group(3)
            q = f"{prefix} ៖ {part2}"
            
    # Clean double colons
    q = re.sub(r'[:៖]\s*[:៖]', ' ៖', q)
    q = re.sub(r'\s+', ' ', q).strip()
    return q

def clean_proof_prompt(q_txt):
    """Transform proof prompts ('បង្ហាញថា...') into proper MCQ questions"""
    q = q_txt.strip()
    
    # 1. Sequence increasing/decreasing
    if re.search(r'បង្ហាញថា\s*\$?[a-zA-Z_0-9\+\-\s\(\)]+\$?\s*(?:>|<)\s*0[^\n]*ជាស្វ៊ីត', q):
        m = re.search(r'(\([a-zA-Z_0-9]+\))', q)
        seq_name = m.group(1) if m else '$(u_n)$'
        return f"តើ {seq_name} ជាប្រភេទស្វ៊ីតអ្វី? ៖", 'sequence_monotonic'
        
    # 2. Bounded above / below
    if 'បង្ហាញថា' in q and 'ជាស្វ៊ីតទាល់លើ' in q:
        m = re.search(r'(\([a-zA-Z_0-9]+\))', q)
        seq_name = m.group(1) if m else '$(a_n)$'
        return f"រកគោលលើ (Upper bound) នៃស្វ៊ីត {seq_name} ៖", 'upper_bound'
    if 'បង្ហាញថា' in q and 'ជាស្វ៊ីតទាល់ក្រោម' in q:
        m = re.search(r'(\([a-zA-Z_0-9]+\))', q)
        seq_name = m.group(1) if m else '$(b_n)$'
        return f"រកគោលក្រោម (Lower bound) នៃស្វ៊ីត {seq_name} ៖", 'lower_bound'
    if 'បង្ហាញថា' in q and 'ជាស្វ៊ីតទាល់' in q:
        m = re.search(r'(\([a-zA-Z_0-9]+\))', q)
        seq_name = m.group(1) if m else '$(c_n)$'
        return f"រកគោលក្រោម (Lower bound) នៃស្វ៊ីត {seq_name} ៖", 'lower_bound'
        
    # 3. "បង្ហាញថា f(x) ជាប់លើ..." -> "តើ f(x) ជាប់លើចន្លោះណា?"
    if 'បង្ហាញថាអនុគមន៍' in q and 'ជាប់លើ' in q:
        q = re.sub(r'បង្ហាញថាអនុគមន៍\s*(\$?[^\$]+\$?)\s*ជាប់លើ[^\n៖]+[៖:]?', r'តើអនុគមន៍ \1 ជាប់លើចន្លោះណា? ៖', q)
        return q, None
        
    # 4. "បង្ហាញថាសមីការ... មានឫសពិត..." -> "តើសមីការ... មានឫសពិតក្នុងចន្លោះណា?"
    if 'បង្ហាញថាសមីការ' in q and 'មានឫស' in q:
        q = re.sub(r'បង្ហាញថាសមីការ\s*(\$?[^\$]+\$?)\s*មានឫស[^\n៖]+[៖:]?', r'តើសមីការ \1 មានឫសពិតយ៉ាងហោចមួយក្នុងចន្លោះណា? ៖', q)
        return q, None
        
    # 5. "បង្ហាញថាចំណុចបី... រត់ត្រង់ជួរគ្នា" -> "តើចំណុចបី... មានលក្ខណៈដូចម្តេច?"
    if 'បង្ហាញថាចំណុចបី' in q and 'រត់ត្រង់ជួរ' in q:
        q = re.sub(r'បង្ហាញថាចំណុចបី\s*([^\n៖]+?)\s*រត់ត្រង់ជួរគ្នា[៖:]?', r'តើចំណុចបី \1 មានលក្ខណៈដូចម្តេច? ៖', q)
        return q, 'collinear'
        
    # 6. "បង្ហាញថាត្រីកោណ... ជាត្រីកោណសម័ង្ស/កែង" -> "តើត្រីកោណ... ជាប្រភេទត្រីកោណអ្វី?"
    if 'បង្ហាញថា' in q and 'ត្រីកោណ' in q:
        q = re.sub(r'បង្ហាញថា(?:បើ[^\n]+?នោះ)?\s*(?:ត្រីកោណ|\\Delta|\\triangle)\s*([A-Za-z]+)\s*ជា[^\n៖]+[៖:]?', r'តើត្រីកោណ \1 ជាប្រភេទត្រីកោណអ្វី? ៖', q)
        return q, 'triangle_type'

    # General prefix removal if simple: "បង្ហាញថា A = B" -> "គណនាតម្លៃនៃ A ៖"
    if 'បង្ហាញថា' in q:
        q = q.replace('បង្ហាញថា', 'ចូរពិនិត្យថា ')
        
    return q, None

def clean_answer_and_generate_clean_distractors(ans_str, topic):
    """
    Clean raw answer string and generate 3 authentic math distractors.
    Never output '+ 1', '- 1', or trailing commentary.
    """
    a = str(ans_str).strip()
    
    # Strip Khmer commentary from inside or after math:
    # e.g. "$3n + 1$ (ចំពោះគ្រប់ $n \in \mathbb{N}^*$)$" -> "$3n + 1$"
    a = re.sub(r'\s*\([^\)]*[\u1780-\u17DF][^\)]*\)\$?$', '', a).strip()
    a = re.sub(r'\s*\(ពិត\)\$?$', '', a).strip()
    a = re.sub(r'\s*\(សញ្ញាឆ្លាស់\)\$?$', '', a).strip()
    a = re.sub(r'\$+', '$', a)
    if not a.startswith('$') and any(c in a for c in ['\\', '^', '_', '+', '-']):
        a = f"${a}$"
    if a.count('$') == 1:
        a = f"{a}$" if a.startswith('$') else f"${a}"

    clean = a.strip('$').strip()
    
    # If it's a dummy token
    if clean in ['(u_n)', '-(u_n)', '(v_n)', '(a_n)', '(b_n)', '(c_n)', 'ABCD', 'A, B, C', 'R)', '0', '']:
        return None, None
        
    # Check if number
    m_num = re.match(r'^([+-]?\d+(?:\.\d+)?)$', clean)
    if m_num:
        val = int(float(m_num.group(1)))
        d1 = f"${-val}$" if val != 0 else "$1$"
        d2 = f"${val + 2}$" if val >= 0 else f"${val - 2}$"
        d3 = f"${val * 2}$" if val not in [0, 1, -1] else f"${val + 3}$"
        if d2 == d1: d2 = f"${val + 4}$"
        if d3 in [d1, d2]: d3 = f"${val - 3}$"
        return f"${val}$", [d1, d2, d3]

    # Check if number with unit, e.g. "3.5\text{ km}" or "53\text{ កៅអី}"
    m_unit = re.match(r'^([+-]?\d+(?:\.\d+)?)\s*(\\text\{[^}]+\})$', clean)
    if m_unit:
        num_v = float(m_unit.group(1))
        unit = m_unit.group(2)
        step = 0.5 if '.' in m_unit.group(1) else 2
        d1 = f"${num_v - step:g}{unit}$"
        d2 = f"${num_v + step:g}{unit}$"
        d3 = f"${num_v + 2*step:g}{unit}$"
        return f"${num_v:g}{unit}$", [d1, d2, d3]

    # Check if linear expression like "3n + 1" or "4n - 1"
    m_lin = re.match(r'^([+-]?\d*)n\s*([+-])\s*(\d+)$', clean)
    if m_lin:
        cf = int(m_lin.group(1)) if m_lin.group(1) not in ['', '+', '-'] else (1 if m_lin.group(1) != '-' else -1)
        sign = m_lin.group(2)
        cst = int(m_lin.group(3))
        opp_sign = '-' if sign == '+' else '+'
        d1 = f"${cf}n {opp_sign} {cst}$"
        d2 = f"${cf + 1}n {sign} {cst}$"
        d3 = f"${cf}n {sign} {cst + 1}$"
        return f"${clean}$", [d1, d2, d3]

    # Check if rational sequence expression \dfrac{n + a}{n + b}
    m_rat = re.match(r'^\\dfrac\{n\s*\+\s*(\d+)\}\{n\s*\+\s*(\d+)\}$', clean)
    if m_rat:
        a_v = int(m_rat.group(1))
        b_v = int(m_rat.group(2))
        d1 = f"$\\dfrac{{n + {a_v - 1}}}{{n + {b_v - 1}}}$"
        d2 = f"$\\dfrac{{n + {a_v + 1}}}{{n + {b_v + 1}}}$"
        d3 = f"$\\dfrac{{n}}{{n + {b_v}}}$"
        return f"$\\dfrac{{n + {a_v}}}{{n + {b_v}}}$", [d1, d2, d3]

    # Check if fraction \dfrac{a}{b}
    m_frac = re.match(r'^([+-]?)\\dfrac\{([^}]+)\}\{([^}]+)\}$', clean)
    if m_frac:
        sgn = m_frac.group(1)
        top = m_frac.group(2)
        bot = m_frac.group(3)
        opp = "" if sgn == "-" else "-"
        d1 = f"${opp}\\dfrac{{{top}}}{{{bot}}}$"
        d2 = f"${sgn}\\dfrac{{{bot}}}{{{top}}}$" if not ('n' in bot and len(bot) > 5) else f"${sgn}\\dfrac{{{top}}}{{{bot}+1}}$"
        d3 = f"${sgn}\\dfrac{{{top} + 1}}{{{bot}}}$" if top.isdigit() else f"$-{clean}$"
        return f"${clean}$", [d1, d2, d3]

    # Check if plus/minus number \pm A
    m_pm = re.match(r'^\\pm\s*(\d+)$', clean)
    if m_pm:
        val = int(m_pm.group(1))
        d1 = f"${val}$"
        d2 = f"${-val}$"
        d3 = f"$\\pm {val * 2}$"
        return f"$\\pm {val}$", [d1, d2, d3]

    return None, None

def run_deep_repair():
    in_path = 'data/point_quizzes.json'
    with open(in_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    repaired_prompts = 0
    repaired_proofs = 0
    repaired_distractors = 0
    replaced_questions = 0

    dummy_tokens = ['$(u_n)$', '$(v_n)$', '$(a_n)$', '$(w_n)$', '$(b_n)$', '$(c_n)$', '-(u_n)', '$-(u_n)$', '$ABCD$', '$A, B, C$', '$R$)$', '$0$ (ពិត)$', '$A$']

    for les_id, points in data.items():
        if not isinstance(points, dict): continue
        for p_num, q_list in points.items():
            if not isinstance(q_list, list): continue
            
            p_title = q_list[0].get('pointTitle', '') if q_list else ''
            domain = detect_domain(les_id, p_title)
            
            for idx, q in enumerate(q_list):
                q_txt = q.get('question', '').strip()
                opts = list(q.get('options', []))
                corr = q.get('correct', 0)
                corr_ans = opts[corr] if corr < len(opts) else ''
                exp = q.get('explanation', '')
                
                # Step 1: Clean multi-part prompt
                if re.search(r'(?:រួច|ព្រមទាំង)\s*(?:គណនា|រក|ទាញ|សន្និដ្ឋាន|បញ្ជាក់|បង្ហាញ)', q_txt):
                    new_q = clean_multi_part_prompt(q_txt)
                    if new_q != q_txt:
                        q['question'] = new_q
                        q_txt = new_q
                        repaired_prompts += 1
                        
                # Step 2: Clean proof prompt
                if any(w in q_txt for w in ['បង្ហាញថា', 'ស្រាយបំភ្លឺថា', 'ស្រាយបញ្ជាក់ថា', 'ចូរបង្ហាញថា', 'ចូរស្តែងថា', 'ចូរស្រាយ']):
                    new_q, proof_type = clean_proof_prompt(q_txt)
                    if proof_type == 'sequence_monotonic':
                        q['question'] = new_q
                        q['options'] = ['ជាស្វ៊ីតកើនដាច់ខាត', 'ជាស្វ៊ីតចុះដាច់ខាត', 'ជាស្វ៊ីតថេរ', 'មិនមែនជាស្វ៊ីតម៉ូណូតូន']
                        q['correct'] = 0 if ('កើន' in exp or 'កើន' in q_txt) else 1
                        repaired_proofs += 1
                        continue
                    elif proof_type in ['upper_bound', 'lower_bound']:
                        q['question'] = new_q
                        # options can remain the numbers if they were numbers
                        clean_a, clean_d = clean_answer_and_generate_clean_distractors(corr_ans, p_title)
                        if clean_a and clean_d:
                            q['options'] = [clean_a] + clean_d
                            q['correct'] = 0
                        repaired_proofs += 1
                        continue
                    elif proof_type == 'collinear':
                        q['question'] = new_q
                        q['options'] = ['រត់ត្រង់ជួរគ្នា (កូឡីនេអ៊ែរ)', 'មិនរត់ត្រង់ជួរគ្នា', 'ត្រួតស៊ីគ្នា', 'កែងគ្នា']
                        q['correct'] = 0
                        repaired_proofs += 1
                        continue
                    elif proof_type == 'triangle_type':
                        q['question'] = new_q
                        q['options'] = ['ត្រីកោណកែងសមបាត', 'ត្រីកោណសម័ង្ស', 'ត្រីកោណសមបាត', 'ត្រីកោណមុំទាល']
                        q['correct'] = 0 if 'សមបាត' in exp else (1 if 'សម័ង្ស' in exp else 0)
                        repaired_proofs += 1
                        continue
                    else:
                        q['question'] = new_q
                        repaired_proofs += 1

                # Step 3: Check options for broken distractors or dummy tokens
                has_broken_opt = False
                for opt in opts:
                    o = str(opt).strip()
                    if o in dummy_tokens:
                        has_broken_opt = True
                    if re.search(r'(?:\\text\{[^}]+\}|\)|[^\d\$])\s*[+-]\s*1\$?$', o):
                        has_broken_opt = True
                    if '$-+' in o or '$+-' in o:
                        has_broken_opt = True
                    if '$-' in o and not o.startswith('$-'):
                        has_broken_opt = True
                    if re.search(r'\$[^\$]*[\u1780-\u17DF][^\$]*\$', o):
                        has_broken_opt = True

                if has_broken_opt:
                    clean_a, clean_d = clean_answer_and_generate_clean_distractors(corr_ans, p_title)
                    if clean_a and clean_d and len(clean_d) == 3:
                        # Success salvaging with clean distractors!
                        opts = [clean_a] + clean_d
                        # Shuffle options
                        corr_pos = (idx * 2) % 4
                        corr_val = opts.pop(0)
                        opts.insert(corr_pos, corr_val)
                        q['options'] = opts
                        q['correct'] = corr_pos
                        repaired_distractors += 1
                    else:
                        # Replace question with fresh, authentic math question
                        seed = idx * 11 + int(p_num) * 17 + hash(les_id) % 200
                        mq = generate_clean_math_question(domain, p_title, seed)
                        
                        corr_ans = mq['ans']
                        dists = list(mq['dists'])[:3]
                        while len(dists) < 3:
                            dists.append("$0$")
                        corr_pos = (idx * 3) % 4
                        options = dists[:]
                        options.insert(corr_pos, corr_ans)
                        
                        q['question'] = mq['q']
                        q['options'] = options
                        q['correct'] = corr_pos
                        q['explanation'] = mq['exp']
                        q['level'] = "កម្រិត ២ (អនុវត្ត)"
                        replaced_questions += 1

    print(f"Repair Complete:")
    print(f"  - Repaired multi-part prompts: {repaired_prompts}")
    print(f"  - Repaired proof prompts: {repaired_proofs}")
    print(f"  - Repaired distractors: {repaired_distractors}")
    print(f"  - Replaced corrupted questions with clean math: {replaced_questions}")

    with open(in_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved changes to {in_path} successfully!")

if __name__ == '__main__':
    run_deep_repair()
