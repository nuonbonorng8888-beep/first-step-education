# -*- coding: utf-8 -*-
"""
Mathematical overhauls for Grade 11 Basic & Advanced courses.
Ensures standard LaTeX KaTeX notation for trigonometry, complex numbers, vectors, limits, sequences.
"""

G11_FIXES = {
    "les-g11b-3-1": [
        {
            "question": "តើ $\\pi$ រ៉ាដ្យង់ (radian) ត្រូវគ្នានឹងមុំប៉ុន្មានដឺក្រេ?",
            "options": [
                "$180^\\circ$",
                "$360^\\circ$",
                "$90^\\circ$",
                "$270^\\circ$"
            ],
            "correct": 0,
            "explanation": "ទំនាក់ទំនងមុំ៖ $\\pi\\text{ rad} = 180^\\circ$។"
        },
        {
            "question": "ប្តូរមុំ $60^\\circ$ ទៅជារ៉ាដ្យង់ ៖",
            "options": [
                "$\\dfrac{\\pi}{3}\\text{ rad}$",
                "$\\dfrac{\\pi}{6}\\text{ rad}$",
                "$\\dfrac{\\pi}{4}\\text{ rad}$",
                "$\\dfrac{\\pi}{2}\\text{ rad}$"
            ],
            "correct": 0,
            "explanation": "$60^\\circ \\times \\dfrac{\\pi}{180^\\circ} = \\dfrac{\\pi}{3}\\text{ rad}$។"
        },
        {
            "question": "ប្តូរមុំ $\\dfrac{\\pi}{4}\\text{ rad}$ ទៅជាដឺក្រេ ៖",
            "options": [
                "$45^\\circ$",
                "$30^\\circ$",
                "$60^\\circ$",
                "$90^\\circ$"
            ],
            "correct": 0,
            "explanation": "$\\dfrac{180^\\circ}{4} = 45^\\circ$។"
        },
        {
            "question": "តើខួបនៃអនុគមន៍ $y = \\sin x$ និង $y = \\cos x$ ស្មើនឹងប៉ុន្មាន?",
            "options": [
                "$2\\pi$",
                "$\\pi$",
                "$\\dfrac{\\pi}{2}$",
                "$4\\pi$"
            ],
            "correct": 0,
            "explanation": "$\\sin x$ និង $\\cos x$ មានខួប $T = 2\\pi$។"
        },
        {
            "question": "តើខួបនៃអនុគមន៍ $y = \\tan x$ ស្មើនឹងប៉ុន្មាន?",
            "options": [
                "$\\pi$",
                "$2\\pi$",
                "$\\dfrac{\\pi}{2}$",
                "$3\\pi$"
            ],
            "correct": 0,
            "explanation": "$\\tan x$ និង $\\cot x$ មានខួប $T = \\pi$។"
        },
        {
            "question": "តើប្រវែងធ្នូរង្វង់ $s$ កាត់ដោយមុំផ្ចិត $\\theta$ (គិតជារ៉ាដ្យង់) មានរូបមន្តដូចម្តេច?",
            "options": [
                "$s = r \\cdot \\theta$",
                "$s = \\dfrac{r}{\\theta}$",
                "$s = 2\\pi r \\cdot \\theta$",
                "$s = r^2 \\theta$"
            ],
            "correct": 0,
            "explanation": "រូបមន្តប្រវែងធ្នូ $s = r\\theta$ (ដែល $\\theta$ គិតជារ៉ាដ្យង់)។"
        },
        {
            "question": "លើរង្វង់ត្រីកោណមាត្រ តើអ័ក្សឈរ (អ័ក្ស $Oy$) តំណាងឱ្យតម្លៃអ្វី?",
            "options": [
                "$\\sin x$",
                "$\\cos x$",
                "$\\tan x$",
                "$\\cot x$"
            ],
            "correct": 0,
            "explanation": "អ័ក្សឈរតំណាងឱ្យ $\\sin x$ ហើយអ័ក្សដេកតំណាងឱ្យ $\\cos x$។"
        },
        {
            "question": "តើតម្លៃនៃ $\\sin x$ និង $\\cos x$ តែងតែស្ថិតក្នុងចន្លោះណា?",
            "options": [
                "$[-1, 1]$",
                "$[0, 1]$",
                "$(-\\infty, +\\infty)$",
                "$[-2, 2]$"
            ],
            "correct": 0,
            "explanation": "$-1 \\le \\sin x \\le 1$ និង $-1 \\le \\cos x \\le 1$ ជានិច្ច។"
        },
        {
            "question": "តើតម្លៃនៃ $\\cos\\pi$ ស្មើនឹងប៉ុន្មាន?",
            "options": [
                "$-1$",
                "$0$",
                "$1$",
                "$\\dfrac{1}{2}$"
            ],
            "correct": 0,
            "explanation": "$\\cos\\pi = \\cos(180^\\circ) = -1$។"
        },
        {
            "question": "តើតម្លៃនៃ $\\sin\\left(\\dfrac{3\\pi}{2}\\right)$ ស្មើនឹងប៉ុន្មាន?",
            "options": [
                "$-1$",
                "$1$",
                "$0$",
                "$\\dfrac{\\sqrt{2}}{2}$"
            ],
            "correct": 0,
            "explanation": "$\\sin\\left(\\dfrac{3\\pi}{2}\\right) = \\sin(270^\\circ) = -1$។"
        }
    ],

    "les-g11b-3-2": [
        {
            "question": "រូបមន្តបូក $\\cos(a - b)$ ស្មើនឹង ៖",
            "options": [
                "$\\cos a \\cos b + \\sin a \\sin b$",
                "$\\cos a \\cos b - \\sin a \\sin b$",
                "$\\sin a \\cos b - \\cos a \\sin b$",
                "$\\sin a \\sin b - \\cos a \\cos b$"
            ],
            "correct": 0,
            "explanation": "$\\cos(a - b) = \\cos a \\cos b + \\sin a \\sin b$។"
        },
        {
            "question": "រូបមន្តបូក $\\cos(a + b)$ ស្មើនឹង ៖",
            "options": [
                "$\\cos a \\cos b - \\sin a \\sin b$",
                "$\\cos a \\cos b + \\sin a \\sin b$",
                "$\\sin a \\cos b + \\cos a \\sin b$",
                "$\\cos a - \\cos b$"
            ],
            "correct": 0,
            "explanation": "$\\cos(a + b) = \\cos a \\cos b - \\sin a \\sin b$។"
        },
        {
            "question": "រូបមន្តបូក $\\sin(a + b)$ ស្មើនឹង ៖",
            "options": [
                "$\\sin a \\cos b + \\cos a \\sin b$",
                "$\\sin a \\cos b - \\cos a \\sin b$",
                "$\\cos a \\cos b - \\sin a \\sin b$",
                "$\\sin a + \\sin b$"
            ],
            "correct": 0,
            "explanation": "$\\sin(a + b) = \\sin a \\cos b + \\cos a \\sin b$។"
        },
        {
            "question": "រូបមន្តមុំទ្វេ $\\sin(2a)$ ស្មើនឹង ៖",
            "options": [
                "$2\\sin a \\cos a$",
                "$\\cos^2 a - \\sin^2 a$",
                "$2\\sin a$",
                "$\\sin^2 a$"
            ],
            "correct": 0,
            "explanation": "$\\sin(2a) = 2\\sin a \\cos a$។"
        },
        {
            "question": "រូបមន្តមុំទ្វេ $\\cos(2a)$ ស្មើនឹងកន្សោមណាខ្លះ?",
            "options": [
                "$\\cos^2 a - \\sin^2 a = 2\\cos^2 a - 1 = 1 - 2\\sin^2 a$",
                "$2\\cos a \\sin a$",
                "$\\cos^2 a + \\sin^2 a$",
                "$2\\cos a$"
            ],
            "correct": 0,
            "explanation": "$\\cos(2a) = \\cos^2 a - \\sin^2 a = 2\\cos^2 a - 1 = 1 - 2\\sin^2 a$។"
        },
        {
            "question": "រូបមន្តបញ្ចុះដឺក្រេ $\\sin^2 a$ ស្មើនឹង ៖",
            "options": [
                "$\\dfrac{1 - \\cos(2a)}{2}$",
                "$\\dfrac{1 + \\cos(2a)}{2}$",
                "$1 - \\cos a$",
                "$\\dfrac{1 - \\sin(2a)}{2}$"
            ],
            "correct": 0,
            "explanation": "$\\sin^2 a = \\dfrac{1 - \\cos(2a)}{2}$។"
        },
        {
            "question": "រូបមន្តបញ្ចុះដឺក្រេ $\\cos^2 a$ ស្មើនឹង ៖",
            "options": [
                "$\\dfrac{1 + \\cos(2a)}{2}$",
                "$\\dfrac{1 - \\cos(2a)}{2}$",
                "$1 + \\cos a$",
                "$\\dfrac{1 + \\sin(2a)}{2}$"
            ],
            "correct": 0,
            "explanation": "$\\cos^2 a = \\dfrac{1 + \\cos(2a)}{2}$។"
        },
        {
            "question": "រូបមន្ត $\\tan(2a)$ ស្មើនឹង ៖",
            "options": [
                "$\\dfrac{2\\tan a}{1 - \\tan^2 a}$",
                "$\\dfrac{2\\tan a}{1 + \\tan^2 a}$",
                "$\\dfrac{\\tan^2 a}{2}$",
                "$1 - \\tan^2 a$"
            ],
            "correct": 0,
            "explanation": "$\\tan(2a) = \\dfrac{2\\tan a}{1 - \\tan^2 a}$។"
        },
        {
            "question": "គណនា $\\cos\\left(2 \\times \\dfrac{\\pi}{4}\\right) = \\cos\\left(\\dfrac{\\pi}{2}\\right)$ តាមរូបមន្ត $\\cos^2 - \\sin^2$ ៖",
            "options": [
                "$0$",
                "$1$",
                "$-1$",
                "$\\dfrac{1}{2}$"
            ],
            "correct": 0,
            "explanation": "$\\cos\\left(\\dfrac{\\pi}{2}\\right) = 0$។"
        },
        {
            "question": "បំលែងផលបូកទៅជាផលគុណ៖ $\\cos p + \\cos q = ?$",
            "options": [
                "$2\\cos\\left(\\dfrac{p + q}{2}\\right)\\cos\\left(\\dfrac{p - q}{2}\\right)$",
                "$-2\\sin\\left(\\dfrac{p + q}{2}\\right)\\sin\\left(\\dfrac{p - q}{2}\\right)$",
                "$2\\sin\\left(\\dfrac{p + q}{2}\\right)\\cos\\left(\\dfrac{p - q}{2}\\right)$",
                "$\\cos(p + q)$"
            ],
            "correct": 0,
            "explanation": "$\\cos p + \\cos q = 2\\cos\\left(\\dfrac{p + q}{2}\\right)\\cos\\left(\\dfrac{p - q}{2}\\right)$។"
        }
    ],

    "les-g11b-3-3": [
        {
            "question": "សមីការ $\\sin x = \\sin\\alpha$ មានចម្លើយទូទៅគឺ ៖",
            "options": [
                "$x = \\alpha + 2k\\pi$ ឬ $x = \\pi - \\alpha + 2k\\pi$ ($k \\in \\mathbb{Z}$)",
                "$x = \\pm\\alpha + 2k\\pi$",
                "$x = \\alpha + k\\pi$",
                "$x = \\dfrac{\\pi}{2} - \\alpha + 2k\\pi$"
            ],
            "correct": 0,
            "explanation": "ចម្លើយទូទៅនៃ $\\sin x = \\sin\\alpha$ គឺ $x = \\alpha + 2k\\pi$ ឬ $x = \\pi - \\alpha + 2k\\pi$ ($k \\in \\mathbb{Z}$)។"
        },
        {
            "question": "សមីការ $\\cos x = \\cos\\alpha$ មានចម្លើយទូទៅគឺ ៖",
            "options": [
                "$x = \\pm\\alpha + 2k\\pi$ ($k \\in \\mathbb{Z}$)",
                "$x = \\alpha + k\\pi$",
                "$x = \\alpha + 2k\\pi$ ឬ $x = \\pi - \\alpha + 2k\\pi$",
                "$x = k\\pi$"
            ],
            "correct": 0,
            "explanation": "ចម្លើយទូទៅនៃ $\\cos x = \\cos\\alpha$ គឺ $x = \\pm\\alpha + 2k\\pi$ ($k \\in \\mathbb{Z}$)។"
        },
        {
            "question": "សមីការ $\\tan x = \\tan\\alpha$ មានចម្លើយទូទៅគឺ ៖",
            "options": [
                "$x = \\alpha + k\\pi$ ($k \\in \\mathbb{Z}$)",
                "$x = \\pm\\alpha + 2k\\pi$",
                "$x = \\alpha + 2k\\pi$",
                "$x = k\\pi$"
            ],
            "correct": 0,
            "explanation": "ចម្លើយទូទៅនៃ $\\tan x = \\tan\\alpha$ គឺ $x = \\alpha + k\\pi$ ($k \\in \\mathbb{Z}$)។"
        },
        {
            "question": "ដោះស្រាយសមីការ $\\sin x = \\dfrac{1}{2}$ លើចន្លោះ $[0, 2\\pi)$ ៖",
            "options": [
                "$x = \\dfrac{\\pi}{6}$ ឬ $x = \\dfrac{5\\pi}{6}$",
                "$x = \\dfrac{\\pi}{3}$ ឬ $x = \\dfrac{2\\pi}{3}$",
                "$x = \\dfrac{\\pi}{4}$ ឬ $x = \\dfrac{3\\pi}{4}$",
                "$x = \\dfrac{\\pi}{6}$ ប៉ុណ្ណោះ"
            ],
            "correct": 0,
            "explanation": "$\\sin x = \\sin\\left(\\dfrac{\\pi}{6}\\right) \\implies x = \\dfrac{\\pi}{6}$ ឬ $x = \\pi - \\dfrac{\\pi}{6} = \\dfrac{5\\pi}{6}$។"
        },
        {
            "question": "ដោះស្រាយសមីការ $\\cos x = 0$ ៖",
            "options": [
                "$x = \\dfrac{\\pi}{2} + k\\pi$ ($k \\in \\mathbb{Z}$)",
                "$x = 2k\\pi$",
                "$x = \\pi + 2k\\pi$",
                "$x = k\\pi$"
            ],
            "correct": 0,
            "explanation": "$\\cos x = 0$ ត្រង់ចំណុចលើ និងក្រោមនៃរង្វង់ត្រីកោណមាត្រ គឺ $x = \\dfrac{\\pi}{2} + k\\pi$ ($k \\in \\mathbb{Z}$)។"
        },
        {
            "question": "ដោះស្រាយសមីការ $\\sin x = 0$ ៖",
            "options": [
                "$x = k\\pi$ ($k \\in \\mathbb{Z}$)",
                "$x = \\dfrac{\\pi}{2} + k\\pi$",
                "$x = 2k\\pi$",
                "$x = \\dfrac{\\pi}{4} + k\\pi$"
            ],
            "correct": 0,
            "explanation": "$\\sin x = 0$ ត្រង់ចំណុចសងខាងអ័ក្សដេក គឺ $x = k\\pi$ ($k \\in \\mathbb{Z}$)។"
        },
        {
            "question": "តើសមីការ $\\sin x = 2$ មានចម្លើយឬទេ?",
            "options": [
                "គ្មានចម្លើយ (ព្រោះ $-1 \\le \\sin x \\le 1$)",
                "$x = 2$",
                "$x = \\dfrac{\\pi}{2}$",
                "$x = \\pi$"
            ],
            "correct": 0,
            "explanation": "តម្លៃ $\\sin x$ មិនអាចធំជាង $1$ បានទេ ដូច្នេះ $\\sin x = 2$ គ្មានចម្លើយ។"
        },
        {
            "question": "ដោះស្រាយសមីការ $\\tan x = 1$ លើចន្លោះ $[0, \\pi)$ ៖",
            "options": [
                "$x = \\dfrac{\\pi}{4}$",
                "$x = \\dfrac{\\pi}{3}$",
                "$x = \\dfrac{\\pi}{6}$",
                "$x = \\dfrac{3\\pi}{4}$"
            ],
            "correct": 0,
            "explanation": "$\\tan\\left(\\dfrac{\\pi}{4}\\right) = 1$ នាំឱ្យ $x = \\dfrac{\\pi}{4}$។"
        },
        {
            "question": "ដោះស្រាយវិសមីការ $\\sin x \\ge 0$ លើ $[0, 2\\pi]$ ៖",
            "options": [
                "$x \\in [0, \\pi]$",
                "$x \\in [\\pi, 2\\pi]$",
                "$x \\in \\left[0, \\dfrac{\\pi}{2}\\right]$",
                "គ្រប់ $x \\in \\mathbb{R}$"
            ],
            "correct": 0,
            "explanation": "$\\sin x \\ge 0$ ស្ថិតនៅកន្លះរង្វង់ខាងលើ គឺ $x \\in [0, \\pi]$។"
        },
        {
            "question": "ដោះស្រាយសមីការ $2\\cos x - 1 = 0$ លើ $[0, \\pi]$ ៖",
            "options": [
                "$x = \\dfrac{\\pi}{3}$",
                "$x = \\dfrac{\\pi}{6}$",
                "$x = \\dfrac{2\\pi}{3}$",
                "$x = \\dfrac{\\pi}{4}$"
            ],
            "correct": 0,
            "explanation": "$\\cos x = \\dfrac{1}{2} \\implies x = \\dfrac{\\pi}{3}$។"
        }
    ],

    "les-g11a-7-2": [
        {
            "question": "ទម្រង់ត្រីកោណមាត្រនៃចំនួនកុំផ្លិច $z = a + bi$ ($z \\neq 0$) គឺ ៖",
            "options": [
                "$z = r(\\cos\\theta + i\\sin\\theta)$",
                "$z = r(\\sin\\theta + i\\cos\\theta)$",
                "$z = \\cos\\theta + i\\sin\\theta$",
                "$z = r(\\cos\\theta - i\\sin\\theta)$"
            ],
            "correct": 0,
            "explanation": "$z = r(\\cos\\theta + i\\sin\\theta)$ ដែល $r = |z| = \\sqrt{a^2 + b^2}$ និង $\\theta = \\text{arg}(z)$។"
        },
        {
            "question": "អាគុយម៉ង់ $\\theta$ នៃចំនួនកុំផ្លិច $z = a + bi$ កំណត់ដោយ ៖",
            "options": [
                "$\\cos\\theta = \\dfrac{a}{r}$ និង $\\sin\\theta = \\dfrac{b}{r}$",
                "$\\tan\\theta = \\dfrac{a}{b}$",
                "$\\cos\\theta = \\dfrac{b}{r}$",
                "$\\sin\\theta = \\dfrac{a}{r}$"
            ],
            "correct": 0,
            "explanation": "$\\cos\\theta = \\dfrac{a}{r}$ និង $\\sin\\theta = \\dfrac{b}{r}$ (ដែល $r = \\sqrt{a^2 + b^2}$)។"
        },
        {
            "question": "សរសេរ $z = 1 + i$ ជាទម្រង់ត្រីកោណមាត្រ ៖",
            "options": [
                "$\\sqrt{2}\\left(\\cos\\dfrac{\\pi}{4} + i\\sin\\dfrac{\\pi}{4}\\right)$",
                "$2\\left(\\cos\\dfrac{\\pi}{4} + i\\sin\\dfrac{\\pi}{4}\\right)$",
                "$\\sqrt{2}\\left(\\cos\\dfrac{\\pi}{2} + i\\sin\\dfrac{\\pi}{2}\\right)$",
                "$\\cos\\dfrac{\\pi}{4} + i\\sin\\dfrac{\\pi}{4}$"
            ],
            "correct": 0,
            "explanation": "$r = \\sqrt{1^2 + 1^2} = \\sqrt{2}$, $\\theta = \\dfrac{\\pi}{4} \\implies z = \\sqrt{2}\\left(\\cos\\dfrac{\\pi}{4} + i\\sin\\dfrac{\\pi}{4}\\right)$។"
        },
        {
            "question": "សរសេរ $z = i$ ជាទម្រង់ត្រីកោណមាត្រ ៖",
            "options": [
                "$\\cos\\dfrac{\\pi}{2} + i\\sin\\dfrac{\\pi}{2}$",
                "$\\cos 0 + i\\sin 0$",
                "$\\cos\\pi + i\\sin\\pi$",
                "$\\sin\\dfrac{\\pi}{2} + i\\cos\\dfrac{\\pi}{2}$"
            ],
            "correct": 0,
            "explanation": "$r = 1$, $\\theta = \\dfrac{\\pi}{2} \\implies i = \\cos\\dfrac{\\pi}{2} + i\\sin\\dfrac{\\pi}{2}$។"
        },
        {
            "question": "ផលគុណនៃពីរចំនួនកុំផ្លិច $z_1 = r_1(\\cos\\theta_1 + i\\sin\\theta_1)$ និង $z_2 = r_2(\\cos\\theta_2 + i\\sin\\theta_2)$ គឺ ៖",
            "options": [
                "$r_1 r_2 [\\cos(\\theta_1 + \\theta_2) + i\\sin(\\theta_1 + \\theta_2)]$",
                "$r_1 r_2 [\\cos(\\theta_1 \\theta_2) + i\\sin(\\theta_1 \\theta_2)]$",
                "$(r_1 + r_2) [\\cos(\\theta_1 + \\theta_2) + i\\sin(\\theta_1 + \\theta_2)]$",
                "$r_1 r_2 [\\cos(\\theta_1 - \\theta_2) + i\\sin(\\theta_1 - \\theta_2)]$"
            ],
            "correct": 0,
            "explanation": "គុណចំនួនកុំផ្លិច៖ គុណម៉ូឌុល និងបូកអាគុយម៉ង់ ៖ $r_1 r_2 [\\cos(\\theta_1 + \\theta_2) + i\\sin(\\theta_1 + \\theta_2)]$។"
        },
        {
            "question": "ផលចែក $\\dfrac{z_1}{z_2}$ នៃពីរចំនួនកុំផ្លិចទម្រង់ត្រីកោណមាត្រគឺ ៖",
            "options": [
                "$\\dfrac{r_1}{r_2} [\\cos(\\theta_1 - \\theta_2) + i\\sin(\\theta_1 - \\theta_2)]$",
                "$\\dfrac{r_1}{r_2} [\\cos(\\theta_1 + \\theta_2) + i\\sin(\\theta_1 + \\theta_2)]$",
                "$(r_1 - r_2) [\\cos(\\theta_1 - \\theta_2) + i\\sin(\\theta_1 - \\theta_2)]$",
                "$r_1 r_2 [\\cos(\\theta_1 - \\theta_2) + i\\sin(\\theta_1 - \\theta_2)]$"
            ],
            "correct": 0,
            "explanation": "ចែកចំនួនកុំផ្លិច៖ ចែកម៉ូឌុល និងដកអាគុយម៉ង់ ៖ $\\dfrac{r_1}{r_2} [\\cos(\\theta_1 - \\theta_2) + i\\sin(\\theta_1 - \\theta_2)]$។"
        },
        {
            "question": "ម៉ូឌុល $|z|$ នៃ $z = 3 - 4i$ ស្មើនឹង ៖",
            "options": [
                "$5$",
                "$7$",
                "$\\sqrt{7}$",
                "$25$"
            ],
            "correct": 0,
            "explanation": "$|z| = \\sqrt{3^2 + (-4)^2} = \\sqrt{9 + 16} = 5$។"
        },
        {
            "question": "ចំនួនកុំផ្លិចឆ្លាស់នៃ $z = r(\\cos\\theta + i\\sin\\theta)$ គឺ $\\bar{z} = ?$",
            "options": [
                "$r(\\cos(-\\theta) + i\\sin(-\\theta)) = r(\\cos\\theta - i\\sin\\theta)$",
                "$-r(\\cos\\theta + i\\sin\\theta)$",
                "$r(\\sin\\theta + i\\cos\\theta)$",
                "$\\dfrac{1}{r}(\\cos\\theta - i\\sin\\theta)$"
            ],
            "correct": 0,
            "explanation": "ចំនួនកុំផ្លិចឆ្លាស់ប្តូរសញ្ញាអាគុយម៉ង់ $\\theta \\to -\\theta$ នាំឱ្យ $\\bar{z} = r(\\cos\\theta - i\\sin\\theta)$។"
        },
        {
            "question": "សរសេរ $z = -1$ ជាទម្រង់ត្រីកោណមាត្រ ៖",
            "options": [
                "$\\cos\\pi + i\\sin\\pi$",
                "$\\cos 0 + i\\sin 0$",
                "$\\cos(2\\pi) + i\\sin(2\\pi)$",
                "$-\\cos 0 - i\\sin 0$"
            ],
            "correct": 0,
            "explanation": "$r = 1$, $\\theta = \\pi \\implies -1 = \\cos\\pi + i\\sin\\pi$។"
        },
        {
            "question": "តើទម្រង់អិចស្ប៉ូណង់ស្យែល (រូបមន្តអយល័រ Euler) នៃ $\\cos\\theta + i\\sin\\theta$ គឺអ្វី?",
            "options": [
                "$e^{i\\theta}$",
                "$e^{-i\\theta}$",
                "$i e^\\theta$",
                "$\\ln(i\\theta)$"
            ],
            "correct": 0,
            "explanation": "រូបមន្ត Euler: $e^{i\\theta} = \\cos\\theta + i\\sin\\theta$។"
        }
    ],

    "les-g11a-7-3": [
        {
            "question": "រូបមន្តដឺម័រ (De Moivre's Formula) សម្រាប់គ្រប់ $n \\in \\mathbb{Z}$ គឺ ៖",
            "options": [
                "$[\\cos\\theta + i\\sin\\theta]^n = \\cos(n\\theta) + i\\sin(n\\theta)$",
                "$[\\cos\\theta + i\\sin\\theta]^n = \\cos^n\\theta + i\\sin^n\\theta$",
                "$[\\cos\\theta + i\\sin\\theta]^n = n(\\cos\\theta + i\\sin\\theta)$",
                "$[\\cos\\theta + i\\sin\\theta]^n = \\cos(\\theta^n) + i\\sin(\\theta^n)$"
            ],
            "correct": 0,
            "explanation": "រូបមន្តដឺម័រ ៖ $(\\cos\\theta + i\\sin\\theta)^n = \\cos(n\\theta) + i\\sin(n\\theta)$។"
        },
        {
            "question": "គណនា $\\left(\\cos\\dfrac{\\pi}{6} + i\\sin\\dfrac{\\pi}{6}\\right)^6$ ៖",
            "options": [
                "$-1$",
                "$1$",
                "$i$",
                "$-i$"
            ],
            "correct": 0,
            "explanation": "តាមដឺម័រ ៖ $\\cos\\left(6 \\times \\dfrac{\\pi}{6}\\right) + i\\sin\\left(6 \\times \\dfrac{\\pi}{6}\\right) = \\cos\\pi + i\\sin\\pi = -1 + 0 = -1$។"
        },
        {
            "question": "គណនា $(1 + i)^8$ តាមរូបមន្តដឺម័រ ៖",
            "options": [
                "$16$",
                "$16i$",
                "$-16$",
                "$8$"
            ],
            "correct": 0,
            "explanation": "$1 + i = \\sqrt{2} e^{i\\pi/4} \\implies (1+i)^8 = (\\sqrt{2})^8 e^{i 2\\pi} = 16(1) = 16$។"
        },
        {
            "question": "ចំនួនឫសទី $n$ នៃចំនួនកុំផ្លិច $z \\neq 0$ ក្នុងប្លង់កុំផ្លិចមានចំនួន ៖",
            "options": [
                "$n$ ឫសផ្សេងៗគ្នា",
                "$2$ ឫស",
                "$1$ ឫសគត់",
                "$n^2$ ឫស"
            ],
            "correct": 0,
            "explanation": "គ្រប់ចំនួនកុំផ្លិចមិនសូន្យមានឫសទី $n$ ចំនួន $n$ ផ្សេងៗគ្នាជានិច្ច។"
        },
        {
            "question": "រូបមន្តឫសទី $n$ នៃ $z = r(\\cos\\theta + i\\sin\\theta)$ គឺ $w_k = ?$",
            "options": [
                "$\\sqrt[n]{r} \\left[\\cos\\left(\\dfrac{\\theta + 2k\\pi}{n}\\right) + i\\sin\\left(\\dfrac{\\theta + 2k\\pi}{n}\\right)\\right]$ ($k = 0, 1, \\dots, n-1$)",
                "$\\sqrt[n]{r} \\left[\\cos\\left(\\dfrac{\\theta}{n}\\right) + i\\sin\\left(\\dfrac{\\theta}{n}\\right)\\right]$",
                "$r^n [\\cos(n\\theta) + i\\sin(n\\theta)]$",
                "$\\sqrt[n]{r} [\\cos(\\theta + 2k\\pi) + i\\sin(\\theta + 2k\\pi)]$"
            ],
            "correct": 0,
            "explanation": "$w_k = \\sqrt[n]{r} \\left[\\cos\\left(\\dfrac{\\theta + 2k\\pi}{n}\\right) + i\\sin\\left(\\dfrac{\\theta + 2k\\pi}{n}\\right)\\right]$ ចំពោះ $k = 0, 1, \\dots, n-1$។"
        },
        {
            "question": "រូបតំណាងធរណីមាត្រនៃឫសទី $n$ ទាំង $n$ នៃចំនួនកុំផ្លិច $z$ គឺ ៖",
            "options": [
                "កំពូលនៃពហុកោណនិយ័ត $n$ ជ្រុងចារឹកក្នុងរង្វង់កាំ $\\sqrt[n]{r}$",
                "ចំណុចរាយប៉ាយលើបន្ទាត់ត្រង់",
                "រាងអេលីប",
                "ចំណុចត្រួតគ្នាតែមួយ"
            ],
            "correct": 0,
            "explanation": "ឫសទី $n$ បង្កើតបានជាកំពូលនៃពហុកោណនិយ័ត $n$ ជ្រុងផ្ចិត $O$ កាំ $\\sqrt[n]{r}$។"
        },
        {
            "question": "ឫសគូប (ឫសទី ៣) នៃឯកតា $z^3 = 1$ មានតម្លៃ ៖",
            "options": [
                "$1, -\\dfrac{1}{2} + i\\dfrac{\\sqrt{3}}{2}, -\\dfrac{1}{2} - i\\dfrac{\\sqrt{3}}{2}$",
                "$1, -1, i$",
                "$1, i, -i$",
                "$1, \\dfrac{1}{2} + i\\dfrac{\\sqrt{3}}{2}, \\dfrac{1}{2} - i\\dfrac{\\sqrt{3}}{2}$"
            ],
            "correct": 0,
            "explanation": "ឫសគូបនៃ $1$ គឺ $1, \\omega = e^{i 2\\pi/3} = -\\dfrac{1}{2} + i\\dfrac{\\sqrt{3}}{2}, \\omega^2 = -\\dfrac{1}{2} - i\\dfrac{\\sqrt{3}}{2}$។"
        },
        {
            "question": "តើផលបូកនៃឫសទី $n$ ទាំងអស់នៃឯកតា $1 + \\omega + \\omega^2 + \\dots + \\omega^{n-1}$ ស្មើនឹងប៉ុន្មាន?",
            "options": [
                "$0$",
                "$1$",
                "$n$",
                "$-1$"
            ],
            "correct": 0,
            "explanation": "ផលបូកឫសទី $n$ ទាំងអស់នៃឯកតាស្មើ $0$ ជានិច្ច ៖ $\\sum\\limits_{k=0}^{n-1} \\omega^k = \\dfrac{1 - \\omega^n}{1 - \\omega} = 0$។"
        },
        {
            "question": "គណនា $\\left(\\cos\\dfrac{\\pi}{3} + i\\sin\\dfrac{\\pi}{3}\\right)^3$ ៖",
            "options": [
                "$-1$",
                "$1$",
                "$0$",
                "$-i$"
            ],
            "correct": 0,
            "explanation": "$\\cos\\left(3 \\times \\dfrac{\\pi}{3}\\right) + i\\sin\\left(3 \\times \\dfrac{\\pi}{3}\\right) = \\cos\\pi + i\\sin\\pi = -1$។"
        },
        {
            "question": "គណនា $(\\cos\\theta - i\\sin\\theta)^n$ តាមដឺម័រ ៖",
            "options": [
                "$\\cos(n\\theta) - i\\sin(n\\theta)$",
                "$\\cos(n\\theta) + i\\sin(n\\theta)$",
                "$(-1)^n \\cos(n\\theta)$",
                "$\\sin(n\\theta) - i\\cos(n\\theta)$"
            ],
            "correct": 0,
            "explanation": "$(\\cos\\theta - i\\sin\\theta)^n = [\\cos(-\\theta) + i\\sin(-\\theta)]^n = \\cos(-n\\theta) + i\\sin(-n\\theta) = \\cos(n\\theta) - i\\sin(n\\theta)$។"
        }
    ],

    "les-g11a-3-1": [
        {
            "question": "ដើម្បីដោះស្រាយសមីការ $a\\cos x + b\\sin x = c$ គេត្រូវចែកអង្គទាំងពីរនឹង ៖",
            "options": [
                "$\\sqrt{a^2 + b^2}$",
                "$a^2 + b^2$",
                "$a + b$",
                "$\\sqrt{a^2 - b^2}$"
            ],
            "correct": 0,
            "explanation": "ចែកនឹង $\\sqrt{a^2 + b^2}$ ដើម្បីបំលែងជាទម្រង់ $\\cos(x - \\alpha) = \\dfrac{c}{\\sqrt{a^2 + b^2}}$។"
        },
        {
            "question": "សមីការ $a\\cos x + b\\sin x = c$ មានចម្លើយលុះត្រាតែ ៖",
            "options": [
                "$a^2 + b^2 \\ge c^2$",
                "$a^2 + b^2 < c^2$",
                "$a + b = c$",
                "$c = 0$"
            ],
            "correct": 0,
            "explanation": "លក្ខខណ្ឌមានចម្លើយ៖ $\\left|\\dfrac{c}{\\sqrt{a^2 + b^2}}\\right| \\le 1 \\iff a^2 + b^2 \\ge c^2$។"
        },
        {
            "question": "ដោះស្រាយសមីការ៖ $\\cos x + \\sin x = \\sqrt{2}$",
            "options": [
                "$x = \\dfrac{\\pi}{4} + 2k\\pi$ ($k \\in \\mathbb{Z}$)",
                "$x = \\dfrac{\\pi}{2} + 2k\\pi$",
                "$x = 2k\\pi$",
                "$x = \\dfrac{\\pi}{3} + 2k\\pi$"
            ],
            "correct": 0,
            "explanation": "ចែកនឹង $\\sqrt{2} \\implies \\cos\\left(x - \\dfrac{\\pi}{4}\\right) = 1 \\implies x - \\dfrac{\\pi}{4} = 2k\\pi \\implies x = \\dfrac{\\pi}{4} + 2k\\pi$។"
        },
        {
            "question": "ដោះស្រាយសមីការ៖ $\\sqrt{3}\\sin x - \\cos x = 1$",
            "options": [
                "$x = \\dfrac{\\pi}{3} + 2k\\pi$ ឬ $x = \\pi + 2k\\pi$ ($k \\in \\mathbb{Z}$)",
                "$x = \\dfrac{\\pi}{6} + 2k\\pi$",
                "$x = \\dfrac{\\pi}{4} + 2k\\pi$",
                "$x = k\\pi$"
            ],
            "correct": 0,
            "explanation": "ចែកនឹង $2 \\implies \\sin\\left(x - \\dfrac{\\pi}{6}\\right) = \\dfrac{1}{2} = \\sin\\dfrac{\\pi}{6} \\implies x = \\dfrac{\\pi}{3} + 2k\\pi$ ឬ $x = \\pi + 2k\\pi$។"
        },
        {
            "question": "ដោះស្រាយសមីការអូម៉ូសែន៖ $2\\sin^2 x - 3\\sin x\\cos x + \\cos^2 x = 0$",
            "options": [
                "$\\tan x = 1$ ឬ $\\tan x = \\dfrac{1}{2}$",
                "$\\tan x = 2$",
                "$\\sin x = 0$",
                "$\\cos x = 0$"
            ],
            "correct": 0,
            "explanation": "ចែកនឹង $\\cos^2 x \\implies 2\\tan^2 x - 3\\tan x + 1 = 0 \\implies \\tan x = 1$ ឬ $\\tan x = \\dfrac{1}{2}$។"
        },
        {
            "question": "ដោះស្រាយសមីការ $\\sin(2x) = \\cos x$ ៖",
            "options": [
                "$\\cos x = 0$ ឬ $\\sin x = \\dfrac{1}{2}$",
                "$\\sin x = 1$",
                "$\\cos x = 1$",
                "$\\tan x = 1$"
            ],
            "correct": 0,
            "explanation": "$2\\sin x \\cos x - \\cos x = 0 \\implies \\cos x(2\\sin x - 1) = 0 \\implies \\cos x = 0$ ឬ $\\sin x = \\dfrac{1}{2}$។"
        },
        {
            "question": "ដោះស្រាយសមីការ $\\cos(3x) = \\cos x$ ៖",
            "options": [
                "$x = k\\pi$ ឬ $x = \\dfrac{k\\pi}{2}$ ($k \\in \\mathbb{Z}$)",
                "$x = 2k\\pi$",
                "$x = \\dfrac{\\pi}{3} + k\\pi$",
                "$x = \\dfrac{\\pi}{6} + k\\pi$"
            ],
            "correct": 0,
            "explanation": "$3x = \\pm x + 2k\\pi \\implies 2x = 2k\\pi$ (នាំឱ្យ $x = k\\pi$) ឬ $4x = 2k\\pi$ (នាំឱ្យ $x = \\dfrac{k\\pi}{2}$)។"
        },
        {
            "question": "ដោះស្រាយវិសមីការ $2\\sin x - \\sqrt{3} \\ge 0$ លើ $[0, 2\\pi]$ ៖",
            "options": [
                "$x \\in \\left[\\dfrac{\\pi}{3}, \\dfrac{2\\pi}{3}\\right]$",
                "$x \\in \\left[0, \\dfrac{\\pi}{3}\\right]$",
                "$x \\in \\left[\\dfrac{2\\pi}{3}, 2\\pi\\right]$",
                "$x \\in \\left[\\dfrac{\\pi}{6}, \\dfrac{5\\pi}{6}\\right]$"
            ],
            "correct": 0,
            "explanation": "$\\sin x \\ge \\dfrac{\\sqrt{3}}{2} \\implies x \\in \\left[\\dfrac{\\pi}{3}, \\dfrac{2\\pi}{3}\\right]$។"
        },
        {
            "question": "ដោះស្រាយវិសមីការ $\\cos x < \\dfrac{1}{2}$ លើ $[0, 2\\pi]$ ៖",
            "options": [
                "$x \\in \\left(\\dfrac{\\pi}{3}, \\dfrac{5\\pi}{3}\\right)$",
                "$x \\in \\left[0, \\dfrac{\\pi}{3}\\right)$",
                "$x \\in \\left(\\dfrac{5\\pi}{3}, 2\\pi\\right]$",
                "$x \\in \\left(\\dfrac{\\pi}{6}, \\dfrac{11\\pi}{6}\\right)$"
            ],
            "correct": 0,
            "explanation": "$\\cos x < \\dfrac{1}{2}$ លើ $[0, 2\\pi]$ នាំឱ្យ $x \\in \\left(\\dfrac{\\pi}{3}, \\dfrac{5\\pi}{3}\\right)$។"
        },
        {
            "question": "តម្លៃអតិបរមានៃកន្សោម $f(x) = 3\\cos x + 4\\sin x$ ស្មើនឹង ៖",
            "options": [
                "$5$",
                "$7$",
                "$1$",
                "$25$"
            ],
            "correct": 0,
            "explanation": "តម្លៃអតិបរមានៃ $a\\cos x + b\\sin x$ គឺ $\\sqrt{a^2 + b^2} = \\sqrt{3^2 + 4^2} = 5$។"
        }
    ],

    "les-g11a-8-1": [
        {
            "question": "ម៉ូឌុលនៃវ៉ិចទ័រ $\\vec{u} = (x, y, z)$ ក្នុងលំហគណនាតាម ៖",
            "options": [
                "$\\|\\vec{u}\\| = \\sqrt{x^2 + y^2 + z^2}$",
                "$\\|\\vec{u}\\| = x + y + z$",
                "$\\|\\vec{u}\\| = x^2 + y^2 + z^2$",
                "$\\|\\vec{u}\\| = \\sqrt{x^2 + y^2}$"
            ],
            "correct": 0,
            "explanation": "$\\|\\vec{u}\\| = \\sqrt{x^2 + y^2 + z^2}$។"
        },
        {
            "question": "ផលគុណស្កាលែនៃ $\\vec{u} = (x, y, z)$ និង $\\vec{v} = (x', y', z')$ គឺ ៖",
            "options": [
                "$\\vec{u} \\cdot \\vec{v} = xx' + yy' + zz'$",
                "$\\vec{u} \\cdot \\vec{v} = (x + x', y + y', z + z')$",
                "$\\vec{u} \\cdot \\vec{v} = xx' \\cdot yy' \\cdot zz'$",
                "$\\vec{u} \\cdot \\vec{v} = \\sqrt{xx' + yy' + zz'}$"
            ],
            "correct": 0,
            "explanation": "ផលគុណស្កាលែក្នុងតម្រុយអរតូណរម៉ាល់៖ $\\vec{u} \\cdot \\vec{v} = xx' + yy' + zz'$។"
        },
        {
            "question": "វ៉ិចទ័រពីរ $\\vec{u}$ និង $\\vec{v}$ កែងគ្នា (កែងអរតូកូណាល់) លុះត្រាតែ ៖",
            "options": [
                "$\\vec{u} \\cdot \\vec{v} = 0$",
                "$\\|\\vec{u}\\| = \\|\\vec{v}\\|$",
                "$\\vec{u} = k\\vec{v}$",
                "$\\vec{u} \\cdot \\vec{v} = 1$"
            ],
            "correct": 0,
            "explanation": "$\\vec{u} \\perp \\vec{v} \\iff \\vec{u} \\cdot \\vec{v} = 0$។"
        },
        {
            "question": "ចម្ងាយរវាងចំណុចពីរ $A(x_A, y_A, z_A)$ និង $B(x_B, y_B, z_B)$ គឺ ៖",
            "options": [
                "$AB = \\sqrt{(x_B - x_A)^2 + (y_B - y_A)^2 + (z_B - z_A)^2}$",
                "$AB = (x_B - x_A) + (y_B - y_A) + (z_B - z_A)$",
                "$AB = \\sqrt{(x_B + x_A)^2 + (y_B + y_A)^2}$",
                "$AB = (x_B - x_A)^2 + (y_B - y_A)^2 + (z_B - z_A)^2$"
            ],
            "correct": 0,
            "explanation": "រូបមន្តចម្ងាយរវាងពីរចំណុចក្នុងលំហ ៖ $AB = \\sqrt{(x_B - x_A)^2 + (y_B - y_A)^2 + (z_B - z_A)^2}$។"
        },
        {
            "question": "គណនាម៉ូឌុលនៃវ៉ិចទ័រ $\\vec{u} = (2, -1, 2)$ ៖",
            "options": [
                "$3$",
                "$9$",
                "$\\sqrt{5}$",
                "$\\sqrt{13}$"
            ],
            "correct": 0,
            "explanation": "$\\|\\vec{u}\\| = \\sqrt{2^2 + (-1)^2 + 2^2} = \\sqrt{4 + 1 + 4} = \\sqrt{9} = 3$។"
        },
        {
            "question": "កូអរដោនេចំណុចកណ្តាល $I$ នៃអង្កត់ $AB$ គឺ ៖",
            "options": [
                "$I\\left(\\dfrac{x_A + x_B}{2}, \\dfrac{y_A + y_B}{2}, \\dfrac{z_A + z_B}{2}\\right)$",
                "$I(x_B - x_A, y_B - y_A, z_B - z_A)$",
                "$I(x_A + x_B, y_A + y_B, z_A + z_B)$",
                "$I\\left(\\dfrac{x_B - x_A}{2}, \\dfrac{y_B - y_A}{2}, \\dfrac{z_B - z_A}{2}\\right)$"
            ],
            "correct": 0,
            "explanation": "ចំណុចកណ្តាលនៃអង្កត់ $AB$ យកកូអរដោនេបូកបញ្ចូលគ្នាចែកនឹង $2$។"
        },
        {
            "question": "កូអរដោនេទីប្រជុំទម្ងន់ $G$ នៃត្រីកោណ $ABC$ គឺ ៖",
            "options": [
                "$G\\left(\\dfrac{x_A + x_B + x_C}{3}, \\dfrac{y_A + y_B + y_C}{3}, \\dfrac{z_A + z_B + z_C}{3}\\right)$",
                "$G\\left(\\dfrac{x_A + x_B + x_C}{2}, \\dfrac{y_A + y_B + y_C}{2}, \\dfrac{z_A + z_B + z_C}{2}\\right)$",
                "$G(x_A + x_B + x_C, y_A + y_B + y_C, z_A + z_B + z_C)$",
                "$G(0, 0, 0)$"
            ],
            "correct": 0,
            "explanation": "ទីប្រជុំទម្ងន់ត្រីកោណ យកកូអរដោនេកំពូលទាំងបីបូកបញ្ចូលគ្នាចែកនឹង $3$។"
        },
        {
            "question": "កូស៊ីនុសនៃមុំ $\\theta$ រវាងពីរវ៉ិចទ័រ $\\vec{u}$ និង $\\vec{v}$ គឺ ៖",
            "options": [
                "$\\cos\\theta = \\dfrac{\\vec{u} \\cdot \\vec{v}}{\\|\\vec{u}\\| \\cdot \\|\\vec{v}\\|}$",
                "$\\cos\\theta = \\vec{u} \\cdot \\vec{v}$",
                "$\\cos\\theta = \\dfrac{\\|\\vec{u}\\| \\cdot \\|\\vec{v}\\|}{\\vec{u} \\cdot \\vec{v}}$",
                "$\\cos\\theta = \\|\\vec{u} - \\vec{v}\\|$"
            ],
            "correct": 0,
            "explanation": "$\\vec{u} \\cdot \\vec{v} = \\|\\vec{u}\\| \\|\\vec{v}\\| \\cos\\theta \\implies \\cos\\theta = \\dfrac{\\vec{u} \\cdot \\vec{v}}{\\|\\vec{u}\\| \\cdot \\|\\vec{v}\\|}$។"
        },
        {
            "question": "វ៉ិចទ័រពីរ $\\vec{u}$ និង $\\vec{v}$ កូលីនេអ៊ែរគ្នា (ស្របគ្នា) លុះត្រាតែ ៖",
            "options": [
                "$\\vec{u} = k\\vec{v}$ (មានចំនួនពិត $k$ ដែល $\\dfrac{x}{x'} = \\dfrac{y}{y'} = \\dfrac{z}{z'} = k$)",
                "$\\vec{u} \\cdot \\vec{v} = 0$",
                "$\\|\\vec{u}\\| + \\|\\vec{v}\\| = 0$",
                "$\\vec{u} + \\vec{v} = \\vec{0}$"
            ],
            "correct": 0,
            "explanation": "កូលីនេអ៊ែរគ្នា មានន័យថាកូអរដោនេរបស់វាសមាមាត្រគ្នា ៖ $\\vec{u} = k\\vec{v}$។"
        },
        {
            "question": "គណនាផលគុណស្កាលែរវាង $\\vec{u} = (1, 2, 3)$ និង $\\vec{v} = (4, -1, 2)$ ៖",
            "options": [
                "$8$",
                "$12$",
                "$6$",
                "$0$"
            ],
            "correct": 0,
            "explanation": "$\\vec{u} \\cdot \\vec{v} = 1(4) + 2(-1) + 3(2) = 4 - 2 + 6 = 8$។"
        }
    ]
}
