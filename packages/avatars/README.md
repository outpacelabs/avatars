<a href="https://avatars.outpacestudios.com">
  <img src="https://avatars.outpacestudios.com/meta.jpg" alt="@outpacelabs/avatars: a row of generative gradient avatars" width="100%" />
</a>

<h1 align="center">@outpacelabs/avatars</h1>

<p align="center">
  Generative gradient avatars for React. A unique gradient for every seed, with no stored images and no network.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@outpacelabs/avatars"><img src="https://img.shields.io/npm/v/@outpacelabs/avatars?color=000&labelColor=000" alt="npm version" /></a>
  <a href="https://bundlephobia.com/package/@outpacelabs/avatars"><img src="https://img.shields.io/badge/gzipped-2.3_kB-000?labelColor=000" alt="gzipped size" /></a>
  <img src="https://img.shields.io/badge/dependencies-0-000?labelColor=000" alt="zero dependencies" />
  <img src="https://img.shields.io/badge/types-included-000?labelColor=000" alt="types included" />
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-000?labelColor=000" alt="license" /></a>
</p>

<p align="center">
  <a href="https://avatars.outpacestudios.com"><b>Live playground →</b></a> &nbsp;·&nbsp;
  <a href="https://avatars.outpacestudios.com/docs"><b>Docs →</b></a>
</p>

---

Give it any string or number (a user id, an email, a username) and it paints a
unique, good-looking gradient on a `<canvas>`. The same seed always yields the
same gradient, so you get stable avatars with **nothing to store and nothing to
fetch**. The gradient engine is bundled in, so this is the only thing you install.

## Install

```bash
npm i @outpacelabs/avatars   # or: pnpm add / yarn add / bun add
```

`react >= 18` is the only peer dependency. Works with React 18 and 19.

## Usage

```tsx
import { GradientAvatar } from "@outpacelabs/avatars";

function UserAvatar({ user }) {
  return <GradientAvatar seed={user.id} size={40} />;
}
```

That's the whole API surface for most apps. A few more:

```tsx
<GradientAvatar seed="jane@example.com" size={96} />            {/* circle (default) */}
<GradientAvatar seed="jane@example.com" size={96} radius={16} /> {/* rounded square */}
<GradientAvatar seed="jane@example.com" size={96} radius={0} />  {/* square */}
<GradientAvatar seed={42} size={64} className="ring-2 ring-white/10" />
```

## Why @outpacelabs/avatars

- **Deterministic.** Same seed, same gradient, every time. A user id or email *is* the avatar; you never store or migrate an image.
- **No images, no network.** Rendered at runtime on a `<canvas>`. No CDN, no requests, no broken `<img>` links, no upload pipeline.
- **Tiny & zero-dependency.** ~2.3 kB gzipped; `react` is the only peer.
- **Actually pretty.** Soft mesh gradients, not blocky identicons.
- **Any size, any shape.** Circles, rounded squares, hard squares: your call.
- **Exports anywhere.** Built-in helpers turn a seed into a data URL, a `Blob`, or a full-resolution image for downloads and clipboard.
- **Typed.** Ships with TypeScript declarations.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `seed` | `string \| number` | None | Any value; each unique seed is a unique gradient. |
| `size` | `number` | `32` | Rendered size in pixels. |
| `radius` | `number \| string` | `"9999px"` | Corner radius. Number = pixels, string = any CSS length. Defaults to a full circle; pass `0` for a square. |
| `className` | `string` | None | Extra classes on the wrapper `<span>`. |
| `style` | `CSSProperties` | None | Extra inline styles merged onto the wrapper. |

## Beyond React: the engine

The framework-agnostic engine is re-exported, so you can generate gradients
without rendering a component, handy for an `<img src>`, a download button, or
a server-rendered preview.

```ts
import { gradientToDataURL, generatePalette } from "@outpacelabs/avatars";

// A 512×512 PNG data URL. Drop straight into an <img>.
const src = gradientToDataURL("jane@example.com", { size: 512 });

// Just the colors behind a seed.
const { colors, harmony } = generatePalette("jane@example.com");
```

| Helper | Description |
|--------|-------------|
| `drawMeshGradient(ctx, seed, size)` | Paint the raw mesh into a 2D canvas context. |
| `renderGradient(canvas, seed, options?)` | Render a seed into a canvas with the signature soft blur. |
| `gradientToDataURL(seed, options?)` | Render and return a data URL. |
| `gradientToBlob(seed, options?)` | Render and resolve a `Blob` (e.g. for the clipboard). |
| `generatePalette(seed)` | The colors and harmony rule behind a seed. |
| `seedFromString(input)` / `toSeed(seed)` | The deterministic hashing that turns any value into a numeric seed. |

Types `GradientPalette`, `Harmony`, `RenderOptions`, and `ExportOptions` are exported too.

## Playground

Type any seed and watch the gradient at **[avatars.outpacestudios.com](https://avatars.outpacestudios.com)**, then copy it to your clipboard or download a 2000×2000 image. Full docs at **[/docs](https://avatars.outpacestudios.com/docs)**.

## License

[MIT](./LICENSE), free to use. By [Outpace Studios](https://outpacestudios.com).
