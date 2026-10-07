"""Bundles index.html + assets into one self-contained HTML file (dist/lanu-website-preview.html) for quick sharing.
Run: python3 website/tools/build-preview.py"""
import base64, os, re
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def rd(p, mode='r'):
    with open(os.path.join(root, p), mode) as f: return f.read()
def data_uri(p, mime):
    return 'data:%s;base64,%s' % (mime, base64.b64encode(rd(p, 'rb')).decode())
html = rd('index.html')
fonts = re.sub(r'url\(([^)]+\.woff2)\)', lambda m: 'url(%s)' % data_uri('assets/fonts/' + m.group(1), 'font/woff2'), rd('assets/fonts/fonts.css'))
css = rd('assets/site.css').replace('url(img/cubes-on-dark.svg)', 'url(%s)' % data_uri('assets/img/cubes-on-dark.svg', 'image/svg+xml'))
html = html.replace('<link rel="stylesheet" href="assets/fonts/fonts.css">', '<style>' + fonts + '</style>')
html = html.replace('<link rel="stylesheet" href="assets/site.css">', '<style>' + css + '</style>')
html = html.replace('assets/img/lanu-logo-on-dark.png', data_uri('assets/img/lanu-logo-on-dark.png', 'image/png'))
html = html.replace('<script src="assets/i18n.js"></script>', '<script>' + rd('assets/i18n.js') + '</script>')
html = html.replace('<script src="assets/site.js"></script>', '<script>' + rd('assets/site.js') + '</script>')
os.makedirs(os.path.join(root, 'dist'), exist_ok=True)
out = os.path.join(root, 'dist', 'lanu-website-preview.html')
open(out, 'w').write(html)
print(out, round(len(html) / 1024), 'KB')
