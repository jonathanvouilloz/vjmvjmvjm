import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const app = () => read('design-extract/site-minimalist-portoflio/project/waniushka-app.jsx');
const components = () => read('design-extract/site-minimalist-portoflio/project/waniushka-components.jsx');
const html = () => read('design-extract/site-minimalist-portoflio/project/Waniushka%20Portfolio.html');
const buildScript = () => read('precompile.mjs');
const cutoutScript = () => read('tools/cutout-drawing.py');
const packageManifest = () => JSON.parse(read('package.json'));
const optimizeDistScript = () => read('tools/optimize-dist.py');
const packageNetlifyScript = () => read('tools/package-netlify.py');

test('the public contact data uses the confirmed address and gift wording', () => {
  assert.match(components(), /email:\s*'hello@vjmvjmvjm\.com'/);
  assert.match(app(), /Pour faire des cadeaux, voici mon IBAN\.<br \/>/);
});

test('the header visual marks scale together without crowding mobile controls', () => {
  const shared = components();
  assert.match(app(), /const isCompact = useMediaQuery\('\(max-width: 480px\)'\)/);
  assert.doesNotMatch(app(), /!isCompact && <IconButton onClick=\{onHome\}/);
  assert.match(app(), /left:\s*isMobile\s*\?\s*'55%'\s*:\s*'50%'/);
  assert.match(app(), /<IconButton onClick=\{onHome\}[^>]*>\s*<IconHome \/>\s*<\/IconButton>\s*<IconButton onClick=\{onStar\}/s);
  assert.match(app(), /isCompact\s*\?\s*'clamp\(72px, 22\.5vw, 110px\)'/);
  assert.match(app(), /isMobile\s*\?\s*'clamp\(100px, 20vw, 136px\)'/);
  assert.match(app(), /'clamp\(180px, 20vw, 250px\)'/);
  assert.match(app(), /height:\s*'auto'/);
  assert.match(shared, /function IconHome\(\{ size = 29 \}\)/);
  assert.match(shared, /function IconMountain\(\{ size = 36 \}\)/);
  assert.match(shared, /function IconStar\(\{ size = 27 \}\)/);
  assert.match(shared, /function IconMenu\(\{ size = 29,/);
  assert.match(shared, /nav-sun\.svg'\}\s*size=\{27\}/);
  assert.match(shared, /opacity:\s*active\s*\|\|\s*hov\s*\?\s*1\s*:\s*0\.85/);
  assert.match(shared, /opacity:\s*hov\s*\?\s*1\s*:\s*0\.85/);
});

test('the menu maps cameras, ear spirals and eyes to the confirmed sections', () => {
  const source = app();
  assert.match(source, /kinematik:\s*\{[^}]*sigle-camera-1\.svg[^}]*sigle-camera-2\.svg/s);
  assert.match(source, /films:\s*\{[^}]*sigle-spirale-1\.svg[^}]*sigle-spirale-2\.svg/s);
  assert.match(source, /carnets:\s*\{[^}]*nav-eye-left\.svg[^}]*nav-eye-right\.svg/s);
  assert.match(source, /function Sigle\(\{ id, flip = false, size = '0\.8em', opacity = 0\.75 \}\)/);
});

test('Coin lecture is a visible empty section ready for future texts', () => {
  const source = app();
  assert.match(source, /lecture:\s*\{[^}]*sigle-etoile-1\.svg[^}]*sigle-etoile-2\.svg/s);
  assert.match(source, /\{ id: 'lecture', label: 'Coin lecture' \}/);
  assert.doesNotMatch(source, /\{ id: 'lecture', label: 'Coin lecture', hidden: true \}/);
  assert.match(source, /function ReadingPage\(\{ onBack \}\)/);
  assert.match(source, /<h1[^>]*>Coin lecture<\/h1>/s);
  assert.match(source, /case 'lecture':\s+return <ReadingPage onBack=\{\(\) => go\('menu'\)\} \/>/);
});

