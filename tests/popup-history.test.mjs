// Machine à états de src/lib/popup-history.ts, sur un faux historique.
// Les types du .ts sont retirés par node:module (Node 23.2+) puis le module est importé tel quel ; lancer : node --test tests/popup-history.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const entries = [{ state: { index: 0 }, href: 'http://x/a' }];
let at = 0;
const swapListeners = [];
const g = globalThis;
g.window = {};
g.location = { get href() { return entries[at].href; } };
g.document = { addEventListener: (t, f) => t === 'astro:before-swap' && swapListeners.push(f) };
// popstate fictif : renvoie vrai si la pop-up l'a avalé (le routeur ne le verrait pas)
const pop = () => {
  let stopped = false;
  g.window.__vjmPopstate({ state: entries[at].state, stopImmediatePropagation: () => { stopped = true; } });
  return stopped;
};
let backs = 0;
g.history = {
  get state() { return entries[at].state; },
  pushState(state, _t, url) { entries.splice(at + 1); entries.push({ state, href: url ?? entries[at].href }); at++; },
  back() { backs++; at--; pop(); },
  forward() { at++; return pop(); },
};
const { openEntry, requestClose, isOpen } = await import('data:text/javascript,' + encodeURIComponent(stripTypeScriptTypes(readFileSync(new URL('../src/lib/popup-history.ts', import.meta.url), 'utf8'))));
const navigate = (href) => { // le routeur pousse une entrée puis lance astro:before-swap
  history.pushState({ index: at + 1 }, '', href);
  swapListeners.forEach((f) => f());
};

test('open then back closes the pop-up and swallows popstate', () => {
  let closed = 0;
  openEntry(() => closed++);
  assert.equal(isOpen(), true);
  assert.equal(history.state.vjmPopup, true);
  assert.equal(entries.length, 2);
  backs = 0;
  requestClose();
  assert.equal(closed, 1);
  assert.equal(isOpen(), false);
  assert.equal(backs, 1);
});

test('a close button click plus a stray click does a single history.back()', () => {
  openEntry(() => {});
  backs = 0;
  requestClose(); requestClose();
  assert.equal(backs, 1);
});

test('forward onto the orphan entry bounces back without reaching the router', () => {
  assert.equal(at, 0);
  backs = 0;
  history.forward();
  assert.equal(at, 0); // revenu sur l'entrée de la page
  assert.equal(backs, 1);
  assert.equal(isOpen(), false);
});

test('navigation while open resets: the next back belongs to the router', () => {
  let closed = 0;
  openEntry(() => closed++);
  navigate('http://x/b');
  assert.equal(closed, 1);
  assert.equal(isOpen(), false);
  history.back(); // vers l'entrée orpheline de /a
  assert.equal(entries[at].href, 'http://x/a');
  // pas d'avalement : le routeur doit voir ce popstate
  at = 2; assert.equal(pop(), false);
});

test('link flow: requestClose(then) runs then after closing', () => {
  at = 0; entries.length = 1;
  let ran = 0;
  openEntry(() => {});
  requestClose(() => ran++);
  assert.equal(ran, 1);
});
