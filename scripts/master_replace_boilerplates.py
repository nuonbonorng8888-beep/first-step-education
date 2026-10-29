# -*- coding: utf-8 -*-
"""
Master Engine: Eliminate all boilerplate/essay Khmer questions and replace
with authentic numerical/algebraic calculation questions with KaTeX and clear answers.
"""
import json
import re
import random
import math
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

BP_PATTERNS = [
    'តើលក្ខខណ្ឌចម្បងនៃ',
    'តើការអនុវត្តរូបមន្តត្រូវគោរពតាមវិធានណា',
    'តើវិធីសាស្ត្រគន្លឹះក្នុងការដោះស្រាយលំហាត់',
    'តើកំហុសទូទៅបំផុតដែលសិស្សគួរប្រុងប្រយ័ត្នក្នុង',
    'ក្នុងការវាយតម្លៃសមត្ថភាព (PISA)',
    'សំណួរអនុវត្តពង្រឹងសមត្ថភាពទី',
    'ផ្អែកលើនិយមន័យ និងទ្រឹស្តីបទគ្រឹះនៃ',
    'ត្រូវពិនិត្យដែនកំណត់ និងលក្ខខណ្ឌផ្ទៀងផ្ទាត់នៃ',
    'ការអនុវត្តវិធីសាស្ត្រតក្កវិជ្ជា និងជំហានគណនាតាមរូបមន្តស្ដង់ដារ',
    'ការច្រឡំសញ្ញាបូក-ដក និងការមិនផ្ទៀងផ្ទាត់លក្ខខណ្ឌនៃ',
    'ជំនាញវិភាគទិន្នន័យ គំរូគណិតវិទ្យា',
    'ចម្លើយផ្ទៀងផ្ទាត់ត្រឹមត្រូវតាមទ្រឹស្តីបទនៃ'
]

def is_boilerplate(q):
    text = q.get('question', '')
    opts = q.get('options', [])
    all_t = text + ' ' + ' '.join(opts)
    return any(p in all_t for p in BP_PATTERNS)

def detect_domain(les_id, pt_title):
    t = (les_id + ' ' + pt_title).lower()
    
    if any(k in t for k in ['លីមីត', 'limit', '\\lim']):
        return 'limit'
    if any(k in t for k in ['ដេរីវេ', 'derivative', "f'"]):
        return 'derivative'
    if any(k in t for k in ['អាំងតេក្រាល', 'integral', 'ព្រីមីទីវ', '\\int']):
        return 'integral'
    if any(k in t for k in ['កុំផ្លិច', 'complex', 'i^2']):
        return 'complex'
    if any(k in t for k in ['ស្វ៊ីត', 'sequence', 'u_n', 'នព្វន្ត', 'ធរណីមាត្រ']):
        return 'sequence'
    if any(k in t for k in ['ម៉ាទ្រីស', 'matrix', 'ដេទែមីណង់', 'determinant']):
        return 'matrix'
    if any(k in t for k in ['ត្រីកោណមាត្រ', 'trigonometry', '\\sin', '\\cos', '\\tan', 'រ៉ាដ្យង់', 'មុំ']):
        return 'trigonometry'
    if any(k in t for k in ['ប្រូបាប', 'ស្ថិតិ', 'probability', 'statistics', 'មធ្យម', 'បន្សំ', 'ចាត់', 'ឡុកឡាក់']):
        return 'probability'
    if any(k in t for k in ['វ៉ិចទ័រ', 'vector', 'លំហ', 'ប្លង់', 'បន្ទាត់ក្នុងលំហ', 'កូអរដោនេ']):
        return 'vector_space'
    if any(k in t for k in ['អិចស្ប៉ូណង់ស្យែល', 'លោការីត', 'exp', 'log', '\\log', '\\ln']):
        return 'exp_log'
    if any(k in t for k in ['កោនិក', 'ប៉ារ៉ាបូល', 'អេលីប', 'អ៊ីពែបូល', 'conic']):
        return 'conics'
    if any(k in t for k in ['សមីការឌីផេរ៉ង់ស្យែល', 'differential']):
        return 'diff_eq'
    if any(k in t for k in ['ឫសការេ', 'រ៉ាឌីកាល់', 'radical', 'sqrt']):
        return 'radicals'
    if any(k in t for k in ['ប្រភាគ', 'សនិទាន', 'fraction', 'rational']):
        return 'fractions'
    if any(k in t for k in ['ចំនួនគត់', 'integer']):
        return 'integers'
    if any(k in t for k in ['សមីការ', 'វិសមីការ', 'ប្រព័ន្ធសមីការ', 'ពហុធា', 'ដឺក្រេ']):
        return 'algebra'
    if any(k in t for k in ['ផ្ទៃក្រឡា', 'មាឌ', 'បរិមាត្រ', 'ត្រីកោណ', 'រង្វង់', 'geometry']):
        return 'geometry'
    
    # Grade based fallback
    if 'g7' in les_id:
        return 'g7_general'
    if 'g8' in les_id:
        return 'g8_general'
    if 'g9' in les_id:
        return 'g9_general'
    if 'g11' in les_id or 'g12' in les_id:
        return 'calculus_algebra'
    return 'general_math'

