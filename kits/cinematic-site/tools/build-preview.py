"""Build the claude.ai preview bundle: same files as the site, but fonts embedded in pulp.css as data URIs
(the preview's content policy blocks self-hosted font files). Usage: python3 tools/build-preview.py OUT_DIR"""
import base64, os, re, shutil, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); out = sys.argv[1]
shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
for d in ('vendor', 'assets'): shutil.copytree(os.path.join(root, d), os.path.join(out, d))
for f in os.listdir(root):
    if f.endswith('.js') or f == 'slides.html': shutil.copy(os.path.join(root, f), out)
css = open(os.path.join(root, 'pulp.css')).read()
def inline(m):
    data = base64.b64encode(open(os.path.join(root, m.group(1)), 'rb').read()).decode()
    return "url(data:font/woff2;base64," + data + ")"
open(os.path.join(out, 'pulp.css'), 'w').write(re.sub(r"url\((fonts/[^)]+\.woff2)\)", inline, css))
page = open(os.path.join(root, 'index.html')).read()
page = re.sub(r'<!doctype html>\s*<html[^>]*>\s*<head>\s*', '', page)
page = re.sub(r'<meta charset[^>]*>\s*<meta name="viewport"[^>]*>\s*', '', page)
page = page.replace('</head>\n<body>', '').replace('</body>\n</html>', '')
open(os.path.join(out, 'index.html'), 'w').write(page)
print('built', out)
