# -*- coding: utf-8 -*-
"""
Mathematical overhauls for Grade 12 Basic & Advanced courses.
All math expressions are converted to standard LaTeX KaTeX notation with \dfrac, \int, \lim\limits, \sin, \cos, etc.
"""

G12_FIXES = {
    "les-g12b-4-1": [
        {
            "question": "អនុគមន៍ $F(x)$ ហៅថាព្រីមីទីវនៃ $f(x)$ លើចន្លោះ $I$ លុះត្រាតែ ៖",
            "options": [
                "$F'(x) = f(x)$ ចំពោះគ្រប់ $x \\in I$",
                "$f'(x) = F(x)$",
                "$F(x) \\cdot f(x) = 1$",
                "$F(x) = f'(x)$"
            ],
            "correct": 0,
            "explanation": "និយមន័យព្រីមីទីវ៖ ដេរីវេនៃព្រីមីទីវស្មើនឹងអនុគមន៍ដើម ($F'(x) = f(x)$)។"
        },
        {
            "question": "អាំងតេក្រាលមិនកំណត់នៃ $f(x) = x^n$ ($n \\neq -1$) គឺ $\\int x^n \\, dx = ?$",
            "options": [
                "$\\dfrac{x^{n+1}}{n + 1} + C$",
                "$n x^{n-1} + C$",
                "$x^{n+1} + C$",
                "$\\dfrac{x^n}{n} + C$"
            ],
            "correct": 0,
            "explanation": "$\\int x^n \\, dx = \\dfrac{x^{n+1}}{n + 1} + C$។"
        },
        {
            "question": "អាំងតេក្រាលមិនកំណត់ $\\int \\dfrac{1}{x} \\, dx$ ($x > 0$) គឺ ៖",
            "options": [
                "$\\ln x + C$",
                "$-\\dfrac{1}{x^2} + C$",
                "$1 + C$",
                "$e^x + C$"
            ],
            "correct": 0,
            "explanation": "$\\int \\dfrac{1}{x} \\, dx = \\ln|x| + C$។"
        },
        {
            "question": "គណនាអាំងតេក្រាល៖ $\\int (3x^2 - 4x + 5) \\, dx = ?$",
            "options": [
                "$x^3 - 2x^2 + 5x + C$",
                "$6x - 4 + C$",
                "$x^3 - 4x^2 + 5x + C$",
                "$3x^3 - 2x^2 + C$"
            ],
            "correct": 0,
            "explanation": "$3\\left(\\dfrac{x^3}{3}\\right) - 4\\left(\\dfrac{x^2}{2}\\right) + 5x + C = x^3 - 2x^2 + 5x + C$។"
        },
        {
            "question": "អាំងតេក្រាល $\\int \\cos x \\, dx$ គឺ ៖",
            "options": [
                "$\\sin x + C$",
                "$-\\sin x + C$",
                "$\\cos x + C$",
                "$-\\cos x + C$"
            ],
            "correct": 0,
            "explanation": "$\\int \\cos x \\, dx = \\sin x + C$ (ព្រោះ $(\\sin x)' = \\cos x$)។"
        },
        {
            "question": "អាំងតេក្រាល $\\int \\sin x \\, dx$ គឺ ៖",
            "options": [
                "$-\\cos x + C$",
                "$\\cos x + C$",
                "$-\\sin x + C$",
                "$\\tan x + C$"
            ],
            "correct": 0,
            "explanation": "$\\int \\sin x \\, dx = -\\cos x + C$ (ព្រោះ $(-\\cos x)' = \\sin x$)។"
        },
        {
            "question": "អាំងតេក្រាល $\\int (2x + 1)^4 \\, dx$ គឺ ៖",
            "options": [
                "$\\dfrac{1}{10}(2x + 1)^5 + C$",
                "$\\dfrac{1}{5}(2x + 1)^5 + C$",
                "$4(2x + 1)^3 + C$",
                "$(2x + 1)^5 + C$"
            ],
            "correct": 0,
            "explanation": "តាង $u = 2x + 1 \\implies du = 2\\,dx \\implies \\int u^4 \\dfrac{du}{2} = \\dfrac{1}{2} \\cdot \\dfrac{u^5}{5} = \\dfrac{1}{10}(2x + 1)^5 + C$។"
        },
        {
            "question": "អាំងតេក្រាល $\\int e^{3x} \\, dx$ គឺ ៖",
            "options": [
                "$\\dfrac{1}{3} e^{3x} + C$",
                "$3 e^{3x} + C$",
                "$e^{3x} + C$",
                "$\\dfrac{1}{3} e^x + C$"
            ],
            "correct": 0,
            "explanation": "$\\int e^{ax} \\, dx = \\dfrac{1}{a} e^{ax} + C \\implies \\dfrac{1}{3} e^{3x} + C$។"
        },
        {
            "question": "រកព្រីមីទីវ $F(x)$ នៃ $f(x) = 2x + 3$ ដោយដឹងថា $F(1) = 6$ ៖",
            "options": [
                "$F(x) = x^2 + 3x + 2$",
                "$F(x) = x^2 + 3x + 6$",
                "$F(x) = x^2 + 3x$",
                "$F(x) = 2x^2 + 3x + 1$"
            ],
            "correct": 0,
            "explanation": "$F(x) = x^2 + 3x + C \\implies F(1) = 1 + 3 + C = 6 \\implies C = 2$ នាំឱ្យ $F(x) = x^2 + 3x + 2$។"
        },
        {
            "question": "អាំងតេក្រាលនៃអនុគមន៍ថេរ $k$ គឺ $\\int k \\, dx = ?$",
            "options": [
                "$kx + C$",
                "$0$",
                "$k + C$",
                "$\\dfrac{k^2}{2} + C$"
            ],
            "correct": 0,
            "explanation": "$\\int k \\, dx = kx + C$។"
        }
    ],

    "les-g12b-4-2": [
        {
            "question": "រូបមន្តញូតុន-ឡែបនីស (Newton-Leibniz) សម្រាប់អាំងតេក្រាលកំណត់ $\\int_{a}^{b} f(x) \\, dx$ គឺ ៖",
            "options": [
                "$F(b) - F(a)$ (ដែល $F' = f$)",
                "$F(a) - F(b)$",
                "$F(b) + F(a)$",
                "$f(b) - f(a)$"
            ],
            "correct": 0,
            "explanation": "រូបមន្តញូតុន-ឡែបនីស៖ $\\int_{a}^{b} f(x) \\, dx = [F(x)]_a^b = F(b) - F(a)$។"
        },
        {
            "question": "គណនាអាំងតេក្រាលកំណត់៖ $\\int_{0}^{2} (2x + 1) \\, dx$ ៖",
            "options": [
                "$6$",
                "$4$",
                "$5$",
                "$8$"
            ],
            "correct": 0,
            "explanation": "$[x^2 + x]_0^2 = (2^2 + 2) - 0 = 4 + 2 = 6$។"
        },
        {
            "question": "គណនា៖ $\\int_{1}^{3} x^2 \\, dx$ ៖",
            "options": [
                "$\\dfrac{26}{3}$",
                "$9$",
                "$27$",
                "$8$"
            ],
            "correct": 0,
            "explanation": "$\\left[\\dfrac{x^3}{3}\\right]_1^3 = \\dfrac{27}{3} - \\dfrac{1}{3} = \\dfrac{26}{3}$។"
        },
        {
            "question": "ក្រឡាផ្ទៃ $S$ នៃដែនកំណត់ដោយក្រាប $y = f(x)$ ($f(x) \\ge 0$), អ័ក្ស $Ox$ និងបន្ទាត់ $x = a$, $x = b$ គឺ ៖",
            "options": [
                "$S = \\int_{a}^{b} f(x) \\, dx$",
                "$S = \\int_{a}^{b} [f(x)]^2 \\, dx$",
                "$S = f(b) - f(a)$",
                "$S = f'(b) - f'(a)$"
            ],
            "correct": 0,
            "explanation": "ក្រឡាផ្ទៃក្រោមខ្សែគោងវិជ្ជមានគឺ $S = \\int_{a}^{b} f(x) \\, dx$។"
        },
        {
            "question": "គណនាក្រឡាផ្ទៃកំណត់ដោយក្រាប $y = x^2$, អ័ក្ស $Ox$, $x = 0$ និង $x = 3$ ៖",
            "options": [
                "$9$",
                "$27$",
                "$3$",
                "$18$"
            ],
            "correct": 0,
            "explanation": "$S = \\int_{0}^{3} x^2 \\, dx = \\left[\\dfrac{x^3}{3}\\right]_0^3 = \\dfrac{27}{3} = 9$ (ឯកតាផ្ទៃ)។"
        },
        {
            "question": "គណនា៖ $\\int_{0}^{\\pi} \\sin x \\, dx$ ៖",
            "options": [
                "$2$",
                "$0$",
                "$1$",
                "$-2$"
            ],
            "correct": 0,
            "explanation": "$[ -\\cos x ]_0^\\pi = -\\cos\\pi - (-\\cos 0) = -(-1) + 1 = 1 + 1 = 2$។"
        },
        {
            "question": "លក្ខណៈឆ្លាស់ព្រំដែន៖ $\\int_{b}^{a} f(x) \\, dx$ ស្មើនឹង ៖",
            "options": [
                "$-\\int_{a}^{b} f(x) \\, dx$",
                "$\\int_{a}^{b} f(x) \\, dx$",
                "$0$",
                "$\\dfrac{1}{\\int_{a}^{b} f(x) \\, dx}$"
            ],
            "correct": 0,
            "explanation": "កាលណាត្រឡប់ព្រំដែន អាំងតេក្រាលប្តូរសញ្ញា ៖ $\\int_{b}^{a} f(x) \\, dx = -\\int_{a}^{b} f(x) \\, dx$។"
        },
        {
            "question": "លក្ខណៈឆាស (Chasles' Relation)៖ $\\int_{a}^{c} f(x) \\, dx + \\int_{c}^{b} f(x) \\, dx = ?$",
            "options": [
                "$\\int_{a}^{b} f(x) \\, dx$",
                "$\\int_{a}^{c} f(x) \\, dx$",
                "$2\\int_{a}^{b} f(x) \\, dx$",
                "$0$"
            ],
            "correct": 0,
            "explanation": "ទំនាក់ទំនងឆាស៖ $\\int_{a}^{c} f(x) \\, dx + \\int_{c}^{b} f(x) \\, dx = \\int_{a}^{b} f(x) \\, dx$។"
        },
        {
            "question": "ក្រឡាផ្ទៃរវាងក្រាបពីរ $y = f(x)$ និង $y = g(x)$ លើ $[a, b]$ (ដោយ $f \\ge g$) គឺ ៖",
            "options": [
                "$S = \\int_{a}^{b} [f(x) - g(x)] \\, dx$",
                "$S = \\int_{a}^{b} [f(x) + g(x)] \\, dx$",
                "$S = \\int_{a}^{b} f(x) \\cdot g(x) \\, dx$",
                "$S = f(b) - g(a)$"
            ],
            "correct": 0,
            "explanation": "$S = \\int_{a}^{b} [f(x) - g(x)] \\, dx$ (យកអនុគមន៍ខាងលើដកអនុគមន៍ខាងក្រោម)។"
        },
        {
            "question": "គណនា៖ $\\int_{0}^{1} e^x \\, dx$ ៖",
            "options": [
                "$e - 1$",
                "$e$",
                "$1$",
                "$e + 1$"
            ],
            "correct": 0,
            "explanation": "$[e^x]_0^1 = e^1 - e^0 = e - 1$។"
        }
    ],

    "les-g12a-4-1": [
        {
            "question": "រូបមន្តអាំងតេក្រាលដោយផ្នែក (Integration by Parts) គឺ ៖",
            "options": [
                "$\\int u \\, dv = uv - \\int v \\, du$",
                "$\\int u \\, dv = uv + \\int v \\, du$",
                "$\\int u \\, dv = u'v - uv'$",
                "$\\int u \\, dv = \\dfrac{uv}{2}$"
            ],
            "correct": 0,
            "explanation": "រូបមន្តអាំងតេក្រាលដោយផ្នែក៖ $\\int u \\, dv = uv - \\int v \\, du$។"
        },
        {
            "question": "វិធានអាទិភាពជ្រើសរើស $u$ ក្នុងអាំងតេក្រាលដោយផ្នែកគឺ ៖",
            "options": [
                "LIATE (Log, Inverse trig, Algebraic, Trig, Exponential)",
                "ETIAL",
                "តាមលំដាប់ស្រេចចិត្ត",
                "ជ្រើសរើសតែ $e^x$"
            ],
            "correct": 0,
            "explanation": "វិធាន LIATE៖ Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential។"
        },
        {
            "question": "គណនាអាំងតេក្រាល៖ $\\int x e^x \\, dx$ ៖",
            "options": [
                "$(x - 1)e^x + C$",
                "$(x + 1)e^x + C$",
                "$x^2 e^x + C$",
                "$e^x + C$"
            ],
            "correct": 0,
            "explanation": "តាង $u = x \\implies du = dx$; $dv = e^x \\, dx \\implies v = e^x \\implies \\int x e^x \\, dx = x e^x - \\int e^x \\, dx = (x - 1)e^x + C$។"
        },
        {
            "question": "គណនាអាំងតេក្រាល៖ $\\int \\ln x \\, dx$ ៖",
            "options": [
                "$x \\ln x - x + C$",
                "$\\dfrac{1}{x} + C$",
                "$x \\ln x + C$",
                "$\\ln x + C$"
            ],
            "correct": 0,
            "explanation": "តាង $u = \\ln x, dv = dx \\implies v = x \\implies \\int \\ln x \\, dx = x \\ln x - \\int x \\cdot \\dfrac{1}{x} \\, dx = x \\ln x - x + C$។"
        },
        {
            "question": "គណនាអាំងតេក្រាលជំនួសអថេរ៖ $\\int 2x (x^2 + 1)^5 \\, dx$ ៖",
            "options": [
                "$\\dfrac{1}{6}(x^2 + 1)^6 + C$",
                "$(x^2 + 1)^6 + C$",
                "$\\dfrac{1}{5}(x^2 + 1)^6 + C$",
                "$2(x^2 + 1)^6 + C$"
            ],
            "correct": 0,
            "explanation": "តាង $u = x^2 + 1 \\implies du = 2x \\, dx \\implies \\int u^5 \\, du = \\dfrac{u^6}{6} + C = \\dfrac{1}{6}(x^2 + 1)^6 + C$។"
        },
        {
            "question": "គណនា៖ $\\int x \\cos x \\, dx$ ៖",
            "options": [
                "$x \\sin x + \\cos x + C$",
                "$x \\sin x - \\cos x + C$",
                "$-x \\cos x + C$",
                "$\\sin x + C$"
            ],
            "correct": 0,
            "explanation": "តាង $u = x, dv = \\cos x \\, dx \\implies v = \\sin x \\implies \\int x \\cos x \\, dx = x \\sin x - \\int \\sin x \\, dx = x \\sin x + \\cos x + C$។"
        },
        {
            "question": "គណនាអាំងតេក្រាល៖ $\\int \\dfrac{1}{x \\ln x} \\, dx$ ($x > 1$) ៖",
            "options": [
                "$\\ln|\\ln x| + C$",
                "$\\ln|x| + C$",
                "$\\dfrac{1}{\\ln x} + C$",
                "$\\dfrac{(\\ln x)^2}{2} + C$"
            ],
            "correct": 0,
            "explanation": "តាង $u = \\ln x \\implies du = \\dfrac{dx}{x} \\implies \\int \\dfrac{du}{u} = \\ln|u| + C = \\ln|\\ln x| + C$។"
        },
        {
            "question": "គណនា៖ $\\int \\dfrac{e^x}{e^x + 1} \\, dx$ ៖",
            "options": [
                "$\\ln(e^x + 1) + C$",
                "$e^x + 1 + C$",
                "$\\dfrac{1}{e^x + 1} + C$",
                "$x + C$"
            ],
            "correct": 0,
            "explanation": "ទម្រង់ $\\int \\dfrac{u'}{u} \\, dx = \\ln|u| + C = \\ln(e^x + 1) + C$ (ព្រោះ $e^x + 1 > 0$)។"
        },
        {
            "question": "គណនា៖ $\\int \\tan x \\, dx$ ៖",
            "options": [
                "$-\\ln|\\cos x| + C$ (ឬ $\\ln|\\sec x| + C$)",
                "$\\ln|\\sin x| + C$",
                "$\\sec^2 x + C$",
                "$\\cos x + C$"
            ],
            "correct": 0,
            "explanation": "$\\int \\dfrac{\\sin x}{\\cos x} \\, dx = -\\int \\dfrac{-\\sin x}{\\cos x} \\, dx = -\\ln|\\cos x| + C$។"
        },
        {
            "question": "អាំងតេក្រាលត្រឡប់ជុំ (Cyclic integration) $\\int e^x \\sin x \\, dx$ ស្មើនឹង ៖",
            "options": [
                "$\\dfrac{1}{2} e^x (\\sin x - \\cos x) + C$",
                "$e^x (\\sin x + \\cos x) + C$",
                "$e^x \\cos x + C$",
                "$0$"
            ],
            "correct": 0,
            "explanation": "ធ្វើអាំងតេក្រាលដោយផ្នែកពីរដង រួចបោះត្រឡប់មករក $I$ នាំឱ្យ $I = \\dfrac{1}{2} e^x (\\sin x - \\cos x) + C$។"
        }
    ],

    "les-g12a-4-2": [
        {
            "question": "មាឌសូលីតបដិវត្តន៍បង្កើតដោយការរង្វិលជុំវិញអ័ក្ស $Ox$ នៃក្រាប $y = f(x)$ លើ $[a, b]$ គឺ ៖",
            "options": [
                "$V = \\pi \\int_{a}^{b} [f(x)]^2 \\, dx$",
                "$V = 2\\pi \\int_{a}^{b} f(x) \\, dx$",
                "$V = \\int_{a}^{b} f(x) \\, dx$",
                "$V = \\pi^2 \\int_{a}^{b} f(x) \\, dx$"
            ],
            "correct": 0,
            "explanation": "រូបមន្តមាឌបដិវត្តន៍ជុំវិញ $Ox$ (វិធីសាស្ត្របន្ទះឌីស) ៖ $V = \\pi \\int_{a}^{b} [f(x)]^2 \\, dx$។"
        },
        {
            "question": "មាឌសូលីតបដិវត្តន៍បង្កើតដោយការរង្វិលជុំវិញអ័ក្ស $Oy$ នៃក្រាប $x = g(y)$ លើ $[c, d]$ គឺ ៖",
            "options": [
                "$V = \\pi \\int_{c}^{d} [g(y)]^2 \\, dy$",
                "$V = \\pi \\int [f(x)]^2 \\, dx$",
                "$V = 2\\pi \\int y \\, dy$",
                "$V = \\int g(y) \\, dy$"
            ],
            "correct": 0,
            "explanation": "រង្វិលជុំវិញ $Oy$ ៖ $V = \\pi \\int_{c}^{d} [g(y)]^2 \\, dy$។"
        },
        {
            "question": "គណនាមាឌសូលីតបដិវត្តន៍កើតពីរង្វិលក្រាប $y = \\sqrt{x}$ ជុំវិញ $Ox$ លើ $[0, 4]$ ៖",
            "options": [
                "$8\\pi$",
                "$16\\pi$",
                "$4\\pi$",
                "$2\\pi$"
            ],
            "correct": 0,
            "explanation": "$V = \\pi \\int_{0}^{4} (\\sqrt{x})^2 \\, dx = \\pi \\int_{0}^{4} x \\, dx = \\pi \\left[\\dfrac{x^2}{2}\\right]_0^4 = \\pi \\left(\\dfrac{16}{2}\\right) = 8\\pi$។"
        },
        {
            "question": "ស្រាយរូបមន្តមាឌស្វ៊ែរកាំ $R$ ដោយរង្វិលកន្លះរង្វង់ $y = \\sqrt{R^2 - x^2}$ លើ $[-R, R]$ ជុំវិញ $Ox$ ៖",
            "options": [
                "$V = \\dfrac{4}{3} \\pi R^3$",
                "$V = \\dfrac{4}{3} \\pi R^2$",
                "$V = 2\\pi R^3$",
                "$V = \\pi R^3$"
            ],
            "correct": 0,
            "explanation": "$V = \\pi \\int_{-R}^{R} (R^2 - x^2) \\, dx = 2\\pi \\left[R^2 x - \\dfrac{x^3}{3}\\right]_0^R = 2\\pi\\left(\\dfrac{2R^3}{3}\\right) = \\dfrac{4}{3}\\pi R^3$។"
        },
        {
            "question": "ក្រឡាផ្ទៃរវាងប៉ារ៉ាបូល $y = x^2$ និងបន្ទាត់ $y = x$ គឺ ៖",
            "options": [
                "$\\dfrac{1}{6}$",
                "$\\dfrac{1}{3}$",
                "$\\dfrac{1}{2}$",
                "$1$"
            ],
            "correct": 0,
            "explanation": "ចំណុចប្រសព្វ $x^2 = x \\implies x = 0, x = 1$។ $S = \\int_{0}^{1} (x - x^2) \\, dx = \\left[\\dfrac{x^2}{2} - \\dfrac{x^3}{3}\\right]_0^1 = \\dfrac{1}{2} - \\dfrac{1}{3} = \\dfrac{1}{6}$។"
        },
        {
            "question": "គណនាក្រឡាផ្ទៃរវាងក្រាប $y = x^2 - 4$ និងអ័ក្ស $Ox$ ៖",
            "options": [
                "$\\dfrac{32}{3}$",
                "$\\dfrac{16}{3}$",
                "$8$",
                "$0$"
            ],
            "correct": 0,
            "explanation": "កាត់ $Ox$ ត្រង់ $x = \\pm 2$។ $S = \\int_{-2}^{2} (4 - x^2) \\, dx = 2\\left[4x - \\dfrac{x^3}{3}\\right]_0^2 = 2\\left(8 - \\dfrac{8}{3}\\right) = \\dfrac{32}{3}$។"
        },
        {
            "question": "មាឌសូលីតរង្វិលរវាងក្រាបពីរ $y = f(x)$ និង $y = g(x)$ ($f \\ge g \\ge 0$) ជុំវិញ $Ox$ លើ $[a, b]$ គឺ ៖",
            "options": [
                "$V = \\pi \\int_{a}^{b} ([f(x)]^2 - [g(x)]^2) \\, dx$",
                "$V = \\pi \\int [f(x) - g(x)]^2 \\, dx$",
                "$V = \\pi \\int (f - g) \\, dx$",
                "$V = 2\\pi \\int f g \\, dx$"
            ],
            "correct": 0,
            "explanation": "វិធីសាស្ត្រក្រវ៉ាត់ (Washer method) ៖ $V = \\pi \\int_{a}^{b} ([f(x)]^2 - [g(x)]^2) \\, dx$។"
        },
        {
            "question": "តម្លៃមធ្យមនៃអនុគមន៍ $f(x)$ លើចន្លោះ $[a, b]$ គណនាតាមរូបមន្ត ៖",
            "options": [
                "$f_{\\text{avg}} = \\dfrac{1}{b - a} \\int_{a}^{b} f(x) \\, dx$",
                "$f_{\\text{avg}} = \\dfrac{f(a) + f(b)}{2}$",
                "$f_{\\text{avg}} = \\int_{a}^{b} f(x) \\, dx$",
                "$f_{\\text{avg}} = f'(c)$"
            ],
            "correct": 0,
            "explanation": "តម្លៃមធ្យមនៃអនុគមន៍៖ $f_{\\text{avg}} = \\dfrac{1}{b - a} \\int_{a}^{b} f(x) \\, dx$។"
        },
        {
            "question": "គណនាតម្លៃមធ្យមនៃ $f(x) = 2x$ លើ $[0, 4]$ ៖",
            "options": [
                "$4$",
                "$8$",
                "$2$",
                "$16$"
            ],
            "correct": 0,
            "explanation": "$f_{\\text{avg}} = \\dfrac{1}{4} \\int_{0}^{4} 2x \\, dx = \\dfrac{1}{4} [x^2]_0^4 = \\dfrac{16}{4} = 4$។"
        },
        {
            "question": "ប្រវែងធ្នូនៃខ្សែគោង $y = f(x)$ ពី $x = a$ ទៅ $x = b$ គឺ ៖",
            "options": [
                "$L = \\int_{a}^{b} \\sqrt{1 + [f'(x)]^2} \\, dx$",
                "$L = \\int_{a}^{b} \\sqrt{1 + f(x)} \\, dx$",
                "$L = \\int_{a}^{b} f'(x) \\, dx$",
                "$L = \\int_{a}^{b} [f'(x)]^2 \\, dx$"
            ],
            "correct": 0,
            "explanation": "រូបមន្តប្រវែងធ្នូ៖ $L = \\int_{a}^{b} \\sqrt{1 + [f'(x)]^2} \\, dx$។"
        }
    ],

    "les-g12a-4-3": [
        {
            "question": "ចម្លើយទូទៅនៃសមីការឌីផេរ៉ង់ស្យែល $y' + ay = 0$ ($a$ ជាចំនួនថេរ) គឺ ៖",
            "options": [
                "$y = C e^{-ax}$",
                "$y = C e^{ax}$",
                "$y = -ax + C$",
                "$y = C \\ln(ax)$"
            ],
            "correct": 0,
            "explanation": "$\\dfrac{y'}{y} = -a \\implies \\ln|y| = -ax + k \\implies y = C e^{-ax}$ (ដែល $C$ ជាចំនួនថេរ)។"
        },
        {
            "question": "ដោះស្រាយសមីការឌីផេរ៉ង់ស្យែល៖ $y' - 3y = 0$",
            "options": [
                "$y = C e^{3x}$",
                "$y = C e^{-3x}$",
                "$y = 3x + C$",
                "$y = e^{3x} + C$"
            ],
            "correct": 0,
            "explanation": "$a = -3 \\implies y = C e^{-(-3)x} = C e^{3x}$។"
        },
        {
            "question": "រកចម្លើយពិសេសនៃ $y' + 2y = 0$ ដោយដឹងថា $y(0) = 5$ ៖",
            "options": [
                "$y = 5 e^{-2x}$",
                "$y = 5 e^{2x}$",
                "$y = 2 e^{-5x}$",
                "$y = e^{-2x} + 4$"
            ],
            "correct": 0,
            "explanation": "$y = C e^{-2x} \\implies y(0) = C e^0 = C = 5$ នាំឱ្យ $y = 5 e^{-2x}$។"
        },
        {
            "question": "ចម្លើយទូទៅនៃសមីការឌីផេរ៉ង់ស្យែលលំដាប់ពីរ $y'' + \\omega^2 y = 0$ គឺ ៖",
            "options": [
                "$y = A \\cos(\\omega x) + B \\sin(\\omega x)$",
                "$y = A e^{\\omega x} + B e^{-\\omega x}$",
                "$y = (Ax + B) e^{\\omega x}$",
                "$y = A \\cos(\\omega x)$"
            ],
            "correct": 0,
            "explanation": "សមីការសម្គាល់ $r^2 + \\omega^2 = 0 \\implies r = \\pm i\\omega$ នាំឱ្យចម្លើយគឺ $y = A \\cos(\\omega x) + B \\sin(\\omega x)$ (ចលនាលំយោលអាម៉ូនិច)។"
        },
        {
            "question": "ដោះស្រាយសមីការឌីផេរ៉ង់ស្យែល៖ $y'' + 9y = 0$",
            "options": [
                "$y = A \\cos(3x) + B \\sin(3x)$",
                "$y = A \\cos(9x) + B \\sin(9x)$",
                "$y = A e^{3x} + B e^{-3x}$",
                "$y = 3 \\cos x$"
            ],
            "correct": 0,
            "explanation": "$\\omega^2 = 9 \\implies \\omega = 3$ នាំឱ្យ $y = A \\cos(3x) + B \\sin(3x)$។"
        },
        {
            "question": "សមីការសម្គាល់នៃ $y'' - 4y' + 3y = 0$ គឺ ៖",
            "options": [
                "$r^2 - 4r + 3 = 0 \\implies r = 1, r = 3$",
                "$r^2 + 4r + 3 = 0$",
                "$r^2 - 3r + 4 = 0$",
                "$2r - 4 = 0$"
            ],
            "correct": 0,
            "explanation": "$r^2 - 4r + 3 = 0 \\implies (r - 1)(r - 3) = 0 \\implies r = 1, r = 3$។"
        },
        {
            "question": "ចម្លើយទូទៅនៃ $y'' - 4y' + 3y = 0$ គឺ ៖",
            "options": [
                "$y = A e^x + B e^{3x}$",
                "$y = (Ax + B) e^{3x}$",
                "$y = A \\cos x + B \\sin(3x)$",
                "$y = e^x + e^{3x}$"
            ],
            "correct": 0,
            "explanation": "ដោយសារមានឫសពិតពីរផ្សេងគ្នា $r_1 = 1, r_2 = 3$ នាំឱ្យ $y = A e^x + B e^{3x}$។"
        },
        {
            "question": "ចម្លើយទូទៅនៃ $y'' - 4y' + 4y = 0$ (មានឫសឌុប $r_0 = 2$) គឺ ៖",
            "options": [
                "$y = (Ax + B) e^{2x}$",
                "$y = A e^{2x} + B e^{-2x}$",
                "$y = A e^{2x}$",
                "$y = Ax e^{2x}$"
            ],
            "correct": 0,
            "explanation": "ករណីឫសឌុប $r_0 = 2$ ៖ $y = (Ax + B) e^{2x}$។"
        },
        {
            "question": "ចម្លើយពិសេសនៃសមីការមិនអូម៉ូសែន $y' + 2y = 4$ គឺ ៖",
            "options": [
                "$y_p = 2$",
                "$y_p = 4$",
                "$y_p = 2x$",
                "$y_p = e^{-2x}$"
            ],
            "correct": 0,
            "explanation": "តាង $y_p = k$ ជាចំនួនថេរ $\\implies y'_p = 0 \\implies 0 + 2k = 4 \\implies k = 2$។"
        },
        {
            "question": "ចម្លើយទូទៅនៃ $y' + 2y = 4$ គឺ ៖",
            "options": [
                "$y = C e^{-2x} + 2$",
                "$y = C e^{2x} + 2$",
                "$y = C e^{-2x} + 4$",
                "$y = 2 e^{-2x}$"
            ],
            "correct": 0,
            "explanation": "ចម្លើយទូទៅ = ចម្លើយអូម៉ូសែន + ចម្លើយពិសេស ៖ $y = C e^{-2x} + 2$។"
        }
    ],

    "les-g12a-3-1": [
        {
            "question": "វិធានដេរីវេនៃអនុគមន៍បណ្តាក់ (Chain Rule)៖ $[f(g(x))]'$ ស្មើនឹង ៖",
            "options": [
                "$f'(g(x)) \\cdot g'(x)$",
                "$f'(g'(x))$",
                "$f'(x) \\cdot g'(x)$",
                "$f'(g(x)) + g'(x)$"
            ],
            "correct": 0,
            "explanation": "Chain rule: $(f \\circ g)'(x) = f'(g(x)) \\cdot g'(x)$។"
        },
        {
            "question": "គណនាដេរីវេនៃ $f(x) = \\ln(x^2 + 1)$ ៖",
            "options": [
                "$\\dfrac{2x}{x^2 + 1}$",
                "$\\dfrac{1}{x^2 + 1}$",
                "$2x \\ln(x^2 + 1)$",
                "$\\dfrac{x}{x^2 + 1}$"
            ],
            "correct": 0,
            "explanation": "$(\\ln u)' = \\dfrac{u'}{u} = \\dfrac{(x^2 + 1)'}{x^2 + 1} = \\dfrac{2x}{x^2 + 1}$។"
        },
        {
            "question": "គណនាដេរីវេនៃ $f(x) = \\sin^3 x$ ៖",
            "options": [
                "$3 \\sin^2 x \\cos x$",
                "$3 \\sin^2 x$",
                "$\\cos^3 x$",
                "$3 \\cos x$"
            ],
            "correct": 0,
            "explanation": "$(u^3)' = 3u^2 u' = 3\\sin^2 x (\\sin x)' = 3 \\sin^2 x \\cos x$។"
        },
        {
            "question": "គណនាដេរីវេនៃ $f(x) = e^{\\cos x}$ ៖",
            "options": [
                "$-\\sin x \\cdot e^{\\cos x}$",
                "$\\cos x \\cdot e^{\\cos x}$",
                "$e^{-\\sin x}$",
                "$-e^{\\cos x}$"
            ],
            "correct": 0,
            "explanation": "$(e^u)' = u' e^u = (\\cos x)' e^{\\cos x} = -\\sin x \\cdot e^{\\cos x}$។"
        },
        {
            "question": "គណនាដេរីវេទី $n$ នៃ $f(x) = e^{ax}$ ៖",
            "options": [
                "$f^{(n)}(x) = a^n e^{ax}$",
                "$f^{(n)}(x) = a e^{ax}$",
                "$f^{(n)}(x) = n! e^{ax}$",
                "$f^{(n)}(x) = a^n x e^{ax}$"
            ],
            "correct": 0,
            "explanation": "ដេរីវេម្តងគុណនឹង $a$ នាំឱ្យដេរីវេទី $n$ គឺ $f^{(n)}(x) = a^n e^{ax}$។"
        },
        {
            "question": "គណនាដេរីវេទី $n$ នៃ $f(x) = \\sin x$ ៖",
            "options": [
                "$\\sin\\left(x + \\dfrac{n\\pi}{2}\\right)$",
                "$\\cos\\left(x + \\dfrac{n\\pi}{2}\\right)$",
                "$(-1)^n \\sin x$",
                "$n \\sin x$"
            ],
            "correct": 0,
            "explanation": "ដេរីវេបន្តបន្ទាប់នៃ $\\sin x$ គឺ $f^{(n)}(x) = \\sin\\left(x + \\dfrac{n\\pi}{2}\\right)$។"
        },
        {
            "question": "រូបមន្តឡែបនីស (Leibniz Formula) សម្រាប់ដេរីវេទី $n$ នៃផលគុណ $(uv)^{(n)}$ គឺ ៖",
            "options": [
                "$\\sum\\limits_{k=0}^{n} C(n, k) \\, u^{(n-k)} v^{(k)}$",
                "$u^{(n)} v^{(n)}$",
                "$\\sum u^{(k)} v^{(k)}$",
                "$n! \\, u^{(n)} v$"
            ],
            "correct": 0,
            "explanation": "រូបមន្ត Leibniz ស្រដៀងនឹងទ្វេធាញូតុន ៖ $(uv)^{(n)} = \\sum\\limits_{k=0}^{n} C(n, k) u^{(n-k)} v^{(k)}$។"
        },
        {
            "question": "គណនាដេរីវេទីពីរ $f''(x)$ នៃ $f(x) = \\ln x$ ៖",
            "options": [
                "$-\\dfrac{1}{x^2}$",
                "$\\dfrac{1}{x^2}$",
                "$-\\dfrac{2}{x^3}$",
                "$\\dfrac{1}{x}$"
            ],
            "correct": 0,
            "explanation": "$f'(x) = \\dfrac{1}{x} = x^{-1} \\implies f''(x) = -1 \\cdot x^{-2} = -\\dfrac{1}{x^2}$។"
        },
        {
            "question": "ដេរីវេនៃអនុគមន៍ច្រាស $(f^{-1})'(y_0)$ ស្មើនឹង ៖",
            "options": [
                "$\\dfrac{1}{f'(x_0)}$ (ដែល $y_0 = f(x_0)$ និង $f'(x_0) \\neq 0$)",
                "$-f'(x_0)$",
                "$f'(y_0)$",
                "$\\dfrac{1}{(f'(x_0))^2}$"
            ],
            "correct": 0,
            "explanation": "ដេរីវេនៃអនុគមន៍ច្រាស៖ $(f^{-1})'(y_0) = \\dfrac{1}{f'(x_0)}$។"
        },
        {
            "question": "ដេរីវេនៃអនុគមន៍ស្វ័យគុណទូទៅ $y = [u(x)]^{v(x)}$ គណនាតាម ៖",
            "options": [
                "$y = e^{v \\ln u}$ រួចរកដេរីវេតាមអនុគមន៍បណ្តាក់",
                "$v \\cdot u^{v - 1}$",
                "$u^v \\cdot \\ln u$",
                "$v' \\cdot u^v$"
            ],
            "correct": 0,
            "explanation": "ប្តូរជាទម្រង់ $y = e^{v(x) \\ln u(x)}$ រួចប្រើរូបមន្ត $(e^w)' = w' e^w$។"
        }
    ],

    "les-stat-02": [
        {
            "question": "ម៉ូដ (Mode) នៃទិន្នន័យស្ថិតិគឺជា ៖",
            "options": [
                "តម្លៃដែលមានប្រេកង់ច្រើនជាងគេបំផុត",
                "តម្លៃមធ្យមនៃទិន្នន័យ",
                "តម្លៃចំកណ្តាលទិន្នន័យ",
                "ផលដករវាងតម្លៃធំបំផុត និងតូចបំផុត"
            ],
            "correct": 0,
            "explanation": "ម៉ូដគឺជាតម្លៃដែលលេចឡើងញឹកញាប់បំផុត (ប្រេកង់ខ្ពស់ជាងគេ)។"
        },
        {
            "question": "កូវ៉ារ្យង់ (Covariance) រវាងអថេរ $X$ និង $Y$ គណនាតាមរូបមន្ត ៖",
            "options": [
                "$s_{xy} = \\dfrac{1}{n} \\sum\\limits_{i=1}^n (x_i - \\bar{x})(y_i - \\bar{y})$",
                "$s_{xy} = \\sum\\limits_{i=1}^n (x_i - \\bar{x})^2$",
                "$s_{xy} = \\dfrac{\\bar{x} + \\bar{y}}{2}$",
                "$s_{xy} = \\bar{x} \\cdot \\bar{y}$"
            ],
            "correct": 0,
            "explanation": "$s_{xy} = \\dfrac{1}{n} \\sum\\limits_{i=1}^n (x_i - \\bar{x})(y_i - \\bar{y}) = \\dfrac{1}{n} \\sum x_i y_i - \\bar{x}\\bar{y}$។"
        },
        {
            "question": "មេគុណទំនាក់ទំនងលីនេអ៊ែរ (Correlation coefficient) $r$ គណនាតាម ៖",
            "options": [
                "$r = \\dfrac{s_{xy}}{s_x \\cdot s_y}$",
                "$r = s_{xy} \\cdot s_x \\cdot s_y$",
                "$r = \\dfrac{s_x}{s_y}$",
                "$r = s_{xy}^2$"
            ],
            "correct": 0,
            "explanation": "$r = \\dfrac{s_{xy}}{s_x s_y}$ (ដែល $s_x, s_y$ ជាគម្លាតស្តង់ដា)។"
        },
        {
            "question": "បន្ទាត់តម្រែតម្រង់លីនេអ៊ែរនៃ $y$ លើ $x$ មានសមីការទូទៅ ៖",
            "options": [
                "$y = ax + b$ (ដែល $a = \\dfrac{s_{xy}}{s_x^2}$ និង $b = \\bar{y} - a\\bar{x}$)",
                "$y = ax + b$ (ដែល $a = s_{xy}$)",
                "$y = x + \\bar{y}$",
                "$y = \\dfrac{s_y}{s_x} x$"
            ],
            "correct": 0,
            "explanation": "សមីការបន្ទាត់តម្រែតម្រង់ $y = ax + b$ កាត់តាមចំណុចមធ្យម $G(\\bar{x}, \\bar{y})$។"
        },
        {
            "question": "បើមេគុណទំនាក់ទំនង $r = 1$ មានន័យថា ៖",
            "options": [
                "មានទំនាក់ទំនងលីនេអ៊ែរវិជ្ជមានឥតខ្ចោះ (គ្រប់ចំណុចស្ថិតលើបន្ទាត់តែមួយ)",
                "គ្មានទំនាក់ទំនងគ្នាទាល់តែសោះ",
                "មានទំនាក់ទំនងអវិជ្ជមាន",
                "ទិន្នន័យខុសទាំងស្រុង"
            ],
            "correct": 0,
            "explanation": "$r = 1$ បង្ហាញពីទំនាក់ទំនងស្របគ្នាពេញលេញ (Perfect positive linear correlation)។"
        },
        {
            "question": "តើតម្លៃនៃមេគុណទំនាក់ទំនង $r$ តែងតែស្ថិតក្នុងចន្លោះណា?",
            "options": [
                "$-1 \\le r \\le 1$",
                "$0 \\le r \\le 1$",
                "$[-\\infty, +\\infty]$",
                "$-2 \\le r \\le 2$"
            ],
            "correct": 0,
            "explanation": "តាមវិសមីការ Cauchy-Schwarz នាំឱ្យ $-1 \\le r \\le 1$ ជានិច្ច។"
        },
        {
            "question": "បើ $r = 0$ បង្ហាញថា ៖",
            "options": [
                "គ្មានទំនាក់ទំនងលីនេអ៊ែររវាងអថេរទាំងពីរ",
                "ទំនាក់ទំនងវិជ្ជមានខ្លាំង",
                "ទំនាក់ទំនងអវិជ្ជមានខ្លាំង",
                "ទិន្នន័យកើនឡើងទ្វេដង"
            ],
            "correct": 0,
            "explanation": "$r = 0$ បញ្ជាក់ថាអថេរទាំងពីរមិនមានទំនាក់ទំនងជាលក្ខណៈបន្ទាត់ត្រង់។"
        },
        {
            "question": "ចំណុចមធ្យម (Mean point) នៃពពកចំណុចស្ថិតិមានកូអរដោនេគឺ ៖",
            "options": [
                "$G(\\bar{x}, \\bar{y})$",
                "$G(x_1, y_1)$",
                "$G(s_x, s_y)$",
                "$G(0, 0)$"
            ],
            "correct": 0,
            "explanation": "ចំណុចមធ្យម $G$ មានកូអរដោនេជាមធ្យមភាគនៃ $X$ និង $Y$ គឺ $G(\\bar{x}, \\bar{y})$។"
        },
        {
            "question": "គម្លាតស្តង់ដា $s_x$ គឺជា ៖",
            "options": [
                "ឫសការ៉េនៃវ៉ារ្យង់ ($s_x = \\sqrt{s_x^2}$)",
                "ការ៉េនៃវ៉ារ្យង់",
                "ផលចែកនៃវ៉ារ្យង់នឹង $n$",
                "ផលដកនៃទិន្នន័យ"
            ],
            "correct": 0,
            "explanation": "គម្លាតស្តង់ដាគឺជាឫសការ៉េវិជ្ជមាននៃវ៉ារ្យង់។"
        },
        {
            "question": "មេគុណកំនត់ (Coefficient of determination) $R^2$ បញ្ជាក់អំពី ៖",
            "options": [
                "ភាគរយនៃបំរែបំរួលរបស់ $Y$ ដែលពន្យល់បានដោយ $X$",
                "មធ្យមភាគនៃទិន្នន័យ",
                "ផលគុណរវាង $X$ និង $Y$",
                "ចំនួនទិន្នន័យសរុប"
            ],
            "correct": 0,
            "explanation": "$R^2 = r^2$ បង្ហាញពីសមាមាត្រនៃបំរែបំរួលសរុបដែលពន្យល់ដោយម៉ូឌែលតម្រែតម្រង់។"
        }
    ]
}
