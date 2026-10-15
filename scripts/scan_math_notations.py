import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('data/courses.json', 'r', encoding='utf-8') as f:
    courses = json.load(f)

findings = []

def scan_text(text, ctx):
    if not isinstance(text, str):
        return
    
    issues = []
    # 1. Raw integral symbol ∫
    if '∫' in text:
        issues.append('raw_integral_∫')
    
    # 2. Fractions written as (1/n) or numbers/numbers inside or outside $
    if re.search(r'\(\d+/\d+\)', text):
        issues.append('slash_fraction_in_parens')
    
    # 3. e^(...) or other exponent with parens
    if re.search(r'[a-zA-Z0-9]\^\([^\)]+\)', text):
        issues.append('exponent_parens')
        
    # 4. trig without backslash like sin(, cos(, tan(
    if re.search(r'(?<!\\)\b(sin|cos|tan|ln|log)\b', text):
        issues.append('trig_no_backslash')
        
    # 5. raw square root √
    if '√' in text:
        issues.append('raw_sqrt_√')
        
    # 6. raw dx or dy after exponent or variable
    if re.search(r'(?:\^[\w\d]+|\))\s*dx\b', text) and '\\int' not in text and '∫' not in text:
        issues.append('raw_dx')
        
    # 7. lim without \limits or raw lim
    if re.search(r'(?<!\\)\blim\b', text) or r'\lim_' in text:
        issues.append('bad_lim')
        
    # 8. raw arrow -> or \to outside $
    if '->' in text:
        issues.append('raw_arrow')
        
    # 9. raw plus minus ±
    if '±' in text:
        issues.append('raw_plusminus')

    # 10. raw delta Δ
    if 'Δ' in text:
        issues.append('raw_delta')

    # 11. raw sigma Σ
    if 'Σ' in text:
        issues.append('raw_sigma')

    # 12. raw >= or <=
    if '>=' in text or '<=' in text:
        issues.append('raw_inequality')

    if issues:
        findings.append((ctx, list(set(issues)), text))

for c in courses:
    cid = c['id']
    for ch in c.get('chapters', []):
        for les in ch.get('lessons', []):
            lid = les['id']
            for q_idx, q in enumerate(les.get('quiz', [])):
                ctx_base = f"{cid} -> {lid} -> Q{q_idx+1}"
                scan_text(q.get('question', ''), f"{ctx_base} [Q]")
                for opt_idx, opt in enumerate(q.get('options', [])):
                    scan_text(opt, f"{ctx_base} [Opt {opt_idx}]")
                scan_text(q.get('explanation', ''), f"{ctx_base} [Exp]")

print(f"Total items with math writing issues: {len(findings)}")

# Group by issue type
issue_counts = {}
for item in findings:
    for iss in item[1]:
        issue_counts[iss] = issue_counts.get(iss, 0) + 1

print("\n--- Issue Summary ---")
for k, v in sorted(issue_counts.items(), key=lambda x: -x[1]):
    print(f"- {k}: {v}")

print("\n--- First 30 Sample Findings ---")
for f in findings[:30]:
    print(f"[{f[0]}] Issues: {f[1]} | Text: {f[2]}")
