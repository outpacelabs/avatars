# @outpacelabs/gradient-avatars-react

React component for [`@outpacelabs/gradient-avatars`](https://www.npmjs.com/package/@outpacelabs/gradient-avatars).
Renders a deterministic mesh-gradient avatar for any seed on a `<canvas>` —
the same seed always yields the same gradient.

```bash
npm i @outpacelabs/gradient-avatars-react
```

## Usage

```tsx
import { GradientAvatar } from "@outpacelabs/gradient-avatars-react";

<GradientAvatar seed={user.id} size={40} />
<GradientAvatar seed="jane@example.com" size={96} className="ring-2 ring-white/10" />
<GradientAvatar seed="square" size={64} radius={12} />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `seed` | `string \| number` | — | Any value; each unique seed is a unique gradient. |
| `size` | `number` | `32` | Rendered size in pixels. |
| `radius` | `number \| string` | `"9999px"` | Corner radius. Number = pixels, string = any CSS length. Defaults to a full circle; pass `0` for a square. |
| `className` | `string` | — | Extra classes on the wrapper `<span>`. |
| `style` | `CSSProperties` | — | Extra inline styles merged onto the wrapper. |

The engine helpers (`renderGradient`, `gradientToDataURL`, `gradientToBlob`,
`generatePalette`, …) are re-exported for convenience — e.g. to offer a
download/copy of the full-resolution image.

## License

[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — free to use with attribution. By [Outpace Studios](https://outpacestudios.com).
