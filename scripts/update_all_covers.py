import os, fitz
from PIL import Image

print("Starting generation of authentic MoEYS covers...")

# 1. Grade 7
doc7 = fitz.open('ថ្នាក់ទី៧៖_គណិតវិទ្យា.pdf')
pix7 = doc7[0].get_pixmap(dpi=150)
pix7.save('assets/moeys_grade7.jpg')
print("Saved assets/moeys_grade7.jpg:", pix7.width, "x", pix7.height)

# 2. Grade 8
doc8 = fitz.open('ថ្នាក់ទី៨៖_គណិតវិទ្យា.pdf')
pix8 = doc8[0].get_pixmap(dpi=150)
pix8.save('assets/moeys_grade8.jpg')
print("Saved assets/moeys_grade8.jpg:", pix8.width, "x", pix8.height)

# 3. Grade 9
doc9 = fitz.open('ថ្នាក់ទី៩៖_គណិតវិទ្យា.pdf')
pix9 = doc9[0].get_pixmap(dpi=150)
pix9.save('assets/moeys_grade9.jpg')
print("Saved assets/moeys_grade9.jpg:", pix9.width, "x", pix9.height)

# 4. Grade 10 - clean portrait cover from backups
orig_g10 = Image.open('backups/covers_backup/moeys_grade10.jpg')
# Clean crop: x from 40 to 620, y from 25 to 745
crop_g10 = orig_g10.crop((40, 25, 620, 745))
# Resize with high quality filter to high resolution
crop_g10 = crop_g10.resize((crop_g10.width * 2, crop_g10.height * 2), Image.Resampling.LANCZOS)
crop_g10.save('assets/moeys_grade10.jpg', quality=95)
print("Saved assets/moeys_grade10.jpg:", crop_g10.size)

# 5. Grade 12 Part 1 (Basic / Foundation)
doc12_1 = fitz.open('សៀវភៅគណិតវិទ្យាថ្នាក់ទី_១២_ភាគ_១_វិទ្យាសាស្ត្រ.pdf')
pix12_1 = doc12_1[0].get_pixmap(dpi=300, clip=doc12_1[0].trimbox)
pix12_1.save('assets/moeys_grade12_basic.jpg')
pix12_1.save('assets/moeys_grade12.jpg')
print("Saved assets/moeys_grade12_basic.jpg:", pix12_1.width, "x", pix12_1.height)

# 6. Grade 12 Part 2 (Advanced / Science)
doc12_2 = fitz.open('សៀវភៅគណិតវិទ្យាថ្នាក់ទី_១២_ភាគ_២_វិទ្យាសាស្ត្រ.pdf')
pix12_2 = doc12_2[0].get_pixmap(dpi=300, clip=doc12_2[0].trimbox)
pix12_2.save('assets/moeys_grade12_adv.jpg')
print("Saved assets/moeys_grade12_adv.jpg:", pix12_2.width, "x", pix12_2.height)

print("All authentic MoEYS textbook covers updated successfully!")
