import os
from PIL import Image, ImageDraw, ImageFont

# Load old covers and new covers
grades = [
    ("ថ្នាក់ទី ៧", "backups/covers_backup/moeys_grade7.jpg", "assets/moeys_grade7.jpg"),
    ("ថ្នាក់ទី ៨", "backups/covers_backup/moeys_grade8.jpg", "assets/moeys_grade8.jpg"),
    ("ថ្នាក់ទី ៩", "backups/covers_backup/moeys_grade9.jpg", "assets/moeys_grade9.jpg"),
    ("ថ្នាក់ទី ១០", "backups/covers_backup/moeys_grade10.jpg", "assets/moeys_grade10.jpg"),
    ("ថ្នាក់ទី ១១ (មូលដ្ឋាន)", "assets/moeys_grade11_basic.jpg", "assets/moeys_grade11_basic.jpg"),
    ("ថ្នាក់ទី ១១ (កម្រិតខ្ពស់)", "assets/moeys_grade11_adv.jpg", "assets/moeys_grade11_adv.jpg"),
    ("ថ្នាក់ទី ១២ (មូលដ្ឋាន)", "backups/covers_backup/moeys_grade12_basic.jpg", "assets/moeys_grade12_basic.jpg"),
    ("ថ្នាក់ទី ១២ (កម្រិតខ្ពស់)", "backups/covers_backup/moeys_grade12_adv.jpg", "assets/moeys_grade12_adv.jpg")
]

card_w, card_h = 240, 320
pad = 20
cols = 4
rows = 2
header_h = 70
section_gap = 40

total_w = cols * card_w + (cols + 1) * pad
total_h = header_h + (rows * card_h + (rows + 1) * pad) * 2 + 100

canvas = Image.new("RGB", (total_w, 900), color=(15, 23, 42)) # Slate 900
draw = ImageDraw.Draw(canvas)

# Let's render a single grid comparing BEFORE vs AFTER
# Top row: Old covers for G7, G8, G9, G10, G12
# Bottom row: New authentic MoEYS covers
card_w = 170
card_h = 240
pad = 16
total_w = 8 * card_w + 9 * pad
total_h = 660

canvas = Image.new("RGB", (total_w, total_h), color=(11, 19, 43))
draw = ImageDraw.Draw(canvas)

# Title
# Draw headers
draw.rectangle([(0, 0), (total_w, 55)], fill=(20, 30, 60))
# Old section y = 65
# New section y = 360

for i, (title, old_p, new_p) in enumerate(grades):
    x = pad + i * (card_w + pad)
    
    # Old
    y_old = 75
    draw.rectangle([(x-2, y_old-2), (x+card_w+2, y_old+card_h+2)], fill=(40, 50, 75))
    if os.path.exists(old_p):
        im_old = Image.open(old_p).convert("RGB")
        im_old.thumbnail((card_w, card_h), Image.Resampling.LANCZOS)
        # Center inside card
        ox = x + (card_w - im_old.width) // 2
        oy = y_old + (card_h - im_old.height) // 2
        canvas.paste(im_old, (ox, oy))
        
    # New
    y_new = 385
    draw.rectangle([(x-2, y_new-2), (x+card_w+2, y_new+card_h+2)], fill=(30, 80, 110))
    if os.path.exists(new_p):
        im_new = Image.open(new_p).convert("RGB")
        im_new.thumbnail((card_w, card_h), Image.Resampling.LANCZOS)
        nx = x + (card_w - im_new.width) // 2
        ny = y_new + (card_h - im_new.height) // 2
        canvas.paste(im_new, (nx, ny))

canvas.save("scratch/before_after_all_grades.jpg", quality=92)
print("Saved scratch/before_after_all_grades.jpg successfully!")
