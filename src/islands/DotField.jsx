/* Semis de points qui suivent la souris (version du 2026-10-20) : houle très lente au repos,
   suivi doux du curseur, pâle vers le centre pour ne pas gêner les titres. Coupé au tactile et
   en mouvement réduit (le semis reste, immobile) ; pause quand l'onglet est caché.
   Le cleanup de l'effet retire RAF et écouteurs : l'île peut être démontée puis remontée. */
import { useEffect, useRef } from 'react';
import { seededRandom } from '../lib/random';

export default function DotField() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || window.matchMedia('(pointer: coarse)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const RADIUS = 240;      // portée de l'attraction autour du curseur
    const SHIFT = 38;        // déplacement maximal d'un point vers le curseur, en px
    const SPRING = 0.035;    // raideur du retour vers la cible : plus bas = plus mou
    const DAMP = 0.82;       // amortissement : pas de rebond
    const WAVE_AMP = 2.6;    // amplitude de la houle au repos, en px
    const WAVE_SPEED = (Math.PI * 2) / 9000; // une vague toutes les ~9 s
    const LEVELS = [0.14, 0.32, 0.55, 0.78, 1]; // opacités, du centre vers les bords
    let dots = [];
    let w = 0, h = 0, raf = 0;
    const mouse = { x: -9999, y: -9999, active: false };
    /* Opacité d'un point selon sa position : ellipse calée sur le bloc des titres, pâle au
       centre, pleine encre à partir des bords du bloc. */
    const level = (x, y) => {
      const rx = Math.min(w * 0.36, 460), ry = Math.min(h * 0.34, 320);
      const d = Math.hypot((x - w / 2) / rx, (y - h / 2) / ry);
      const t = Math.min(1, Math.max(0, (d - 0.45) / 0.85));
      return Math.min(LEVELS.length - 1, Math.floor(t * t * (3 - 2 * t) * LEVELS.length));
    };
    const colors = () => {
      const cs = getComputedStyle(document.documentElement);
      return [cs.getPropertyValue('--fg').trim() || '#1A1A1A', cs.getPropertyValue('--fg-muted').trim() || '#8A8A8A'];
    };

    const seed = () => {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((w * h) / 1100);
      dots = Array.from({ length: n }, (_, i) => {
        const hx = seededRandom(i * 3 + 1) * w, hy = seededRandom(i * 3 + 2) * h;
        return {
          hx, hy, x: hx, y: hy, vx: 0, vy: 0,
          r: 0.5 + seededRandom(i * 3 + 3) * 0.9,
          tone: seededRandom(i * 7 + 5) > 0.72 ? 1 : 0,
        };
      });
    };

    const draw = () => {
      const [ink, grey] = colors();
      ctx.clearRect(0, 0, w, h);
      // un tracé par ton et par niveau d'opacité : dix remplissages au lieu d'un par point
      const paths = LEVELS.map(() => [new Path2D(), new Path2D()]);
      for (const d of dots) {
        const p = paths[level(d.x, d.y)][d.tone];
        p.moveTo(d.x + d.r, d.y);
        p.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      }
      LEVELS.forEach((alpha, i) => {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ink; ctx.fill(paths[i][0]);
        ctx.fillStyle = grey; ctx.fill(paths[i][1]);
      });
      ctx.globalAlpha = 1;
    };

    const step = (now) => {
      const t = now * WAVE_SPEED;
      for (const d of dots) {
        // la place du point ondule : phase liée à la position, la houle traverse l'écran
        let tx = d.hx + WAVE_AMP * Math.sin(t + d.hy * 0.011 + d.hx * 0.004);
        let ty = d.hy + WAVE_AMP * Math.cos(t * 0.8 + d.hx * 0.009);
        if (mouse.active) {
          // la cible glisse vers le curseur, d'autant plus que le point est proche
          const px = mouse.x - tx, py = mouse.y - ty;
          const pd = Math.hypot(px, py);
          if (pd < RADIUS && pd > 0) {
            const k = 1 - pd / RADIUS;
            const pull = Math.min(SHIFT * k * k, pd * 0.5);
            tx += (px / pd) * pull; ty += (py / pd) * pull;
          }
        }
        d.vx = (d.vx + (tx - d.x) * SPRING) * DAMP;
        d.vy = (d.vy + (ty - d.y) * SPRING) * DAMP;
        d.x += d.vx; d.y += d.vy;
      }
      draw();
      raf = requestAnimationFrame(step);
    };
    const start = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(step); };

    const onMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; };
    const onLeave = () => { mouse.active = false; };
    // pas d'animation dans un onglet caché
    const onVisibility = () => { if (document.hidden) cancelAnimationFrame(raf); else start(); };
    const onResize = () => { seed(); draw(); };
    seed(); draw();
    // le thème change la couleur de l'encre : on redessine quand <html data-theme> bouge
    const mo = new MutationObserver(() => draw());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('resize', onResize);
    if (!still) {
      window.addEventListener('pointermove', onMove);
      document.documentElement.addEventListener('pointerleave', onLeave);
      document.addEventListener('visibilitychange', onVisibility);
      start();
    }
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  return <canvas ref={ref} aria-hidden="true" style={{
    position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 0,
  }} />;
}
