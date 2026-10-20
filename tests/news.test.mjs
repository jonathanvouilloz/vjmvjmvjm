// Fenêtre de dates des news (src/lib/news.ts), même sémantique que l'ancien activeNews.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const src = stripTypeScriptTypes(readFileSync(new URL('../src/lib/news.ts', import.meta.url), 'utf8'));
const { inWindow, utcDay } = await import('data:text/javascript,' + encodeURIComponent(src));

test('bornes debut et fin incluses', () => {
  const n = { debut: '2026-05-01', fin: '2026-05-10' };
  assert.equal(inWindow(n, '2026-04-30'), false);
  assert.equal(inWindow(n, '2026-05-01'), true);
  assert.equal(inWindow(n, '2026-05-10'), true);
  assert.equal(inWindow(n, '2026-05-11'), false);
});

test('bornes absentes = ouvert de ce côté', () => {
  assert.equal(inWindow({}, '2026-05-01'), true);
  assert.equal(inWindow({ debut: '2026-05-01' }, '2030-01-01'), true);
  assert.equal(inWindow({ fin: '2026-05-01' }, '2020-01-01'), true);
  assert.equal(inWindow({ fin: '2026-05-01' }, '2026-05-02'), false);
});

test('jour UTC', () => {
  assert.equal(utcDay(new Date('2026-05-01T23:30:00-05:00')), '2026-05-02');
});
