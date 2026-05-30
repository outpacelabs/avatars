# @outpacelabs/gradient-avatars

Deterministic mesh-gradient avatar generator. Every seed — any string or
number — renders a unique, soft mesh gradient on a `<canvas>`. No stored
images, no network, no dependencies. The same seed always produces the same
gradient, anywhere.

Framework-agnostic core. For React, use
[`@outpacelabs/gradient-avatars-react`](https://www.npmjs.com/package/@outpacelabs/gradient-avatars-react).

```bash
npm i @outpacelabs/gradient-avatars
```

## Quick start

Render into a canvas you control (blur baked in):

```ts
import { renderGradient } from "@outpacelabs/gradient-avatars";

const canvas = document.querySelector("canvas")!;
canvas.width = canvas.height = 96;
renderGradient(canvas, "jane@example.com");
```

Get an image directly:

```ts
import { gradientToDataURL, gradientToBlob } from "@outpacelabs/gradient-avatars";

const url = gradientToDataURL("order-42", { size: 256 });        // PNG data URL
const blob = await gradientToBlob("order-42", { size: 2000, type: "image/jpeg" });
```

## API

| Export | Description |
|--------|-------------|
| `renderGradient(canvas, seed, opts?)` | Draw into an `HTMLCanvasElement`/`OffscreenCanvas` at its current size. |
| `gradientToDataURL(seed, opts?)` | Render and return a data URL (browser). |
| `gradientToBlob(seed, opts?)` | Render and resolve a `Blob` (browser). |
| `drawMeshGradient(ctx, seed, size)` | Low-level: paint the raw mesh into any Canvas2D context (no blur). |
| `generatePalette(seed)` | The deterministic `{ seed, colors, harmony }` palette for a seed. |
| `seedFromString(str)` / `toSeed(seed)` | Hash a string to the internal uint32 seed. |

Options: `renderGradient`/export helpers accept `{ blur }` (pixels, defaults to
~6% of size; `0` disables). Export helpers also accept `{ size, type, quality }`.

## How it works

A seed is hashed (FNV-1a + avalanche) to a 32-bit value that drives a seeded
RNG. That picks a color-harmony rule (analogous, triadic, etc.), generates
HSL hues, and paints 8–12 overlapping radial color blobs plus a highlight.
A soft blur gives the signature look. Pure and deterministic.

## License

[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — free to use with attribution. By [Outpace Studios](https://outpacestudios.com).
