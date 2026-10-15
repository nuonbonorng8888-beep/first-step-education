# -*- coding: utf-8 -*-
"""
Additional dedicated lesson fixes for Grade 11 & 12.
"""

MORE_FIXES = {
    "les-g11b-5-2": [
        {
            "question": "ដេរីវេនៃអនុគមន៍ស្វ័យគុណ $y = x^n$ គឺ ៖",
            "options": [
                "$y' = n x^{n-1}$",
                "$y' = x^{n-1}$",
                "$y' = n x^n$",
                "$y' = \\dfrac{x^{n+1}}{n+1}$"
            ],
            "correct": 0,
            "explanation": "$(x^n)' = n x^{n-1}$។"
        },
        {
            "question": "ដេរីវេនៃចំនួនថេរ $c$ ($c$ ជាចំនួនពិត) ស្មើនឹង ៖",
            "options": [
                "$0$",
                "$1$",
                "$c$",
                "$c x$"
            ],
            "correct": 0,
            "explanation": "ដេរីវេនៃចំនួនថេរគឺស្មើ $0$ ជានិច្ច ៖ $(c)' = 0$។"
        },
        {
            "question": "គណនាដេរីវេនៃ $f(x) = 3x^2 - 5x + 4$ ៖",
            "options": [
                "$6x - 5$",
                "$6x + 5$",
                "$3x - 5$",
                "$6x^2 - 5$"
            ],
            "correct": 0,
            "explanation": "$f'(x) = 3(2x) - 5(1) + 0 = 6x - 5$។"
        },
        {
            "question": "រូបមន្តដេរីវេនៃផលគុណ $(u \\cdot v)'$ ស្មើនឹង ៖",
            "options": [
                "$u'v + uv'$",
                "$u'v - uv'$",
                "$u'v'$",
                "$uv + u'v'$"
            ],
            "correct": 0,
            "explanation": "$(uv)' = u'v + uv'$។"
        },
        {
            "question": "រូបមន្តដេរីវេនៃផលចែក $\\left(\\dfrac{u}{v}\\right)'$ ស្មើនឹង ៖",
            "options": [
                "$\\dfrac{u'v - uv'}{v^2}$",
                "$\\dfrac{u'v + uv'}{v^2}$",
                "$\\dfrac{u' - v'}{v^2}$",
                "$\\dfrac{u'}{v'}$"
            ],
            "correct": 0,
            "explanation": "$\\left(\\dfrac{u}{v}\\right)' = \\dfrac{u'v - uv'}{v^2}$។"
        },
        {
            "question": "ដេរីវេនៃ $\\sin x$ គឺ ៖",
            "options": [
                "$\\cos x$",
                "$-\\cos x$",
                "$\\sin x$",
                "$-\\sin x$"
            ],
            "correct": 0,
            "explanation": "$(\\sin x)' = \\cos x$។"
        },
        {
            "question": "ដេរីវេនៃ $\\cos x$ គឺ ៖",
            "options": [
                "$-\\sin x$",
                "$\\sin x$",
                "$-\\cos x$",
                "$\\tan x$"
            ],
            "correct": 0,
            "explanation": "$(\\cos x)' = -\\sin x$។"
        },
        {
            "question": "ដេរីវេនៃ $e^x$ គឺ ៖",
            "options": [
                "$e^x$",
                "$x e^{x-1}$",
                "$\\ln x$",
                "$\\dfrac{1}{e^x}$"
            ],
            "correct": 0,
            "explanation": "$(e^x)' = e^x$។"
        },
        {
            "question": "ដេរីវេនៃ $\\ln x$ ($x > 0$) គឺ ៖",
            "options": [
                "$\\dfrac{1}{x}$",
                "$-\\dfrac{1}{x^2}$",
                "$e^x$",
                "$1$"
            ],
            "correct": 0,
            "explanation": "$(\\ln x)' = \\dfrac{1}{x}$។"
        },
        {
            "question": "តើមេគុណប្រាប់ទិសនៃបន្ទាត់ប៉ះនឹងក្រាប $y = f(x)$ ត្រង់ចំណុច $x_0$ ស្មើនឹងតម្លៃអ្វី?",
            "options": [
                "$f'(x_0)$",
                "$f(x_0)$",
                "$\\dfrac{1}{f'(x_0)}$",
                "$-f'(x_0)$"
            ],
            "correct": 0,
            "explanation": "មេគុណប្រាប់ទិសនៃបន្ទាត់ប៉ះត្រង់ $x_0$ គឺស្មើនឹងតម្លៃដេរីវេ $f'(x_0)$។"
        }
    ],

    "les-g11b-5-4": [
        {
            "question": "បន្ទាត់ $x = a$ ជាអាស៊ីមតូតឈរនៃក្រាប $y = f(x)$ លុះត្រាតែ ៖",
            "options": [
                "$\\lim\\limits_{x \\to a} f(x) = \\pm\\infty$",
                "$\\lim\\limits_{x \\to \\pm\\infty} f(x) = a$",
                "$f(a) = 0$",
                "$f'(a) = 0$"
            ],
            "correct": 0,
            "explanation": "អាស៊ីមតូតឈរកាលណា $x$ ខិតជិត $a$ នាំឱ្យ $y$ ខិតជិតអនន្ត ($\\pm\\infty$) ៖ $\\lim\\limits_{x \\to a} f(x) = \\pm\\infty$។"
        },
        {
            "question": "បន្ទាត់ $y = b$ ជាអាស៊ីមតូតដេកនៃក្រាប $y = f(x)$ លុះត្រាតែ ៖",
            "options": [
                "$\\lim\\limits_{x \\to \\pm\\infty} f(x) = b$",
                "$\\lim\\limits_{x \\to b} f(x) = \\pm\\infty$",
                "$f(b) = 0$",
                "$f'(b) = 0$"
            ],
            "correct": 0,
            "explanation": "អាស៊ីមតូតដេកកាលណា $x$ ខិតជិតអនន្ត ($\\pm\\infty$) នាំឱ្យ $y$ ខិតជិតតម្លៃថេរ $b$ ៖ $\\lim\\limits_{x \\to \\pm\\infty} f(x) = b$។"
        },
        {
            "question": "រកអាស៊ីមតូតឈរ និងដេកនៃអនុគមន៍ $y = \\dfrac{2x + 1}{x - 3}$ ៖",
            "options": [
                "ឈរ $x = 3$ និងដេក $y = 2$",
                "ឈរ $x = -3$ និងដេក $y = 1$",
                "ឈរ $x = 2$ និងដេក $y = 3$",
                "គ្មានអាស៊ីមតូត"
            ],
            "correct": 0,
            "explanation": "ភាគបែងស្មើ $0 \\implies x = 3$ (អាស៊ីមតូតឈរ), $\\lim\\limits_{x \\to \\infty} y = 2 \\implies y = 2$ (អាស៊ីមតូតដេក)។"
        },
        {
            "question": "បន្ទាត់ $y = ax + b$ ជាអាស៊ីមតូតទ្រេតនៃ $y = f(x)$ លុះត្រាតែ ៖",
            "options": [
                "$\\lim\\limits_{x \\to \\pm\\infty} [f(x) - (ax + b)] = 0$",
                "$\\lim\\limits_{x \\to 0} f(x) = ax + b$",
                "$f'(x) = a$",
                "$f(x) = 0$"
            ],
            "correct": 0,
            "explanation": "អាស៊ីមតូតទ្រេតលុះត្រាតែគម្លាតរវាងក្រាប និងបន្ទាត់ខិតជិត $0$ ពេល $x \\to \\pm\\infty$ ៖ $\\lim\\limits_{x \\to \\pm\\infty} [f(x) - (ax + b)] = 0$។"
        },
        {
            "question": "តារាងអថិរភាពនៃអនុគមន៍មួយបង្ហាញអំពីព័ត៌មានអ្វីខ្លះ?",
            "options": [
                "សញ្ញានៃដេរីវេ ទិសដៅកើនចុះ តម្លៃបរមា និងលីមីតត្រង់ចុងដែន",
                "រូបមន្តដេរីវេប៉ុណ្ណោះ",
                "កូអរដោនេចំណុចកែង",
                "គ្មានព័ត៌មាន"
            ],
            "correct": 0,
            "explanation": "តារាងអថិរភាពសង្ខេបនូវដែនកំណត់ សញ្ញា $f'(x)$, ទិសដៅអថិរភាព $f$, តម្លៃបរមា និងលីមីត។"
        },
        {
            "question": "ចំណុចរបត់ (Inflection Point) នៃក្រាបកើតឡើងត្រង់កន្លែងណា?",
            "options": [
                "ដេរីវេទីពីរ $f''(x) = 0$ ហើយប្តូរសញ្ញា",
                "$f'(x) = 0$",
                "$f(x) = 0$",
                "ក្រាបកាត់អ័ក្ស Ox"
            ],
            "correct": 0,
            "explanation": "ចំណុចរបត់ជាចំណុចដែលក្រាបប្តូរភាពប៉ោង/ផត ដែលត្រូវនឹង $f''(x) = 0$ ហើយប្តូរសញ្ញា។"
        },
        {
            "question": "បើ $f''(x) > 0$ លើចន្លោះ $I$ នោះក្រាបបែរភាពកោង ៖",
            "options": [
                "ប៉ោងឡើងលើ (Concave Up)",
                "កោងចុះក្រោម (Concave Down)",
                "ជាបន្ទាត់ត្រង់",
                "គ្មានភាពកោង"
            ],
            "correct": 0,
            "explanation": "$f''(x) > 0$ បញ្ជាក់ថាក្រាបប៉ោងឡើងលើ (រាងដូចពែងផ្ងារ)។"
        },
        {
            "question": "បើ $f''(x) < 0$ លើចន្លោះ $I$ នោះក្រាបបែរភាពកោង ៖",
            "options": [
                "កោងចុះក្រោម (Concave Down)",
                "ប៉ោងឡើងលើ (Concave Up)",
                "ជាបន្ទាត់ត្រង់",
                "មិនប្រែប្រួល"
            ],
            "correct": 0,
            "explanation": "$f''(x) < 0$ បញ្ជាក់ថាក្រាបកោងចុះក្រោម (រាងដូចពែងផ្កាប់)។"
        },
        {
            "question": "តើក្រាបនៃអនុគមន៍ស្វ័យគុណបី $y = x^3 - 3x$ មានចំណុចរបត់ត្រង់ណា?",
            "options": [
                "$(0, 0)$",
                "$(1, -2)$",
                "$(-1, 2)$",
                "$(3, 0)$"
            ],
            "correct": 0,
            "explanation": "$y' = 3x^2 - 3, y'' = 6x = 0 \\implies x = 0 \\implies y = 0$ នាំឱ្យចំណុចរបត់គឺ $(0, 0)$។"
        },
        {
            "question": "ផ្ចិតស៊ីមេទ្រីនៃក្រាបអនុគមន៍សនិទាន $y = \\dfrac{ax + b}{cx + d}$ គឺជា ៖",
            "options": [
                "ចំណុចប្រសព្វនៃអាស៊ីមតូតឈរ និងអាស៊ីមតូតដេក",
                "គល់តម្រុយ $(0, 0)$",
                "កំពូលបរមា",
                "ចំណុចកាត់អ័ក្ស Oy"
            ],
            "correct": 0,
            "explanation": "ក្រាបអ៊ីពែបូលនៃអនុគមន៍សនិទានមានផ្ចិតស៊ីមេទ្រីចំចំណុចប្រសព្វនៃអាស៊ីមតូតទាំងពីរ។"
        }
    ],

    "les-g12b-3-1": [
        {
            "question": "ដោះស្រាយសមីការ៖ $e^{2x} - 5e^x + 6 = 0$",
            "options": [
                "$x = \\ln 2$ ឬ $x = \\ln 3$",
                "$x = 2$ ឬ $x = 3$",
                "$x = e^2$ ឬ $x = e^3$",
                "គ្មានចម្លើយ"
            ],
            "correct": 0,
            "explanation": "តាង $t = e^x$ ($t > 0$) $\\implies t^2 - 5t + 6 = 0 \\implies t = 2$ ($x = \\ln 2$) ឬ $t = 3$ ($x = \\ln 3$)។"
        },
        {
            "question": "ដោះស្រាយវិសមីការ៖ $e^{3x - 1} \\ge 1$",
            "options": [
                "$x \\ge \\dfrac{1}{3}$",
                "$x \\le \\dfrac{1}{3}$",
                "$x \\ge 0$",
                "$x > 1$"
            ],
            "correct": 0,
            "explanation": "$e^{3x - 1} \\ge e^0 \\implies 3x - 1 \\ge 0 \\implies x \\ge \\dfrac{1}{3}$។"
        },
        {
            "question": "ដេរីវេនៃអនុគមន៍ $f(x) = e^{x^2 - 1}$ គឺ ៖",
            "options": [
                "$2x e^{x^2 - 1}$",
                "$e^{x^2 - 1}$",
                "$2x e^x$",
                "$x^2 e^{x^2 - 1}$"
            ],
            "correct": 0,
            "explanation": "$(e^u)' = u' e^u = (x^2 - 1)' e^{x^2 - 1} = 2x e^{x^2 - 1}$។"
        },
        {
            "question": "គណនាលីមីត៖ $\\lim\\limits_{x \\to +\\infty} \\dfrac{e^x}{x}$ ៖",
            "options": [
                "$+\\infty$",
                "$0$",
                "$1$",
                "$e$"
            ],
            "correct": 0,
            "explanation": "អនុគមន៍អិចស្ប៉ូណង់ស្យែលកើនលឿនជាងអនុគមន៍ពហុធា ៖ $\\lim\\limits_{x \\to +\\infty} \\dfrac{e^x}{x} = +\\infty$។"
        },
        {
            "question": "គណនាលីមីត៖ $\\lim\\limits_{x \\to -\\infty} e^x$ ៖",
            "options": [
                "$0$",
                "$-\\infty$",
                "$+\\infty$",
                "$1$"
            ],
            "correct": 0,
            "explanation": "$\\lim\\limits_{x \\to -\\infty} e^x = 0$ (អ័ក្ស $Ox$ ជាអាស៊ីមតូតដេក)។"
        },
        {
            "question": "ចំនួនបាក់តេរីកើនឡើងតាមរូបមន្ត $N(t) = 100 e^{0.2t}$ ($t$ គិតជាម៉ោង) ។ រកចំនួនបាក់តេរីនៅពេល $t = 0$ ៖",
            "options": [
                "$100$",
                "$0$",
                "$200$",
                "$20$"
            ],
            "correct": 0,
            "explanation": "$N(0) = 100 e^0 = 100(1) = 100$។"
        },
        {
            "question": "ដោះស្រាយសមីការ៖ $2^{x + 1} = 16$",
            "options": [
                "$x = 3$",
                "$x = 4$",
                "$x = 2$",
                "$x = 5$"
            ],
            "correct": 0,
            "explanation": "$2^{x + 1} = 2^4 \\implies x + 1 = 4 \\implies x = 3$។"
        },
        {
            "question": "ដោះស្រាយសមីការ៖ $e^x + e^{-x} = 2$",
            "options": [
                "$x = 0$",
                "$x = 1$",
                "$x = -1$",
                "គ្មានចម្លើយ"
            ],
            "correct": 0,
            "explanation": "$t + \\dfrac{1}{t} = 2 \\implies t^2 - 2t + 1 = 0 \\implies (t - 1)^2 = 0 \\implies t = 1 \\implies e^x = 1 \\implies x = 0$។"
        },
        {
            "question": "ដេរីវេនៃ $f(x) = 2^x$ គឺ ៖",
            "options": [
                "$2^x \\ln 2$",
                "$x \\cdot 2^{x - 1}$",
                "$2^x$",
                "$\\dfrac{2^x}{\\ln 2}$"
            ],
            "correct": 0,
            "explanation": "$(a^x)' = a^x \\ln a \\implies (2^x)' = 2^x \\ln 2$។"
        },
        {
            "question": "អាំងតេក្រាលនៃ $e^{2x}$ គឺ $\\int e^{2x} \\, dx = ?$",
            "options": [
                "$\\dfrac{1}{2} e^{2x} + C$",
                "$2 e^{2x} + C$",
                "$e^{2x} + C$",
                "$e^x + C$"
            ],
            "correct": 0,
            "explanation": "$\\int e^{ax} \\, dx = \\dfrac{1}{a} e^{ax} + C \\implies \\dfrac{1}{2} e^{2x} + C$។"
        }
    ],

    "les-g12b-3-2": [
        {
            "question": "ដែនកំណត់នៃអនុគមន៍ $f(x) = \\ln(x - 4)$ គឺ ៖",
            "options": [
                "$(4, +\\infty)$",
                "$[4, +\\infty)$",
                "$\\mathbb{R} \\setminus \\{4\\}$",
                "$(0, +\\infty)$"
            ],
            "correct": 0,
            "explanation": "កន្សោមក្នុង $\\ln$ ត្រូវវិជ្ជមានដាច់ខាត ៖ $x - 4 > 0 \\implies x > 4$។"
        },
        {
            "question": "ដោះស្រាយសមីការ៖ $\\ln x + \\ln(x - 3) = \\ln 4$",
            "options": [
                "$x = 4$",
                "$x = -1$",
                "$x = 4$ ឬ $x = -1$",
                "$x = 3$"
            ],
            "correct": 0,
            "explanation": "លក្ខខណ្ឌ $x > 3$ ៖ $\\ln[x(x - 3)] = \\ln 4 \\implies x^2 - 3x - 4 = 0 \\implies x = 4$ (យក) ឬ $x = -1$ (មិនយក)។"
        },
        {
            "question": "ដោះស្រាយវិសមីការ៖ $\\ln(2x - 1) \\le 0$",
            "options": [
                "$\\dfrac{1}{2} < x \\le 1$",
                "$x \\le 1$",
                "$x > \\dfrac{1}{2}$",
                "$x \\ge 1$"
            ],
            "correct": 0,
            "explanation": "លក្ខខណ្ឌ $2x - 1 > 0 \\implies x > \\dfrac{1}{2}$។ $2x - 1 \\le e^0 = 1 \\implies 2x \\le 2 \\implies x \\le 1$ នាំឱ្យ $\\dfrac{1}{2} < x \\le 1$។"
        },
        {
            "question": "គណនាលីមីត៖ $\\lim\\limits_{x \\to +\\infty} \\dfrac{\\ln x}{x}$ ៖",
            "options": [
                "$0$",
                "$+\\infty$",
                "$1$",
                "$e$"
            ],
            "correct": 0,
            "explanation": "លីមីតនៃអនុគមន៍លោការីតធៀបនឹងពហុធាត្រង់ $+\\infty$ ស្មើ $0$ ៖ $\\lim\\limits_{x \\to +\\infty} \\dfrac{\\ln x}{x} = 0$។"
        },
        {
            "question": "គណនាលីមីត៖ $\\lim\\limits_{x \\to 0^+} x \\ln x$ ៖",
            "options": [
                "$0$",
                "$-\\infty$",
                "$+\\infty$",
                "$1$"
            ],
            "correct": 0,
            "explanation": "រូបមន្តលីមីតគ្រឹះ៖ $\\lim\\limits_{x \\to 0^+} x \\ln x = 0$។"
        },
        {
            "question": "ដេរីវេនៃ $f(x) = x \\ln x - x$ គឺ ៖",
            "options": [
                "$\\ln x$",
                "$\\dfrac{1}{x}$",
                "$\\ln x - 1$",
                "$x \\ln x$"
            ],
            "correct": 0,
            "explanation": "$f'(x) = [1 \\cdot \\ln x + x \\cdot \\dfrac{1}{x}] - 1 = \\ln x + 1 - 1 = \\ln x$។"
        },
        {
            "question": "ព្រីមីទីវនៃ $f(x) = \\ln x$ គឺ $\\int \\ln x \\, dx = ?$",
            "options": [
                "$x \\ln x - x + C$",
                "$\\dfrac{1}{x} + C$",
                "$x \\ln x + C$",
                "$\\dfrac{(\\ln x)^2}{2} + C$"
            ],
            "correct": 0,
            "explanation": "ធ្វើអាំងតេក្រាលដោយផ្នែក $u = \\ln x, dv = dx$ នាំឱ្យ $\\int \\ln x \\, dx = x \\ln x - x + C$។"
        },
        {
            "question": "ដោះស្រាយសមីការ៖ $\\log_2 x = 5$",
            "options": [
                "$x = 32$",
                "$x = 10$",
                "$x = 25$",
                "$x = 64$"
            ],
            "correct": 0,
            "explanation": "$x = 2^5 = 32$។"
        },
        {
            "question": "ដោះស្រាយសមីការ៖ $\\ln^2 x - 3\\ln x + 2 = 0$",
            "options": [
                "$x = e$ ឬ $x = e^2$",
                "$x = 1$ ឬ $x = 2$",
                "$x = e^3$",
                "$x = 0$"
            ],
            "correct": 0,
            "explanation": "$(\\ln x - 1)(\\ln x - 2) = 0 \\implies \\ln x = 1$ ($x = e$) ឬ $\\ln x = 2$ ($x = e^2$)។"
        },
        {
            "question": "អាស៊ីមតូតឈរនៃក្រាប $y = \\ln x$ គឺ ៖",
            "options": [
                "$x = 0$ (អ័ក្ស $Oy$)",
                "$y = 0$ (អ័ក្ស $Ox$)",
                "$x = 1$",
                "គ្មានអាស៊ីមតូត"
            ],
            "correct": 0,
            "explanation": "$\\lim\\limits_{x \\to 0^+} \\ln x = -\\infty$ នាំឱ្យបន្ទាត់ $x = 0$ (អ័ក្ស $Oy$) ជាអាស៊ីមតូតឈរ។"
        }
    ],

    "les-g11b-1-3": [
        {
            "question": "រូបមន្តតួទូទៅនៃស្វ៊ីតធរណីមាត្រ $(u_n)$ ដែលមានផលធៀបរួម $q$ គឺ ៖",
            "options": [
                "$u_n = u_1 \\cdot q^{n-1}$",
                "$u_n = u_1 + (n-1)q$",
                "$u_n = u_1 \\cdot q^n$",
                "$u_n = (u_1 \\cdot q)^n$"
            ],
            "correct": 0,
            "explanation": "រូបមន្តតួទូទៅស្វ៊ីតធរណីមាត្រ ៖ $u_n = u_1 \\cdot q^{n-1}$។"
        },
        {
            "question": "ផលធៀបរួម $q$ នៃស្វ៊ីតធរណីមាត្រគណនាតាម ៖",
            "options": [
                "$q = \\dfrac{u_{n+1}}{u_n}$",
                "$q = u_{n+1} - u_n$",
                "$q = u_{n+1} \\cdot u_n$",
                "$q = \\dfrac{u_n}{u_{n+1}}$"
            ],
            "correct": 0,
            "explanation": "$q = \\dfrac{u_{n+1}}{u_n}$ (ចំពោះ $u_n \\neq 0$)។"
        },
        {
            "question": "រូបមន្តផលបូក $n$ តួដំបូង $S_n$ នៃស្វ៊ីតធរណីមាត្រ ($q \\neq 1$) គឺ ៖",
            "options": [
                "$S_n = \\dfrac{u_1 (1 - q^n)}{1 - q}$",
                "$S_n = \\dfrac{n(u_1 + u_n)}{2}$",
                "$S_n = u_1 \\cdot q^n$",
                "$S_n = \\dfrac{u_1 (q^n + 1)}{q - 1}$"
            ],
            "correct": 0,
            "explanation": "ផលបូក $n$ តួដំបូងនៃស្វ៊ីតធរណីមាត្រ ៖ $S_n = \\dfrac{u_1(1 - q^n)}{1 - q}$។"
        },
        {
            "question": "រកតួទី ៥ នៃស្វ៊ីតធរណីមាត្រដែលមាន $u_1 = 3$ និង $q = 2$ ៖",
            "options": [
                "$48$",
                "$96$",
                "$24$",
                "$32$"
            ],
            "correct": 0,
            "explanation": "$u_5 = 3 \\cdot 2^{5-1} = 3 \\cdot 2^4 = 3 \\cdot 16 = 48$។"
        },
        {
            "question": "តើស្វ៊ីត $2, 6, 18, 54, \\dots$ ជាស្វ៊ីតអ្វី?",
            "options": [
                "ស្វ៊ីតធរណីមាត្រមាន $q = 3$",
                "ស្វ៊ីតនព្វន្តមាន $d = 4$",
                "ស្វ៊ីតថេរ",
                "មិនមែនស្វ៊ីតធរណីមាត្រ"
            ],
            "correct": 0,
            "explanation": "$\\dfrac{6}{2} = \\dfrac{18}{6} = 3 \\implies$ ជាស្វ៊ីតធរណីមាត្រមាន $q = 3$។"
        },
        {
            "question": "ផលបូកនៃស្វ៊ីតធរណីមាត្រអនន្តរងួម ($|q| < 1$) គឺ $S = ?$",
            "options": [
                "$S = \\dfrac{u_1}{1 - q}$",
                "$S = \\dfrac{u_1}{1 + q}$",
                "$S = u_1 \\cdot q$",
                "$S = \\infty$"
            ],
            "correct": 0,
            "explanation": "ពេល $n \\to \\infty$, $q^n \\to 0 \\implies S = \\dfrac{u_1}{1 - q}$។"
        },
        {
            "question": "គណនាផលបូក $1 + \\dfrac{1}{2} + \\dfrac{1}{4} + \\dfrac{1}{8} + \\dots$ ៖",
            "options": [
                "$2$",
                "$1$",
                "$\\dfrac{3}{2}$",
                "$4$"
            ],
            "correct": 0,
            "explanation": "$u_1 = 1, q = \\dfrac{1}{2} \\implies S = \\dfrac{1}{1 - 1/2} = \\dfrac{1}{1/2} = 2$។"
        },
        {
            "question": "បើបីតួ $a, b, c$ ជាបីតួបន្តបន្ទាប់នៃស្វ៊ីតធរណីមាត្រ នោះ ៖",
            "options": [
                "$b^2 = ac$",
                "$2b = a + c$",
                "$b = a + c$",
                "$b = \\dfrac{a + c}{2}$"
            ],
            "correct": 0,
            "explanation": "$\\dfrac{b}{a} = \\dfrac{c}{b} \\implies b^2 = ac$ (មធ្យមធរណីមាត្រ)។"
        },
        {
            "question": "រកផលបូក ៤ តួដំបូងនៃស្វ៊ីត $1, 3, 9, 27$ ៖",
            "options": [
                "$40$",
                "$30$",
                "$36$",
                "$81$"
            ],
            "correct": 0,
            "explanation": "$S_4 = 1 + 3 + 9 + 27 = 40$ (ឬ $S_4 = \\dfrac{1(3^4 - 1)}{3 - 1} = \\dfrac{80}{2} = 40$)។"
        },
        {
            "question": "ស្វ៊ីតធរណីមាត្រមួយមាន $u_2 = 6$ និង $u_4 = 54$ ($q > 0$) ។ រក $q$ ៖",
            "options": [
                "$3$",
                "$2$",
                "$9$",
                "$6$"
            ],
            "correct": 0,
            "explanation": "$\\dfrac{u_4}{u_2} = q^2 = \\dfrac{54}{6} = 9 \\implies q = 3$ (ព្រោះ $q > 0$)។"
        }
    ],

    "les-g11b-2-1": [
        {
            "question": "រូបមន្តផលគុណស្វ័យគុណគោលដូចគ្នា $a^m \\cdot a^n$ ស្មើនឹង ៖",
            "options": [
                "$a^{m+n}$",
                "$a^{m \\cdot n}$",
                "$a^{m-n}$",
                "$(2a)^{m+n}$"
            ],
            "correct": 0,
            "explanation": "$a^m \\cdot a^n = a^{m+n}$។"
        },
        {
            "question": "រូបមន្តផលចែកស្វ័យគុណគោលដូចគ្នា $\\dfrac{a^m}{a^n}$ ($a \\neq 0$) ស្មើនឹង ៖",
            "options": [
                "$a^{m-n}$",
                "$a^{m/n}$",
                "$a^{m+n}$",
                "$a^{-mn}$"
            ],
            "correct": 0,
            "explanation": "$\\dfrac{a^m}{a^n} = a^{m-n}$។"
        },
        {
            "question": "តម្លៃនៃ $a^0$ ($a \\neq 0$) ស្មើនឹង ៖",
            "options": [
                "$1$",
                "$0$",
                "$a$",
                "$-1$"
            ],
            "correct": 0,
            "explanation": "គ្រប់ចំនួនពិតមិនសូន្យស្វ័យគុណ $0$ ស្មើ $1$ ជានិច្ច ៖ $a^0 = 1$។"
        },
        {
            "question": "ទម្រង់ស្វ័យគុណសនិទាន $\\sqrt[n]{a^m}$ ($a > 0$) ស្មើនឹង ៖",
            "options": [
                "$a^{m/n}$",
                "$a^{n/m}$",
                "$a^{m-n}$",
                "$a^{mn}$"
            ],
            "correct": 0,
            "explanation": "$\\sqrt[n]{a^m} = a^{m/n}$។"
        },
        {
            "question": "អនុគមន៍អិចស្ប៉ូណង់ស្យែល $y = a^x$ កើនជានិច្ចលើ $\\mathbb{R}$ លុះត្រាតែ ៖",
            "options": [
                "$a > 1$",
                "$0 < a < 1$",
                "$a > 0$",
                "$a = 1$"
            ],
            "correct": 0,
            "explanation": "កាលណា $a > 1$ អនុគមន៍ $y = a^x$ កើនដាច់ខាតលើ $\\mathbb{R}$។"
        },
        {
            "question": "អនុគមន៍អិចស្ប៉ូណង់ស្យែល $y = a^x$ ចុះជានិច្ចលើ $\\mathbb{R}$ លុះត្រាតែ ៖",
            "options": [
                "$0 < a < 1$",
                "$a > 1$",
                "$a < 0$",
                "$a = 0$"
            ],
            "correct": 0,
            "explanation": "កាលណា $0 < a < 1$ អនុគមន៍ $y = a^x$ ចុះដាច់ខាតលើ $\\mathbb{R}$។"
        },
        {
            "question": "ដោះស្រាយសមីការ៖ $3^{2x - 1} = 27$",
            "options": [
                "$x = 2$",
                "$x = 3$",
                "$x = 1$",
                "$x = 4$"
            ],
            "correct": 0,
            "explanation": "$3^{2x - 1} = 3^3 \\implies 2x - 1 = 3 \\implies 2x = 4 \\implies x = 2$។"
        },
        {
            "question": "ដោះស្រាយវិសមីការ៖ $2^{x + 3} > 8$",
            "options": [
                "$x > 0$",
                "$x > 3$",
                "$x < 0$",
                "$x > 1$"
            ],
            "correct": 0,
            "explanation": "$2^{x + 3} > 2^3 \\implies x + 3 > 3 \\implies x > 0$ (ព្រោះគោល $2 > 1$)។"
        },
        {
            "question": "ក្រាបនៃអនុគមន៍ $y = a^x$ ($a > 0, a \\neq 1$) តែងតែកាត់តាមចំណុចណា?",
            "options": [
                "$(0, 1)$",
                "$(1, 0)$",
                "$(0, 0)$",
                "$(1, 1)$"
            ],
            "correct": 0,
            "explanation": "ពេល $x = 0$ នាំឱ្យ $y = a^0 = 1$ ដូច្នេះក្រាបកាត់តាមចំណុច $(0, 1)$ ជានិច្ច។"
        },
        {
            "question": "អាស៊ីមតូតនៃក្រាប $y = e^x$ គឺ ៖",
            "options": [
                "អ័ក្ស $Ox$ ($y = 0$) ខាង $-\\infty$",
                "អ័ក្ស $Oy$ ($x = 0$)",
                "បន្ទាត់ $y = 1$",
                "គ្មានអាស៊ីមតូត"
            ],
            "correct": 0,
            "explanation": "$\\lim\\limits_{x \\to -\\infty} e^x = 0$ នាំឱ្យអ័ក្ស $Ox$ ($y = 0$) ជាអាស៊ីមតូតដេក។"
        }
    ],

    "les-g11b-2-2": [
        {
            "question": "និយមន័យលោការីត៖ $\\log_a b = x$ ($a > 0, a \\neq 1, b > 0$) សមមូលនឹង ៖",
            "options": [
                "$a^x = b$",
                "$x^a = b$",
                "$b^x = a$",
                "$a \\cdot x = b$"
            ],
            "correct": 0,
            "explanation": "$\\log_a b = x \\iff a^x = b$។"
        },
        {
            "question": "លក្ខខណ្ឌអត្ថិភាពនៃកន្សោម $\\log_a x$ គឺ ៖",
            "options": [
                "$x > 0$ និង $a > 0, a \\neq 1$",
                "$x \\ge 0$ និង $a > 0$",
                "$x \\in \\mathbb{R}$",
                "$x \\neq 0$"
            ],
            "correct": 0,
            "explanation": "គោល $a > 0, a \\neq 1$ និងកន្សោមក្នុងលោការីត $x > 0$ ដាច់ខាត។"
        },
        {
            "question": "រូបមន្តលោការីតនៃផលគុណ $\\log_a(xy)$ ($x, y > 0$) ស្មើនឹង ៖",
            "options": [
                "$\\log_a x + \\log_a y$",
                "$\\log_a x \\cdot \\log_a y$",
                "$\\log_a x - \\log_a y$",
                "$\\log_a(x + y)$"
            ],
            "correct": 0,
            "explanation": "$\\log_a(xy) = \\log_a x + \\log_a y$។"
        },
        {
            "question": "រូបមន្តលោការីតនៃផលចែក $\\log_a\\left(\\dfrac{x}{y}\\right)$ ស្មើនឹង ៖",
            "options": [
                "$\\log_a x - \\log_a y$",
                "$\\dfrac{\\log_a x}{\\log_a y}$",
                "$\\log_a x + \\log_a y$",
                "$\\log_a(x - y)$"
            ],
            "correct": 0,
            "explanation": "$\\log_a\\left(\\dfrac{x}{y}\\right) = \\log_a x - \\log_a y$។"
        },
        {
            "question": "រូបមន្តលោការីតនៃស្វ័យគុណ $\\log_a(x^k)$ ($x > 0$) ស្មើនឹង ៖",
            "options": [
                "$k \\log_a x$",
                "$(\\log_a x)^k$",
                "$\\dfrac{1}{k} \\log_a x$",
                "\\log_a(kx)"
            ],
            "correct": 0,
            "explanation": "$\\log_a(x^k) = k \\log_a x$។"
        },
        {
            "question": "គណនាតម្លៃនៃ $\\log_2 16$ ៖",
            "options": [
                "$4$",
                "$8$",
                "$2$",
                "$16$"
            ],
            "correct": 0,
            "explanation": "$16 = 2^4 \\implies \\log_2 16 = \\log_2(2^4) = 4$។"
        },
        {
            "question": "ដោះស្រាយសមីការ៖ $\\log_3 x = 4$",
            "options": [
                "$x = 81$",
                "$x = 12$",
                "$x = 64$",
                "$x = 27$"
            ],
            "correct": 0,
            "explanation": "$x = 3^4 = 81$។"
        },
        {
            "question": "តើលោការីតនេពែ ($\\ln x$) គឺជាលោការីតដែលមានគោលស្មើនឹងអ្វី?",
            "options": [
                "គោល $e$ ($e \\approx 2.718$)",
                "គោល $10$",
                "គោល $2$",
                "គោល $\\pi$"
            ],
            "correct": 0,
            "explanation": "$\\ln x$ គឺជា $\\log_e x$ ដែលមានគោលជាចំនួនអសនិទាន $e \\approx 2.71828...$។"
        },
        {
            "question": "គណនា៖ $\\log 2 + \\log 5$ (លោការីតគោល ១០) ៖",
            "options": [
                "$1$",
                "$0$",
                "$7$",
                "$10$"
            ],
            "correct": 0,
            "explanation": "$\\log 2 + \\log 5 = \\log(2 \\times 5) = \\log 10 = 1$។"
        },
        {
            "question": "ដោះស្រាយសមីការ៖ $\\ln(x - 1) = 0$",
            "options": [
                "$x = 2$",
                "$x = 1$",
                "$x = 0$",
                "$x = e$"
            ],
            "correct": 0,
            "explanation": "$x - 1 = e^0 = 1 \\implies x = 2$។"
        }
    ]
}
