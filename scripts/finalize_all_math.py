import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

from math_fixes_g12 import G12_FIXES
from math_fixes_g11 import G11_FIXES
from math_fixes_g7_10 import G7_10_FIXES
from more_math_fixes import MORE_FIXES
from perfect_remaining_lessons import PERFECT_FIXES

ALL_CUSTOM = {}
ALL_CUSTOM.update(G12_FIXES)
ALL_CUSTOM.update(G11_FIXES)
ALL_CUSTOM.update(G7_10_FIXES)
ALL_CUSTOM.update(MORE_FIXES)
ALL_CUSTOM.update(PERFECT_FIXES)

print(f"Total custom curated lessons: {len(ALL_CUSTOM)}")

def sanitize_math(text):
    if not isinstance(text, str) or not text.strip():
        return text
    
    t = text
    
    # 1. First, fix known corrupted strings from legacy DB
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
    t = re.sub(r'\$lim\s*\(([^)]+)\)\s*', r'$\\lim\\limits_{\1} ', t)
    t = t.replace(r'$lim f(x)', r'$\lim\limits_{x \to \pm\infty} f(x)')
    t = t.replace(r'lim (x \to', r'\lim\limits_{x \to')
    
    # 4. Standardize Unicode characters
    t = t.replace('±', r'\pm')
    t = t.replace('Δ', r'\Delta')
    t = t.replace('Σ', r'\sum\limits')
    t = re.sub(r'(\d+)\s*°', r'\1^\\circ', t)
    
    # 5. Fix common fractions in options/text: (1/2), (1/3), (1/4), (1/5), (1/6), (1/8), (1/10)
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
        '(2/5)': r'\dfrac{2}{5}',
        '(4/5)': r'\dfrac{4}{5}',
        '(4/10)': r'\dfrac{4}{10}',
        '(3/9)': r'\dfrac{3}{9}',
        '(25/100)': r'\dfrac{25}{100}',
        '(22/7)': r'\dfrac{22}{7}',
        '(9/16)': r'\dfrac{9}{16}',
    }
    for slash_f, dfrac_f in frac_map.items():
        t = t.replace(slash_f, dfrac_f)
        
    # 6. Specific common replacements
    t = t.replace('s = √Var', r'$s = \sqrt{\text{Var}}$')
    t = t.replace('σ = √\\text{Var}(X)', r'$\sigma = \sqrt{\text{Var}(X)}$')
    t = t.replace('$σ = √\\text{Var}(X)$', r'$\sigma = \sqrt{\text{Var}(X)}$')
    t = t.replace('σ = √$\\text{Var}(X)$', r'$\sigma = \sqrt{\text{Var}(X)}$')
    t = t.replace('$√$ (-1)', r'$\sqrt{-1}$')
    t = t.replace('A^(-1)', r'$A^{-1}$')
    t = t.replace('q^(n-1)', r'q^{n-1}')
    t = t.replace('d^(n-1)', r'd^{n-1}')
    t = t.replace('u^(n-1)', r'u^{n-1}')
    t = t.replace('2^(5-1)', r'2^{5-1}')
    t = t.replace('3^(2x - 1)', r'3^{2x - 1}')
    t = t.replace('5^(x+1)', r'5^{x+1}')
    t = t.replace('5^(1-x)', r'5^{1-x}')
    t = t.replace('3^(2x)', r'3^{2x}')
    t = t.replace('0 <= P(A) <= 1', r'$0 \le P(A) \le 1$')
    t = t.replace('n >= n_0', r'$n \ge n_0$')
    t = t.replace('x >= 0', r'$x \ge 0$')
    t = t.replace('x <= 0', r'$x \le 0$')
    t = t.replace('f >= g', r'$f \ge g$')
    t = t.replace('a >= b', r'$a \ge b$')
    t = t.replace('log_0.5(2x - 1) >= -1', r'$\log_{0.5}(2x - 1) \ge -1$')
    t = t.replace('2x - 1 <= (0.5)^(-1)', r'$2x - 1 \le (0.5)^{-1}$')
    t = t.replace('2x <= 3', r'$2x \le 3$')
    t = t.replace('x <= 3/2', r'$x \le \dfrac{3}{2}$')
    t = t.replace('ln($x^2 - 3$) = ln(2x)', r'$\ln(x^2 - 3) = \ln(2x)$')
    t = t.replace('ln x > ln e', r'$\ln x > \ln e$')
    t = t.replace('e^(ln 5)', r'$e^{\ln 5}$')
    t = t.replace('a^(log_a x)', r'$a^{\log_a x}$')
    t = t.replace('f(x) >= g(x)', r'$f(x) \ge g(x)$')
    t = t.replace('h(x) >= min h(x) >= 0', r'$h(x) \ge \min h(x) \ge 0$')
    t = t.replace('$e^x$ >= x + 1', r'$e^x \ge x + 1$')
    t = t.replace('sin(x) < x', r'$\sin x < x$')
    t = t.replace('ln(1 + x) <= x', r'$\ln(1 + x) \le x$')
    t = t.replace('cos(x) = x', r'$\cos x = x$')
    t = t.replace('(sin x)/x', r'$\dfrac{\sin x}{x}$')
    t = t.replace('sin x < x', r'$\sin x < x$')
    t = t.replace('(z_C - z_A) / (z_B - z_A) = cos(π/3) + i sin(π/3)', r'$\\dfrac{z_C - z_A}{z_B - z_A} = \\cos\\dfrac{\\pi}{3} + i\\sin\\dfrac{\\pi}{3}$')
    t = t.replace('cos^2θ + sin^2θ = 1', r'$\\cos^2\\theta + \\sin^2\\theta = 1$')
    t = t.replace('cos^2θ + sin^2θ', r'$\\cos^2\\theta + \\sin^2\\theta$')
    t = t.replace('cos^2x', r'$\\cos^2 x$')
    t = t.replace('||u + v|| <= ||u|| + ||v||', r'$\\|\\vec{u} + \\vec{v}\\| \\le \\|\\vec{u}\\| + \\|\\vec{v}\\|$')
    t = t.replace('0 <= $P(A)$ <= 1', r'$0 \le P(A) \le 1$')
    t = t.replace('0 <= P(A) <= 1', r'$0 \le P(A) \le 1$')
    t = t.replace('2^(n-1)', r'2^{n-1}')
    t = t.replace('4^(k+1) - 1', r'$4^{k+1} - 1$')
    t = t.replace('4^(k+1)', r'4^{k+1}')
    t = t.replace('2^($x^2 - 3x$) <= 1/4', r'$2^{x^2 - 3x} \le \dfrac{1}{4}$')
    t = t.replace('2^($x^2 - 3x$)', r'$2^{x^2 - 3x}$')
    t = t.replace('2^(-2)', r'2^{-2}')
    t = t.replace('x <= 1 ឬ x >= 2', r'$x \le 1$ ឬ $x \ge 2$')
    t = t.replace('1 <= x <= 2', r'$1 \le x \le 2$')
    t = t.replace('2^x + 2^(x+1) = 24', r'$2^x + 2^{x+1} = 24$')
    t = t.replace('6^(x+y)', r'6^{x+y}')
    t = t.replace('\\dfrac{2}{3}^(x-y)', r'\\left(\\dfrac{2}{3}\\right)^{x-y}')
    t = t.replace('log_a(b) = log_c(b) / log_c(a) = ln(b) / ln(a)', r'$\\log_a b = \\dfrac{\\log_c b}{\\log_c a} = \\dfrac{\\ln b}{\\ln a}$')
    t = t.replace('(ln 3 / ln 2) * (ln 4 / ln 3) = ln 4 / ln 2 = log_2(4) = 2', r'$\\dfrac{\\ln 3}{\\ln 2} \\times \\dfrac{\\ln 4}{\\ln 3} = \\dfrac{\\ln 4}{\\ln 2} = \\log_2 4 = 2$')
    t = t.replace('$2^{x^2 - 3x}$ <= 2^{-2} $\\implies x^2 - 3x$ <= -2 $\\implies x^2 - 3x + 2$ <= 0 $\\implies$ $1 \\le x \\le 2$', r'$2^{x^2 - 3x} \\le 2^{-2} \\implies x^2 - 3x \\le -2 \\implies x^2 - 3x + 2 \\le 0 \\implies 1 \\le x \\le 2$')
    t = t.replace('2^($x^2 - 3x$) <= 2^(-2) $\\implies x^2 - 3x$ <= -2 $\\implies x^2 - 3x + 2$ <= 0 $\\implies$ 1 <= x <= 2', r'$2^{x^2 - 3x} \\le 2^{-2} \\implies x^2 - 3x \\le -2 \\implies x^2 - 3x + 2 \\le 0 \\implies 1 \\le x \\le 2$')
    t = t.replace(r'$\det(R_\theta)$ = cos(θ)*cos(θ) - (-\sin\theta)*sin(θ) = $\cos^2\theta + \sin^2\theta = 1$', r'$\det(R_\theta) = \cos\theta \cos\theta - (-\sin\theta)\sin\theta = \cos^2\theta + \sin^2\theta = 1$')
    t = t.replace('det(R_θ) = cos(θ)*cos(θ) - (-sin θ)*sin(θ) = cos^2θ + sin^2θ = 1', r'$\\det(R_\\theta) = \\cos\\theta \\cos\\theta - (-\\sin\\theta)\\sin\\theta = \\cos^2\\theta + \\sin^2\\theta = 1$')
    t = t.replace('det(R_θ)', r'$\\det(R_\\theta)$')
    t = t.replace('sin θ', r'\\sin\\theta')
    t = t.replace('cos θ', r'\\cos\\theta')
    t = t.replace('tan θ', r'\\tan\\theta')

    # 7. Process math segments inside $ ... $
    def math_replacer(match):
        m = match.group(1)
        # convert unescaped trig/log words: sin, cos, tan, cot, ln, log
        m = re.sub(r'(?<!\\)\b(sin|cos|tan|cot|ln|log|exp|arcsin|arccos|arctan)\b', r'\\\1', m)
        # fix e^(...) exponents
        m = re.sub(r'e\^\(([^\)]+)\)', r'e^{\1}', m)
        # fix general var^(...) exponents
        m = re.sub(r'([a-zA-Z0-9])\^\(([^\)]+)\)', r'\1^{\2}', m)
        # replace >= and <=
        m = m.replace('>=', r'\ge ')
        m = m.replace('<=', r'\le ')
        # replace pi, theta, alpha, beta inside math
        m = m.replace('π', r'\pi')
        m = m.replace('θ', r'\theta')
        m = m.replace('α', r'\alpha')
        m = m.replace('β', r'\beta')
        # replace raw sqrt inside math: √(expr) -> \sqrt{expr}
        m = re.sub(r'√\(([^)]+)\)', r'\\sqrt{\1}', m)
        m = re.sub(r'√([a-zA-Z0-9]+)', r'\\sqrt{\1}', m)
        # replace * with \cdot where it means multiplication
        m = re.sub(r'(?<=[a-zA-Z0-9\)\}])\s*\*\s*(?=[a-zA-Z0-9\(\{])', r' \\cdot ', m)
        return f"${m}$"
    
    t = re.sub(r'\$([^\$]+)\$', math_replacer, t)
    
    # Outside math: check for stray raw sqrt
    t = re.sub(r'(?<!\$)√\(([^)]+)\)', r'$\\sqrt{\1}$', t)
    t = re.sub(r'(?<!\$)√([0-9]+)', r'$\\sqrt{\1}$', t)
    
    return t