test('the alea uses a dedicated full-screen overlay instead of Popup', () => {
  const source = app();
  assert.match(source, /function FullscreenAleaOverlay/);
  assert.match(source, /aleas\s*&&\s*\(\s*<FullscreenAleaOverlay/s);
  assert.doesNotMatch(source, /aleas\s*&&\s*\(\s*\/\*[\s\S]*?<Popup/s);
  assert.match(source, /prefers-reduced-motion/);
});

test('the static HTML declares Netlify form detection and favicons', () => {
  const source = html();
  assert.match(source, /rel="icon"[^>]*href="assets\/brand\/favicon\.svg"/);
  assert.match(source, /rel="apple-touch-icon"[^>]*href="assets\/brand\/apple-touch-icon\.png"/);
  assert.match(source, /form[^>]*name="contact"[^>]*data-netlify="true"/);
  assert.match(source, /input[^>]*type="file"[^>]*name="dessin"/);
  assert.match(source, /<link rel="canonical" href="https:\/\/vjmvjmvjm\.com\/">/);
});

test('the React contact form exports the canvas PNG and posts multipart data', () => {
  const source = app();
  assert.match(source, /toBlob\(/);
  assert.match(source, /new FormData\(/);
  assert.match(source, /formData\.append\(['"]dessin['"]/);
  assert.match(source, /MAX_EXPORT_PIXELS\s*=\s*2_000_000/);
  assert.match(source, /fetch\(['"]\/['"],\s*\{[\s\S]*method:\s*['"]POST['"]/);
  assert.match(source, /aria-live="polite"/);
});

test('the episode play marker is an SVG rather than a text glyph', () => {
  const source = components();
  assert.match(source, /function TrackPlayIcon/);
  assert.doesNotMatch(source, />▶<\/span>/);
});

test('the latest ink wordmark generates the handwritten header name', () => {
  const source = cutoutScript();
  assert.match(source, /selected_piece\("VJM_encre\.jpg",\s*"nom-manuscrit"/);
  assert.match(source, /\(40,\s*60,\s*2370,\s*540\)/);
  assert.doesNotMatch(source, /selected_signature\("VJM_MAJ\.jpg",\s*"nom-manuscrit"/);
  assert.doesNotMatch(source, /selected_signature\("Nom_Maj_remplacer le M de Miyazaki\.jpeg",\s*"nom-manuscrit"/);
  assert.doesNotMatch(source, /whole\(SIGLES \/ "VJM_3\.jpeg", OUT \/ "nom-manuscrit\.png"\)/);
});

test('the generated brand asset set is complete', () => {
  for (const path of [
    'assets/brand/nav-eye-left.png',
    'assets/brand/nav-eye-right.png',
    'assets/brand/nav-home.png',
    'assets/brand/nav-moon.png',
    'assets/brand/nav-sun.png',
    'assets/brand/nav-mountains.png',
    'assets/brand/info-album-1.png',
    'assets/brand/info-album-2.png',
    'assets/brand/info-album-3.png',
    'assets/brand/favicon.svg',
    'assets/brand/favicon-32.png',
    'assets/brand/favicon-16.png',
    'assets/brand/apple-touch-icon.png',
  ]) {
    assert.equal(existsSync(new URL(path, root)), true, `${path} should exist`);
  }
});

test('the supplied vector sigles replace raster UI marks and remain individually available', () => {
  const ui = app();
  const shared = components();
  assert.doesNotMatch(ui, /(?:sigle-camera|sigle-spirale|nav-eye-(?:left|right)|info-album-)\S*\.png/);
  assert.doesNotMatch(shared, /nav-(?:home|moon|sun|star|mountains)\.png/);
  assert.match(ui, /sigle-camera-1\.svg/);
  assert.match(ui, /sigle-spirale-1\.svg/);
  assert.match(ui, /nav-eye-left\.svg/);
  assert.match(ui, /info-album-\$\{Math\.min\(index \+ 1, 3\)\}\.svg/);

  for (const path of [
    'nav-star.svg', 'nav-home.svg', 'nav-moon.svg', 'nav-mountains.svg', 'nav-sun.svg',
    'sigle-camera-1.svg', 'sigle-camera-2.svg',
    'sigle-vague-1.svg', 'sigle-vague-2.svg',
    ...Array.from({ length: 5 }, (_, i) => `sigle-spirale-${i + 1}.svg`),
    ...Array.from({ length: 5 }, (_, i) => `sigle-etoile-${i + 1}.svg`),
    ...Array.from({ length: 5 }, (_, i) => `info-album-${i + 1}.svg`),
    'nav-eye-left.svg', 'nav-eye-middle.svg', 'nav-eye-right.svg',
  ]) {
    assert.equal(existsSync(new URL(`assets/brand/${path}`, root)), true, `${path} should exist`);
  }
});

test('the three lighter header drawings are emboldened without thickening the moon', () => {
  const source = read('tools/import-vector-sigles.py');
  assert.match(source, /"nav-home\.svg":\s*\([^\n]*stroke_width/);
  assert.match(source, /"nav-star\.svg":\s*\([^\n]*stroke_width/);
  assert.match(source, /"nav-mountains\.svg":\s*\([^\n]*stroke_width/);
  assert.doesNotMatch(source, /"nav-moon\.svg":\s*\([^\n]*stroke_width/);
});

test('the production build keeps SRI for the pinned React bundles', () => {
  const source = buildScript();
  assert.match(source, /const REACT_PROD_SRI = "sha384-[^"]+"/);
  assert.match(source, /const REACT_DOM_PROD_SRI = "sha384-[^"]+"/);
  assert.doesNotMatch(source, /replace\(\/integrity=/);
});

test('the production build creates bounded web audio without changing canonical masters', () => {
  assert.equal(
    packageManifest().scripts.build,
    'python tools/import-vector-sigles.py && node precompile.mjs --prod && python tools/optimize-dist.py',
  );
  const source = optimizeDistScript();
  assert.match(source, /AUDIO_BITRATE\s*=\s*"48k"/);
  assert.match(source, /DIST\s*=\s*ROOT\s*\/\s*"dist"/);
  assert.match(source, /duration_delta/);
  assert.match(source, /os\.replace\(/);
});

test('Netlify packages are immutable numbered release candidates', () => {
  const source = packageNetlifyScript();
  assert.match(source, /waniushka-netlify-rc\{rc\}\.zip/);
  assert.match(source, /ZipFile\(OUT,\s*"x"/);
  assert.match(source, /max\(existing,\s*default=0\)\s*\+\s*1/);
});
