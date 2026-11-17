# Changelog

## Chongie touch page 1.0.0 — 2026-11-17
- New `/chongieMobile` (`pages/chongieMobile.js`, `styles/ChongieMobile.module.css`): the Chongie
  SNES demo with an on-screen pad under the game: D-pad (slide between directions, diagonals),
  A = jump, B = catch/throw, SELECT, START. Several fingers at once; light haptic tick on Android.
  Sideways phone: D-pad left of the game, A/B right of it. No site header on this page.
  Version shown top right ("touch v1.0.0").
- `public/chongie/play.html?touch=1` turns off EmulatorJS's own overlay pad (it covered the
  whole picture on phones). Plain `play.html` is unchanged.
- `/chongie` links to the touch page.
- `_app.js`: a page can set `Page.hideHeader = true` to skip the site header.
