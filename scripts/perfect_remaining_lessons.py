# -*- coding: utf-8 -*-
"""
Perfected remaining lessons for complete LaTeX notation integrity.
"""

PERFECT_FIXES = {
    "les-g12a-3-2": [
        {
            "question": "បន្ទាត់ $y = ax + b$ ជាអាស៊ីមតូតទ្រេតនៃក្រាប $y = f(x)$ កាលណា $x \\to +\\infty$ ដោយ $a$ ស្មើនឹង ៖",
            "options": [
                "$a = \\lim\\limits_{x \\to +\\infty} \\dfrac{f(x)}{x}$",
                "$a = \\lim\\limits_{x \\to +\\infty} f(x)$",
                "$a = f'(0)$",
                "$a = \\lim\\limits_{x \\to +\\infty} [f(x) - x]$"
            ],
            "correct": 0,
            "explanation": "មេគុណប្រាប់ទិស $a = \\lim\\limits_{x \\to +\\infty} \\dfrac{f(x)}{x}$។"
        },
        {
            "question": "តម្លៃ $b$ នៃអាស៊ីមតូតទ្រេត $y = ax + b$ គណនាតាម ៖",
            "options": [
                "$b = \\lim\\limits_{x \\to +\\infty} [f(x) - ax]$",
                "$b = \\lim\\limits_{x \\to +\\infty} \\dfrac{f(x)}{x}$",
                "$b = f(0)$",
                "$b = \\lim\\limits_{x \\to +\\infty} ax$"
            ],
            "correct": 0,
            "explanation": "$b = \\lim\\limits_{x \\to +\\infty} [f(x) - ax]$។"
        },
        {
            "question": "រកអាស៊ីមតូតទ្រេតនៃ $f(x) = \\dfrac{x^2 + 3x + 1}{x + 1}$ ៖",
            "options": [
                "$y = x + 2$",
                "$y = x + 1$",
                "$y = x + 3$",
                "$y = x$"
            ],
            "correct": 0,
            "explanation": "ចែកពហុធា៖ $\\dfrac{x^2 + 3x + 1}{x + 1} = x + 2 - \\dfrac{1}{x + 1} \\implies$ អាស៊ីមតូតទ្រេតគឺ $y = x + 2$។"
        },
        {
            "question": "តើក្រាប $y = f(x)$ កាត់អាស៊ីមតូតដេក ឬទ្រេតរបស់វាបានដែរឬទេ?",
            "options": [
                "អាចកាត់បាននៅចំណុចមានកំណត់ $x$ (អាស៊ីមតូតគ្រាន់តែខិតជិតពេល $x \\to \\pm\\infty$ ប៉ុណ្ណោះ)",
                "មិនអាចកាត់បានដាច់ខាត",
                "កាត់បានតែអាស៊ីមតូតឈរ",
                "គ្មានចម្លើយ"
            ],
            "correct": 0,
            "explanation": "ក្រាបអាចកាត់អាស៊ីមតូតដេក ឬទ្រេតត្រង់តម្លៃ $x$ មួយចំនួន ប៉ុន្តែវាមិនអាចកាត់អាស៊ីមតូតឈរបានឡើយ។"
        },
        {
            "question": "ផ្ចិតស៊ីមេទ្រីនៃក្រាប $f(x) = x^3 - 3x^2 + 1$ គឺជា ៖",
            "options": [
                "ចំណុចរបត់ $I(1, -1)$",
                "$(0, 1)$",
                "$(2, -3)$",
                "$(1, 0)$"
            ],
            "correct": 0,
            "explanation": "ក្រាបអនុគមន៍ដឺក្រេទី ៣ មានចំណុចរបត់ $I$ ជាផ្ចិតស៊ីមេទ្រីជានិច្ច ៖ $x_I = -\\dfrac{b}{3a} = 1 \\implies y_I = -1$។"
        },
        {
            "question": "អ័ក្សស៊ីមេទ្រីនៃប៉ារ៉ាបូល $y = ax^2 + bx + c$ គឺជាបន្ទាត់ ៖",
            "options": [
                "$x = -\\dfrac{b}{2a}$",
                "$y = -\\dfrac{b}{2a}$",
                "$x = 0$",
                "$y = c$"
            ],
            "correct": 0,
            "explanation": "អ័ក្សស៊ីមេទ្រីគឺជាបន្ទាត់ឈរកាត់តាមកំពូល ៖ $x = -\\dfrac{b}{2a}$។"
        },
        {
            "question": "អនុគមន៍គូ (Even Function, $f(-x) = f(x)$) មានក្រាបស៊ីមេទ្រីធៀបនឹង ៖",
            "options": [
                "អ័ក្សអរដោនេ ($Oy$)",
                "គល់តម្រុយ $O$",
                "អ័ក្សអាប់ស៊ីស ($Ox$)",
                "បន្ទាត់ $y = x$"
            ],
            "correct": 0,
            "explanation": "ក្រាបនៃអនុគមន៍គូមានអ័ក្ស $Oy$ ជាអ័ក្សស៊ីមេទ្រី។"
        },
        {
            "question": "អនុគមន៍សេស (Odd Function, $f(-x) = -f(x)$) មានក្រាបស៊ីមេទ្រីធៀបនឹង ៖",
            "options": [
                "គល់តម្រុយ $O(0, 0)$",
                "អ័ក្ស $Oy$",
                "អ័ក្ស $Ox$",
                "បន្ទាត់ $y = -x$"
            ],
            "correct": 0,
            "explanation": "ក្រាបនៃអនុគមន៍សេសមានគល់តម្រុយ $O$ ជាផ្ចិតស៊ីមេទ្រី។"
        },
        {
            "question": "ទីតាំងធៀបរវាងក្រាប $(C)$ និងអាស៊ីមតូតទ្រេត $(D): y = ax + b$ កំណត់ដោយ ៖",
            "options": [
                "សញ្ញានៃផលដក $f(x) - (ax + b)$",
                "ផលបូក",
                "ផលគុណ",
                "ដេរីវេទីពីរ"
            ],
            "correct": 0,
            "explanation": "បើ $f(x) - (ax + b) > 0$ ក្រាបនៅខាងលើបន្ទាត់; បើ $< 0$ ក្រាបនៅខាងក្រោម។"
        },
        {
            "question": "ចំណុចប្រសព្វនៃក្រាប $y = f(x)$ ជាមួយអ័ក្ស $Oy$ រកបានដោយ ៖",
            "options": [
                "ជំនួស $x = 0$ រក $y = f(0)$",
                "ឱ្យ $y = 0$",
                "រក $f'(0)$",
                "រកអាស៊ីមតូត"
            ],
            "correct": 0,
            "explanation": "ចំណុចកាត់អ័ក្ស $Oy$ គឺត្រូវគ្នានឹង $x = 0$ នាំឱ្យ $y = f(0)$។"
        }
    ],

    "les-g12a-1-1": [
        {
            "question": "ទម្រង់ត្រីកោណមាត្រនៃចំនួនកុំផ្លិច $z = a + bi$ ($z \\neq 0$) គឺ ៖",
            "options": [
                "$z = r(\\cos\\theta + i\\sin\\theta)$",
                "$z = r(\\sin\\theta + i\\cos\\theta)$",
                "$z = r(\\cos n\\theta + i\\sin n\\theta)$",
                "$z = r^n(\\cos\\theta + i\\sin\\theta)$"
            ],
            "correct": 0,
            "explanation": "$z = r(\\cos\\theta + i\\sin\\theta)$ ដែល $r = \\sqrt{a^2 + b^2}$ និង $\\tan\\theta = \\dfrac{b}{a}$។"
        },
        {
            "question": "គណនា $(1 + i)^4$ តាមទម្រង់ត្រីកោណមាត្រ ៖",
            "options": [
                "$-4$",
                "$4$",
                "$4i$",
                "$-4i$"
            ],
            "correct": 0,
            "explanation": "$1 + i = \\sqrt{2} e^{i\\pi/4} \\implies (1+i)^4 = (\\sqrt{2})^4 e^{i\\pi} = 4(-1) = -4$។"
        },
        {
            "question": "សរសេរ $z = 1 - i\\sqrt{3}$ ជាទម្រង់ត្រីកោណមាត្រ ៖",
            "options": [
                "$z = 2\\left[\\cos\\left(-\\dfrac{\\pi}{3}\\right) + i\\sin\\left(-\\dfrac{\\pi}{3}\\right)\\right]$",
                "$z = 2\\left(\\cos\\dfrac{\\pi}{3} + i\\sin\\dfrac{\\pi}{3}\\right)$",
                "$z = \\sqrt{2}\\left(\\cos\\dfrac{\\pi}{6} + i\\sin\\dfrac{\\pi}{6}\\right)$",
                "$z = 2\\left[\\cos\\left(-\\dfrac{\\pi}{6}\\right) + i\\sin\\left(-\\dfrac{\\pi}{6}\\right)\\right]$"
            ],
            "correct": 0,
            "explanation": "$r = \\sqrt{1 + 3} = 2, \\cos\\theta = \\dfrac{1}{2}, \\sin\\theta = -\\dfrac{\\sqrt{3}}{2} \\implies \\theta = -\\dfrac{\\pi}{3}$ នាំឱ្យ $z = 2\\left[\\cos\\left(-\\dfrac{\\pi}{3}\\right) + i\\sin\\left(-\\dfrac{\\pi}{3}\\right)\\right]$។"
        },
        {
            "question": "សរសេរ $z = \\sqrt{3} + i$ ជាទម្រង់អិចស្ប៉ូណង់ស្យែល (Euler) ៖",
            "options": [
                "$z = 2e^{i\\dfrac{\\pi}{6}}$",
                "$z = 2e^{i\\dfrac{\\pi}{3}}$",
                "$z = e^{i\\dfrac{\\pi}{6}}$",
                "$z = 2e^{-i\\dfrac{\\pi}{6}}$"
            ],
            "correct": 0,
            "explanation": "$r = \\sqrt{3 + 1} = 2, \\theta = \\dfrac{\\pi}{6} \\implies z = 2e^{i\\dfrac{\\pi}{6}}$។"
        },
        {
            "question": "សមភាពអយល័រ (Euler's Identity) ដ៏ល្បីល្បាញក្នុងគណិតវិទ្យាគឺ ៖",
            "options": [
                "$e^{i\\pi} + 1 = 0$",
                "$e^{i\\pi} = 1$",
                "$e^{i\\pi} - 1 = 0$",
                "$e^{2i\\pi} = 0$"
            ],
            "correct": 0,
            "explanation": "$e^{i\\pi} = \\cos\\pi + i\\sin\\pi = -1 \\implies e^{i\\pi} + 1 = 0$។"
        },
        {
            "question": "គណនា $(1 + i\\sqrt{3})^6$ ៖",
            "options": [
                "$64$",
                "$-64$",
                "$64i$",
                "$0$"
            ],
            "correct": 0,
            "explanation": "$1 + i\\sqrt{3} = 2e^{i\\pi/3} \\implies (2e^{i\\pi/3})^6 = 2^6 e^{i 2\\pi} = 64(1) = 64$។"
        },
        {
            "question": "ផលគុណនៃ $z_1 = 2e^{i\\pi/3}$ និង $z_2 = 3e^{i\\pi/6}$ គឺ ៖",
            "options": [
                "$6i$",
                "$-6$",
                "$6$",
                "$5i$"
            ],
            "correct": 0,
            "explanation": "$z_1 z_2 = 2 \\times 3 e^{i(\\pi/3 + \\pi/6)} = 6e^{i\\pi/2} = 6i$។"
        },
        {
            "question": "ផលចែក $\\dfrac{z_1}{z_2}$ នៃ $z_1 = 4e^{i\\pi/2}$ និង $z_2 = 2e^{i\\pi/6}$ គឺ ៖",
            "options": [
                "$1 + i\\sqrt{3}$",
                "$2i$",
                "$\\sqrt{3} + i$",
                "$2$"
            ],
            "correct": 0,
            "explanation": "$\\dfrac{z_1}{z_2} = \\dfrac{4}{2} e^{i(\\pi/2 - \\pi/6)} = 2e^{i\\pi/3} = 2\\left(\\dfrac{1}{2} + i\\dfrac{\\sqrt{3}}{2}\\right) = 1 + i\\sqrt{3}$។"
        },
        {
            "question": "លីនេអ៊ែរកម្ម (Linearization) នៃ $\\cos^2 x$ តាមកុំផ្លិចគឺ ៖",
            "options": [
                "$\\dfrac{1 + \\cos 2x}{2}$",
                "$\\dfrac{1 - \\cos 2x}{2}$",
                "$\\dfrac{1 + \\sin 2x}{2}$",
                "$\\cos 2x + 1$"
            ],
            "correct": 0,
            "explanation": "$\\cos x = \\dfrac{e^{ix} + e^{-ix}}{2} \\implies \\cos^2 x = \\dfrac{e^{2ix} + 2 + e^{-2ix}}{4} = \\dfrac{2 + 2\\cos 2x}{4} = \\dfrac{1 + \\cos 2x}{2}$។"
        },
        {
            "question": "រូបមន្តអយល័រសម្រាប់ $\\sin x$ គឺ ៖",
            "options": [
                "$\\sin x = \\dfrac{e^{ix} - e^{-ix}}{2i}$",
                "$\\sin x = \\dfrac{e^{ix} + e^{-ix}}{2}$",
                "$\\sin x = \\dfrac{e^{ix} - e^{-ix}}{2}$",
                "$\\sin x = \\dfrac{e^{ix} + e^{-ix}}{2i}$"
            ],
            "correct": 0,
            "explanation": "រូបមន្ត Euler: $\\sin x = \\dfrac{e^{ix} - e^{-ix}}{2i}$ និង $\\cos x = \\dfrac{e^{ix} + e^{-ix}}{2}$។"
        }
    ],

    "les-g12b-2-1": [
        {
            "question": "ដេរីវេនៃអនុគមន៍ស្វ័យគុណបណ្តាក់ $[u(x)]^n$ គឺ ៖",
            "options": [
                "$n \\cdot u' \\cdot u^{n-1}$",
                "$n \\cdot u^{n-1}$",
                "$u' \\cdot u^n$",
                "$\\dfrac{u^{n+1}}{n+1}$"
            ],
            "correct": 0,
            "explanation": "$([u(x)]^n)' = n u' u^{n-1}$។"
        },
        {
            "question": "គណនាដេរីវេនៃ $f(x) = (2x + 1)^3$ ៖",
            "options": [
                "$6(2x + 1)^2$",
                "$3(2x + 1)^2$",
                "$2(2x + 1)^2$",
                "$6x^2 + 1$"
            ],
            "correct": 0,
            "explanation": "$f'(x) = 3(2x + 1)'(2x + 1)^2 = 3(2)(2x + 1)^2 = 6(2x + 1)^2$។"
        },
        {
            "question": "ដេរីវេនៃ $f(x) = \\sqrt{u(x)}$ ($u > 0$) គឺ ៖",
            "options": [
                "$\\dfrac{u'}{2\\sqrt{u}}$",
                "$\\dfrac{1}{2\\sqrt{u}}$",
                "$\\dfrac{u'}{\\sqrt{u}}$",
                "$2u'\\sqrt{u}$"
            ],
            "correct": 0,
            "explanation": "$(\\sqrt{u})' = \\dfrac{u'}{2\\sqrt{u}}$។"
        },
        {
            "question": "គណនាដេរីវេនៃ $f(x) = \\sqrt{2x + 3}$ ៖",
            "options": [
                "$\\dfrac{1}{\\sqrt{2x + 3}}$",
                "$\\dfrac{2}{\\sqrt{2x + 3}}$",
                "$\\dfrac{1}{2\\sqrt{2x + 3}}$",
                "$\\sqrt{2}$"
            ],
            "correct": 0,
            "explanation": "$f'(x) = \\dfrac{(2x + 3)'}{2\\sqrt{2x + 3}} = \\dfrac{2}{2\\sqrt{2x + 3}} = \\dfrac{1}{\\sqrt{2x + 3}}$។"
        },
        {
            "question": "ដេរីវេនៃ $f(x) = \\ln(2x + 3)$ គឺ ៖",
            "options": [
                "$\\dfrac{2}{2x + 3}$",
                "$\\dfrac{1}{2x + 3}$",
                "$2\\ln(2x + 3)$",
                "$\\dfrac{2x}{2x + 3}$"
            ],
            "correct": 0,
            "explanation": "$[\\ln(u)]' = \\dfrac{u'}{u} = \\dfrac{(2x + 3)'}{2x + 3} = \\dfrac{2}{2x + 3}$។"
        },
        {
            "question": "ដេរីវេនៃ $f(x) = \\sin(3x)$ គឺ ៖",
            "options": [
                "$3\\cos(3x)$",
                "$\\cos(3x)$",
                "$-3\\cos(3x)$",
                "$3\\sin(3x)$"
            ],
            "correct": 0,
            "explanation": "$[\\sin(u)]' = u' \\cos u = (3x)' \\cos(3x) = 3\\cos(3x)$។"
        },
        {
            "question": "ដេរីវេនៃ $f(x) = \\cos(x^2)$ គឺ ៖",
            "options": [
                "$-2x\\sin(x^2)$",
                "$2x\\cos(x^2)$",
                "$-\\sin(x^2)$",
                "$-2x\\cos(x^2)$"
            ],
            "correct": 0,
            "explanation": "$[\\cos(u)]' = -u' \\sin u = -(x^2)' \\sin(x^2) = -2x\\sin(x^2)$។"
        },
        {
            "question": "ដេរីវេនៃ $f(x) = e^{3x + 1}$ គឺ ៖",
            "options": [
                "$3e^{3x + 1}$",
                "$e^{3x + 1}$",
                "$\\dfrac{1}{3}e^{3x + 1}$",
                "$3x e^{3x}$"
            ],
            "correct": 0,
            "explanation": "$(e^u)' = u' e^u = 3e^{3x + 1}$។"
        },
        {
            "question": "គណនាដេរីវេនៃ $f(x) = x e^x$ ៖",
            "options": [
                "$(x + 1)e^x$",
                "$e^x$",
                "$x e^x$",
                "$(x - 1)e^x$"
            ],
            "correct": 0,
            "explanation": "$f'(x) = (x)' e^x + x(e^x)' = 1 \\cdot e^x + x e^x = (x + 1)e^x$។"
        },
        {
            "question": "ដេរីវេនៃ $\\tan x$ គឺ ៖",
            "options": [
                "$\\dfrac{1}{\\cos^2 x} = 1 + \\tan^2 x$",
                "$\\dfrac{1}{\\sin^2 x}$",
                "$\\cot x$",
                "$\\cos^2 x$"
            ],
            "correct": 0,
            "explanation": "$(\\tan x)' = \\dfrac{1}{\\cos^2 x} = 1 + \\tan^2 x$។"
        }
    ]
}
