# AeroPutt

AeroPutt is a tiny, Frutiger Aero-inspired 2D browser golf game made for the [10 Kilobyte Game Jam](https://itch.io/jam/10-kilobytes-jam-). Drag back from the ball, release to shoot, and play an endless procedurally generated course of slopes, sand, and water. Every hole is scored against par, and the whole game ships as one HTML file with no external assets.

## Run

Requires Node.js and npm.

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

The production build is written to `dist/index.html`. Everything is bundled into one HTML file, so it can be opened directly in a browser.

To package both upload variants:

```sh
npm run pack
```

That produces:

- `dist/aeroputt-itch.zip` — contains `index.html`, for the itch.io browser upload
- `dist/aeroputt-10kb.zip` — contains `aeroputt.html`, for the jam download
- `dist/aeroputt.html` — the same build renamed for direct upload/download

## Controls

- Drag back from the ball and release to shoot.
- Use the top-right menu button for audio, Reset, and Resume.
- Press `M` to toggle the menu.
- Mouse or touch controls; best on desktop.

## Features

- Endless procedural golf holes with par-based scoring
- Drag-to-aim shots with a trajectory preview
- Slope-aware rolling, bouncing, and friction
- Sand and water hazards; water returns you to your shot origin
- Live scorecard with strokes, shots passed, total score, and net distance
- Procedural Web Audio music and sound effects
- Responsive camera that keeps the ball reachable on small screens
- Frutiger Aero-inspired look: glossy glass panels, sky gradients, soft clouds, and rounded UI
- Single-file build with no runtime dependencies or image/audio assets

## Jam entry

Made for the 10 Kilobyte Game Jam. The current production build is about **9.4 kB gzip** and **9.4 kB zipped** (about **26.3 kB uncompressed**).
