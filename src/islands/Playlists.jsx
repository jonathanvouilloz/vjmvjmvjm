import { useEffect, useState } from "react";

const PLATFORM_LABELS = {
  spotify: "Spotify", "apple-music": "Apple Music", "apple-podcasts": "Apple Podcasts",
  deezer: "Deezer", youtube: "YouTube", soundcloud: "SoundCloud", bandcamp: "Bandcamp",
  "amazon-music": "Amazon Music",
};
const LANG_LABELS = { fr: "FR", en: "EN", es: "ES", de: "DE", it: "IT", pt: "PT" };
const platformLabel = (p) => p.libelle || PLATFORM_LABELS[p.plateforme] || p.plateforme || "Écouter";

const tabStyle = (active) => ({
  background: "none", border: "none", cursor: "pointer", padding: "6px 2px",
  fontFamily: "var(--font-digital)", fontSize: 12, letterSpacing: "0.1em",
  color: active ? "var(--fg)" : "var(--fg-muted)",
  textDecoration: active ? "underline" : "none", textUnderlineOffset: "0.35em",
});

// Langue retenue par la bio (/en/bio la pose) ; stockage indisponible → première langue de l'album.
function bioLang() {
  try { return window.localStorage.getItem("vjm-bio-lang") === "en" ? "en" : "fr"; } catch { return "fr"; }
}

/* Playlists d'un album : une par plateforme et par langue, un seul lecteur à la fois. Les
   plateformes sans lecteur intégré (`embed` nul : Bandcamp, Amazon…) restent des liens.
   `playlists` arrive du serveur avec `embed` et `hauteur` déjà calculés. */
export default function Playlists({ playlists, title }) {
  const langs = [...new Set(playlists.map((p) => p.langue || "fr"))];
  const [lang, setLang] = useState(langs[0]);
  const [tab, setTab] = useState(0);
  // Après l'hydratation : lire le stockage au premier rendu ferait diverger le HTML du serveur.
  useEffect(() => { const l = bioLang(); if (langs.includes(l)) setLang(l); }, []);

  const inLang = playlists.filter((p) => (p.langue || "fr") === lang);
  const players = inLang.filter((p) => p.embed);
  const links = inLang.filter((p) => !p.embed);
  const current = players[Math.min(tab, players.length - 1)];
  const changeLang = (l) => { setLang(l); setTab(0); };

  return (
    <div style={{ marginTop: "var(--block-gap)" }}>
      {langs.length > 1 && (
        <div role="group" aria-label="Langue de la playlist" style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 22 }}>
          {langs.map((code, i) => (
            <span key={code} style={{ display: "contents" }}>
              {i > 0 && <span aria-hidden="true" style={{ color: "var(--fg-subtle)" }}>·</span>}
              <button onClick={() => changeLang(code)} aria-pressed={lang === code} lang={code} style={{
                background: "none", border: "none", cursor: "pointer", padding: "6px 4px",
                fontFamily: "var(--font-digital)", fontSize: 12, letterSpacing: "0.14em",
                color: lang === code ? "var(--fg)" : "var(--fg-muted)",
                textDecoration: lang === code ? "underline" : "none", textUnderlineOffset: "0.35em",
              }}>{LANG_LABELS[code] || code.toUpperCase()}</button>
            </span>
          ))}
        </div>
      )}
      {players.length > 1 && (
        <div role="tablist" aria-label="Plateforme" style={{ display: "flex", flexWrap: "wrap", gap: "4px 18px", marginBottom: 14 }}>
          {players.map((p, i) => (
            <button key={p.plateforme + i} role="tab" aria-selected={p === current}
              onClick={() => setTab(i)} style={tabStyle(p === current)}>{platformLabel(p)}</button>
          ))}
        </div>
      )}
      {current && (
        <iframe key={current.embed} src={current.embed} title={`${title} — ${platformLabel(current)}`} loading="lazy"
          style={{
            width: "100%", border: 0, borderRadius: 12, display: "block",
            ...(current.hauteur ? { height: current.hauteur } : { aspectRatio: "16 / 9" }),
          }}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" />
      )}
      {links.length > 0 && (
        <p style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", marginTop: 16, fontFamily: "var(--font-body)", fontSize: 15 }}>
          {links.map((p, i) => (
            <a key={p.url + i} href={p.url} target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--fg-muted)", textUnderlineOffset: "0.2em" }}>{platformLabel(p)} ↗</a>
          ))}
        </p>
      )}
    </div>
  );
}
