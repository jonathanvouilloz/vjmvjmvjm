/* Poussière attirée par la souris, reprise de l'effet d'iirrm.ch (2026-10-25) : 5000 points
   d'un pixel, chacun tiré vers la dernière position du curseur avec une force en 1/distance,
   freiné à chaque image et ramené par le bord opposé s'il sort. Rien ne s'arrête : les points
   tournent et filent autour du curseur, et décrochent s'il va trop vite.
   Vit dans la section qui le contient (le haut du menu) et défile avec elle ; le curseur n'est
   suivi que dedans, et l'attraction cesse dès qu'on défile vers la suite. Mouvement réduit : semis immobile. Pause onglet caché ou section hors écran.
   Le cleanup de l'effet retire RAF et écouteurs : l'île peut être démontée puis remontée. */
import { useEffect, useRef } from 'react';

const COUNT = 5000;     // nombre de points
const GRAVITY = 20;     // force d'attraction : GRAVITY / distance
const FRICTION = 0.96;  // vitesse gardée d'une image à l'autre

export default function DotField() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const p = [];
    const m = { x: 0, y: 0 };
    let w = 0, h = 0, img, d, raf = 0, visible = true;
    let rgb = [26, 26, 26];

    // couleur de l'encre du thème, normalisée en #rrggbb par le canvas
    const readInk = () => {
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--fg').trim() || '#1A1A1A';
      const hex = ctx.fillStyle;
      if (hex[0] === '#') rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    };
    const plot = (n, on) => {
      if (n.x < 0 || n.x >= w || n.y < 0 || n.y >= h) return;
      const k = ((n.y | 0) * w + (n.x | 0)) * 4;
      if (on) { d[k] = rgb[0]; d[k + 1] = rgb[1]; d[k + 2] = rgb[2]; d[k + 3] = 255; } else d[k + 3] = 0;
    };
    const paint = () => { for (const n of p) plot(n, true); ctx.putImageData(img, 0, 0); };

    const resize = () => {
      w = canvas.width = canvas.clientWidth;
      h = canvas.height = canvas.clientHeight;
      img = ctx.createImageData(w, h); d = img.data;
      m.x = w / 2 | 0; m.y = h / 2 | 0;
    };

    const loop = () => {
      // dès qu'on défile vers la suite, plus d'attraction : les points filent sur leur élan
      const pull = canvas.getBoundingClientRect().top > -h * 0.05 ? GRAVITY : 0;
      for (const n of p) plot(n, false);
      for (const n of p) {
        const x = m.x - n.x, y = m.y - n.y;
        const a = Math.atan2(y, x);
        const o = pull / (Math.sqrt(x * x + y * y) + 0.01);
        n.a += Math.cos(a) * o; n.b += Math.sin(a) * o;
        n.x += n.a; n.y += n.b;
        n.x += n.x >= w ? -w : n.x < 0 ? w : 0;
        n.y += n.y >= h ? -h : n.y < 0 ? h : 0;
        n.a *= FRICTION; n.b *= FRICTION;
      }
      paint();
      raf = requestAnimationFrame(loop);
    };
    const start = () => { cancelAnimationFrame(raf); if (!still && visible && !document.hidden) raf = requestAnimationFrame(loop); };

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (x >= 0 && x < r.width && y >= 0 && y < r.height) { m.x = x; m.y = y; }
    };
    const onVisibility = () => start();

    readInk(); resize();
    for (let i = 0; i < COUNT; i++) p.push({ x: Math.random() * w, y: Math.random() * h, a: Math.random(), b: Math.random() });
    paint();

    // le thème change la couleur de l'encre
    const mo = new MutationObserver(() => { readInk(); paint(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const ro = new ResizeObserver(() => { resize(); paint(); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); });
    io.observe(canvas);
    window.addEventListener('pointermove', onMove);
    document.addEventListener('visibilitychange', onVisibility);
    start();
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect(); ro.disconnect(); io.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  return <canvas ref={ref} aria-hidden="true" style={{
    position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: -1,
  }} />;
}