def generate_clean_math_question(domain, point_title, seed):
    """
    Generate authentic math question with numbers and clean options.
    """
    s = seed
    
    # 1. LIMITS
    if domain == 'limit':
        cases = [
            lambda: {
                "q": f"គណនាលីមីត $\\lim_{{x \\to {1 + s%4}}} ({2 + s%3}x^2 - {3 + s%4}x + {1 + s%5})$ ៖",
                "ans": f"{(2 + s%3)*(1 + s%4)**2 - (3 + s%4)*(1 + s%4) + (1 + s%5)}",
                "exp": f"ជំនួស $x = {1 + s%4}$ ចូលក្នុងកន្សោមពហុធាដើម្បីទាញរកតម្លៃលីមីត។"
            },
            lambda: {
                "q": f"គណនាលីមីត $\\lim_{{x \\to {2 + s%4}}} \\dfrac{{x^2 - {(2 + s%4)**2}}}{{x - {2 + s%4}}}$ ៖",
                "ans": f"{2 * (2 + s%4)}",
                "exp": f"បំបែករាងមិនកំណត់ $\\dfrac{{0}}{{0}}$ ដោយសម្រួលកត្តា $(x - {2 + s%4})$ ៖ បាន $\\lim_{{x \\to {2 + s%4}}} (x + {2 + s%4}) = {2 * (2 + s%4)}$។"
            },
            lambda: {
                "q": f"គណនាលីមីត $\\lim_{{x \\to 0}} \\dfrac{{\\sin({2 + s%5}x)}}{{x}}$ ៖",
                "ans": f"{2 + s%5}",
                "exp": f"តាមរូបមន្តគ្រឹះនៃលីមីតត្រីកោណមាត្រ $\\lim_{{x \\to 0}} \\dfrac{{\\sin(kx)}}{{x}} = k$ ដូចនេះលីមីតស្មើ ${2 + s%5}$។"
            },
            lambda: {
                "q": f"គណនាលីមីត $\\lim_{{x \\to +\\infty}} \\dfrac{{{3 + s%4}x^2 + 1}}{{x^2 + 5}}$ ៖",
                "ans": f"{3 + s%4}",
                "exp": f"ចែកភាគយក និងភាគបែងនឹង $x^2$ នាំឱ្យលីមីតស្មើផលធៀបមេគុណដឺក្រេខ្ពស់បំផុត ៖ ${3 + s%4}$។"
            }
        ]
        c = cases[s % len(cases)]()
        val_str = c['ans']
        try:
            val_num = int(val_str)
            corr = f"${val_num}$"
            dists = [f"${val_num - 1}$", f"${val_num + 2}$", f"${val_num * 2}$"]
        except:
            corr = f"${val_str}$"
            dists = [f"${val_str} + 1$", f"-${val_str}$", "$0$"]
        return {"q": c['q'], "ans": corr, "dists": dists, "exp": c['exp']}

    # 2. DERIVATIVES
    elif domain == 'derivative':
        cases = [
            lambda: {
                "q": f"រកដេរីវេនៃអនុគមន៍ $f(x) = {2 + s%4}x^3 - {3 + s%3}x + 5$ ៖",
                "ans": f"$f'(x) = {(2 + s%4)*3}x^2 - {3 + s%3}$",
                "dists": [
                    f"$f'(x) = {(2 + s%4)*3}x^2 + {3 + s%3}$",
                    f"$f'(x) = {(2 + s%4)}x^2 - {3 + s%3}$",
                    f"$f'(x) = {(2 + s%4)*3}x^3 - {3 + s%3}$"
                ],
                "exp": f"អនុវត្តរូបមន្ត $(x^n)' = n x^{{n-1}}$ និង $(ax)' = a$ ៖ $f'(x) = {(2 + s%4)*3}x^2 - {3 + s%3}$។"
            },
            lambda: {
                "q": f"គណនាតម្លៃដេរីវេ $f'({1 + s%3})$ នៃអនុគមន៍ $f(x) = {2 + s%3}x^2 - 3x + 1$ ៖",
                "val": 2 * (2 + s%3) * (1 + s%3) - 3,
                "x0": 1 + s%3,
                "exp": f"ដេរីវេ $f'(x) = {2*(2 + s%3)}x - 3$។ ជំនួស $x = {1 + s%3}$ ៖ បាន $f'({1 + s%3}) = {2*(2 + s%3)*(1 + s%3) - 3}$។"
            },
            lambda: {
                "q": f"រកដេរីវេនៃអនុគមន៍ $f(x) = \\cos({2 + s%4}x)$ ៖",
                "ans": f"$f'(x) = -{2 + s%4}\\sin({2 + s%4}x)$",
                "dists": [
                    f"$f'(x) = {2 + s%4}\\sin({2 + s%4}x)$",
                    f"$f'(x) = -\\sin({2 + s%4}x)$",
                    f"$f'(x) = -{2 + s%4}\\cos({2 + s%4}x)$"
                ],
                "exp": f"អនុវត្តរូបមន្ត $(\\cos(ax))' = -a\\sin(ax)$ ៖ បាន $f'(x) = -{2 + s%4}\\sin({2 + s%4}x)$។"
            }
        ]
        c = cases[s % len(cases)]()
        if 'ans' in c: return c
        v = c['val']
        return {"q": c['q'], "ans": f"${v}$", "dists": [f"${v - 2}$", f"${v + 3}$", f"${v - 5}$"], "exp": c['exp']}

    # 3. INTEGRALS
    elif domain == 'integral':
        k = 2 + (s % 4)
        cases = [
            lambda: {
                "q": f"គណនាអាំងតេក្រាល $\\int ({k * 3}x^2 + {k * 2}x)\, dx$ ៖",
                "ans": f"${k}x^3 + {k}x^2 + C$",
                "dists": [
                    f"${k * 3}x^3 + {k * 2}x^2 + C$",
                    f"${k}x^3 - {k}x^2 + C$",
                    f"${k * 2}x^3 + {k}x^2 + C$"
                ],
                "exp": f"អនុវត្តរូបមន្ត $\\int x^n dx = \\dfrac{{x^{{n+1}}}}{{n+1}} + C$ ៖ បាន ${k}x^3 + {k}x^2 + C$។"
            },
            lambda: {
                "q": f"គណនាអាំងតេក្រាលកំណត់ $\\int_0^{{2}} {3 * k}x^2\, dx$ ៖",
                "ans": f"${k * 8}$",
                "dists": [f"${k * 8 - 4}$", f"${k * 8 + 6}$", f"${k * 4}$"],
                "exp": f"ព្រីមីទីវ ៖ $[{k}x^3]_0^2 = {k}(2^3) - 0 = {k * 8}$។"
            }
        ]
        return cases[s % len(cases)]()

    # 4. COMPLEX NUMBERS
    elif domain == 'complex':
        a = 2 + (s % 5)
        b = 1 + (s % 6)
        cases = [
            lambda: {
                "q": f"គេឱ្យចំនួនកុំផ្លិច $z_1 = {a} + {b}i$ និង $z_2 = {b} - {a}i$ ។ គណនាផលបូក $z_1 + z_2$ ៖",
                "ans": f"${a + b} + {b - a}i$" if (b - a) >= 0 else f"${a + b} - {a - b}i$",
                "dists": [
                    f"${a - b} + {b + a}i$",
                    f"${a + b} + {b + a}i$",
                    f"${a * b} - {a}i$"
                ],
                "exp": f"បូកផ្នែកពិតជាមួយផ្នែកពិត និងផ្នែកនិម្មិតជាមួយផ្នែកនិម្មិត។"
            },
            lambda: {
                "q": f"គណនាម៉ូឌុលនៃចំនួនកុំផ្លិច $z = 3 + 4i$ ៖",
                "ans": f"$5$",
                "dists": [f"$7$", f"$\\sqrt{7}$", f"$25$"],
                "exp": f"ម៉ូឌុល $|z| = \\sqrt{{3^2 + 4^2}} = \\sqrt{{9 + 16}} = 5$។"
            },
            lambda: {
                "q": f"រកកន្សោមឆ្លាស់ $\\bar{{z}}$ នៃចំនួនកុំផ្លិច $z = {a} - {b}i$ ៖",
                "ans": f"${a} + {b}i$",
                "dists": [f"$-{a} - {b}i$", f"$-{a} + {b}i$", f"${b} - {a}i$"],
                "exp": f"កន្សោមឆ្លាស់ប្តូរសញ្ញាផ្នែកនិម្មិត ៖ $\\bar{{z}} = {a} + {b}i$។"
            }
        ]
        return cases[s % len(cases)]()

    # 5. SEQUENCES
    elif domain == 'sequence':
        a = 2 + (s % 4)
        b = 1 + (s % 5)
        n = 3 + (s % 4)
        cases = [
            lambda: {
                "q": f"គេឱ្យស្វ៊ីត $u_n = {a}n + {b}$ ។ គណនាតួទី {n} ($u_{{{n}}}$) នៃស្វ៊ីតនេះ ៖",
                "ans": f"${a * n + b}$",
                "dists": [f"${a * n + b - a}$", f"${a * n + b + a}$", f"${a * n + b - 1}$"],
                "exp": f"ជំនួស $n = {n}$ ចូលក្នុងរូបមន្ត ៖ $u_{{{n}}} = {a}({n}) + {b} = {a * n + b}$។"
            },
            lambda: {
                "q": f"គេឱ្យស្វ៊ីតនព្វន្ត $(u_n)$ មានតួទីមួយ $u_1 = {b}$ និងផលសងរួម $d = {a}$ ។ គណនាតួទី ៥ ($u_5$) ៖",
                "ans": f"${b + 4 * a}$",
                "dists": [f"${b + 5 * a}$", f"${b + 3 * a}$", f"${b * a}$"],
                "exp": f"តាមរូបមន្តតួទី $n$ នៃស្វ៊ីតនព្វន្ត ៖ $u_5 = u_1 + 4d = {b} + 4({a}) = {b + 4 * a}$។"
            },
            lambda: {
                "q": f"គេឱ្យស្វ៊ីតធរណីមាត្រ $(u_n)$ មានតួទីមួយ $u_1 = {a}$ និងផលធៀបរួម $q = 2$ ។ គណនាតួទី ៤ ($u_4$) ៖",
                "ans": f"${a * 8}$",
                "dists": [f"${a * 6}$", f"${a * 16}$", f"${a * 4}$"],
                "exp": f"តាមរូបមន្តតួទី $n$ នៃស្វ៊ីតធរណីមាត្រ ៖ $u_4 = u_1 \\cdot q^3 = {a} \\cdot (2^3) = {a * 8}$។"
            }
        ]
        return cases[s % len(cases)]()

    # 6. MATRICES
    elif domain == 'matrix':
        a, b, c, d = 1 + s%3, 2 + s%4, 3 + s%2, 1 + s%5
        det = a*d - b*c
        cases = [
            lambda: {
                "q": f"គណនាដេទែមីណង់នៃម៉ាទ្រីស $A = \\begin{{pmatrix}} {a} & {b} \\\\ {c} & {d} \\end{{pmatrix}}$ ៖",
                "ans": f"${det}$",
                "dists": [f"${det + 2}$", f"${det - 3}$", f"${a*d + b*c}$"],
                "exp": f"ដេទែមីណង់ $\\det(A) = ({a})({d}) - ({b})({c}) = {a*d} - {b*c} = {det}$។"
            },
            lambda: {
                "q": f"គេឱ្យម៉ាទ្រីស $A = \\begin{{pmatrix}} {a} & {b} \\\\ {c} & {d} \\end{{pmatrix}}$ ។ គណនាម៉ាទ្រីស $2A$ ៖",
                "ans": f"$\\begin{{pmatrix}} {2*a} & {2*b} \\\\ {2*c} & {2*d} \\end{{pmatrix}}$",
                "dists": [
                    f"$\\begin{{pmatrix}} {2*a} & {b} \\\\ {c} & {2*d} \\end{{pmatrix}}$",
                    f"$\\begin{{pmatrix}} {a+2} & {b+2} \\\\ {c+2} & {d+2} \\end{{pmatrix}}$",
                    f"$\\begin{{pmatrix}} {2*a} & {2*b} \\\\ {c} & {d} \\end{{pmatrix}}$"
                ],
                "exp": f"គុណគ្រប់ធាតុនៃម៉ាទ្រីស $A$ នឹងចំនួនពិត $2$។"
            }
        ]
        return cases[s % len(cases)]()

    # 7. TRIGONOMETRY
    elif domain == 'trigonometry':
        angles = [(30, "\\dfrac{\\pi}{6}", "\\dfrac{1}{2}", "\\dfrac{\\sqrt{3}}{2}"),
                  (45, "\\dfrac{\\pi}{4}", "\\dfrac{\\sqrt{2}}{2}", "\\dfrac{\\sqrt{2}}{2}"),
                  (60, "\\dfrac{\\pi}{3}", "\\dfrac{\\sqrt{3}}{2}", "\\dfrac{1}{2}")]
        deg, rad, s_val, c_val = angles[s % len(angles)]
        cases = [
            lambda: {
                "q": f"បំប្លែងមុំ ${deg}^\\circ$ ជារ៉ាដ្យង់ ៖",
                "ans": f"${rad}\\text{{ rad}}$",
                "dists": [f"$\\dfrac{{\\pi}}{{{deg//10}}}\\text{{ rad}}$", f"$\\dfrac{{\\pi}}{{2}}\\text{{ rad}}$", f"${rad.replace('3', '5')}\\text{{ rad}}$"],
                "exp": f"រូបមន្តបំប្លែង ៖ $\\alpha = {deg} \\times \\dfrac{{\\pi}}{{180}} = {rad}\\text{{ rad}}$។"
            },
            lambda: {
                "q": f"គណនាតម្លៃនៃ $\\sin({deg}^\\circ)$ ៖",
                "ans": f"${s_val}$",
                "dists": [f"${c_val}$", f"$1$", f"$0$"],
                "exp": f"តម្លៃអនុគមន៍ត្រីកោណមាត្រនៃមុំពិសេស ៖ $\\sin({deg}^\\circ) = {s_val}$។"
            },
            lambda: {
                "q": f"គណនាតម្លៃនៃ $\\sin^2({deg}^\\circ) + \\cos^2({deg}^\\circ)$ ៖",
                "ans": f"$1$",
                "dists": [f"$0$", f"${s_val}$", f"$2$"],
                "exp": f"រូបមន្តគ្រឹះត្រីកោណមាត្រ $\\sin^2 x + \\cos^2 x = 1$ ចំពោះគ្រប់មុំ $x$។"
            }
        ]
        return cases[s % len(cases)]()

    # 8. PROBABILITY & STATISTICS
    elif domain == 'probability':
        n = 4 + (s % 4)
        r = 2
        comb = math.comb(n, r)
        cases = [
            lambda: {
                "q": f"គណនាតម្លៃនៃបន្សំ $C({n}, {r})$ ៖",
                "ans": f"${comb}$",
                "dists": [f"${comb + 3}$", f"${comb - 2}$", f"${comb * 2}$"],
                "exp": f"រូបមន្តបន្សំ ៖ $C({n}, {r}) = \\dfrac{{{n}!}}{{{r}!({n}-{r})!}} = \\dfrac{{{n} \\times {n-1}}}{{2}} = {comb}$។"
            },
            lambda: {
                "q": "គេបោះគ្រាប់ឡុកឡាក់មួយគ្រាប់ស្មើដៃមួយដង។ រកប្រូបាបដែលទទួលបានលេខគូ ៖",
                "ans": "$\\dfrac{1}{2}$",
                "dists": ["$\\dfrac{1}{3}$", "$\\dfrac{1}{6}$", "$\\dfrac{2}{3}$"],
                "exp": "ករណីស្របមាន ៣ គឺ $\\{2, 4, 6\\}$ លើករណីអាច ៦ ៖ $P = \\dfrac{3}{6} = \\dfrac{1}{2}$។"
            }
        ]
        return cases[s % len(cases)]()

    # 9. EXPONENTIAL & LOGARITHM
    elif domain == 'exp_log':
        base = 2 + (s % 3)
        exp_val = 2 + (s % 3)
        res_val = base ** exp_val
        cases = [
            lambda: {
                "q": f"គណនាតម្លៃនៃ $\\log_{{{base}}}({res_val})$ ៖",
                "ans": f"${exp_val}$",
                "dists": [f"${exp_val + 1}$", f"${exp_val - 1}$", f"${res_val}$"],
                "exp": f"ដោយសារ ${base}^{{{exp_val}}} = {res_val}$ នាំឱ្យ $\\log_{{{base}}}({res_val}) = {exp_val}$។"
            },
            lambda: {
                "q": f"ដោះស្រាយសមីការ ${base}^x = {res_val}$ ៖",
                "ans": f"$x = {exp_val}$",
                "dists": [f"$x = {exp_val + 1}$", f"$x = {exp_val - 1}$", f"$x = {res_val}$"],
                "exp": f"សរសេរជាស្វ័យគុណគោលដូចគ្នា ៖ ${base}^x = {base}^{{{exp_val}}} \\iff x = {exp_val}$។"
            }
        ]
        return cases[s % len(cases)]()

    # 10. VECTORS & 3D GEOMETRY
    elif domain == 'vector_space':
        x1, y1 = 1 + s%3, 2 + s%4
        x2, y2 = 3 + s%2, 1 + s%3
        cases = [
            lambda: {
                "q": f"គេឱ្យវ៉ិចទ័រ $\\vec{{u}} = ({x1}, {y1})$ និង $\\vec{{v}} = ({x2}, -{y2})$ ។ គណនាផលគុណស្កាលែ $\\vec{{u}} \\cdot \\vec{{v}}$ ៖",
                "ans": f"${x1*x2 - y1*y2}$",
                "dists": [f"${x1*x2 + y1*y2}$", f"${x1*x2 - y1*y2 + 2}$", f"${x1*x2 - y1*y2 - 3}$"],
                "exp": f"ផលគុណស្កាលែ $\\vec{{u}} \\cdot \\vec{{v}} = ({x1})({x2}) + ({y1})(-{y2}) = {x1*x2} - {y1*y2} = {x1*x2 - y1*y2}$។"
            },
            lambda: {
                "q": f"គណនាប្រវែងវ៉ិចទ័រ $\\vec{{u}} = (3, 4)$ ៖",
                "ans": f"$5$",
                "dists": [f"$7$", f"$\\sqrt{7}$", f"$25$"],
                "exp": f"ប្រវែងវ៉ិចទ័រ ៖ $|\\vec{{u}}| = \\sqrt{{3^2 + 4^2}} = \\sqrt{{9 + 16}} = 5$។"
            }
        ]
        return cases[s % len(cases)]()

    # 11. GENERAL ALGEBRA / EQUATIONS / RADICALS (Grades 7, 8, 9, 10, 11, 12)
    else:
        a = 2 + (s % 5)
        b = 1 + (s % 6)
        c = 3 + (s % 4)
        cases = [
            lambda: {
                "q": f"ដោះស្រាយសមីការ $x^2 - {a**2} = 0$ ក្នុង $\\mathbb{{R}}$ ៖",
                "ans": f"$x = \\pm {a}$",
                "dists": [f"$x = {a}$", f"$x = -{a}$", f"$x = \\pm {a**2}$"],
                "exp": f"ដាក់ជាផលគុណកត្តា $(x - {a})(x + {a}) = 0 \\iff x = \\pm {a}$។"
            },
            lambda: {
                "q": f"ពង្រាយកន្សោម $(x + {a})^2$ ៖",
                "ans": f"$x^2 + {2*a}x + {a**2}$",
                "dists": [
                    f"$x^2 + {a**2}$",
                    f"$x^2 + {a}x + {a**2}$",
                    f"$x^2 + {2*a}x + {2*a}$"
                ],
                "exp": f"តាមរូបមន្ត $(A + B)^2 = A^2 + 2AB + B^2$ ៖ បាន $x^2 + {2*a}x + {a**2}$។"
            },
            lambda: {
                "q": f"គណនាតម្លៃនៃកន្សោម $A = {a}x - {b}$ ត្រង់ $x = {c}$ ៖",
                "ans": f"${a * c - b}$",
                "dists": [f"${a * c + b}$", f"${a * c - b + 2}$", f"${a * c - b - 3}$"],
                "exp": f"ជំនួស $x = {c}$ ចូលក្នុងកន្សោម ៖ $A = {a}({c}) - {b} = {a * c - b}$។"
            },
            lambda: {
                "q": f"សម្រួលកន្សោម $\\sqrt{{{a**2 * 2}}}$ ៖",
                "ans": f"${a}\\sqrt{{2}}$",
                "dists": [f"${2}\\sqrt{{{a}}}$", f"${a*2}$", f"${a**2}\\sqrt{{2}}$"],
                "exp": f"$\\sqrt{{{a**2 * 2}}} = \\sqrt{{{a}^2 \\times 2}} = {a}\\sqrt{{2}}$។"
            },
            lambda: {
                "q": f"ដោះស្រាយសមីការដឺក្រេទីមួយ $2x + {b} = {2*a + b}$ ៖",
                "ans": f"$x = {a}$",
                "dists": [f"$x = {a + 1}$", f"$x = {a - 1}$", f"$x = {2*a}$"],
                "exp": f"$2x = {2*a + b} - {b} = {2*a} \\iff x = {a}$។"
            }
        ]
        return cases[s % len(cases)]()

