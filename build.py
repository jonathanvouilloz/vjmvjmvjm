import re

PROJ = "design-extract/site-minimalist-portoflio/project"

def read(p): return open(p, encoding="utf-8").read()

header = read(f"{PROJ}/Waniushka Portfolio.html")
header = re.sub(r'\s*<script type="text/babel"[^>]*></script>', '', header)

tweaks = read(f"{PROJ}/tweaks-panel.jsx")
comps  = read(f"{PROJ}/waniushka-components.jsx")
app    = read(f"{PROJ}/waniushka-app.jsx")

def wrap(name, src):
    return f"\n/* === {name} === */\n;(function(){{\n{src}\n}})();\n"

bundle = wrap("tweaks-panel.jsx", tweaks) + wrap("waniushka-components.jsx", comps) + wrap("waniushka-app.jsx", app)
# Auto-open the Tweaks panel in standalone mode (no edit-host parent).
activate = """
// Standalone: auto-activate the Tweaks panel since there is no edit-host.
if (window.parent === window) {
  window.addEventListener('load', () => {
    setTimeout(() => window.postMessage({ type: '__activate_edit_mode' }, '*'), 100);
  });
}
"""
inline = '  <script type="text/babel">\n' + bundle + "\n" + activate + "  </script>\n"
out = header.replace("</body>", inline + "</body>")

open("index.html", "w", encoding="utf-8").write(out)
print(len(out), "bytes")
