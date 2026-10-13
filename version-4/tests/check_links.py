"""Check that every local link and asset referenced by the V4 pages exists.
Run from the repository root:  python3 version-4/tests/check_links.py"""
import os, re, sys, glob
base = os.path.join(os.path.dirname(__file__), '..')
bad = []
files = glob.glob(os.path.join(base, '*.html')) + glob.glob(os.path.join(base, 'assets/js/**/*.js'), recursive=True)
for f in files:
    text = open(f, encoding='utf-8').read()
    for m in re.finditer(r'''(?:href|src)=["'`]([^"'`$#][^"'`]*)["'`]''', text):
        url = m.group(1)
        if re.match(r'^(https?:|mailto:|data:|//)', url) or '${' in url:
            continue
        path = url.split('#')[0].split('?')[0]
        if not path:
            continue
        target = os.path.normpath(os.path.join(os.path.dirname(f) if f.endswith('.html') else base, path))
        if os.path.isdir(target):
            target = os.path.join(target, 'index.html')
        if not os.path.exists(target):
            bad.append(f'{os.path.relpath(f, base)} → {url}')
print('\n'.join(bad) if bad else f'All local links OK ({len(files)} files checked)')
sys.exit(1 if bad else 0)
