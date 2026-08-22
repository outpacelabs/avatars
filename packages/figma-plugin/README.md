# Avatars for Figma

The [`@outpacelabs/avatars`](../avatars) engine, as a Figma plugin. Type a
seed, get the same avatar the web renders, as **native Figma layers** you can
open, recolor, and pull apart.

```
Seeds        jane@example.com
Pattern      Mesh · Dither
Shape        Circle · Squircle · Rounded · Square
Size         16 – 512 px
Output       Layers · Image
```

## What it does

**Insert.** One seed per line. One avatar goes in on its own, several go in as
a row with auto layout.

**Fill selection.** Select any shapes and every one of them gets an avatar. By
default each layer is seeded from its own name, so a page of placeholders
named after real people fills itself in one click.

**Brand colors.** Give it your palette and the seed still decides the layout,
so every avatar stays unique and stays on brand.

## Layers, not a picture

The engine paints through a four-method interface, not a canvas. The plugin
hands it a recorder in place of a canvas and keeps the draw calls, then turns
them into nodes. So the vector output and the canvas output come from one
function, on one seed, in one order. There is no second copy of the palette
or the layout math.

| The engine draws | Figma gets |
|---|---|
| a flat rectangle | a rectangle |
| many flat cells of one color | one vector layer, one sub-path per cell |
| a radial spot | an ellipse with a radial gradient |
| the mesh, blurred | a group with a layer blur |

A dither at full detail is 64 x 64 cells. As one layer per cell that is 4096
layers. Neighbors merge, then every cell of one color goes into a single
vector layer, so a whole dither arrives as **three layers**, still crisp,
still editable, easy to recolor. A mesh is about a dozen.

The ellipse is exact, not an approximation: every spot the engine paints
reaches alpha 0 on its outer radius, so a circle of that radius holds the
complete shape. A test guards that, because if it ever stops being true the
vector output would drift away from the canvas output in silence.

**Image** is the other output. It is a PNG from the same `renderGradient` the
web site calls, so it matches pixel for pixel. Fill selection always uses it,
because an avatar has to go into a shape of any geometry.

## Squircle

Figma has its own corner smoothing, so the squircle is `cornerSmoothing`, not
a traced path. The panel preview uses the site's `squirclePath` to draw the
same curve, so what you see is what lands.

## No network, no P3

The plugin never fetches or uploads. Every avatar is generated from its seed
on the spot, which is the whole point of the library.

Display P3 is missing on purpose. The engine can paint it, but the Figma
plugin API has no wide-gamut paint, so the option is absent rather than
quietly dropped back to sRGB.

## Develop

```bash
pnpm install                 # from the repo root
pnpm --filter @outpacelabs/avatars-figma build     # → dist/code.js, dist/ui.html
pnpm --filter @outpacelabs/avatars-figma dev       # rebuild on save
pnpm --filter @outpacelabs/avatars-figma test      # the engine-to-Figma bridge
```

Then in the Figma desktop app: **Plugins → Development → Import plugin from
manifest**, and choose `packages/figma-plugin/manifest.json`. Figma writes a
real plugin id into the manifest the first time you publish; the one in the
file is a placeholder.

| File | What |
|---|---|
| `src/plan.ts` | The recorder. Engine draw calls in, Figma-ready operations out. Pure, and tested in Node. |
| `src/nodes.ts` | Operations in, Figma nodes out. |
| `src/code.ts` | Main thread. Owns the document and nothing else. |
| `src/ui/` | The panel. Owns the drawing, because only the iframe has a canvas. |
| `scripts/build.mjs` | esbuild, into the two files Figma loads. |

Two Figma rules shape `nodes.ts`: `appendChild` keeps a node where it is on
the canvas, so a child is positioned after it is appended; and moving a frame
moves its children, so the outer frame is positioned last.

## License

[MIT](../../LICENSE), by [Outpace Studios](https://outpacestudios.com).
