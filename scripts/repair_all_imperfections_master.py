import json
import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def clean_punctuation(q_txt):
    t = q_txt.strip()
    t = t.replace('។ ៖', '។')
    t = t.replace('៖ ៖', '៖')
    t = t.replace('។ ៖', '។')
    t = t.replace('។។', '។')
    t = re.sub(r'៖\s*៖+', '៖', t)
    t = re.sub(r'។\s*៖\s*$', ' ៖', t)
    t = re.sub(r'\s+', ' ', t)
    if not t.endswith('៖') and not t.endswith('?'):
        t = t.rstrip('។') + ' ៖'
    return t

def clean_distractor(opt):
    s = opt.strip()
    replacements = [
        (r'\dfrac{1}{(2n+3)(2n+1)+1}', r'\dfrac{2}{(2n+3)(2n+1)}'),
        (r'\dfrac{\pi}{4+1}', r'\dfrac{\pi}{3}'),
        (r'\dfrac{5\pi}{6+1}', r'\dfrac{5\pi}{4}'),
        (r'-\dfrac{3\pi}{4+1}', r'-\dfrac{\pi}{4}'),
        (r'\dfrac{\pi}{2+1}', r'\dfrac{\pi}{3}'),
        (r'\dfrac{\pi}{3+1}', r'\dfrac{\pi}{6}'),
        (r'\dfrac{3\pi}{4+1}', r'\dfrac{2\pi}{3}'),
        (r'\dfrac{17}{(2x + 5)^2+1}', r'\dfrac{17}{(2x + 5)}'),
        (r'\dfrac{n(n+1)(n+2)}{3+1}', r'\dfrac{n(n+1)(n+2)}{4}'),
        (r'\dfrac{1 + 1}{k(k+1)}', r'\dfrac{2}{k(k+1)}'),
        (r'\dfrac{n}{n+1+1}', r'\dfrac{n}{n+2}'),
        (r'\dfrac{n}{2n+1+1}', r'\dfrac{n}{2n+3}'),
        (r'\dfrac{1}{e+1}', r'\dfrac{1}{e^2}'),
        (r'\dfrac{2 + b}{a + b+1}', r'\dfrac{2 + b}{a + 1}'),
        (r'\dfrac{z - 3}{-1+1}', r'\dfrac{z - 3}{-2}'),
        (r'\dfrac{3}{1 + 9x^2+1}', r'\dfrac{3}{1 + 3x^2}'),
        (r'\dfrac{z - 4}{-5+1}', r'\dfrac{z - 4}{-3}'),
        (r'\dfrac{-7}{(x - 3)^2+1}', r'\dfrac{-7}{(x - 3)}'),
        (r'\dfrac{e^2 + 1}{4+1}', r'\dfrac{e^2 + 1}{2}'),
        (r'\dfrac{16 + 1}{3}', r'\dfrac{16}{5}'),
        (r'\dfrac{4 + 1}{3}', r'\dfrac{4}{5}'),
        (r'\dfrac{2S}{b+1}', r'\dfrac{2S}{a}'),
        (r'\dfrac{B + b}{2+1}', r'\dfrac{B + b}{4}'),
        (r'\dfrac{180 \times l}{\pi R+1}', r'\dfrac{180 \times l}{2\pi R}'),
        (r'\dfrac{x + 2}{5+1}', r'\dfrac{x + 2}{4}'),
        (r'\dfrac{BC}{DE+1}', r'\dfrac{BC}{AE}'),
        (r'\dfrac{S}{4\pi+1}', r'\dfrac{S}{2\pi}'),
        (r'\dfrac{-5}{12+1}', r'\dfrac{-5}{6}'),
        (r'\dfrac{y^5}{x^6+1}', r'\dfrac{y^5}{x^4}'),
        (r'\dfrac{a^4}{4b^6+1}', r'\dfrac{a^4}{2b^6}'),
        (r'\dfrac{I}{P \times t+1}', r'\dfrac{I}{2P \times t}'),
        (r'\dfrac{5(x + 1)}{(x - 2)(x + 3)+1}', r'\dfrac{5(x + 1)}{(x - 2)(x - 3)}'),
        (r'\dfrac{4x}{x^2 - 1+1}', r'\dfrac{4x}{x^2 + 1}'),
        (r'\dfrac{x - 1}{x + 2+1}', r'\dfrac{x - 1}{x + 3}'),
        (r'\dfrac{157 + x}{3+1}', r'\dfrac{157 + x}{2}'),
        (r'\dfrac{2}{x^2 - 1+1}', r'\dfrac{2}{x^2 + 1}'),
        (r'\dfrac{1 + 1}{7}', r'\dfrac{2}{7}'),
        (r'\dfrac{1}{\cos x+1}', r'\dfrac{1}{\sin x}'),
        (r'$y = 3x - 5$ (ត្រួត)', r'$y = 3x - 1$'),
    ]
    for target, rep in replacements:
        if target in s:
            s = s.replace(target, rep)
            
    def eval_brace_add(m):
        base = m.group(1)
        sign = m.group(2)
        val = int(m.group(3))
        if base.isdigit():
            new_val = int(base) + (val if sign == '+' else -val)
            return f"{{{new_val}}}"
        return f"{{{base} {sign} {val}}}"
    
    s = re.sub(r'\{([0-9]+)\s*([+-])\s*([0-9]+)\}', eval_brace_add, s)
    return s

