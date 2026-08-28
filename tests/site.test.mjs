import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const app = () => read('design-extract/site-minimalist-portoflio/project/waniushka-app.jsx');
const components = () => read('design-extract/site-minimalist-portoflio/project/waniushka-components.jsx');
const html = () => read('design-extract/site-minimalist-portoflio/project/Waniushka%20Portfolio.html');

test('the public contact data uses the confirmed address and gift wording', () => {
  assert.match(components(), /email:\s*'hello@vjmvjmvjm\.com'/);
  assert.match(app(), /Pour faire des cadeaux, voici mon IBAN\s*:/);
});

test('the menu maps eyes, cameras and stars to the confirmed sections', () => {
  const source = app();
  assert.match(source, /kinematik:\s*\{[^}]*nav-eye-left\.png[^}]*nav-eye-right\.png/s);
  assert.match(source, /films:\s*\{[^}]*sigle-camera-1\.png[^}]*sigle-camera-2\.png/s);
  assert.match(source, /carnets:\s*\{[^}]*sigle-etoile-1\.png[^}]*sigle-etoile-2\.png/s);
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
