import json, re

def update_data(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    modified_questions = 0
    modified_solutions = 0
    typo_fixed = 0

    for lid, ldata in data.items():
        for pt in ldata.get('points', []):
            for ex in pt.get('exercises', []):
                q = ex.get('question', '')
                sol = ex.get('solution', '')

                # Fix typo in les-g11b-3-2 if present
                if r'\dfrac{\sin(x}{2)}' in q:
                    q = q.replace(r'\dfrac{\sin(x}{2)}', r'\sin\left(\dfrac{x}{2}\right)')
                    q = q.replace(r'\dfrac{\cos(x}{2)}', r'\cos\left(\dfrac{x}{2}\right)')
                    typo_fixed += 1

                # Sub-question spacing in question: \nក. -> \n\nក.
                # Pattern: not preceded by \n, followed by newline and sub-question label
                new_q = re.sub(r'([^\n])\n([ក-អa-zA-Z0-9]\.|\d+\))', r'\1\n\n\2', q)
                if new_q != q:
                    ex['question'] = new_q
                    modified_questions += 1

                # In solutions, ensure sub-question headers like \n\nខ. have double newline too
                new_sol = re.sub(r'([^\n])\n([ក-អ]\.)', r'\1\n\n\2', sol)
                if new_sol != sol:
                    ex['solution'] = new_sol
                    modified_solutions += 1

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f'Updated {file_path}:')
    print(f'  Modified questions: {modified_questions}')
    print(f'  Modified solutions: {modified_solutions}')
    print(f'  Fixed typos: {typo_fixed}')

if __name__ == '__main__':
    update_data('data/worksheets.json')
    update_data('data/worksheets_g11.json')
