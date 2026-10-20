import { useEffect, useRef, useState } from "react";

/* Un vrai <audio> hors du DOM rendu : l'élément porte la lecture, React ne fait que refléter
   son état (`timeupdate` → position, `ended` → piste suivante). `preload="none"` est
   indispensable, les épisodes pèsent jusqu'à 40 Mo et il ne faut en charger qu'un, à la
   demande. Les durées affichées viennent des data (ffprobe), pas de l'élément : elles sont
   correctes avant même que le fichier commence à se télécharger. */
export default function AudioPlayer({ tracks }) {
  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const audioRef = useRef(null);

  const track = tracks[cur];
  const progress = track.sec ? Math.min(100, (elapsed / track.sec) * 100) : 0;

  useEffect(() => {
    const el = new Audio();
    el.preload = 'none';
    audioRef.current = el;
    const onTime = () => setElapsed(el.currentTime);
    const onEnd = () => setCur((i) => (i + 1 < tracks.length ? i + 1 : i));
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('ended', onEnd);
    return () => {
      el.pause();
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('ended', onEnd);
    };
  }, [tracks]);

  /* Changement de piste (clic dans la liste, enchaînement en fin d'épisode) ou d'album :
     on recharge la source et on relance si on était déjà en lecture. */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.src = track.src;
    setElapsed(0);
    if (playing) el.play().catch(() => setPlaying(false));
  }, [cur, tracks]);

  const play = () => {
    const el = audioRef.current;
    if (!el.src) el.src = track.src;
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };
  const toggle = () => {
    if (!playing) return play();
    audioRef.current.pause();
    setPlaying(false);
  };
  /* Rejouer la piste déjà courante ne déclenche pas l'effet ci-dessus (`cur` ne change pas) :
     on lance la lecture à la main. */
  const select = (i) => {
    if (i === cur) return play();
    setCur(i);
    setPlaying(true);
  };

  const seek = (sec) => {
    const el = audioRef.current;
    const next = Math.max(0, Math.min(track.sec, sec));
    el.currentTime = next;
    setElapsed(next);
  };
  const skip = (deltaSec) => seek(elapsed + deltaSec);

  const mm = Math.floor(elapsed / 60);
  const ss = String(Math.floor(elapsed % 60)).padStart(2, '0');

  /* Commandes et minutages en typo digitale : à ces tailles-là, la serif du corps
     devient illisible. Le texte éditorial (titres d'épisodes) reste en serif.
     Les sauts sont de simples chevrons — les libellés « 30s » / « 1min » alourdissaient
     la ligne ; l'information reste dans l'infobulle. */
  const skipBtn = (glyph, title, delta) => (
    <button onClick={() => skip(delta)} title={title} aria-label={title} style={{
      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)',
      fontFamily: 'var(--font-digital)', fontSize: 17, lineHeight: 1,
      padding: '2px 5px', flexShrink: 0, transition: 'color 0.2s',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--fg)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--fg-muted)'; }}
    >{glyph}</button>
  );
  const time = {
    fontFamily: 'var(--font-digital)', fontSize: 13, color: 'var(--fg-muted)',
    fontVariantNumeric: 'tabular-nums',
  };

  return (
    <div>
      {/* Now playing */}
      <div style={{ marginBottom: 48 }}>
        <p style={{
          fontFamily: 'var(--font-digital)', fontSize: 12, color: 'var(--fg-muted)',
          letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 24,
        }}>
          À l'écoute
        </p>
        {/* Le play ouvre la ligne, seul. Les sauts sont descendus sous la barre. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={toggle} aria-label={playing ? 'Pause' : 'Lecture'}
            style={{
              background: 'none', border: '1px solid var(--fg)', borderRadius: '50%',
              width: 48, height: 48, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--fg)',
              transition: 'background 0.25s, color 0.25s', flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--fg)'; e.currentTarget.style.color = 'var(--bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--fg)'; }}
          >
            {playing ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,3 20,12 6,21"></polygon></svg>
            )}
          </button>
          <div style={{ flex: 1, marginLeft: 12 }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(19px, 1.8vw, 24px)', marginBottom: 14, fontWeight: 'var(--heading-weight, 400)' }}>{track.title}</p>
            <div style={{ position: 'relative', height: 2, background: 'var(--border)', borderRadius: 1, cursor: 'pointer' }}
              onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * track.sec); }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: 'var(--fg)', borderRadius: 1, width: `${progress}%`, transition: 'width 0.08s linear' }}></div>
            </div>
            {/* écoulé, puis les sauts juste après, la durée poussée à droite */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
              <span style={time}>{mm}:{ss}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {skipBtn('«', 'Reculer d\'une minute', -60)}
                {skipBtn('‹', 'Reculer de 30 secondes', -30)}
                {skipBtn('›', 'Avancer de 30 secondes', 30)}
                {skipBtn('»', 'Avancer d\'une minute', 60)}
              </div>
              <span style={{ ...time, marginLeft: 'auto' }}>{track.duration}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Liste des épisodes — sans filets : le petit ▸ suffit à dire que la ligne se joue */}
      <div>
        {tracks.map((t, i) => (
          <TrackRow key={t.id} track={t} index={i} current={i === cur} playing={playing}
            onSelect={() => select(i)} />
        ))}
      </div>
    </div>
  );
}

function TrackPlayIcon({ active }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M4.2 2.5L11 7 4.2 11.5Z" fill="currentColor" opacity={active ? 1 : 0.72} />
    </svg>
  );
}

function TrackRow({ track, index, current, playing, onSelect }) {
  const [hov, setHov] = useState(false);
  const on = current || hov;
  const meta = {
    fontFamily: 'var(--font-digital)', fontSize: 13, color: 'var(--fg-muted)',
    fontVariantNumeric: 'tabular-nums',
  };
  return (
    <div onClick={onSelect} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: 'clamp(14px, 1.8vw, 22px) 0',
        cursor: 'pointer', opacity: on ? 1 : 0.55,
        paddingLeft: hov ? 6 : 0,
        transition: 'opacity 0.25s, padding-left 0.25s',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ ...meta, width: 26, textAlign: 'right' }}>{String(index + 1).padStart(2, '0')}</span>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(17px, 1.6vw, 21px)', fontWeight: 'var(--heading-weight, 400)' }}>{track.title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: current && playing ? 'var(--fg)' : 'var(--fg-muted)',
          opacity: on ? 1 : 0.4, transition: 'opacity 0.25s, color 0.25s',
        }}><TrackPlayIcon active={current && playing} /></span>
        <span style={meta}>{track.duration}</span>
      </div>
    </div>
  );
}