def process_point_quizzes(data):
    total_replaced = 0
    total_points_updated = 0
    
    for les_id, points in data.items():
        if not isinstance(points, dict):
            continue
        for p_num, q_list in points.items():
            if not isinstance(q_list, list):
                continue
                
            p_title = q_list[0].get('pointTitle', f'Point {p_num}') if q_list else f'Point {p_num}'
            domain = detect_domain(les_id, p_title)
            
            # Separate real items vs boilerplate items
            real_items = [q for q in q_list if not is_boilerplate(q)]
            bp_count = len(q_list) - len(real_items)
            
            if bp_count == 0:
                continue
                
            total_points_updated += 1
            total_replaced += bp_count
            
            # We need to reach 10 questions using fresh, authentic math questions
            needed = 10 - len(real_items)
            new_items = []
            
            for k in range(needed):
                seed = k * 7 + int(p_num) * 13 + hash(les_id) % 100
                mq = generate_clean_math_question(domain, p_title, seed)
                
                # Format options with randomized position
                corr_ans = mq['ans']
                dists = list(mq['dists'])[:3]
                while len(dists) < 3:
                    dists.append("$0$")
                    
                corr_pos = (len(real_items) + k * 2) % 4
                options = dists[:]
                options.insert(corr_pos, corr_ans)
                
                new_items.append({
                    "id": f"q{len(real_items) + k + 1}",
                    "questionNumber": len(real_items) + k + 1,
                    "pointNumber": int(p_num) if p_num.isdigit() else 1,
                    "pointTitle": p_title,
                    "level": "កម្រិត ២ (អនុវត្ត)",
                    "question": mq['q'],
                    "options": options,
                    "correct": corr_pos,
                    "explanation": mq['exp']
                })
                
            # Assemble full 10 questions
            full_10 = real_items + new_items
            for idx, q in enumerate(full_10[:10]):
                q['questionNumber'] = idx + 1
                q['id'] = f"q{idx + 1}"
                
            points[p_num] = full_10[:10]
            
    return total_points_updated, total_replaced

if __name__ == '__main__':
    in_path = 'data/point_quizzes.json'
    print(f"Reading {in_path}...")
    with open(in_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    pts_count, rep_count = process_point_quizzes(data)
    print(f"Updated {pts_count} points, replaced {rep_count} boilerplate questions!")
    
    # Save back
    with open(in_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved changes to {in_path} successfully!")
