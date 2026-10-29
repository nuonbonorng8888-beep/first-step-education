import json
import re

with open('data/point_quizzes.json', 'r', encoding='utf-8') as f:
    pq = json.load(f)

# 1. Update les-g11b-1-1 Point 3 completely to adhere strictly to MoEYS curriculum
p3_quizzes = [
    {
        "id": "q1",
        "questionNumber": 1,
        "pointNumber": 3,
        "pointTitle": "ចំណុចទី ៣ ៖ អថេរភាពនៃស្វ៊ីត",
        "level": "កម្រិត ១ (មូលដ្ឋាន)",
        "question": "តាមនិយមន័យក្នុងគណិតវិទ្យា តើស្វ៊ីតបែបណាដែលត្រូវបានហៅថាជា «ស្វ៊ីតម៉ូណូតូន»? ៖",
        "options": [
            "ស្វ៊ីតដែលជាស្វ៊ីតកើន ឬជាស្វ៊ីតចុះ",
            "ស្វ៊ីតដែលមានតួទាំងអស់ជាចំនួនវិជ្ជមាន",
            "ស្វ៊ីតដែលជាស្វ៊ីតទាល់លើផង និងទាល់ក្រោមផង",
            "ស្វ៊ីតដែលមានតួឆ្លាស់សញ្ញាបូក-ដក"
        ],
        "correct": 0,
        "explanation": "តាមនិយមន័យសៀវភៅពុម្ពក្រសួង ៖ ស្វ៊ីតកើន ឬ ស្វ៊ីតចុះ ហៅថា ស្វ៊ីតម៉ូណូតូន (Monotonic sequence)។"
    },
    {
        "id": "q2",
        "questionNumber": 2,
        "pointNumber": 3,
        "pointTitle": "ចំណុចទី ៣ ៖ អថេរភាពនៃស្វ៊ីត",
        "level": "កម្រិត ១ (មូលដ្ឋាន)",
        "question": "ដើម្បីសិក្សាអថេរភាព (ភាពកើន ឬចុះ) នៃស្វ៊ីត $(u_n)$ គេត្រូវពិនិត្យសញ្ញានៃកន្សោមណា? ៖",
        "options": [
            "ផលដក $u_{n+1} - u_n$",
            "ផលបូក $u_{n+1} + u_n$",
            "ផលគុណ $u_{n+1} \\cdot u_n$",
            "ផលដក $u_{n+2} - u_n$"
        ],
        "correct": 0,
        "explanation": "ដើម្បីសិក្សាភាពកើន ឬចុះនៃស្វ៊ីត គេពិនិត្យសញ្ញានៃផលដក $u_{n+1} - u_n$ ៖ បើ $u_{n+1} - u_n > 0$ ស្វ៊ីតកើន, បើ $u_{n+1} - u_n < 0$ ស្វ៊ីតចុះ។"
    },
    {
        "id": "q3",
        "questionNumber": 3,
        "pointNumber": 3,
        "pointTitle": "ចំណុចទី ៣ ៖ អថេរភាពនៃស្វ៊ីត",
        "level": "កម្រិត ១ (មូលដ្ឋាន)",
        "question": "គេឱ្យស្វ៊ីត $(u_n)$ កំណត់ដោយ $u_n = \\dfrac{n}{2n + 1}$ ចំពោះគ្រប់ $n \\ge 1$ ៖ គណនាផលដក $u_{n+1} - u_n$ ៖",
        "options": [
            "$\\dfrac{1}{(2n+3)(2n+1)}$",
            "$-\\dfrac{1}{(2n+3)(2n+1)}$",
            "$\\dfrac{2}{(2n+3)(2n+1)}$",
            "$\\dfrac{n}{(2n+3)(2n+1)}$"
        ],
        "correct": 0,
        "explanation": "គណនា $u_{n+1} = \\dfrac{n+1}{2(n+1)+1} = \\dfrac{n+1}{2n+3}$។\n\nផលដក ៖ $u_{n+1} - u_n = \\dfrac{n+1}{2n+3} - \\dfrac{n}{2n+1} = \\dfrac{(n+1)(2n+1) - n(2n+3)}{(2n+3)(2n+1)} = \\dfrac{1}{(2n+3)(2n+1)}$។"
    },
    {
        "id": "q4",
        "questionNumber": 4,
        "pointNumber": 3,
        "pointTitle": "ចំណុចទី ៣ ៖ អថេរភាពនៃស្វ៊ីត",
        "level": "កម្រិត ២ (អនុវត្ត)",
        "question": "គេឱ្យស្វ៊ីត $(u_n)$ កំណត់ដោយ $u_n = \\dfrac{n}{2n + 1}$ ចំពោះគ្រប់ $n \\ge 1$ ៖ តើ $(u_n)$ ជាស្វ៊ីតកើន ឬជាស្វ៊ីតចុះ? ៖",
        "options": [
            "$(u_n)$ ជាស្វ៊ីតកើន",
            "$(u_n)$ ជាស្វ៊ីតចុះ",
            "$(u_n)$ ជាស្វ៊ីតថេរ",
            "$(u_n)$ មិនកើន មិនចុះ"
        ],
        "correct": 0,
        "explanation": "គណនាផលដក ៖ $u_{n+1} - u_n = \\dfrac{n+1}{2n+3} - \\dfrac{n}{2n+1} = \\dfrac{1}{(2n+3)(2n+1)}$។\n\nដោយសារ $n \\ge 1$ នាំឱ្យ $2n+3 > 0$ និង $2n+1 > 0$ ហេតុនេះ $u_{n+1} - u_n > 0$ ចំពោះគ្រប់ $n \\ge 1$។\nដូចនេះ $(u_n)$ ជាស្វ៊ីតកើន (ស្វ៊ីតកើនក៏ជាស្វ៊ីតម៉ូណូតូន)។"
    },
    {
        "id": "q5",
        "questionNumber": 5,
        "pointNumber": 3,
        "pointTitle": "ចំណុចទី ៣ ៖ អថេរភាពនៃស្វ៊ីត",
        "level": "កម្រិត ២ (អនុវត្ត)",
        "question": "គេឱ្យស្វ៊ីត $(a_n)$ កំណត់ដោយ $a_n = 4n - 5$ ចំពោះគ្រប់ $n \\ge 1$ ៖ គណនាផលដក $a_{n+1} - a_n$ ៖",
        "options": [
            "$4$",
            "$-4$",
            "$5$",
            "$-1$"
        ],
        "correct": 0,
        "explanation": "គណនា ៖ $a_{n+1} - a_n = [4(n+1) - 5] - (4n - 5) = 4n - 1 - 4n + 5 = 4$។"
    },
    {
        "id": "q6",
        "questionNumber": 6,
        "pointNumber": 3,
        "pointTitle": "ចំណុចទី ៣ ៖ អថេរភាពនៃស្វ៊ីត",
        "level": "កម្រិត ២ (អនុវត្ត)",
        "question": "គេឱ្យស្វ៊ីត $(a_n)$ កំណត់ដោយ $a_n = 4n - 5$ ចំពោះគ្រប់ $n \\ge 1$ ៖ តើ $(a_n)$ ជាស្វ៊ីតកើន ឬជាស្វ៊ីតចុះ? ៖",
        "options": [
            "$(a_n)$ ជាស្វ៊ីតកើន",
            "$(a_n)$ ជាស្វ៊ីតចុះ",
            "$(a_n)$ ជាស្វ៊ីតថេរ",
            "$(a_n)$ មិនកើន មិនចុះ"
        ],
        "correct": 0,
        "explanation": "គណនាផលដក ៖ $a_{n+1} - a_n = [4(n+1) - 5] - (4n - 5) = 4 > 0$ ចំពោះគ្រប់ $n \\ge 1$។\nដូចនេះ $(a_n)$ ជាស្វ៊ីតកើន (ស្វ៊ីតកើនក៏ជាស្វ៊ីតម៉ូណូតូន)។"
    },
    {
        "id": "q7",
        "questionNumber": 7,
        "pointNumber": 3,
        "pointTitle": "ចំណុចទី ៣ ៖ អថេរភាពនៃស្វ៊ីត",
        "level": "កម្រិត ២ (អនុវត្ត)",
        "question": "គេឱ្យស្វ៊ីត $(b_n)$ កំណត់ដោយ $b_n = 15 - 3n$ ចំពោះគ្រប់ $n \\ge 1$ ៖ គណនាផលដក $b_{n+1} - b_n$ ៖",
        "options": [
            "$-3$",
            "$3$",
            "$-15$",
            "$12$"
        ],
        "correct": 0,
        "explanation": "គណនា ៖ $b_{n+1} - b_n = [15 - 3(n+1)] - (15 - 3n) = 12 - 3n - 15 + 3n = -3$។"
    },
    {
        "id": "q8",
        "questionNumber": 8,
        "pointNumber": 3,
        "pointTitle": "ចំណុចទី ៣ ៖ អថេរភាពនៃស្វ៊ីត",
        "level": "កម្រិត ២ (អនុវត្ត)",
        "question": "គេឱ្យស្វ៊ីត $(b_n)$ កំណត់ដោយ $b_n = 15 - 3n$ ចំពោះគ្រប់ $n \\ge 1$ ៖ តើ $(b_n)$ ជាស្វ៊ីតកើន ឬជាស្វ៊ីតចុះ? ៖",
        "options": [
            "$(b_n)$ ជាស្វ៊ីតចុះ",
            "$(b_n)$ ជាស្វ៊ីតកើន",
            "$(b_n)$ ជាស្វ៊ីតថេរ",
            "$(b_n)$ មិនកើន មិនចុះ"
        ],
        "correct": 0,
        "explanation": "គណនាផលដក ៖ $b_{n+1} - b_n = [15 - 3(n+1)] - (15 - 3n) = -3 < 0$ ចំពោះគ្រប់ $n \\ge 1$។\nដូចនេះ $(b_n)$ ជាស្វ៊ីតចុះ (ស្វ៊ីតចុះក៏ជាស្វ៊ីតម៉ូណូតូន)។"
    },
    {
        "id": "q9",
        "questionNumber": 9,
        "pointNumber": 3,
        "pointTitle": "ចំណុចទី ៣ ៖ អថេរភាពនៃស្វ៊ីត",
        "level": "កម្រិត ២ (អនុវត្ត)",
        "question": "គេឱ្យស្វ៊ីត $(v_n)$ កំណត់ដោយ $v_n = (-1)^n$ ចំពោះគ្រប់ $n \\ge 1$ ៖ តើ $(v_n)$ ជាស្វ៊ីតម៉ូណូតូនដែរឬទេ? ៖",
        "options": [
            "$(v_n)$ មិនមែនជាស្វ៊ីតម៉ូណូតូន",
            "$(v_n)$ ជាស្វ៊ីតម៉ូណូតូន (ព្រោះវាជាស្វ៊ីតកើន)",
            "$(v_n)$ ជាស្វ៊ីតម៉ូណូតូន (ព្រោះវាជាស្វ៊ីតចុះ)",
            "$(v_n)$ ជាស្វ៊ីតថេរ"
        ],
        "correct": 0,
        "explanation": "តួនៃស្វ៊ីតគឺ $-1, 1, -1, 1, \\dots$ មានសញ្ញាឆ្លាស់ មិនកើន និងមិនចុះ ដូចនេះ $(v_n)$ មិនមែនជាស្វ៊ីតម៉ូណូតូនទេ។"
    },
    {
        "id": "q10",
        "questionNumber": 10,
        "pointNumber": 3,
        "pointTitle": "ចំណុចទី ៣ ៖ អថេរភាពនៃស្វ៊ីត",
        "level": "កម្រិត ២ (អនុវត្ត)",
        "question": "គេឱ្យស្វ៊ីត $(w_n)$ កំណត់ដោយ $w_n = \\dfrac{1}{n}$ ចំពោះគ្រប់ $n \\ge 1$ ៖ តើ $(w_n)$ ជាស្វ៊ីតកើន ឬជាស្វ៊ីតចុះ? ៖",
        "options": [
            "$(w_n)$ ជាស្វ៊ីតចុះ",
            "$(w_n)$ ជាស្វ៊ីតកើន",
            "$(w_n)$ ជាស្វ៊ីតថេរ",
            "$(w_n)$ មិនកើន មិនចុះ"
        ],
        "correct": 0,
        "explanation": "គណនាផលដក ៖ $w_{n+1} - w_n = \\dfrac{1}{n+1} - \\dfrac{1}{n} = \\dfrac{-1}{n(n+1)} < 0$ ចំពោះគ្រប់ $n \\ge 1$ នាំឱ្យ $(w_n)$ ជាស្វ៊ីតចុះ។"
    }
]

