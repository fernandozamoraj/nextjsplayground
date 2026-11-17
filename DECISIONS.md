# Decisions

Newest first.

## 2026-11-17 — Chongie touch controls: our own pad, driven through simulateInput
- **Context:** on phones EmulatorJS 4.2.3 draws its virtual pad on top of the game, hiding it.
- **Decision:** a separate page (`/chongieMobile`) draws a SNES pad below the game and presses
  buttons with `EJS_emulator.gameManager.simulateInput(0, retropadId, 1|0)` on the same-origin
  iframe; `play.html?touch=1` sets `EJS_defaultOptions["virtual-gamepad"] = "disabled"`.
  Faking keyboard events was the alternative, but EmulatorJS reads `keyCode`, which synthetic
  events can't set reliably, and remapped keys would break it.
- **Only the A/B/SELECT/START/D-pad buttons:** Chongie doesn't use X, Y, L or R.
- **Styles in a CSS module**, not `<style jsx>`: the repo's eslint config flags `jsx`/`global`
  as unknown props, and `next build` fails on lint errors.
