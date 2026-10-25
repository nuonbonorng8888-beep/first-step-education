import json
import re

def process_worksheets(fp):
    print(f'Processing {fp}...')
    with open(fp, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    total_frac_converted = 0
    total_sol_spaced = 0
    total_q_spaced = 0

    for lid, ldata in data.items():
        # Process points
        for pt in ldata.get('points', []):
            # Process summary
            if 'summary' in pt:
                s = pt['summary']
                new_s = re.sub(r'(?<!d)frac\{', 'dfrac{', s)
                if new_s != s:
                    total_frac_converted += len(re.findall(r'(?<!d)frac\{', s))
                    pt['summary'] = new_s

            # Process exercises
            for ex in pt.get('exercises', []):
                # Instruction
                if 'instruction' in ex:
                    ex['instruction'] = re.sub(r'(?<!d)frac\{', 'dfrac{', ex['instruction'])

                # Question
                if 'question' in ex:
                    q = ex['question']
                    # Convert frac to dfrac
                    new_q = re.sub(r'(?<!d)frac\{', 'dfrac{', q)
                    # Spacing before subquestions if single newline
                    new_q = re.sub(r'([^\n])\n([ក-អa-zA-Z0-9]\.|\d+\)|\([ក-អa-zA-Z0-9]\))', r'\1\n\n\2', new_q)
                    if new_q != q:
                        total_q_spaced += 1
                        ex['question'] = new_q

                # Solution
                if 'solution' in ex:
                    sol = ex['solution']
                    # Convert frac to dfrac
                    new_sol = re.sub(r'(?<!d)frac\{', 'dfrac{', sol)
                    # Spacing before subquestions/steps if single newline
                    # Pattern matches: not a newline, newline, then 1., 2., ក., ខ., a., etc.
                    new_sol = re.sub(r'([^\n])\n([ក-អa-zA-Z0-9]\.|\d+\)|\([ក-អa-zA-Z0-9]\))', r'\1\n\n\2', new_sol)
                    if new_sol != sol:
                        total_sol_spaced += 1
                        ex['solution'] = new_sol

                # Rubric
                if 'rubric' in ex:
                    ex['rubric'] = re.sub(r'(?<!d)frac\{', 'dfrac{', ex['rubric'])

    with open(fp, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f'Finished {fp}:')
    print(f'  Fracs converted: {total_frac_converted}')
    print(f'  Questions spaced: {total_q_spaced}')
    print(f'  Solutions spaced: {total_sol_spaced}')

def process_courses(fp):
    print(f'Processing {fp}...')
    with open(fp, 'r', encoding='utf-8') as f:
        content = f.read()

    old_count = len(re.findall(r'(?<!d)frac\{', content))
    new_content = re.sub(r'(?<!d)frac\{', 'dfrac{', content)
    new_count = len(re.findall(r'(?<!d)frac\{', new_content))

    # Verify JSON
    data = json.loads(new_content)
    with open(fp, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f'Finished {fp}: Converted {old_count} fracs to dfrac. Remaining: {new_count}.')

if __name__ == '__main__':
    process_worksheets('data/worksheets.json')
    process_worksheets('data/worksheets_g11.json')
    process_courses('data/courses.json')
