# -*- coding: utf-8 -*-
"""
Mathematical overhauls for Grade 9 & 10 courses.
"""

G7_10_FIXES = {
    "les-g9-02": [
        {
            "question": "រូបមន្តឌីស្គ្រីមីណង់ $\\Delta$ (ដែលតា) នៃសមីការ $ax^2 + bx + c = 0$ គឺ ៖",
            "options": [
                "$\\Delta = b^2 - 4ac$",
                "$\\Delta = b^2 + 4ac$",
                "$\\Delta = 4ac - b^2$",
                "$\\Delta = b - 4ac$"
            ],
            "correct": 0,
            "explanation": "តាមទ្រឹស្តីសមីការដឺក្រេទី ២ រូបមន្តឌីស្គ្រីមីណង់គឺ $\\Delta = b^2 - 4ac$។"
        },
        {
            "question": "ប្រសិនបើ $\\Delta > 0$ តើសមីការ $ax^2 + bx + c = 0$ មានឫសយ៉ាងដូចម្តេច?",
            "options": [
                "មានឫសពីរផ្សេងគ្នាជាចំនួនពិត ($x_{1,2} = \\dfrac{-b \\pm \\sqrt{\\Delta}}{2a}$)",
                "មានឫសឌុប",
                "គ្មានឫសក្នុងសំណុំ $\\mathbb{R}$",
                "មានឫសបី"
            ],
            "correct": 0,
            "explanation": "កាលណា $\\Delta > 0$ សមីការមានឫសពីរផ្សេងគ្នាជាចំនួនពិតគឺ $x_{1,2} = \\dfrac{-b \\pm \\sqrt{\\Delta}}{2a}$។"
        },
        {
            "question": "ប្រសិនបើ $\\Delta = 0$ តើសមីការដឺក្រេទី ២ មានឫសយ៉ាងណា?",
            "options": [
                "មានឫសឌុប $x_1 = x_2 = -\\dfrac{b}{2a}$",
                "គ្មានឫស",
                "មានឫសពីរផ្សេងគ្នា",
                "ឫសស្មើ $0$ ជានិច្ច"
            ],
            "correct": 0,
            "explanation": "កាលណា $\\Delta = 0$ សមីការមានឫសឌុបគឺ $x_0 = -\\dfrac{b}{2a}$។"
        },
        {
            "question": "រកឫសនៃសមីការ៖ $x^2 - 5x + 6 = 0$",
            "options": [
                "$x = 2$ ឬ $x = 3$",
                "$x = -2$ ឬ $x = -3$",
                "$x = 1$ ឬ $x = 6$",
                "$x = -1$ ឬ $x = -6$"
            ],
            "correct": 0,
            "explanation": "$(x - 2)(x - 3) = 0 \\implies x = 2$ ឬ $x = 3$។"
        },
        {
            "question": "រកឫសនៃសមីការ៖ $x^2 - 4 = 0$",
            "options": [
                "$x = 2$ ឬ $x = -2$",
                "$x = 4$",
                "$x = 16$",
                "$x = 0$"
            ],
            "correct": 0,
            "explanation": "$x^2 = 4 \\implies x = \\pm 2$។"
        },
        {
            "question": "តាមទ្រឹស្តីបទវ្យែត ផលបូកឫស $S = x_1 + x_2$ ស្មើនឹង ៖",
            "options": [
                "$-\\dfrac{b}{a}$",
                "$\\dfrac{c}{a}$",
                "$\\dfrac{b}{a}$",
                "$-\\dfrac{c}{a}$"
            ],
            "correct": 0,
            "explanation": "ទ្រឹស្តីបទវ្យែត៖ $S = x_1 + x_2 = -\\dfrac{b}{a}$ និង $P = x_1 x_2 = \\dfrac{c}{a}$។"
        },
        {
            "question": "តាមទ្រឹស្តីបទវ្យែត ផលគុណឫស $P = x_1 x_2$ ស្មើនឹង ៖",
            "options": [
                "$\\dfrac{c}{a}$",
                "$-\\dfrac{b}{a}$",
                "$-\\dfrac{c}{a}$",
                "$\\dfrac{b}{2a}$"
            ],
            "correct": 0,
            "explanation": "$P = x_1 x_2 = \\dfrac{c}{a}$។"
        },
        {
            "question": "រកផលបូក និងផលគុណឫសនៃសមីការ $2x^2 - 8x + 6 = 0$ ៖",
            "options": [
                "$S = 4, P = 3$",
                "$S = -4, P = 3$",
                "$S = 8, P = 6$",
                "$S = 2, P = 3$"
            ],
            "correct": 0,
            "explanation": "$S = -\\dfrac{-8}{2} = 4, P = \\dfrac{6}{2} = 3$។"
        },
        {
            "question": "ដោះស្រាយសមីការ៖ $x^2 - 6x + 9 = 0$",
            "options": [
                "$x = 3$ (ឫសឌុប)",
                "$x = -3$",
                "$x = \\pm 3$",
                "គ្មានឫស"
            ],
            "correct": 0,
            "explanation": "$(x - 3)^2 = 0 \\implies x = 3$ (ឫសឌុប)។"
        },
        {
            "question": "តើសមីការ $x^2 + 1 = 0$ មានឫសក្នុងសំណុំចំនួនពិត $\\mathbb{R}$ ដែរឬទេ?",
            "options": [
                "គ្មានឫសក្នុង $\\mathbb{R}$ ទេ (ព្រោះ $x^2 = -1 < 0$)",
                "$x = 1$",
                "$x = -1$",
                "$x = \\pm 1$"
            ],
            "correct": 0,
            "explanation": "$x^2 = -1$ គ្មានចំនួនពិតណាលើកជាការ៉េចរេញអវិជ្ជមានទេ ដូច្នេះគ្មានឫសក្នុង $\\mathbb{R}$។"
        }
    ],

    "les-g10-03": [
        {
            "question": "ក្នុងត្រីកោណកែង តើ $\\sin\\alpha$ ស្មើនឹងផលធៀបណា?",
            "options": [
                "$\\dfrac{\\text{ជ្រុងឈម}}{\\text{អ៊ីប៉ូតេនុស}}$",
                "$\\dfrac{\\text{ជ្រុងជាប់}}{\\text{អ៊ីប៉ូតេនុស}}$",
                "$\\dfrac{\\text{ជ្រុងឈម}}{\\text{ជ្រុងជាប់}}$",
                "$\\dfrac{\\text{អ៊ីប៉ូតេនុស}}{\\text{ជ្រុងឈម}}$"
            ],
            "correct": 0,
            "explanation": "$\\sin = \\dfrac{\\text{ឈម}}{\\text{អ៊ីប៉ូតេនុស}}$, $\\cos = \\dfrac{\\text{ជាប់}}{\\text{អ៊ីប៉ូតេនុស}}$, $\\tan = \\dfrac{\\text{ឈម}}{\\text{ជាប់}}$។"
        },
        {
            "question": "តើតម្លៃនៃ $\\sin^2 x + \\cos^2 x$ ស្មើនឹងប៉ុន្មាន?",
            "options": [
                "$1$",
                "$0$",
                "$2$",
                "$-1$"
            ],
            "correct": 0,
            "explanation": "រូបមន្តគ្រឹះត្រីកោណមាត្រ៖ $\\sin^2 x + \\cos^2 x = 1$ ចំពោះគ្រប់តម្លៃ $x$។"
        },
        {
            "question": "តើតម្លៃនៃ $\\sin(30^\\circ)$ ស្មើនឹងប៉ុន្មាន?",
            "options": [
                "$\\dfrac{1}{2}$",
                "$\\dfrac{\\sqrt{3}}{2}$",
                "$\\dfrac{\\sqrt{2}}{2}$",
                "$1$"
            ],
            "correct": 0,
            "explanation": "$\\sin(30^\\circ) = \\dfrac{1}{2}$។"
        },
        {
            "question": "តើតម្លៃនៃ $\\cos(60^\\circ)$ ស្មើនឹងប៉ុន្មាន?",
            "options": [
                "$\\dfrac{1}{2}$",
                "$\\dfrac{\\sqrt{3}}{2}$",
                "$0$",
                "$1$"
            ],
            "correct": 0,
            "explanation": "$\\cos(60^\\circ) = \\sin(30^\\circ) = \\dfrac{1}{2}$។"
        },
        {
            "question": "តើតម្លៃនៃ $\\tan(45^\\circ)$ ស្មើនឹងប៉ុន្មាន?",
            "options": [
                "$1$",
                "$0$",
                "$\\sqrt{3}$",
                "$\\dfrac{1}{\\sqrt{3}}$"
            ],
            "correct": 0,
            "explanation": "$\\tan(45^\\circ) = \\dfrac{\\sin(45^\\circ)}{\\cos(45^\\circ)} = 1$។"
        },
        {
            "question": "រូបមន្ត $\\tan x$ ជាផលធៀបរវាង $\\sin$ និង $\\cos$ គឺ ៖",
            "options": [
                "$\\dfrac{\\sin x}{\\cos x}$",
                "$\\dfrac{\\cos x}{\\sin x}$",
                "$\\dfrac{1}{\\sin x}$",
                "$\\sin x \\cdot \\cos x$"
            ],
            "correct": 0,
            "explanation": "$\\tan x = \\dfrac{\\sin x}{\\cos x}$ (ចំពោះ $\\cos x \\neq 0$)។"
        },
        {
            "question": "តើតម្លៃនៃ $1 + \\tan^2 x$ ស្មើនឹងកន្សោមណា?",
            "options": [
                "$\\dfrac{1}{\\cos^2 x}$",
                "$\\dfrac{1}{\\sin^2 x}$",
                "$\\cos^2 x$",
                "$\\sin^2 x$"
            ],
            "correct": 0,
            "explanation": "$1 + \\tan^2 x = 1 + \\dfrac{\\sin^2 x}{\\cos^2 x} = \\dfrac{\\cos^2 x + \\sin^2 x}{\\cos^2 x} = \\dfrac{1}{\\cos^2 x}$។"
        },
        {
            "question": "បើ $\\sin x = \\dfrac{3}{5}$ និង $x$ ជាមុំស្រួច ។ តើ $\\cos x$ ស្មើនឹងប៉ុន្មាន?",
            "options": [
                "$\\dfrac{4}{5}$",
                "$\\dfrac{3}{4}$",
                "$\\dfrac{5}{4}$",
                "$\\dfrac{2}{5}$"
            ],
            "correct": 0,
            "explanation": "$\\cos x = \\sqrt{1 - \\sin^2 x} = \\sqrt{1 - \\dfrac{9}{25}} = \\sqrt{\\dfrac{16}{25}} = \\dfrac{4}{5}$។"
        },
        {
            "question": "តើតម្លៃនៃ $\\sin(90^\\circ)$ និង $\\cos(0^\\circ)$ មានតម្លៃស្មើនឹងប៉ុន្មាន?",
            "options": [
                "ទាំងពីរស្មើ $1$",
                "ទាំងពីរស្មើ $0$",
                "$\\sin = 0, \\cos = 1$",
                "$\\sin = 1, \\cos = 0$"
            ],
            "correct": 0,
            "explanation": "$\\sin(90^\\circ) = 1$ និង $\\cos(0^\\circ) = 1$។"
        },
        {
            "question": "ទ្រឹស្តីបទស៊ីនុសក្នុងត្រីកោណ $ABC$ គឺ ៖",
            "options": [
                "$\\dfrac{a}{\\sin A} = \\dfrac{b}{\\sin B} = \\dfrac{c}{\\sin C} = 2R$",
                "$a^2 = b^2 + c^2 - 2bc\\cos A$",
                "$a \\sin A = b \\sin B$",
                "$S = abc$"
            ],
            "correct": 0,
            "explanation": "ទ្រឹស្តីបទស៊ីនុស៖ $\\dfrac{a}{\\sin A} = \\dfrac{b}{\\sin B} = \\dfrac{c}{\\sin C} = 2R$ ($R$ ជាកាំរង្វង់ចារឹកក្រៅ)។"
        }
    ]
}