pq['les-g11b-1-1']['3'] = p3_quizzes

# 2. Global Spelling & Vocabulary Cleanups across ALL lessons and all grades
spelling_replacements = [
    (r'\bពិនិត\b', 'ពិនិត្យ'),
    (r'ពិនិត\s', 'ពិនិត្យ '),
    (r'អាគុយម៉ង\b', 'អាគុយម៉ង់'),
    (r'អាគុយម៉ង\s', 'អាគុយម៉ង់ '),
    (r'ម៉ូណូតូនកើន', 'ស្វ៊ីតកើន'),
    (r'ម៉ូណូតូនចុះ', 'ស្វ៊ីតចុះ'),
    (r'ស្វ៊ីន', 'ស្វ៊ីត'),
    (r'អនុគមន៏', 'អនុគមន៍'),
    (r'ត្រីកោណសម័ង្គ', 'ត្រីកោណសម័ង្ស'),
    (r'ត្រីកោណសមបាទ', 'ត្រីកោណសមបាត'),
]

fixed_spelling_count = 0
for les_id, points in pq.items():
    if not isinstance(points, dict): continue
    for p_num, q_list in points.items():
        if not isinstance(q_list, list): continue
        for q in q_list:
            for field in ['question', 'explanation']:
                if field in q and isinstance(q[field], str):
                    orig = q[field]
                    val = orig
                    for pat, rep in spelling_replacements:
                        val = re.sub(pat, rep, val)
                    if val != orig:
                        q[field] = val
                        fixed_spelling_count += 1
            if 'options' in q and isinstance(q['options'], list):
                new_opts = []
                for opt in q['options']:
                    opt_str = str(opt)
                    for pat, rep in spelling_replacements:
                        opt_str = re.sub(pat, rep, opt_str)
                    new_opts.append(opt_str)
                q['options'] = new_opts

with open('data/point_quizzes.json', 'w', encoding='utf-8') as f:
    json.dump(pq, f, ensure_ascii=False, indent=2)

print(f"Applied updates successfully! Spelling fixes: {fixed_spelling_count}")
