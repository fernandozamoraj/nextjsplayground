# 3D Shooter Game

A browser-based first-person shooter built entirely on HTML Canvas 2D (no WebGL). Accessible at `/shooter`.

## Gameplay

- Shoot 8 colored wine bottle targets hidden throughout a warehouse maze
- Timer tracks your completion time — try to beat your best

## Movement & Controls

| Key | Action |
|---|---|
| W / A / S / D | Move forward / left / back / right |
| Hold Shift | Sprint at 2.5× speed |
| Mouse | Look around (click canvas to lock, Esc to exit) |
| Click | Shoot |

- Gravity — walk off a wall and you fall to the ground

## Ladders

- Every wall stack has a climbable ladder on its front face
- Walk up to a ladder to auto-grab; **W** climbs up, **S** climbs down
- Player is snapped to the ladder center while climbing; **A / D** to step off
- On-screen HUD hint appears when attached to a ladder

## Combat & Visual Effects

- Tight 22px crosshair hit detection on bottle targets
- Muzzle flash on every shot (bloom + core + spike rays, fades over ~66 ms)
- Bottle hit: shard explosion + glass break sound
- Box hit: particle impact fountain + box hit sound
- AR-15 style gun barrel overlay with gas block, rail, handguard, and M-LOK slots

## Target Location Hints

Semi-transparent red glow on the screen edge pointing toward remaining alive targets:

- **Top** — target is ahead of you
- **Right** — target is to your right
- **Left** — target is to your left
- **Bottom** — target is behind you

## Audio

| File | Trigger |
|---|---|
| `shot.wav` | Every trigger pull |
| `glasshit.mp3` | Bottle destruction |
| `boxhit.wav` | Wall/box impact |
| `step.wav` | Footsteps (faster cadence + playback rate when sprinting; silent on ladder) |
| `thump.wav` | Landing after falling from height |

Sound files live in `public/sounds/`.

## Level

- 30 walls of 1×1×1 unit cubes arranged in a warehouse maze across 4 zones
- Entrance zone, two interior zones, a back zone, and side corridors
- Walls range from 2 to 5 cubes tall

## Code Structure

```
utils/services/3DWorld/
    renderer.js              → Renderer, Mesh, Light, Camera
    shapeFactory.js          → ShapeFactory (box/cylinder/pyramid/ground/sphere/bottle)
    world.js                 → World (scene + render loop + hooks)
    firstPersonController.js → WASD + mouse look + Shift sprint + gravity + ladder climbing
    explosion.js             → Explosion (3D mesh shards)
    impactEffect.js          → ImpactEffect (2D particle fountain)
    shooterGame.js           → ShooterGame class (all game logic)

pages/
    shooter.js               → React page that mounts ShooterGame on a canvas

public/sounds/
    shot.wav, glasshit.mp3, boxhit.wav, step.wav, thump.wav
```
