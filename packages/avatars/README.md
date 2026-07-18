<a href="https://avatars.outpacestudios.com">
  <img src="https://avatars.outpacestudios.com/meta.jpg" alt="@outpacelabs/avatars, by Outpace Studios" width="100%" />
</a>

<h1 align="center">@outpacelabs/avatars</h1>

<p align="center">
  Generative gradient avatars for React. Every seed renders a unique mesh gradient (or a crisp ordered dither) with no stored images and no network.
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
fetch**. Prefer pixels? `pattern="dither"` renders the same palette as a crisp
ordered dither. The engine is bundled in, so this is the only thing you install.

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
<GradientAvatar seed="jane@example.com" size={96} pattern="dither" /> {/* ordered dither */}
<GradientAvatar seed={42} size={64} className="ring-2 ring-white/10" />
```

### Patterns

`pattern` switches the render engine. `"mesh"` (the default) is the soft mesh
gradient; `"dither"` is an ordered (Bayer 8×8) dither of the same palette, a
crisp retro look with no blur. Both are deterministic from the seed.

```tsx
<GradientAvatar seed="studio" size={96} />                  {/* mesh (default) */}
<GradientAvatar seed="studio" size={96} pattern="dither" /> {/* dither */}
```

### Your colors

By default the palette is derived from the seed via color-harmony rules. Pass
`colors` to use your **own** palette instead: your brand colors, a product
theme, anything. The seed still drives the layout (and rotates which color
leads), so every seed stays unique while staying on-brand. Hex in, `#` optional;
invalid entries are ignored and an empty list falls back to the generated
palette.

```tsx
<GradientAvatar seed={user.id} colors={["#4f46e5", "#06b6d4", "#ec4899"]} />
```

### Wide-gamut P3

Set `p3` to render in the **Display P3** color space. On P3-capable screens
(most modern phones and laptops) the palette reads noticeably more vivid; on
everything else it maps back to the same sRGB color, so it's safe to leave on.

```tsx
<GradientAvatar seed="studio" size={96} p3 />
```

## Why @outpacelabs/avatars

- **Deterministic.** Same seed, same gradient, every time. A user id or email *is* the avatar; you never store or migrate an image.
- **No images, no network.** Rendered at runtime on a `<canvas>`. No CDN, no requests, no broken `<img>` links, no upload pipeline.
- **Tiny & zero-dependency.** ~2.3 kB gzipped; `react` is the only peer.
- **Actually pretty.** Soft mesh gradients, or a crisp retro dither, not blocky identicons.
- **Any size, any shape.** Circles, rounded squares, hard squares: your call.
- **Exports anywhere.** Built-in helpers turn a seed into a data URL, a `Blob`, or a full-resolution image for downloads and clipboard.
- **Typed.** Ships with TypeScript declarations.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `seed` | `string \| number` | None | Any value; each unique seed is a unique gradient. |
| `size` | `number` | `32` | Rendered size in pixels. |
| `pattern` | `"mesh" \| "dither"` | `"mesh"` | Render engine. `mesh` is the soft gradient; `dither` is an ordered dither of the same palette. |
| `radius` | `number \| string` | `"9999px"` | Corner radius. Number = pixels, string = any CSS length. Defaults to a full circle; pass `0` for a square. |
| `colors` | `string[]` | None | Your own hex palette instead of the seed-derived harmony. The seed still drives the layout. |
| `p3` | `boolean` | `false` | Render in the Display P3 wide-gamut color space (more vivid on capable screens). |
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

// Custom palette + wide-gamut P3 flow through the engine too.
const brand = gradientToDataURL(user.id, {
  size: 512,
  colors: ["#4f46e5", "#06b6d4", "#ec4899"],
  p3: true,
});
```

Every render/palette helper takes an options object with `colors?: string[]`
and `p3?: boolean` (plus `blur`, `pattern`, `size`, … where relevant).

| Helper | Description |
|--------|-------------|
| `drawMeshGradient(ctx, seed, size, options?)` | Paint the raw mesh into a 2D canvas context. |
| `drawDither(ctx, seed, size, options?)` | Paint the ordered dither into a 2D canvas context. |
| `renderGradient(canvas, seed, options?)` | Render a seed into a canvas with the signature soft blur. |
| `gradientToDataURL(seed, options?)` | Render and return a data URL. |
| `gradientToBlob(seed, options?)` | Render and resolve a `Blob` (e.g. for the clipboard). |
| `generatePalette(seed, options?)` | The colors and harmony rule behind a seed (pass `colors` for your own). |
| `seedFromString(input)` / `toSeed(seed)` | The deterministic hashing that turns any value into a numeric seed. |

For P3, `renderGradient`/`gradientTo*`/`<GradientAvatar>` set up the P3 canvas
context for you; if you drive `drawMeshGradient`/`drawDither` on your own canvas,
create it with `getContext("2d", { colorSpace: "display-p3" })`.

Types `GradientPalette`, `Harmony`, `PaletteOptions`, `DrawOptions`,
`RenderOptions`, and `ExportOptions` are exported too.

## Playground

Type any seed and watch the gradient at **[avatars.outpacestudios.com](https://avatars.outpacestudios.com)**, then copy it to your clipboard or download a 2000×2000 image. Full docs at **[/docs](https://avatars.outpacestudios.com/docs)**.

## License

[MIT](./LICENSE), free to use. By [Outpace Studios](https://outpacestudios.com).