def deduplicate_options(opts, correct_idx):
    if len(set(opts)) == 4:
        return opts, correct_idx
    
    corr_val = opts[correct_idx]
    unique_opts = []
    seen = set()
    
    # Keep correct answer first or at its place
    for i, o in enumerate(opts):
        if i == correct_idx:
            unique_opts.append(o)
            seen.add(o)
        elif o not in seen:
            unique_opts.append(o)
            seen.add(o)
        else:
            # Need replacement distractor
            rep = None
            # Check if option is integer
            num_match = re.match(r'^\$?(-?\d+)\$?$', o)
            if num_match:
                v = int(num_match.group(1))
                for delta in [1, -1, 2, -2, 3, -3, 5, -5]:
                    cand = f"${v + delta}$"
                    if cand not in seen and cand != corr_val:
                        rep = cand
                        break
            # Check if fraction
            if not rep:
                for suffix in ['\\text{ rad}', '\\text{ cm}', '\\text{ m}', '']:
                    for alt in ['$0$', '$1$', '$-1$', '$2$', '$-2$', '$\\dfrac{1}{2}$', '$\\dfrac{\\sqrt{3}}{2}$']:
                        cand = alt if not suffix else alt.replace('$', f'{suffix}$')
                        if cand not in seen and cand != corr_val:
                            rep = cand
                            break
                    if rep: break
            if not rep:
                rep = f"{o} (ខុស)"
            unique_opts.append(rep)
            seen.add(rep)
            
    new_corr_idx = unique_opts.index(corr_val)
    return unique_opts, new_corr_idx

