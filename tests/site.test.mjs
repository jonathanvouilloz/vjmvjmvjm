import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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
const content = (path) => JSON.parse(read(`content/${path}`));

test('the public contact data uses the confirmed address and a bare IBAN', () => {
  const site = content('site.json');
  assert.equal(site.email, 'vania@vjmvjmvjm.com');
  assert.match(site.iban, /^CH\d{2}/);
  assert.doesNotMatch(app(), /Pour faire des cadeaux/);
  assert.match(app(), /\{BIO\.iban\}/);
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

test('Coin lecture shows a collage of texts that open full-frame', () => {
  const source = app();
  assert.match(source, /lecture:\s*\{[^}]*sigle-etoile-1\.svg[^}]*sigle-etoile-2\.svg/s);
  assert.match(source, /\{ id: 'lecture', label: 'Coin lecture' \}/);
  assert.match(source, /function ReadingPage\(\{ onBack, onOpenText \}\)/);
  // la flèche seule vers le menu, la flèche + libellé vers le coin lecture
  assert.match(source, /function ReadingPage[\s\S]*?<BackLink onClick=\{onBack\} \/>/);
  assert.match(source, /<BackLink label="retour au coin lecture"/);
  assert.match(source, /case 'texte':/);
  assert.match(source, /id=\{`note-\$\{i \+ 1\}`\}/);
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
    'public/assets/brand/nav-eye-left.png',
    'public/assets/brand/nav-eye-right.png',
    'public/assets/brand/nav-home.png',
    'public/assets/brand/nav-moon.png',
    'public/assets/brand/nav-sun.png',
    'public/assets/brand/nav-mountains.png',
    'public/assets/brand/info-album-1.png',
    'public/assets/brand/info-album-2.png',
    'public/assets/brand/info-album-3.png',
    'public/assets/brand/favicon.svg',
    'public/assets/brand/favicon-32.png',
    'public/assets/brand/favicon-16.png',
    'public/assets/brand/apple-touch-icon.png',
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
    assert.equal(existsSync(new URL(`public/assets/brand/${path}`, root)), true, `${path} should exist`);
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
    'python tools/import-vector-sigles.py && node tools/build-images.mjs && astro build && python tools/optimize-dist.py',
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

test('the build turns content/ into window.CONTENT with rendered Markdown and footnotes', async () => {
  const { loadContent, renderMarkdown } = await import('../tools/build-content.mjs');
  const data = loadContent(new URL('../content', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
  assert.ok(data.kinematik.length >= 12);
  assert.ok(data.lecture.some((t) => t.id === 'ma-mere'));
  const text = data.lecture.find((t) => t.id === 'ma-mere');
  assert.match(text.corpsHtml, /<p>/);
  assert.match(text.corpsHtml, /<figure><img src="assets\/home\/024-oiseau-de-feu\.jpg" alt="Oiseau de feu" loading="lazy">/);
  assert.match(text.corpsHtml, /<a href="#note-1" id="ref-1"/);
  assert.match(text.notes[0].html, /Volodia/);
  assert.match(renderMarkdown('[x](https://a.ch)'), /target="_blank" rel="noopener noreferrer"/);
  assert.match(renderMarkdown('« oui » ?'), /« oui » \?/);
  assert.match(buildScript(), /window\.CONTENT = /);
  assert.match(buildScript(), /copyDir\("admin"/);
});

test('components read editable data and render shared content blocks', () => {
  const shared = components();
  assert.match(shared, /const CONTENT = window\.CONTENT;/);
  assert.match(shared, /function Blocks\(\{ blocks/);
  for (const type of ['text', 'image', 'video', 'audio', 'lien']) {
    assert.match(shared, new RegExp(`case '${type}':`));
  }
  assert.doesNotMatch(shared, /PLACEHOLDER_IMAGES|FRAGMENTS_TEXT|function RichText/);
  assert.match(shared, /function SketchFrame/);
  assert.match(shared, /ReactDOM\.createPortal\(/);
});

test('the CMS schema covers every content file', () => {
  const config = read('public/admin/config.yml');
  for (const file of ['site.json', 'news.json', 'bio.json', 'kinematik.json', 'albums.json']) {
    assert.match(config, new RegExp(`file: content/${file.replace('.', '\.')}`));
  }
  assert.match(config, /folder: content\/lecture/);
  assert.match(config, /name: github/);
  assert.match(read('public/admin/index.html'), /@sveltia\/cms/);
});

test('the star opens the singular Aléa du jour', () => {
  assert.match(app(), /title="Aléa du jour"/);
  assert.doesNotMatch(app(), /Aléas du jour/);
});

test('menu titles use the configurable Open Sans face', () => {
  assert.match(html(), /family=Open\+Sans:/);
  assert.match(html(), /--font-menu: 'Open Sans'/);
  assert.match(app(), /fontFamily: 'var\(--font-menu\)'/);
  assert.equal(content('site.json').policeMenu, 'Open Sans');
  assert.match(buildScript(), /policeMenu/);
});

test('the menu page carries the cursor dot field, off for touch and reduced motion', () => {
  const source = app();
  assert.match(source, /function DotField\(\)/);
  assert.match(source, /<DotField \/>/);
  assert.match(source, /\(pointer: coarse\)/);
  assert.match(source, /cancelAnimationFrame\(raf\)/);
});

test('the bio swaps texts, switches FR/EN and hides the eye on demand', () => {
  const source = app();
  const bio = content('bio.json');
  assert.match(bio.fr.pro[0].md, /^Vania Jaikin Miyazaki est réalisatrice/);
  assert.match(bio.fr.perso[0].md, /^La vérité c’est que VJM/);
  assert.ok(bio.en.pro.length && bio.en.perso.length);
  assert.match(source, /function LangSwitch/);
  assert.match(source, /nav-eye-middle\.svg/);
  assert.match(source, /BIO\.bioOeilVisible &&/);
  assert.doesNotMatch(source, /biofilmo/);
});

test('news only shows when active and within its dates', () => {
  const shared = components();
  assert.match(shared, /function activeNews/);
  assert.match(shared, /n\.actif && \(!n\.debut \|\| n\.debut <= d\) && \(!n\.fin \|\| d <= n\.fin\)/);
  assert.match(app(), /function NewsTag/);
  assert.equal(content('news.json').news.every((n) => typeof n.actif === 'boolean'), true);
});

test('Kinematik tiles carry an exceptional mention and the lightbox a synopsis toggle', () => {
  assert.match(app(), /v\.mention &&/);
  assert.match(components(), /aria-label=\{infoOpen \? 'Masquer le résumé' : 'Résumé et générique'\}/);
  const film = content('kinematik.json').films[0];
  assert.ok('mention' in film && 'resume' in film && 'generique' in film);
});

test('the static page is findable by name', () => {
  const source = html();
  assert.match(source, /"@type": "Person"/);
  assert.match(source, /"name": "Vania Jaikin Miyazaki"/);
  assert.match(source, /<h1>Vania Jaikin Miyazaki<\/h1>/);
  assert.match(read('public/robots.txt'), /Sitemap: https:\/\/vjmvjmvjm\.com\/sitemap-index\.xml/);
});

test('rich text turns a lone video URL into a player and a lone image into a figure', async () => {
  const { renderMarkdown, videoEmbed } = await import('../tools/build-content.mjs');
  assert.equal(videoEmbed('https://vimeo.com/298725112/5a560bc308'), 'https://player.vimeo.com/video/298725112?h=5a560bc308');
  assert.equal(videoEmbed('https://youtu.be/abc123'), 'https://www.youtube-nocookie.com/embed/abc123');
  assert.equal(videoEmbed('https://example.com/x'), null);
  const out = renderMarkdown('Avant\n\nhttps://www.youtube.com/watch?v=abc123&t=3\n\n![Oiseau](a.jpg "Légende")');
  assert.match(out, /<figure class="vjm-video"><iframe src="https:\/\/www\.youtube-nocookie\.com\/embed\/abc123"/);
  assert.match(out, /<figure><img src="a\.jpg" alt="Oiseau" loading="lazy"><figcaption>Légende<\/figcaption><\/figure>/);
  // un lien dans une phrase reste un lien
  assert.match(renderMarkdown('Voir https://vimeo.com/1 ici'), /<a href="https:\/\/vimeo\.com\/1"/);
});

test('playlist URLs become embedded players when the platform allows it', async () => {
  const { playlistEmbed } = await import('../tools/build-content.mjs');
  const e = (plateforme, url) => playlistEmbed({ plateforme, url })?.embed ?? null;
  assert.equal(e('spotify', 'https://open.spotify.com/show/4qmj0UuzPkLPpDFqxgd2MY'),
    'https://open.spotify.com/embed/show/4qmj0UuzPkLPpDFqxgd2MY?utm_source=generator&theme=0');
  assert.equal(e('spotify', 'https://open.spotify.com/embed/playlist/abc'),
    'https://open.spotify.com/embed/playlist/abc?utm_source=generator&theme=0');
  assert.equal(e('apple-music', 'https://music.apple.com/fr/playlist/x/pl.123'), 'https://embed.music.apple.com/fr/playlist/x/pl.123');
  assert.equal(e('apple-podcasts', 'https://podcasts.apple.com/fr/podcast/x/id1'), 'https://embed.podcasts.apple.com/fr/podcast/x/id1');
  assert.equal(e('deezer', 'https://www.deezer.com/fr/playlist/908622995'), 'https://widget.deezer.com/widget/auto/playlist/908622995');
  assert.equal(e('youtube', 'https://www.youtube.com/playlist?list=PLx'), 'https://www.youtube-nocookie.com/embed/videoseries?list=PLx');
  assert.match(e('soundcloud', 'https://soundcloud.com/a/sets/b'), /^https:\/\/w\.soundcloud\.com\/player\/\?url=https%3A%2F%2Fsoundcloud\.com%2Fa%2Fsets%2Fb/);
  assert.equal(e('bandcamp', 'https://x.bandcamp.com/album/y'), null);
  assert.equal(e('spotify', 'pas une url'), null);
});

test('albums carry a short summary, playlists and a rich page text', async () => {
  const { loadContent } = await import('../tools/build-content.mjs');
  const data = loadContent(new URL('../content', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
  for (const album of data.albums) {
    assert.ok(!('infos' in album) && !('spotify' in album), `${album.id} garde l'ancien schéma`);
    assert.ok((album.resume || '').length <= 300, `${album.id} : résumé trop long`);
    assert.ok(Array.isArray(album.playlists));
  }
  const coquillages = data.albums.find((a) => a.id === 'coquillages');
  assert.equal(coquillages.playlists[0].plateforme, 'spotify');
  assert.match(coquillages.playlists[0].embed, /open\.spotify\.com\/embed\/show\//);
  assert.match(app(), /function Playlists\(/);
  assert.match(app(), /a\.resume && <button/);
  assert.match(app(), /\{infoAlbumObj\.resume\}/);
});

test('the CMS schema bounds short texts and offers title, excerpt or image vignettes', () => {
  const config = read('public/admin/config.yml');
  for (const name of ['resume', 'extrait', 'information']) {
    assert.match(config, new RegExp(`name: ${name},.*maxlength: 300`), `${name} limité à 300`);
  }
  assert.match(config, /name: corps\s+label: Texte\s+widget: markdown/);
  assert.match(config, /name: contenu\s+label: "Texte de la page"\s+widget: markdown/);
  assert.match(config, /name: playlists[\s\S]*name: plateforme[\s\S]*name: langue[\s\S]*name: url/);
  assert.match(config, /label: "Une image", value: image/);
  assert.match(app(), /v\.type === 'image' && v\.image/);
  const text = content('lecture/ma-mere.json');
  assert.ok(!('blocks' in text) && typeof text.corps === 'string');
});

test('every image list of the site is editable in the CMS', () => {
  const config = read('public/admin/config.yml');
  for (const file of ['carnets', 'accueil', 'aleas']) {
    assert.ok(config.includes(`file: content/${file}.json`), `${file} absent du CMS`);
  }
  assert.match(config, /name: portraits[\s\S]*widget: image/);
  assert.match(config, /name: vignette, label: "Image de la vignette", widget: image/);
  assert.match(config, /name: description, label:/);
  assert.equal(content('carnets.json').carnets.length, 53);
  assert.equal(content('accueil.json').photos.length, 64);
  assert.equal(content('aleas.json').aleas.length, 24);
  assert.equal(content('bio.json').portraits.length, 15);
  assert.ok(content('kinematik.json').films.every((f) => f.vignette));
  assert.ok(!existsSync(new URL('design-extract/site-minimalist-portoflio/project/waniushka-assets.jsx', root)));
});

test('build-images sizes uploads, makes thumbnails and skips missing files', async () => {
  const { createImageBuilder } = await import('../tools/build-images.mjs');
  const sharp = (await import('sharp')).default;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vjm-img-'));
  fs.mkdirSync(path.join(tmp, 'assets/uploads'), { recursive: true });
  await sharp({ create: { width: 4000, height: 3000, channels: 3, background: '#888' } })
    .jpeg().toFile(path.join(tmp, 'assets/uploads/photo.jpg'));
  const b = createImageBuilder({ root: tmp });
  const img = await b.image('/assets/uploads/photo.jpg', { max: 1280, thumb: true });
  assert.deepEqual([img.w, img.h], [1280, 960]);
  assert.match(img.src, /^assets\/_gen\/photo-[0-9a-f]{12}\.jpg$/);
  assert.match(img.thumb, /^assets\/_gen\/photo-[0-9a-f]{12}-t\.jpg$/);
  // le manifeste lu par le site est indexé par le chemin du CMS, sans « / » initial
  assert.deepEqual(b.manifest['assets/uploads/photo.jpg'], img);
  const thumb = await sharp(path.join(tmp, img.thumb)).metadata();
  assert.equal(Math.max(thumb.width, thumb.height), 700);
  assert.equal(await b.image('assets/uploads/absente.jpg'), null);
  // un TIFF, même petit, est converti ; un fichier illisible est ignoré sans casser le build
  await sharp({ create: { width: 300, height: 200, channels: 3, background: '#333' } })
    .tiff().toFile(path.join(tmp, 'assets/uploads/scan.tif'));
  assert.match((await b.image('assets/uploads/scan.tif')).src, /^assets\/_gen\/scan-[0-9a-f]{12}\.jpg$/);
  fs.writeFileSync(path.join(tmp, 'assets/uploads/casse.jpg'), 'pas une image');
  assert.equal(await b.image('assets/uploads/casse.jpg'), null);
  assert.match(b.warnings[0], /absente\.jpg/);
  assert.match(b.warnings[1], /illisible.*casse\.jpg/);
  fs.writeFileSync(path.join(tmp, 'assets/_gen/orpheline.jpg'), '');
  b.prune();
  assert.equal(fs.readdirSync(path.join(tmp, 'assets/_gen')).length, 3);

  // images collées dans les textes : réduites elles aussi, chemins réécrits, quel que soit
  // le dossier de assets/ où le CMS les a déposées
  const { resolveImages } = await import('../tools/build-images.mjs');
  fs.mkdirSync(path.join(tmp, 'assets/carnets'), { recursive: true });
  fs.copyFileSync(path.join(tmp, 'assets/uploads/photo.jpg'), path.join(tmp, 'assets/carnets/vue.jpg'));
  const data = {
    carnets: [], accueil: [], portraits: [], aleas: [], kinematik: [], lecture: [], news: [],
    bio: { fr: { pro: [{ type: 'image', src: 'assets/uploads/photo.jpg' }] } },
    albums: [{ contenuHtml: '<figure><img src="assets/carnets/vue.jpg" alt=""></figure>' }],
  };
  await resolveImages(data, { root: tmp });
  assert.match(data.bio.fr.pro[0].src, /^assets\/_gen\/photo-[0-9a-f]{12}\.jpg$/);
  assert.match(data.albums[0].contenuHtml, /src="assets\/_gen\/vue-[0-9a-f]{12}\.jpg"/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('Kinematik tiles show an optional information behind a small i', () => {
  const source = app();
  assert.match(source, /\{v\.information && \(\s*<button/);
  assert.match(source, /e\.stopPropagation\(\); setInfoPinned/);
  assert.match(source, /e\.pointerType === 'mouse'/);
  assert.ok(content('kinematik.json').films.every((f) => typeof f.information === 'string'));
});

test('footnotes are set a step smaller than the text', () => {
  assert.match(html(), /\.vjm-notes \{[^}]*font-size: 0\.72em/);
  assert.match(html(), /\.fn-ref \{ font-size: 0\.6em/);
});

// Sitemap et canoniques doivent écrire chaque URL pareil (sans barre finale), sinon Google en voit deux.
test('every sitemap URL equals the canonical of its built page', { skip: !existsSync(new URL('dist/sitemap-0.xml', root)) }, () => {
  const locs = [...read('dist/sitemap-0.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length > 0);
  for (const loc of locs) {
    const { pathname } = new URL(loc);
    const page = read(`dist/${pathname === '/' ? 'index' : pathname.slice(1)}.html`);
    assert.equal(page.match(/rel="canonical" href="([^"]+)"/)?.[1], loc);
  }
});
