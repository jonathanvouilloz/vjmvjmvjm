import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const cutoutScript = () => read('tools/cutout-drawing.py');
const packageManifest = () => JSON.parse(read('package.json'));
const optimizeDistScript = () => read('tools/optimize-dist.py');
// package.json est en commonjs : on retire les types de content.ts à la volée (Node ≥ 22.13) et on l'importe en module.
const importContent = async () => {
  const code = stripTypeScriptTypes(read('src/lib/content.ts'), { mode: 'strip' })
    .replace('"marked"', JSON.stringify(import.meta.resolve('marked')));
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
};
const content = (p) => JSON.parse(read(`content/${p}`));

// Les tests sur dist/ lisent le site construit : `npm run build` d'abord. Sans dist/, ils sont
// ignorés avec ce message, pour que `npm test` reste utilisable sur un clone neuf.
const hasDist = existsSync(new URL('dist/index.html', root));
const onDist = { skip: hasDist ? false : 'dist/ absent : lancer `npm run build` pour exécuter ce test' };
const dist = (p) => read(`dist/${p}`);
const sitemapPaths = () => [...dist('sitemap-0.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
// Toutes les pages construites (les pages de lightbox des carnets ne sont pas dans le sitemap).
const builtPaths = () => readdirSync(new URL('dist/', root), { recursive: true })
  .filter((f) => f.endsWith('.html') && !f.startsWith('admin'))
  .map((f) => '/' + f.replaceAll(path.sep, '/').replace(/\.html$/, '').replace(/^index$/, ''));
// `/lecture/ma-mere` → dist/lecture/ma-mere.html ; `/` → dist/index.html
const pageFile = (pathname) => (pathname === '/' ? 'index.html' : `${pathname.slice(1).replace(/\/$/, '')}.html`);

test('the public contact data uses the confirmed address and a bare IBAN', () => {
  const site = content('site.json');
  assert.equal(site.email, 'vania@vjmvjmvjm.com');
  assert.match(site.iban, /^CH\d{2}/);
});

test('the dist contact page prints the IBAN', onDist, () => {
  assert.ok(dist('contact.html').includes(content('site.json').iban));
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

test('the three lighter header drawings are emboldened without thickening the moon', () => {
  const source = read('tools/import-vector-sigles.py');
  assert.match(source, /"nav-home\.svg":\s*\([^\n]*stroke_width/);
  assert.match(source, /"nav-star\.svg":\s*\([^\n]*stroke_width/);
  assert.match(source, /"nav-mountains\.svg":\s*\([^\n]*stroke_width/);
  assert.doesNotMatch(source, /"nav-moon\.svg":\s*\([^\n]*stroke_width/);
});

test('the latest ink wordmark generates the handwritten header name', () => {
  const source = cutoutScript();
  assert.match(source, /selected_piece\("VJM_encre\.jpg",\s*"nom-manuscrit"/);
  assert.match(source, /\(40,\s*60,\s*2370,\s*540\)/);
  assert.doesNotMatch(source, /selected_signature\("VJM_MAJ\.jpg",\s*"nom-manuscrit"/);
  assert.doesNotMatch(source, /selected_signature\("Nom_Maj_remplacer le M de Miyazaki\.jpeg",\s*"nom-manuscrit"/);
  assert.doesNotMatch(source, /whole\(SIGLES \/ "VJM_3\.jpeg", OUT \/ "nom-manuscrit\.png"\)/);
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

test('albums carry a short summary, playlists and a rich page text', async () => {
  const { playlistEmbed } = await importContent();
  const data = { albums: content('albums.json').albums };
  for (const album of data.albums) {
    assert.ok(!('infos' in album) && !('spotify' in album), `${album.id} garde l'ancien schéma`);
    assert.ok((album.resume || '').length <= 300, `${album.id} : résumé trop long`);
    assert.ok(Array.isArray(album.playlists));
  }
  const coquillages = data.albums.find((a) => a.id === 'coquillages');
  assert.equal(coquillages.playlists[0].plateforme, 'spotify');
  assert.match(playlistEmbed(coquillages.playlists[0]).embed, /open\.spotify\.com\/embed\/show\//);
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

  // images collées dans les textes : réduites elles aussi et inscrites au manifeste, quel que soit
  // le dossier de assets/ où le CMS les a déposées
  const { resolveImages } = await import('../tools/build-images.mjs');
  fs.mkdirSync(path.join(tmp, 'assets/carnets'), { recursive: true });
  fs.copyFileSync(path.join(tmp, 'assets/uploads/photo.jpg'), path.join(tmp, 'assets/carnets/vue.jpg'));
  const data = {
    carnets: [], accueil: [], portraits: [], aleas: [], kinematik: [], lecture: [], news: [],
    bio: { fr: { pro: [{ type: 'image', src: 'assets/uploads/photo.jpg' }] } },
    albums: [{ contenuHtml: '<figure><img src="assets/carnets/vue.jpg" alt=""></figure>' }],
  };
  const { manifest } = await resolveImages(data, { root: tmp });
  assert.match(manifest['assets/uploads/photo.jpg'].src, /^assets\/_gen\/photo-[0-9a-f]{12}\.jpg$/);
  assert.match(manifest['assets/carnets/vue.jpg'].src, /^assets\/_gen\/vue-[0-9a-f]{12}\.jpg$/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('the supplied vector sigles remain individually available', () => {
  for (const name of [
    'nav-star.svg', 'nav-home.svg', 'nav-moon.svg', 'nav-mountains.svg', 'nav-sun.svg',
    'sigle-camera-1.svg', 'sigle-camera-2.svg',
    'sigle-vague-1.svg', 'sigle-vague-2.svg',
    ...Array.from({ length: 5 }, (_, i) => `sigle-spirale-${i + 1}.svg`),
    ...Array.from({ length: 5 }, (_, i) => `sigle-etoile-${i + 1}.svg`),
    ...Array.from({ length: 5 }, (_, i) => `info-album-${i + 1}.svg`),
    'nav-eye-left.svg', 'nav-eye-middle.svg', 'nav-eye-right.svg',
  ]) {
    assert.equal(existsSync(new URL(`public/assets/brand/${name}`, root)), true, `${name} should exist`);
  }
});

test('the menu page maps cameras, ear spirals, stars and eyes to the sections', onDist, () => {
  const menu = dist('menu.html');
  for (const sigle of ['sigle-camera-1', 'sigle-camera-2', 'sigle-spirale-1', 'sigle-spirale-2', 'sigle-etoile-1', 'sigle-etoile-2', 'nav-eye-left', 'nav-eye-right']) {
    assert.ok(menu.includes(`${sigle}.svg`), `${sigle}.svg absent de menu.html`);
  }
  assert.match(menu, /DotField/);
});

test('the production build creates bounded web audio without changing canonical masters', () => {
  const { build, test: testScript } = packageManifest().scripts;
  assert.equal(build, 'python tools/import-vector-sigles.py && node tools/build-images.mjs && astro build && python tools/optimize-dist.py');
  assert.match(testScript, /site\.test\.mjs/);
  const source = optimizeDistScript();
  assert.match(source, /AUDIO_BITRATE\s*=\s*"48k"/);
  assert.match(source, /DIST\s*=\s*ROOT\s*\/\s*"dist"/);
  assert.match(source, /AUDIO_DIR\s*=\s*DIST\s*\/\s*"assets"/);
  assert.match(source, /duration_delta/);
  assert.match(source, /os\.replace\(/);
});

test('rendered Markdown covers footnotes, outbound links, typography, video players and figures', async () => {
  const { renderMarkdown, videoEmbed } = await importContent();
  assert.match(renderMarkdown('[x](https://a.ch)'), /target="_blank" rel="noopener noreferrer"/);
  assert.match(renderMarkdown('« oui » ?'), /« oui » \?/);
  assert.match(renderMarkdown('Note[^1]'), /<a href="#note-1" id="ref-1"/);
  assert.equal(videoEmbed('https://vimeo.com/298725112/5a560bc308'), 'https://player.vimeo.com/video/298725112?h=5a560bc308');
  assert.equal(videoEmbed('https://youtu.be/abc123'), 'https://www.youtube-nocookie.com/embed/abc123');
  assert.equal(videoEmbed('https://example.com/x'), null);
  const out = renderMarkdown(['Avant', 'https://www.youtube.com/watch?v=abc123&t=3', '![Oiseau](a.jpg "Légende")'].join('\n\n'));
  assert.match(out, /<figure class="vjm-video"><iframe src="https:\/\/www\.youtube-nocookie\.com\/embed\/abc123"/);
  assert.match(out, /<figure><img src="a\.jpg" alt="Oiseau" loading="lazy"><figcaption>Légende<\/figcaption><\/figure>/);
  assert.match(renderMarkdown('![x](assets/home/a.jpg)'), /<img src="\/assets\/home\/a\.jpg"/);
  // un lien dans une phrase reste un lien
  assert.match(renderMarkdown('Voir https://vimeo.com/1 ici'), /<a href="https:\/\/vimeo\.com\/1"/);
});

test('playlist URLs become embedded players when the platform allows it', async () => {
  const { playlistEmbed } = await importContent();
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

test('the CMS schema bounds short texts and offers title, excerpt or image vignettes', () => {
  const config = read('public/admin/config.yml');
  for (const name of ['resume', 'extrait', 'information']) {
    assert.match(config, new RegExp(`name: ${name},.*maxlength: 300`), `${name} limité à 300`);
  }
  assert.match(config, /name: corps\s+label: Texte\s+widget: markdown/);
  assert.match(config, /name: contenu\s+label: "Texte de la page"\s+widget: markdown/);
  assert.match(config, /name: playlists[\s\S]*name: plateforme[\s\S]*name: langue[\s\S]*name: url/);
  assert.match(config, /label: "Une image", value: image/);
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
});

test('the bio carries both languages and the news have an on/off flag', () => {
  const bio = content('bio.json');
  assert.match(bio.fr.pro[0].md, /^Vania Jaikin Miyazaki est réalisatrice/);
  assert.match(bio.fr.perso[0].md, /^La vérité c’est que VJM/);
  assert.ok(bio.en.pro.length && bio.en.perso.length);
  assert.equal(content('news.json').news.every((n) => typeof n.actif === 'boolean'), true);
});

test('Kinematik films carry a mention, a synopsis and an information text', () => {
  const films = content('kinematik.json').films;
  assert.ok('mention' in films[0] && 'resume' in films[0] && 'generique' in films[0]);
  assert.ok(films.every((f) => typeof f.information === 'string'));
});

test('robots.txt points to the sitemap index', () => {
  assert.match(read('public/robots.txt'), /Sitemap: https:\/\/vjmvjmvjm\.com\/sitemap-index\.xml/);
});

// --- dist/ : le site construit ---

test('every sitemap URL has a built page whose canonical equals it', onDist, () => {
  const locs = [...dist('sitemap-0.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length > 20);
  for (const loc of locs) {
    const file = pageFile(new URL(loc).pathname);
    assert.ok(existsSync(new URL(`dist/${file}`, root)), `${file} manquant pour ${loc}`);
    assert.equal(dist(file).match(/rel="canonical" href="([^"]+)"/)?.[1], loc);
  }
});

test('every built page has a title, a description and valid JSON-LD', onDist, () => {
  for (const pathname of sitemapPaths()) {
    const page = dist(pageFile(pathname));
    assert.match(page, /<title>[^<]+<\/title>/, `${pathname} : title`);
    assert.match(page, /<meta name="description" content="[^"]+"/, `${pathname} : description`);
    const blocks = [...page.matchAll(/ld\+json">([^<]*)<\/script>/g)];
    assert.ok(blocks.length > 0, `${pathname} : JSON-LD absent`);
    for (const [, json] of blocks) assert.doesNotThrow(() => JSON.parse(json), `${pathname} : JSON-LD invalide`);
  }
});

test('the home page declares the Person and the favicons', onDist, () => {
  const page = dist('index.html');
  const person = JSON.parse(page.match(/ld\+json">([^<]*)<\/script>/)[1]);
  assert.equal(person['@type'], 'Person');
  assert.equal(person.name, 'Vania Jaikin Miyazaki');
  assert.match(page, /rel="icon"[^>]*href="\/assets\/brand\/favicon\.svg"/);
  assert.match(page, /rel="apple-touch-icon"[^>]*href="\/assets\/brand\/apple-touch-icon\.png"/);
});

test('no built page links to a missing file', onDist, () => {
  const exists = (pathname) => [pathname, `${pathname}.html`, `${pathname}/index.html`]
    .some((p) => { const f = new URL(`dist${p}`, root); return existsSync(f) && fs.statSync(f).isFile(); });
  const site = 'https://vjmvjmvjm.com';
  const broken = [];
  for (const pathname of builtPaths()) {
    const page = dist(pageFile(pathname));
    for (const [, ref] of page.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
      if (/^(#|mailto:|tel:|data:|javascript:)/.test(ref)) continue;
      const url = new URL(ref, site + pathname);
      if (url.origin === site && !exists(decodeURIComponent(url.pathname))) broken.push(`${pathname} -> ${ref}`);
    }
  }
  assert.deepEqual(broken, []);
});

test('the contact page has the Netlify form with its fields and drawing export', onDist, () => {
  const page = dist('contact.html');
  assert.match(page, /<form[^>]*name="contact"[^>]*data-netlify="true"/);
  assert.match(page, /<input[^>]*name="form-name"[^>]*value="contact"/);
  for (const field of ['nom', 'email', 'message', 'dessin']) assert.match(page, new RegExp(`name="${field}"`), field);
  assert.match(page, /type="file"[^>]*name="dessin"/);
  const source = read('src/pages/contact.astro');
  assert.match(source, /toBlob\(/);
  assert.match(source, /new FormData\(/);
  assert.match(source, /MAX_EXPORT_PIXELS\s*=\s*2_000_000/);
});

test('a text page renders its body and footnotes, and the footnote style ships', onDist, () => {
  const page = dist('lecture/ma-mere.html');
  assert.match(page, /<figure><img src="\/?assets\/[^"]*oiseau-de-feu[^"]*" alt="Oiseau de feu" loading="lazy">/);
  assert.match(page, /<a href="#note-1" id="ref-1"/);
  assert.match(page, /id="note-1"/);
  assert.match(page, /Volodia/);
  const css = readdirSync(new URL('dist/_astro/', root)).filter((f) => f.endsWith('.css')).map((f) => dist(`_astro/${f}`)).join('');
  assert.match(css, /\.vjm-notes\{[^}]*font-size:\.72em/);
});

test('a built Kinematik page declares a VideoObject with duration and a full uploadDate', onDist, () => {
  const ld = JSON.parse(dist('kinematik/k1.html').match(/ld\+json">([^<]*)<\/script>/)[1]);
  assert.equal(ld['@type'], 'VideoObject');
  assert.match(ld.duration, /^PT(\d+H)?\d+M\d+S$/);
  assert.match(ld.uploadDate, /^\d{4}-\d{2}-\d{2}$/);
});

test('a lightbox page ships the close script', onDist, () => {
  const src = dist('kinematik/k1.html').match(/src="(\/_astro\/Lightbox[^"]+\.js)"/)?.[1];
  assert.ok(src, 'script Lightbox absent de la page');
  assert.match(read(`dist${src}`), /history\.back\(\)/);
});

// Lightbox : la fermeture lit `history.state.index`, posé par le ClientRouter d'Astro (interne,
// non documenté). Si une montée de version le renomme, ce test casse au lieu de la fermeture en silence.
test('the Astro router still keeps its history index in history.state', () => {
  assert.match(read('node_modules/astro/dist/transitions/router.js'), /index: currentHistoryIndex/);
});

test('Markdown images are swapped for their resized manifest variant', async () => {
  const { swapImageSrcs } = await importContent();
  // le manifeste réel n'a (encore) que des entrées identité : on en fixe une réduite
  const manifest = { 'assets/uploads/big.jpg': { src: 'assets/_gen/big-0123456789ab.jpg' } };
  const out = swapImageSrcs('<p><img src="/assets/uploads/big.jpg" alt=""><img src="/assets/inconnue.jpg" alt=""></p>', (p) => manifest[p.replace(/^\//, '')]?.src);
  assert.ok(out.includes('<img src="/assets/_gen/big-0123456789ab.jpg"'), 'variante absente');
  assert.ok(out.includes('<img src="/assets/inconnue.jpg"'), 'image hors manifeste conservée');
});