with open('data/courses.json', 'r', encoding='utf-8') as f:
    courses = json.load(f)

for c in courses:
    for ch in c.get('chapters', []):
        for les in ch.get('lessons', []):
            lid = les['id']
            if lid in ALL_CUSTOM:
                les['quiz'] = ALL_CUSTOM[lid]
            else:
                for q in les.get('quiz', []):
                    q['question'] = sanitize_math(q.get('question', ''))
                    q['options'] = [sanitize_math(opt) for opt in q.get('options', [])]
                    q['explanation'] = sanitize_math(q.get('explanation', ''))

# Scan for remaining issues
patterns = {
    'raw_integral': r'∫',
    'slash_frac_parens': r'\(\d+/\d+\)',
    'exponent_parens': r'[a-zA-Z0-9]\^\([^\)]+\)',
    'raw_trig': r'(?<!\\)\b(sin|cos|tan|cot|ln|log)\b',
    'raw_sqrt': r'√',
    'bad_lim': r'(?<!\\)\blim\b|\\lim_(?!\\limits)',
    'raw_plusminus': r'±',
    'raw_delta': r'Δ',
    'raw_sigma': r'Σ',
    'raw_inequality': r'(>=|<=)',
}

remaining_issues = {k: [] for k in patterns}

for c in courses:
    for ch in c.get('chapters', []):
        for les in ch.get('lessons', []):
            for qi, q in enumerate(les.get('quiz', [])):
                items = [('Q', q.get('question', '')), ('Exp', q.get('explanation', ''))] + [(f'Opt{oi}', opt) for oi, opt in enumerate(q.get('options', []))]
                for label, txt in items:
                    for p_name, regex in patterns.items():
                        if re.search(regex, txt):
                            remaining_issues[p_name].append((c['id'], les['id'], qi+1, label, txt))

