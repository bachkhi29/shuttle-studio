from pathlib import Path
root=Path(__file__).resolve().parent
html=(root/'index.html').read_text(encoding='utf-8')
html=html.replace('<link rel="stylesheet" href="style.css">','<style>\n'+(root/'style.css').read_text(encoding='utf-8')+'\n</style>')
for name in ['core.js','app.js']:
    html=html.replace(f'<script src="{name}"></script>','<script>\n'+(root/name).read_text(encoding='utf-8')+'\n</script>')
(root/'MO_UNG_DUNG.html').write_text(html,encoding='utf-8')
print('Built MO_UNG_DUNG.html')