def run_master_repairs():
    with open('data/point_quizzes.json', 'r', encoding='utf-8') as f:
        pq = json.load(f)

    # 1. SPECIFIC POINT & QUESTION OVERRIDES
    # Grade 11 Basic, Lesson 1, Point 3:
    if 'les-g11b-1-1' in pq and '3' in pq['les-g11b-1-1']:
        p3 = pq['les-g11b-1-1']['3']
        if len(p3) >= 4:
            # Q3: Single direct question: គណនាផលដក u_{n+1} - u_n
            p3[2]['question'] = "គេឱ្យស្វ៊ីត $(u_n)$ កំណត់ដោយ $u_n = \\dfrac{n}{2n + 1}$ ចំពោះគ្រប់ $n \\ge 1$ ៖ គណនាផលដក $u_{n+1} - u_n$ ៖"
            p3[2]['options'] = [
                "$\\dfrac{1}{(2n+3)(2n+1)}$",
                "$-\\dfrac{1}{(2n+3)(2n+1)}$",
                "$\\dfrac{2}{(2n+3)(2n+1)}$",
                "$\\dfrac{n}{(2n+3)(2n+1)}$"
            ]
            p3[2]['correct'] = 0
            p3[2]['explanation'] = "គណនា $u_{n+1} = \\dfrac{n+1}{2(n+1)+1} = \\dfrac{n+1}{2n+3}$។\n\nផលដក ៖ $u_{n+1} - u_n = \\dfrac{n+1}{2n+3} - \\dfrac{n}{2n+1} = \\dfrac{(n+1)(2n+1) - n(2n+3)}{(2n+3)(2n+1)} = \\dfrac{1}{(2n+3)(2n+1)}$។"

            # Q4: Clean Monotonicity question
            p3[3]['question'] = "គេឱ្យស្វ៊ីត $(u_n)$ កំណត់ដោយ $u_n = \\dfrac{n}{2n + 1}$ ចំពោះគ្រប់ $n \\ge 1$ ៖ តើ $(u_n)$ ជាប្រភេទស្វ៊ីតអ្វី? ៖"
            p3[3]['options'] = [
                "$(u_n)$ ជាស្វ៊ីតកើនដាច់ខាត",
                "$(u_n)$ ជាស្វ៊ីតចុះដាច់ខាត",
                "$(u_n)$ ជាស្វ៊ីតថេរ",
                "$(u_n)$ មិនមែនជាស្វ៊ីតម៉ូណូតូន"
            ]
            p3[3]['correct'] = 0
            p3[3]['explanation'] = "ដោយ $u_{n+1} - u_n = \\dfrac{1}{(2n+3)(2n+1)} > 0$ ចំពោះគ្រប់ $n \\ge 1$ នាំឱ្យ $(u_n)$ ជាស្វ៊ីតកើនដាច់ខាត។"

    # Multi-part (contains 'រួច' or 'ព្រមទាំង') specific fixes:
    multi_part_fixes = {
        ('les-g11b-1-1', '2', 1): {
            'q': "កំណត់រូបមន្តតួទី $n$ ($a_n$) នៃស្វ៊ីត $4, 7, 10, 13, 16, \\dots$ ចំពោះគ្រប់ $n \\in \\mathbb{N}^*$ ៖",
            'opts': ["$3n + 1$", "$3n - 1$", "$4n + 1$", "$3n + 2$"],
            'corr': 0
        },
        ('les-g11b-1-1', '2', 2): {
            'q': "កំណត់រូបមន្តតួទី $n$ ($a_n$) នៃស្វ៊ីត $\\dfrac{3}{4}, \\dfrac{4}{5}, \\dfrac{5}{6}, \\dfrac{6}{7}, \\dots$ ចំពោះគ្រប់ $n \\in \\mathbb{N}^*$ ៖",
            'opts': ["$\\dfrac{n + 2}{n + 3}$", "$\\dfrac{n + 1}{n + 2}$", "$\\dfrac{n + 3}{n + 4}$", "$\\dfrac{n}{n + 3}$"],
            'corr': 0
        },
        ('les-g11b-1-3', '1', 1): {
            'q': "រកផលធៀបរួម $q$ នៃស្វ៊ីតធរណីមាត្រ $2, 6, 18, 54, 162, \\dots$ ៖",
            'opts': ["$3$", "$-3$", "$2$", "$6$"],
            'corr': 0
        },
        ('les-g11b-1-3', '1', 2): {
            'q': "រកផលធៀបរួម $q$ នៃស្វ៊ីតធរណីមាត្រ $80, 40, 20, 10, 5, \\dots$ ៖",
            'opts': ["$\\dfrac{1}{2}$", "$-\\dfrac{1}{2}$", "$2$", "$\\dfrac{1}{4}$"],
            'corr': 0
        },
        ('les-g11b-1-3', '1', 3): {
            'q': "រកផលធៀបរួម $q$ នៃស្វ៊ីតធរណីមាត្រ $5, -10, 20, -40, 80, \\dots$ ៖",
            'opts': ["$-2$", "$2$", "$-4$", "$-5$"],
            'corr': 0
        },
        ('les-g11a-6-1', '4', 2): {
            'q': "ប្រអប់ $B_1$ មានបាល់ក្រហម ៣ និងបាល់ស ២។ ប្រអប់ $B_2$ មានបាល់ក្រហម ២ និងបាល់ស ៤។ គេជ្រើសរើសប្រអប់មួយដោយចៃដន្យ ហើយចាប់យកបាល់មួយ។ រកប្រូបាបដែលចាប់បានបាល់ក្រហម ៖",
            'opts': ["$\\dfrac{7}{15}$", "$-\\dfrac{7}{15}$", "$\\dfrac{8}{15}$", "$\\dfrac{2}{5}$"],
            'corr': 0
        },
        ('les-g11a-7-2', '2', 3): {
            'q': "រកអាគុយម៉ង់នៃចំនួនកុំផ្លិច $z = -2 - 2i$ (ក្នុងចន្លោះ $(-\\pi, \\pi]$) ៖",
            'opts': ["$-\\dfrac{3\\pi}{4}$", "$\\dfrac{3\\pi}{4}$", "$-\\dfrac{\\pi}{4}$", "$\\dfrac{\\pi}{4}$"],
            'corr': 0
        },
        ('les-g12a-6-2', '2', 3): {
            'q': "រកប្រវែងកន្លះអ័ក្សធំ $a$ នៃអេលីប $4x^2 + 9y^2 - 16x + 18y - 11 = 0$ ៖",
            'opts': ["$3$", "$2$", "$9$", "$4$"],
            'corr': 0
        },
        ('les-g12b-3-2', '2', 3): {
            'q': "រកតម្លៃអប្បបរមានៃអនុគមន៍ $f(x) = x - \\ln x$ លើចន្លោះ $(0, +\\infty)$ ៖",
            'opts': ["$1$", "$0$", "$-1$", "$2$"],
            'corr': 0
        },
        ('les-g7-10', '3', 2): {
            'q': "ដោះស្រាយវិសមភាព $2x + 1 \\le 9$ ៖",
            'opts': ["$x \\le 4$", "$x < 4$", "$x \\ge 4$", "$x > 4$"],
            'corr': 0
        },
        ('les-g8-10', '3', 5): {
            'q': "រកមេដ្យាននៃទិន្នន័យដែលបានរៀបតាមលំដាប់ ៖ $2, 4, 7, 9, 11$",
            'opts': ["$7$", "$4$", "$9$", "$6$"],
            'corr': 0
        },
        ('les-g8-11', '1', 4): {
            'q': "ក្នុងថង់មួយមានបាល់ក្រហម ២ គ្រាប់ និងបាល់ស ១ គ្រាប់។ គេចាប់យកបាល់មួយ ហើយដាក់ចូលវិញ បន្ទាប់មកចាប់យកបាល់មួយទៀត។ គណនាប្រូបាបចាប់បានបាល់ពណ៌ក្រហមទាំងពីរលើក ៖",
            'opts': ["$\\dfrac{4}{9}$", "$-\\dfrac{4}{9}$", "$\\dfrac{2}{9}$", "$\\dfrac{1}{9}$"],
            'corr': 0
        },
        ('les-g9-11', '2', 3): {
            'q': "ដោះស្រាយប្រព័ន្ធសមីការរកតម្លៃ $y$ ៖ $\\begin{cases} 2x + 3y = 8 \\\\ 3x + 2y = 7 \\end{cases}$ ៖",
            'opts': ["$y = 2$", "$y = -2$", "$y = 1$", "$y = 3$"],
            'corr': 0
        },
        ('les-g9-15', '1', 1): {
            'q': "ក្នុងត្រីកោណ $ABC$ បន្ទាត់មួយស្របនឹងជ្រុង $[BC]$ កាត់ $[AB]$ ត្រង់ $M$ និងកាត់ $[AC]$ ត្រង់ $N$។ ដឹងថា $AM = 4\\text{ cm}, MB = 2\\text{ cm}$ ($AB = 6\\text{ cm}$)។ គណនាផលធៀបតាឡែស $\\dfrac{AM}{AB}$ ៖",
            'opts': ["$\\dfrac{2}{3}$", "$-\\dfrac{2}{3}$", "$\\dfrac{3}{2}$", "$\\dfrac{1}{3}$"],
            'corr': 0
        },
        ('les-g7-01', '1', 2): {
            'q': "នៅលើបន្ទាត់ចំនួន ចំណុច $C$ មានកូអរដោនេ $+4$ និងចំណុច $B$ មានកូអរដោនេ $0$។ គណនាចម្ងាយ $BC$ ៖",
            'opts': ["$4$", "$2$", "$6$", "$8$"],
            'corr': 0
        },
        ('les-g7-01', '3', 4): {
            'q': "ដីឡូត៍រាងការេមួយមានក្រឡាផ្ទៃ $144\\text{ m}^2$។ គណនាប្រវែងជ្រុង $x$ នៃដីឡូត៍នោះ ៖",
            'opts': ["$12\\text{ m}$", "$10\\text{ m}$", "$14\\text{ m}$", "$16\\text{ m}$"],
            'corr': 0
        },
        ('les-g7-04', '1', 4): {
            'q': "ថ្នាក់រៀនមួយមានសិស្សសរុប ៤០ នាក់ ក្នុងនោះសិស្សស្រីមាន $\\dfrac{3}{5}$ នៃសិស្សសរុប។ សរសេរផលធៀបចំនួនសិស្សប្រុសធៀបនឹងសិស្សសរុបជាប្រភាគសម្រួលមិនបាន ៖",
            'opts': ["$\\dfrac{2}{5}$", "$-\\dfrac{2}{5}$", "$\\dfrac{3}{5}$", "$\\dfrac{1}{5}$"],
            'corr': 0
        },
        ('les-g7-05', '3', 4): {
            'q': "គណនាតម្លៃនៃកន្សោម $E = 2 + \\dfrac{3}{5} \\times 5$ ៖",
            'opts': ["$5$", "$4$", "$6$", "$8$"],
            'corr': 0
        },
        ('les-g7-07', '1', 3): {
            'q': "ឡានដឹកទំនិញមួយផ្ទុកស្រូវចំនួន $80$ បាវ ដោយក្នុងមួយបាវទម្ងន់ $50\\text{ kg}$។ គណនាទម្ងន់ស្រូវសរុបជាតោន ($t$) ៖",
            'opts': ["$4\\text{ t}$", "$3\\text{ t}$", "$5\\text{ t}$", "$40\\text{ t}$"],
            'corr': 0
        },
        ('les-g7-07', '1', 4): {
            'q': "ឡានដឹកទំនិញមួយមានទម្ងន់ទទេ $2.4\\text{ t}$ ($2400\\text{ kg}$) និងផ្ទុកស្រូវទម្ងន់ $4\\text{ t}$ ($4000\\text{ kg}$)។ គណនាទម្ងន់សរុបនៃឡាននិងស្រូវជាគីឡូក្រាម ($kg$) ៖",
            'opts': ["$6400\\text{ kg}$", "$6200\\text{ kg}$", "$6600\\text{ kg}$", "$6800\\text{ kg}$"],
            'corr': 0
        },
        ('les-g8-01', '1', 3): {
            'q': "គេឱ្យចំនួនទសភាគខួប $x = 0.\\overline{6} = 0.666\\dots$។ គណនាតម្លៃនៃផលដក $10x - x$ ៖",
            'opts': ["$6$", "$5$", "$7$", "$9$"],
            'corr': 0
        },
        ('les-g8-01', '3', 3): {
            'q': "ធុងមួយមានផ្ទុកទឹកប្រេង $120\\text{ L}$។ លើកទីមួយគេដងយកអស់ $\\dfrac{3}{8}$ នៃចំណុះសរុប។ គណនាបរិមាណប្រេងដែលដងយកលើកទីមួយ ៖",
            'opts': ["$45\\text{ L}$", "$40\\text{ L}$", "$50\\text{ L}$", "$35\\text{ L}$"],
            'corr': 0
        },
        ('les-g8-01', '3', 4): {
            'q': "ធុងមួយមានផ្ទុកទឹកប្រេង $120\\text{ L}$។ លើកទីមួយដងអស់ $45\\text{ L}$ ហើយលើកទីពីរដងអស់ $\\dfrac{2}{5}$ នៃប្រេងដែលនៅសល់ ($30\\text{ L}$)។ គណនាបរិមាណប្រេងដែលនៅសល់ក្នុងធុងចុងក្រោយ ៖",
            'opts': ["$45\\text{ L}$", "$40\\text{ L}$", "$50\\text{ L}$", "$35\\text{ L}$"],
            'corr': 0
        },
        ('les-g8-07', '1', 4): {
            'q': "ដោះស្រាយសមីការសនិទាន $\\dfrac{3}{x - 2} = \\dfrac{5}{x + 2}$ ៖",
            'opts': ["$x = 8$", "$x = -8$", "$x = 10$", "$x = 4$"],
            'corr': 0
        },
        ('les-g8-09', '3', 1): {
            'q': "គេឱ្យបន្ទាត់ពីរ $(d_1) : y = 2x - 1$ និង $(d_2) : y = -x + 5$។ រកអាប់ស៊ីស $x$ នៃចំណុចប្រសព្វរវាងបន្ទាត់ទាំងពីរ ៖",
            'opts': ["$x = 2$", "$x = -2$", "$x = 3$", "$x = 4$"],
            'corr': 0
        },
    }

    # Proof specific fixes:
    proof_fixes = {
        ('les-g11a-1-3', '3', 1): {
            'q': "គេឱ្យ $x > -1$ និង $x \\neq 0$។ តាមវិសមភាព Bernoulli $(1 + x)^n > 1 + nx$ ពិតចំពោះគ្រប់ចំនួនគត់ $n$ ណា? ៖",
            'opts': ["$n \\ge 2$", "$n \\ge 0$", "$n \\le 2$", "$n > 5$"],
            'corr': 0
        },
        ('les-g11a-5-1', '2', 2): {
            'q': "ចំពោះ $x > 0$ តើវិសមភាពត្រីកោណមាត្រមួយណាខាងក្រោមនេះពិត? ៖",
            'opts': ["$\\sin x < x$", "$\\sin x > x$", "$\\sin x = x$", "$\\sin x \\ge x + 1$"],
            'corr': 0
        },
        ('les-g11a-7-3', '3', 2): {
            'q': "រូបភាពនៃឫសទាំង ៤ នៃសមីការកុំផ្លិច $z^4 = 1$ បង្កើតបានជារូបអ្វីក្នុងប្លង់កុំផ្លិច? ៖",
            'opts': ["ការ៉េ", "ចតុកោណកែងមិនមែនការ៉េ", "ត្រីកោណសម័ង្ស", "ប្រលេឡូក្រាមមិនមែនកែង"],
            'corr': 0
        },
        ('les-g11a-7-4', '3', 2): {
            'q': "ក្នុងប្លង់កុំផ្លិច បើ $\\dfrac{z_C - z_A}{z_B - z_A} = i$ តើត្រីកោណ $ABC$ ជាប្រភេទត្រីកោណអ្វី? ៖",
            'opts': ["ត្រីកោណកែងសមបាតត្រង់ $A$", "ត្រីកោណសម័ង្ស", "ត្រីកោណសមបាតមិនកែង", "ត្រីកោណកែងមិនសមបាត"],
            'corr': 0
        },
        ('les-g11a-7-4', '4', 2): {
            'q': "ក្នុងប្លង់កុំផ្លិច បើ $\\dfrac{z_C - z_A}{z_B - z_A} = \\cos\\dfrac{\\pi}{3} + i\\sin\\dfrac{\\pi}{3}$ តើត្រីកោណ $ABC$ ជាប្រភេទត្រីកោណអ្វី? ៖",
            'opts': ["ត្រីកោណសម័ង្ស", "ត្រីកោណកែងសមបាត", "ត្រីកោណសមបាតមិនសម័ង្ស", "ត្រីកោណកែង"],
            'corr': 0
        },
        ('les-g12a-1-3', '3', 1): {
            'q': "ក្នុងប្លង់កុំផ្លិច ចំណុច $A, B, C$ មានអាភិច $z_A = 1+i, z_B = 3+i, z_C = 2+(1+\\sqrt{3})i$។ តើ $\\triangle ABC$ ជាប្រភេទត្រីកោណអ្វី? ៖",
            'opts': ["ត្រីកោណសម័ង្ស", "ត្រីកោណកែងសមបាត", "ត្រីកោណសមបាត", "ត្រីកោណមុំទាល"],
            'corr': 0
        },
    }

    # Other specific duplicate options fixes:
    other_dup_fixes = {
        ('les-g8-18', '2', 1): {
            'opts': ["$1200000\\text{ cm}$", "$120000\\text{ cm}$", "$12000\\text{ cm}$", "$2400000\\text{ cm}$"],
            'corr': 0
        },
        ('les-g8-06', '2', 2): {
            'opts': ["$\\dfrac{x}{x + 4}$", "$-\\dfrac{x}{x + 4}$", "$\\dfrac{x + 4}{x}$", "$\\dfrac{x - 4}{x + 4}$"],
            'corr': 0
        },
        ('les-g8-06', '2', 4): {
            'opts': ["$\\dfrac{x - 2}{x + 3}$", "$-\\dfrac{x - 2}{x + 3}$", "$\\dfrac{x + 3}{x - 2}$", "$\\dfrac{x + 2}{x + 3}$"],
            'corr': 0
        },
        ('les-g9-02', '2', 3): {
            'opts': ["$\\dfrac{3a - 2b + c}{4}$", "$-\\dfrac{3a - 2b + c}{4}$", "$\\dfrac{4}{3a - 2b + c}$", "$\\dfrac{3a - 2b + c}{2}$"],
            'corr': 0
        },
        ('les-g9-03', '3', 1): {
            'opts': ["$\\dfrac{x^2 + 2x + 4}{x + 2}$", "$-\\dfrac{x^2 + 2x + 4}{x + 2}$", "$\\dfrac{x + 2}{x^2 + 2x + 4}$", "$\\dfrac{x^2 - 2x + 4}{x + 2}$"],
            'corr': 0
        },
        ('les-g9-03', '3', 2): {
            'opts': ["$\\dfrac{x + 3}{x + 5}$", "$-\\dfrac{x + 3}{x + 5}$", "$\\dfrac{x + 5}{x + 3}$", "$\\dfrac{x - 3}{x + 5}$"],
            'corr': 0
        },
        ('les-g10-4-2', '3', 3): {
            'opts': ["$y = 3x - 5$", "$y = 3x + 1$", "$y = -3x + 7$", "$y = 3x - 1$"],
            'corr': 0
        },
        ('les-g12a-6-4', '1', 2): {
            'opts': ["$\\dfrac{64\\pi}{15}$", "$-\\dfrac{64\\pi}{15}$", "$\\dfrac{15}{64\\pi}$", "$\\dfrac{32\\pi}{15}$"],
            'corr': 0
        },
        ('les-g11b-1-2', '3', 6): {
            'opts': ["$20$", "$16$", "$24$", "$12$"],
            'corr': 0
        },
        ('les-g11b-1-2', '3', 9): {
            'opts': ["$25$", "$30$", "$20$", "$15$"],
            'corr': 0
        },
        ('les-g11a-1-2', '2', 2): {
            'opts': ["$20$", "$16$", "$24$", "$12$"],
            'corr': 0
        },
        ('les-g11a-1-2', '2', 4): {
            'opts': ["$20$", "$16$", "$24$", "$12$"],
            'corr': 0
        },
        ('les-g11a-1-2', '2', 7): {
            'opts': ["$25$", "$30$", "$20$", "$15$"],
            'corr': 0
        },
        ('les-g11a-4-1', '3', 7): {
            'opts': ["$25$", "$30$", "$20$", "$15$"],
            'corr': 0
        },
        ('les-g11b-5-1', '2', 5): {
            'opts': ["$0$", "$-1$", "$1$", "$2$"],
            'corr': 0
        },
        ('les-g11b-5-2', '1', 9): {
            'opts': ["$2$", "$1$", "$3$", "$4$"],
            'corr': 0
        },
        ('les-g12a-2-1', '2', 7): {
            'opts': ["$2$", "$1$", "$3$", "$4$"],
            'corr': 0
        },
        ('les-g12b-1-1', '1', 8): {
            'opts': ["$2$", "$1$", "$0$", "$4$"],
            'corr': 0
        },
        ('les-g12b-1-1', '3', 6): {
            'opts': ["$2$", "$1$", "$3$", "$4$"],
            'corr': 0
        },
        ('les-g12b-1-1', '3', 8): {
            'opts': ["$2$", "$1$", "$0$", "$4$"],
            'corr': 0
        },
        ('les-g12b-1-1', '4', 10): {
            'opts': ["$2$", "$1$", "$0$", "$4$"],
            'corr': 0
        },
        ('les-g12b-3-1', '2', 1): {
            'opts': ["$2$", "$1$", "$3$", "$4$"],
            'corr': 0
        },
        ('les-g12b-3-2', '2', 5): {
            'opts': ["$0$", "$-1$", "$1$", "$2$"],
            'corr': 0
        },
    }

    # APPLY ALL FIXES ACROSS ALL LESSONS
    total_processed = 0
    total_cleaned_distractors = 0
    total_deduped = 0
    
    for les_id, points in pq.items():
        if not isinstance(points, dict): continue
        for p_num, q_list in points.items():
            if not isinstance(q_list, list): continue
            for idx, q in enumerate(q_list):
                total_processed += 1
                q_num = idx + 1
                key = (les_id, p_num, q_num)
                
                # Check specific multi-part fixes
                if key in multi_part_fixes:
                    fix = multi_part_fixes[key]
                    q['question'] = fix['q']
                    q['options'] = fix['opts']
                    q['correct'] = fix['corr']
                
                # Check specific proof fixes
                if key in proof_fixes:
                    fix = proof_fixes[key]
                    q['question'] = fix['q']
                    q['options'] = fix['opts']
                    q['correct'] = fix['corr']
                    
                # Check specific other dup fixes
                if key in other_dup_fixes:
                    fix = other_dup_fixes[key]
                    q['options'] = fix['opts']
                    q['correct'] = fix['corr']

                # Generic question text punctuation cleanup
                q['question'] = clean_punctuation(q['question'])

                # Distractor cleaning
                new_opts = []
                for o in q.get('options', []):
                    c = clean_distractor(o)
                    if c != o:
                        total_cleaned_distractors += 1
                    new_opts.append(c)
                q['options'] = new_opts

                # Common template duplicate options fixes
                q_txt = q['question']
                if r'\sin(45^\circ)' in q_txt or r'\sin(45^{\circ})' in q_txt:
                    q['options'] = ['$\\dfrac{\\sqrt{2}}{2}$', '$\\dfrac{1}{2}$', '$\\dfrac{\\sqrt{3}}{2}$', '$1$']
                    q['correct'] = 0
                elif r'30^\circ' in q_txt and 'រ៉ាដ្យង់' in q_txt:
                    q['options'] = ['$\\dfrac{\\pi}{6}\\text{ rad}$', '$\\dfrac{\\pi}{3}\\text{ rad}$', '$\\dfrac{\\pi}{4}\\text{ rad}$', '$\\dfrac{\\pi}{2}\\text{ rad}$']
                    q['correct'] = 0
                elif 'A = 4x - 1' in q_txt:
                    if 'x = 3' in q_txt:
                        q['options'] = ['$11$', '$13$', '$10$', '$9$']
                        q['correct'] = 0
                    elif 'x = 5' in q_txt:
                        q['options'] = ['$19$', '$21$', '$18$', '$17$']
                        q['correct'] = 0

                # Universal deduplication check
                if len(set(q['options'])) < 4:
                    q['options'], q['correct'] = deduplicate_options(q['options'], q.get('correct', 0))
                    total_deduped += 1

    with open('data/point_quizzes.json', 'w', encoding='utf-8') as f:
        json.dump(pq, f, ensure_ascii=False, indent=2)

    print(f"Master repair completed!")
    print(f"Total questions processed: {total_processed}")
    print(f"Total cleaned distractors: {total_cleaned_distractors}")
    print(f"Total deduplicated questions: {total_deduped}")

if __name__ == '__main__':
    run_master_repairs()