print("\n=== REMAINING ISSUES SCAN ===")
total_rem = 0
for k, v in remaining_issues.items():
    print(f"  {k:20}: {len(v)}")
    total_rem += len(v)

print(f"\nTotal remaining items: {total_rem}")

# Check unbalanced dollars
unbalanced = []
for c in courses:
    for ch in c.get('chapters', []):
        for les in ch.get('lessons', []):
            for qi, q in enumerate(les.get('quiz', [])):
                for field, txt in [('Q', q.get('question', '')), ('Exp', q.get('explanation', ''))] + [(f'Opt{oi}', opt) for oi, opt in enumerate(q.get('options', []))]:
                    if txt.count('$') % 2 != 0:
                        unbalanced.append((c['id'], les['id'], qi+1, field, txt))

print(f"Total unbalanced strings: {len(unbalanced)}")
if unbalanced:
    for u in unbalanced[:10]:
        print(f"  {u[0]} {u[1]} Q{u[2]} {u[3]}: {u[4]}")
    sys.exit(1)

# Write to courses.json
with open('data/courses.json', 'w', encoding='utf-8') as f:
    json.dump(courses, f, ensure_ascii=False, indent=2)

print("\n>>> SUCCESSFULLY WRITTEN UPDATED data/courses.json! <<<")
